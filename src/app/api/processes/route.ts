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
          macroProcess: {
            include: {
              businessUnit: true,
            },
          },
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
      const { processId, label, description, nodeType, creditStage, responsibleRole, systemUsed, positionX, positionY, styleConfig } = body;
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
          styleConfig: typeof styleConfig === "string" ? styleConfig : styleConfig ? JSON.stringify(styleConfig) : null,
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
          conditionLabel: conditionLabel || null,
          animated: true,
        },
      });
      return NextResponse.json({ success: true, edge: newEdge });
    }

    // Acción 4: Crear figura conectada automáticamente (Estilo Miro / Canva con botón "+")
    if (action === "CREATE_CONNECTED_NODE") {
      const {
        processId,
        sourceNodeId,
        nodeType = "TASK_STEP",
        label,
        description,
        responsibleRole,
        systemUsed,
        creditStage = "NOT_APPLICABLE",
        conditionLabel,
        positionX,
        positionY,
        styleConfig,
      } = body;

      const sourceNode = await prisma.processNode.findUnique({ where: { id: sourceNodeId } });
      const nextX = positionX !== undefined ? Number(positionX) : sourceNode ? sourceNode.positionX + 320 : 200;
      const nextY = positionY !== undefined ? Number(positionY) : sourceNode ? sourceNode.positionY : 100;

      const newNode = await prisma.processNode.create({
        data: {
          processId,
          label: label || `Nuevo ${nodeType}`,
          description: description || null,
          nodeType,
          creditStage,
          responsibleRole: responsibleRole || (sourceNode ? sourceNode.responsibleRole : "ANALYSIS"),
          systemUsed: systemUsed || (sourceNode ? sourceNode.systemUsed : "Core Bancario T24"),
          positionX: nextX,
          positionY: nextY,
          styleConfig: typeof styleConfig === "string" ? styleConfig : styleConfig ? JSON.stringify(styleConfig) : null,
        },
      });

      const newEdge = await prisma.processEdge.create({
        data: {
          processId,
          sourceNodeId,
          targetNodeId: newNode.id,
          conditionLabel: conditionLabel || null,
          animated: true,
        },
      });

      return NextResponse.json({ success: true, node: newNode, edge: newEdge });
    }

    // Acción 5: Actualizar datos y configuración contextual del nodo (Inspector Drawer)
    if (action === "UPDATE_NODE") {
      const {
        nodeId,
        label,
        description,
        nodeType,
        creditStage,
        responsibleRole,
        systemUsed,
        styleConfig,
        outgoingConditionLabel,
      } = body;

      const updatedNode = await prisma.processNode.update({
        where: { id: nodeId },
        data: {
          ...(label !== undefined && { label }),
          ...(description !== undefined && { description }),
          ...(nodeType !== undefined && { nodeType }),
          ...(creditStage !== undefined && { creditStage }),
          ...(responsibleRole !== undefined && { responsibleRole }),
          ...(systemUsed !== undefined && { systemUsed }),
          ...(styleConfig !== undefined && {
            styleConfig: typeof styleConfig === "string" ? styleConfig : JSON.stringify(styleConfig),
          }),
        },
      });

      // Si se envía actualización de condición para la arista saliente
      if (outgoingConditionLabel !== undefined) {
        const edge = await prisma.processEdge.findFirst({ where: { sourceNodeId: nodeId } });
        if (edge) {
          await prisma.processEdge.update({
            where: { id: edge.id },
            data: { conditionLabel: outgoingConditionLabel },
          });
        }
      }

      return NextResponse.json({ success: true, node: updatedNode });
    }

    // Acción 6: Eliminar nodo del proceso
    if (action === "DELETE_NODE") {
      const { nodeId } = body;
      await prisma.processNode.delete({
        where: { id: nodeId },
      });
      return NextResponse.json({ success: true, message: "Nodo eliminado correctamente" });
    }

    return NextResponse.json({ success: false, error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    console.error("Error in /api/processes:", error);
    return NextResponse.json({ success: false, error: "Error al procesar solicitud" }, { status: 500 });
  }
}
