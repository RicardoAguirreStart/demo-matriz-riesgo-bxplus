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

    // Acción 7: Eliminar proceso completo con sus dependencias
    if (action === "DELETE_PROCESS") {
      const { processId, userRole = "UAIR_ADMIN" } = body;
      if (!processId) {
        return NextResponse.json({ success: false, error: "processId requerido" }, { status: 400 });
      }

      const processToDelete = await prisma.process.findUnique({
        where: { id: processId },
      });

      if (!processToDelete) {
        return NextResponse.json({ success: false, error: "Proceso no encontrado" }, { status: 404 });
      }

      // 1. Desvincular controles de los nodos de este proceso
      const nodes = await prisma.processNode.findMany({ where: { processId }, select: { id: true } });
      const nodeIds = nodes.map((n) => n.id);

      if (nodeIds.length > 0) {
        await prisma.control.updateMany({
          where: { processNodeId: { in: nodeIds } },
          data: { processNodeId: null },
        });
      }

      // 2. Desvincular o eliminar riesgos asociados al proceso
      const risks = await prisma.riskEvent.findMany({ where: { processId }, select: { id: true } });
      const riskIds = risks.map((r) => r.id);

      if (riskIds.length > 0) {
        await prisma.riskControlMap.deleteMany({ where: { riskEventId: { in: riskIds } } });
        await prisma.kRI.deleteMany({ where: { riskEventId: { in: riskIds } } });
        await prisma.lossEvent.deleteMany({ where: { riskEventId: { in: riskIds } } });
        await prisma.actionPlan.deleteMany({ where: { riskEventId: { in: riskIds } } });
        await prisma.riskMatrixSnapshot.deleteMany({ where: { riskEventId: { in: riskIds } } });
        await prisma.riskEvent.deleteMany({ where: { id: { in: riskIds } } });
      }

      // 3. Eliminar aristas y nodos del proceso
      await prisma.processEdge.deleteMany({ where: { processId } });
      await prisma.processNode.deleteMany({ where: { processId } });
      await prisma.subProcess.deleteMany({ where: { processId } });

      // 4. Eliminar el proceso
      await prisma.process.delete({
        where: { id: processId },
      });

      // 5. Registrar en AuditLog SHA-256
      const user =
        (await prisma.user.findFirst({ where: { role: userRole as RoleType } })) ||
        (await prisma.user.findFirst());

      if (user) {
        await recordAuditLog({
          userId: user.id,
          userRole: userRole as RoleType,
          actionType: "DELETE_PROCESS",
          entityName: "Process",
          entityId: processId,
          previousState: { code: processToDelete.code, name: processToDelete.name },
          newState: null,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Proceso "${processToDelete.name}" (${processToDelete.code}) eliminado exitosamente.`,
      });
    }

    return NextResponse.json({ success: false, error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    console.error("Error in /api/processes:", error);
    return NextResponse.json({ success: false, error: "Error al procesar solicitud" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const processId = searchParams.get("processId");

    if (!processId) {
      return NextResponse.json({ success: false, error: "processId requerido" }, { status: 400 });
    }

    const processToDelete = await prisma.process.findUnique({
      where: { id: processId },
    });

    if (!processToDelete) {
      return NextResponse.json({ success: false, error: "Proceso no encontrado" }, { status: 404 });
    }

    // 1. Desvincular controles de los nodos
    const nodes = await prisma.processNode.findMany({ where: { processId }, select: { id: true } });
    const nodeIds = nodes.map((n) => n.id);

    if (nodeIds.length > 0) {
      await prisma.control.updateMany({
        where: { processNodeId: { in: nodeIds } },
        data: { processNodeId: null },
      });
    }

    // 2. Eliminar riesgos asociados al proceso
    const risks = await prisma.riskEvent.findMany({ where: { processId }, select: { id: true } });
    const riskIds = risks.map((r) => r.id);

    if (riskIds.length > 0) {
      await prisma.riskControlMap.deleteMany({ where: { riskEventId: { in: riskIds } } });
      await prisma.kRI.deleteMany({ where: { riskEventId: { in: riskIds } } });
      await prisma.lossEvent.deleteMany({ where: { riskEventId: { in: riskIds } } });
      await prisma.actionPlan.deleteMany({ where: { riskEventId: { in: riskIds } } });
      await prisma.riskMatrixSnapshot.deleteMany({ where: { riskEventId: { in: riskIds } } });
      await prisma.riskEvent.deleteMany({ where: { id: { in: riskIds } } });
    }

    // 3. Eliminar aristas, nodos y subprocesos
    await prisma.processEdge.deleteMany({ where: { processId } });
    await prisma.processNode.deleteMany({ where: { processId } });
    await prisma.subProcess.deleteMany({ where: { processId } });

    // 4. Eliminar el proceso
    await prisma.process.delete({
      where: { id: processId },
    });

    // 5. Auditoría SHA-256
    const user = await prisma.user.findFirst();
    if (user) {
      await recordAuditLog({
        userId: user.id,
        userRole: user.role as RoleType,
        actionType: "DELETE_PROCESS",
        entityName: "Process",
        entityId: processId,
        previousState: { code: processToDelete.code, name: processToDelete.name },
        newState: null,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Proceso "${processToDelete.name}" (${processToDelete.code}) eliminado exitosamente.`,
    });
  } catch (error) {
    console.error("Error deleting process:", error);
    return NextResponse.json({ success: false, error: "Error al eliminar proceso" }, { status: 500 });
  }
}

