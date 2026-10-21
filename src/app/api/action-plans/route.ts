// src/app/api/action-plans/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { RoleType } from "@/types";
import { mapScoreTo5x5Zone } from "@/lib/engines/operational-risk-engine";
import {
  generateProcessPlanProposalsWithGemini,
  CandidateRiskForAI,
  AIPredictedPlanProposal,
} from "@/lib/ai/gemini";

/**
 * Auto-hidratación de Planes de Acción para asegurar cobertura en todos los procesos
 * bancarios (PR-AGRO-01, PR-TES-01, PR-CRED-02 / PR-GAR-01, PR-TI-01) y en los 4 cuadrantes.
 */
async function ensureInitialActionPlans() {
  try {
    const count = await prisma.actionPlan.count();
    const existing = await prisma.actionPlan.findMany({
      select: {
        code: true,
        riskEvent: {
          select: {
            process: {
              select: { code: true },
            },
          },
        },
      },
    });

    const coveredProcessCodes = new Set(
      existing.map((p) => p.riskEvent?.process?.code).filter(Boolean)
    );

    const needsSeeding =
      count <= 4 ||
      !coveredProcessCodes.has("PR-TI-01") ||
      !coveredProcessCodes.has("PR-CRED-02");

    if (!needsSeeding) return;

    // Obtener un usuario propietario por defecto (Head de Proceso / UAIR)
    const defaultOwner =
      (await prisma.user.findFirst({ where: { role: "PROCESS_OWNER" } })) ||
      (await prisma.user.findFirst());
    if (!defaultOwner) return;

    // Buscar riesgos clave en los procesos
    const allRisks = await prisma.riskEvent.findMany({
      include: {
        process: true,
        processNode: true,
        controls: { include: { control: true } },
      },
    });

    const plansToCreate: any[] = [];

    // 1. Quick-Win para PR-TI-01 (RSK-CYBER-006 o RSK-CYBER-015)
    const tiRisk =
      allRisks.find((r) => r.code === "RSK-CYBER-006") ||
      allRisks.find((r) => r.code === "RSK-CYBER-015") ||
      allRisks.find((r) => r.process?.code === "PR-TI-01");

    if (tiRisk && !existing.some((p) => p.code === "PA-2026-004")) {
      const impPct = 0.75;
      plansToCreate.push({
        code: "PA-2026-004",
        title: "Aislamiento Automático EDR y Bloqueo de Cuentas Privilegiadas en SOC",
        description:
          "Implementación de reglas SOAR para aislamiento automático de endpoints ante detección de anomalías criptográficas y revocación preventiva de tokens en servidores transaccionales.",
        planTypes: JSON.stringify(["TECHNOLOGY", "PROCESSES"]),
        riskEventId: tiRisk.id,
        controlId: tiRisk.controls?.[0]?.controlId || null,
        ownerId: defaultOwner.id,
        improvementPotentialPct: impPct,
        estimatedCostMXN: 140000,
        costScale: "LOW",
        estimatedDays: 35,
        timeScale: "LOW",
        combinedEffortScore: 2.0,
        expectedPEAReductionMXN: tiRisk.expectedAnnualLossPEA * impPct,
        expectedPMAReductionMXN: tiRisk.maxAnnualLossPMA * impPct,
        isQuickWin: true,
        isSuggestedByAI: true,
        status: "APPROVED_COMMITTED",
        dueDate: new Date(Date.now() + 35 * 24 * 3600 * 1000),
        signedByBusinessHead: true,
      });
    }

    // 2. Quick-Win para PR-CRED-02 / PR-GAR-01 (RSK-LEG-009 o RSK-CRED-013)
    const credRisk =
      allRisks.find((r) => r.code === "RSK-LEG-009") ||
      allRisks.find((r) => r.code === "RSK-CRED-013") ||
      allRisks.find((r) => r.process?.code === "PR-CRED-02");

    if (credRisk && !existing.some((p) => p.code === "PA-2026-005")) {
      const impPct = 0.65;
      plansToCreate.push({
        code: "PA-2026-005",
        title: "Checklist Digital Obligatorio de Avalúos y Certificación Notarial Pre-Desembolso",
        description:
          "Control digital preventivo con validación de gravamen, vigencia de avalúos y verificación de folios reales en el Registro Público antes de autorizar la dispersión crediticia.",
        planTypes: JSON.stringify(["PROCESSES", "POLICY_REGULATION"]),
        riskEventId: credRisk.id,
        controlId: credRisk.controls?.[0]?.controlId || null,
        ownerId: defaultOwner.id,
        improvementPotentialPct: impPct,
        estimatedCostMXN: 95000,
        costScale: "LOW",
        estimatedDays: 30,
        timeScale: "VERY_LOW",
        combinedEffortScore: 1.5,
        expectedPEAReductionMXN: credRisk.expectedAnnualLossPEA * impPct,
        expectedPMAReductionMXN: credRisk.maxAnnualLossPMA * impPct,
        isQuickWin: true,
        isSuggestedByAI: false,
        status: "IN_PROGRESS",
        dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        signedByBusinessHead: true,
      });
    }

    // 3. Proyecto Estructural (Cuadrante II) para PR-TES-01 (RSK-LIQ-004 o RSK-MKT-003)
    const tesRisk =
      allRisks.find((r) => r.code === "RSK-LIQ-004") ||
      allRisks.find((r) => r.code === "RSK-MKT-003") ||
      allRisks.find((r) => r.process?.code === "PR-TES-01");

    if (tesRisk && !existing.some((p) => p.code === "PA-2026-006")) {
      const impPct = 0.70;
      plansToCreate.push({
        code: "PA-2026-006",
        title: "Motor Intradía de Liquidez y Alertas Tempranas CCL/CFEN Automatizado",
        description:
          "Desarrollo e integración de un motor de proyección de flujos intradía con conexión directa a SPEI y cálculo continuo de consumos de colchón de liquidez y brechas de descalce.",
        planTypes: JSON.stringify(["TECHNOLOGY"]),
        riskEventId: tesRisk.id,
        controlId: tesRisk.controls?.[0]?.controlId || null,
        ownerId: defaultOwner.id,
        improvementPotentialPct: impPct,
        estimatedCostMXN: 680000,
        costScale: "MEDIUM",
        estimatedDays: 120,
        timeScale: "HIGH",
        combinedEffortScore: 3.5,
        expectedPEAReductionMXN: tesRisk.expectedAnnualLossPEA * impPct,
        expectedPMAReductionMXN: tesRisk.maxAnnualLossPMA * impPct,
        isQuickWin: false,
        isSuggestedByAI: false,
        status: "DRAFT",
        dueDate: new Date(Date.now() + 120 * 24 * 3600 * 1000),
        signedByBusinessHead: false,
      });
    }

    // 4. Mejora Táctica (Cuadrante III) para PR-CRED-02 / PR-GAR-01 (RSK-OP-016)
    const opRisk =
      allRisks.find((r) => r.code === "RSK-OP-016") ||
      allRisks.find((r) => r.code === "RSK-OP-022") ||
      allRisks.find((r) => r.process?.code === "PR-CRED-02");

    if (opRisk && !existing.some((p) => p.code === "PA-2026-007")) {
      const impPct = 0.45;
      plansToCreate.push({
        code: "PA-2026-007",
        title: "Validador Previo de Layouts Regulatorios SITI R01/R10",
        description:
          "Micro-servicio de conciliación previa de campos obligatorios CNBV para prevenir rechazos y reprocesos en la entrega de reportes regulatorios.",
        planTypes: JSON.stringify(["TECHNOLOGY", "PROCESSES"]),
        riskEventId: opRisk.id,
        controlId: opRisk.controls?.[0]?.controlId || null,
        ownerId: defaultOwner.id,
        improvementPotentialPct: impPct,
        estimatedCostMXN: 65000,
        costScale: "VERY_LOW",
        estimatedDays: 25,
        timeScale: "VERY_LOW",
        combinedEffortScore: 1.0,
        expectedPEAReductionMXN: opRisk.expectedAnnualLossPEA * impPct,
        expectedPMAReductionMXN: opRisk.maxAnnualLossPMA * impPct,
        isQuickWin: false,
        isSuggestedByAI: true,
        status: "APPROVED_COMMITTED",
        dueDate: new Date(Date.now() + 25 * 24 * 3600 * 1000),
        signedByBusinessHead: true,
      });
    }

    // 5. Baja Prioridad / Reevaluar (Cuadrante IV)
    const stratRisk =
      allRisks.find((r) => r.code === "RSK-STRAT-011") ||
      allRisks.find((r) => r.code === "RSK-STRAT-025") ||
      allRisks[0];

    if (stratRisk && !existing.some((p) => p.code === "PA-2026-008")) {
      const impPct = 0.35;
      plansToCreate.push({
        code: "PA-2026-008",
        title: "Estudio de Mercado y Benchmark de Comisiones para Líneas Marginales",
        description:
          "Análisis comparativo de mercado y revisión estratégica de productos para evaluar viabilidad de continuidad comercial o reemplazo.",
        planTypes: JSON.stringify(["POLICY_REGULATION"]),
        riskEventId: stratRisk.id,
        controlId: stratRisk.controls?.[0]?.controlId || null,
        ownerId: defaultOwner.id,
        improvementPotentialPct: impPct,
        estimatedCostMXN: 350000,
        costScale: "MEDIUM",
        estimatedDays: 110,
        timeScale: "HIGH",
        combinedEffortScore: 3.5,
        expectedPEAReductionMXN: stratRisk.expectedAnnualLossPEA * impPct,
        expectedPMAReductionMXN: stratRisk.maxAnnualLossPMA * impPct,
        isQuickWin: false,
        isSuggestedByAI: false,
        status: "DRAFT",
        dueDate: new Date(Date.now() + 110 * 24 * 3600 * 1000),
        signedByBusinessHead: false,
      });
    }

    // Insertar planes complementarios en Prisma
    for (const planData of plansToCreate) {
      const created = await prisma.actionPlan.create({
        data: planData,
      });

      // Crear evidencia inicial si está firmado
      if (planData.signedByBusinessHead) {
        const crypto = await import("crypto");
        const fileHashSha256 = crypto
          .createHash("sha256")
          .update(`${created.id}-${created.code}-init`)
          .digest("hex");

        await prisma.actionPlanEvidence.create({
          data: {
            actionPlanId: created.id,
            fileName: `Dictamen_Tecnico_Alineacion_${created.code}.pdf`,
            fileUrl: `/evidence/secured/${created.code}_dictamen.pdf`,
            fileHashSha256,
            comments: "Evidencia de control interno validada conforme al estándar CNBV CUB Art. 88.",
            approvedByUAIR: false,
          },
        });
      }
    }
  } catch (seedErr) {
    console.warn("Auto-seed action plans warning (non-blocking):", seedErr);
  }
}

