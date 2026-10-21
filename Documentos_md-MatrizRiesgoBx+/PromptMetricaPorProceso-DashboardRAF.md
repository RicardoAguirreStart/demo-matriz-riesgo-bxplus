# Prompt Quirúrgico: Métrica de Apetito RAF y KRI Clave por Proceso Bancario en el Tablero Ejecutivo

**Rol del Agente:** Desarrollador Full-Stack Senior (Next.js 16, TypeScript, Prisma, Tailwind CSS) y Especialista en Riesgos Bancarios CNBV (Circular Única de Bancos Art. 88, Marco RAF, Basilea III).  
**Objetivo:** Incorporar en el **Tablero Ejecutivo de Riesgos Relevantes y Marco RAF** (`DashboardView.tsx` y `/api/dashboard/stats/route.ts`) una **Métrica Integral por Proceso Bancario** que combine:
1. **Barra de Consumo de Apetito RAF por Proceso** ($\text{PEA del Proceso}$ vs. *Apetito / Tolerancia / Límite del Proceso*).
2. **Vinculación directa Proceso $\leftrightarrow$ Indicador RAF / KRI Principal** (ej. `PR-AGRO-01` $\rightarrow$ `IMORA`, `PR-TES-01` $\rightarrow$ `CCL`, `PR-CRED-02` $\rightarrow$ `ICAP`, `PR-TI-01` $\rightarrow$ `SPEI_AVAIL`), resaltando las métricas clave cuando se filtra un proceso.
3. **Índice de Mitigación Real Art. 88 CUB por Proceso** ($\%$ reducción $\text{Inherente} \rightarrow \text{Residual}$ y conteo de controles No Formalizados `NF`) + **% de Participación en la PEA Total del Banco**.
4. **Homologación rápida en `/api/reports/route.ts`** para que `PEA_OP` en el Informe Art. 88 CUB refleje el mismo `totalPEA` vivo del Dashboard.

---

## 🛠️ Instrucciones de Implementación Paso a Paso

### PASO 1: Enriquecer `/api/dashboard/stats/route.ts` con la Métrica RAF por Proceso y Vínculo KRI/RAF

En `src/app/api/dashboard/stats/route.ts`:

1. **En la consulta `prisma.riskEvent.findMany` para `allDbRisksForSummary` (alrededor de la línea 123):**
   Asegúrate de incluir en el `select` los campos necesarios para medir la mitigación inherente vs. residual y controles `NF` por proceso:
   ```ts
   prisma.riskEvent.findMany({
     select: {
       id: true,
       processId: true,
       inherentScore: true,
       residualScore: true,
       residualZone: true,
       expectedAnnualLossPEA: true,
       maxAnnualLossPMA: true,
       controls: {
         select: {
           control: {
             select: {
               id: true,
               isFormalized: true,
               hasValidEvidence: true,
               formalizationLevel: true,
             },
           },
         },
       },
       actionPlans: {
         select: {
           id: true,
           isQuickWin: true,
           status: true,
         },
       },
     },
   })
   ```

2. **Vincular cada Indicador del Marco RAF (`rafThresholds`) con su Proceso Bancario Principal:**
   Al construir `rafThresholds` (alrededor de la línea 147), agrega el mapeo de proceso impactado y si corresponde al proceso seleccionado actualmente:
   ```ts
   const metricProcessMapping: Record<string, { processCode: string; processLabel: string }> = {
     IMORA: { processCode: "PR-AGRO-01", processLabel: "Crédito Agro & PyME" },
     CET1: { processCode: "PR-AGRO-01", processLabel: "Solvencia Cartera Comercial" },
     CCL: { processCode: "PR-TES-01", processLabel: "Liquidez & Tesorería" },
     ICAP: { processCode: "PR-CRED-02", processLabel: "Garantías & Consumo Capital" },
     SPEI_AVAIL: { processCode: "PR-TI-01", processLabel: "Continuidad SPEI & TI" },
     PEA_OP: { processCode: "ALL", processLabel: "Transversal (Todos los Procesos)" },
   };
   ```
   Incluye en cada elemento de `rafThresholds`:
   - `associatedProcessCode`: código del proceso vinculado (o `"ALL"` para `PEA_OP`).
   - `associatedProcessLabel`: etiqueta corta del proceso vinculado.

