# Prompt de Desarrollo: Rediseño Integral de la Matriz de Priorización de Mitigación, Cuadrante 2×2 Quick-Wins y Cierre de Ciclo 3LD por Proceso, Nodo y Riesgo

> **Instrucciones para el Usuario:** Copia y pega este documento completo en la consola de tu **Agente de Desarrollo** para transformar la pestaña **8. Planes & Quick-Wins (`ActionPlansView.tsx`)** en una verdadera **Matriz de Priorización de Mitigación 2×2 centrada en Procesos Bancarios, Nodos del Diagrama y Retorno de Inversión (ROI)**, conectada en vivo con Gemini IA, las 3 Líneas de Defensa y el modo **"3. Objetivo Post-Plan"** de la Matriz 5×5 (`HeatmapView.tsx`).

---

## 🎯 Contexto y Objetivo Arquitectónico

Actualmente, la vista [`src/components/ActionPlansView.tsx`](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/components/ActionPlansView.tsx) lleva por título *"Matriz de Priorización de Mitigación y Cuadrante Quick-Wins"*, pero funciona únicamente como una lista de tarjetas y una tabla plana, con solo 3 planes sembrados en base de datos (dejando procesos como `PR-GAR-01` y `PR-TI-01` sin planes iniciales).

Para alinear esta sección con la arquitectura centrada en **Procesos Bancarios $\rightarrow$ Nodos del Diagrama $\rightarrow$ Eventos de Riesgo $\rightarrow$ Controles $\rightarrow$ Matriz 5×5**, debes ejecutar un rediseño integral que resuelva **5 objetivos clave**:

1. **Poblar Planes de Acción y Quick-Wins para TODOS los Procesos Bancarios (Auto-Seed / Inicialización en Backend):** Asegurar que los 4 procesos bancarios (`PR-AGRO-01`, `PR-TES-01`, `PR-GAR-01`, `PR-TI-01`) cuenten con planes de acción y Quick-Wins distribuidos en los 4 cuadrantes estratégicos.
2. **Construir la Matriz Visual Interactiva 2×2 de Priorización (Impacto $\Delta\text{PEA}$ vs. Esfuerzo/Plazo):** Un cuadrante visual interactivo (Eje Y: Potencial de Reducción $\Delta\text{PEA}\%$; Eje X: Esfuerzo / Plazo en días y Escala de Costo) dividido en los **4 Cuadrantes Estratégicos**:
   - ⚡ **Cuadrante I — Quick-Wins (Mejora $\ge 60\%$, Plazo $\le 90\text{ días}$ y Costo Bajo/Muy Bajo)**
   - 🏗️ **Cuadrante II — Proyectos Estructurales / Core (Mejora $\ge 60\%$, Plazo $> 90\text{ días}$ o Costo Medio/Alto)**
   - 🔧 **Cuadrante III — Mejoras Tácticas Operativas (Mejora $< 60\%$, Plazo $\le 90\text{ días}$)**
   - ⏸️ **Cuadrante IV — Baja Prioridad / Reevaluar (Mejora $< 60\%$, Plazo $> 90\text{ días}$)**
3. **Radar de Brechas de Mitigación por Proceso ("Riesgos Huérfanos sin Plan" & Controles `NF`) + Generador de Planes con IA (Gemini):** Mostrar qué riesgos del proceso seleccionado aún no tienen Plan de Acción (o tienen controles No Formalizados `NF` bajo CUB Art. 88) y permitir generar planes de acción en 1 clic manualmente o mediante **"✨ Sugerir Planes & Quick-Wins con IA para este Proceso"**.
4. **Cálculo de ROI de Mitigación ($\text{Múltiplo } \Delta\text{PEA} / \text{Costo}$) y Salto en Matriz 5×5 (`Residual Actual` $\rightarrow$ `Objetivo Post-Plan`):** Mostrar en cada tarjeta y fila de plan el múltiplo de retorno financiero ($\text{ROI} = \text{Reducción Anual PEA} / \text{Costo Estimado}$) y cómo se desplaza la coordenada del riesgo en la Matriz 5×5 del proceso:
   $$(P_{\text{res}} \times I_{\text{res}}) \longrightarrow (P_{\text{post-plan}} \times I_{\text{post-plan}})$$