export async function GET() {
  try {
    // Asegurar hidratación inicial de datos para los 4 procesos
    await ensureInitialActionPlans();

    const plans = await prisma.actionPlan.findMany({
      include: {
        riskEvent: {
          include: {
            businessUnit: true,
            taxonomy: true,
            process: {
              include: {
                macroProcess: true,
              },
            },
            processNode: true,
            controls: {
              include: {
                control: true,
              },
            },
          },
        },
        control: true,
        owner: true,
        evidences: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, plans });
  } catch (error) {
    console.error("Error fetching action plans:", error);
    return NextResponse.json({ success: false, error: "Error al consultar planes de acción" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // =========================================================================
    // ACCIÓN 1: Firma de Compromiso (1ª Línea de Defensa)
    // =========================================================================
    if (action === "SIGN_PLAN") {
      const { planId, userRole = "PROCESS_OWNER" } = body;
      const updated = await prisma.actionPlan.update({
        where: { id: planId },
        data: {
          signedByBusinessHead: true,
          status: "APPROVED_COMMITTED",
        },
        include: {
          riskEvent: {
            include: {
              process: true,
              processNode: true,
            },
          },
          evidences: true,
        },
      });

      const user =
        (await prisma.user.findFirst({ where: { role: userRole as RoleType } })) ||
        (await prisma.user.findFirst());

      if (user) {
        await recordAuditLog({
          userId: user.id,
          userRole: userRole as RoleType,
          actionType: "SIGN_REMEDIATION_PLAN",
          entityName: "ActionPlan",
          entityId: updated.id,
          previousState: { signedByBusinessHead: false, status: "DRAFT" },
          newState: updated,
        });
      }

      return NextResponse.json({ success: true, plan: updated });
    }

    // =========================================================================
    // ACCIÓN 2: Adjuntar Evidencia Documental con Huella Criptográfica SHA-256
    // =========================================================================
    if (action === "ADD_EVIDENCE") {
      const { planId, fileName, comments, userRole = "PROCESS_OWNER" } = body;
      const plan = await prisma.actionPlan.findUnique({
        where: { id: planId },
        include: { riskEvent: true },
      });
      if (!plan) {
        return NextResponse.json({ success: false, error: "Plan no encontrado" }, { status: 404 });
      }

      const crypto = await import("crypto");
      const fileHashSha256 = crypto
        .createHash("sha256")
        .update(`${fileName}-${Date.now()}-${planId}`)
        .digest("hex");

      const evidence = await prisma.actionPlanEvidence.create({
        data: {
          actionPlanId: planId,
          fileName,
          fileUrl: `/evidence/secured/${fileName}`,
          fileHashSha256,
          comments: comments || "Evidencia técnica de mitigación validada conforme a estándares B×+",
          approvedByUAIR: false,
        },
      });

      const updatedPlan = await prisma.actionPlan.update({
        where: { id: planId },
        data: {
          status: plan.status === "DRAFT" ? "IN_PROGRESS" : "EVIDENCE_SUBMITTED",
        },
        include: {
          riskEvent: {
            include: {
              process: true,
              processNode: true,
            },
          },
          evidences: true,
        },
      });

      const user =
        (await prisma.user.findFirst({ where: { role: userRole as RoleType } })) ||
        (await prisma.user.findFirst());

      if (user) {
        await recordAuditLog({
          userId: user.id,
          userRole: userRole as RoleType,
          actionType: "UPLOAD_CONTROL_EVIDENCE",
          entityName: "ActionPlanEvidence",
          entityId: evidence.id,
          previousState: null,
          newState: {
            planId,
            evidenceId: evidence.id,
            fileName,
            fileHashSha256,
          },
        });
      }

      return NextResponse.json({
        success: true,
        evidence,
        plan: updatedPlan,
        fileHashSha256,
      });
    }

    // =========================================================================
    // ACCIÓN 3: Cierre de Ciclo de Gobernanza 3LD — Verificación UAIR y Mitigación Real
    // =========================================================================
    if (action === "VERIFY_AND_APPLY_PLAN") {
      const { planId, userRole = "UAIR_ADMIN" } = body;
      const plan = await prisma.actionPlan.findUnique({
        where: { id: planId },
        include: {
          riskEvent: {
            include: {
              process: true,
              processNode: true,
              controls: { include: { control: true } },
            },
          },
          evidences: true,
        },
      });

      if (!plan) {
        return NextResponse.json({ success: false, error: "Plan no encontrado" }, { status: 404 });
      }

      // 1. Aprobar todas las evidencias del plan por 2ª Línea UAIR
      await prisma.actionPlanEvidence.updateMany({
        where: { actionPlanId: planId },
        data: { approvedByUAIR: true },
      });

      // 2. Actualizar ActionPlan a COMPLETED_VERIFIED y signedByBusinessHead
      const updatedPlan = await prisma.actionPlan.update({
        where: { id: planId },
        data: {
          status: "COMPLETED_VERIFIED",
          signedByBusinessHead: true,
        },
        include: {
          riskEvent: {
            include: {
              process: true,
              processNode: true,
            },
          },
          evidences: true,
        },
      });

      // 3. Mitigar el riesgo residual asociado en base de datos
      const risk = plan.riskEvent;
      let updatedRisk: any = null;

      if (risk) {
        const impPct = plan.improvementPotentialPct || 0.65;
        const reductionFactor = impPct * 0.45;
        const newProb = Math.max(1, Math.round(risk.residualProbability * (1 - reductionFactor)));
        const newImp = Math.max(1, Math.round(risk.residualImpact * (1 - reductionFactor)));
        const newScore = newProb * newImp;
        const newZone = mapScoreTo5x5Zone(newScore);

        const newPEA = Math.round(risk.expectedAnnualLossPEA * (1 - impPct * 0.7));
        const newPMA = Math.round(risk.maxAnnualLossPMA * (1 - impPct * 0.5));

        updatedRisk = await prisma.riskEvent.update({
          where: { id: risk.id },
          data: {
            residualProbability: newProb,
            residualImpact: newImp,
            residualScore: newScore,
            residualZone: newZone,
            expectedAnnualLossPEA: newPEA,
            maxAnnualLossPMA: newPMA,
          },
        });

        // 4. Formalizar controles asociados bajo CUB Art. 88
        if (plan.controlId) {
          await prisma.control.update({
            where: { id: plan.controlId },
            data: { isFormalized: true, hasValidEvidence: true },
          });
        }

        if (risk.controls && risk.controls.length > 0) {
          for (const rcm of risk.controls) {
            if (rcm.control && !rcm.control.isFormalized) {
              await prisma.control.update({
                where: { id: rcm.controlId },
                data: { isFormalized: true, hasValidEvidence: true },
              });
            }
          }
        }
      }

      const crypto = await import("crypto");
      const currentHash = crypto
        .createHash("sha256")
        .update(`${planId}-${Date.now()}-${userRole}-UAIR-VERIFIED`)
        .digest("hex");

      const user =
        (await prisma.user.findFirst({ where: { role: userRole as RoleType } })) ||
        (await prisma.user.findFirst());

      if (user) {
        await recordAuditLog({
          userId: user.id,
          userRole: userRole as RoleType,
          actionType: "UAIR_VERIFY_AND_APPLY_PLAN",
          entityName: "ActionPlan",
          entityId: plan.id,
          previousState: { status: plan.status },
          newState: {
            status: "COMPLETED_VERIFIED",
            currentHash,
            mitigatedRiskId: risk?.id,
            residualScore: updatedRisk?.residualScore,
            residualZone: updatedRisk?.residualZone,
          },
        });
      }

      return NextResponse.json({
        success: true,
        plan: updatedPlan,
        risk: updatedRisk,
        currentHash,
      });
    }

    // =========================================================================
    // ACCIÓN 4A: Previsualización de Planes con IA Gemini (Sin guardar en BD)
    // =========================================================================
    if (action === "AI_PREVIEW_PLANS_FOR_PROCESS") {
      const { processId } = body;
      const whereClause: any = {};
      if (processId && processId !== "ALL") {
        whereClause.processId = processId;
      }

      const risks = await prisma.riskEvent.findMany({
        where: whereClause,
        include: {
          process: true,
          processNode: true,
          actionPlans: true,
          controls: { include: { control: true } },
        },
        orderBy: [{ residualScore: "desc" }],
      });

      if (risks.length === 0) {
        return NextResponse.json(
          { success: false, error: "No se encontraron riesgos para el proceso seleccionado" },
          { status: 404 }
        );
      }

      // Priorizar candidatos del Radar de Brechas:
      // 1. Riesgos huérfanos sin ningún plan de acción
      // 2. Riesgos con controles No Formalizados (NF) bajo CUB Art. 88
      // 3. Riesgos en zonas de severidad RED / ORANGE
      const orphans = risks.filter((r) => r.actionPlans.length === 0);
      const withNF = risks.filter((r) => r.controls.some((c) => !c.control?.isFormalized));
      const priorityCandidates = Array.from(new Set([...orphans, ...withNF, ...risks]));
      const targetRisks = priorityCandidates.slice(0, 4);

      const firstProc = targetRisks[0]?.process;
      const procCode = firstProc?.code || (processId === "ALL" ? "PORTAFOLIO" : "PROC");
      const procName = firstProc?.name || (processId === "ALL" ? "Portafolio Consolidado" : "Proceso Bancario");

      const candidatesForAI: CandidateRiskForAI[] = targetRisks.map((r) => ({
        riskId: r.id,
        code: r.code,
        title: r.title,
        cause: r.cause,
        eventDescription: r.eventDescription,
        residualProbability: r.residualProbability,
        residualImpact: r.residualImpact,
        residualZone: r.residualZone,
        expectedAnnualLossPEA: r.expectedAnnualLossPEA,
        maxAnnualLossPMA: r.maxAnnualLossPMA,
        processCode: r.process?.code || procCode,
        processName: r.process?.name || procName,
        processNodeLabel: r.processNode?.label || "Paso Operativo",
        processNodeType: r.processNode?.nodeType || "TASK",
        hasNFControl: r.controls.some((c) => !c.control?.isFormalized),
        controlId: r.controls?.[0]?.controlId || null,
      }));

      const aiResult = await generateProcessPlanProposalsWithGemini(procCode, procName, candidatesForAI);

      return NextResponse.json({
        success: true,
        executiveDiagnosis: aiResult.executiveDiagnosis,
        proposals: aiResult.proposals,
        processCode: procCode,
        processName: procName,
        candidateCount: candidatesForAI.length,
      });
    }

    // =========================================================================
    // ACCIÓN 4B: Inserción en BD de Propuestas Seleccionadas por el Usuario
    // =========================================================================
    if (action === "AI_COMMIT_SELECTED_PLANS") {
      const { selectedProposals, processId, userRole = "UAIR_ADMIN", executiveDiagnosis } = body;

      if (!selectedProposals || !Array.isArray(selectedProposals) || selectedProposals.length === 0) {
        return NextResponse.json(
          { success: false, error: "No se proporcionaron propuestas válidas para insertar" },
          { status: 400 }
        );
      }

      const user =
        (await prisma.user.findFirst({ where: { role: userRole as RoleType } })) ||
        (await prisma.user.findFirst());
      if (!user) {
        return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 400 });
      }

      const createdPlans: any[] = [];

      for (const prop of selectedProposals) {
        const totalCount = await prisma.actionPlan.count();
        const code = `PA-2026-${String(totalCount + 1).padStart(3, "0")}`;

        const impPct = Number(prop.improvementPotentialPct) || 0.65;
        const days = Number(prop.estimatedDays) || 45;
        const cost = Number(prop.estimatedCostMXN) || 120000;
        const costScale = prop.costScale || (cost <= 100000 ? "LOW" : cost <= 400000 ? "MEDIUM" : "HIGH");
        const timeScale = days <= 45 ? "LOW" : days <= 90 ? "MEDIUM" : "HIGH";

        const isQW =
          prop.quadrant === "Q1_QUICK_WIN" ||
          (impPct >= 0.6 && days <= 90 && (costScale === "LOW" || costScale === "VERY_LOW"));

        const newPlan = await prisma.actionPlan.create({
          data: {
            code,
            title: prop.title,
            description: prop.description,
            planTypes: JSON.stringify(prop.planTypes || ["TECHNOLOGY"]),
            riskEventId: prop.riskEventId,
            controlId: prop.controlId || null,
            ownerId: user.id,
            improvementPotentialPct: impPct,
            estimatedCostMXN: cost,
            costScale,
            estimatedDays: days,
            timeScale,
            combinedEffortScore: isQW ? 2.0 : 3.5,
            expectedPEAReductionMXN: Number(prop.expectedPEAReductionMXN) || 0,
            expectedPMAReductionMXN: Number(prop.expectedPMAReductionMXN) || 0,
            isQuickWin: isQW,
            isSuggestedByAI: true,
            status: "DRAFT",
            dueDate: new Date(Date.now() + days * 24 * 3600 * 1000),
            signedByBusinessHead: false,
          },
          include: {
            riskEvent: {
              include: {
                businessUnit: true,
                taxonomy: true,
                process: { include: { macroProcess: true } },
                processNode: true,
                controls: { include: { control: true } },
              },
            },
            control: true,
            owner: true,
            evidences: true,
          },
        });

        createdPlans.push(newPlan);
      }

      await recordAuditLog({
        userId: user.id,
        userRole: userRole as RoleType,
        actionType: "AI_GENERATE_PROCESS_PLANS",
        entityName: "ActionPlan",
        entityId: processId || "PORTFOLIO",
        previousState: null,
        newState: {
          count: createdPlans.length,
          processId,
          planCodes: createdPlans.map((p) => p.code),
          executiveDiagnosis: executiveDiagnosis || null,
        },
      });

      return NextResponse.json({
        success: true,
        plans: createdPlans,
        count: createdPlans.length,
      });
    }

    // =========================================================================
    // ACCIÓN 4C: Compatibilidad Retroactiva para AI_SUGGEST_PLANS_FOR_PROCESS
    // =========================================================================
    if (action === "AI_SUGGEST_PLANS_FOR_PROCESS") {
      const { processId, userRole = "UAIR_ADMIN" } = body;
      const whereClause: any = {};
      if (processId && processId !== "ALL") {
        whereClause.processId = processId;
      }

      const risks = await prisma.riskEvent.findMany({
        where: whereClause,
        include: {
          process: true,
          processNode: true,
          actionPlans: true,
          controls: { include: { control: true } },
        },
        orderBy: [{ residualScore: "desc" }],
      });

      if (risks.length === 0) {
        return NextResponse.json(
          { success: false, error: "No se encontraron riesgos para el proceso seleccionado" },
          { status: 404 }
        );
      }

      const orphans = risks.filter((r) => r.actionPlans.length === 0);
      const candidates = orphans.length > 0 ? orphans : risks;
      const targetRisks = candidates.slice(0, 3);

      const user =
        (await prisma.user.findFirst({ where: { role: userRole as RoleType } })) ||
        (await prisma.user.findFirst());
      if (!user) {
        return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 400 });
      }

      const firstProc = targetRisks[0]?.process;
      const procCode = firstProc?.code || "PROC";
      const procName = firstProc?.name || "Proceso Bancario";

      const candidatesForAI: CandidateRiskForAI[] = targetRisks.map((r) => ({
        riskId: r.id,
        code: r.code,
        title: r.title,
        cause: r.cause,
        eventDescription: r.eventDescription,
        residualProbability: r.residualProbability,
        residualImpact: r.residualImpact,
        residualZone: r.residualZone,
        expectedAnnualLossPEA: r.expectedAnnualLossPEA,
        maxAnnualLossPMA: r.maxAnnualLossPMA,
        processCode: r.process?.code || procCode,
        processName: r.process?.name || procName,
        processNodeLabel: r.processNode?.label || "Paso Operativo",
        processNodeType: r.processNode?.nodeType || "TASK",
        hasNFControl: r.controls.some((c) => !c.control?.isFormalized),
        controlId: r.controls?.[0]?.controlId || null,
      }));

      const aiResult = await generateProcessPlanProposalsWithGemini(procCode, procName, candidatesForAI);

      const createdPlans: any[] = [];
      for (const prop of aiResult.proposals) {
        const totalCount = await prisma.actionPlan.count();
        const code = `PA-2026-${String(totalCount + 1).padStart(3, "0")}`;
        const impPct = prop.improvementPotentialPct;
        const days = prop.estimatedDays;
        const cost = prop.estimatedCostMXN;
        const costScale = prop.costScale;
        const isQW = prop.quadrant === "Q1_QUICK_WIN";

        const newPlan = await prisma.actionPlan.create({
          data: {
            code,
            title: prop.title,
            description: prop.description,
            planTypes: JSON.stringify(prop.planTypes),
            riskEventId: prop.riskEventId,
            controlId: prop.controlId || null,
            ownerId: user.id,
            improvementPotentialPct: impPct,
            estimatedCostMXN: cost,
            costScale,
            estimatedDays: days,
            timeScale: days <= 45 ? "LOW" : days <= 90 ? "MEDIUM" : "HIGH",
            combinedEffortScore: isQW ? 2.0 : 3.5,
            expectedPEAReductionMXN: prop.expectedPEAReductionMXN,
            expectedPMAReductionMXN: prop.expectedPMAReductionMXN,
            isQuickWin: isQW,
            isSuggestedByAI: true,
            status: "DRAFT",
            dueDate: new Date(Date.now() + days * 24 * 3600 * 1000),
            signedByBusinessHead: false,
          },
          include: {
            riskEvent: {
              include: {
                process: true,
                processNode: true,
              },
            },
            evidences: true,
          },
        });
        createdPlans.push(newPlan);
      }

      await recordAuditLog({
        userId: user.id,
        userRole: userRole as RoleType,
        actionType: "AI_GENERATE_PROCESS_PLANS",
        entityName: "ActionPlan",
        entityId: processId || "PORTFOLIO",
        previousState: null,
        newState: {
          count: createdPlans.length,
          processId,
          planCodes: createdPlans.map((p) => p.code),
        },
      });

      return NextResponse.json({
        success: true,
        plans: createdPlans,
        count: createdPlans.length,
      });
    }


    // =========================================================================
    // ACCIÓN 5: Crear Nuevo Plan de Acción Manual
    // =========================================================================
    const {
      title,
      description,
      planTypes = ["TECHNOLOGY"],
      riskEventId,
      controlId,
      improvementPotentialPct = 0.7,
      estimatedCostMXN = 100000,
      costScale = "LOW",
      estimatedDays = 45,
      timeScale = "LOW",
      dueDate,
      userRole = "PROCESS_OWNER",
    } = body;

    const risk = await prisma.riskEvent.findUnique({
      where: { id: riskEventId },
      include: { process: true, processNode: true },
    });
    if (!risk) {
      return NextResponse.json({ success: false, error: "Riesgo no encontrado" }, { status: 404 });
    }

    const count = await prisma.actionPlan.count();
    const code = `PA-2026-${String(count + 1).padStart(3, "0")}`;

    const numPct = Number(improvementPotentialPct);
    const expectedPEAReduction = risk.expectedAnnualLossPEA * numPct;
    const expectedPMAReduction = risk.maxAnnualLossPMA * numPct;

    // Criterio Quick-Win: Mejora >= 60% y esfuerzo Bajo/Muy Bajo (costo bajo y <= 90 días)
    const isQuickWin =
      numPct >= 0.60 &&
      (costScale === "VERY_LOW" || costScale === "LOW") &&
      Number(estimatedDays) <= 90;

    const user =
      (await prisma.user.findFirst({ where: { role: userRole as RoleType } })) ||
      (await prisma.user.findFirst());
    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 400 });
    }

    const newPlan = await prisma.actionPlan.create({
      data: {
        code,
        title,
        description,
        planTypes: JSON.stringify(planTypes),
        riskEventId,
        controlId: controlId || null,
        ownerId: user.id,
        improvementPotentialPct: numPct,
        estimatedCostMXN: Number(estimatedCostMXN),
        costScale,
        estimatedDays: Number(estimatedDays),
        timeScale,
        combinedEffortScore: Number(costScale === "VERY_LOW" ? 1.0 : costScale === "LOW" ? 2.0 : 3.5),
        expectedPEAReductionMXN: expectedPEAReduction,
        expectedPMAReductionMXN: expectedPMAReduction,
        isQuickWin,
        isSuggestedByAI: false,
        status: "DRAFT",
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 60 * 24 * 3600 * 1000),
        signedByBusinessHead: false,
      },
      include: {
        riskEvent: {
          include: {
            process: true,
            processNode: true,
          },
        },
        evidences: true,
      },
    });

    await recordAuditLog({
      userId: user.id,
      userRole: userRole as RoleType,
      actionType: "CREATE_ACTION_PLAN",
      entityName: "ActionPlan",
      entityId: newPlan.id,
      previousState: null,
      newState: newPlan,
    });

    return NextResponse.json({ success: true, plan: newPlan });
  } catch (error) {
    console.error("Error creating action plan:", error);
    return NextResponse.json({ success: false, error: "Error al procesar solicitud de plan de acción" }, { status: 500 });
  }
}
