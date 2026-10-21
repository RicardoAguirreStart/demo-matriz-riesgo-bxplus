// src/app/api/copilot/chat/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chatWithRiskCopilot } from "@/lib/ai/gemini";
import { recordAuditLog } from "@/lib/audit";
import { RoleType } from "@/types";

export async function POST(request: Request) {
  try {
    const { prompt, userRole = "UAIR_ADMIN" } = await request.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt requerido" }, { status: 400 });
    }

    // 1. Armar contexto RAG con datos vivos de Bx+
    const [rafThresholds, topRisks, inSummary, creditSummary] = await Promise.all([
      prisma.rAFThreshold.findMany({ select: { metricCode: true, currentValue: true, currentZone: true, toleranceValue: true, appetiteValue: true } }),
      prisma.riskEvent.findMany({
        take: 5,
        orderBy: { criticalityRankScore: "desc" },
        select: { code: true, title: true, residualScore: true, residualZone: true, maxAnnualLossPMA: true, reputationalImpactLevel: true },
      }),
      prisma.operationalBusinessIndicator.findFirst({ select: { totalBusinessIndIN: true, regulatoryCapitalOP: true, calculationYear: true } }),
      prisma.creditExposureNifC16.aggregate({ _sum: { grossExposureEI: true, expectedCreditLossPCE: true } }),
    ]);

    const contextData = {
      marcoApetitoRiesgoRAF: rafThresholds,
      topRiesgosCriticos: topRisks,
      indicadorNegocioOperacionalIN: inSummary,
      carteraCrediticiaNIF_C16: {
        totalExposicionEI: creditSummary._sum.grossExposureEI,
        reservaPCEConstituida: creditSummary._sum.expectedCreditLossPCE,
      },
    };

    // 2. Ejecutar Copiloto con Gemini
    const answer = await chatWithRiskCopilot(prompt, contextData);

    // 3. Registrar auditoría de consulta analítica
    const user = await prisma.user.findFirst({ where: { role: userRole as RoleType } }) || await prisma.user.findFirst();
    if (user) {
      await recordAuditLog({
        userId: user.id,
        userRole: userRole as RoleType,
        actionType: "COPILOT_AI_CONSULTATION",
        entityName: "Gemini_RiskCopilot",
        entityId: "RAG_SESSION",
        previousState: null,
        newState: { prompt, responseLength: answer.length },
      });
    }

    return NextResponse.json({ success: true, answer });
  } catch (error) {
    console.error("Error in Copilot chat route:", error);
    return NextResponse.json({ success: false, error: "Error al comunicarse con Gemini Copilot" }, { status: 500 });
  }
}
