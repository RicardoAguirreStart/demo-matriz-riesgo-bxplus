// src/lib/engines/market-liquidity-engine.ts

export interface MarketRiskInput {
  portfolioValueMXN: number;
  dailyVolatilityPct: number;    // Sigma diaria (ej. 1.25%)
  confidenceLevel: number;       // 0.99 para 99%
  horizonDays: number;           // 1 día a 10 días
  expectedReturnDaily?: number;
}

export interface LiquidityRiskInput {
  highQualityLiquidAssetsALAC: number; // ALAC (MXN)
  netCashOutflows30Days: number;       // Salidas netas de efectivo a 30 días bajo estrés (MXN)
  inflows30DaysCapped?: number;
  positions30_60_90Days: {
    day30NetPosition: number;
    day60NetPosition: number;
    day90NetPosition: number;
  };
}

export interface SolvencyCapitalInput {
  cet1CapitalMXN: number;
  at1CapitalMXN: number;
  tier2CapitalMXN: number;
  aprcCreditRWA: number;
  aprmMarketRWA: number;
  aproOperationalRWA: number;
}

/**
 * 1. Valor en Riesgo Paramétrico (VaR 99%) y VaR Condicional (CVaR 99% / Expected Shortfall)
 */
export function calculateParametricVaR(input: MarketRiskInput) {
  // Para alpha = 0.01 (99% de confianza), Z = 2.32635
  const zScore99 = 2.3263479;
  const timeFactor = Math.sqrt(input.horizonDays);
  const dailySigma = input.dailyVolatilityPct / 100;

  // VaR = Portafolio * Z * sigma * sqrt(h)
  const var99MXN = input.portfolioValueMXN * zScore99 * dailySigma * timeFactor;

  // CVaR (Expected Shortfall normal): ES = Portafolio * [phi(Z) / alpha] * sigma * sqrt(h)
  // phi(2.32635) / 0.01 ~ 0.02665 / 0.01 = 2.665
  const esMultiplier = 2.6652;
  const cvar99MXN = input.portfolioValueMXN * esMultiplier * dailySigma * timeFactor;

  return {
    var99MXN: Number(var99MXN.toFixed(2)),
    cvar99MXN: Number(cvar99MXN.toFixed(2)),
    varPct: Number(((var99MXN / input.portfolioValueMXN) * 100).toFixed(3)),
    cvarPct: Number(((cvar99MXN / input.portfolioValueMXN) * 100).toFixed(3)),
  };
}

/**
 * 2. Coeficiente de Cobertura de Liquidez (CCL >= 100%) e Índice de Deficiencia de Liquidez (IDEL)
 */
export function calculateLiquidityMetrics(input: LiquidityRiskInput) {
  const ccl =
    input.netCashOutflows30Days > 0
      ? (input.highQualityLiquidAssetsALAC / input.netCashOutflows30Days) * 100
      : 100.0;

  const { day30NetPosition, day60NetPosition, day90NetPosition } = input.positions30_60_90Days;

  // IDEL: mide la severidad del déficit de liquidez si alguna posición acumulada cae por debajo de cero
  const minPosition = Math.min(day30NetPosition, day60NetPosition, day90NetPosition);
  const idelSeverityScore = minPosition < 0 ? Math.abs(minPosition) / input.highQualityLiquidAssetsALAC : 0.0;

  let cclZone: "GREEN" | "YELLOW" | "ORANGE" | "RED" = "GREEN";
  if (ccl < 100) cclZone = "RED";
  else if (ccl < 110) cclZone = "ORANGE";
  else if (ccl < 120) cclZone = "YELLOW";
  else cclZone = "GREEN";

  return {
    cclPct: Number(ccl.toFixed(2)),
    cclZone,
    minNetPositionMXN: Number(minPosition.toFixed(2)),
    idelSeverityScore: Number(idelSeverityScore.toFixed(4)),
    hasLiquidityDeficit: minPosition < 0,
    day30NetPosition,
    day60NetPosition,
    day90NetPosition,
  };
}

/**
 * 3. Solvencia Regulatoria Basilea III: CET1, Tier 1, ICAP y Razón de Apalancamiento
 */
export function calculateSolvencyRatios(input: SolvencyCapitalInput) {
  const totalRWA = input.aprcCreditRWA + input.aprmMarketRWA + input.aproOperationalRWA;
  const netCapitalMXN = input.cet1CapitalMXN + input.at1CapitalMXN + input.tier2CapitalMXN;
  const tier1CapitalMXN = input.cet1CapitalMXN + input.at1CapitalMXN;

  const cet1Ratio = totalRWA > 0 ? (input.cet1CapitalMXN / totalRWA) * 100 : 0;
  const tier1Ratio = totalRWA > 0 ? (tier1CapitalMXN / totalRWA) * 100 : 0;
  const icapTotalRatio = totalRWA > 0 ? (netCapitalMXN / totalRWA) * 100 : 0;

  // Semaforización ICAP (Regulación Mexicana: Mínimo 8.0% + 2.5% Suplemento de Conservación = 10.5% exigible)
  let icapZone: "GREEN" | "YELLOW" | "ORANGE" | "RED" = "GREEN";
  if (icapTotalRatio < 10.5) icapZone = "RED";
  else if (icapTotalRatio < 11.5) icapZone = "ORANGE";
  else if (icapTotalRatio < 13.0) icapZone = "YELLOW";
  else icapZone = "GREEN";

  return {
    totalRWA: Number(totalRWA.toFixed(2)),
    netCapitalMXN: Number(netCapitalMXN.toFixed(2)),
    tier1CapitalMXN: Number(tier1CapitalMXN.toFixed(2)),
    cet1Ratio: Number(cet1Ratio.toFixed(2)),
    tier1Ratio: Number(tier1Ratio.toFixed(2)),
    icapTotalRatio: Number(icapTotalRatio.toFixed(2)),
    icapZone,
  };
}
