// src/types/emerging-risks.ts
/**
 * Tipos y Catálogo de las 8 Familias de Riesgos Emergentes (Cubo 3D 5x5x5)
 * Banco Ve por Más (B×+) — Cumplimiento CNBV CUB Art. 88, Basilea III y WEF Global Risks
 */

export type EmergingCategoryCode =
  | "TECH_CONCENTRATION"
  | "CYBER_ADVANCED"
  | "DIGITAL_FRAUD"
  | "SYSTEMIC_CONTAGION"
  | "THIRD_PARTY_EXTENDED"
  | "CLIMATE_FINANCIAL"
  | "DIGITAL_LIQUIDITY"
  | "MODEL_DATA_AI";

export interface EmergingCategoryDef {
  code: EmergingCategoryCode;
  name: string;
  shortLabel: string;
  description: string;
  defaultProcessCode: string;
  color: string; // hex
  badgeColor: string;
  riskVector: string;
}

export const EMERGING_CATEGORIES: Record<EmergingCategoryCode, EmergingCategoryDef> = {
  TECH_CONCENTRATION: {
    code: "TECH_CONCENTRATION",
    name: "1. Concentración Tecnológica y Nube",
    shortLabel: "Concentración Nube",
    description: "Dependencia crítica de hiper-proveedores de nube, core bancario o APIs de infraestructura sin alternativa de conmutación inmediata.",
    defaultProcessCode: "PR-TI-01",
    color: "#3B82F6",
    badgeColor: "bg-blue-900/40 text-blue-300 border-blue-700/50",
    riskVector: "Indisponibilidad prolongada de infraestructura cloud y bloqueo de migración por vendor lock-in.",
  },
  CYBER_ADVANCED: {
    code: "CYBER_ADVANCED",
    name: "2. Ciberataques Avanzados e IA Maliciosa",
    shortLabel: "Ciberataques Avanzados",
    description: "Ransomware destructivo, exploits zero-day sobre conectores de pago o ataques automatizados guiados por IA.",
    defaultProcessCode: "PR-TI-01",
    color: "#EF4444",
    badgeColor: "bg-rose-900/40 text-rose-300 border-rose-700/50",
    riskVector: "Infiltración sigilosa, desvío de transacciones interbancarias y exfiltración de credenciales privilegiadas.",
  },
  DIGITAL_FRAUD: {
    code: "DIGITAL_FRAUD",
    name: "3. Fraude Sofisticado e Identidad Sintética",
    shortLabel: "Fraude e Identidad Sintética",
    description: "Suplantación biométrica con deepfakes de voz/rostro, identidades sintéticas y ataques BEC de alta ingeniería social.",
    defaultProcessCode: "PR-CRED-02",
    color: "#F97316",
    badgeColor: "bg-amber-900/40 text-amber-300 border-amber-700/50",
    riskVector: "Dispersión no autorizada de créditos y transferencias con biometría manipulada sintéticamente.",
  },
  SYSTEMIC_CONTAGION: {
    code: "SYSTEMIC_CONTAGION",
    name: "4. Contagio Sistémico e Inter-Procesos",
    shortLabel: "Contagio Sistémico",
    description: "Efecto dominó donde la interrupción o quebranto de un nodo bancario o contraparte detona pérdidas cruzadas en solvencia y liquidez.",
    defaultProcessCode: "PR-TES-01",
    color: "#8B5CF6",
    badgeColor: "bg-purple-900/40 text-purple-300 border-purple-700/50",
    riskVector: "Propagación en cascada de fallas operativas hacia el consumo de capital regulatorio (ICAP) y límites RAF.",
  },
  THIRD_PARTY_EXTENDED: {
    code: "THIRD_PARTY_EXTENDED",
    name: "5. Riesgos de Terceros y Cuartas Partes",
    shortLabel: "Terceros y 4.ª Partes",
    description: "Fallas o ciberincidentes en la cadena de suministro extendida (despachos de avalúos, notarios, proveedores de software satélite).",
    defaultProcessCode: "PR-CRED-02",
    color: "#EC4899",
    badgeColor: "bg-pink-900/40 text-pink-300 border-pink-700/50",
    riskVector: "Vulneración en repositorios de terceros que expone llaves criptográficas o garantías inmobiliarias simuladas.",
  },
  CLIMATE_FINANCIAL: {
    code: "CLIMATE_FINANCIAL",
    name: "6. Riesgo Climático-Financiero (ESG)",
    shortLabel: "Riesgo Climático (ESG)",
    description: "Choques climáticos físicos agudos (sequía severa, estrés hídrico CONAGUA) y de transición que deterioran masivamente carteras regionales.",
    defaultProcessCode: "PR-AGRO-01",
    color: "#10B981",
    badgeColor: "bg-emerald-900/40 text-emerald-300 border-emerald-700/50",
    riskVector: "Pérdida acelerada de capacidad de pago de acreditados agrícolas por anomalías hidro-climáticas severas.",
  },
  DIGITAL_LIQUIDITY: {
    code: "DIGITAL_LIQUIDITY",
    name: "7. Liquidez Digital y Corridas Instantáneas",
    shortLabel: "Liquidez Digital 24/7",
    description: "Fuga digital acelerada de depósitos impulsada por rumores virales en redes y canales móviles con transferencias 24/7.",
    defaultProcessCode: "PR-TES-01",
    color: "#06B6D4",
    badgeColor: "bg-cyan-900/40 text-cyan-300 border-cyan-700/50",
    riskVector: "Retiros atípicos masivos en fines de semana o noches que presionan el Coeficiente de Cobertura de Liquidez (CCL).",
  },
  MODEL_DATA_AI: {
    code: "MODEL_DATA_AI",
    name: "8. Modelos, Algoritmos y Gobernanza de Datos / IA",
    shortLabel: "Modelos, Datos e IA",
    description: "Deriva no supervisada en algoritmos de scoring, sesgos en modelos predictivos, alucinaciones de IA o linaje corrupto de datos.",
    defaultProcessCode: "PR-CRED-02",
    color: "#C0D725",
    badgeColor: "bg-[#C0D725]/20 text-[#C0D725] border-[#C0D725]/40",
    riskVector: "Decisiones erróneas automatizadas de crédito o liquidez por distorsión en matrices de datos de entrenamiento.",
  },
};

