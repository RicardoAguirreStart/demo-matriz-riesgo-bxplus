// src/lib/engines/emerging-risk-cube-engine.ts
/**
 * Motor de Gestión de Riesgos Emergentes (Cubo 3D 5x5x5) y Puente a Python
 * Banco Ve por Más (B×+) — Cumplimiento CNBV CUB Art. 88, Basilea III y WEF Global Risks
 */

import { spawnSync } from "child_process";
import path from "path";

export {
  EMERGING_CATEGORIES,
  SCALE_AXIS_X,
  SCALE_AXIS_Y,
  SCALE_AXIS_Z,
} from "@/types/emerging-risks";

export type {
  EmergingCategoryCode,
  EmergingCategoryDef,
  Cube3DAxisScale,
} from "@/types/emerging-risks";

import type { EmergingCategoryCode } from "@/types/emerging-risks";

export interface EmergingRiskInput {
  id: string;
  code: string;
  title: string;
  cause?: string;
  consequence?: string;
  processId?: string;
  processCode?: string;
  processName?: string;
  processNodeId?: string;
  processNodeLabel?: string;
  emergingCategoryCode: EmergingCategoryCode;
  systemicImpactX: number; // 1..5
  uncertaintyY: number;    // 1..5
  materializationSpeedZ: number; // 1..5
  overrideResidualX?: number;
  overrideResidualY?: number;
  overrideResidualZ?: number;
  controls?: any[];
  matrix2D?: {
    inherentProbability: number;
    inherentImpact: number;
    residualProbability: number;
    residualImpact: number;
    residualScore: number;
    residualZone: string;
  };
}

export interface EmergingRiskOutput extends EmergingRiskInput {
  residualX: number;
  residualY: number;
  residualZ: number;
  mitigationDeltaX: number;
  mitigationDeltaY: number;
  mitigationDeltaZ: number;
  volumeInherent: number;
  volumeResidual: number;
  tensorScore3D: number;
  tensorScore3DInherent: number;
  equivalentScore25: number;
  cubeZoneInherent: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  cubeZoneResidual: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  hasRealtimeControl: boolean;
  hasNFControlPenalty: boolean;
  isBlindSpot2Dto3D: boolean;
  parallelComparison: {
    matrix2DZone: string;
    cube3DZone: string;
    discrepancyType: "CRITICAL_BLIND_SPOT" | "EARLY_WARNING_BLIND_SPOT" | "CONGRUENT" | "OVERESTIMATED_IN_2D" | "TRANSITIONAL";
    blindSpotExplanation: string;
  };
}

export interface CubeEngineResult {
  success: boolean;
  engine: string;
  executionTimeMs: number;
  pythonVersion?: string;
  isFallbackTS: boolean;
  totalEmergingRisks: number;
  kpis: {
    criticalRed3DCount: number;
    orangeCount: number;
    yellowCount: number;
    greenCount: number;
    highSpeedCount: number;
    blindSpots2Dto3DCount: number;
    avgSystemicX: number;
    avgUncertaintyY: number;
    avgSpeedZ: number;
    avgResidualVolume: number;
  };
  categorySummary: Array<{
    categoryCode: string;
    count: number;
    redCount: number;
    blindSpotCount: number;
    sumVol: number;
    avgVol: number;
    avgZ: number;
    risks: string[];
  }>;
  emergingRisks: EmergingRiskOutput[];
}

/**
 * Motor puro en TypeScript que ejecuta de forma idéntica la matemática del cubo.
 * Usado como respaldo instantáneo ante cualquier falla de subprocess en el runtime.
 */
