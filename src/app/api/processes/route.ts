// src/app/api/processes/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { RoleType } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const processId = searchParams.get("processId");

    if (processId) {
      const process = await prisma.process.findUnique({
        where: { id: processId },
        include: {
          macroProcess: true,
          owner: true,
          flowNodes: {
            include: {
              riskEvents: {
                include: {
                  taxonomy: true,
                  controls: { include: { control: true } },
                },
              },
              controls: true,
            },
          },
          flowEdges: true,
        },
      });

      return NextResponse.json({ success: true, process });
    }

    const processes = await prisma.process.findMany({
      include: {
        macroProcess: {
          include: {
            businessUnit: true,
          },
        },
        _count: {
          select: {
            flowNodes: true,
            riskEvents: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ success: true, processes });
  } catch (error) {
    console.error("Error fetching processes:", error);
    return NextResponse.json({ success: false, error: "Error al consultar procesos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Acción 1: Actualizar posiciones de nodos en el Canvas (Drag & Drop)
    if (action === "UPDATE_NODE_POSITIONS") {
      const { nodes } = body; // Array of { id, positionX, positionY }
      for (const n of nodes) {
        await prisma.processNode.update({
          where: { id: n.id },
          data: {
            positionX: n.positionX,
            positionY: n.positionY,
          },
        });
      }
      return NextResponse.json({ success: true, message: "Posiciones guardadas" });
    }

    // Acción 2: Agregar nuevo nodo al proceso
    if (action === "CREATE_NODE") {
      const { processId, label, description, nodeType, creditStage, responsibleRole, systemUsed, positionX, positionY } = body;
      const newNode = await prisma.processNode.create({
        data: {
          processId,
          label,
          description,
          nodeType: nodeType || "TASK_STEP",
          creditStage: creditStage || "NOT_APPLICABLE",
          responsibleRole,
          systemUsed,
          positionX: Number(positionX) || 100,
          positionY: Number(positionY) || 100,
        },
      });
      return NextResponse.json({ success: true, node: newNode });
    }

    // Acción 3: Conectar nodos (crear edge)
    if (action === "CREATE_EDGE") {
      const { processId, sourceNodeId, targetNodeId, conditionLabel } = body;
      const newEdge = await prisma.processEdge.create({
        data: {
          processId,
          sourceNodeId,
          targetNodeId,
          conditionLabel,
          animated: true,
        },
      });
      return NextResponse.json({ success: true, edge: newEdge });
    }

    return NextResponse.json({ success: false, error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    console.error("Error in /api/processes:", error);
    return NextResponse.json({ success: false, error: "Error al procesar solicitud" }, { status: 500 });
  }
}
