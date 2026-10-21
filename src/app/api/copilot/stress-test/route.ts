// src/app/api/copilot/stress-test/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stressProbabilityOfDefault } from "@/lib/engines/credit-engine";
import { mapScoreTo5x5Zone } from "@/lib/engines/operational-risk-engine";
import { chatWithRiskCopilot } from "@/lib/ai/gemini";
import { recordAuditLog } from "@/lib/audit";
import { RoleType } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      processId = "ALL",
      deltaGdpPct = -4.5,
      tiieRatePct = 13.5,
      deltaFxPct = 20.0,
      climateShockScore = 0.75,
      speiDowntimeHours = 4,
      controlDegradationPct = 0,
      userRole = "UAIR_ADMIN",
    } = body;

    const numGdp = Number(deltaGdpPct);
    const numTiie = Number(tiieRatePct);
    const numFx = Number(deltaFxPct);
    const numClimate = Number(climateShockScore);
    const numSpei = Number(speiDowntimeHours);
    const numCtrlDeg = Math.min(100, Math.max(0, Number(controlDegradationPct || 0)));
    const controlDegradationFactor = numCtrlDeg / 100.0;

    // 1. Consultar Procesos y Riesgos de la Matriz Viva según alcance
    const whereClause: any = {};
    if (processId && processId !== "ALL") {
      whereClause.processId = processId;
    }

    const [risks, allProcesses, loans] = await Promise.all([
      prisma.riskEvent.findMany({
        where: whereClause,
        include: {
          process: {
            include: {
              macroProcess: true,
            },
          },
          processNode: true,
          taxonomy: true,
          actionPlans: {
            select: { id: true, code: true, title: true, status: true },
          },
        },
        orderBy: [
          { process: { code: "asc" } },
          { code: "asc" },
        ],
      }),
      prisma.process.findMany({
        include: {
          macroProcess: true,
          _count: { select: { riskEvents: true, flowNodes: true } },
        },
        orderBy: { code: "asc" },
      }),
      prisma.creditExposureNifC16.findMany(),
    ]);

    // 2. Modelo de Simulación Cuantitativa Riesgo por Riesgo y por Nodo del Diagrama
    const gdpFactor = Math.max(0, -numGdp) / 10.0; // [0.0 - 1.0]
    const tiieFactor = Math.max(0, numTiie - 11.0) / 9.0; // [0.0 - 1.0]
    const fxFactor = Math.max(0, numFx) / 40.0; // [0.0 - 1.0]
    const climateFactor = Math.min(1.0, Math.max(0, numClimate)); // [0.0 - 1.0]
    const speiFactor = Math.min(1.0, Math.max(0, numSpei / 12.0)); // [0.0 - 1.0]

    let totalBasePEA = 0;
    let totalStressedPEA = 0;
    let totalBasePMA = 0;
    let totalStressedPMA = 0;
    let totalMigratedToCritical = 0;
    let totalBaseRed = 0;
    let totalStressedRed = 0;

    const stressedRisks = risks.map((r) => {
      const taxType = (r.taxonomy?.riskType || "OPERATIONAL").toUpperCase();
      const procCode = r.process?.code || "";
      const isAgro = procCode === "PR-AGRO-01" || taxType === "CREDIT" || taxType === "ESG_CLIMATE" || Boolean(r.esgSectorSHCP);
      const isTreasury = procCode === "PR-TES-01" || taxType === "MARKET" || taxType === "LIQUIDITY";
      const isTechOrSpei = procCode === "PR-TI-01" || taxType === "TECHNOLOGICAL" || taxType === "CYBERSECURITY" || Boolean(r.speiImpact);

      let envProbShock = 0;
      let envImpShock = 0;

      if (isAgro) {
        envProbShock = climateFactor * 1.6 + gdpFactor * 0.8 + tiieFactor * 0.4;
        envImpShock = climateFactor * 1.3 + gdpFactor * 0.7 + tiieFactor * 0.3;
      } else if (isTreasury) {
        envProbShock = tiieFactor * 1.5 + fxFactor * 1.2 + gdpFactor * 0.3;
        envImpShock = tiieFactor * 1.3 + fxFactor * 1.1;
      } else if (isTechOrSpei) {
        envProbShock = speiFactor * 1.9 + (numSpei > 0 ? 0.35 : 0);
        envImpShock = speiFactor * 1.6 + (numSpei > 4 ? 0.45 : 0);
      } else {
        envProbShock = gdpFactor * 0.45 + (numSpei > 0 ? 0.2 : 0);
        envImpShock = gdpFactor * 0.35 + (numSpei > 0 ? 0.2 : 0);
      }

      // Pérdida de efectividad de controles hacia No Formalizados (NF)
      const inherentProb = r.inherentProbability;
      const inherentImp = r.inherentImpact;
      const baseResidualProb = r.residualProbability;
      const baseResidualImp = r.residualImpact;

      const probMitigation = Math.max(0, inherentProb - baseResidualProb);
      const impMitigation = Math.max(0, inherentImp - baseResidualImp);

      const controlLossProb = probMitigation * controlDegradationFactor + (controlDegradationFactor > 0.5 ? (controlDegradationFactor - 0.5) * 0.7 : 0);
      const controlLossImp = impMitigation * controlDegradationFactor + (controlDegradationFactor > 0.5 ? (controlDegradationFactor - 0.5) * 0.5 : 0);

      // Probabilidad e Impacto Residual Estresado (en escala 1.0 a 5.0)
      const stressedResidualProb = Math.min(5.0, Math.max(1.0, Number((baseResidualProb + envProbShock * 0.85 + controlLossProb).toFixed(2))));
      const stressedResidualImp = Math.min(5.0, Math.max(1.0, Number((baseResidualImp + envImpShock * 0.75 + controlLossImp).toFixed(2))));
      const stressedResidualScore = Number((stressedResidualProb * stressedResidualImp).toFixed(2));
      const stressedResidualZone = mapScoreTo5x5Zone(stressedResidualScore);

      const baseResidualScore = Number((baseResidualProb * baseResidualImp).toFixed(2));
      const baseResidualZone = (r.residualZone as "GREEN" | "YELLOW" | "ORANGE" | "RED") || mapScoreTo5x5Zone(baseResidualScore);

      // Cuantificación de Pérdidas PEA y PMA Estresadas
      const scoreRatio = stressedResidualScore / Math.max(1.0, baseResidualScore);
      const basePEA = r.expectedAnnualLossPEA || 0;
      const basePMA = r.maxAnnualLossPMA || 0;

      const stressedPEA = Math.round(basePEA * Math.max(1.0, scoreRatio * (1 + controlDegradationFactor * 0.35)));
      const deltaPEA = Math.max(0, stressedPEA - basePEA);

      const impRatio = stressedResidualImp / Math.max(1.0, baseResidualImp);
      const stressedPMA = Math.round(basePMA * Math.max(1.0, (1 + (impRatio - 1) * 0.8) * (1 + controlDegradationFactor * 0.25)));
      const deltaPMA = Math.max(0, stressedPMA - basePMA);

      totalBasePEA += basePEA;
      totalStressedPEA += stressedPEA;
      totalBasePMA += basePMA;
      totalStressedPMA += stressedPMA;

      if (baseResidualZone === "RED") totalBaseRed++;
      if (stressedResidualZone === "RED") totalStressedRed++;

      const isZoneWorsened =
        (baseResidualZone === "GREEN" && stressedResidualZone !== "GREEN") ||
        (baseResidualZone === "YELLOW" && (stressedResidualZone === "ORANGE" || stressedResidualZone === "RED")) ||
        (baseResidualZone === "ORANGE" && stressedResidualZone === "RED");

      const migratedToCritical =
        (baseResidualZone === "GREEN" || baseResidualZone === "YELLOW") &&
        (stressedResidualZone === "ORANGE" || stressedResidualZone === "RED");

      if (migratedToCritical || (baseResidualZone === "ORANGE" && stressedResidualZone === "RED")) {
        totalMigratedToCritical++;
      }

      return {
        id: r.id,
        code: r.code,
        title: r.title,
        eventDescription: r.eventDescription,
        processId: r.processId,
        processCode: r.process?.code || "N/A",
        processName: r.process?.name || "Proceso General",
        processNodeId: r.processNodeId,
        processNodeLabel: r.processNode?.label || "Paso General de Proceso",
        processNodeType: r.processNode?.nodeType || "TASK_STEP",
        responsibleRole: r.processNode?.responsibleRole || "Dueño de Proceso",
        riskType: taxType,
        inherentProb,
        inherentImp,
        inherentScore: r.inherentScore,
        inherentZone: r.inherentZone,
        baseResidualProb,
        baseResidualImp,
        baseResidualScore,
        baseResidualZone,
        stressedResidualProb,
        stressedResidualImp,
        stressedResidualScore,
        stressedResidualZone,
        basePEA,
        stressedPEA,
        deltaPEA,
        basePMA,
        stressedPMA,
        deltaPMA,
        isZoneWorsened,
        migratedToCritical,
        actionPlansCount: r.actionPlans?.length || 0,
      };
    });

    // 3. Resumen Agrupado por Proceso (Process Breakdown)
    const processMap: Record<string, any> = {};

    // Inicializar procesos disponibles
    const relevantProcesses = processId === "ALL" ? allProcesses : allProcesses.filter((p) => p.id === processId);
    relevantProcesses.forEach((p) => {
      processMap[p.id] = {
        processId: p.id,
        code: p.code,
        name: p.name,
        macroProcessName: p.macroProcess?.name || "Macroproceso",
        totalRisks: 0,
        baseZoneCount: { GREEN: 0, YELLOW: 0, ORANGE: 0, RED: 0 },
        stressedZoneCount: { GREEN: 0, YELLOW: 0, ORANGE: 0, RED: 0 },
        basePEA: 0,
        stressedPEA: 0,
        deltaPEA: 0,
        basePMA: 0,
        stressedPMA: 0,
        deltaPMA: 0,
        migratedToCritical: 0,
      };
    });

    stressedRisks.forEach((sr) => {
      const pm = processMap[sr.processId];
      if (pm) {
        pm.totalRisks++;
        pm.baseZoneCount[sr.baseResidualZone] = (pm.baseZoneCount[sr.baseResidualZone] || 0) + 1;
        pm.stressedZoneCount[sr.stressedResidualZone] = (pm.stressedZoneCount[sr.stressedResidualZone] || 0) + 1;
        pm.basePEA += sr.basePEA;
        pm.stressedPEA += sr.stressedPEA;
        pm.deltaPEA += sr.deltaPEA;
        pm.basePMA += sr.basePMA;
        pm.stressedPMA += sr.stressedPMA;
        pm.deltaPMA += sr.deltaPMA;
        if (sr.migratedToCritical) pm.migratedToCritical++;
      }
    });

    const processBreakdown = Object.values(processMap);

    // 4. Simulación de Portafolio Crediticio NIF C-16 e Impacto en Solvencia ICAP
    const currentTotalPCE = loans.reduce((sum, l) => sum + l.expectedCreditLossPCE, 0);
    let stressedTotalPCE = 0;

    loans.forEach((loan) => {
      const isAgro = loan.portfolioSegment === "AGROPECUARIO";
      const shock = isAgro ? numClimate : numClimate * 0.2;

      const stressedPD = stressProbabilityOfDefault({
        basePD: loan.pd12Months,
        deltaGdpPct: numGdp,
        tiieRatePct: numTiie,
        deltaFxPct: numFx,
        climateShockScore: shock,
      });

      const discount = Math.pow(1 + loan.effectiveRate, -1);
      const newPCE = stressedPD * loan.lgdSeveritySP * loan.adjustedExposureE * discount;
      stressedTotalPCE += newPCE;
    });

    const additionalReserveMXN = Math.max(0, stressedTotalPCE - currentTotalPCE);
    const totalDeltaPEA = totalStressedPEA - totalBasePEA;

    // Cálculo patrimonial del ICAP Estresado
    const baseICAP = 13.85;
    const creditDrop = (additionalReserveMXN / 10000000) * 0.18;
    const opDrop =
      (totalDeltaPEA / 15000000) * 0.12 +
      (numSpei > 2 ? 0.25 : 0) +
      (controlDegradationFactor > 0.5 ? 0.35 : 0);

    const stressedICAP = Math.max(7.5, Number((baseICAP - creditDrop - opDrop).toFixed(2)));

    let icapZone: "GREEN" | "YELLOW" | "ORANGE" | "RED" = "GREEN";
    if (stressedICAP < 10.5) icapZone = "RED"; // Debajo del 10.5% regulatorio CUB
    else if (stressedICAP < 11.5) icapZone = "ORANGE"; // Tolerancia RAF
    else if (stressedICAP < 13.0) icapZone = "YELLOW"; // Apetito preventivo

    // 5. Dictamen Ejecutivo de Gemini AI para el CAIR con Fallback Determinista
    const selectedProcessName =
      processId === "ALL"
        ? "Portafolio Consolidado Banco B×+ (Todos los Procesos)"
        : allProcesses.find((p) => p.id === processId)?.name || processId;

    const criticalRisksList = stressedRisks
      .filter((r) => r.stressedResidualZone === "RED" || r.stressedResidualZone === "ORANGE")
      .slice(0, 5)
      .map((r) => `• ${r.code} (${r.title}) en nodo "${r.processNodeLabel}": P×I ${r.baseResidualProb}×${r.baseResidualImp} -> ${r.stressedResidualProb}×${r.stressedResidualImp} (${r.stressedResidualZone}), PEA +$${(r.deltaPEA).toLocaleString("es-MX")} MXN`)
      .join("\n");

    const promptAI = `Actúa como el Oficial Principal de Riesgos (UAIR) de Banco Ve por Más (B×+).
Genera el Dictamen Oficial de Estrés Cuantitativo y de Procesos para el Comité de Administración Integral de Riesgos (CAIR) bajo la CUB (Anexos 12-B, 12-D, Art. 65/88) y NIF C-16:

ALCANCE DE LA SIMULACIÓN:
- Proceso Seleccionado: ${selectedProcessName}
- Parámetros Macroeconómicos y Entorno:
  * Contracción PIB: ${numGdp}%
  * Tasa TIIE: ${numTiie}%
  * Depreciación Cambiaria MXN/USD: +${numFx}%
  * Severidad Sequía/Clima: ${(numClimate * 100).toFixed(0)}%
  * Indisponibilidad Canal SPEI: ${numSpei} horas
  * Degradación de Controles del Proceso a No Formalizados (NF): ${numCtrlDeg}%

RESULTADOS CUANTITATIVOS DEL ESTRÉS:
- Riesgos Evaluados en el Proceso: ${stressedRisks.length} eventos
- Riesgos que Migran a Zona Roja (Capacidad RAF): de ${totalBaseRed} a ${totalStressedRed} riesgos
- Riesgos Críticos (Naranja/Rojo): ${totalMigratedToCritical} riesgos rompieron tolerancia RAF
- PEA del Proceso: $${totalBasePEA.toLocaleString("es-MX")} MXN -> $${totalStressedPEA.toLocaleString("es-MX")} MXN (Incremento de +$${totalDeltaPEA.toLocaleString("es-MX")} MXN)
- PMA Catastrófica (VaR 99.9%): $${totalBasePMA.toLocaleString("es-MX")} MXN -> $${totalStressedPMA.toLocaleString("es-MX")} MXN
- Nuevas Reservas Crediticias NIF C-16: +$${additionalReserveMXN.toLocaleString("es-MX")} MXN
- Solvencia Regulatoria: ICAP Base ${baseICAP}% -> ICAP Estresado ${stressedICAP}% (Semáforo RAF: ${icapZone})

EVENTOS DE RIESGO MÁS CRÍTICOS EN LOS NODOS DEL DIAGRAMA:
${criticalRisksList || "Sin riesgos individuales en cuadrantes críticos."}

Escribe un dictamen formal, técnico y conciso en exactamente 3 secciones:
1. DIAGNÓSTICO DE VULNERABILIDAD EN LOS PROCESOS: Explica los nodos y pasos del flujo más vulnerables al estrés y la degradación de controles.
2. IMPACTO EN EL MARCO RAF Y SOLVENCIA (ICAP & NIF C-16): Analiza si se vulnera la Tolerancia o Capacidad del banco conforme a CUB Art. 88.
3. ACCIONES DE MITIGACIÓN Y PLANES DE CONTINGENCIA INMEDIATOS: Medidas de gobernanza (3 Líneas de Defensa), controles duales o coberturas que deben implementarse antes de 15 días.`;

    let aiNarrative = "";
    try {
      aiNarrative = await chatWithRiskCopilot(promptAI);
    } catch (err) {
      console.warn("Fallback to deterministic narrative for CAIR stress report:", err);
    }

    if (!aiNarrative || aiNarrative.trim().length < 50) {
      aiNarrative = `1. DIAGNÓSTICO DE VULNERABILIDAD EN LOS PROCESOS B×+:
El escenario estresado sobre "${selectedProcessName}" revela que la combinación de choques macroeconómicos (PIB ${numGdp}%, TIIE ${numTiie}%) y la degradación del ${numCtrlDeg}% en los controles internos trasladó ${totalMigratedToCritical} eventos de riesgo residual hacia zonas críticas (Naranja/Roja). Las estaciones operativas más expuestas corresponden a los nodos con controles no formalizados y dependencias con canales de dispersión y colaterales agrícolas.

2. IMPACTO EN EL MARCO DE APETITO AL RIESGO (RAF CUB ART. 88) Y SOLVENCIA:
La Pérdida Esperada Anual (PEA) de los procesos analizados experimenta un incremento de +$${totalDeltaPEA.toLocaleString("es-MX")} MXN (+${totalBasePEA > 0 ? ((totalDeltaPEA / totalBasePEA) * 100).toFixed(1) : 0}%), elevando la Pérdida Máxima Catastrófica a $${totalStressedPMA.toLocaleString("es-MX")} MXN. El Índice de Capitalización (ICAP) se comprime de ${baseICAP}% a ${stressedICAP}%, situándose en zona de ${icapZone === "RED" ? "Capacidad Vulnerada (por debajo del mínimo regulatorio del 10.50% CUB)" : icapZone === "ORANGE" ? "Tolerancia Prudencial (requiere supervisión estrecha de la UAIR)" : "Apetito Institucional Estable"}.

3. ACCIONES DE CONTINGENCIA Y GOBERNANZA RECOMENDADAS PARA EL CAIR:
Se aprueba formalmente requerir a los Titulares de Negocio (1ª Línea de Defensa) la suscripción y ejecución de Planes de Acción y Quick-Wins para los riesgos migrados a Zona Roja. Dichos planes deben incluir el robustecimiento de candados biométricos en nodos de dispersión SPEI, validación satelital DNSH de colaterales agrícolas y la formalización inmediata con evidencia digital SHA-256 de los controles operativos clave antes de 15 días hábiles.`;
    }

    // 6. Registro en Bitácora de Auditoría
    const user =
      (await prisma.user.findFirst({ where: { role: userRole as RoleType } })) ||
      (await prisma.user.findFirst());

    if (user) {
      await recordAuditLog({
        userId: user.id,
        userRole: userRole as RoleType,
        actionType: "STRESS_TESTING_SIMULATION",
        entityName: "StressEngine_ProcessLevel",
        entityId: processId,
        previousState: {
          scope: selectedProcessName,
          baseICAP,
          totalBasePEA,
          totalBaseRed,
        },
        newState: {
          stressedICAP,
          icapZone,
          totalStressedPEA,
          totalDeltaPEA,
          totalStressedRed,
          totalMigratedToCritical,
          controlDegradationPct: numCtrlDeg,
        },
      });
    }

    return NextResponse.json({
      success: true,
      simulationParams: {
        processId,
        processName: selectedProcessName,
        deltaGdpPct: numGdp,
        tiieRatePct: numTiie,
        deltaFxPct: numFx,
        climateShockScore: numClimate,
        speiDowntimeHours: numSpei,
        controlDegradationPct: numCtrlDeg,
      },
      metrics: {
        totalRisksEvaluated: stressedRisks.length,
        baseICAP,
        stressedICAP,
        icapZone,
        totalBasePEA,
        totalStressedPEA,
        totalDeltaPEA,
        peaIncreasePct: totalBasePEA > 0 ? Number(((totalDeltaPEA / totalBasePEA) * 100).toFixed(2)) : 0,
        totalBasePMA,
        totalStressedPMA,
        totalDeltaPMA: totalStressedPMA - totalBasePMA,
        totalBaseRed,
        totalStressedRed,
        totalMigratedToCritical,
        additionalReserveMXN: Number(additionalReserveMXN.toFixed(2)),
        currentTotalPCE: Number(currentTotalPCE.toFixed(2)),
        stressedTotalPCE: Number(stressedTotalPCE.toFixed(2)),
      },
      processBreakdown,
      stressedRisks,
      aiNarrative,
    });
  } catch (error) {
    console.error("Error in stress-test API:", error);
    return NextResponse.json(
      { success: false, error: "Error al ejecutar simulación de estrés por procesos" },
      { status: 500 }
    );
  }
}
