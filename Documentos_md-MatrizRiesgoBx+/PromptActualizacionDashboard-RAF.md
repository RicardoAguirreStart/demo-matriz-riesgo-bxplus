# Prompt de Desarrollo: Sincronización Integral del Tablero Ejecutivo de Riesgos Relevantes, Marco RAF y Trazabilidad por Procesos (`DashboardView.tsx`)

> **Instrucciones para el Usuario:** Copia y pega este documento completo en la consola de tu **Agente de Desarrollo** para corregir las 6 desalineaciones detectadas en la auditoría del **Tablero Ejecutivo de Riesgos Relevantes y Marco RAF (`DashboardView.tsx`)**, su endpoint [`src/app/api/dashboard/stats/route.ts`](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/app/api/dashboard/stats/route.ts) y el widget de vigilancia [`src/components/FloatingSafetyWidget.tsx`](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/components/FloatingSafetyWidget.tsx).

---

## 🎯 Contexto y Hallazgos de Auditoría a Resolver

Tras auditar el **Dashboard C-Level (`DashboardView.tsx`)** frente a las mejoras implementadas en el Diagramador, la Matriz Viva, la Matriz 5×5 por Proceso, el Simulador de Estrés y la Matriz 2×2 de Planes & Quick-Wins, se identificaron **6 desalineaciones** que deben corregirse de inmediato:

1. **Contradicción numérica entre la tarjeta RAF `PEA_OP` y la tarjeta `Riesgo Operacional (PEA & PMA)`:**
   - La tarjeta RAF `PEA_OP` muestra un valor estático de `$38,400,000 MXN` guardado en el seed, mientras que la tarjeta de abajo (`financials.totalPEA`) suma los riesgos reales (`~$82.47M MXN`) o los valores actualizados tras mitigar/crear riesgos. Ambas deben estar 100% sincronizadas en vivo y recalcular dinámicamente la zona del Marco RAF (`GREEN`, `YELLOW`, `ORANGE`, `RED`).
2. **Falta de Filtro por Proceso Bancario (`CustomSelect`) y Resumen Ejecutivo por Proceso en el Dashboard:**
   - El Dashboard es la única vista que aún no permite filtrar por **Proceso Bancario (`processId`)** ni muestra una radiografía comparativa de salud y exposición por cada proceso del banco (`PR-AGRO-01`, `PR-TES-01`, `PR-CRED-02`, `PR-TI-01`).
