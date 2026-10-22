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

/**
 * Elimina un proceso bancario y ejecuta la cascada exhaustiva en transacción atómica:
 * 1. Desvincula controles asociados a los nodos del proceso.
 * 2. Identifica todos los riesgos asociados (por processId o por processNodeId).
 * 3. Elimina en orden estricto de integridad referencial:
 *    - Mapeos de control (RiskControlMap)
 *    - Evidencias de planes de acción (ActionPlanEvidence)
 *    - Planes de acción (ActionPlan)
 *    - Mediciones de KRI (KRIMeasurement)
 *    - Indicadores KRI (KRI)
 *    - Eventos de pérdida (LossEvent)
 *    - Snapshots históricos (RiskMatrixSnapshot)
 *    - Eventos de riesgo (RiskEvent)
 * 4. Elimina conectores de diagrama (ProcessEdge)
 * 5. Elimina nodos de diagrama (ProcessNode)
 * 6. Elimina subprocesos (SubProcess)
 * 7. Elimina el proceso bancario (Process)
 * 8. Registra evento inalterable en Bitácora de Auditoría (AuditLog con SHA-256)
 */
async function deleteProcessWithCascade(processId: string, userRole: RoleType = "UAIR_ADMIN") {
  const processToDelete = await prisma.process.findUnique({
    where: { id: processId },
    include: {
      macroProcess: true,
      _count: {
        select: {
          flowNodes: true,
          flowEdges: true,
          riskEvents: true,
        },
      },
    },
  });

  if (!processToDelete) {
    return { success: false, status: 404, error: "Proceso no encontrado" };
  }

  // Ejecución transaccional atómica
  await prisma.$transaction(async (tx) => {
    // 1. Obtener nodos
    const nodes = await tx.processNode.findMany({
      where: { processId },
      select: { id: true },
    });
    const nodeIds = nodes.map((n) => n.id);

    // 2. Desvincular controles asignados a estos nodos
    if (nodeIds.length > 0) {
      await tx.control.updateMany({
        where: { processNodeId: { in: nodeIds } },
        data: { processNodeId: null },
      });
    }

    // 3. Localizar todos los riesgos vinculados (por processId o por sus nodos)
    const risks = await tx.riskEvent.findMany({
      where: {
        OR: [
          { processId },
          ...(nodeIds.length > 0 ? [{ processNodeId: { in: nodeIds } }] : []),
        ],
      },
      select: { id: true },
    });
    const riskIds = risks.map((r) => r.id);

    if (riskIds.length > 0) {
      // 3.1 Mapeos de control
      await tx.riskControlMap.deleteMany({
        where: { riskEventId: { in: riskIds } },
      });

      // 3.2 Evidencias de planes y planes de acción
      const plans = await tx.actionPlan.findMany({
        where: { riskEventId: { in: riskIds } },
        select: { id: true },
      });
      const planIds = plans.map((p) => p.id);
      if (planIds.length > 0) {
        await tx.actionPlanEvidence.deleteMany({
          where: { actionPlanId: { in: planIds } },
        });
        await tx.actionPlan.deleteMany({
          where: { id: { in: planIds } },
        });
      }

      // 3.3 Mediciones de KRIs y KRIs
      const kris = await tx.kRI.findMany({
        where: { riskEventId: { in: riskIds } },
        select: { id: true },
      });
      const kriIds = kris.map((k) => k.id);
      if (kriIds.length > 0) {
        await tx.kRIMeasurement.deleteMany({
          where: { kriId: { in: kriIds } },
        });
        await tx.kRI.deleteMany({
          where: { id: { in: kriIds } },
        });
      }

      // 3.4 Eventos de pérdida
      await tx.lossEvent.deleteMany({
        where: { riskEventId: { in: riskIds } },
      });

      // 3.5 Snapshots de matriz 5x5
      await tx.riskMatrixSnapshot.deleteMany({
        where: { riskEventId: { in: riskIds } },
      });

      // 3.6 Eventos de riesgo
      await tx.riskEvent.deleteMany({
        where: { id: { in: riskIds } },
      });
    }

    // 4. Conectores de flujo
    await tx.processEdge.deleteMany({
      where: { processId },
    });

    // 5. Nodos de flujo
    await tx.processNode.deleteMany({
      where: { processId },
    });

    // 6. Subprocesos
    await tx.subProcess.deleteMany({
      where: { processId },
    });

    // 7. Proceso
    await tx.process.delete({
      where: { id: processId },
    });
  });

  // 8. Registro de auditoría criptográfica SHA-256
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
      previousState: {
        code: processToDelete.code,
        name: processToDelete.name,
        macroProcess: processToDelete.macroProcess?.name,
        nodesCount: processToDelete._count.flowNodes,
        risksCount: processToDelete._count.riskEvents,
      },
      newState: null,
    });
  }

  return {
    success: true,
    message: `Proceso "${processToDelete.name}" (${processToDelete.code}) y todas sus dependencias (riesgos, planes, KRIs y nodos) eliminados exitosamente.`,
    deletedProcessId: processId,
    deletedProcessCode: processToDelete.code,
  };
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

      const result = await deleteProcessWithCascade(processId, userRole as RoleType);
      return NextResponse.json(result, { status: (result as any).status || (result.success ? 200 : 400) });
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
    const userRole = (searchParams.get("userRole") as RoleType) || "UAIR_ADMIN";

    if (!processId) {
      return NextResponse.json({ success: false, error: "processId requerido" }, { status: 400 });
    }

    const result = await deleteProcessWithCascade(processId, userRole);
    return NextResponse.json(result, { status: (result as any).status || (result.success ? 200 : 400) });
  } catch (error) {
    console.error("Error deleting process:", error);
    return NextResponse.json({ success: false, error: "Error al eliminar proceso" }, { status: 500 });
  }
}

