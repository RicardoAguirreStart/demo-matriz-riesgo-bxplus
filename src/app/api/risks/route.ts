// src/app/api/risks/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateOperationalRiskMetrics } from "@/lib/engines/operational-risk-engine";
import { recordAuditLog } from "@/lib/audit";
import { RoleType } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessLine = searchParams.get("businessLine");
    const zone = searchParams.get("zone");
    const riskType = searchParams.get("riskType");
    const search = searchParams.get("search");

    const where: any = {};

    if (businessLine && businessLine !== "ALL") {
      where.businessUnit = { businessLine };
    }

    if (zone && zone !== "ALL") {
      where.residualZone = zone;
    }

    if (riskType && riskType !== "ALL") {
      where.taxonomy = { riskType };
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { title: { contains: search } },
        { cause: { contains: search } },
        { eventDescription: { contains: search } },
      ];
    }

    const risks = await prisma.riskEvent.findMany({
      where,
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
      orderBy: { criticalityRankScore: "desc" },
    });

    return NextResponse.json({ success: true, risks });
  } catch (error) {
    console.error("Error fetching risks:", error);
    return NextResponse.json({ success: false, error: "Error al consultar matriz viva" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      cause,
      eventDescription,
      consequence,
      taxonomyId,
      origin,
      businessUnitId,
      processId,
      processNodeId,
      inherentProbability,
      inherentImpact,
      combinedControlFactor = 0.3,
      annualFrequencyNet = 0.5,
      avgFinancialImpactMXN = 1000000,
      worstCaseImpactMXN = 3000000,
      reputationalImpactLevel = 3,
      isEmergingRisk = false,
      speiImpact = false,
      cyberAttackVector,
      esgSectorSHCP,
      userRole = "PROCESS_OWNER",
      status = "PUBLISHED",
    } = body;

    // 1. Ejecutar motor de cálculo determinista CNBV
    const metrics = calculateOperationalRiskMetrics({
      inherentProbability: Number(inherentProbability),
      inherentImpact: Number(inherentImpact),
      combinedControlFactor: Number(combinedControlFactor),
      annualFrequencyNet: Number(annualFrequencyNet),
      avgFinancialImpactMXN: Number(avgFinancialImpactMXN),
      worstCaseImpactMXN: Number(worstCaseImpactMXN),
    });

    // 2. Generar código consecutivo de riesgo
    const count = await prisma.riskEvent.count();
    const code = `RSK-BX-${String(count + 1).padStart(3, "0")}`;

    // 3. Obtener usuario creador
    const defaultUser = await prisma.user.findFirst({
      where: { role: userRole as RoleType },
    }) || await prisma.user.findFirst();

    if (!defaultUser) {
      return NextResponse.json({ success: false, error: "No se encontró usuario de gobernanza" }, { status: 400 });
    }

    // 4. Crear registro en Matriz Viva
    const newRisk = await prisma.riskEvent.create({
      data: {
        code,
        title,
        cause,
        eventDescription,
        consequence,
        taxonomyId,
        origin,
        businessUnitId,
        processId,
        processNodeId: processNodeId || null,
        ownerId: defaultUser.id,
        inherentProbability: Number(inherentProbability),
        inherentImpact: Number(inherentImpact),
        inherentScore: metrics.inherentScore,
        inherentZone: metrics.inherentZone,
        controlMitigationFactor: Number(combinedControlFactor),
        residualProbability: metrics.residualProbability,
        residualImpact: metrics.residualImpact,
        residualScore: metrics.residualScore,
        residualZone: metrics.residualZone,
        annualFrequencyNet: Number(annualFrequencyNet),
        avgFinancialImpactMXN: Number(avgFinancialImpactMXN),
        worstCaseImpactMXN: Number(worstCaseImpactMXN),
        expectedAnnualLossPEA: metrics.expectedAnnualLossPEA,
        maxAnnualLossPMA: metrics.maxAnnualLossPMA,
        reputationalImpactLevel: Number(reputationalImpactLevel),
        isEmergingRisk: Boolean(isEmergingRisk),
        speiImpact: Boolean(speiImpact),
        cyberAttackVector: cyberAttackVector || null,
        esgSectorSHCP: esgSectorSHCP || null,
        status: status || "PUBLISHED",
        criticalityRankScore: Number((metrics.residualScore * 2.5 + (isEmergingRisk ? 15 : 0)).toFixed(1)),
      },
      include: {
        taxonomy: true,
        businessUnit: true,
        process: true,
      },
    });

    // 5. Sellar entrada en Audit Trail Criptográfico SHA-256
    await recordAuditLog({
      userId: defaultUser.id,
      userRole: userRole as RoleType,
      actionType: "CREATE_RISK",
      entityName: "RiskEvent",
      entityId: newRisk.id,
      previousState: null,
      newState: newRisk,
    });

    return NextResponse.json({ success: true, risk: newRisk });
  } catch (error) {
    console.error("Error creating risk:", error);
    return NextResponse.json({ success: false, error: "Error al dar de alta el riesgo" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { riskId, action = "APPROVE_AND_PUBLISH", userRole = "UAIR_ADMIN" } = body;

    const risk = await prisma.riskEvent.findUnique({
      where: { id: riskId },
      include: { taxonomy: true, businessUnit: true, process: true },
    });

    if (!risk) {
      return NextResponse.json({ success: false, error: "Riesgo no encontrado" }, { status: 404 });
    }

    const user =
      (await prisma.user.findFirst({ where: { role: userRole as RoleType } })) ||
      (await prisma.user.findFirst());

    if (action === "APPROVE_AND_PUBLISH") {
      const updatedRisk = await prisma.riskEvent.update({
        where: { id: riskId },
        data: { status: "PUBLISHED" },
        include: { taxonomy: true, businessUnit: true, process: true },
      });

      if (user) {
        await recordAuditLog({
          userId: user.id,
          userRole: userRole as RoleType,
          actionType: "APPROVE_AND_PUBLISH_RISK",
          entityName: "RiskEvent",
          entityId: updatedRisk.id,
          previousState: { status: risk.status },
          newState: { status: updatedRisk.status, approvedBy: user.fullName },
        });
      }

      return NextResponse.json({ success: true, risk: updatedRisk });
    }

    return NextResponse.json({ success: false, error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    console.error("Error updating risk status:", error);
    return NextResponse.json({ success: false, error: "Error al actualizar estado del riesgo" }, { status: 500 });
  }
}
