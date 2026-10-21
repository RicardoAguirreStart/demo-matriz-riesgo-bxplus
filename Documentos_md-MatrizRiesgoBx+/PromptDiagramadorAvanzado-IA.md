# Prompt Maestro: Evolución Avanzada del Diagramador de Procesos Bancarios con IA Conversacional, Figuras Geométricas Interactivas (Miro/Canva) y Evaluador Integral de Riesgos IA Cross-Process
**Proyecto:** Herramienta Inteligente para la Gestión de Riesgos Relevantes y Emergentes — Banco Ve por Más (B×+)
**Directorio de Trabajo:** `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+`
**Documentos de Referencia Obligatoria:**
1. `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/Documentos_md-MatrizRiesgoBx+/DefinicionHerramienta.md`
2. `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/Documentos_md-MatrizRiesgoBx+/ContextoGeneral-MatrizRiesgoBx+.md`

---

## 🎯 Rol e Instrucción General

Actúa como el **Agente de Desarrollo Principal (Full-Stack Next.js + React Flow `@xyflow/react` + Prisma + Gemini AI)**.
Tu objetivo es transformar el módulo **Diagramador de Procesos (`src/components/FlowchartView.tsx`)** y sus endpoints de backend en una experiencia interactiva de clase empresarial (estilo **Miro / Canva / Lucidchart Bancario**), incorporando **3 capacidades clave** sin alterar ni romper ninguna de las funcionalidades ya existentes:

1. **Creador Conversacional de Nuevos Procesos con IA (`"Generar Nuevo Proceso con IA"`):** Un asistente conversacional interactivo que entrevista brevemente al usuario, le hace preguntas relevantes de negocio/normativa y, al finalizar, construye y persiste en SQLite el diagrama de flujo completo (proceso, nodos geométricos, rombos de decisión, puntos de control y relaciones).
2. **Interacción Gráfica In-Situ con Figuras Geométricas de Diagrama de Flujo (`+` en cada Figura + Inspector Dinámico Contextual):**
   - Representación geométrica diferenciada por tipo de figura (Óvalo/Píldora para Inicio/Fin, Cuadro Rectangular para Acción/Tarea, **Rombo/Diamante para Compuerta de Decisión**, Hexágono/Escudo para Punto de Control, Paralelogramo/Bloque Técnico para Sistema TI).
   - Un botón interactivo **`+`** al final (extremo derecho/inferior) de cada figura en el lienzo que, al darle clic, despliegue un **menú flotante de figuras** (*Cuadro de Acción*, *Rombo de Decisión*, *Punto de Control*, *Control de Fraude*, *Sistema TI / API*, *Fin de Proceso*) para insertar y conectar automáticamente la siguiente figura en el flujo.
   - Al hacer clic sobre cualquier figura del diagrama, el **Inspector Lateral (Drawer)** debe mostrar un **formulario dinámico de edición contextual** adaptado a la función lógica de esa figura en un diagrama de flujo (ej. si es un Rombo de Decisión: pregunta lógica, condición Sí/No, umbral en MXN; si es Cuadro de Acción: rol, SLA, etapa de crédito; si es Punto de Control: tipo Preventivo/Detectivo, Formalizado `F`/`NF`, periodicidad $d+0 \dots d+30$) y permitir guardar los cambios en SQLite.
3. **Botón `"Evaluador de Riesgos IA (Proceso Completo)"` con Contexto Transversal (Cross-Process):** Un motor de evaluación integral con Gemini (`gemini-2.5-flash`) que analiza todo el diagrama actual tomando como contexto **el resto de los procesos y riesgos ya cargados en Banco B×+**, determina los riesgos inherentes/emergentes paso por paso y permite anclarlos con 1 clic al diagrama y a la Matriz Viva.

---

## 🛠️ Especificación Técnica Detallada de las 3 Nuevas Funcionalidades