3. **Calcular la Métrica Maestra por Proceso dentro de `processHealthSummary` (alrededor de la línea 297):**
   Calcula el `globalBankPEA = allDbRisksForSummary.reduce((acc, r) => acc + r.expectedAnnualLossPEA, 0)` y para cada proceso `p` en `allProcesses`, calcula y agrega al objeto retornado:
   - **`peaSharePct`**: `globalBankPEA > 0 ? Math.round((pTotalPEA / globalBankPEA) * 100) : 0` (porcentaje que representa este proceso sobre la PEA total del banco).
   - **`avgInherentScore`** y **`avgResidualScore`**: promedio de `inherentScore` y `residualScore` de los riesgos del proceso (con 1 decimal).
   - **`mitigationEffectivenessPct`**:
     ```ts
     const totalInh = pRisks.reduce((s, r) => s + (r.inherentScore || 0), 0);
     const totalRes = pRisks.reduce((s, r) => s + (r.residualScore || 0), 0);
     const mitigationEffectivenessPct =
       totalInh > 0 ? Math.max(0, Math.round(((totalInh - totalRes) / totalInh) * 100)) : 0;
     ```
   - **`nfControlsCount`**: cantidad de riesgos en el proceso que tienen controles No Formalizados (`!c.control?.isFormalized || !c.control?.hasValidEvidence || c.control?.formalizationLevel === "UNVERIFIED_NF"`) o carecen de controles.
   - **`processRafThreshold`** (Umbrales de Apetito RAF asignados al Proceso en MXN):
     Define los umbrales de presupuesto de pérdida esperada (`PEA`) del proceso (para procesos BCP críticos: Apetito `$12,000,000`, Tolerancia `$18,000,000`, Límite `$24,000,000`; para no críticos: Apetito `$10,000,000`, Tolerancia `$15,000,000`, Límite `$20,000,000`):
     ```ts
     const pAppetitePEA = p.isCriticalBCP ? 12_000_000 : 10_000_000;
     const pTolerancePEA = p.isCriticalBCP ? 18_000_000 : 15_000_000;
     const pLimitPEA = p.isCriticalBCP ? 24_000_000 : 20_000_000;
     const pRafZone = calculateRafZone(
       pTotalPEA,
       "HIGHER_IS_WORSE",
       pAppetitePEA,
       pTolerancePEA,
       pLimitPEA
     );
     const appetiteConsumptionPct = Math.round((pTotalPEA / pAppetitePEA) * 100);
     ```
     Incluye en el objeto del proceso:
     ```ts
     processRafThreshold: {
       metricCode: `RAF-${p.code}`,
       metricName: `Presupuesto PEA (${p.code})`,
       currentValue: pTotalPEA,
       appetiteValue: pAppetitePEA,
       toleranceValue: pTolerancePEA,
       regulatoryLimitValue: pLimitPEA,
       currentZone: pRafZone,
       unit: "MXN",
       direction: "HIGHER_IS_WORSE",
       appetiteConsumptionPct,
     }
     ```
   - **`primaryKriMetric`** (Vinculación del Proceso con su Indicador RAF / KRI Clave):
     Vincula el proceso con su métrica RAF correspondiente (buscando en `rafThresholds` o `kris`):
     - Si `p.code === "PR-AGRO-01"` $\rightarrow$ vincula con `IMORA` (ej. `IMORA: 2.35%`, unidad `%`, zona actual de `IMORA`).
     - Si `p.code === "PR-TES-01"` $\rightarrow$ vincula con `CCL` (ej. `CCL: 142.5%`, unidad `%`, zona actual de `CCL`).
     - Si `p.code === "PR-CRED-02"` o `p.code === "PR-GAR-01"` $\rightarrow$ vincula con `ICAP` (ej. `ICAP: 14.2%`, unidad `%`, zona actual de `ICAP`).
     - Si `p.code === "PR-TI-01"` $\rightarrow$ vincula con `SPEI_AVAIL` (ej. `SPEI: 99.82%`, unidad `%`, zona actual de `SPEI_AVAIL`).
     - Para cualquier otro proceso (ej. creados con IA) $\rightarrow$ vincula con su primer KRI en base de datos si existe, o con `"Severidad Residual Media"` (`${avgResidualScore}/25`, zona `dominantZone`).

---

### PASO 2: Visualizar las Nuevas Métricas por Proceso en `src/components/DashboardView.tsx`

En `src/components/DashboardView.tsx`:

