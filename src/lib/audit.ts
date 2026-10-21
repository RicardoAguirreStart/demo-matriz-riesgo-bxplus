// src/lib/audit.ts

import crypto from "crypto";
import { prisma } from "@/lib/db";
import { RoleType } from "@/types";

export interface CreateAuditLogParams {
  userId: string;
  userRole: RoleType;
  actionType: string;
  entityName: string;
  entityId: string;
  previousState?: unknown;
  newState?: unknown;
  ipAddress?: string;
}

export function generateEntryHash(
  previousHash: string,
  timestamp: string,
  userId: string,
  actionType: string,
  newStateJson: string
): string {
  const payload = `${previousHash}|${timestamp}|${userId}|${actionType}|${newStateJson}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export async function recordAuditLog(params: CreateAuditLogParams) {
  try {
    // 1. Obtener el último hash de la cadena (o el génesis si es el primer registro)
    const lastLog = await prisma.auditLog.findFirst({
      orderBy: { timestamp: "desc" },
      select: { currentHash: true },
    });

    const previousHash =
      lastLog?.currentHash ??
      "0000000000000000000000000000000000000000000000000000000000000000_GENESIS_BANCO_BX_PLUS";

    const timestamp = new Date();
    const timestampStr = timestamp.toISOString();
    const previousStateJson = params.previousState ? JSON.stringify(params.previousState) : null;
    const newStateJson = params.newState ? JSON.stringify(params.newState) : "{}";

    // 2. Calcular el nuevo hash inalterable
    const currentHash = generateEntryHash(
      previousHash,
      timestampStr,
      params.userId,
      params.actionType,
      newStateJson
    );

    // 3. Persistir en la bitácora
    const log = await prisma.auditLog.create({
      data: {
        timestamp,
        userId: params.userId,
        userRole: params.userRole,
        actionType: params.actionType,
        entityName: params.entityName,
        entityId: params.entityId,
        previousStateJson,
        newStateJson,
        ipAddress: params.ipAddress ?? "127.0.0.1 (Localhost)",
        previousHash,
        currentHash,
      },
    });

    return log;
  } catch (error) {
    console.error("Error al registrar AuditLog:", error);
    return null;
  }
}