3. **Bug en `hasUnverifiedControls` dentro del Algoritmo Multicriterio "Top 5–7 Riesgos Críticos":**
   - En [`src/app/api/dashboard/stats/route.ts` (línea 48)](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/app/api/dashboard/stats/route.ts#L48), `r.controls.some((c) => !c.control.hasValidEvidence)` devuelve `false` cuando un riesgo tiene `0` controles asociados (`r.controls.length === 0`), eximiéndolo por error de la penalización del 10%, y tampoco evalúa `!c.control.isFormalized` (regla `NF` CUB Art. 88).
4. **Falta de Trazabilidad de Nodo del Diagrama, Código de Proceso y Cobertura de Plan en la Tabla "Top 5–7 Riesgos Críticos":**
   - La tabla del Top 5–7 no muestra el **Código del Proceso (`process.code`)**, el **Nodo del Diagrama (`processNode.label`)** ni el **Estado de Mitigación del Riesgo** (si tiene un Plan *Quick-Win* activo, si ya fue *Verificado por UAIR* o si es un *Riesgo Huérfano sin Plan*).
5. **Falta de Indicador Ejecutivo de Mitigación Activa, Quick-Wins, Ahorro $-\Delta\text{PEA}$ y Gobernanza 3LD:**
   - En el bloque central de resumen financiero falta una **4ª Tarjeta Ejecutiva ("Mitigación Activa, Quick-Wins & ROI 3LD")** que conecte en tiempo real los planes de acción, el ahorro anual proyectado $-\Delta\text{PEA}$, el múltiplo ROI de mitigación, los planes firmados/verificados por UAIR y los riesgos huérfanos.
6. **Datos fijos hardcodeados en `FloatingSafetyWidget.tsx`:**
   - El widget flotante inferior izquierdo muestra textos estáticos (como decir que el conector SPEI tiene un Quick-Win pendiente de firma incluso cuando ya fue firmado o verificado por UAIR). Debe alimentarse de datos reales desde `/api/dashboard/stats`.

---

## 🛠️ Instrucciones Detalladas de Implementación Paso a Paso

### PASO 1: Actualizar el Endpoint `src/app/api/dashboard/stats/route.ts`

Modifica [`src/app/api/dashboard/stats/route.ts`](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/app/api/dashboard/stats/route.ts) para soportar filtrado por proceso y calcular todas las métricas sincronizadas en tiempo real:

1. **Soporte para Filtro por Proceso (`processId`) además de `businessLine`:**
   - Lee `const processId = searchParams.get("processId") || "ALL";`.
   - Construye `whereClause`: si `businessLine !== "ALL"`, filtra por `businessUnitId`; si `processId !== "ALL"`, agrega `whereClause.processId = processId`.
2. **Consulta Completa de Procesos, Riesgos, Planes, KRIs y Umbrales RAF:**
   - Trae en paralelo (`Promise.all`):
     - `allRisks`: `prisma.riskEvent.findMany` (con `taxonomy`, `businessUnit`, `process: { include: { macroProcess: true } }`, `processNode`, `actionPlans: { include: { evidences: true } }`, `controls: { include: { control: true } }`).
     - `allProcesses`: `prisma.process.findMany` (con `macroProcess`, `_count: { select: { flowNodes: true, riskEvents: true } }`).
     - `allPlans`: `prisma.actionPlan.findMany` (filtrados por los riesgos del alcance actual o ligados a `allRisks`).
     - `rafThresholdsRaw`: `prisma.rAFThreshold.findMany({ orderBy: { metricCode: "asc" } })`.
     - `kris`: `prisma.kRI.findMany({ include: { riskEvent: { include: { process: true } } } })`.
     - `totalPCE`: `prisma.creditExposureNifC16.aggregate({ _sum: { expectedCreditLossPCE: true, grossExposureEI: true }, _count: { id: true } })`.
3. **Sincronización Dinámica de `PEA_OP` y Evaluación en Vivo de Zonas RAF (`rafThresholds`):**
   - Calcula `totalPEA` y `totalPMA` sumando `expectedAnnualLossPEA` y `maxAnnualLossPMA` de `allRisks`.
   - Para el umbral RAF cuyo `metricCode === "PEA_OP"`:
     - Si se está consultando todo el banco (`processId === "ALL"` y `businessLine === "ALL"`), o proporcionalmente, actualiza su `currentValue` para que coincida exactamente con la **PEA Operativa/Mitigada real** (o ajusta los umbrales de `PEA_OP` a la escala real del portafolio: `appetiteValue: 65000000`, `toleranceValue: 85000000`, `regulatoryLimitValue: 105000000`, `capacityValue: 125000000` si `totalPEA` supera los `$50M MXN`, y asigna `currentValue = totalPEA` para que **el número de la tarjeta RAF `PEA_OP` y el número de la tarjeta `Riesgo Operacional (PEA & PMA)` sean SIEMPRE idénticos al centavo**).
     - Recalcula dinámicamente `currentZone` (`GREEN`, `YELLOW`, `ORANGE`, `RED`) comparando `currentValue` contra `appetiteValue`, `toleranceValue` y `regulatoryLimitValue` según `direction` (`HIGHER_IS_WORSE` vs. `LOWER_IS_WORSE`).
4. **Corrección del Algoritmo "Top 5–7 Riesgos Críticos" (`mappedForRanking`):**
   - Corrige la bandera `hasUnverifiedControls`:
     ```ts
     const hasUnverifiedControls =
       !r.controls ||
       r.controls.length === 0 ||
       r.controls.some((c) => !c.control?.hasValidEvidence || !c.control?.isFormalized);
     ```
   - Incluye en cada elemento de `topCriticalRisks`:
     - `processCode: r.process?.code || "N/A"`
     - `processName: r.process?.name || "Proceso General"`
     - `processNodeLabel: r.processNode?.label || "Paso Operativo General"`
     - `hasFormalControl: r.controls?.length > 0 && r.controls.every((c) => c.control?.isFormalized)`
     - `actionPlansCount: r.actionPlans?.length || 0`
     - `quickWinsCount: r.actionPlans?.filter((p) => p.isQuickWin).length || 0`
     - `hasVerifiedPlan: r.actionPlans?.some((p) => p.status === "COMPLETED_VERIFIED") || false`
     - `primaryPlanCode: r.actionPlans?.[0]?.code || null`
     - `primaryPlanStatus: r.actionPlans?.[0]?.status || null`
5. **Nuevo Objeto `mitigationStats` (Métricas de Mitigación, Quick-Wins, ROI y 3LD):**
   - Calcula sobre los planes vinculados a `allRisks`:
     - `totalPlans`: total de planes activos en el alcance.
     - `quickWinsCount`: planes con `isQuickWin === true`.
     - `signedByFirstLineCount`: planes con `signedByBusinessHead === true`.
     - `verifiedByUAIRCount`: planes con `status === "COMPLETED_VERIFIED"`.
     - `totalPEAReductionMXN`: suma de `expectedPEAReductionMXN`.
     - `totalPMAReductionMXN`: suma de `expectedPMAReductionMXN`.
     - `totalInvestmentMXN`: suma de `estimatedCostMXN`.
     - `roiMultiple`: `totalInvestmentMXN > 0 ? Number((totalPEAReductionMXN / totalInvestmentMXN).toFixed(1)) : 0`.
     - `coveredRisksCount`: cantidad de riesgos en `allRisks` que tienen al menos 1 plan de acción (`r.actionPlans.length > 0`).
     - `orphanRisksCount`: `allRisks.length - coveredRisksCount`.
     - `coveragePct`: `allRisks.length > 0 ? Math.round((coveredRisksCount / allRisks.length) * 100) : 0`.
6. **Nuevo Arreglo `processHealthSummary` (Radiografía Ejecutiva por Proceso Bancario):**
   - Para cada proceso en `allProcesses`, calcula:
     - `id`, `code`, `name`, `macroProcessName: p.macroProcess?.name`, `isCriticalBCP: p.isCriticalBCP`, `nodesCount: p._count?.flowNodes || 0`.
     - `risksCount`, `zoneCounts` (`GREEN`, `YELLOW`, `ORANGE`, `RED`), `maxResidualScore`, `dominantZone`.
     - `totalPEA`, `totalPMA`.
     - `plansCount`, `quickWinsCount`, `orphanRisksCount`, `coveragePct`.
7. **Alertas Vivas para el Widget (`liveAlerts`):**
   - Devuelve en el JSON un objeto `liveAlerts` con:
     - `kris`: los KRIs registrados en base de datos con su valor actual y zona.
     - `rafAlerts`: umbrales RAF que estén en zona `YELLOW`, `ORANGE` o `RED`.
     - `topQuickWinOpportunity`: el plan Quick-Win con mayor `expectedPMAReductionMXN` o `expectedPEAReductionMXN` (indicando su código `PA-2026-XXX`, estado real, porcentaje de mejora y nodo), o el riesgo huérfano con mayor `expectedAnnualLossPEA` si todos los planes ya están verificados.

---

### PASO 2: Actualizar `src/components/DashboardView.tsx`

Actualiza [`src/components/DashboardView.tsx`](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/components/DashboardView.tsx) manteniendo la estética ejecutiva sobria (*Taste Index B×+* `#1F242B`, `#C0D725`, `#3299A8`, tipografía `Arvo` + `Inter` + `JetBrains Mono`) y sin emojis decorativos:

1. **Cabecera Ejecutiva con Selector de Proceso Bancario (`CustomSelect`):**
   - Añade en la barra superior del Dashboard el selector [`CustomSelect`](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/components/ui/CustomSelect.tsx) para filtrar todo el Tablero por **Proceso Bancario** (`Todos los Procesos (Vista Consolidada CAIR)` o cualquiera de los procesos `PR-AGRO-01`, `PR-TES-01`, `PR-CRED-02`, `PR-TI-01`), recargando `/api/dashboard/stats?businessLine=${businessLine}&processId=${selectedProcessId}`.
2. **Sección 1 — Tarjetas del Marco de Apetito al Riesgo (RAF — Art. 88 CUB):**
   - Muestra las 6 tarjetas (`ICAP`, `CET1`, `CCL`, `PEA_OP`, `SPEI_AVAIL`, `VAR_MKT`) en un grid limpio (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` para que las 6 tarjetas queden perfectamente balanceadas en 2 filas de 3 columnas sin dejar huecos impares).
   - Añade una barra visual de progreso/umbral en cada tarjeta RAF que ubique gráficamente el `Valor Actual` frente a `Apetito (Verde)`, `Tolerancia (Naranja)` y `Límite Regulatorio CNBV (Rojo)`.
   - Verifica que `PEA_OP` muestre exactamente el mismo monto en MXN que la tarjeta de `Riesgo Operacional (PEA & PMA)`.
3. **Sección 2 — 4 Tarjetas Ejecutivas de Resumen Financiero, Mitigación 3LD y Población 5×5 (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`):**
   - **Tarjeta 1 — Crédito & Reservas NIF C-16:** Exposición Bruta ($EI$), Pérdida Esperada ($PCE$), Cobertura de Reservas y enlace al Importador.
   - **Tarjeta 2 — Riesgo Operacional (PEA & PMA):** $\text{PEA}$ Actual, $\text{PMA}$ ($\text{VaR } 99.9\%$), Multiplicador de cola $\text{PMA}/\text{PEA}$ y enlace a la Matriz 5×5.
   - **Tarjeta 3 (NUEVA) — Mitigación Activa, Quick-Wins & ROI (3LD):**
     - Muestra el **Ahorro Anual Proyectado ($-\Delta\text{PEA}$)** de los planes activos (`mitigationStats.totalPEAReductionMXN`).
     - Desglosa: `Cobertura de Procesos: X/Y riesgos con plan (Z%)`, `Quick-Wins Activos: N`, `Retorno ROI: M.Mx` y `Gobernanza 3LD: K Verificados UAIR / J Firmados 1ª Línea`.
     - Botón inferior: `Ir a Matriz 2×2 & Quick-Wins` (`onNavigateTab("plans")`).
   - **Tarjeta 4 — Población de Riesgos Vivos (Matriz 5×5):**
     - Barras de distribución con los rangos exactos del motor matemático:
       - `Verde (Apetito | Score 1–4)`
       - `Amarillo (Preventivo | Score 5–9)`
       - `Naranja (Tolerancia | Score 10–15)`
       - `Rojo (Capacidad | Score 16–25)`
     - Botón inferior: `Explorar Matriz Viva Core` (`onNavigateTab("risks")`).
4. **Sección 3 (NUEVA) — Radiografía de Exposición y Cobertura por Proceso Bancario (`processHealthSummary`):**
   - Debajo de las 4 tarjetas financieras y antes del Ranking Top 5–7, incorpora un bloque institucional **"Exposición y Gobernanza por Proceso Bancario (Cadena de Valor B×+)"** con 4 tarjetas (1 por cada proceso registrado) que muestren:
     - Código (`PR-AGRO-01`), Nombre del Proceso, Macroproceso e insignia `BCP Crítico` si aplica.
     - Nodos del diagrama (`X nodos`) y Total de Riesgos (`Y riesgos`) con mini-badges de conteo por color (`Rojo`, `Naranja`, `Amarillo`, `Verde`).
     - $\text{PEA}$ y $\text{PMA}$ acumuladas del proceso.
     - Barra de **Cobertura de Mitigación (`% de riesgos con Plan`)** e indicador de *Quick-Wins* vs. *Riesgos Huérfanos*.
     - Al hacer clic en una tarjeta de proceso, filtra el Dashboard por ese proceso (o permite ir directo a su Diagrama / Matriz 5×5).
5. **Sección 4 — Tabla "Ranking Oficial Top 5–7 Riesgos Críticos para el CAIR":**
   - Actualiza la columna `Proceso / Unidad` a **`Proceso & Nodo del Diagrama`** mostrando el código del proceso (`r.processCode`), el nombre del proceso (`r.processName`) y el **Nodo del Diagrama (`r.processNodeLabel`)**.
   - Añade la columna **`Cobertura & Plan 3LD`** mostrando:
     - Si tiene plan verificado por UAIR: badge esmeralda `Mitigado UAIR (PA-2026-XXX)`.
     - Si tiene plan Quick-Win / en curso: badge cian/lima `Quick-Win Activo (PA-2026-XXX)`.
     - Si no tiene plan (`actionPlansCount === 0`): badge ámbar/rojo `Huérfano (Sin Plan)` con enlace directo a `onNavigateTab("plans")`.

---

### PASO 3: Conectar `src/components/FloatingSafetyWidget.tsx` a Datos Vivos

En [`src/components/FloatingSafetyWidget.tsx`](file:///Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/src/components/FloatingSafetyWidget.tsx):
- Haz que al montarse consulte `/api/dashboard/stats` (o reciba los datos vivos) para mostrar:
  1. El KRI real en alerta (`KRI-AGRO-02` con su valor real de base de datos).
  2. El indicador RAF en vigilancia preventiva (`CCL` o `PEA_OP` con su valor real actualizado).
  3. En la **"Recomendación Proactiva B×+"**, muestre dinámicamente el estado real de `liveAlerts.topQuickWinOpportunity` (por ejemplo, cuántos planes *Quick-Win* están activos, cuántos riesgos críticos siguen en el Radar de Brechas sin plan o cuál es el ahorro $-\Delta\text{PEA}$ disponible).

---

## ✅ Criterios de Verificación Final
1. Ejecuta `npx tsc --noEmit` y confirma **0 errores** de TypeScript.
2. Verifica que el monto de `PEA_OP` en las tarjetas del Marco RAF y el monto de `PEA` en la tarjeta de Riesgo Operacional coincidan exactamente.
3. Confirma que el selector de Proceso Bancario filtre el Dashboard y que la tabla Top 5–7 muestre el código de proceso, nodo del diagrama y cobertura de plan.
4. Haz `git add`, `git commit` y `git push` al finalizar.
