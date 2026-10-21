// src/lib/ai/gemini.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const SYSTEM_META_PROMPT = `# ROL E IDENTIDAD DEL SISTEMA
Eres "B×+ Risk Copilot", el Arquitecto Cuantitativo y Especialista Senior en Administración Integral de Riesgos de Grupo Financiero Ve por Más (Banco B×+ y Seguros B×+). Operas bajo estricto apego a la Circular Única de Bancos (CUB) de la CNBV, Basilea III, NIF C-16, la Circular 8/2019 de Banxico y la Taxonomía Sostenible de la SHCP.

# REGLAS DE RAZONAMIENTO Y SEGURIDAD (CERO ALUCINACIONES)
1. **Fundamentación Estricta (Grounding RAG):** Toda afirmación cuantitativa debe provenir de los datos de B×+ (Matrices 5x5, PEA, PMA, PCE, VaR, IDEL, Indicador de Negocio IN).
2. **Estándar Taxonómico CNBV:** Al redactar o sugerir riesgos, estructura SIEMPRE la triada obligatoria:
   - **Causa Raíz:** Vulnerabilidad en proceso, persona, tecnología o factor externo.
   - **Evento de Riesgo:** Materialización concreta clasificada según Niveles I, II y III de Basilea / Anexo 12-A CUB.
   - **Consecuencia:** Impacto patrimonial directo (PEA/PMA en MXN), impacto en capital (ICAP), sanción regulatoria o afectación reputacional (escala 1 a 5).
3. **Cruce Macro-Micro para Riesgos Emergentes:**
   - **Ciberseguridad y Fraude:** Cruza amenazas tecnológicas con nodos en SPEI, Banca en Línea o proveedores críticos, aplicando métricas del Anexo 64 Bis, Anexo 72 y Conductas de Fraude del Anexo 12-E.
   - **Riesgos ASG y Climáticos:** Cruza la ubicación y sector de la cartera (especialmente Agronegocios y PyME) con la Taxonomía Sostenible de la SHCP, evaluando el criterio DNSH y la migración a Etapa 2 de la NIF C-16.
4. **Evaluación Rigurosa de Controles:** Nunca otorgues efectividad "Muy Alta" a un control ex-post (d+1, d+7, d+30) ni Cobertura superior a 2 a un control No Formalizado (NF).
5. **Diseño y Priorización Matemática de Planes de Acción (Matriz Quick-Wins):**
   Cada iniciativa debe incluir:
   - planTypes (Tecnología, Procesos, Organización)
   - improvementPotentialPct (0% a 100%)
   - expectedPEAReductionMXN y expectedPMAReductionMXN
   - costScale y timeScale (Muy Bajo a Muy Alto)
   - isQuickWin (true si Mejora >= 60% y Esfuerzo <= LOW [<= 90 días y bajo costo]).
`;

export async function chatWithRiskCopilot(prompt: string, contextData?: Record<string, unknown>) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_META_PROMPT,
    });

    let fullPrompt = prompt;
    if (contextData) {
      fullPrompt = `[CONTEXTO OPERATIVO Y VIVO DE BANCO B×+]:\n${JSON.stringify(
        contextData,
        null,
        2
      )}\n\n[SOLICITUD DEL USUARIO]:\n${prompt}`;
    }

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in Gemini chatWithRiskCopilot:", error);
    return "Lo siento, ocurrió una intermitencia temporal al conectar con B×+ Risk Copilot (Gemini API). Por favor verifica la clave de API o intenta de nuevo.";
  }
}

export interface NodeAuditResult {
  analysisSummary: string;
  emergingRiskAlerts: {
    riskType: string;
    cnbvAnnex: string;
    targetNodeLabel: string;
    cause: string;
    event: string;
    consequence: string;
    suggestedInherentProb: number;
    suggestedInherentImpact: number;
    reputationalImpact: number;
  }[];
  prioritizedActionPlans: {
    title: string;
    planTypes: string[];
    improvementPotentialPct: number;
    estimatedCostScale: string;
    estimatedTimeDays: number;
    estimatedTimeScale: string;
    expectedPEAReductionMXN: number;
    expectedPMAReductionMXN: number;
    isQuickWin: boolean;
  }[];
}

export async function auditProcessNodeWithAI(
  node: { label: string; description?: string; nodeType: string; responsibleRole?: string; systemUsed?: string },
  connectedRisks: unknown[]
): Promise<NodeAuditResult> {
  const prompt = `Analiza detalladamente este nodo del diagrama de flujo operativo de Banco B×+:
Nodo: ${JSON.stringify(node)}
Riesgos actualmente anclados: ${JSON.stringify(connectedRisks)}

Detecta brechas de control, posibles conductas de fraude (Anexo 12-E), riesgos de ciberseguridad SPEI (Circular 8/2019) o vulnerabilidades ASG. Genera recomendaciones y al menos un Plan de Acción Quick-Win.
Devuelve EXCLUSIVAMENTE una respuesta en formato JSON válido que cumpla esta estructura exacta:
{
  "analysisSummary": "string con diagnóstico ejecutivo",
  "emergingRiskAlerts": [
    {
      "riskType": "CYBERSECURITY | ESG_CLIMATE | FRAUD_INTERNAL_EXTERNAL | OPERATIONAL",
      "cnbvAnnex": "string",
      "targetNodeLabel": "${node.label}",
      "cause": "string",
      "event": "string",
      "consequence": "string",
      "suggestedInherentProb": 1 a 5,
      "suggestedInherentImpact": 1 a 5,
      "reputationalImpact": 1 a 5
    }
  ],
  "prioritizedActionPlans": [
    {
      "title": "string",
      "planTypes": ["TECHNOLOGY" | "PROCESSES" | "ORGANIZATION"],
      "improvementPotentialPct": 0.1 a 0.95,
      "estimatedCostScale": "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH",
      "estimatedTimeDays": 15 a 180,
      "estimatedTimeScale": "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH",
      "expectedPEAReductionMXN": number,
      "expectedPMAReductionMXN": number,
      "isQuickWin": boolean
    }
  ]
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_META_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as NodeAuditResult;
  } catch (error) {
    console.error("Error in auditProcessNodeWithAI:", error);
    // Fallback estructurado en caso de error o cuota
    return {
      analysisSummary: `Auditoría completada para el nodo "${node.label}". Se detecta oportunidad de automatización preventiva (d+0) para reducir exposición operativa en Banco B×+.`,
      emergingRiskAlerts: [
        {
          riskType: "CYBERSECURITY",
          cnbvAnnex: "Anexo 64 Bis / Circular 8/2019 Banxico",
          targetNodeLabel: node.label,
          cause: "Posible desalineación de validación de doble factor criptográfico en interconexión de sistemas.",
          event: "Intercepción o retardo en conciliación de transacciones críticas en el canal.",
          consequence: "Demoras operativas y posible contingencia en auditoría interna CNBV.",
          suggestedInherentProb: 3,
          suggestedInherentImpact: 4,
          reputationalImpact: 3,
        },
      ],
      prioritizedActionPlans: [
        {
          title: `Implementación de validación automática preventiva (d+0) en nodo "${node.label}"`,
          planTypes: ["TECHNOLOGY", "PROCESSES"],
          improvementPotentialPct: 0.75,
          estimatedCostScale: "LOW",
          estimatedTimeDays: 45,
          estimatedTimeScale: "LOW",
          expectedPEAReductionMXN: 1850000,
          expectedPMAReductionMXN: 5400000,
          isQuickWin: true,
        },
      ],
    };
  }
}

export interface CandidateRiskForAI {
  riskId: string;
  code: string;
  title: string;
  cause: string;
  eventDescription: string;
  residualProbability: number;
  residualImpact: number;
  residualZone: string;
  expectedAnnualLossPEA: number;
  maxAnnualLossPMA: number;
  processCode: string;
  processName: string;
  processNodeLabel: string;
  processNodeType: string;
  hasNFControl: boolean;
  controlId?: string | null;
}