5. **Cierre del Ciclo de Gobernanza de las 3 Líneas de Defensa (`VERIFY_AND_APPLY_PLAN`) y Sincronización con `HeatmapView.tsx`:** Permitir que la **2ª Línea (`UAIR_ADMIN` / `C_LEVEL_CAIR`)** verifique y apruebe planes con evidencia `SHA-256`, pasando el plan a `COMPLETED_VERIFIED`, formalizando controles asociados y conectando el cálculo real de `improvementPotentialPct` al modo **"3. Objetivo Post-Plan"** en [`src/components/HeatmapView.tsx`](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/components/HeatmapView.tsx).

---

## 🛠️ Instrucciones Detalladas de Implementación Paso a Paso

### PASO 1: Actualizar el Backend en `src/app/api/action-plans/route.ts`

Modifica [`src/app/api/action-plans/route.ts`](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/app/api/action-plans/route.ts) para soportar:

1. **Auto-hidratación de Planes para todos los Procesos en `GET /api/action-plans`:**
   - Antes de devolver la lista de planes, verifica cuántos planes existen en `prisma.actionPlan.count()`. Si existen $\le 4$ planes (o si los procesos `PR-GAR-01` y `PR-TI-01` no tienen planes asociados), inserta automáticamente un lote complementario de planes realistas vinculados a los riesgos existentes de `PR-GAR-01`, `PR-TI-01`, `PR-TES-01` y `PR-AGRO-01` para que los **4 procesos bancarios** y los **4 cuadrantes de la Matriz 2×2** tengan datos ricos desde la primera carga:
     - Un *Quick-Win* para `RSK-CYBER-006` o `RSK-CYBER-015` en `PR-TI-01` (ej. *"Aislamiento Automático EDR y Bloqueo de Cuentas Privilegiadas en SOC"*, mejora $75\%$, costo $\$140,000\text{ MXN}$, `LOW`, $35\text{ días}$, `isQuickWin: true`).
     - Un *Quick-Win* para `RSK-LEG-009` o `RSK-CRED-013` en `PR-GAR-01` (ej. *"Checklist Digital Obligatorio de Avalúos y Certificación Notarial Pre-Desembolso"*, mejora $65\%$, costo $\$95,000\text{ MXN}$, `LOW`, $30\text{ días}$, `isQuickWin: true`).
     - Un *Proyecto Estructural (Cuadrante II)* para `RSK-LIQ-004` en `PR-TES-01` (ej. *"Motor Intradía de Liquidez y Alertas Tempranas CCL/CFEN Automatizado"*, mejora $70\%$, costo $\$680,000\text{ MXN}$, `MEDIUM`, $120\text{ días}$, `isQuickWin: false`).
     - Una *Mejora Táctica (Cuadrante III)* para `RSK-OP-016` en `PR-GAR-01` (ej. *"Validador Previo de Layouts Regulatorios SITI R01/R10"*, mejora $45\%$, costo $\$65,000\text{ MXN}$, `VERY_LOW`, $25\text{ días}$, `isQuickWin: false`).
   - En el `include` de `prisma.actionPlan.findMany`, asegúrate de incluir:
     ```ts
     riskEvent: {
       include: {
         businessUnit: true,
         taxonomy: true,
         process: { include: { macroProcess: true } },
         processNode: true,
         controls: { include: { control: true } },
       },
     },
     control: true,
     owner: true,
     evidences: true,
     ```

2. **Nueva Acción `VERIFY_AND_APPLY_PLAN` en `POST /api/action-plans` (2ª Línea UAIR):**
   - Cuando `action === "VERIFY_AND_APPLY_PLAN"`:
     - Recibe `{ planId, userRole }`.
     - Marca todas las evidencias del plan (`prisma.actionPlanEvidence.updateMany`) con `approvedByUAIR: true`.
     - Actualiza el `ActionPlan` a `status: "COMPLETED_VERIFIED"` y `signedByBusinessHead: true`.
     - Calcula el nuevo riesgo residual mitigado aplicando una reducción proporcional al `improvementPotentialPct` (por ejemplo, reduciendo `residualProbability` y `residualImpact` en función de `improvementPotentialPct * 0.45`, respetando piso `1.0`, recalculando `residualScore`, `residualZone` con `mapScoreTo5x5Zone`, y reduciendo `expectedAnnualLossPEA` y `maxAnnualLossPMA`).
     - Si el riesgo o el plan tiene un `controlId` (o controles en `RiskControlMap` que estaban con `isFormalized: false`), actualiza el control a `isFormalized: true` y `hasValidEvidence: true`.
     - Registra el evento en `recordAuditLog` con `actionType: "UAIR_VERIFY_AND_APPLY_PLAN"` y devuelve el plan y el riesgo actualizados junto con el `currentHash` SHA-256.

