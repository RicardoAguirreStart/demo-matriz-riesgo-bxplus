// src/app/api/dashboard/stats/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractTopCriticalRisks } from "@/lib/engines/prioritization-engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessLine = searchParams.get("businessLine") || "ALL";

    // 1. Filtro opcional por unidad de negocio
    let unitFilter = {};
    if (businessLine !== "ALL") {
      const bu = await prisma.businessUnit.findFirst({
        where: { businessLine },
      });
      if (bu) {
        unitFilter = { businessUnitId: bu.id };
      }
    }

    // 2. Traer todos los riesgos de la unidad o consolidados
    const allRisks = await prisma.riskEvent.findMany({
      where: unitFilter,
      include: {
        taxonomy: true,
        businessUnit: true,
        process: true,
        processNode: true,
        actionPlans: true,
        controls: {
          include: {
            control: true,
          },
        },
      },
    });

    // 3. Extraer Top 5-7 Riesgos Críticos con el algoritmo multicriterio
    const mappedForRanking = allRisks.map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      residualScore: r.residualScore,
      maxAnnualLossPMA: r.maxAnnualLossPMA,
      reputationalImpactLevel: r.reputationalImpactLevel,
      hasUnverifiedControls: r.controls.some((c) => !c.control.hasValidEvidence),
      isEmergingRisk: r.isEmergingRisk,
      speiImpact: r.speiImpact,
      residualZone: r.residualZone,
      businessUnitName: r.businessUnit.name,
      processName: r.process.name,
      rawRisk: r,
    }));

    const topCriticalRisks = extractTopCriticalRisks(mappedForRanking, 7);

    // 4. Umbrales del Marco de Apetito al Riesgo (RAF)
    const rafThresholds = await prisma.rAFThreshold.findMany({
      orderBy: { metricCode: "asc" },
    });

    // 5. Métricas financieras agregadas
    const totalPCE = await prisma.creditExposureNifC16.aggregate({
      _sum: { expectedCreditLossPCE: true, grossExposureEI: true },
    });

    const totalPEA = allRisks.reduce((sum, r) => sum + r.expectedAnnualLossPEA, 0);
    const totalPMA = allRisks.reduce((sum, r) => sum + r.maxAnnualLossPMA, 0);

    // 6. Distribución de riesgos por zona residual 5x5
    const zoneCounts = {
      GREEN: allRisks.filter((r) => r.residualZone === "GREEN").length,
      YELLOW: allRisks.filter((r) => r.residualZone === "YELLOW").length,
      ORANGE: allRisks.filter((r) => r.residualZone === "ORANGE").length,
      RED: allRisks.filter((r) => r.residualZone === "RED").length,
    };

    // 7. Distribución por tipo de riesgo CNBV
    const riskTypeMap: Record<string, number> = {};
    for (const r of allRisks) {
      const type = r.taxonomy.riskType;
      riskTypeMap[type] = (riskTypeMap[type] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      totalRisks: allRisks.length,
      zoneCounts,
      rafThresholds,
      topCriticalRisks,
      financials: {
        totalGrossExposureEI: totalPCE._sum.grossExposureEI || 0,
        totalExpectedCreditLossPCE: totalPCE._sum.expectedCreditLossPCE || 0,
        totalPEA,
        totalPMA,
      },
      riskTypeDistribution: riskTypeMap,
    });
  } catch (error) {
    console.error("Error in /api/dashboard/stats:", error);
    return NextResponse.json({ success: false, error: "Error al calcular estadísticas ejecutivas" }, { status: 500 });
  }
}
