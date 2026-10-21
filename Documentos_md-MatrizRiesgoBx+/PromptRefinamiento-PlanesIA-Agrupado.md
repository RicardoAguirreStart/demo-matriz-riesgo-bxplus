# Prompt Quirúrgico: Asistente IA Gemini con Modal de Previsualización/Selección de Planes y Agrupamiento por Proceso en `ActionPlansView.tsx`

> **Instrucciones:** Ejecuta estas 2 mejoras puntuales en [`src/app/api/action-plans/route.ts`](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/app/api/action-plans/route.ts) y [`src/components/ActionPlansView.tsx`](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/components/ActionPlansView.tsx) para conectar **Google Gemini (`gemini-2.5-flash`) en vivo** con un modal de revisión/selección de propuestas antes de insertarlas, y activar la vista agrupada **`"Por Proceso"`** en la tabla inferior.

---

## 🛠️ MEJORA 1: Conectar `AI_SUGGEST_PLANS_FOR_PROCESS` a Gemini Real + Modal de Previsualización y Selección con Checkboxes

Actualmente, en [`src/app/api/action-plans/route.ts` (líneas 545–668)](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/app/api/action-plans/route.ts#L545-L668), la acción `AI_SUGGEST_PLANS_FOR_PROCESS` genera textos prefabricados en código y los inserta directamente en la base de datos sin consultar al usuario.

### 1.1. En `src/app/api/action-plans/route.ts`:
Divide el flujo en **2 acciones**:
1. **`action === "AI_PREVIEW_PLANS_FOR_PROCESS"` (Generación con Gemini `gemini-2.5-flash` sin guardar aún en BD):**
   - Busca los riesgos del proceso seleccionado (`processId`), priorizando los que están en el **Radar de Brechas** (sin plan o con controles `NF` bajo CUB Art. 88) — hasta 4 riesgos candidatos.
   - Invoca a **Google Gemini (`gemini-2.5-flash`)** con `responseMimeType: "application/json"` (usando `@google/generative-ai` y el `SYSTEM_META_PROMPT` de [`src/lib/ai/gemini.ts`](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/lib/ai/gemini.ts)), enviándole el contexto real de cada riesgo candidato:
     - `riskId`, `code`, `title`, `cause`, `eventDescription`, `residualProbability`, `residualImpact`, `residualZone`, `expectedAnnualLossPEA`, `maxAnnualLossPMA`, `process.code`, `process.name`, `processNode.label`, `processNode.nodeType`, y si tiene controles `NF`.
   - Pide a Gemini que devuelva un JSON con:
     - `executiveDiagnosis`: Breve dictamen ejecutivo de por qué estos nodos presentan vulnerabilidad y la estrategia de mitigación para el proceso.
     - `proposals`: Arreglo de planes propuestos (1 por cada riesgo candidato, combinando iniciativas **Cuadrante I: Quick-Win** de ejecución ágil $\le 90\text{d}$ y **Cuadrante II: Proyecto Estructural Core** o **Cuadrante III: Mejora Táctica**), donde cada propuesta incluya:
       - `riskEventId`, `riskCode`, `riskTitle`, `processCode`, `processNodeLabel`
       - `title` (título técnico específico al riesgo y nodo, sin textos genéricos repetidos)
       - `description` (mecanismo de control preventivo/detectivo, entregable y fundamento CUB/Banxico/NIF C-16)
       - `rationaleAI` (justificación de por qué cae en ese cuadrante 2×2)
       - `planTypes` (`["TECHNOLOGY", "PROCESSES"]`, etc.)
       - `improvementPotentialPct` (ej. `0.45` a `0.85`)
       - `estimatedCostMXN` (monto realista en MXN)
       - `costScale` (`"VERY_LOW" | "LOW" | "MEDIUM" | "HIGH"`)
       - `estimatedDays` (`20` a `150` días)
       - `quadrant` (`"Q1_QUICK_WIN" | "Q2_STRUCTURAL" | "Q3_TACTICAL" | "Q4_LOW_PRIORITY"`)
       - `expectedPEAReductionMXN` y `expectedPMAReductionMXN` calculados sobre el riesgo real.
   - *(Incluye un fallback determinista rico solo en caso de que la API de Gemini falle o tarde).*
2. **`action === "AI_COMMIT_SELECTED_PLANS"` (Inserción en BD de las propuestas aprobadas por el usuario):**
   - Recibe `{ selectedProposals, processId, userRole }`.
   - Inserta en `prisma.actionPlan` únicamente las propuestas seleccionadas por el usuario con `isSuggestedByAI: true`, recalcula `isQuickWin`, registra en `recordAuditLog` (`actionType: "AI_GENERATE_PROCESS_PLANS"`) y devuelve los planes creados.

### 1.2. En `src/components/ActionPlansView.tsx`:
- Al hacer clic en el botón **`"✨ Sugerir Planes con IA"`** de la barra superior:
  - Abre un **Modal Interactivo `"✨ Asistente IA Gemini: Propuestas de Mitigación y Quick-Wins para el Proceso"`**.
  - Mientras Gemini razona, muestra un estado de carga claro (*"Gemini 2.5 Flash analizando nodos del diagrama, riesgos en el Radar de Brechas y controles NF..."*).
  - Al recibir la respuesta de `AI_PREVIEW_PLANS_FOR_PROCESS`, muestra:
    1. El **Dictamen Ejecutivo de Gemini (`executiveDiagnosis`)** para el proceso.
    2. La **lista de tarjetas de Planes Propuestos con Checkboxes** (todos marcados por defecto, permitiendo marcar/desmarcar cuáles se desean agregar).
    3. En cada tarjeta de propuesta muestra:
       - El riesgo objetivo (`riskCode — riskTitle`) y su **Nodo del Diagrama** (`processNodeLabel`).
       - El **Cuadrante 2×2** asignado (`⚡ I. Quick-Win`, `🏗️ II. Estructural Core`, `🔧 III. Táctico`), el **Salto 5×5 (`Actual → Objetivo`)**, el `% de Mejora`, `Costo MXN`, `Plazo en días`, **Múltiplo ROI (`Xx`)** y la justificación de la IA (`rationaleAI`).
    4. Botón inferior **`"Insertar X Planes Seleccionados en la Matriz 2×2"`** que invoca `AI_COMMIT_SELECTED_PLANS`, actualiza en vivo la Matriz 2×2, saca a esos riesgos del Radar de Brechas y muestra el banner de confirmación.

---

## 🛠️ MEJORA 2: Conectar el Switch `"Por Proceso"` (`tableLayout === "GROUPED"`) en la Tabla Inferior (`Capa 4`)

En [`src/components/ActionPlansView.tsx` (líneas 1368–1691)](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/components/ActionPlansView.tsx#L1368-L1691), los botones `"Por Proceso"` (`tableLayout === "GROUPED"`) y `"Tabla Plana"` (`tableLayout === "FLAT"`) cambian el estado `tableLayout`, pero la tabla siempre renderiza una sola lista plana (`displayPlans.map(...)`).

- Conecta `tableLayout === "GROUPED"` para que, cuando esté activo:
  - Agrupe `displayPlans` por Proceso Bancario (`p.riskEvent?.process?.code || "SIN-PROCESO"`).
  - Para cada proceso, renderice una **Cabecera Institucional de Proceso** (estilo `#1F242B` / pizarra con borde izquierdo `#C0D725` o `#3299A8`, igual que en `RiskAdminView.tsx`) que muestre:
    - Código y Nombre del Proceso (`PR-AGRO-01 — Originación y Evaluación...`) + Macroproceso.
    - Total de Planes del proceso y cuántos son `⚡ Quick-Wins`.
    - Suma de **Inversión Estimada (`MXN`)**, Suma de **Ahorro Anual (`-ΔPEA MXN`)** y **ROI Promedio del Proceso (`Xx`)**.
  - Debajo de cada cabecera, renderice las filas de los planes pertenecientes a ese proceso.
  - Cuando el usuario cambie a `"Tabla Plana"` (`tableLayout === "FLAT"`), muestre la tabla unificada actual.

---

## ✅ Verificación Final
1. Ejecuta `npx tsc --noEmit` y confirma **0 errores**.
2. Realiza `git add`, `git commit` y `git push`.