3. **Nueva Acción `AI_SUGGEST_PLANS_FOR_PROCESS` en `POST /api/action-plans` (Generador IA por Proceso):**
   - Cuando `action === "AI_SUGGEST_PLANS_FOR_PROCESS"`:
     - Recibe `{ processId, userRole }`.
     - Busca los riesgos del proceso (priorizando aquellos que no tienen planes activos o que están en zonas `RED`, `ORANGE`, `YELLOW`).
     - Invoca a Gemini (`chatWithRiskCopilot` o generación estructurada con fallback determinista inmediato) para proponer y crear en base de datos entre **2 y 3 planes de mitigación** (al menos 1 *Quick-Win* y 1 *Proyecto Estructural*) adaptados específicamente al nombre del proceso, el nodo del diagrama (`processNode.label`) y la causa del riesgo (`isSuggestedByAI: true`).
     - Registra el evento en `recordAuditLog` (`actionType: "AI_GENERATE_PROCESS_PLANS"`) y retorna los planes recién creados.

---

### PASO 2: Rediseñar `src/components/ActionPlansView.tsx` en 4 Capas Ejecutivas

Reestructura [`src/components/ActionPlansView.tsx`](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/components/ActionPlansView.tsx) manteniendo el *Taste Index B×+* (`#1F242B`, `#C0D725`, `#3299A8`, tipografía `Arvo` + `Inter` + `JetBrains Mono`) y utilizando el componente [`CustomSelect`](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/components/ui/CustomSelect.tsx):

#### Capa 1: Cabecera de Proceso, Selector `CustomSelect`, Acciones IA y 4 KPIs de Mitigación y ROI
1. **Barra Superior:**
   - Selector `CustomSelect` **"Filtrar por Proceso Bancario"** (`Todos los Procesos (Portafolio Consolidado)` o cualquiera de los procesos registrados con su código y conteo de planes).
   - Botón **"✨ Sugerir Planes con IA para este Proceso"** (con estado de carga `generatingAIPlans` que llama a `action: "AI_SUGGEST_PLANS_FOR_PROCESS"`).
   - Botón **"+ Nuevo Plan de Mitigación"** (abre el modal de creación).
2. **4 Tarjetas KPI Dinámicas (calculadas sobre el proceso seleccionado):**
   - **KPI 1 — Cobertura de Mitigación del Proceso:** Muestra `X de Y riesgos con Plan` (`% de cobertura`) y cuántos riesgos del proceso siguen sin plan (*Huérfanos*).
   - **KPI 2 — Ahorro Anual Proyectado ($\Delta\text{PEA}$ Post-Plan):** Suma de `expectedPEAReductionMXN` de los planes del proceso y porcentaje de reducción sobre la $\text{PEA}$ actual del proceso.
   - **KPI 3 — Inversión Estimada vs. ROI de Mitigación:** Suma de `estimatedCostMXN` frente al **Múltiplo ROI** ($\text{Ahorro Anual } \Delta\text{PEA} / \text{Inversión Total}$, ej. `18.4x retorno anual`).
   - **KPI 4 — Quick-Wins & Gobernanza CUB Art. 88:** Total de iniciativas en Cuadrante Quick-Win, cuántos planes están firmados por 1ª Línea (`signedByBusinessHead`) y cuántos verificados por 2ª Línea UAIR (`COMPLETED_VERIFIED`).