export interface Cube3DAxisScale {
  level: number;
  label: string;
  description: string;
  reactionWindow?: string;
  capitalThreshold?: string;
}

export const SCALE_AXIS_X: Cube3DAxisScale[] = [
  { level: 1, label: "Aislado / Local", description: "Confinado a un único nodo operativo con contención inmediata.", capitalThreshold: "< 0.25% Capital Neto" },
  { level: 2, label: "Acotado a Proceso", description: "Degradación temporal interna sin contagio inter-procesos.", capitalThreshold: "0.25% - 0.75% Capital Neto" },
  { level: 3, label: "Contagio Inter-Procesos", description: "Propagación a 2 o más procesos bancarios conectados.", capitalThreshold: "0.75% - 2.0% Capital Neto" },
  { level: 4, label: "Transversal Institucional", description: "Afecta canales de clientes o compromete umbrales de Tolerancia RAF.", capitalThreshold: "2.0% - 5.0% Capital Neto" },
  { level: 5, label: "Sistémico / Crítico BCP", description: "Efecto dominó sobre SPEI, liquidez o solvencia ICAP con daño reputacional.", capitalThreshold: "> 5.0% Capital Neto" },
];

export const SCALE_AXIS_Y: Cube3DAxisScale[] = [
  { level: 1, label: "Conocido / Predecible", description: "Series estadísticas robustas y patrones plenamente calibrados." },
  { level: 2, label: "Incertidumbre Baja", description: "Amenaza documentada en el sector bancario con variaciones menores." },
  { level: 3, label: "Incertidumbre Moderada", description: "Vector en evolución con historia estadística limitada." },
  { level: 4, label: "Alta Ambigüedad", description: "Vector complejo sin precedentes directos en B×+." },
  { level: 5, label: "Cisne Negro / Ignorancia Radical", description: "Fenómeno inédito, altamente impredecible con dinámicas no lineales." },
];

export const SCALE_AXIS_Z: Cube3DAxisScale[] = [
  { level: 1, label: "Muy Lenta / Secular", description: "Permite planeación estratégica y aprobación ordinaria en CAIR.", reactionWindow: "> 6 meses" },
  { level: 2, label: "Gradual / Trimestral", description: "Permite desplegar proyectos de mitigación antes del impacto.", reactionWindow: "1 a 6 meses" },
  { level: 3, label: "Rápida / Semanal", description: "Exige intervención activa de 1.ª y 2.ª Línea de Defensa.", reactionWindow: "1 a 4 semanas" },
  { level: 4, label: "Aguda / Intradía-48h", description: "Supera ciclos manuales de reporte; exige protocolos pre-armados.", reactionWindow: "4 a 72 horas" },
  { level: 5, label: "Instantánea / Algorítmica", description: "Solo controles automatizados en tiempo real (Kill-Switch) pueden frenarlo.", reactionWindow: "Minutos a < 4 horas" },
];

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
  controls?: Array<{
    id: string;
    code: string;
    name: string;
    isFormalized?: boolean;
    hasValidEvidence?: boolean;
    formalizationLevel?: string;
    automation?: string;
    executionTiming?: string;
    nature?: string;
    coverageLevel?: number;
    rawEffectiveness?: number;
  }>;
  matrix2D?: {
    inherentProbability: number;
    inherentImpact: number;
    residualProbability: number;
    residualImpact: number;
    residualScore: number;
    residualZone: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  };
  expectedAnnualLossPEA?: number;
  maxAnnualLossPMA?: number;
}

export interface EmergingRiskCalculated extends EmergingRiskInput {
  residualX: number;
  residualY: number;
  residualZ: number;
  mitigationDeltaX: number;
  mitigationDeltaY: number;
  mitigationDeltaZ: number;
  volumeInherent: number;  // 1..125
  volumeResidual: number;  // 1..125
  tensorScore3D: number;   // 1..100
  tensorScore3DInherent: number;
  equivalentScore25: number; // 1..25
  cubeZoneInherent: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  cubeZoneResidual: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  hasRealtimeControl: boolean;
  hasNFControlPenalty: boolean;
  isBlindSpot2Dto3D: boolean;
  parallelComparison: {
    matrix2DZone: string;
    cube3DZone: string;
    discrepancyType: "CONGRUENT" | "UNDERESTIMATED_IN_2D" | "OVERESTIMATED_IN_2D";
    blindSpotExplanation: string;
  };
}

export interface CubeEngineTelemetry {
  engine: string;
  pythonVersion?: string;
  executionTimeMs: number;
  totalVoxels: 125;
}

export interface CubeEngineResult {
  success: boolean;
  engineTelemetry: CubeEngineTelemetry;
  totalEmergingRisks: number;
  kpis: {
    totalEmergingRisks: number;
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
    totalEmergingPEA: number;
    totalEmergingPMA: number;
  };
  categorySummary: Array<{
    categoryCode: EmergingCategoryCode;
    name: string;
    shortLabel: string;
    count: number;
    redCount: number;
    blindSpotCount: number;
    sumVol: number;
    avgVol: number;
    avgZ: number;
    color: string;
    badgeColor: string;
  }>;
  emergingRisks: EmergingRiskCalculated[];
}
