// src/app/api/dashboard/stats/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractTopCriticalRisks } from "@/lib/engines/prioritization-engine";
import { calculateRafZone } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessLine = searchParams.get("businessLine") || "ALL";
    const processId = searchParams.get("processId") || "ALL";

    // 1. Filtro dinámico por Unidad de Negocio y Proceso Bancario
    const whereClause: any = {};

    if (businessLine !== "ALL") {
      const bu = await prisma.businessUnit.findFirst({
        where: { businessLine },
      });
      if (bu) {
        whereClause.businessUnitId = bu.id;
      }
    }

    if (processId !== "ALL") {
      const proc = await prisma.process.findFirst({
        where: {
          OR: [{ id: processId }, { code: processId }],
        },
      });
      if (proc) {
        whereClause.processId = proc.id;
      } else {
        whereClause.processId = processId;
      }
    }

    // 2. Consulta paralela en base de datos
    const [
      allRisks,
      allProcesses,
      allPlans,
      rafThresholdsRaw,
      kris,
      totalPCE,
      allDbRisksForSummary,
    ] = await Promise.all([
      prisma.riskEvent.findMany({
        where: whereClause,
        include: {
          taxonomy: true,
          businessUnit: true,
          process: { include: { macroProcess: true } },
          processNode: true,
          actionPlans: {
            include: { evidences: true },
            orderBy: { createdAt: "desc" },
          },
          controls: {
            include: {
              control: true,
            },
          },
        },
      }),
      prisma.process.findMany({
        include: {
          macroProcess: true,
          _count: { select: { flowNodes: true, riskEvents: true } },
        },
        orderBy: { code: "asc" },
      }),
      prisma.actionPlan.findMany({
        include: {
          evidences: true,
          riskEvent: {
            include: {
              process: true,
              processNode: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.rAFThreshold.findMany({
        orderBy: { metricCode: "asc" },
      }),
      prisma.kRI.findMany({
        include: {
          riskEvent: {
            include: {
              process: true,
            },
          },
        },
        orderBy: { code: "asc" },
      }),
      prisma.creditExposureNifC16.aggregate({
        _sum: { expectedCreditLossPCE: true, grossExposureEI: true },
        _count: { id: true },
      }),
      prisma.riskEvent.findMany({
        select: {
          id: true,
          processId: true,
          inherentScore: true,
          residualScore: true,
          residualZone: true,
          expectedAnnualLossPEA: true,
          maxAnnualLossPMA: true,
          controls: {
            select: {
              control: {
                select: {
                  id: true,
                  isFormalized: true,
                  hasValidEvidence: true,
                },
              },
            },
          },
          actionPlans: {
            select: {
              id: true,
              isQuickWin: true,
              status: true,
            },
          },
        },
      }),
    ]);

    // 3. Totales Financieros Operativos
    const totalPEA = allRisks.reduce((sum, r) => sum + r.expectedAnnualLossPEA, 0);
    const totalPMA = allRisks.reduce((sum, r) => sum + r.maxAnnualLossPMA, 0);

    // Mapeo Proceso <-> Indicador RAF Principal
    const metricProcessMapping: Record<
      string,
      { processCode: string; processLabel: string }
    > = {
      IMORA: { processCode: "PR-AGRO-01", processLabel: "Crédito Agro & PyME" },
      CET1: { processCode: "PR-AGRO-01", processLabel: "Solvencia Cartera Comercial" },
      CCL: { processCode: "PR-TES-01", processLabel: "Liquidez & Tesorería" },
      VAR_MKT: { processCode: "PR-TES-01", processLabel: "Mesa de Dinero & Tesorería" },
      ICAP: { processCode: "PR-CRED-02", processLabel: "Garantías & Consumo Capital" },
      SPEI_AVAIL: { processCode: "PR-TI-01", processLabel: "Continuidad SPEI & TI" },
      PEA_OP: { processCode: "ALL", processLabel: "Transversal (Todos los Procesos)" },
    };

    // 4. Sincronización en vivo de PEA_OP y Recálculo Dinámico de Zonas RAF
    const rafThresholds = rafThresholdsRaw.map((th) => {
      let currentValue = th.currentValue;
      let appetiteValue = th.appetiteValue;
      let toleranceValue = th.toleranceValue;
      let regulatoryLimitValue = th.regulatoryLimitValue;
      let capacityValue = th.capacityValue;

      if (th.metricCode === "PEA_OP") {
        currentValue = totalPEA;

        // Escalar umbrales si estamos a nivel portafolio consolidado (>50M MXN)
        if (totalPEA > 50_000_000) {
          appetiteValue = 65_000_000;
          toleranceValue = 85_000_000;
          regulatoryLimitValue = 105_000_000;
          capacityValue = 125_000_000;
        } else if (totalPEA > 20_000_000) {
          appetiteValue = 20_000_000;
          toleranceValue = 30_000_000;
          regulatoryLimitValue = 40_000_000;
          capacityValue = 50_000_000;
        } else {
          appetiteValue = 10_000_000;
          toleranceValue = 15_000_000;
          regulatoryLimitValue = 20_000_000;
          capacityValue = 25_000_000;
        }
      }

      const currentZone = calculateRafZone(
        currentValue,
        th.direction,
        appetiteValue,
        toleranceValue,
        regulatoryLimitValue
      );

      const mapping = metricProcessMapping[th.metricCode] || {
        processCode: "ALL",
        processLabel: "Consolidado Banco",
      };

      return {
        ...th,
        currentValue,
        appetiteValue,
        toleranceValue,
        regulatoryLimitValue,
        capacityValue,
        currentZone,
        associatedProcessCode: mapping.processCode,
        associatedProcessLabel: mapping.processLabel,
      };
    });

    // 5. Algoritmo Multicriterio Top 5-7 Riesgos Críticos (Corrección de Bug hasUnverifiedControls + Trazabilidad)
    const mappedForRanking = allRisks.map((r) => {
      // Corrección de Auditoría: Penalizar si no tiene controles (length === 0) o si alguno carece de evidencia o no está formalizado
      const hasUnverifiedControls =
        !r.controls ||
        r.controls.length === 0 ||
        r.controls.some((c) => !c.control?.hasValidEvidence || !c.control?.isFormalized);

      const hasFormalControl =
        (r.controls?.length || 0) > 0 &&
        r.controls.every((c) => c.control?.isFormalized);

      const actionPlansCount = r.actionPlans?.length || 0;
      const quickWinsCount = r.actionPlans?.filter((p) => p.isQuickWin).length || 0;
      const hasVerifiedPlan =
        r.actionPlans?.some(
          (p) => p.status === "COMPLETED_VERIFIED" || p.status === "VALIDATED_CLOSED"
        ) || false;
      const primaryPlanCode = r.actionPlans?.[0]?.code || null;
      const primaryPlanStatus = r.actionPlans?.[0]?.status || null;
      const primaryPlanTitle = r.actionPlans?.[0]?.title || null;
      const primaryPlanIsQuickWin = r.actionPlans?.[0]?.isQuickWin || false;

      return {
        id: r.id,
        code: r.code,
        title: r.title,
        residualScore: r.residualScore,
        maxAnnualLossPMA: r.maxAnnualLossPMA,
        reputationalImpactLevel: r.reputationalImpactLevel,
        hasUnverifiedControls,
        hasFormalControl,
        isEmergingRisk: r.isEmergingRisk,
        speiImpact: r.speiImpact,
        residualZone: r.residualZone,
        businessUnitName: r.businessUnit?.name || "B×+",
        processCode: r.process?.code || "N/A",
        processName: r.process?.name || "Proceso General",
        processNodeLabel: r.processNode?.label || "Paso Operativo General",
        actionPlansCount,
        quickWinsCount,
        hasVerifiedPlan,
        primaryPlanCode,
        primaryPlanStatus,
        primaryPlanTitle,
        primaryPlanIsQuickWin,
        rawRisk: r,
      };
    });

    const topCriticalRisks = extractTopCriticalRisks(mappedForRanking, 7);

    // 6. Nuevo Objeto mitigationStats (Métricas de Mitigación, Quick-Wins, ROI y Gobernanza 3LD)
    const riskIdsInScope = new Set(allRisks.map((r) => r.id));
    const scopedPlans = allPlans.filter((p) => riskIdsInScope.has(p.riskEventId));

    const totalPlans = scopedPlans.length;
    const quickWinsCount = scopedPlans.filter((p) => p.isQuickWin).length;
    const signedByFirstLineCount = scopedPlans.filter((p) => p.signedByBusinessHead).length;
    const verifiedByUAIRCount = scopedPlans.filter(
      (p) => p.status === "COMPLETED_VERIFIED" || p.status === "VALIDATED_CLOSED"
    ).length;
    const totalPEAReductionMXN = scopedPlans.reduce(
      (sum, p) => sum + (p.expectedPEAReductionMXN || 0),
      0
    );
    const totalPMAReductionMXN = scopedPlans.reduce(
      (sum, p) => sum + (p.expectedPMAReductionMXN || 0),
      0
    );
    const totalInvestmentMXN = scopedPlans.reduce(
      (sum, p) => sum + (p.estimatedCostMXN || 0),
      0
    );
    const roiMultiple =
      totalInvestmentMXN > 0
        ? Number((totalPEAReductionMXN / totalInvestmentMXN).toFixed(1))
        : 0;
    const coveredRisksCount = allRisks.filter(
      (r) => r.actionPlans && r.actionPlans.length > 0
    ).length;
    const orphanRisksCount = allRisks.length - coveredRisksCount;
    const coveragePct =
      allRisks.length > 0
        ? Math.round((coveredRisksCount / allRisks.length) * 100)
        : 0;

    const mitigationStats = {
      totalPlans,
      quickWinsCount,
      signedByFirstLineCount,
      verifiedByUAIRCount,
      totalPEAReductionMXN,
      totalPMAReductionMXN,
      totalInvestmentMXN,
      roiMultiple,
      coveredRisksCount,
      orphanRisksCount,
      coveragePct,
    };

    // 7. Radiografía Ejecutiva por Proceso Bancario con Métrica de Apetito RAF y KRI Clave
    const globalBankPEA = allDbRisksForSummary.reduce(
      (acc, r) => acc + r.expectedAnnualLossPEA,
      0
    );

    const processHealthSummary = allProcesses.map((p) => {
      const pRisks = allDbRisksForSummary.filter((r) => r.processId === p.id);
      const risksCount = pRisks.length;
      const zoneCounts = {
        GREEN: pRisks.filter((r) => r.residualZone === "GREEN").length,
        YELLOW: pRisks.filter((r) => r.residualZone === "YELLOW").length,
        ORANGE: pRisks.filter((r) => r.residualZone === "ORANGE").length,
        RED: pRisks.filter((r) => r.residualZone === "RED").length,
      };

      const maxResidualScore =
        risksCount > 0 ? Math.max(...pRisks.map((r) => r.residualScore)) : 0;

      let dominantZone = "GREEN";
      if (zoneCounts.RED > 0) dominantZone = "RED";
      else if (zoneCounts.ORANGE > 0) dominantZone = "ORANGE";
      else if (zoneCounts.YELLOW > 0) dominantZone = "YELLOW";

      const pTotalPEA = pRisks.reduce((sum, r) => sum + r.expectedAnnualLossPEA, 0);
      const pTotalPMA = pRisks.reduce((sum, r) => sum + r.maxAnnualLossPMA, 0);

      // % Participación en la PEA Total del Banco
      const peaSharePct =
        globalBankPEA > 0 ? Math.round((pTotalPEA / globalBankPEA) * 100) : 0;

      // Promedios Inmanente vs. Residual
      const avgInherentScore =
        risksCount > 0
          ? Number(
              (
                pRisks.reduce((s, r) => s + (r.inherentScore || 0), 0) /
                risksCount
              ).toFixed(1)
            )
          : 0;

      const avgResidualScore =
        risksCount > 0
          ? Number(
              (
                pRisks.reduce((s, r) => s + (r.residualScore || 0), 0) /
                risksCount
              ).toFixed(1)
            )
          : 0;

      // Efectividad de Mitigación Art. 88 CUB (% reducción Inherente -> Residual)
      const totalInh = pRisks.reduce((s, r) => s + (r.inherentScore || 0), 0);
      const totalRes = pRisks.reduce((s, r) => s + (r.residualScore || 0), 0);
      const mitigationEffectivenessPct =
        totalInh > 0
          ? Math.max(0, Math.round(((totalInh - totalRes) / totalInh) * 100))
          : 0;

      // Conteo de Controles No Formalizados (NF) o riesgos sin controles
      const nfControlsCount = pRisks.filter(
        (r) =>
          !r.controls ||
          r.controls.length === 0 ||
          r.controls.some(
            (c) => !c.control?.isFormalized || !c.control?.hasValidEvidence
          )
      ).length;

      // Presupuesto y Consumo de Apetito RAF asignado al Proceso
      const pAppetitePEA = p.isCriticalBCP ? 12_000_000 : 10_000_000;
      const pTolerancePEA = p.isCriticalBCP ? 18_000_000 : 15_000_000;
      const pLimitPEA = p.isCriticalBCP ? 24_000_000 : 20_000_000;
      const pRafZone = calculateRafZone(
        pTotalPEA,
        "HIGHER_IS_WORSE",
        pAppetitePEA,
        pTolerancePEA,
        pLimitPEA
      );
      const appetiteConsumptionPct =
        pAppetitePEA > 0 ? Math.round((pTotalPEA / pAppetitePEA) * 100) : 0;

      const processRafThreshold = {
        id: `RAF-${p.id}`,
        metricCode: `RAF-${p.code}`,
        metricName: `Presupuesto PEA (${p.code})`,
        currentValue: pTotalPEA,
        appetiteValue: pAppetitePEA,
        toleranceValue: pTolerancePEA,
        regulatoryLimitValue: pLimitPEA,
        capacityValue: pLimitPEA * 1.25,
        currentZone: pRafZone,
        unit: "MXN",
        direction: "HIGHER_IS_WORSE",
        appetiteConsumptionPct,
      };

      // Vinculación directa con Indicador RAF / KRI Rector
      const cclTh = rafThresholds.find((t) => t.metricCode === "CCL");
      const icapTh = rafThresholds.find((t) => t.metricCode === "ICAP");
      const speiTh = rafThresholds.find((t) => t.metricCode === "SPEI_AVAIL");
      const cet1Th = rafThresholds.find((t) => t.metricCode === "CET1");
      const imoraTh = rafThresholds.find(
        (t) => t.metricCode === "IMORA" || t.metricCode === "IMOR_PYME"
      );
      const agroKri = kris.find(
        (k) => k.code === "KRI-AGRO-02" || k.riskEvent?.process?.code === "PR-AGRO-01"
      );

      let primaryKriMetric: {
        code: string;
        name: string;
        value: string;
        unit: string;
        zone: "GREEN" | "YELLOW" | "ORANGE" | "RED";
        type: "RAF" | "KRI" | "RESIDUAL";
      };

      if (p.code === "PR-AGRO-01") {
        primaryKriMetric = {
          code: "IMORA",
          name: "Índice de Morosidad Agropecuaria (IMORA)",
          value: imoraTh ? `${imoraTh.currentValue}%` : "2.35%",
          unit: "%",
          zone: (imoraTh?.currentZone as any) || "GREEN",
          type: "RAF",
        };
      } else if (p.code === "PR-TES-01") {
        primaryKriMetric = {
          code: "CCL",
          name: "Cobertura de Liquidez (CCL 30D)",
          value: `${cclTh?.currentValue || 114.5}%`,
          unit: "%",
          zone: (cclTh?.currentZone as any) || "YELLOW",
          type: "RAF",
        };
      } else if (p.code === "PR-CRED-02" || p.code === "PR-GAR-01") {
        primaryKriMetric = {
          code: "ICAP",
          name: "Capitalización Regulatoria (ICAP)",
          value: `${icapTh?.currentValue || 13.85}%`,
          unit: "%",
          zone: (icapTh?.currentZone as any) || "GREEN",
          type: "RAF",
        };
      } else if (p.code === "PR-TI-01") {
        primaryKriMetric = {
          code: "SPEI",
          name: "Disponibilidad del Canal SPEI",
          value: `${speiTh?.currentValue || 99.82}%`,
          unit: "%",
          zone: (speiTh?.currentZone as any) || "GREEN",
          type: "RAF",
        };
      } else {
        const procKri = kris.find(
          (k) => k.riskEvent?.process?.code === p.code || k.code.includes(p.code)
        );
        if (procKri) {
          primaryKriMetric = {
            code: procKri.code,
            name: procKri.name,
            value: `${procKri.currentValue}%`,
            unit: "%",
            zone: procKri.currentZone as any,
            type: "KRI",
          };
        } else {
          primaryKriMetric = {
            code: "SEV_MEDIA",
            name: "Severidad Residual Media",
            value: `${avgResidualScore}/25`,
            unit: "Score",
            zone: dominantZone as any,
            type: "RESIDUAL",
          };
        }
      }

      const plansCount = pRisks.reduce(
        (sum, r) => sum + (r.actionPlans?.length || 0),
        0
      );
      const quickWins = pRisks.reduce(
        (sum, r) => sum + (r.actionPlans?.filter((a) => a.isQuickWin).length || 0),
        0
      );
      const pOrphanRisks = pRisks.filter(
        (r) => !r.actionPlans || r.actionPlans.length === 0
      ).length;
      const pCoveragePct =
        risksCount > 0
          ? Math.round(((risksCount - pOrphanRisks) / risksCount) * 100)
          : 0;

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        macroProcessName: p.macroProcess?.name || "Cadena de Valor B×+",
        isCriticalBCP: p.isCriticalBCP,
        nodesCount: p._count?.flowNodes || 0,
        risksCount,
        zoneCounts,
        maxResidualScore,
        dominantZone,
        totalPEA: pTotalPEA,
        totalPMA: pTotalPMA,
        peaSharePct,
        avgInherentScore,
        avgResidualScore,
        mitigationEffectivenessPct,
        nfControlsCount,
        processRafThreshold,
        primaryKriMetric,
        plansCount,
        quickWinsCount: quickWins,
        orphanRisksCount: pOrphanRisks,
        coveragePct: pCoveragePct,
      };
    });

    // 8. Alertas Vivas para el FloatingSafetyWidget (liveAlerts)
    const rafAlerts = rafThresholds.filter(
      (th) =>
        th.currentZone === "YELLOW" ||
        th.currentZone === "ORANGE" ||
        th.currentZone === "RED"
    );

    const pendingQuickWins = allPlans
      .filter((p) => p.isQuickWin && p.status !== "COMPLETED_VERIFIED")
      .sort((a, b) => b.expectedPMAReductionMXN - a.expectedPMAReductionMXN);

    let topQuickWinOpportunity = null;
    if (pendingQuickWins.length > 0) {
      const topQW = pendingQuickWins[0];
      const improvementPct = Math.round((topQW.improvementPotentialPct || 0) * 100);
      const statusText =
        topQW.status === "APPROVED_COMMITTED"
          ? "Aprobado (Listo para firma / despliegue)"
          : topQW.status === "IN_PROGRESS"
          ? "En Implementación"
          : "Borrador de Mitigación";

      topQuickWinOpportunity = {
        code: topQW.code,
        title: topQW.title,
        isQuickWin: true,
        status: topQW.status,
        signedByBusinessHead: topQW.signedByBusinessHead,
        improvementPct,
        peaReductionMXN: topQW.expectedPEAReductionMXN,
        pmaReductionMXN: topQW.expectedPMAReductionMXN,
        processCode: topQW.riskEvent?.process?.code || "N/A",
        processName: topQW.riskEvent?.process?.name || "Proceso",
        processNodeLabel:
          topQW.riskEvent?.processNode?.label || "Paso Operativo Crítico",
        descriptionText: `El plan ${topQW.code} ("${topQW.title}") reduce la PMA en un ${improvementPct}% en el nodo "${topQW.riskEvent?.processNode?.label || "Operativo"}". Estado: ${statusText}.`,
      };
    } else {
      // Si todos los planes están completados, buscar el mayor riesgo huérfano
      const topOrphan = allRisks
        .filter((r) => !r.actionPlans || r.actionPlans.length === 0)
        .sort((a, b) => b.expectedAnnualLossPEA - a.expectedAnnualLossPEA)[0];

      if (topOrphan) {
        topQuickWinOpportunity = {
          code: topOrphan.code,
          title: topOrphan.title,
          isQuickWin: false,
          status: "ORPHAN_NO_PLAN",
          signedByBusinessHead: false,
          improvementPct: 0,
          peaReductionMXN: 0,
          pmaReductionMXN: 0,
          processCode: topOrphan.process?.code || "N/A",
          processName: topOrphan.process?.name || "Proceso",
          processNodeLabel:
            topOrphan.processNode?.label || "Paso Operativo General",
          descriptionText: `Atención: El riesgo ${topOrphan.code} ("${topOrphan.title}") en ${topOrphan.process?.code} no cuenta con Plan de Acción asignado.`,
        };
      }
    }

    // 9. Distribución de riesgos por zona residual 5x5
    const zoneCounts = {
      GREEN: allRisks.filter((r) => r.residualZone === "GREEN").length,
      YELLOW: allRisks.filter((r) => r.residualZone === "YELLOW").length,
      ORANGE: allRisks.filter((r) => r.residualZone === "ORANGE").length,
      RED: allRisks.filter((r) => r.residualZone === "RED").length,
    };

    // 10. Distribución por tipo de riesgo CNBV
    const riskTypeMap: Record<string, number> = {};
    for (const r of allRisks) {
      const type = r.taxonomy.riskType;
      riskTypeMap[type] = (riskTypeMap[type] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      selectedProcessId: processId,
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
      mitigationStats,
      processHealthSummary,
      liveAlerts: {
        kris: kris.map((k) => ({
          id: k.id,
          code: k.code,
          name: k.name,
          currentValue: k.currentValue,
          currentZone: k.currentZone,
          periodicity: k.periodicity,
          processCode: k.riskEvent?.process?.code || "N/A",
          processName: k.riskEvent?.process?.name || "General",
        })),
        rafAlerts,
        topQuickWinOpportunity,
      },
      riskTypeDistribution: riskTypeMap,
      processes: allProcesses.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        macroProcessName: p.macroProcess?.name,
      })),
    });
  } catch (error) {
    console.error("Error in /api/dashboard/stats:", error);
    return NextResponse.json(
      { success: false, error: "Error al calcular estadísticas ejecutivas" },
      { status: 500 }
    );
  }
}