#### Capa 2: Matriz Visual Interactiva 2×2 de Priorización (Izquierda, 7 cols) + Radar de Brechas del Proceso / Riesgos sin Plan (Derecha, 5 cols)
1. **Columna Izquierda (`lg:col-span-7`): Matriz 2×2 de Priorización (Impacto $\Delta\text{PEA}\%$ vs. Esfuerzo/Plazo):**
   - Dibuja una cuadrícula 2×2 clara, limpia y ejecutiva con ejes etiquetados:
     - **Eje Vertical (Arriba = Alta Mitigación $\ge 60\%$; Abajo = Mitigación Moderada $< 60\%$)**.
     - **Eje Horizontal (Izquierda = Bajo Esfuerzo $\le 90\text{ días}$ & Costo Bajo; Derecha = Alto Esfuerzo $> 90\text{ días}$ o Costo Medio/Alto)**.
   - Los 4 cuadrantes deben mostrar su título, criterio, conteo de planes, ahorro acumulado $-\Delta\text{PEA}$ y los **chips interactivos de cada plan** (`PA-2026-001 • RSK-CYBER-001 • Nodo: ...`):
     - **Cuadrante I (Arriba-Izquierda, borde y fondo esmeralda/lima `#C0D725`):** `⚡ I. QUICK-WINS (Ejecución Inmediata • ≤90d & ≥60%)`
     - **Cuadrante II (Arriba-Derecha, borde y fondo azul/cian):** `🏗️ II. PROYECTOS ESTRUCTURALES CORE (>90d o Inversión Mayor & ≥60%)`
     - **Cuadrante III (Abajo-Izquierda, borde y fondo ámbar):** `🔧 III. MEJORAS TÁCTICAS OPERATIVAS (≤90d & <60%)`
     - **Cuadrante IV (Abajo-Derecha, borde y fondo gris/pizarra):** `⏸️ IV. BAJA PRIORIDAD / REEVALUAR (>90d & <60%)`
   - Al hacer clic en un cuadrante o en un chip dentro del cuadrante, permite filtrar o resaltar ese plan en las tarjetas/tabla inferior (`selectedQuadrantFilter`: `"ALL" | "Q1_QUICK_WIN" | "Q2_STRUCTURAL" | "Q3_TACTICAL" | "Q4_LOW_PRIORITY"`).
2. **Columna Derecha (`lg:col-span-5`): Radar de Brechas del Proceso (Riesgos Huérfanos sin Plan y Controles `NF`):**
   - Filtra los riesgos del proceso seleccionado (`risks`) que **no tienen ningún plan asignado** (o cuyos controles asociados tienen `isFormalized === false`).
   - Muestra para cada riesgo huérfano:
     - Código (`RSK-XXX`), Título, **Proceso** y **Nodo del Diagrama** (`processNode.label`).
     - Badge de Zona Residual actual (`RED`, `ORANGE`, `YELLOW`, `GREEN`), su $\text{PEA}$ actual e insignia naranja si tiene **Control `NF` (Topado a 2)**.
     - Botón directo **`+ Crear Plan / Quick-Win`** que abre el Modal de Nuevo Plan pre-seleccionando automáticamente ese `risk.id` y sugiriendo un título de remediación para su nodo.

#### Capa 3: Tarjetas Ejecutivas de Quick-Wins con Salto en Matriz 5×5 (`Residual` $\rightarrow$ `Objetivo Post-Plan`) y Flujo 3LD
- En cada tarjeta de Quick-Win muestra:
  1. Código (`PA-2026-XXX`), insignia `QUICK-WIN`, insignia `✨ Sugerido por IA` (si `isSuggestedByAI === true`) y estado (`DRAFT`, `APPROVED_COMMITTED`, `EVIDENCE_SUBMITTED`, `COMPLETED_VERIFIED`).
  2. Etiquetas de **Proceso Bancario** (`process.code — process.name`) y **Nodo del Diagrama** (`processNode.label`).
  3. **Bloque Visual de Salto en Matriz 5×5 (Pre-Plan vs. Post-Plan):**
     - Calcula y muestra la coordenada Residual Actual $(P_{\text{res}} \times I_{\text{res}}, \text{Score}_{\text{res}}, \text{Zona}_{\text{res}}) \longrightarrow$ Coordenada Objetivo Post-Plan $(P_{\text{target}} \times I_{\text{target}}, \text{Score}_{\text{target}}, \text{Zona}_{\text{target}})$.
  4. **Métricas Financieras y ROI:**
     - `Beneficio Anual PEA: -$X MXN`, `Inversión Estimada: $Y MXN`, y badge destacado **`ROI: Z.Zx`** ($\text{Beneficio PEA} / \text{Costo}$).
  5. **Barra de Gobernanza de 3 Líneas de Defensa (Botones contextuales):**
     - **Paso 1 (1ª Línea — Titular):** Botón `Firmar Compromiso` (`SIGN_PLAN`).
     - **Paso 2 (1ª Línea — Evidencia):** Botón `+ Evidencia SHA-256` (`ADD_EVIDENCE`).
     - **Paso 3 (2ª Línea — UAIR / CAIR):** Si el plan ya está firmado o tiene evidencia y aún no está en `COMPLETED_VERIFIED`, botón verde/lima **`✓ Verificar UAIR y Aplicar Mitigación`** (`VERIFY_AND_APPLY_PLAN`) que formaliza el control y reduce el riesgo residual en vivo.

