// src/app/api/copilot/generate-process/route.ts

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { RoleType } from "@/types";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

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
Al recibir la idea de proceso del usuario, debes formularle de 3 a 4 preguntas puntuales clave sobre:
1. Unidad de negocio y segmento (Empresarial, Agropecuario, PyME, Personas).
2. Sistemas TI involucrados (Core Bancario T24, SPEI, Buró de Crédito, Motor PLD/OFAC, Portal Web).
3. Umbral de decisión facultada (monto en MXN que requiere aprobación de Comité vs mesa de crédito).
4. Puntos de control normativos (validación de poderes, colaterales E*, biometría o filtro ASG/DNSH).

Devuelve una respuesta con tono bancario institucional, clara y concisa, invitando a responder o a construir de inmediato.`,
          });

          const conversationText = messages
            .map((m: any) => `${m.role === "user" ? "Usuario" : "Arquitecto B×+"}: ${m.content}`)
            .join("\n");

          const prompt = `Conversación previa:\n${conversationText}\n\nNueva propuesta del usuario: "${processDescription}".
Haz las 3 a 4 preguntas clave y sugiere opciones directas de respuesta.`;

          const result = await model.generateContent(prompt);
          const answer = (await result.response).text();

          return NextResponse.json({
            success: true,
            reply: answer,
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

      // Fallback determinista para entrevista
      return NextResponse.json({
        success: true,
        reply: `Excelente propuesta para modelar **"${processDescription}"** en Banco B×+. Para estructurar el diagrama con máxima precisión regulatoria y de control, por favor indícame:
1. **Unidad y Segmento:** ¿Corresponde a Banca Empresarial, Agropecuaria, PyME o Minorista?
2. **Sistemas TI:** ¿Qué plataformas intervienen? (ej. *Core T24*, *SPEI Banxico*, *Buró de Crédito*, *Motor PLD*).
3. **Umbrales Críticos:** ¿Cuál es el límite monetario o paramétrico que detona escalamiento a Comité facultado?
4. **Puntos de Control:** ¿Se requiere validación dual de expedientes, aforo de garantías ($E^*$) o filtro ambiental ASG?