### Funcionalidad 1: Creador Conversacional de Nuevos Procesos con IA (`POST /api/copilot/generate-process` + Modal de Chat en `FlowchartView.tsx`)

1. **Botón en Barra Superior del Diagramador:**
   - Agrega un botón destacado en `FlowchartView.tsx`: **`"Generar Proceso con IA"`** (con estilo institucional B×+: fondo `#C0D725` o `#1F242B` con acento `#C0D725`).
2. **Ventana / Modal Conversacional Interactiva:**
   - Al abrirse, inicia una conversación guiada con el Arquitecto de Procesos IA de Banco B×+.
   - El usuario escribe qué proceso desea modelar (ej. *"Quiero crear el proceso de originación y dispersión de Arrendamiento Puro para PyMEs"* o *"Proceso de apertura remota de cuenta digital y alta en SPEI"*).
   - **Ciclo de Entrevista Inteligente:**
     - En el primer turno (o primeros 1–2 turnos), la IA responde haciéndole **3 a 4 preguntas concretas y relevantes** para afinar el flujo bancario:
       1. Unidad de negocio B×+ y segmento objetivo,
       2. Sistemas tecnológicos involucrados (`Core T24`, `SPEI`, `Buró`, `PLD`, `Biometría`),
       3. Umbrales o decisiones críticas (montos que requieren Comité, validación de garantías o filtros ASG),
       4. Controles clave o regulaciones aplicables (CUB, Circular 8/2019 Banxico, Art. 115 LIC).
     - Incluye también chips de **"Respuestas Rápidas Sugeridas"** y un botón directo **`"Ya tengo suficiente contexto: Construir Diagrama Completo Ahora"`** para que el usuario pueda generar el diagrama en cualquier momento sin fricción.
3. **Generación y Persistencia Completa del Diagrama (`POST /api/copilot/generate-process`):**
   - Crea el endpoint `src/app/api/copilot/generate-process/route.ts` conectado a `@google/generative-ai` (`gemini-2.5-flash`, con un *fallback* determinista inteligente que construya un diagrama bancario completo de 6 a 8 nodos si la API externa tarda o falla).
   - Cuando el usuario confirma la creación:
     - Crea el registro en `Process` (asociado al `MacroProcess` y `BusinessUnit` correspondientes, con código único ej. `PR-IA-005`).
     - Crea entre **6 y 8 nodos (`ProcessNode`)** con coordenadas $(x, y)$ bien espaciadas horizontalmente (ej. cada $320\text{px}$ en $X$ y bifurcaciones en $Y$ para las ramas del rombo de decisión), incluyendo obligatoriamente:
       - 1 Nodo `START_END` de Inicio,
       - Nodos `TASK_STEP` de captura/operación,
       - Al menos 1 `DECISION_GATEWAY` (*Rombo de Decisión* con bifurcación lógica `"Sí / Cumple"` y `"No / Escala o Rechaza"`),
       - Al menos 1 `CONTROL_POINT` o `FRAUD_CHECKPOINT`,
       - 1 Nodo `EXTERNAL_SYSTEM` y 1 Nodo `START_END` de Cierre/Dispersión.
     - Crea todas las aristas (`ProcessEdge`) con sus etiquetas condicionales (`conditionLabel: "Sí - Aprobado"`, `"No - Requiere Comité"`, etc.).
     - Sella el evento `"AI_GENERATE_FULL_PROCESS"` en la bitácora criptográfica `AuditLog` (`SHA-256`).
     - Recarga la lista de procesos en `FlowchartView.tsx` y **selecciona automáticamente el nuevo proceso recién creado** en el lienzo.

---

### Funcionalidad 2: Interacción Gráfica en el Lienzo (Figuras de Diagrama de Flujo + Botón `+` al Final de Cada Figura + Inspector Contextual de Datos)