1. **En la Sección 1 (`Métricas del Marco de Apetito al Riesgo (RAF — Art. 88 CUB)`):**
   - Debajo del título o en la esquina de cada una de las 6 tarjetas RAF, muestra un **badge de vínculo con el proceso bancario**:
     - Ejemplo: `🔗 Proceso Clave: PR-TES-01 (Liquidez & Tesorería)` o `🔗 Transversal: Todos los Procesos`.
   - Si el usuario tiene seleccionado un proceso en el filtro superior (`selectedProcessId !== "ALL"`) y esa tarjeta RAF corresponde al `activeProcessObj?.code` (o es `PEA_OP`), **resalta la tarjeta con un borde activo** (`border-[#3299A8] ring-2 ring-[#3299A8]/20 bg-[#F9FCFD]`) y un badge `"Métrica Directa del Proceso"`.

2. **En la Sección 3 (`Exposición, Apetito RAF y Gobernanza por Proceso Bancario`):**
   Actualiza el diseño de cada tarjeta de proceso en el grid para que sea un verdadero **Monitor Ejecutivo de Métricas por Proceso**:
   - **Bloque Superior (Identidad y KRI / Indicador RAF Clave del Proceso):**
     - Código del proceso (`PR-AGRO-01`), badge `BCP Crítico` y semáforo RAF del proceso (`p.processRafThreshold?.currentZone || p.dominantZone`).
     - **Píldora Destacada de KRI / RAF Clave del Proceso (`p.primaryKriMetric`):** Muestra el indicador regulatorio rector de ese proceso (ej. `Indicador Rector: IMORA 2.35%`, `Indicador Rector: CCL 142.5%`, `Indicador Rector: SPEI 99.82%`, `Indicador Rector: ICAP 14.20%`) con punto de color semafórico.
   - **Bloque Central (Métrica de Consumo de Apetito RAF del Proceso con `RafProgressBar`):**
     - Muestra el encabezado: **`Consumo Apetito PEA:`** con el porcentaje `p.processRafThreshold?.appetiteConsumptionPct}% del Apetito` y el badge de participación en el banco (`${p.peaSharePct}% de la PEA Total B×+`).
     - Renderiza el componente `<RafProgressBar threshold={p.processRafThreshold} />` dentro de la tarjeta del proceso para que el directivo vea gráficamente dónde se ubica la `PEA` de ese proceso frente a su **Apetito ($12M)**, **Tolerancia ($18M)** y **Límite ($24M)**.
   - **Bloque Inferior (Efectividad de Mitigación Art. 88 CUB, Nodos y Cobertura 3LD):**
     - **Mitigación Art. 88 CUB:** Muestra el desplazamiento promedio `Inh ${p.avgInherentScore} → Res ${p.avgResidualScore}` (`-${p.mitigationEffectivenessPct}% mitigación`) y un indicador de cuántos controles están en alerta `NF` (`${p.nfControlsCount} c/Control NF`).
     - Conserva el conteo de nodos, distribución `R / N / A / V` y barra de cobertura de planes (`Quick-Wins` vs. `Huérfanos`).

---

### PASO 3: Homologar `PEA_OP` en Vivo en `src/app/api/reports/route.ts`

En `src/app/api/reports/route.ts` (líneas 12–45):
- Calcula `const totalPEA = riskEvents.reduce((sum, r) => sum + r.expectedAnnualLossPEA, 0);`.
- Mapea `rafThresholds` antes de devolver `article88RAF` para que cuando `th.metricCode === "PEA_OP"`, actualice `currentValue = totalPEA` y sus umbrales consolidados (`appetiteValue = 65_000_000`, `toleranceValue = 85_000_000`, `regulatoryLimitValue = 105_000_000`, `capacityValue = 125_000_000` si `totalPEA > 50_000_000`), exactamente igual que en `/api/dashboard/stats/route.ts`.

---

## ✅ Criterios de Verificación
1. Ejecutar `npx tsc --noEmit` y confirmar **0 errores de TypeScript**.
2. Verificar que en el **Tablero Ejecutivo (`DashboardView.tsx`)** cada proceso bancario muestre su **Indicador Rector (KRI/RAF)**, su **Barra de Consumo de Apetito RAF (`RafProgressBar`)** con marcas de Apetito/Tolerancia/Límite, su **% de participación en la PEA total de B×+** y su **% de efectividad de mitigación Art. 88 CUB**.
3. Verificar que al seleccionar un proceso en el filtro superior del Dashboard se resalten sus métricas RAF asociadas en la Sección 1.
