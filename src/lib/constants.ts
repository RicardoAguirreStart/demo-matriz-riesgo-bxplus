// src/lib/constants.ts

import { BusinessLineBancoBx, RAFZone, RiskTypeCNBV, RoleType } from "@/types";

export const BX_COLORS = {
  lime: "#C0D725",
  limeHover: "#AEC41D",
  cyan: "#3299A8",
  cyanDark: "#277A87",
  slateDark: "#1F242B",
  surface: "#F5F7F9",
  white: "#FFFFFF",
  rafGreen: "#10B981",
  rafYellow: "#F59E0B",
  rafOrange: "#F97316",
  rafRed: "#EF4444",
};

export const RAF_ZONE_INFO: Record<RAFZone, { label: string; bg: string; text: string; border: string; desc: string }> = {
  GREEN: {
    label: "Zona Verde (Dentro de Apetito)",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    border: "border-emerald-500",
    desc: "Exposición dentro del Apetito al Riesgo. Operación normal continua.",
  },
  YELLOW: {
    label: "Zona Amarilla (Atención Preventiva)",
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    border: "border-amber-500",
    desc: "Apetito < Exposición <= Tolerancia. Notificación preventiva de la UAIR para contención.",
  },
  ORANGE: {
    label: "Zona Naranja (Excede Tolerancia)",
    bg: "bg-orange-500/10",
    text: "text-orange-700",
    border: "border-orange-500",
    desc: "Tolerancia < Exposición <= Límite. Plan de Remediación firmado obligatorio (<5 días hábiles).",
  },
  RED: {
    label: "Zona Roja (Transgresión de Límite)",
    bg: "bg-rose-500/10",
    text: "text-rose-700",
    border: "border-rose-500",
    desc: "Exposición > Límite. Escalamiento inmediato al CAIR y activación de protocolo de emergencia.",
  },
};

export const RISK_TYPE_LABELS: Record<RiskTypeCNBV, { name: string; color: string; badge: string }> = {
  CREDIT: { name: "Riesgo de Crédito y Concentración", color: "#3B82F6", badge: "CNBV CUB Anexo 15 Bis / NIF C-16" },
  MARKET: { name: "Riesgo de Mercado", color: "#6366F1", badge: "CNBV Título II Cap. IV (VaR 99%)" },
  LIQUIDITY: { name: "Riesgo de Liquidez y Fondeo", color: "#06B6D4", badge: "Banxico CCL / IDEL Anexo 12-C" },
  OPERATIONAL: { name: "Riesgo Operacional", color: "#F59E0B", badge: "Anexo 1-D Bis (Indicador Negocio IN)" },
  TECHNOLOGICAL: { name: "Riesgo Tecnológico e Infraestructura", color: "#8B5CF6", badge: "CUB Art. 86 / Serie R24" },
  LEGAL: { name: "Riesgo Legal y Regulatorio", color: "#64748B", badge: "Portafolio Global de Juicios CUB" },
  CYBERSECURITY: { name: "Ciberseguridad y Resiliencia SPEI", color: "#EF4444", badge: "Anexos 64 Bis, 72 y Circular 8/2019" },
  ESG_CLIMATE: { name: "Riesgo ASG y Cambio Climático", color: "#10B981", badge: "Taxonomía Sostenible SHCP / DNSH" },
  REPUTATIONAL: { name: "Riesgo Reputacional", color: "#EC4899", badge: "Metodología Rimac / Escala 1 a 5" },
  STRATEGIC: { name: "Riesgo Estratégico de Negocio", color: "#14B8A6", badge: "CUB Art. 85 / Plan Quinquenal B×+" },
  FRAUD_INTERNAL_EXTERNAL: { name: "Prevención de Fraude Interno/Externo", color: "#D97706", badge: "Plan Director Anexo 12-E CUB" },
};

export const BUSINESS_LINES_CONFIG: { id: BusinessLineBancoBx; label: string; unitCode: string }[] = [
  { id: "ALL", label: "Vista Consolidada Banco B×+", unitCode: "GRP-BX+" },
  { id: "TESORERIA_MERCADO_DINERO", label: "Tesorería y Mercado de Dinero", unitCode: "TES-01" },
  { id: "AGRONEGOCIOS", label: "Banca Agropecuaria (Agronegocios)", unitCode: "CRED-AGRO" },
  { id: "BANCA_PYME", label: "Banca PyME y Comercial", unitCode: "CRED-PYME" },
  { id: "BANCA_EMPRESARIAL_CORPORATIVA", label: "Banca Empresarial y Corporativa", unitCode: "CRED-EMP" },
  { id: "OPERACIONES_Y_SPEI", label: "Operaciones y Pagos SPEI", unitCode: "OP-SPEI" },
  { id: "TI_Y_CIBERSEGURIDAD", label: "Tecnología y Ciberseguridad", unitCode: "TI-CIB" },
  { id: "DERIVADOS_Y_CAMBIOS", label: "Derivados y Cambios (FX)", unitCode: "MKT-DERIV" },
];

export const DEMO_ROLES: { id: RoleType; label: string; lineDef: string; description: string }[] = [
  { id: "C_LEVEL_CAIR", label: "Consejo / CAIR (C-Level)", lineDef: "Ápice Colegiado", description: "Supervisión ejecutiva, aprobación de límites y gobierno de apetito al riesgo." },
  { id: "UAIR_ADMIN", label: "Administrador UAIR (2ª Línea)", lineDef: "2ª Línea de Defensa", description: "Parametrización metodológica, aprobación de matrices vivas y monitoreo RAF." },
  { id: "PROCESS_OWNER", label: "Dueño de Proceso (1ª Línea)", lineDef: "1ª Línea de Defensa", description: "Modelado de diagramas de flujo, mitigación de riesgos y ejecución de controles." },
  { id: "INTERNAL_AUDITOR", label: "Auditor Interno / CNBV (3ª Línea)", lineDef: "3ª Línea de Defensa", description: "Revisión independiente, verificación de Audit Trail SHA-256 y Serie R24." },
];
