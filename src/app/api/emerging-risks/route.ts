// src/app/api/emerging-risks/route.ts
/**
 * API Route para la Matriz Cúbica de Riesgos Emergentes (5x5x5)
 * Conexión nativa con el Motor Cuantitativo en Python (scripts/emerging_risk_cube_engine.py)
 * Banco Ve por Más (B×+)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { RoleType } from "@/types";
import {
  EMERGING_CATEGORIES,
  EmergingCategoryCode,
  EmergingRiskInput,
  executeEmergingRiskCubeEngine,
} from "@/lib/engines/emerging-risk-cube-engine";

/**
 * Mapeo heurístico inteligente para asignar una de las 8 categorías emergentes
 * a cualquier riesgo según su taxonomía, código, título o vector de ataque.
 */
function inferEmergingCategory(risk: any): EmergingCategoryCode {
  if (risk.cyberAttackVector) {
    try {
      const parsed = JSON.parse(risk.cyberAttackVector);
      if (parsed.emergingCategory && EMERGING_CATEGORIES[parsed.emergingCategory as EmergingCategoryCode]) {
        return parsed.emergingCategory as EmergingCategoryCode;
      }
    } catch {
      // not json, continue
    }
  }

  const code = (risk.code || "").toUpperCase();
  const title = (risk.title || "").toLowerCase();
  const taxType = (risk.taxonomy?.riskType || "").toUpperCase();

  if (code.includes("TECH") || title.includes("nube") || title.includes("cloud") || title.includes("proveedor core") || title.includes("concentración")) {
    return "TECH_CONCENTRATION";
  }
  if (code.includes("CYBER") || title.includes("ransomware") || title.includes("zero-day") || title.includes("ciber") || taxType === "CYBERSECURITY") {
    return "CYBER_ADVANCED";
  }
  if (code.includes("FRAUD") || title.includes("fraude") || title.includes("deepfake") || title.includes("biométr") || title.includes("suplantación") || taxType === "FRAUD_INTERNAL_EXTERNAL") {
    return "DIGITAL_FRAUD";
  }
  if (code.includes("SYS") || title.includes("contagio") || title.includes("efecto dominó") || title.includes("inter-procesos") || title.includes("sistémico")) {
    return "SYSTEMIC_CONTAGION";
  }
  if (code.includes("3RD") || title.includes("terceros") || title.includes("proveedores") || title.includes("notar") || title.includes("avalúo")) {
    return "THIRD_PARTY_EXTENDED";
  }
  if (code.includes("ASG") || code.includes("CLIM") || title.includes("sequía") || title.includes("climátic") || title.includes("dnsh") || taxType === "ESG_CLIMATE") {
    return "CLIMATE_FINANCIAL";
  }
  if (code.includes("LIQ") || title.includes("liquidez") || title.includes("corrida") || title.includes("retiro") || title.includes("viral") || taxType === "LIQUIDITY") {
    return "DIGITAL_LIQUIDITY";
  }
  if (code.includes("AI") || code.includes("MOD") || title.includes("modelo") || title.includes("algorit") || title.includes("inteligencia artificial") || title.includes("datos")) {
    return "MODEL_DATA_AI";
  }

  // Fallback por tipo de taxonomía
  if (taxType === "TECHNOLOGICAL") return "TECH_CONCENTRATION";
  if (taxType === "LEGAL") return "THIRD_PARTY_EXTENDED";
  if (taxType === "REPUTATIONAL") return "DIGITAL_LIQUIDITY";
  if (taxType === "CREDIT") return "MODEL_DATA_AI";
  return "SYSTEMIC_CONTAGION";
}

/**
 * Genera coordenadas iniciales 3D coherentes y realistas para cada categoría emergente.
 */