1. **Diferenciación Geométrica Clara de las Figuras en `BankingProcessNode` (`FlowchartView.tsx`):**
   - Mejora el renderizado visual de `BankingProcessNode` para que cada `nodeType` tenga la **silueta y semántica visual propia de un diagrama de flujo profesional**, manteniendo siempre legibilidad perfecta del texto y los *badges* de riesgos/PMA:
     - **`START_END` (Inicio / Fin):** Forma de **Píldora / Óvalo Terminador** (`rounded-full` o `rounded-3xl`, borde esmeralda).
     - **`TASK_STEP` (Cuadro de Acción / Proceso):** **Rectángulo clásico de proceso** (`rounded-md`, borde slate/carbono `#1F242B`).
     - **`DECISION_GATEWAY` (Rombo de Decisión):** **Diseño visual de Compuerta / Rombo de Decisión** (con indicador geométrico de rombo `◆` / contenedor con bisel o cabecera en índigo `#4F46E5`, mostrando claramente la **Pregunta de Decisión `¿...?`** y sus salidas condicionales `Sí` / `No`).
     - **`CONTROL_POINT` / `FRAUD_CHECKPOINT` (Punto de Control / Candado Normativo):** **Contenedor hexagonal / acorazado** con doble borde `#3299A8` o ámbar `#D97706` e insignia de formalización (`F` / `NF`).
     - **`EXTERNAL_SYSTEM` (Sistema Core / API / Base de Datos):** **Bloque técnico con acento lateral inclinado / estilo servidor** en púrpura `#7C3AED` y tipografía monoespaciada para el sistema (`Core T24`, `SPEI`, `PLD`).

2. **Botón Interactivo `+` al Final de cada Figura con Selector Rápido de Figuras (Estilo Miro/Canva):**
   - En el extremo derecho de cada `BankingProcessNode` (junto al `Handle` de salida), agrega un botón circular interactivo **`+`** (`title="Agregar siguiente figura conectada"`).
   - Al hacer clic en ese botón **`+`** de cualquier nodo, despliega un **Popover / Menú Flotante de Figuras de Diagrama de Flujo** directamente junto al nodo con las opciones:
     1. **▭ Cuadro de Acción (`TASK_STEP`)** — *Actividad o tarea operativa*
     2. **◆ Rombo de Decisión (`DECISION_GATEWAY`)** — *Bifurcación condicional Sí / No*
     3. **⬡ Punto de Control (`CONTROL_POINT`)** — *Validación preventiva/detectiva 1ª o 2ª Línea*
     4. **⛨ Control de Fraude (`FRAUD_CHECKPOINT`)** — *Candado Anexo 12-E / PLD*
     5. **▱ Sistema TI / API (`EXTERNAL_SYSTEM`)** — *Interfaz Core Bancario / SPEI*
     6. **◯ Fin / Terminador (`START_END`)** — *Cierre del flujo*
   - Si el nodo origen es un **Rombo de Decisión (`DECISION_GATEWAY`)**, el menú flotante también permite elegir si la nueva flecha sale por la rama **`"Sí / Cumple"`** o por la rama **`"No / Excepción"`** (ubicando el nuevo nodo ligeramente arriba o abajo en el eje $Y$ para formar la bifurcación limpia).
   - Al seleccionar cualquiera de las figuras en el popover:
     - Llama a `POST /api/processes` con una nueva acción combinada `CREATE_CONNECTED_NODE` (o ejecuta `CREATE_NODE` + `CREATE_EDGE` en secuencia) que crea el nuevo nodo a `positionX = sourceNode.positionX + 320` y lo conecta automáticamente con una arista desde el nodo origen.
     - **Abre automáticamente el Inspector Lateral (Drawer) sobre la nueva figura recién creada** en modo de edición para que el usuario llene sus datos lógicos de inmediato.

