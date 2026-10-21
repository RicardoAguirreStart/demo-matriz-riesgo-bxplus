// src/types/index.ts

export type RoleType =
  | "C_LEVEL_CAIR"
  | "UAIR_ADMIN"
  | "UAIR_ANALYST"
  | "PROCESS_OWNER"
  | "CONTROL_OWNER"
  | "INTERNAL_AUDITOR";

export type BusinessLineBancoBx =
  | "ALL"
  | "BANCA_EMPRESARIAL_CORPORATIVA"
  | "BANCA_PYME"
  | "AGRONEGOCIOS"
  | "TESORERIA_MERCADO_DINERO"
  | "DERIVADOS_Y_CAMBIOS"
  | "BANCA_PATRIMONIAL_PRIVADA"
  | "ARRENDAMIENTO_FACTORING"
  | "OPERACIONES_Y_SPEI"
  | "TI_Y_CIBERSEGURIDAD";

export type ProcessCategory = "BUSINESS" | "SUPPORT";

export type CreditCycleStage =
  | "PROMOTION"
  | "EVALUATION"
  | "APPROVAL"
  | "INSTRUMENTATION"
  | "CONTROL_RECOVERY"
  | "NOT_APPLICABLE";

export type FlowNodeType =
  | "START_END"
  | "TASK_STEP"
  | "DECISION_GATEWAY"
  | "CONTROL_POINT"
  | "FRAUD_CHECKPOINT"
  | "EXTERNAL_SYSTEM";

export type RiskClassification =
  | "QUANTIFIABLE_DISCRETIONARY"
  | "QUANTIFIABLE_NON_DISCRETIONARY"
  | "NON_QUANTIFIABLE_EMERGING";

export type RiskTypeCNBV =
  | "CREDIT"
  | "MARKET"
  | "LIQUIDITY"
  | "OPERATIONAL"
  | "TECHNOLOGICAL"
  | "LEGAL"
  | "CYBERSECURITY"
  | "ESG_CLIMATE"
  | "REPUTATIONAL"
  | "STRATEGIC"
  | "FRAUD_INTERNAL_EXTERNAL";

export type RiskOrigin =
  | "PROCESSES"
  | "PEOPLE"
  | "TECHNOLOGY"
  | "EXTERNAL_EVENTS"
  | "THIRD_PARTY_SUPPLIERS";

export type RAFZone = "GREEN" | "YELLOW" | "ORANGE" | "RED";

export type ControlNature = "PREVENTIVE" | "DETECTIVE" | "CORRECTIVE";

export type ControlExecutionTiming =
  | "ONLINE_REALTIME"
  | "DAILY_D1"
  | "WEEKLY_D7"
  | "MONTHLY_D30"
  | "OCCASIONAL";

export type ControlAutomation = "AUTOMATED" | "SEMI_AUTOMATED" | "MANUAL";

export type ActionPlanType = "TECHNOLOGY" | "PROCESSES" | "ORGANIZATION";

export type EffortScale = "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export type PlanStatus =
  | "DRAFT"
  | "APPROVED_COMMITTED"
  | "IN_PROGRESS"
  | "EVIDENCE_SUBMITTED"
  | "VALIDATED_CLOSED"
  | "OVERDUE_ESCALATED";

export interface BxProcessNodeData {
  id: string;
  label: string;
  description?: string;
  nodeType: FlowNodeType;
  creditStage: CreditCycleStage;
  responsibleRole?: string;
  systemUsed?: string;
  riskCount: number;
  maxResidualZone: RAFZone;
  totalPEA: number;
  totalPMA: number;
  hasSodViolation?: boolean;
  sodViolationMessage?: string;
  hasFraudCheckpoint?: boolean;
  bcpCritical?: boolean;
  rtoHours?: number;
  rpoHours?: number;
}
