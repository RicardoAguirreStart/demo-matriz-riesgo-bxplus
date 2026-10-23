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
  overrideDeltaX?: number;
  overrideDeltaY?: number;
  overrideDeltaZ?: number;
  overrideResidualX?: number;
  overrideResidualY?: number;
  overrideResidualZ?: number;
  forceNF?: boolean;
  simHasRealtimeControl?: boolean;
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
  // Desglose matemático formal del Tensor 3D
  volNormalizedTerm: number;
  weightedQuadraticNorm: number;
  quadWeightedTerm: number;
  convexCombination: number;
  synergyFactorGamma: number;
  tensorScore3D: number;
  tensorScore3DInherent: number;
  equivalentScore25: number;
  cubeZoneInherent: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  cubeZoneResidual: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  hasRealtimeControl: boolean;
  hasNFControlPenalty: boolean;
  isBlindSpot2Dto3D: boolean;
  score2D: number;
  visibilityGapDelta: number;
  parallelComparison: {
    matrix2DZone: string;
    cube3DZone: string;
    score2D: number;
    equivalentScore3D: number;
    visibilityGapDelta: number;
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
    avgVisibilityGapDelta: number;
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
 * Función que desglosa analíticamente todos los términos del Tensor 3D.
 */
function compute3DTensionBreakdown(v: number, x: number, y: number, z: number) {
  const gamma = (x >= 3.8 && z >= 3.8) ? 1.15 : 1.0;
  const volNormTerm = Number((0.45 * (v / 125.0)).toFixed(4));
  const weightedQuadNorm = Number(
    ((0.40 * x * x + 0.25 * y * y + 0.35 * z * z) / 25.0).toFixed(4)
  );
  const quadWeightedTerm = Number((0.55 * weightedQuadNorm).toFixed(4));
  const convexComb = Number((volNormTerm + quadWeightedTerm).toFixed(4));
  const rawTension = convexComb * 100.0 * gamma;
  const t3d = Math.min(100.0, Math.max(1.0, Number(rawTension.toFixed(2))));
  const seq25 = Math.min(25.0, Math.max(1.0, Number((t3d / 4.0).toFixed(2))));

  return {
    volNormalizedTerm: volNormTerm,
    weightedQuadraticNorm: weightedQuadNorm,
    quadWeightedTerm: quadWeightedTerm,
    convexCombination: convexComb,
    synergyFactorGamma: gamma,
    tensorScore3D: t3d,
    equivalentScore25: seq25,
  };
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
    const forceNf = Boolean(risk.forceNF);
    let hasRealtime = false;
    let hasNF = false;

    let effXSum = 0;
    let effYSum = 0;
    let effZSum = 0;

    controls.forEach((c: any) => {
      const rawEff = Number(c.rawEffectiveness || 3) / 5.0;
      const isFormal = Boolean(c.isFormalized) && !forceNf;
      const hasEvid = Boolean(c.hasValidEvidence) && !forceNf;

      let eff = rawEff;
      if (!isFormal || !hasEvid || forceNf) {
        hasNF = true;
        eff = Math.min(rawEff, 0.20);
      }

      const auto = String(c.automation || "").toUpperCase();
      const timing = String(c.executionTiming || "").toUpperCase();
      const isAutoRT = auto === "AUTOMATED" && timing === "ONLINE_REALTIME";
      if (isAutoRT) hasRealtime = true;

      effXSum += eff * 0.45;
      effYSum += eff * 0.40;
      if (zInh >= 3.8) {
        if (isAutoRT) effZSum += eff * 0.45;
        else effZSum += 0.0; // Condición de falla: controles manuales no mitigan velocidad instantánea
      } else {
        effZSum += eff * 0.25;
      }
    });

    if (hasNF) {
      effXSum = Math.min(effXSum, 0.40);
      effYSum = Math.min(effYSum, 0.40);
      effZSum = Math.min(effZSum, 0.40);
    }

    let deltaX = Number(Math.min(xInh - 1.0, Math.max(0.0, effXSum * (xInh - 1.0))).toFixed(2));
    let deltaY = Number(Math.min(yInh - 1.0, Math.max(0.0, effYSum * (yInh - 1.0))).toFixed(2));
    let deltaZ = Number(Math.min(zInh - 1.0, Math.max(0.0, effZSum * (zInh - 1.0))).toFixed(2));

    // Overrides vectoriales explícitos
    if (risk.overrideDeltaX !== undefined && risk.overrideDeltaX !== null) {
      deltaX = Number(Number(risk.overrideDeltaX).toFixed(2));
      if (forceNf) deltaX = Math.min(deltaX, 0.40);
    }
    if (risk.overrideDeltaY !== undefined && risk.overrideDeltaY !== null) {
      deltaY = Number(Number(risk.overrideDeltaY).toFixed(2));
      if (forceNf) deltaY = Math.min(deltaY, 0.40);
    }
    if (risk.overrideDeltaZ !== undefined && risk.overrideDeltaZ !== null) {
      deltaZ = Number(Number(risk.overrideDeltaZ).toFixed(2));
      if (forceNf) deltaZ = Math.min(deltaZ, 0.40);
      if (zInh >= 3.8 && !hasRealtime && !risk.simHasRealtimeControl) {
        deltaZ = 0.0;
      }
    }

    let xRes = Math.max(1.0, Math.min(5.0, Number((xInh - deltaX).toFixed(2))));
    let yRes = Math.max(1.0, Math.min(5.0, Number((yInh - deltaY).toFixed(2))));
    let zRes = Math.max(1.0, Math.min(5.0, Number((zInh - deltaZ).toFixed(2))));

    // Overrides directos de residuales si aplican
    if (risk.overrideResidualX !== undefined && risk.overrideResidualX !== null && risk.overrideDeltaX === undefined) {
      xRes = Math.max(1.0, Math.min(5.0, Number(risk.overrideResidualX)));
      deltaX = Number((xInh - xRes).toFixed(2));
    }
    if (risk.overrideResidualY !== undefined && risk.overrideResidualY !== null && risk.overrideDeltaY === undefined) {
      yRes = Math.max(1.0, Math.min(5.0, Number(risk.overrideResidualY)));
      deltaY = Number((yInh - yRes).toFixed(2));
    }
    if (risk.overrideResidualZ !== undefined && risk.overrideResidualZ !== null && risk.overrideDeltaZ === undefined) {
      zRes = Math.max(1.0, Math.min(5.0, Number(risk.overrideResidualZ)));
      deltaZ = Number((zInh - zRes).toFixed(2));
    }

    const volInh = Number((xInh * yInh * zInh).toFixed(2));
    const volRes = Number((xRes * yRes * zRes).toFixed(2));

    const breakdownInh = compute3DTensionBreakdown(volInh, xInh, yInh, zInh);
    const breakdownRes = compute3DTensionBreakdown(volRes, xRes, yRes, zRes);

    const calcZone = (vol: number, x: number, y: number, z: number, tension: number): "GREEN" | "YELLOW" | "ORANGE" | "RED" => {
      if (vol >= 64.0 || (x >= 4.0 && z >= 4.0) || tension >= 68.0) return "RED";
      if (vol >= 36.0 || x >= 4.5 || z >= 4.5 || tension >= 45.0) return "ORANGE";
      if (vol >= 15.0 || tension >= 22.0) return "YELLOW";
      return "GREEN";
    };

    const zoneInh = calcZone(volInh, xInh, yInh, zInh, breakdownInh.tensorScore3D);
    const zoneRes = calcZone(volRes, xRes, yRes, zRes, breakdownRes.tensorScore3D);

    const m2D = risk.matrix2D || {
      inherentProbability: 1,
      inherentImpact: 1,
      residualProbability: 1,
      residualImpact: 1,
      residualScore: 1,
      residualZone: "GREEN",
    };
    const pRes = Number(m2D.residualProbability || m2D.inherentProbability || 1.0);
    const iRes = Number(m2D.residualImpact || m2D.inherentImpact || 1.0);
    const score2D = Number((m2D.residualScore !== undefined ? m2D.residualScore : pRes * iRes).toFixed(2));
    const m2DZone = String(m2D.residualZone || "YELLOW").toUpperCase();

    const visibilityGap = Number((breakdownRes.equivalentScore25 - score2D).toFixed(2));
    const isBlindSpot = (m2DZone === "GREEN" || m2DZone === "YELLOW") && (zoneRes === "ORANGE" || zoneRes === "RED");

    let discrepancyType: "CRITICAL_BLIND_SPOT" | "EARLY_WARNING_BLIND_SPOT" | "CONGRUENT" | "OVERESTIMATED_IN_2D" | "TRANSITIONAL" = "CONGRUENT";
    if (isBlindSpot && zoneRes === "RED") {
      discrepancyType = "CRITICAL_BLIND_SPOT";
    } else if (isBlindSpot) {
      discrepancyType = "EARLY_WARNING_BLIND_SPOT";
    } else if (m2DZone === "RED" && (zoneRes === "GREEN" || zoneRes === "YELLOW")) {
      discrepancyType = "OVERESTIMATED_IN_2D";
    } else if (m2DZone === zoneRes) {
      discrepancyType = "CONGRUENT";
    } else {
      discrepancyType = "TRANSITIONAL";
    }

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
      volNormalizedTerm: breakdownRes.volNormalizedTerm,
      weightedQuadraticNorm: breakdownRes.weightedQuadraticNorm,
      quadWeightedTerm: breakdownRes.quadWeightedTerm,
      convexCombination: breakdownRes.convexCombination,
      synergyFactorGamma: breakdownRes.synergyFactorGamma,
      tensorScore3D: breakdownRes.tensorScore3D,
      tensorScore3DInherent: breakdownInh.tensorScore3D,
      equivalentScore25: breakdownRes.equivalentScore25,
      cubeZoneInherent: zoneInh,
      cubeZoneResidual: zoneRes,
      hasRealtimeControl: hasRealtime,
      hasNFControlPenalty: hasNF,
      isBlindSpot2Dto3D: isBlindSpot,
      score2D,
      visibilityGapDelta: visibilityGap,
      parallelComparison: {
        matrix2DZone: m2DZone,
        cube3DZone: zoneRes,
        score2D,
        equivalentScore3D: breakdownRes.equivalentScore25,
        visibilityGapDelta: visibilityGap,
        discrepancyType,
        blindSpotExplanation: isBlindSpot
          ? `El riesgo figura como ${m2DZone} en 2D (Score: ${score2D}/25), pero su combinación 3D (X=${xRes}, Y=${yRes}, Z=${zRes}) produce T_3D=${breakdownRes.tensorScore3D}/100 y S_eq=${breakdownRes.equivalentScore25}/25 en Zona ${zoneRes}, con una Brecha de Visibilidad Δ_vis = ${visibilityGap >= 0 ? "+" : ""}${visibilityGap}.`
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
  const avgGap = total > 0 ? Number((processedRisks.reduce((acc, r) => acc + r.visibilityGapDelta, 0) / total).toFixed(2)) : 0;

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
      avgVisibilityGapDelta: avgGap,
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