export function runCubeEnginePureTS(risks: EmergingRiskInput[]): CubeEngineResult {
  const startTime = Date.now();

  const processedRisks: EmergingRiskOutput[] = risks.map((risk) => {
    const xInh = Math.max(1, Math.min(5, Number(risk.systemicImpactX || 3)));
    const yInh = Math.max(1, Math.min(5, Number(risk.uncertaintyY || 3)));
    const zInh = Math.max(1, Math.min(5, Number(risk.materializationSpeedZ || 3)));

    const controls = risk.controls || [];
    let hasRealtime = false;
    let hasNF = false;

    let effXSum = 0;
    let effYSum = 0;
    let effZSum = 0;

    controls.forEach((c: any) => {
      const rawEff = Number(c.rawEffectiveness || 3) / 5.0;
      const isFormal = Boolean(c.isFormalized);
      const hasEvid = Boolean(c.hasValidEvidence);

      let eff = rawEff;
      if (!isFormal || !hasEvid) {
        hasNF = true;
        eff = Math.min(rawEff, 0.20);
      }

      const auto = String(c.automation || "").toUpperCase();
      const timing = String(c.executionTiming || "").toUpperCase();
      const isAutoRT = auto === "AUTOMATED" && timing === "ONLINE_REALTIME";
      if (isAutoRT) hasRealtime = true;

      effXSum += eff * 0.35;
      effYSum += eff * 0.30;
      if (zInh >= 4.0) {
        if (isAutoRT) effZSum += eff * 0.45;
        else effZSum += eff * 0.08;
      } else {
        effZSum += eff * 0.25;
      }
    });

    const factorX = Math.min(0.45, effXSum);
    const factorY = Math.min(0.40, effYSum);
    const factorZ = Math.min(hasRealtime || zInh < 4.0 ? 0.45 : 0.12, effZSum);

    let xRes = Math.max(1.0, Number((xInh * (1.0 - factorX)).toFixed(2)));
    let yRes = Math.max(1.0, Number((yInh * (1.0 - factorY)).toFixed(2)));
    let zRes = Math.max(1.0, Number((zInh * (1.0 - factorZ)).toFixed(2)));

    if (risk.overrideResidualX !== undefined && risk.overrideResidualX !== null) {
      xRes = Math.max(1.0, Math.min(5.0, Number(risk.overrideResidualX)));
    }
    if (risk.overrideResidualY !== undefined && risk.overrideResidualY !== null) {
      yRes = Math.max(1.0, Math.min(5.0, Number(risk.overrideResidualY)));
    }
    if (risk.overrideResidualZ !== undefined && risk.overrideResidualZ !== null) {
      zRes = Math.max(1.0, Math.min(5.0, Number(risk.overrideResidualZ)));
    }

    const deltaX = Number((xInh - xRes).toFixed(2));
    const deltaY = Number((yInh - yRes).toFixed(2));
    const deltaZ = Number((zInh - zRes).toFixed(2));

    const volInh = Number((xInh * yInh * zInh).toFixed(2));
    const volRes = Number((xRes * yRes * zRes).toFixed(2));

    const computeTension = (v: number, x: number, y: number, z: number) => {
      const gamma = x >= 3.8 && z >= 3.8 ? 1.15 : 1.0;
      const volTerm = 0.45 * (v / 125.0);
      const quadTerm = 0.55 * ((0.40 * x * x + 0.25 * y * y + 0.35 * z * z) / 25.0);
      const raw = (volTerm + quadTerm) * 100.0 * gamma;
      const t = Math.min(100.0, Math.max(1.0, Number(raw.toFixed(1))));
      const seq = Math.min(25.0, Math.max(1.0, Number((t / 4.0).toFixed(1))));
      return { t, seq };
    };

    const calcZone = (vol: number, x: number, z: number, tension: number): "GREEN" | "YELLOW" | "ORANGE" | "RED" => {
      if (vol >= 64.0 || (x >= 3.8 && z >= 3.8) || tension >= 68.0) return "RED";
      if (vol >= 36.0 || x >= 4.8 || z >= 4.8 || tension >= 45.0) return "ORANGE";
      if (vol >= 15.0 || tension >= 22.0) return "YELLOW";
      return "GREEN";
    };

    const inhMetrics = computeTension(volInh, xInh, yInh, zInh);
    const resMetrics = computeTension(volRes, xRes, yRes, zRes);

    const zoneInh = calcZone(volInh, xInh, zInh, inhMetrics.t);
    const zoneRes = calcZone(volRes, xRes, zRes, resMetrics.t);

    const m2DZone = String(risk.matrix2D?.residualZone || "YELLOW").toUpperCase();
    const isBlindSpot = (m2DZone === "GREEN" || m2DZone === "YELLOW") && (zoneRes === "ORANGE" || zoneRes === "RED");

    return {
      ...risk,
      systemicImpactX: xInh,
      uncertaintyY: yInh,
      materializationSpeedZ: zInh,
      residualX: xRes,
      residualY: yRes,
      residualZ: zRes,
      mitigationDeltaX: deltaX,
      mitigationDeltaY: deltaY,
      mitigationDeltaZ: deltaZ,
      volumeInherent: volInh,
      volumeResidual: volRes,
      tensorScore3D: resMetrics.t,
      tensorScore3DInherent: inhMetrics.t,
      equivalentScore25: resMetrics.seq,
      cubeZoneInherent: zoneInh,
      cubeZoneResidual: zoneRes,
      hasRealtimeControl: hasRealtime,
      hasNFControlPenalty: hasNF,
      isBlindSpot2Dto3D: isBlindSpot,
      parallelComparison: {
        matrix2DZone: m2DZone,
        cube3DZone: zoneRes,
        discrepancyType: isBlindSpot && zoneRes === "RED" ? "CRITICAL_BLIND_SPOT" : isBlindSpot ? "EARLY_WARNING_BLIND_SPOT" : m2DZone === zoneRes ? "CONGRUENT" : "TRANSITIONAL",
        blindSpotExplanation: isBlindSpot
          ? `El riesgo figura en zona ${m2DZone} en 2D por baja probabilidad histórica, pero en 3D (${xRes} x ${yRes} x ${zRes}) genera un volumen residual de ${volRes}/125 en Zona ${zoneRes}.`
          : "Coherencia analítica entre la matriz 2D y el cubo 3D.",
      },
    };
  });

  const total = processedRisks.length;
  const redCount = processedRisks.filter((r) => r.cubeZoneResidual === "RED").length;
  const orangeCount = processedRisks.filter((r) => r.cubeZoneResidual === "ORANGE").length;
  const yellowCount = processedRisks.filter((r) => r.cubeZoneResidual === "YELLOW").length;
  const greenCount = processedRisks.filter((r) => r.cubeZoneResidual === "GREEN").length;
  const highSpeed = processedRisks.filter((r) => r.residualZ >= 3.8).length;
  const blindSpots = processedRisks.filter((r) => r.isBlindSpot2Dto3D).length;

  const avgX = total > 0 ? Number((processedRisks.reduce((acc, r) => acc + r.residualX, 0) / total).toFixed(2)) : 0;
  const avgY = total > 0 ? Number((processedRisks.reduce((acc, r) => acc + r.residualY, 0) / total).toFixed(2)) : 0;
  const avgZ = total > 0 ? Number((processedRisks.reduce((acc, r) => acc + r.residualZ, 0) / total).toFixed(2)) : 0;
  const avgVol = total > 0 ? Number((processedRisks.reduce((acc, r) => acc + r.volumeResidual, 0) / total).toFixed(2)) : 0;

  const catMap: Record<string, any> = {};
  processedRisks.forEach((r) => {
    const c = r.emergingCategoryCode || "UNSPECIFIED";
    if (!catMap[c]) {
      catMap[c] = {
        categoryCode: c,
        count: 0,
        redCount: 0,
        blindSpotCount: 0,
        sumVol: 0,
        avgVol: 0,
        avgZ: 0,
        risks: [],
      };
    }
    catMap[c].count++;
    if (r.cubeZoneResidual === "RED") catMap[c].redCount++;
    if (r.isBlindSpot2Dto3D) catMap[c].blindSpotCount++;
    catMap[c].sumVol += r.volumeResidual;
    catMap[c].risks.push(r.code);
  });

  Object.values(catMap).forEach((v: any) => {
    v.avgVol = Number((v.sumVol / v.count).toFixed(1));
  });

  const durationMs = Date.now() - startTime;

  return {
    success: true,
    engine: "TypeScript 3D Mirror Engine (v3.5 - Art. 88 CUB)",
    executionTimeMs: durationMs,
    isFallbackTS: true,
    totalEmergingRisks: total,
    kpis: {
      criticalRed3DCount: redCount,
      orangeCount: orangeCount,
      yellowCount: yellowCount,
      greenCount: greenCount,
      highSpeedCount: highSpeed,
      blindSpots2Dto3DCount: blindSpots,
      avgSystemicX: avgX,
      avgUncertaintyY: avgY,
      avgSpeedZ: avgZ,
      avgResidualVolume: avgVol,
    },
    categorySummary: Object.values(catMap),
    emergingRisks: processedRisks,
  };
}

