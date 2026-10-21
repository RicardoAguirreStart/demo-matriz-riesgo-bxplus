// src/app/api/copilot/generate-process/route.ts

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { RoleType } from "@/types";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Helper para limpiar sintaxis markdown y dejar texto conversacional limpio
function stripMarkdownSyntax(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/^(\s*)\*\s+/gm, "$1- ")
    .replace(/\*/g, "")
    .replace(/^#+\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = "BUILD", processDescription, messages = [], userAnswers = {}, userRole = "UAIR_ADMIN" } = body;

    if (!processDescription && messages.length === 0) {
      return NextResponse.json({ success: false, error: "Descripción del proceso requerida" }, { status: 400 });
    }

    // ACCIÓN 1: MODO ENTREVISTA CONVERSACIONAL (Preguntas guiadas + chips sugeridos)
    if (action === "INTERVIEW") {
      try {
        if (apiKey) {
          const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `Eres el Arquitecto Senior de Procesos y Riesgos Bancarios de Banco Ve por Más (B×+).
Tu función es entrevistar brevemente al usuario para modelar un proceso bancario de extremo a extremo conforme a la Circular Única de Bancos (CUB), Banxico y estándares de Segregación de Funciones (SoD).
Formula de 3 a 4 preguntas puntuales clave sobre:
1. Unidad de negocio y segmento (Empresarial, Agropecuario, PyME, Personas).
2. Sistemas TI involucrados (Core Bancario T24, SPEI, Buró de Crédito, Motor PLD/OFAC, Portal Web).
3. Umbral de decisión facultada (monto en MXN que requiere aprobación de Comité vs mesa de crédito).
4. Puntos de control normativos (validación de poderes, colaterales E*, biometría o filtro ASG/DNSH).

REGLA OBLIGATORIA DE FORMATO:
- Devuelve ÚNICAMENTE texto en lenguaje natural y fluido.
- NUNCA uses formato Markdown: NO uses asteriscos dobles (**negrita**), NO uses asteriscos simples (*cursiva*), NO uses viñetas con asterisco (* item) ni encabezados con numeral (#).
- Usa numeración limpia (1., 2., 3.) o guiones limpios (-) sin asteriscos.`,
          });

          const conversationText = messages
            .map((m: any) => `${m.role === "user" ? "Usuario" : "Arquitecto B×+"}: ${stripMarkdownSyntax(m.content)}`)
            .join("\n");

          const prompt = `Conversación previa:\n${conversationText}\n\nNueva propuesta del usuario: "${processDescription}".
Haz las 3 a 4 preguntas clave y sugiere opciones directas de respuesta sin ningún formato markdown ni asteriscos.`;

          const result = await model.generateContent(prompt);
          const rawAnswer = (await result.response).text();
          const cleanAnswer = stripMarkdownSyntax(rawAnswer);

          return NextResponse.json({
            success: true,
            reply: cleanAnswer,
            suggestedQuickReplies: [
              "Segmento PyME con Buró + Core T24",
              "Umbral Comité: Créditos > $5,000,000 MXN",
              "Filtro ASG + Control Dual de Liberación",
              "Integración Banxico SPEI en Tiempo Real (d+0)",
            ],
          });
        }
      } catch (err) {
        console.error("Gemini interview fallback triggered:", err);
      }

      // Fallback determinista para entrevista sin markdown
      return NextResponse.json({
        success: true,
        reply: `Excelente propuesta para modelar "${processDescription}" en Banco B×+. Para estructurar el diagrama con máxima precisión regulatoria y de control, por favor indícame:

1. Unidad y Segmento: ¿Corresponde a Banca Empresarial, Agropecuaria, PyME o Minorista?
2. Sistemas TI: ¿Qué plataformas intervienen? (ej. Core T24, SPEI Banxico, Buró de Crédito, Motor PLD).
3. Umbrales Críticos: ¿Cuál es el límite monetario o paramétrico que detona escalamiento a Comité facultado?
4. Puntos de Control: ¿Se requiere validación dual de expedientes, aforo de garantías (E*) o filtro ambiental ASG?

Puedes contestar estas preguntas o presionar directamente el botón "Construir Diagrama Completo Ahora".`,
        suggestedQuickReplies: [
          "Segmento PyME con Buró + Core T24",
          "Umbral Comité: Créditos > $5,000,000 MXN",
          "Filtro ASG + Control Dual de Liberación",
          "Integración Banxico SPEI en Tiempo Real (d+0)",
        ],
      });
    }

    // ACCIÓN 2: CONSTRUCCIÓN COMPLETA Y PERSISTENCIA DEL DIAGRAMA
    let generatedData: any = null;

    if (apiKey) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: `Eres el Diseñador Experto de Diagramas de Flujo Bancarios de Banco Ve por Más (B×+).
Tu misión es generar la estructura JSON completa de un proceso bancario de 6 a 8 figuras geométricas conectadas con lógica impecable.
Obligatorio incluir:
1. Exactamente 1 nodo START_END al inicio (x: 50, y: 120).
2. 2 o 3 nodos TASK_STEP de captura/análisis.
3. Al menos 1 nodo DECISION_GATEWAY (Rombo de Decisión) con pregunta lógica "¿...?".
   - Debe tener 2 salidas conectadas: una positiva "Sí / Cumple" y una negativa "No / Requiere Comité o Rechazo".
4. Al menos 1 nodo CONTROL_POINT o FRAUD_CHECKPOINT con candado normativo.
5. 1 nodo EXTERNAL_SYSTEM (ej. "Core Bancario T24" o "Banxico SPEI").
6. 1 nodo START_END de cierre/dispersión.
Posiciones: distribuye los nodos secuencialmente incrementando X en 320 px (50, 370, 690, 1010, 1330, 1650, 1970). Para la rama alternativa del rombo de decisión, incrementa Y a 280 px.

Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta estructura:
{
  "code": "PR-IA-00X",
  "name": "Nombre formal del proceso",
  "description": "Descripción funcional",
  "nodes": [
    {
      "tempId": "n1",
      "nodeType": "START_END | TASK_STEP | DECISION_GATEWAY | CONTROL_POINT | FRAUD_CHECKPOINT | EXTERNAL_SYSTEM",
      "label": "string conciso",
      "description": "string",
      "responsibleRole": "PROMOTION | ANALYSIS | APPROVAL | EXECUTION | CONTROL_2ND_LINE",
      "creditStage": "PROMOTION | EVALUATION | APPROVAL | INSTRUMENTATION | CONTROL_RECOVERY | NOT_APPLICABLE",
      "systemUsed": "string",
      "positionX": number,
      "positionY": number,
      "styleConfig": {
        "decisionQuestion": "string (si es DECISION_GATEWAY)",
        "yesCriteria": "string",
        "noCriteria": "string",
        "thresholdMXN": number
      }
    }
  ],
  "edges": [
    {
      "sourceTempId": "n1",
      "targetTempId": "n2",
      "conditionLabel": "string opcional (ej. 'Sí / Aprobado', 'No / Escala')"
    }
  ]
}`,
        });

        const prompt = `Genera el proceso bancario completo para: "${processDescription}".
Contexto adicional del usuario: ${JSON.stringify(userAnswers)}.`;

        const result = await model.generateContent(prompt);
        const text = (await result.response).text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          generatedData = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.error("Gemini process build error, proceeding to deterministic generator:", err);
      }
    }

    // Fallback determinista bancario de alta calidad si Gemini no generó JSON válido
    if (!generatedData || !Array.isArray(generatedData.nodes) || generatedData.nodes.length < 5) {
      const sanitizedName = processDescription && processDescription.length > 50 ? `${processDescription.substring(0, 47)}...` : (processDescription || "Proceso de Crédito y Servicios B×+");
      generatedData = {
        code: `PR-IA-${Math.floor(100 + Math.random() * 900)}`,
        name: sanitizedName,
        description: `Flujo operativo estructurado automáticamente por el Asistente IA de Banco B×+ para: ${sanitizedName}`,
        nodes: [
          {
            tempId: "n1",
            nodeType: "START_END",
            label: `Inicio: Solicitud de ${sanitizedName}`,
            description: "Recepción de expediente digital del cliente y apertura del folio bancario.",
            responsibleRole: "PROMOTION",
            creditStage: "PROMOTION",
            systemUsed: "Portal Clientes B×+ Web/Móvil",
            positionX: 50,
            positionY: 120,
            styleConfig: { iconShape: "oval", stage: "START" },
          },
          {
            tempId: "n2",
            nodeType: "TASK_STEP",
            label: "Cotejo Documental y Validación de Identidad",
            description: "Verificación biométrica ante INE y autenticación de RFC/FIEL del solicitante.",
            responsibleRole: "PROMOTION",
            creditStage: "PROMOTION",
            systemUsed: "Motor Biométrico & Buró",
            positionX: 370,
            positionY: 120,
            styleConfig: { slaHours: 4 },
          },
          {
            tempId: "n3",
            nodeType: "DECISION_GATEWAY",
            label: "¿Califica Score y Capacidad de Pago?",
            description: "Evaluación paramétrica de BC Score >= 680 y razón de apalancamiento normativo.",
            responsibleRole: "ANALYSIS",
            creditStage: "EVALUATION",
            systemUsed: "Motor de Decisión Crediticia",
            positionX: 690,
            positionY: 120,
            styleConfig: {
              decisionQuestion: "¿El solicitante cumple el perfil de riesgo paramétrico B×+?",
              yesCriteria: "Score >= 680 y capacidad de pago demostrada",
              noCriteria: "Score < 680 o excedente de apalancamiento",
              thresholdMXN: 5000000,
            },
          },
          {
            tempId: "n4",
            nodeType: "CONTROL_POINT",
            label: "Candado PLD / Listas Restrictivas (F)",
            description: "Barrido automático contra listas negras OFAC, PEPs y 69-B del CFF.",
            responsibleRole: "CONTROL_2ND_LINE",
            creditStage: "EVALUATION",
            systemUsed: "Sistema Integral PLD B×+",
            positionX: 1010,
            positionY: 120,
            styleConfig: {
              controlNature: "PREVENTIVE",
              automation: "AUTOMATIC",
              cnbvFormalized: true,
              periodicity: "d+0",
              evidenceType: "Log de cotejo criptográfico",
            },
          },
          {
            tempId: "n5_alt",
            nodeType: "TASK_STEP",
            label: "Comité de Riesgos y Excepciones B×+",
            description: "Sesión del Órgano Facultado para evaluar garantías líquidas o mitigantes.",
            responsibleRole: "APPROVAL",
            creditStage: "APPROVAL",
            systemUsed: "Portal de Comités B×+",
            positionX: 690,
            positionY: 280,
            styleConfig: { slaHours: 24 },
          },
          {
            tempId: "n6",
            nodeType: "EXTERNAL_SYSTEM",
            label: "Core Bancario T24 (Alta de Cuenta)",
            description: "Generación de número de cuenta y contrato marco en base de datos central.",
            responsibleRole: "EXECUTION",
            creditStage: "INSTRUMENTATION",
            systemUsed: "Temenos T24 Core",
            positionX: 1330,
            positionY: 120,
            styleConfig: { interfaceType: "REST_MQ", rtoHours: 2 },
          },
          {
            tempId: "n7",
            nodeType: "CONTROL_POINT",
            label: "Control Dual de Dispersión SPEI (F)",
            description: "Autorización de cuatro ojos requerida por Banxico para liquidación de fondos.",
            responsibleRole: "CONTROL_2ND_LINE",
            creditStage: "CONTROL_RECOVERY",
            systemUsed: "Módulo de Seguridad Banxico",
            positionX: 1650,
            positionY: 120,
            styleConfig: {
              controlNature: "PREVENTIVE",
              automation: "MANUAL_SUPERVISED",
              cnbvFormalized: true,
              periodicity: "d+0",
            },
          },
          {
            tempId: "n8",
            nodeType: "START_END",
            label: "Fin: Liquidación y Formalización Exitosa",
            description: "Emisión de comprobante CEP Banxico y notificación multicanal al cliente.",
            responsibleRole: "EXECUTION",
            creditStage: "CONTROL_RECOVERY",
            systemUsed: "Banxico SPEI & Notificaciones",
            positionX: 1970,
            positionY: 120,
            styleConfig: { iconShape: "oval", stage: "END" },
          },
        ],
        edges: [
          { sourceTempId: "n1", targetTempId: "n2" },
          { sourceTempId: "n2", targetTempId: "n3" },
          { sourceTempId: "n3", targetTempId: "n4", conditionLabel: "Sí / Cumple Criterio" },
          { sourceTempId: "n3", targetTempId: "n5_alt", conditionLabel: "No / Requiere Comité" },
          { sourceTempId: "n4", targetTempId: "n6" },
          { sourceTempId: "n5_alt", targetTempId: "n6", conditionLabel: "Comité Aprueba" },
          { sourceTempId: "n6", targetTempId: "n7" },
          { sourceTempId: "n7", targetTempId: "n8" },
        ],
      };
    }

    // Buscar Macroproceso y Usuario activo para vincular el proceso
    let macroProcess = await prisma.macroProcess.findFirst({ include: { businessUnit: true } });
    if (!macroProcess) {
      const bu = await prisma.businessUnit.findFirst();
      macroProcess = await prisma.macroProcess.create({
        data: {
          code: `MP-IA-${Date.now().toString().slice(-4)}`,
          name: "Procesos y Productos Bancarios Inteligentes",
          category: "BUSINESS",
          businessUnitId: bu?.id || "",
        },
        include: { businessUnit: true },
      });
    }

    const user =
      (await prisma.user.findFirst({ where: { role: userRole as RoleType } })) ||
      (await prisma.user.findFirst());

    if (!macroProcess || !user) {
      return NextResponse.json({ success: false, error: "No se encontró configuración base en la base de datos" }, { status: 500 });
    }

    // Resolver código único garantizado para evitar colisiones con la restricción UNIQUE de SQLite
    const rawCode = (generatedData.code || "PR-IA").trim().toUpperCase();
    let baseCode = rawCode.startsWith("PR-") ? rawCode : `PR-${rawCode}`;
    baseCode = baseCode.replace(/[^A-Z0-9-]/g, "");
    if (baseCode.length > 20) baseCode = baseCode.slice(0, 20);

    let finalCode = baseCode;
    let attempts = 0;
    while (await prisma.process.findUnique({ where: { code: finalCode } })) {
      attempts++;
      finalCode = `${baseCode}-${Math.floor(100 + Math.random() * 900)}`;
      if (attempts > 15) {
        finalCode = `PR-IA-${Date.now().toString().slice(-6)}`;
        break;
      }
    }

    const finalName = (generatedData.name || processDescription || "Nuevo Proceso Bancario B×+").trim();
    const finalDesc = (generatedData.description || `Flujo operativo estructurado por IA para: ${finalName}`).trim();

    // Persistir el Proceso en SQLite
    const createdProcess = await prisma.process.create({
      data: {
        code: finalCode,
        name: finalName,
        description: finalDesc,
        macroProcessId: macroProcess.id,
        ownerId: user.id,
        isCriticalBCP: true,
        rtoHours: 4,
        rpoHours: 1,
      },
    });

    // Mapear tempIds a los IDs reales de Prisma
    const idMap: Record<string, string> = {};
    const createdNodesList: any[] = [];

    const validNodeTypes = [
      "START_END",
      "TASK_STEP",
      "DECISION_GATEWAY",
      "CONTROL_POINT",
      "FRAUD_CHECKPOINT",
      "EXTERNAL_SYSTEM",
    ];

    for (let i = 0; i < (generatedData.nodes || []).length; i++) {
      const nodeData = generatedData.nodes[i];
      const nodeType = validNodeTypes.includes(nodeData.nodeType) ? nodeData.nodeType : "TASK_STEP";

      const createdNode = await prisma.processNode.create({
        data: {
          processId: createdProcess.id,
          label: (nodeData.label || `Paso ${i + 1}`).trim(),
          description: nodeData.description || null,
          nodeType: nodeType,
          creditStage: nodeData.creditStage || "NOT_APPLICABLE",
          responsibleRole: nodeData.responsibleRole || "ANALYSIS",
          systemUsed: nodeData.systemUsed || "Core Bancario T24",
          positionX: Number(nodeData.positionX) || (50 + i * 300),
          positionY: Number(nodeData.positionY) || 120,
          styleConfig: nodeData.styleConfig ? JSON.stringify(nodeData.styleConfig) : null,
        },
      });
      createdNodesList.push(createdNode);
      if (nodeData.tempId) {
        idMap[nodeData.tempId] = createdNode.id;
      }
    }

    // Crear las aristas
    if (Array.isArray(generatedData.edges) && generatedData.edges.length > 0) {
      for (const edgeData of generatedData.edges) {
        const realSourceId = idMap[edgeData.sourceTempId];
        const realTargetId = idMap[edgeData.targetTempId];

        if (realSourceId && realTargetId && realSourceId !== realTargetId) {
          await prisma.processEdge.create({
            data: {
              processId: createdProcess.id,
              sourceNodeId: realSourceId,
              targetNodeId: realTargetId,
              conditionLabel: edgeData.conditionLabel || null,
              animated: true,
            },
          });
        }
      }
    }

    // Si por alguna razón no se crearon aristas, encadenar secuencialmente los nodos creados
    const edgesCount = await prisma.processEdge.count({ where: { processId: createdProcess.id } });
    if (edgesCount === 0 && createdNodesList.length > 1) {
      for (let i = 0; i < createdNodesList.length - 1; i++) {
        await prisma.processEdge.create({
          data: {
            processId: createdProcess.id,
            sourceNodeId: createdNodesList[i].id,
            targetNodeId: createdNodesList[i + 1].id,
            animated: true,
          },
        });
      }
    }

    // Sellar auditoría criptográfica SHA-256
    await recordAuditLog({
      userId: user.id,
      userRole: userRole as RoleType,
      actionType: "AI_GENERATE_FULL_PROCESS",
      entityName: "Process",
      entityId: createdProcess.id,
      previousState: null,
      newState: {
        processCode: createdProcess.code,
        processName: createdProcess.name,
        nodesCount: createdNodesList.length,
        edgesCount: await prisma.processEdge.count({ where: { processId: createdProcess.id } }),
      },
    });

    return NextResponse.json({
      success: true,
      processId: createdProcess.id,
      process: createdProcess,
      message: `Proceso "${createdProcess.name}" (${createdProcess.code}) generado exitosamente con ${createdNodesList.length} figuras conectadas.`,
    });
  } catch (error: any) {
    console.error("Error in /api/copilot/generate-process:", error);
    return NextResponse.json({
      success: false,
      error: `Error al generar proceso con IA: ${error?.message || "Error interno"}`,
    }, { status: 500 });
  }
}
