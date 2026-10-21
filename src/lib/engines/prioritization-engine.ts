// src/lib/engines/prioritization-engine.ts

export interface RiskPrioritizationItem {
  id: string;
  code: string;
  title: string;
  residualScore: number;          // 1 a 25
  maxAnnualLossPMA: number;       // PMA en MXN
  reputationalImpactLevel: number; // 1 a 5
  hasUnverifiedControls: boolean; // Falta de evidencia documental
  isEmergingRisk: boolean;        // ASG / Ciberseguridad
  speiImpact: boolean;            // Afectación a canal crítico SPEI
  residualZone: string;
  businessUnitName?: string;
  processName?: string;
}

export function computeCriticalityRankScore(
  risk: {
    residualScore: number;
    maxAnnualLossPMA: number;
    reputationalImpactLevel: number;
    hasUnverifiedControls: boolean;
    isEmergingRisk: boolean;
    speiImpact: boolean;
  },
  portfolioMaxPMA: number
): number {
  const normResidual = (risk.residualScore / 25) * 100; // Peso: 35%
  const normPMA =
    portfolioMaxPMA > 0 ? (risk.maxAnnualLossPMA / portfolioMaxPMA) * 100 : 0; // Peso: 30%
  const normReputation = (risk.reputationalImpactLevel / 5) * 100; // Peso: 15%
  const controlGapPenalty = risk.hasUnverifiedControls ? 100 : 0;  // Peso: 10%
  const emergingBoost = (risk.isEmergingRisk ? 50 : 0) + (risk.speiImpact ? 50 : 0); // Peso: 10%

  const compositeScore =
    0.35 * normResidual +
    0.30 * normPMA +
    0.15 * normReputation +
    0.10 * controlGapPenalty +
    0.10 * emergingBoost;

  return Number(compositeScore.toFixed(2));
}

/**
 * Filtra y ordena el Top 5 a 7 de riesgos críticos
 */
export function extractTopCriticalRisks<T extends RiskPrioritizationItem>(
  risks: T[],
  limit: number = 7
): (T & { rankScore: number; rank: number })[] {
  if (!risks.length) return [];

  const maxPMA = Math.max(...risks.map((r) => r.maxAnnualLossPMA), 1);

  const scored = risks.map((risk) => {
    const rankScore = computeCriticalityRankScore(risk, maxPMA);
    return { ...risk, rankScore };
  });

  scored.sort((a, b) => b.rankScore - a.rankScore);

  return scored.slice(0, limit).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