/**
 * Ejecuta el motor Python real mediante subprocess. Si no estuviera disponible,
 * conmuta transparentemente a la implementación espejo en TypeScript.
 */
export async function executeEmergingRiskCubeEngine(
  risks: EmergingRiskInput[]
): Promise<CubeEngineResult> {
  const startTime = Date.now();
  const scriptPath = path.resolve(process.cwd(), "scripts", "emerging_risk_cube_engine.py");

  try {
    const payloadJson = JSON.stringify({ risks });
    const proc = spawnSync("python3", [scriptPath], {
      input: payloadJson,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: 10000,
    });

    if (proc.error || proc.status !== 0) {
      console.warn("Python 3D engine subprocess warning, fallback to TypeScript mirror:", proc.error || proc.stderr);
      return runCubeEnginePureTS(risks);
    }

    const parsed = JSON.parse(proc.stdout);
    const duration = Date.now() - startTime;

    // Obtener versión de Python
    let pyVer = "Python 3.x";
    try {
      const verCheck = spawnSync("python3", ["--version"], { encoding: "utf-8" });
      if (verCheck.stdout) pyVer = verCheck.stdout.trim();
    } catch {
      // ignore
    }

    return {
      ...parsed,
      executionTimeMs: duration,
      pythonVersion: pyVer,
      isFallbackTS: false,
    };
  } catch (err) {
    console.error("Error executing Python 3D engine:", err);
    return runCubeEnginePureTS(risks);
  }
}