*Puedes contestar estas preguntas o presionar directamente el botón "Construir Diagrama Completo Ahora".*`,
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
      const sanitizedName = processDescription.length > 50 ? `${processDescription.substring(0, 47)}...` : processDescription;
      generatedData = {
        code: `PR-IA-${Math.floor(100 + Math.random() * 900)}`,
        name: sanitizedName,
        description: `Flujo operativo estructurado automáticamente por el Asistente IA de Banco B×+ para: ${processDescription}`,
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
            label: "¿Cumple Score Paramétrico y Filtro ASG?",
            description: "Evaluación de buró crediticio (Score >= 680) y matriz de riesgo climático CONAGUA/DNSH.",
            responsibleRole: "ANALYSIS",
            creditStage: "EVALUATION",
            systemUsed: "Motor de Riesgo & Scoring B×+",
            positionX: 690,
            positionY: 120,
            styleConfig: {
              decisionQuestion: "¿Score Crediticio >= 680 y Riesgo Climático Aceptable?",
              yesCriteria: "Pasa a validación facultada",
              noCriteria: "Escalamiento a Comité de Riesgos",
              thresholdMXN: 5000000,
            },
          },
          {
            tempId: "n4",
            nodeType: "CONTROL_POINT",
            label: "Control Dual: Validación de Garantías y Colateral E*",
            description: "Punto de control de 2ª Línea. Cálculo de aforo de colateral conforme a la CUB Anexo 15 Bis.",
            responsibleRole: "CONTROL_2ND_LINE",
            creditStage: "APPROVAL",
            systemUsed: "Core Bancario T24",
            positionX: 1010,
            positionY: 80,
            styleConfig: {
              isFormalized: true,
              periodicity: "d+0",
              controlNature: "PREVENTIVE_AUTOMATED",
            },
          },
          {
            tempId: "n5_alt",
            nodeType: "TASK_STEP",
            label: "Sesión Extraordinaria de Comité Facultado",
            description: "Revisión manual de excepciones paramétricas y análisis de mitigantes complementarios.",
            responsibleRole: "APPROVAL",
            creditStage: "APPROVAL",
            systemUsed: "Portal Comité CAIR",
            positionX: 1010,
            positionY: 280,
            styleConfig: { slaHours: 24 },
          },
          {
            tempId: "n6",
            nodeType: "EXTERNAL_SYSTEM",
            label: "Autorización y Registro en Core Bancario",
            description: "Apertura de línea de crédito, alta de pagaré y vinculación a cuenta eje en T24.",
            responsibleRole: "EXECUTION",
            creditStage: "INSTRUMENTATION",
            systemUsed: "Core Bancario T24 (Temenos)",
            positionX: 1330,
            positionY: 120,
            styleConfig: { interfaceType: "REST_SYNC", rtoHours: 2 },
          },
          {
            tempId: "n7",
            nodeType: "FRAUD_CHECKPOINT",
            label: "Candado Anexo 12-E: Monitoreo SPEI Pre-Dispersión",
            description: "Control preventivo en tiempo real contra suplantación y cuentas destino no reconocidas.",
            responsibleRole: "CONTROL_2ND_LINE",
            creditStage: "CONTROL_RECOVERY",
            systemUsed: "Módulo SPEI Circular 8/2019",
            positionX: 1650,
            positionY: 120,
            styleConfig: {
              isFormalized: true,
              periodicity: "d+0",
              controlNature: "PREVENTIVE_AUTOMATED",
            },
          },
          {
            tempId: "n8",
            nodeType: "START_END",
            label: "Fin: Dispersión de Recursos y Alta en Cartera",
            description: "Liquidación vía SPEI Banxico y generación de comprobante normativo CEP.",
            responsibleRole: "EXECUTION",
            creditStage: "CONTROL_RECOVERY",
            systemUsed: "Banxico SPEI & Banca Electrónica",
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
    const macroProcess =
      (await prisma.macroProcess.findFirst({ include: { businessUnit: true } })) ||
      (await prisma.macroProcess.create({
        data: {
          code: "MP-IA-01",
          name: "Procesos y Productos Bancarios Inteligentes",
          category: "BUSINESS",
          businessUnitId: (await prisma.businessUnit.findFirst())?.id || "",
        },
        include: { businessUnit: true },
      }));

    const user =
      (await prisma.user.findFirst({ where: { role: userRole as RoleType } })) ||
      (await prisma.user.findFirst());

    if (!macroProcess || !user) {
      return NextResponse.json({ success: false, error: "No se encontró configuración base en la base de datos" }, { status: 500 });
    }

    // Persistir el Proceso en SQLite
    const createdProcess = await prisma.process.create({
      data: {
        code: generatedData.code || `PR-IA-${Date.now().toString().slice(-4)}`,
        name: generatedData.name,
        description: generatedData.description,
        macroProcessId: macroProcess.id,
        ownerId: user.id,
        isCriticalBCP: true,
        rtoHours: 4,
        rpoHours: 1,
      },
    });

    // Mapear tempIds a los IDs reales de Prisma
    const idMap: Record<string, string> = {};

    for (const nodeData of generatedData.nodes) {
      const createdNode = await prisma.processNode.create({
        data: {
          processId: createdProcess.id,
          label: nodeData.label,
          description: nodeData.description || null,
          nodeType: nodeData.nodeType || "TASK_STEP",
          creditStage: nodeData.creditStage || "NOT_APPLICABLE",
          responsibleRole: nodeData.responsibleRole || "ANALYSIS",
          systemUsed: nodeData.systemUsed || "Core Bancario T24",
          positionX: Number(nodeData.positionX) || 100,
          positionY: Number(nodeData.positionY) || 100,
          styleConfig: nodeData.styleConfig ? JSON.stringify(nodeData.styleConfig) : null,
        },
      });
      idMap[nodeData.tempId] = createdNode.id;
    }

    // Crear las aristas
    for (const edgeData of generatedData.edges) {
      const realSourceId = idMap[edgeData.sourceTempId];
      const realTargetId = idMap[edgeData.targetTempId];

      if (realSourceId && realTargetId) {
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
        nodesCount: generatedData.nodes.length,
        edgesCount: generatedData.edges.length,
      },
    });

    return NextResponse.json({
      success: true,
      processId: createdProcess.id,
      process: createdProcess,
      message: `Proceso "${createdProcess.name}" generado exitosamente con ${generatedData.nodes.length} figuras conectadas.`,
    });
  } catch (error) {
    console.error("Error in /api/copilot/generate-process:", error);
    return NextResponse.json({ success: false, error: "Error al generar proceso con IA" }, { status: 500 });
  }
}