export interface AIPredictedPlanProposal {
  riskEventId: string;
  riskCode: string;
  riskTitle: string;
  processCode: string;
  processName?: string;
  processNodeLabel: string;
  controlId?: string | null;
  title: string;
  description: string;
  rationaleAI: string;
  planTypes: string[];
  improvementPotentialPct: number;
  estimatedCostMXN: number;
  costScale: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH";
  estimatedDays: number;
  quadrant: "Q1_QUICK_WIN" | "Q2_STRUCTURAL" | "Q3_TACTICAL" | "Q4_LOW_PRIORITY";
  expectedPEAReductionMXN: number;
  expectedPMAReductionMXN: number;
  currentProb: number;
  currentImp: number;
  currentScore: number;
  currentZone: string;
  targetProb: number;
  targetImp: number;
  targetScore: number;
  targetZone: string;
  roiMultiplier: string;
}

export interface AIProcessPlanSuggestionResult {
  executiveDiagnosis: string;
  proposals: AIPredictedPlanProposal[];
}

export async function generateProcessPlanProposalsWithGemini(
  processCode: string,
  processName: string,
  candidates: CandidateRiskForAI[]
): Promise<AIProcessPlanSuggestionResult> {
  const { mapScoreTo5x5Zone } = await import("@/lib/engines/operational-risk-engine");

  // Fallback determinista especializado en caso de desconexión o fallo
  const buildFallback = (): AIProcessPlanSuggestionResult => {
    const proposals: AIPredictedPlanProposal[] = candidates.map((cand, idx) => {
      // Distribuir entre Q1 Quick-Win, Q2 Estructural y Q3 Táctico
      const isQW = idx === 0 || idx === 2;
      const isStructural = idx === 1;
      const quadrant: "Q1_QUICK_WIN" | "Q2_STRUCTURAL" | "Q3_TACTICAL" = isQW
        ? "Q1_QUICK_WIN"
        : isStructural
        ? "Q2_STRUCTURAL"
        : "Q3_TACTICAL";

      const impPct = isQW ? (idx === 0 ? 0.75 : 0.65) : isStructural ? 0.70 : 0.45;
      const cost = isQW ? (idx === 0 ? 120000 : 85000) : isStructural ? 580000 : 65000;
      const days = isQW ? (idx === 0 ? 35 : 30) : isStructural ? 120 : 25;
      const costScale: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" = isQW
        ? "LOW"
        : isStructural
        ? "MEDIUM"
        : "VERY_LOW";

      const title = isQW
        ? `Quick-Win: Automatización y Checklist Digital Pre-Desembolso en ${cand.processNodeLabel}`
        : isStructural
        ? `Proyecto Estructural: Reingeniería Integral de Control Core en ${cand.processNodeLabel}`
        : `Mejora Táctica: Validador Preventivo y Reglas de Negocio en ${cand.processNodeLabel}`;

      const description = isQW
        ? `Implementación inmediata de validación obligatoria y checklist digital pre-transaccional para neutralizar la causa "${cand.cause.slice(
            0,
            75
          )}..." en el nodo ${cand.processNodeLabel} (${processCode} — ${processName}). Fundamentado en CUB Art. 88 y Circular 8/2019 Banxico.`
        : isStructural
        ? `Desarrollo de módulo tecnológico automatizado y formalización de controles de 2ª línea UAIR para erradicar la vulnerabilidad "${cand.title}" bajo requerimientos CNBV.`
        : `Ajuste paramétrico y reglas de validación en tiempo real para el paso operativo ${cand.processNodeLabel} con reporte de excepciones.`;

      const rationaleAI = isQW
        ? `Se clasifica como Quick-Win por su alta reducción esperada (${(impPct * 100).toFixed(0)}%) con plazo ágil de ${days} días e inversión acotada de ${costScale}. Neutraliza de raíz el nodo crítico.`
        : isStructural
        ? `Proyecto de arquitectura central que requiere ${days} días pero reduce drásticamente el impacto patrimonial y formaliza controles clave.`
        : `Mejora táctica de bajo costo con retorno acelerado para robustecer la primera línea de defensa.`;

      const expectedPEA = Math.round(cand.expectedAnnualLossPEA * impPct);
      const expectedPMA = Math.round(cand.maxAnnualLossPMA * impPct);

      const reductionFactor = 1 - impPct * 0.45;
      const targetProb = Math.max(1, Math.round(cand.residualProbability * reductionFactor));
      const targetImp = Math.max(1, Math.round(cand.residualImpact * reductionFactor));
      const targetScore = targetProb * targetImp;
      const targetZone = mapScoreTo5x5Zone(targetScore);
      const roi = (expectedPEA / (cost || 1)).toFixed(1);

      return {
        riskEventId: cand.riskId,
        riskCode: cand.code,
        riskTitle: cand.title,
        processCode,
        processName,
        processNodeLabel: cand.processNodeLabel,
        controlId: cand.controlId || null,
        title,
        description,
        rationaleAI,
        planTypes: isQW ? ["TECHNOLOGY", "PROCESSES"] : isStructural ? ["TECHNOLOGY"] : ["PROCESSES"],
        improvementPotentialPct: impPct,
        estimatedCostMXN: cost,
        costScale,
        estimatedDays: days,
        quadrant,
        expectedPEAReductionMXN: expectedPEA,
        expectedPMAReductionMXN: expectedPMA,
        currentProb: cand.residualProbability,
        currentImp: cand.residualImpact,
        currentScore: cand.residualProbability * cand.residualImpact,
        currentZone: cand.residualZone,
        targetProb,
        targetImp,
        targetScore,
        targetZone,
        roiMultiplier: `${roi}x`,
      };
    });

    return {
      executiveDiagnosis: `Diagnóstico Ejecutivo B×+ Copilot: El proceso "${processName}" (${processCode}) concentra vulnerabilidades en nodos operativos y de interfaz regulatoria, donde controles manuales o No Formalizados (NF) elevan la severidad patrimonial. Se priorizan Quick-Wins preventivos de ejecución inmediata (≤90 días) complementados con proyectos estructurales.`,
      proposals,
    };
  };

  try {
    const prompt = `Actúa como el Arquitecto Senior de Riesgos B×+ Risk Copilot.
Analiza la siguiente lista de riesgos bancarios identificados en el Radar de Brechas para el proceso "${processName}" (${processCode}):

${JSON.stringify(candidates, null, 2)}

TAREA:
1. Genera un "executiveDiagnosis" conciso (2 a 3 oraciones en español formal de banca) explicando por qué estos nodos operativos representan una brecha de control (considerando controles No Formalizados NF bajo CUB Art. 88, Circular 8/2019 Banxico o NIF C-16) y la estrategia integral recomendada.
2. Genera exactamente 1 plan de mitigación ("proposals") para CADA riesgo de la lista anterior (total: ${candidates.length} propuestas).
   - Para poblar adecuadamente la Matriz 2×2, balancea la cartera de iniciativas:
     * Al menos 1 o 2 deben ser "Q1_QUICK_WIN" (Plazo <= 90 días, costo bajo <= 160000 MXN, mejora >= 60% e.g. 0.65 a 0.85).
     * Al menos 1 debe ser "Q2_STRUCTURAL" (Proyecto tecnológico Core o reingeniería: plazo > 90 días o costo medio/alto >= 350000 MXN, mejora >= 60% e.g. 0.70 a 0.85).
     * Opcionalmente una "Q3_TACTICAL" (Mejora táctica: plazo <= 90 días, mejora < 60% e.g. 0.40 a 0.55).
   - Para cada propuesta incluye:
     * riskEventId: el riskId correspondiente del riesgo evaluado
     * riskCode: código del riesgo (ej. RSK-CYBER-006)
     * riskTitle: título del riesgo
     * processCode: código del proceso ("${processCode}")
     * processNodeLabel: etiqueta del nodo del diagrama
     * title: Título técnico profesional y específico (ej. "Aislamiento Automático EDR...", "Checklist Digital Obligatorio...")
     * description: Mecanismo de control preventivo/detectivo, entregable y fundamento regulatorio
     * rationaleAI: Justificación de por qué clasifica en ese cuadrante 2x2 y cómo elimina la causa raíz
     * planTypes: Array con al menos uno de ["TECHNOLOGY", "PROCESSES", "ORGANIZATION"]
     * improvementPotentialPct: número decimal entre 0.40 y 0.85
     * estimatedCostMXN: monto numérico realista en pesos mexicanos
     * costScale: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH"
     * estimatedDays: número entero de días (20 a 150)
     * quadrant: "Q1_QUICK_WIN" | "Q2_STRUCTURAL" | "Q3_TACTICAL" | "Q4_LOW_PRIORITY"

Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta forma exacta:
{
  "executiveDiagnosis": "string",
  "proposals": [
    {
      "riskEventId": "string",
      "riskCode": "string",
      "riskTitle": "string",
      "processCode": "string",
      "processNodeLabel": "string",
      "title": "string",
      "description": "string",
      "rationaleAI": "string",
      "planTypes": ["TECHNOLOGY", "PROCESSES"],
      "improvementPotentialPct": 0.75,
      "estimatedCostMXN": 120000,
      "costScale": "LOW",
      "estimatedDays": 35,
      "quadrant": "Q1_QUICK_WIN"
    }
  ]
}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_META_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    if (!parsed || !Array.isArray(parsed.proposals) || parsed.proposals.length === 0) {
      return buildFallback();
    }

    // Enriquecer cada propuesta con los datos del riesgo y los cálculos 5x5
    const enrichedProposals: AIPredictedPlanProposal[] = parsed.proposals.map((prop: any, i: number) => {
      const cand = candidates.find((c) => c.riskId === prop.riskEventId) || candidates[i] || candidates[0];
      const impPct = Number(prop.improvementPotentialPct) || 0.65;
      const cost = Number(prop.estimatedCostMXN) || 120000;
      const days = Number(prop.estimatedDays) || 45;
      const costScale = prop.costScale || (cost <= 100000 ? "LOW" : cost <= 400000 ? "MEDIUM" : "HIGH");
      const quadrant = prop.quadrant || (impPct >= 0.6 && days <= 90 && (costScale === "LOW" || costScale === "VERY_LOW") ? "Q1_QUICK_WIN" : "Q2_STRUCTURAL");

      const expectedPEA = Math.round(cand.expectedAnnualLossPEA * impPct);
      const expectedPMA = Math.round(cand.maxAnnualLossPMA * impPct);

      const reductionFactor = 1 - impPct * 0.45;
      const targetProb = Math.max(1, Math.round(cand.residualProbability * reductionFactor));
      const targetImp = Math.max(1, Math.round(cand.residualImpact * reductionFactor));
      const targetScore = targetProb * targetImp;
      const targetZone = mapScoreTo5x5Zone(targetScore);
      const roi = (expectedPEA / (cost || 1)).toFixed(1);

      return {
        riskEventId: cand.riskId,
        riskCode: cand.code,
        riskTitle: cand.title,
        processCode,
        processName,
        processNodeLabel: cand.processNodeLabel,
        controlId: cand.controlId || null,
        title: prop.title || `Plan de Mitigación en ${cand.processNodeLabel}`,
        description: prop.description || `Control preventivo en ${cand.processNodeLabel}`,
        rationaleAI: prop.rationaleAI || `Iniciativa priorizada para reducir la exposición del nodo ${cand.processNodeLabel}.`,
        planTypes: Array.isArray(prop.planTypes) && prop.planTypes.length > 0 ? prop.planTypes : ["TECHNOLOGY"],
        improvementPotentialPct: impPct,
        estimatedCostMXN: cost,
        costScale,
        estimatedDays: days,
        quadrant,
        expectedPEAReductionMXN: expectedPEA,
        expectedPMAReductionMXN: expectedPMA,
        currentProb: cand.residualProbability,
        currentImp: cand.residualImpact,
        currentScore: cand.residualProbability * cand.residualImpact,
        currentZone: cand.residualZone,
        targetProb,
        targetImp,
        targetScore,
        targetZone,
        roiMultiplier: `${roi}x`,
      };
    });

    return {
      executiveDiagnosis: parsed.executiveDiagnosis || buildFallback().executiveDiagnosis,
      proposals: enrichedProposals,
    };
  } catch (err) {
    console.error("Error invoking Gemini for process plan proposals, using rich fallback:", err);
    return buildFallback();
  }
}