function getDefault3DCoordinates(category: EmergingCategoryCode, risk: any): { x: number; y: number; z: number } {
  if (risk.cyberAttackVector) {
    try {
      const parsed = JSON.parse(risk.cyberAttackVector);
      if (parsed.x && parsed.y && parsed.z) {
        return {
          x: Math.max(1, Math.min(5, Number(parsed.x))),
          y: Math.max(1, Math.min(5, Number(parsed.y))),
          z: Math.max(1, Math.min(5, Number(parsed.z))),
        };
      }
    } catch {
      // not json
    }
  }

  switch (category) {
    case "CYBER_ADVANCED":
      return { x: 5, y: 4, z: 5 }; // Ataque Zero-day: Alto contagio, alta velocidad (instantánea)
    case "TECH_CONCENTRATION":
      return { x: 4, y: 3, z: 4 }; // Falla de nube: Alto contagio institucional, velocidad aguda
    case "DIGITAL_FRAUD":
      return { x: 4, y: 4, z: 5 }; // Deepfakes / SPEI: Instantáneo, alta incertidumbre
    case "SYSTEMIC_CONTAGION":
      return { x: 5, y: 3, z: 3 }; // Contagio inter-procesos: Crítico en X, velocidad semanal
    case "THIRD_PARTY_EXTENDED":
      return { x: 3, y: 4, z: 3 }; // Falla en terceros notaría/valuadores: Incertidumbre alta
    case "CLIMATE_FINANCIAL":
      return { x: 4, y: 3, z: 2 }; // Sequía/choque hídrico: Contagio regional, gradual (meses)
    case "DIGITAL_LIQUIDITY":
      return { x: 5, y: 4, z: 5 }; // Corrida digital viral: Contagio sistémico, velocidad en horas
    case "MODEL_DATA_AI":
      return { x: 3, y: 5, z: 4 }; // Alucinación / deriva algorítmica: Máxima incertidumbre
    default:
      return { x: 3, y: 3, z: 3 };
  }
}

/**
 * Asegura que las 8 categorías emergentes estén representadas en la base de datos.
 */
