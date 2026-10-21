// src/app/api/copilot/stress-test/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stressProbabilityOfDefault } from "@/lib/engines/credit-engine";
import { chatWithRiskCopilot } from "@/lib/ai/gemini";
import { recordAuditLog } from "@/lib/audit";
import { RoleType } from "@/types";

export async function POST(request: Request) {
  try {
    const {
      deltaGdpPct = -4.5,
      tiieRatePct = 13.5,
      deltaFxPct = 20.0,
      climateShockScore = 0.75,
      speiDowntimeHours = 4,
      userRole = "UAIR_ADMIN",
    } = await request.json();

    // 1. Obtener datos actuales del portafolio crediticio
    const loans = await prisma.creditExposureNifC16.findMany();
    const currentTotalPCE = loans.reduce((sum, l) => sum + l.expectedCreditLossPCE, 0);
    const currentTotalEI = loans.reduce((sum, l) => sum + l.grossExposureEI, 0);

    // 2. Simular impacto en Probabilidad de Incumplimiento y Nuevas Reservas PCE
    let stressedTotalPCE = 0;
    const loanStressImpacts = loans.map((loan) => {
      const isAgro = loan.portfolioSegment === "AGROPECUARIO";
      const shock = isAgro ? climateShockScore : climateShockScore * 0.2;

      const stressedPD = stressProbabilityOfDefault({
        basePD: loan.pd12Months,
        deltaGdpPct: Number(deltaGdpPct),
        tiieRatePct: Number(tiieRatePct),
        deltaFxPct: Number(deltaFxPct),
        climateShockScore: shock,
      });

      // Nuevo cálculo de PCE estresada
      const discount = Math.pow(1 + loan.effectiveRate, -1);
      const newPCE = stressedPD * loan.lgdSeveritySP * loan.adjustedExposureE * discount;
      stressedTotalPCE += newPCE;

      return {
        loanId: loan.loanId,
        segment: loan.portfolioSegment,
        basePD: loan.pd12Months,
        stressedPD,
        basePCE: loan.expectedCreditLossPCE,
        newPCE: Number(newPCE.toFixed(2)),
      };
    });

    // 3. Simular impacto en Solvencia e ICAP (Requerimiento de capital CUB)
    const baseICAP = 13.85;
    const additionalReserveMXN = Math.max(0, stressedTotalPCE - currentTotalPCE);
    // Cada $10M MXN de reserva adicional comprime el ICAP en aprox 0.18 puntos porcentuales
    const icapDrop = (additionalReserveMXN / 10000000) * 0.18 + (speiDowntimeHours > 2 ? 0.25 : 0);
    const stressedICAP = Math.max(8.0, Number((baseICAP - icapDrop).toFixed(2)));

    let icapZone: "GREEN" | "YELLOW" | "ORANGE" | "RED" = "GREEN";
    if (stressedICAP < 10.5) icapZone = "RED"; // Debajo del 10.5% regulatorio
    else if (stressedICAP < 11.5) icapZone = "ORANGE";
    else if (stressedICAP < 13.0) icapZone = "YELLOW";

    // 4. Solicitar narrativa ejecutiva a Gemini Risk Copilot
    const promptAI = `Genera un dictamen ejecutivo formal para el Comité de Administración Integral de Riesgos (CAIR) de Banco B×+ sobre los resultados de esta simulación de estrés macroeconómico y climático (Anexos 12-B y 12-D de la CUB):
- Choque PIB: ${deltaGdpPct}%
- Tasa TIIE: ${tiieRatePct}%
- Depreciación MXN/USD: ${deltaFxPct}%
- Choque Climático en Cartera Agro: ${(climateShockScore * 100).toFixed(0)}%
- Caída de Canal SPEI: ${speiDowntimeHours} horas

Resultados Cuantitativos:
- Reserva PCE Actual: $${currentTotalPCE.toLocaleString("es-MX")} MXN
- Reserva PCE Estresada: $${stressedTotalPCE.toLocaleString("es-MX")} MXN (Incremento de $${additionalReserveMXN.toLocaleString("es-MX")} MXN)
- ICAP Actual: ${baseICAP}% -> ICAP Estresado: ${stressedICAP}% (Semáforo: ${icapZone})

Provee un diagnóstico en 3 párrafos concisos: (1) Vulnerabilidades detectadas, (2) Impacto en solvencia y límites RAF, y (3) Medidas inmediatas de mitigación recomendadas.`;

    const aiNarrative = await chatWithRiskCopilot(promptAI);

    // 5. Registrar en bitácora de auditoría
    const user = await prisma.user.findFirst({ where: { role: userRole as RoleType } }) || await prisma.user.findFirst();
    if (user) {
      await recordAuditLog({
        userId: user.id,
        userRole: userRole as RoleType,
        actionType: "STRESS_TESTING_SIMULATION",
        entityName: "StressEngine_Anexo12B",
        entityId: "SCENARIO_SIM_01",
        previousState: { baseICAP, currentTotalPCE },
        newState: { stressedICAP, stressedTotalPCE, icapZone },
      });
    }

    return NextResponse.json({
      success: true,
      simulationParams: { deltaGdpPct, tiieRatePct, deltaFxPct, climateShockScore, speiDowntimeHours },
      metrics: {
        currentTotalPCE: Number(currentTotalPCE.toFixed(2)),
        stressedTotalPCE: Number(stressedTotalPCE.toFixed(2)),
        additionalReserveMXN: Number(additionalReserveMXN.toFixed(2)),
        pceIncreasePct: currentTotalPCE > 0 ? Number(((additionalReserveMXN / currentTotalPCE) * 100).toFixed(2)) : 0,
        baseICAP,
        stressedICAP,
        icapZone,
        loansEvaluated: loanStressImpacts.length,
      },
      aiNarrative,
    });
  } catch (error) {
    console.error("Error in stress-test API:", error);
    return NextResponse.json({ success: false, error: "Error al ejecutar simulación de estrés" }, { status: 500 });
  }
}