3. **Formulario de Datos Contextual en el Inspector Lateral según la Figura (`UPDATE_NODE` en `/api/processes`):**
   - En `src/app/api/processes/route.ts`, agrega las acciones:
     - `UPDATE_NODE`: actualiza `label`, `description`, `nodeType`, `creditStage`, `responsibleRole`, `systemUsed` y `styleConfig` (JSON con los metadatos específicos de la figura) en `prisma.processNode.update`, además de permitir actualizar la etiqueta `conditionLabel` de sus aristas (`ProcessEdge`).
     - `DELETE_NODE`: permite eliminar un nodo añadido por error.
   - En el **Inspector Lateral (`Drawer`) de `FlowchartView.tsx`**, agrega una pestaña/sección principal **"Configuración y Lógica de la Figura"** cuyos campos cambian dinámicamente según el `nodeType` de la figura seleccionada:
     - **Si la figura es `DECISION_GATEWAY` (Rombo de Decisión):**
       - *Pregunta / Regla Lógica de Decisión* (ej. `"¿Monto de crédito > $5,000,000 MXN o Score ASG >= 75?"`),
       - *Criterio de la Rama Positiva ("Sí / Cumple")* (ej. `"Pasa a liberación automática"`),
       - *Criterio de la Rama Negativa ("No / Rechaza o Escala")* (ej. `"Escala a Comité de Crédito Central"`),
       - *Umbral Monetario o Paramétrico*,
       - *Rol Facultado para la Decisión* y *Sistema Evaluador*.
     - **Si la figura es `TASK_STEP` (Cuadro de Acción):**
       - *Nombre de la Actividad*, *Descripción del Procedimiento*, *Rol Ejecutante* (`PROMOTION`, `ANALYSIS`, `APPROVAL`, `EXECUTION`), *Etapa de Crédito CUB*, *Sistema TI Utilizado* y *SLA Operativo (horas/minutos)*.
     - **Si la figura es `CONTROL_POINT` o `FRAUD_CHECKPOINT` (Punto de Control):**
       - *Nombre del Control*, *Naturaleza del Control* (`Preventivo Automático`, `Preventivo Manual`, `Detectivo`), *Estado de Formalización CNBV* (`Formalizado en Manual (F)` vs `No Formalizado (NF)` — advirtiendo del tope $\le 2$), *Periodicidad* (`Tiempo Real d+0`, `Diario d+1`, `Semanal d+7`, `Mensual d+30`), *Rol Validador (2ª Línea)* y *Evidencia Documental Generada*.
     - **Si la figura es `EXTERNAL_SYSTEM` (Sistema TI / API):**
       - *Nombre del Sistema / Servicio*, *Tipo de Integración* (`API Síncrona REST/MQ`, `Proceso Batch Nocturno`, `Conexión Directa Banxico SPEI`), *RTO (Tiempo Objetivo de Recuperación)* y *Responsable de Continuidad (BCP)*.
   - Al hacer clic en **"Guardar Datos de la Figura"**, persiste todos los cambios en SQLite vía `POST /api/processes` (`action: "UPDATE_NODE"`) y actualiza el nodo en el lienzo en tiempo real.

---

### Funcionalidad 3: Botón `"Evaluador de Riesgos IA (Proceso Completo)"` con Contexto Cross-Process (`POST /api/copilot/evaluate-process`)

1. **Botón en la Barra Superior del Diagramador:**
   - Agrega un botón en la cabecera de `FlowchartView.tsx`: **`"Evaluador Riesgos IA (Proceso Completo)"`**.
