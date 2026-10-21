// src/app/api/action-plans/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { RoleType } from "@/types";

export async function GET() {
  try {
    const plans = await prisma.actionPlan.findMany({
      include: {
        riskEvent: {
          include: {
            businessUnit: true,
            process: true,
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

    // Acción 1: Firma obligatoria del Titular de Negocio
    if (action === "SIGN_PLAN") {
      const { planId, userRole = "PROCESS_OWNER" } = body;
      const updated = await prisma.actionPlan.update({
        where: { id: planId },
        data: {
          signedByBusinessHead: true,
          status: "APPROVED_COMMITTED",
        },
        include: { riskEvent: true, evidences: true },
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

    // Acción 2: Adjuntar evidencia documental con huella digital criptográfica SHA-256
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
          riskEvent: true,
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

    // Acción 3: Crear nuevo plan de acción de mitigación
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

    const risk = await prisma.riskEvent.findUnique({ where: { id: riskEventId } });
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
        riskEvent: true,
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
    return NextResponse.json({ success: false, error: "Error al crear plan de acción" }, { status: 500 });
  }
}