#### Capa 4: Inventario Completo de Planes (Vista Agrupada por Proceso Bancario o Vista Tabular)
- Añade un interruptor en la cabecera de la tabla: **"Agrupado por Proceso Bancario"** (activo por defecto) vs. **"Tabla Plana"**, igual que en la Matriz Viva.
- Incluye filtro rápido por cuadrante (`Todos`, `⚡ Quick-Wins`, `🏗️ Estructurales`, `🔧 Tácticos`) y columna explícita de **Salto 5×5 (`Actual → Objetivo`)**, **ROI (`Xx`)**, **Firma 1ª Línea**, **Evidencia SHA-256** y **Dictamen 2ª Línea UAIR**.

---

### PASO 3: Conectar el Cálculo Real de `"3. Objetivo Post-Plan"` en `src/components/HeatmapView.tsx`

En [`src/components/HeatmapView.tsx`](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/components/HeatmapView.tsx) (alrededor de las líneas 100–113):
- Actualmente, cuando `viewMode === "TARGET"` (*3. Objetivo Post-Plan*), el código aplica un factor fijo `0.7`:
  ```ts
  const targetProb = Math.max(1, Math.round(r.residualProbability * 0.7));
  const targetImp = Math.max(1, Math.round(r.residualImpact * 0.7));
  ```
- **Actualízalo** para que utilice los planes de acción reales asociados al riesgo (`r.actionPlans`):
  - Si el riesgo tiene planes en `r.actionPlans` (`r.actionPlans.length > 0`), toma el máximo `improvementPotentialPct` de sus planes (ej. `maxImprovement = Math.max(...r.actionPlans.map((p: any) => p.improvementPotentialPct || 0.5))`) y calcula:
    ```ts
    const reductionFactor = 1 - maxImprovement * 0.55;
    const targetProb = Math.max(1, Math.round(r.residualProbability * reductionFactor));
    const targetImp = Math.max(1, Math.round(r.residualImpact * reductionFactor));
    ```
  - Si el riesgo **no tiene planes de acción**, mantén su coordenada residual actual (`Math.round(r.residualProbability)` y `Math.round(r.residualImpact)`), de modo que en la Matriz 5×5 Post-Plan el usuario vea con total exactitud cómo bajan los riesgos que sí tienen Plan de Acción y cuáles permanecen sin cambio por falta de plan.

---

## ✅ Criterios de Verificación antes de Confirmar

1. Ejecuta `npx tsc --noEmit` y verifica **0 errores** de TypeScript.
2. Verifica que al abrir la pestaña **8. Planes & Quick-Wins**:
   - Los 4 procesos bancarios tengan planes y Quick-Wins cargados.
   - Se visualice la **Matriz 2×2 de Priorización** junto al **Radar de Brechas del Proceso (Riesgos sin Plan)**.
   - Se pueda generar planes con IA por proceso, crear un plan desde un riesgo huérfano, firmarlo (1ª Línea), adjuntar evidencia `SHA-256` y verificarlo/aplicarlo con la UAIR (2ª Línea).
3. Haz `git add`, `git commit` y `git push` al repositorio remoto al finalizar.
