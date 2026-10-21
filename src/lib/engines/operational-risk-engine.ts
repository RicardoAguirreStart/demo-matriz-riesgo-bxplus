// src/lib/engines/operational-risk-engine.ts

import { RAFZone } from "@/types";

export interface TriennialAccountingInput {
  interestIncome: [number, number, number];      // 3 años: [t-2, t-1, t]
  interestExpense: [number, number, number];
  interestEarningAssets: [number, number, number];
  dividendIncome: [number, number, number];
  feeServiceIncome: [number, number, number];
  feeServiceExpense: [number, number, number];
  otherOperatingIncome: [number, number, number];
  otherOperatingExpense: [number, number, number];
  tradingBookNetResult: [number, number, number];
  bankingBookNetResult: [number, number, number];
}

const avg3 = (arr: [number, number, number]): number => (arr[0] + arr[1] + arr[2]) / 3;

/**
 * 1. Cálculo del Indicador de Negocio (IN = ILCT + CS + FC) — Anexo 1-D Bis CUB
 */
export function calculateBusinessIndicatorIN(data: TriennialAccountingInput) {
  const absNetInterest: [number, number, number] = [
    Math.abs(data.interestIncome[0] - data.interestExpense[0]),
    Math.abs(data.interestIncome[1] - data.interestExpense[1]),
    Math.abs(data.interestIncome[2] - data.interestExpense[2]),
  ];
  const ilct =
    Math.min(avg3(absNetInterest), 0.0225 * avg3(data.interestEarningAssets)) +
    avg3(data.dividendIncome);

  const cs =
    Math.max(avg3(data.feeServiceIncome), avg3(data.feeServiceExpense)) +
    Math.max(avg3(data.otherOperatingIncome), avg3(data.otherOperatingExpense));

  const absTrading: [number, number, number] = [
    Math.abs(data.tradingBookNetResult[0]),
    Math.abs(data.tradingBookNetResult[1]),
    Math.abs(data.tradingBookNetResult[2]),
  ];
  const absBanking: [number, number, number] = [
    Math.abs(data.bankingBookNetResult[0]),
    Math.abs(data.bankingBookNetResult[1]),
    Math.abs(data.bankingBookNetResult[2]),
  ];
  const fc = avg3(absTrading) + avg3(absBanking);

  const totalIN = ilct + cs + fc;

  // Requerimiento de Capital Operacional regulatorio estándar (marginal por tramos de Basilea III / CNBV)
  // Tramo 1 (<= 1B EUR / ~20B MXN): 12%
  const regulatoryCapitalOP = totalIN * 0.12;

  return {
    ilctComponentMXN: Number(ilct.toFixed(2)),
    csComponentMXN: Number(cs.toFixed(2)),
    fcComponentMXN: Number(fc.toFixed(2)),
    totalBusinessIndicatorIN: Number(totalIN.toFixed(2)),
    regulatoryCapitalOP: Number(regulatoryCapitalOP.toFixed(2)),
  };
}

/**
 * 2. Evaluación Técnica de Controles con Penalización Temporal (d+0, d+1, d+7, d+30) y Formalización
 */
export function evaluateControlEffectiveness(control: {
  coverageLevel: number;    // 0 a 4
  rawEffectiveness: number; // 0 a 5
  isFormalized: boolean;    // Si es false (NF), cobertura máxima = 2
  executionTiming: "ONLINE_REALTIME" | "DAILY_D1" | "WEEKLY_D7" | "MONTHLY_D30" | "OCCASIONAL";
  hasValidEvidence: boolean;
}): number {
  // Regla Rimac/CNBV 1: Control No Formalizado (NF) tiene techo máximo de Cobertura = 2
  const effectiveCoverage = control.isFormalized
    ? Math.min(4, Math.max(0, control.coverageLevel))
    : Math.min(2, Math.max(0, control.coverageLevel));

  // Regla Rimac/CNBV 2: Penalización por Efecto Temporal en controles Ex-Post
  let timingCap = 5;
  if (control.executionTiming === "DAILY_D1") timingCap = 4;
  if (control.executionTiming === "WEEKLY_D7") timingCap = 3;
  if (control.executionTiming === "MONTHLY_D30" || control.executionTiming === "OCCASIONAL") {
    timingCap = 2;
  }

  const cappedEffectiveness = Math.min(control.rawEffectiveness, timingCap);
  const evidenceMultiplier = control.hasValidEvidence ? 1.0 : 0.7;

  // Factor de mitigación normalizado [0.00 a 0.85]
  const normalizedScore =
    (effectiveCoverage / 4) * (cappedEffectiveness / 5) * evidenceMultiplier * 0.85;

  return Number(normalizedScore.toFixed(4));
}

/**
 * 3. Cálculo de Riesgo Inherente vs. Residual (Matriz 5x5 CNBV) y Cuantificación PEA / PMA (VaR Operacional)
 */
export function calculateOperationalRiskMetrics(input: {
  inherentProbability: number; // 1 a 5
  inherentImpact: number;      // 1 a 5
  combinedControlFactor: number; // [0 a 0.85]
  annualFrequencyNet: number;  // Eventos esperados al año (f)
  avgFinancialImpactMXN: number; // Impacto medio (I_medio)
  worstCaseImpactMXN: number;  // Peor escenario razonable (I_max)
}) {
  const inherentScore = input.inherentProbability * input.inherentImpact;

  // Reducción de probabilidad e impacto por el entorno de control
  const residualProbability = Math.max(
    1.0,
    Number((input.inherentProbability * (1 - input.combinedControlFactor * 0.8)).toFixed(2))
  );
  const residualImpact = Math.max(
    1.0,
    Number((input.inherentImpact * (1 - input.combinedControlFactor * 0.6)).toFixed(2))
  );
  const residualScore = Number((residualProbability * residualImpact).toFixed(2));

  // Pérdida Esperada Anual (PEA = f * I_medio)
  const expectedAnnualLossPEA = Number(
    (input.annualFrequencyNet * input.avgFinancialImpactMXN).toFixed(2)
  );

  // Pérdida Máxima Anual (PMA / VaR Operacional 99.9% aproximado)
  const poisson999Quantile =
    input.annualFrequencyNet > 0
      ? input.annualFrequencyNet + 3.09 * Math.sqrt(input.annualFrequencyNet)
      : 0;
  const severityTailWeighted =
    0.35 * input.avgFinancialImpactMXN + 0.65 * input.worstCaseImpactMXN;
  const maxAnnualLossPMA = Number(
    Math.max(expectedAnnualLossPEA, Math.sqrt(Math.max(1, poisson999Quantile)) * severityTailWeighted).toFixed(2)
  );

  return {
    inherentScore,
    inherentZone: mapScoreTo5x5Zone(inherentScore),
    residualProbability,
    residualImpact,
    residualScore,
    residualZone: mapScoreTo5x5Zone(residualScore),
    expectedAnnualLossPEA,
    maxAnnualLossPMA,
  };
}

export function mapScoreTo5x5Zone(score: number): RAFZone {
  if (score <= 4) return "GREEN";
  if (score <= 9) return "YELLOW";
  if (score <= 15) return "ORANGE";
  return "RED";
}