2. **Endpoint de Evaluación Integral con Contexto de Todos los Procesos (`src/app/api/copilot/evaluate-process/route.ts`):**
   - Recibe el `processId` del diagrama activo.
   - Consulta en Prisma:
     1. **El proceso actual completo:** Todos sus `flowNodes` (incluyendo la lógica de sus rombos de decisión, puntos de control, sistemas y roles), `flowEdges` y `riskEvents` actuales.
     2. **El contexto transversal (Cross-Process) del resto de los procesos cargados en Banco B×+:** Los nombres, macroprocesos, sistemas compartidos (`Core T24`, `SPEI`, `Motor PLD`, `FIRA`) y los riesgos críticos ya identificados en los otros procesos del banco.
     3. **El catálogo de 11 taxonomías CNBV (`RiskTaxonomy`).**
   - Envía este contexto enriquecido a **Gemini (`gemini-2.5-flash`)** (con un *fallback* determinista exhaustivo que analiza la topología real de los nodos y aristas del proceso activo si la API externa demora) para que realice una **Auditoría Integral End-to-End del Diagrama**:
     - Evalúa **riesgos de contagio transversal** (ej. cómo una falla en un sistema compartido o una debilidad vista en otro proceso de B×+ impacta los nodos de este diagrama).
     - Evalúa cada **Rombo de Decisión (`DECISION_GATEWAY`)**, detectando si falta un control en alguna de sus ramas o si existe riesgo de evasión de umbrales (*fraccionamiento*).
     - Evalúa cada **Cuadro de Acción y Sistema**, identificando qué riesgos de las 11 taxonomías CNBV (Crédito, Liquidez, Mercado, Operacional, Tecnológico/SPEI, Legal, Fraude/PLD, Ciberseguridad, ASG Climático, Reputacional, Estratégico) se desprenden del flujo.
   - Devuelve un objeto estructurado con:
     - `executiveDiagnosis`: Diagnóstico ejecutivo del proceso y su interdependencia con el resto de procesos de Banco B×+.
     - `crossProcessInsights`: Hallazgos cruzados con otros procesos cargados en la herramienta.
     - `detectedRisks`: Lista de **3 a 5 riesgos específicos detectados en el diagrama**, cada uno vinculado al `processNodeId` y `nodeLabel` exacto donde ocurre, con su triada completa (`title`, `cause`, `eventDescription`, `consequence`), `riskType` CNBV, `inherentProbability` ($1\text{–}5$), `inherentImpact` ($1\text{–}5$), `expectedAnnualLossPEA`, `maxAnnualLossPMA` y el control o *Quick-Win* recomendado.
   - Sella la evaluación `"AI_FULL_PROCESS_RISK_EVALUATION"` en `AuditLog` (`SHA-256`).
3. **Modal / Panel Ejecutivo de Resultados del Evaluador IA en `FlowchartView.tsx`:**
   - Muestra el diagnóstico integral, las correlaciones con los demás procesos del banco y las tarjetas de los riesgos detectados nodo por nodo.
   - En cada riesgo detectado incluye un botón **`"+ Anclar a este Nodo y Matriz Viva"`**, además de un botón maestro **`"Anclar Todos los Riesgos Detectados al Proceso"`** que los registra en `RiskEvent` (vía `/api/risks`) vinculados a su `processNodeId` respectivo, actualizando al instante los contadores y semáforos de las figuras en el diagrama.

---

## ✅ Criterios de Aceptación y Verificación Final

1. Ejecuta `npx tsc --noEmit` y verifica que existan **0 errores de TypeScript**.
2. Comprueba que las 3 nuevas funcionalidades operen de extremo a extremo sobre SQLite:
   - Conversar con la IA y generar un nuevo proceso completo que aparezca en el selector de procesos y se dibuje en el lienzo.
   - Dar clic al botón `+` al final de cualquier figura del diagrama, elegir una nueva figura (como *Rombo de Decisión* o *Cuadro de Acción*), ver cómo se agrega y conecta en el flujo, y al darle clic editar sus campos específicos en el Inspector Lateral.
   - Ejecutar el botón **"Evaluador Riesgos IA"** y anclar los riesgos detectados a los nodos del diagrama.
3. Verifica que `http://localhost:3000` responda `HTTP 200 OK`, realiza `git commit` y `git push` a `https://github.com/RicardoAguirreStart/demo-matriz-riesgo-bxplus` manteniendo `.env` y `dev.db` fuera del repositorio.
