// src/app/api/copilot/audit-node/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auditProcessNodeWithAI } from "@/lib/ai/gemini";
import { recordAuditLog } from "@/lib/audit";
import { RoleType } from "@/types";

export async function POST(request: Request) {
  try {
    const { nodeId, userRole = "UAIR_ADMIN" } = await request.json();

    const node = await prisma.processNode.findUnique({
      where: { id: nodeId },
      include: {
        riskEvents: {
          include: {
            taxonomy: true,
            controls: { include: { control: true } },
          },
        },
        controls: true,
        process: true,
      },
    });

    if (!node) {
      return NextResponse.json({ success: false, error: "Nodo no encontrado" }, { status: 404 });
    }

    const auditResult = await auditProcessNodeWithAI(
      {
        label: node.label,
        description: node.description || undefined,
        nodeType: node.nodeType,
        responsibleRole: node.responsibleRole || undefined,
        systemUsed: node.systemUsed || undefined,
      },
      node.riskEvents
    );

    const user = await prisma.user.findFirst({ where: { role: userRole as RoleType } }) || await prisma.user.findFirst();
    if (user) {
      await recordAuditLog({
        userId: user.id,
        userRole: userRole as RoleType,
        actionType: "AI_NODE_AUDIT",
        entityName: "ProcessNode",
        entityId: node.id,
        previousState: null,
        newState: auditResult,
      });
    }

    return NextResponse.json({ success: true, node, auditResult });
  } catch (error) {
    console.error("Error in audit-node:", error);
    return NextResponse.json({ success: false, error: "Error al auditar nodo con IA" }, { status: 500 });
  }
}
