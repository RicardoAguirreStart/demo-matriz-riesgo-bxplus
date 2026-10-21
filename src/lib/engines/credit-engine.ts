// src/lib/engines/credit-engine.ts

export interface CreditExposureInput {
  grossExposureEI: number;       // EI_t: Exposición al Incumplimiento Bruta (MXN)
  collateralValueC: number;      // C: Valor del colateral admisible (MXN)
  haircutExposureHe: number;     // H_e: Factor de ajuste a la exposición (aforo)
  haircutCollateralHc: number;   // H_c: Factor de ajuste por volatilidad del colateral
  haircutFxHfx: number;          // H_fx: Factor por descalce de moneda (si aplica)
  pd12Months: number;            // PI_12m: Probabilidad de incumplimiento a 12 meses [0, 1]
  pdAnnualCurve: number[];       // Vector de PI marginal por cada año remanente t = 1..T
  lgdSeveritySP: number;         // SP_t: Severidad de la pérdida [0, 1]
  lgdDefaultedStage3: number;    // SP en Etapa 3 considerando ejecución real de garantías
  effectiveInterestRate: number; // r_eff: Tasa de interés efectiva anual
  daysPastDue: number;           // Días de mora
  hasQualitativeSICR: boolean;   // Deterioro sectorial, reestructura o vulnerabilidad ASG alta
  esgClimateVulnerability?: number; // Score 0 a 100 de autodiagnóstico climático CNBV
}

export interface CreditCalculationResult {
  stage: 1 | 2 | 3;
  adjustedExposureEStar: number;
  expectedCreditLossPCE: number;
  rwaAPRC: number;
  reserveCoveragePct: number;
}

/**
 * 1. Mitigación de Exposición por Colateral Admisible (CUB):
 * E* = max{ 0, [ E * (1 + He) - C * (1 - Hc - Hfx) ] }
 */
export function calculateCollateralAdjustedExposure(input: CreditExposureInput): number {
  const { grossExposureEI, collateralValueC, haircutExposureHe, haircutCollateralHc, haircutFxHfx } = input;
  const adjusted =
    grossExposureEI * (1 + (haircutExposureHe || 0)) -
    collateralValueC * (1 - (haircutCollateralHc || 0) - (haircutFxHfx || 0));
  return Math.max(0, Number(adjusted.toFixed(2)));
}

/**
 * 2. Clasificación Dinámica de Etapas (NIF C-16 y Anexo 15 Bis CUB)
 */
export function classifyNifC16Stage(input: CreditExposureInput): 1 | 2 | 3 {
  if (input.daysPastDue >= 90) {
    return 3; // Etapa 3: Cartera Vencida / Deterioro Crediticio Objetivo
  }
  if (
    input.daysPastDue >= 30 ||
    input.hasQualitativeSICR ||
    (input.esgClimateVulnerability !== undefined && input.esgClimateVulnerability >= 75)
  ) {
    return 2; // Etapa 2: Incremento Significativo en el Riesgo Crediticio (SICR)
  }
  return 1; // Etapa 1: Riesgo Normal
}

/**
 * 3. Cálculo Prospectivo de Pérdida Crediticia Esperada (PCE_t = PI_t * SP_t * EI_t * D_t)
 */
export function calculateNifC16PCE(input: CreditExposureInput): CreditCalculationResult {
  const stage = classifyNifC16Stage(input);
  const adjustedExposureEStar = calculateCollateralAdjustedExposure(input);
  const r = Math.max(0.01, input.effectiveInterestRate);

  let pce = 0;

  if (stage === 1) {
    // Etapa 1: Horizonte de 12 meses (t = 1)
    const discountFactorD1 = Math.pow(1 + r, -1);
    pce = input.pd12Months * input.lgdSeveritySP * adjustedExposureEStar * discountFactorD1;
  } else if (stage === 2) {
    // Etapa 2: Horizonte de vida remanente completa (t = 1..T)
    const curve = input.pdAnnualCurve && input.pdAnnualCurve.length > 0 ? input.pdAnnualCurve : [input.pd12Months, input.pd12Months * 1.3, input.pd12Months * 1.6];
    pce = curve.reduce((acc, pd_t, idx) => {
      const t = idx + 1;
      const discountFactorDt = Math.pow(1 + r, -t);
      return acc + pd_t * input.lgdSeveritySP * adjustedExposureEStar * discountFactorDt;
    }, 0);
  } else {
    // Etapa 3: PI = 100% (1.0), descontado y evaluando severidad de cartera vencida
    const discountFactorD1 = Math.pow(1 + r, -1);
    pce = 1.0 * input.lgdDefaultedStage3 * adjustedExposureEStar * discountFactorD1;
  }

  // Activos Ponderados por Riesgo de Crédito (APRC = 1.06 * P_RCRC * 12.5 * EI)
  const riskWeightFactor = stage === 3 ? 1.5 : stage === 2 ? 1.0 : 0.75;
  const pRcrc = 0.08 * riskWeightFactor;
  const rwaAPRC = 1.06 * pRcrc * 12.5 * adjustedExposureEStar;

  return {
    stage,
    adjustedExposureEStar,
    expectedCreditLossPCE: Number(pce.toFixed(2)),
    rwaAPRC: Number(rwaAPRC.toFixed(2)),
    reserveCoveragePct:
      input.grossExposureEI > 0 ? Number(((pce / input.grossExposureEI) * 100).toFixed(2)) : 0,
  };
}

/**
 * 4. Modelo Logístico de Estrés Macroeconómico y Climático (Anexo 12-B y 12-D CUB):
 * PI_estresada = 1 / (1 + exp(-(B0 + B1*dPIB + B2*TIIE + B3*dTC + B4*ShockClimatico)))
 */
export function stressProbabilityOfDefault(params: {
  basePD: number;
  deltaGdpPct: number;      // Ej. -4.5% en escenario adverso
  tiieRatePct: number;      // Ej. 13.5%
  deltaFxPct: number;       // Ej. +22.0% depreciación MXN/USD
  climateShockScore: number; // 0 a 1 (Sequía severa / Huracán en cartera Agro)
  betas?: { b1: number; b2: number; b3: number; b4: number };
}): number {
  const boundedBase = Math.min(0.999, Math.max(0.0001, params.basePD));
  const b0 = Math.log(boundedBase / (1 - boundedBase));
  const { b1 = -0.18, b2 = 0.12, b3 = 0.04, b4 = 0.65 } = params.betas || {};

  const linearIndex =
    b0 +
    b1 * params.deltaGdpPct +
    b2 * (params.tiieRatePct / 100) * 10 +
    b3 * (params.deltaFxPct / 100) * 10 +
    b4 * params.climateShockScore;

  const stressedPD = 1 / (1 + Math.exp(-linearIndex));
  return Number(Math.min(1.0, Math.max(0.0001, stressedPD)).toFixed(6));
}
