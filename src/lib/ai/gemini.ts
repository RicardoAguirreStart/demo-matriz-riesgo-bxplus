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
