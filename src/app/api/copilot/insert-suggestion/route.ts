// src/app/api/copilot/insert-suggestion/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateOperationalRiskMetrics } from "@/lib/engines/operational-risk-engine";
import { recordAuditLog } from "@/lib/audit";
import { RoleType } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, item, processNodeId, userRole = "UAIR_ADMIN" } = body;

    const user = await prisma.user.findFirst({ where: { role: userRole as RoleType } }) || await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 400 });
    }

    if (type === "RISK") {
      // Obtener o inferir taxonomía
      let taxonomy = await prisma.riskTaxonomy.findFirst({
        where: { riskType: item.riskType },
      });
      if (!taxonomy) {
        taxonomy = await prisma.riskTaxonomy.findFirst();
      }
      if (!taxonomy) {
        return NextResponse.json({ success: false, error: "No se encontró taxonomía en el catálogo" }, { status: 400 });
      }

      // Obtener proceso y unidad de negocio del nodo si existe
      let processId: string;
      let businessUnitId: string;
      if (processNodeId) {
        const node = await prisma.processNode.findUnique({
          where: { id: processNodeId },
          include: { process: { include: { macroProcess: true } } },
        });
        processId = node?.processId || "";
        businessUnitId = node?.process.macroProcess.businessUnitId || "";
      } else {
        const defaultProc = await prisma.process.findFirst({ include: { macroProcess: true } });
        processId = defaultProc?.id || "";
        businessUnitId = defaultProc?.macroProcess.businessUnitId || "";
      }

      const metrics = calculateOperationalRiskMetrics({
        inherentProbability: item.suggestedInherentProb || 3,
        inherentImpact: item.suggestedInherentImpact || 4,
        combinedControlFactor: 0.35,
        annualFrequencyNet: 0.25,
        avgFinancialImpactMXN: 8000000,
        worstCaseImpactMXN: 24000000,
      });

      const count = await prisma.riskEvent.count();
      const code = `RSK-AI-${String(count + 1).padStart(3, "0")}`;

      const newRisk = await prisma.riskEvent.create({
        data: {
          code,
          title: item.event || "Riesgo Sugerido por B×+ Risk Copilot",
          cause: item.cause || "Causa identificada por análisis asistido por IA",
          eventDescription: item.event || "Evento operacional o emergente",
          consequence: item.consequence || "Impacto financiero o regulatorio",
          taxonomyId: taxonomy.id,
          origin: "TECHNOLOGY",
          businessUnitId,
          processId,
          processNodeId: processNodeId || null,
          ownerId: user.id,
          inherentProbability: item.suggestedInherentProb || 3,
          inherentImpact: item.suggestedInherentImpact || 4,
          inherentScore: metrics.inherentScore,
          inherentZone: metrics.inherentZone,
          controlMitigationFactor: 0.35,
          residualProbability: metrics.residualProbability,
          residualImpact: metrics.residualImpact,
          residualScore: metrics.residualScore,
          residualZone: metrics.residualZone,
          annualFrequencyNet: 0.25,
          avgFinancialImpactMXN: 8000000,
          worstCaseImpactMXN: 24000000,
          expectedAnnualLossPEA: metrics.expectedAnnualLossPEA,
          maxAnnualLossPMA: metrics.maxAnnualLossPMA,
          reputationalImpactLevel: item.reputationalImpact || 4,
          isEmergingRisk: true,
          status: "PUBLISHED",
          criticalityRankScore: Number((metrics.residualScore * 2.5 + 15).toFixed(1)),
        },
      });

      await recordAuditLog({
        userId: user.id,
        userRole: userRole as RoleType,
        actionType: "INSERT_AI_SUGGESTED_RISK",
        entityName: "RiskEvent",
        entityId: newRisk.id,
        previousState: null,
        newState: newRisk,
      });

      return NextResponse.json({ success: true, createdItem: newRisk });
    }

    if (type === "ACTION_PLAN") {
      // Obtener un riesgo anclado al nodo o el primero disponible
      let targetRiskId: string;
      if (processNodeId) {
        const linkedRisk = await prisma.riskEvent.findFirst({ where: { processNodeId } });
        targetRiskId = linkedRisk ? linkedRisk.id : (await prisma.riskEvent.findFirst())?.id || "";
      } else {
        targetRiskId = (await prisma.riskEvent.findFirst())?.id || "";
      }

      const count = await prisma.actionPlan.count();
      const code = `PA-AI-${String(count + 1).padStart(3, "0")}`;

      const newPlan = await prisma.actionPlan.create({
        data: {
          code,
          title: item.title || "Plan de Mitigación Sugerido por Risk Copilot",
          description: `Plan asistido por IA: ${item.title}. Potencial de mejora: ${(item.improvementPotentialPct * 100).toFixed(0)}%.`,
          planTypes: JSON.stringify(item.planTypes || ["TECHNOLOGY", "PROCESSES"]),
          riskEventId: targetRiskId,
          ownerId: user.id,
          improvementPotentialPct: Number(item.improvementPotentialPct) || 0.75,
          estimatedCostMXN: 150000,
          costScale: item.estimatedCostScale || "LOW",
          estimatedDays: Number(item.estimatedTimeDays) || 45,
          timeScale: item.estimatedTimeScale || "LOW",
          combinedEffortScore: 1.8,
          expectedPEAReductionMXN: Number(item.expectedPEAReductionMXN) || 2000000,
          expectedPMAReductionMXN: Number(item.expectedPMAReductionMXN) || 6000000,
          isQuickWin: Boolean(item.isQuickWin),
          isSuggestedByAI: true,
          status: "DRAFT",
          dueDate: new Date(Date.now() + 45 * 24 * 3600 * 1000),
          signedByBusinessHead: false,
        },
      });

      await recordAuditLog({
        userId: user.id,
        userRole: userRole as RoleType,
        actionType: "INSERT_AI_QUICK_WIN_PLAN",
        entityName: "ActionPlan",
        entityId: newPlan.id,
        previousState: null,
        newState: newPlan,
      });

      return NextResponse.json({ success: true, createdItem: newPlan });
    }

    return NextResponse.json({ success: false, error: "Tipo de sugerencia no reconocido" }, { status: 400 });
  } catch (error) {
    console.error("Error inserting AI suggestion:", error);
    return NextResponse.json({ success: false, error: "Error al insertar sugerencia" }, { status: 500 });
  }
}