async function ensureAll8EmergingCategoriesSeeded() {
  try {
    const existingRisks = await prisma.riskEvent.findMany({
      include: { taxonomy: true, process: true },
    });

    const coveredCategories = new Set<string>();
    existingRisks.forEach((r) => {
      coveredCategories.add(inferEmergingCategory(r));
    });

    // Identificar qué categorías faltan de las 8
    const allCatCodes: EmergingCategoryCode[] = [
      "TECH_CONCENTRATION",
      "CYBER_ADVANCED",
      "DIGITAL_FRAUD",
      "SYSTEMIC_CONTAGION",
      "THIRD_PARTY_EXTENDED",
      "CLIMATE_FINANCIAL",
      "DIGITAL_LIQUIDITY",
      "MODEL_DATA_AI",
    ];

    const missingCats = allCatCodes.filter((c) => !coveredCategories.has(c));
    if (missingCats.length === 0) return;

    // Buscar procesos base y usuarios
    const [procTI, procTES, procCRED, procAGRO] = await Promise.all([
      prisma.process.findFirst({ where: { code: "PR-TI-01" }, include: { flowNodes: true, macroProcess: { include: { businessUnit: true } } } }),
      prisma.process.findFirst({ where: { code: "PR-TES-01" }, include: { flowNodes: true, macroProcess: { include: { businessUnit: true } } } }),
      prisma.process.findFirst({ where: { code: "PR-CRED-02" }, include: { flowNodes: true, macroProcess: { include: { businessUnit: true } } } }),
      prisma.process.findFirst({ where: { code: "PR-AGRO-01" }, include: { flowNodes: true, macroProcess: { include: { businessUnit: true } } } }),
    ]);

    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) return;

    const taxonomyMap: Record<string, any> = {};
    const allTax = await prisma.riskTaxonomy.findMany();
    allTax.forEach((t) => {
      taxonomyMap[t.riskType] = t;
    });

    for (const cat of missingCats) {
      let targetProc = procTI || procTES || procCRED || procAGRO;
      let targetTax = taxonomyMap["TECHNOLOGICAL"] || allTax[0];
      let code = "RSK-EMG-001";
      let title = "Amenaza Emergente";
      let cause = "Vector emergente no lineal";
      let eventDesc = "Evento sistémico emergente";
      let consequence = "Impacto en capital y continuidad operativa";

      if (cat === "TECH_CONCENTRATION") {
        targetProc = procTI || targetProc;
        targetTax = taxonomyMap["TECHNOLOGICAL"] || targetTax;
        code = "RSK-TECH-030";
        title = "Concentración Crítica en Proveedor Cloud Único con Riesgo de Vendor Lock-in";
        cause = "Inexistencia de arquitectura multi-cloud activa y dependencia exclusiva de APIs propietarias del hipervisor.";
        eventDesc = "Interrupción mayor o bloqueo unilateral del proveedor cloud de core bancario por más de 12 horas consecutivas.";
        consequence = "Parálisis en transaccionalidad de sucursales y banca digital con sanción por incumplimiento de RTO CUB.";
      } else if (cat === "DIGITAL_FRAUD") {
        targetProc = procCRED || targetProc;
        targetTax = taxonomyMap["FRAUD_INTERNAL_EXTERNAL"] || targetTax;
        code = "RSK-FRAUD-031";
        title = "Infiltración de Identidades Sintéticas con Biometría Deepfake en Dispersión";
        cause = "Evolución de modelos generativos de IA capaces de eludir pruebas de vida pasivas en el canal móvil de originación.";
        eventDesc = "Apertura masiva y dispersión de créditos PyME a perfiles sintéticos construidos con fragmentos de historiales reales y fotos sintéticas.";
        consequence = "Quebranto financiero directo no recuperable y daño severo en la cartera de crédito en etapas 2 y 3.";
      } else if (cat === "SYSTEMIC_CONTAGION") {
        targetProc = procTES || targetProc;
        targetTax = taxonomyMap["OPERATIONAL"] || targetTax;
        code = "RSK-SYS-032";
        title = "Efecto Dominó por Descalce Operativo Intradía entre SPEI y Fondeo Mayorista";
        cause = "Falla de sincronización de eventos de liquidación entre la mesa de dinero y la ventanilla SPEI durante horario pico.";
        eventDesc = "Rechazo en cascada de instrucciones mayoristas que propaga alertas de déficit de liquidez hacia la cámara de compensación Banxico.";
        consequence = "Penalizaciones regulatorias inmediatas de Banxico, daño reputacional interbancario y presión súbita en el CCL.";
      } else if (cat === "THIRD_PARTY_EXTENDED") {
        targetProc = procCRED || targetProc;
        targetTax = taxonomyMap["LEGAL"] || targetTax;
        code = "RSK-3RD-033";
        title = "Compromiso de Credenciales y Manipulación de Avalúos en Despachos Satélite de 4.ª Parte";
        cause = "Ciberseguridad deficiente en sistemas de valuadores y notarías vinculadas al proceso de formalización crediticia.";
        eventDesc = "Inyección de avalúos sobrevalorados y falsificación de folios en el Registro Público sin detección por la 1.ª línea.";
        consequence = "Constitución de garantías sobrecolateralizadas simuladas y sobreexposición al riesgo de recuperación judicial.";
      } else if (cat === "DIGITAL_LIQUIDITY") {
        targetProc = procTES || targetProc;
        targetTax = taxonomyMap["LIQUIDITY"] || targetTax;
        code = "RSK-LIQ-035";
        title = "Corrida Digital Instantánea 24/7 Detonada por Desinformación Algorítmica en Redes";
        cause = "Campañas coordinadas de noticias falsas en canales sociales combinadas con capacidades de retiro inmediato en banca móvil 24/7.";
        eventDesc = "Salida abrupta del 18% de los depósitos a la vista de personas físicas en una ventana de 6 horas durante fin de semana.";
        consequence = "Consumo acelerado del colchón de activos líquidos de alta calidad (HQLA) y perforación del límite de apetito en el CCL.";
      } else if (cat === "MODEL_DATA_AI") {
        targetProc = procCRED || procAGRO || targetProc;
        targetTax = taxonomyMap["CREDIT"] || targetTax;
        code = "RSK-AI-034";
        title = "Deriva Algorítmica No Supervisada y Alucinación en Motor Automatizado de Scoring";
        cause = "Falta de recalibración periódica ante cambios macroeconómicos y sobreajuste en redes neuronales de aprobación.";
        eventDesc = "Aprobación masiva de líneas de crédito en segmentos subprime con subestimación de la Probabilidad de Incumplimiento (PI).";
        consequence = "Incremento súbito de pérdidas crediticias esperadas (PCE NIF C-16) y reclasificación acelerada a Etapa 3.";
      }

      if (!targetProc) continue;

      const coords = getDefault3DCoordinates(cat, {});
      const cyberMeta = JSON.stringify({
        emergingCategory: cat,
        x: coords.x,
        y: coords.y,
        z: coords.z,
        isEmergingCubeModel: true,
      });

      // Crear el riesgo emergente representativo
      await prisma.riskEvent.create({
        data: {
          code,
          title,
          cause,
          eventDescription: eventDesc,
          consequence,
          taxonomyId: targetTax.id,
          origin: "EXTERNAL_EVENTS",
          businessUnitId: targetProc.macroProcess.businessUnitId,
          processId: targetProc.id,
          processNodeId: targetProc.flowNodes?.[0]?.id || null,
          ownerId: defaultUser.id,
          inherentProbability: Math.min(5, Math.max(1, Math.round(coords.y))),
          inherentImpact: Math.min(5, Math.max(1, Math.round(coords.x))),
          inherentScore: Math.round(coords.x * coords.y),
          inherentZone: coords.x * coords.y >= 16 ? "RED" : coords.x * coords.y >= 10 ? "ORANGE" : "YELLOW",
          controlMitigationFactor: 0.25,
          residualProbability: Math.max(1.0, Number((coords.y * 0.8).toFixed(1))),
          residualImpact: Math.max(1.0, Number((coords.x * 0.8).toFixed(1))),
          residualScore: Number((coords.x * coords.y * 0.64).toFixed(1)),
          residualZone: coords.x * coords.y * 0.64 >= 15 ? "RED" : "ORANGE",
          annualFrequencyNet: 0.15,
          avgFinancialImpactMXN: 8500000,
          worstCaseImpactMXN: 25000000,
          expectedAnnualLossPEA: 1275000,
          maxAnnualLossPMA: 21500000,
          reputationalImpactLevel: 4,
          isEmergingRisk: true,
          cyberAttackVector: cyberMeta,
          status: "PUBLISHED",
        },
      });
    }
  } catch (err) {
    console.warn("Auto-seeding 8 emerging categories warning:", err);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const processId = searchParams.get("processId") || "ALL";
    const category = searchParams.get("category") || "ALL";

    // 1. Asegurar cobertura de las 8 categorías emergentes
    await ensureAll8EmergingCategoriesSeeded();

    // 2. Construir filtro
    const where: any = {
      isEmergingRisk: true,
    };

    if (processId !== "ALL") {
      where.processId = processId;
    }

    // 3. Consultar riesgos emergentes con sus relaciones en BD
    const [rawRisks, processesWithNodesRaw] = await Promise.all([
      prisma.riskEvent.findMany({
        where,
        include: {
          process: {
            include: { macroProcess: true },
          },
          processNode: true,
          taxonomy: true,
          controls: {
            include: {
              control: true,
            },
          },
          actionPlans: {
            include: { evidences: true },
          },
        },
        orderBy: [{ process: { code: "asc" } }, { code: "asc" }],
      }),
      prisma.process.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          macroProcess: { select: { id: true, code: true, name: true } },
          flowNodes: {
            select: {
              id: true,
              label: true,
              nodeType: true,
              description: true,
            },
            orderBy: { label: "asc" },
          },
        },
        orderBy: { code: "asc" },
      }),
    ]);

    // 4. Preparar payload para el motor de Cubo 3D
    const engineInputs: EmergingRiskInput[] = rawRisks.map((r) => {
      const catCode = inferEmergingCategory(r);
      const defaultCoords = getDefault3DCoordinates(catCode, r);

      let overrideX: number | undefined;
      let overrideY: number | undefined;
      let overrideZ: number | undefined;
      let overrideDeltaX: number | undefined;
      let overrideDeltaY: number | undefined;
      let overrideDeltaZ: number | undefined;
      let forceNF: boolean | undefined;
      let simHasRealtimeControl: boolean | undefined;

      if (r.cyberAttackVector) {
        try {
          const parsed = JSON.parse(r.cyberAttackVector);
          if (parsed.overrideResidualX !== undefined) overrideX = Number(parsed.overrideResidualX);
          if (parsed.overrideResidualY !== undefined) overrideY = Number(parsed.overrideResidualY);
          if (parsed.overrideResidualZ !== undefined) overrideZ = Number(parsed.overrideResidualZ);
          if (parsed.overrideDeltaX !== undefined) overrideDeltaX = Number(parsed.overrideDeltaX);
          if (parsed.overrideDeltaY !== undefined) overrideDeltaY = Number(parsed.overrideDeltaY);
          if (parsed.overrideDeltaZ !== undefined) overrideDeltaZ = Number(parsed.overrideDeltaZ);
          if (parsed.forceNF !== undefined) forceNF = Boolean(parsed.forceNF);
          if (parsed.simHasRealtimeControl !== undefined) simHasRealtimeControl = Boolean(parsed.simHasRealtimeControl);
        } catch {
          // not json
        }
      }

      const controlsList = r.controls.map((rc) => ({
        id: rc.control.id,
        code: rc.control.code,
        name: rc.control.name,
        isFormalized: rc.control.isFormalized,
        hasValidEvidence: rc.control.hasValidEvidence,
        automation: rc.control.automation,
        executionTiming: rc.control.executionTiming,
        nature: rc.control.nature,
        rawEffectiveness: rc.control.rawEffectiveness,
      }));

      return {
        id: r.id,
        code: r.code,
        title: r.title,
        cause: r.cause,
        consequence: r.consequence,
        processId: r.processId,
        processCode: r.process.code,
        processName: r.process.name,
        processNodeId: r.processNodeId || undefined,
        processNodeLabel: r.processNode?.label || "Paso Operativo Transversal",
        emergingCategoryCode: catCode,
        systemicImpactX: defaultCoords.x,
        uncertaintyY: defaultCoords.y,
        materializationSpeedZ: defaultCoords.z,
        overrideResidualX: overrideX,
        overrideResidualY: overrideY,
        overrideResidualZ: overrideZ,
        overrideDeltaX,
        overrideDeltaY,
        overrideDeltaZ,
        forceNF,
        simHasRealtimeControl,
        controls: controlsList,
        matrix2D: {
          inherentProbability: r.inherentProbability,
          inherentImpact: r.inherentImpact,
          residualProbability: r.residualProbability,
          residualImpact: r.residualImpact,
          residualScore: r.residualScore,
          residualZone: r.residualZone,
        },
      };
    });

    // 5. Filtrar por categoría emergente si no es ALL
    const filteredInputs = category === "ALL"
      ? engineInputs
      : engineInputs.filter((item) => item.emergingCategoryCode === category);

    // 6. Ejecutar Motor Cuantitativo en Python (con respaldo en TS)
    const engineResult = await executeEmergingRiskCubeEngine(filteredInputs);

    // 7. Enriquecer con definiciones completas de las 8 categorías
    const enrichedRisks = engineResult.emergingRisks.map((item) => {
      const def = EMERGING_CATEGORIES[item.emergingCategoryCode] || EMERGING_CATEGORIES.TECH_CONCENTRATION;
      return {
        ...item,
        emergingCategoryLabel: def.name,
        emergingCategoryShort: def.shortLabel,
        categoryColor: def.color,
        categoryBadge: def.badgeColor,
        riskVectorSummary: def.riskVector,
      };
    });

    return NextResponse.json({
      success: true,
      engineTelemetry: {
        engine: engineResult.engine,
        pythonVersion: engineResult.pythonVersion || "Python 3.x",
        executionTimeMs: engineResult.executionTimeMs,
        isFallbackTS: engineResult.isFallbackTS,
        totalVoxels: 125,
      },
      kpis: engineResult.kpis,
      categorySummary: engineResult.categorySummary,
      emergingRisks: enrichedRisks,
      officialCategories: Object.values(EMERGING_CATEGORIES),
      processesWithNodes: processesWithNodesRaw.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        macroProcess: p.macroProcess,
        nodes: p.flowNodes.map((n) => ({
          id: n.id,
          label: n.label,
          nodeType: n.nodeType,
          description: n.description,
        })),
      })),
    });
  } catch (error: any) {
    console.error("Error in GET /api/emerging-risks:", error);
    return NextResponse.json({ success: false, error: "Error al procesar riesgos emergentes en el Cubo 3D" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, riskId, userRole = "UAIR_ADMIN" } = body;

    // Acción 1: Simular y Persistir Coordenadas en el Cubo 3D
    if (action === "SIMULATE_OR_UPDATE_CUBE") {
      const {
        systemicImpactX,
        uncertaintyY,
        materializationSpeedZ,
        overrideDeltaX,
        overrideDeltaY,
        overrideDeltaZ,
        overrideResidualX,
        overrideResidualY,
        overrideResidualZ,
        forceNF,
        simHasRealtimeControl,
        inherentProbability,
        inherentImpact,
        residualProbability,
        residualImpact,
        emergingCategoryCode,
      } = body;

      if (!riskId) {
        return NextResponse.json({ success: false, error: "riskId requerido" }, { status: 400 });
      }

      const existingRisk = await prisma.riskEvent.findUnique({
        where: { id: riskId },
      });

      if (!existingRisk) {
        return NextResponse.json({ success: false, error: "Riesgo no encontrado" }, { status: 404 });
      }

      let currentMeta: any = {};
      if (existingRisk.cyberAttackVector) {
        try {
          currentMeta = JSON.parse(existingRisk.cyberAttackVector);
        } catch {
          // ignore
        }
      }

      const updatedMeta = {
        ...currentMeta,
        emergingCategory: emergingCategoryCode || currentMeta.emergingCategory || "TECH_CONCENTRATION",
        x: systemicImpactX !== undefined ? Number(systemicImpactX) : currentMeta.x || 3,
        y: uncertaintyY !== undefined ? Number(uncertaintyY) : currentMeta.y || 3,
        z: materializationSpeedZ !== undefined ? Number(materializationSpeedZ) : currentMeta.z || 3,
        overrideDeltaX: overrideDeltaX !== undefined ? Number(overrideDeltaX) : currentMeta.overrideDeltaX,
        overrideDeltaY: overrideDeltaY !== undefined ? Number(overrideDeltaY) : currentMeta.overrideDeltaY,
        overrideDeltaZ: overrideDeltaZ !== undefined ? Number(overrideDeltaZ) : currentMeta.overrideDeltaZ,
        overrideResidualX: overrideResidualX !== undefined ? Number(overrideResidualX) : currentMeta.overrideResidualX,
        overrideResidualY: overrideResidualY !== undefined ? Number(overrideResidualY) : currentMeta.overrideResidualY,
        overrideResidualZ: overrideResidualZ !== undefined ? Number(overrideResidualZ) : currentMeta.overrideResidualZ,
        forceNF: forceNF !== undefined ? Boolean(forceNF) : currentMeta.forceNF,
        simHasRealtimeControl: simHasRealtimeControl !== undefined ? Boolean(simHasRealtimeControl) : currentMeta.simHasRealtimeControl,
        isEmergingCubeModel: true,
        lastSimulatedAt: new Date().toISOString(),
      };

      const dataToUpdate: any = {
        isEmergingRisk: true,
        cyberAttackVector: JSON.stringify(updatedMeta),
      };

      // Si se suministraron ajustes 2D, sincronizar formalmente en el modelo de base de datos
      const pInh = inherentProbability !== undefined ? Number(inherentProbability) : existingRisk.inherentProbability;
      const iInh = inherentImpact !== undefined ? Number(inherentImpact) : existingRisk.inherentImpact;
      const pRes = residualProbability !== undefined ? Number(residualProbability) : existingRisk.residualProbability;
      const iRes = residualImpact !== undefined ? Number(residualImpact) : existingRisk.residualImpact;

      if (inherentProbability !== undefined) dataToUpdate.inherentProbability = pInh;
      if (inherentImpact !== undefined) dataToUpdate.inherentImpact = iInh;
      if (inherentProbability !== undefined || inherentImpact !== undefined) {
        dataToUpdate.inherentScore = Math.round(pInh * iInh);
        dataToUpdate.inherentZone = pInh * iInh >= 16 ? "RED" : pInh * iInh >= 10 ? "ORANGE" : "YELLOW";
      }

      if (residualProbability !== undefined) dataToUpdate.residualProbability = pRes;
      if (residualImpact !== undefined) dataToUpdate.residualImpact = iRes;
      if (residualProbability !== undefined || residualImpact !== undefined) {
        const resScore = Number((pRes * iRes).toFixed(1));
        dataToUpdate.residualScore = resScore;
        dataToUpdate.residualZone = resScore >= 15 ? "RED" : resScore >= 8 ? "ORANGE" : resScore >= 4 ? "YELLOW" : "GREEN";
      }

      const updatedRisk = await prisma.riskEvent.update({
        where: { id: riskId },
        data: dataToUpdate,
      });

      // Bitácora criptográfica SHA-256
      const user = (await prisma.user.findFirst({ where: { role: userRole as RoleType } })) || (await prisma.user.findFirst());
      if (user) {
        await recordAuditLog({
          userId: user.id,
          userRole: userRole as RoleType,
          actionType: "EMERGING_CUBE_EVALUATION",
          entityName: "RiskEvent",
          entityId: riskId,
          previousState: { cyberAttackVector: existingRisk.cyberAttackVector },
          newState: updatedMeta,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Parámetros del Cubo 3D y matriz 2D sincronizados exitosamente.",
        risk: updatedRisk,
      });
    }

    // Acción 2: Alternar Formalización de Control bajo CNBV Art. 88 CUB
    if (action === "TOGGLE_CONTROL_FORMALIZATION") {
      const { controlId, isFormalized, hasValidEvidence } = body;
      if (!controlId) {
        return NextResponse.json({ success: false, error: "controlId requerido" }, { status: 400 });
      }

      const dataToUpdate: any = {};
      if (isFormalized !== undefined) dataToUpdate.isFormalized = Boolean(isFormalized);
      if (hasValidEvidence !== undefined) dataToUpdate.hasValidEvidence = Boolean(hasValidEvidence);

      const ctrl = await prisma.control.update({
        where: { id: controlId },
        data: dataToUpdate,
      });

      return NextResponse.json({
        success: true,
        message: "Estado de formalización bajo Art. 88 CUB actualizado.",
        control: ctrl,
      });
    }

    // Acción 3: Vincular Control Tipificado por Eje (X: BCP/Aislamiento, Y: KRI/Intel, Z: Kill-Switch SOAR)
    if (action === "ATTACH_TYPIFIED_CONTROL") {
      const { riskId, axis } = body;
      if (!riskId || !axis) {
        return NextResponse.json({ success: false, error: "riskId y axis ('X', 'Y', 'Z') requeridos" }, { status: 400 });
      }

      const risk = await prisma.riskEvent.findUnique({
        where: { id: riskId },
        include: { process: true },
      });
      if (!risk) {
        return NextResponse.json({ success: false, error: "Riesgo no encontrado" }, { status: 404 });
      }

      const defaultUser = await prisma.user.findFirst();
      if (!defaultUser) {
        return NextResponse.json({ success: false, error: "Usuario no disponible" }, { status: 500 });
      }

      const ctrlCode = `CTRL-${axis}-${risk.code}`;
      let ctrlName = "";
      let automation = "MANUAL";
      let executionTiming = "DAILY_D1";
      let nature = "PREVENTIVE";

      if (axis === "X") {
        ctrlName = "Control de Aislamiento BCP y Segmentación de Red";
        automation = "SEMI_AUTOMATED";
        executionTiming = "DAILY_D1";
        nature = "PREVENTIVE";
      } else if (axis === "Y") {
        ctrlName = "Sensor KRI y Threat Intelligence Proactivo";
        automation = "SEMI_AUTOMATED";
        executionTiming = "ONLINE_REALTIME";
        nature = "DETECTIVE";
      } else {
        ctrlName = "Kill-Switch Automático SOAR en Milisegundos";
        automation = "AUTOMATED";
        executionTiming = "ONLINE_REALTIME";
        nature = "CORRECTIVE";
      }

      let control = await prisma.control.findFirst({
        where: { code: ctrlCode },
      });

      if (!control) {
        control = await prisma.control.create({
          data: {
            code: ctrlCode,
            name: ctrlName,
            description: `Control tipificado para absorción vectorial en Eje ${axis} del Cubo 3D.`,
            nature,
            automation,
            executionTiming,
            isFormalized: true,
            hasValidEvidence: true,
            coverageLevel: 4,
            rawEffectiveness: 5,
            adjustedEffectScore: 1.0,
            ownerId: defaultUser.id,
          },
        });
      }

      const existingMap = await prisma.riskControlMap.findUnique({
        where: {
          riskEventId_controlId: {
            riskEventId: riskId,
            controlId: control.id,
          },
        },
      });

      if (!existingMap) {
        await prisma.riskControlMap.create({
          data: {
            riskEventId: riskId,
            controlId: control.id,
            mitigatesProbWeight: axis === "Y" ? 0.8 : 0.2,
            mitigatesImpWeight: axis === "X" ? 0.8 : 0.2,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Control tipificado Eje ${axis} vinculado exitosamente.`,
        control,
      });
    }

    // Acción 4: Crear un Nuevo Riesgo Emergente Tridimensional
    if (action === "CREATE_EMERGING_RISK") {
      const {
        code,
        title,
        cause,
        eventDescription,
        consequence,
        processId,
        processNodeId,
        emergingCategoryCode,
        systemicImpactX = 4,
        uncertaintyY = 4,
        materializationSpeedZ = 4,
        inherentProbability = 1,
        inherentImpact = 4,
        taxonomyRiskType = "TECHNOLOGICAL",
      } = body;

      if (!code || !title || !processId) {
        return NextResponse.json({ success: false, error: "code, title y processId son obligatorios" }, { status: 400 });
      }

      const proc = await prisma.process.findUnique({
        where: { id: processId },
        include: { macroProcess: true },
      });
      if (!proc) {
        return NextResponse.json({ success: false, error: "Proceso bancario no encontrado" }, { status: 404 });
      }

      let tax = await prisma.riskTaxonomy.findFirst({
        where: { riskType: taxonomyRiskType },
      });
      if (!tax) {
        tax = (await prisma.riskTaxonomy.findFirst())!;
      }

      const defaultUser = (await prisma.user.findFirst({ where: { role: userRole as RoleType } })) || (await prisma.user.findFirst());
      if (!defaultUser) {
        return NextResponse.json({ success: false, error: "Usuario no disponible" }, { status: 500 });
      }

      const x = Math.max(1, Math.min(5, Number(systemicImpactX)));
      const y = Math.max(1, Math.min(5, Number(uncertaintyY)));
      const z = Math.max(1, Math.min(5, Number(materializationSpeedZ)));

      const p2D = Math.max(1, Math.min(5, Number(inherentProbability)));
      const i2D = Math.max(1, Math.min(5, Number(inherentImpact)));
      const score2D = Math.round(p2D * i2D);
      const zone2D = score2D >= 16 ? "RED" : score2D >= 10 ? "ORANGE" : score2D >= 4 ? "YELLOW" : "GREEN";

      const meta = JSON.stringify({
        emergingCategory: emergingCategoryCode || "TECH_CONCENTRATION",
        x,
        y,
        z,
        isEmergingCubeModel: true,
      });

      const newRisk = await prisma.riskEvent.create({
        data: {
          code,
          title,
          cause: cause || "Amenaza emergente no lineal",
          eventDescription: eventDescription || "Evento disruptivo en el espacio tridimensional",
          consequence: consequence || "Pérdida operativa y afectación de continuidad B×+",
          taxonomyId: tax.id,
          origin: "EXTERNAL_EVENTS",
          businessUnitId: proc.macroProcess.businessUnitId,
          processId: proc.id,
          processNodeId: processNodeId || null,
          ownerId: defaultUser.id,
          inherentProbability: p2D,
          inherentImpact: i2D,
          inherentScore: score2D,
          inherentZone: zone2D,
          residualProbability: p2D,
          residualImpact: i2D,
          residualScore: score2D,
          residualZone: zone2D,
          isEmergingRisk: true,
          cyberAttackVector: meta,
          status: "PUBLISHED",
        },
      });

      await recordAuditLog({
        userId: defaultUser.id,
        userRole: userRole as RoleType,
        actionType: "CREATE_EMERGING_RISK",
        entityName: "RiskEvent",
        entityId: newRisk.id,
        previousState: null,
        newState: { code, title, emergingCategoryCode, x, y, z, p2D, i2D, processNodeId },
      });

      return NextResponse.json({
        success: true,
        message: `Riesgo Emergente "${title}" (${code}) creado y posicionado en el Cubo 3D.`,
        risk: newRisk,
      });
    }

    return NextResponse.json({ success: false, error: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in POST /api/emerging-risks:", error);
    return NextResponse.json({ success: false, error: "Error al guardar en Cubo 3D" }, { status: 500 });
  }
}
