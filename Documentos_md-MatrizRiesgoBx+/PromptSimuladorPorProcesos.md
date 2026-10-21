# Prompt Maestro: Rediseño del Simulador de Pruebas de Estrés por Proceso, Nodo del Diagrama y Riesgo (Con Matriz 5×5 Comparativa Actual vs. Estresada y Creación de Planes de Contingencia)
**Proyecto:** Herramienta Inteligente para la Gestión de Riesgos Relevantes y Emergentes — Banco Ve por Más (B×+)
**Directorio de Trabajo:** `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+`
**Documentos de Referencia Obligatoria:**
1. `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/Documentos_md-MatrizRiesgoBx+/DefinicionHerramienta.md`
2. `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/Documentos_md-MatrizRiesgoBx+/ContextoGeneral-MatrizRiesgoBx+.md`

---

## 🎯 Rol e Instrucción General

Actúa como el **Agente de Desarrollo Principal (Full-Stack Next.js + React + Tailwind CSS + Prisma + Motores de Riesgo CNBV)**.
Tu objetivo es evolucionar la pestaña **Simulador (`src/components/CopilotView.tsx`)** y su endpoint de backend **`src/app/api/copilot/stress-test/route.ts`** para que dejen de ser una simulación macroeconómica aislada y se conviertan en un **Simulador de Estrés Integral por Proceso, por Nodo del Diagrama y por Evento de Riesgo**, 100% conectado con la arquitectura de procesos, la Matriz 5×5, el Marco RAF y la creación de Planes de Acción.

---

## 🛠️ Especificación Técnica Detallada

### 1. Rediseño del Motor de Simulación en Backend (`src/app/api/copilot/stress-test/route.ts`)

**Problema actual:**
Hoy `POST /api/copilot/stress-test` solo lee los 4 préstamos de `CreditExposureNifC16`, pero **no consulta los Procesos (`Process`), ni sus Nodos (`ProcessNode`), ni los Riesgos (`RiskEvent`)** de la Matriz Viva.

**Lo que debes implementar en `src/app/api/copilot/stress-test/route.ts`:**
1. **Parámetros de Entrada del Escenario:**
   - `processId`: ID de un proceso específico a estresar o `"ALL"` para estresar todos los procesos del banco.
   - `deltaGdpPct`: Contracción del PIB (ej. `-4.5%`).
   - `tiieRatePct`: Nivel de tasa TIIE (ej. `13.5%`).
   - `deltaFxPct`: Depreciación cambiaria USD/MXN (ej. `+20%`).
   - `climateShockScore`: Severidad de sequía/choque climático CONAGUA (`0.0` a `1.0`).
   - `speiDowntimeHours`: Horas de interrupción/latencia en SPEI y canales digitales (`0` a `24`).
   - `controlDegradationPct`: **Nuevo parámetro de Falla / Degradación de Controles del Proceso** (`0%` = controles operan normal, `50%` = falla parcial o paso a No Formalizado `NF`, `100%` = colapso total de controles preventivos del proceso).

2. **Cálculo de Estrés por Riesgo y por Nodo del Proceso (`stressedRisks`):**
   - Consulta en Prisma los `RiskEvent` filtrados por `processId` (si `processId !== "ALL"`, o todos si es `"ALL"`), incluyendo `process: { include: { macroProcess: true } }`, `processNode: true` y `taxonomy: true`.
   - Para cada riesgo `r`, calcula cómo el escenario de estrés impacta su Probabilidad Residual, su Impacto Residual, su $\text{PEA}$ y su $\text{PMA}$:
     - **Sensibilidad diferenciada por Taxonomía CNBV y Atributos del Riesgo:**
       - Si el riesgo es `CREDIT` o `ESG_CLIMATE` (o pertenece al proceso Agropecuario/Comercial): se estresa fuertemente con `climateShockScore`, `deltaGdpPct` y `tiieRatePct`.
       - Si el riesgo es `MARKET` o `LIQUIDITY`: se estresa con `tiieRatePct` y `deltaFxPct`.
       - Si el riesgo es `TECHNOLOGICAL`, `CYBERSECURITY` o tiene `speiImpact === true`: se estresa fuertemente con `speiDowntimeHours`.
       - Si el riesgo es `OPERATIONAL`, `LEGAL`, `FRAUD_INTERNAL_EXTERNAL` (y para todos los riesgos del proceso): se estresa adicionalmente con `controlDegradationPct` (si los controles fallan, el riesgo residual regresa hacia su riesgo inherente).
     - Calcula para cada riesgo:
       - `baseResidualProb` y `baseResidualImp` $\rightarrow$ `baseResidualScore` y `baseResidualZone` (`GREEN`, `YELLOW`, `ORANGE`, `RED`).
       - `stressedResidualProb` ($1\text{ a }5$) y `stressedResidualImp` ($1\text{ a }5$) $\rightarrow$ `stressedResidualScore` ($1\text{ a }25$) y `stressedResidualZone` (`GREEN`, `YELLOW`, `ORANGE`, `RED`).
       - `basePEA` y `stressedPEA` (incrementada por el multiplicador de estrés y degradación de controles).
       - `basePMA` y `stressedPMA`.
       - `migratedToCritical`: `true` si el riesgo subió de zona RAF (por ejemplo, de Verde/Amarillo a Naranja/Rojo).

3. **Resumen Agregado por Proceso (`processBreakdown`):**
   - Agrupa los resultados por Proceso Bancario mostrando para cada proceso:
     - `processId`, `code`, `name`, `macroProcessName`,
     - Total de riesgos del proceso, cuántos riesgos migraron a **Zona Naranja (Tolerancia RAF)** y cuántos a **Zona Roja (Capacidad RAF)**,
     - `basePEA` vs. `stressedPEA` ($\Delta\text{PEA}$ del proceso),
     - `basePMA` vs. `stressedPMA` ($\Delta\text{PMA}$ del proceso).

4. **Impacto en Solvencia ($\text{ICAP}$), Reservas $\text{NIF C-16}$ ($\Delta\text{PCE}$) y Dictamen de Gemini:**
   - Conserva el cálculo de estrés sobre `CreditExposureNifC16` y suma además el impacto patrimonial de $\Delta\text{PEA}$ / $\Delta\text{PMA}$ de los procesos estresados sobre el **$\text{ICAP}$ Estresado**.
   - Envía a Gemini (`chatWithRiskCopilot`, con *fallback* determinista detallado) el contexto del proceso seleccionado, los nodos y riesgos específicos que migraron a Zona Roja/Naranja y las métricas financieras para generar el dictamen ejecutivo.

---

### 2. Rediseño de la Interfaz del Simulador (`src/components/CopilotView.tsx`)

Transforma `src/components/CopilotView.tsx` para que el usuario entienda de inmediato **qué está simulando, sobre qué proceso y cómo impacta cada paso y cada riesgo**:

1. **Barra Superior de Selección de Alcance + Escenarios Preconfigurados (1-Clic):**
   - **Selector `"1. Seleccionar Proceso Bancario a Estresar"` (`CustomSelect`):**
     - Permite elegir **`"Todos los Procesos (Portafolio Consolidado B×+)"`** o seleccionar **cualquier Proceso Bancario específico** (ej. *"PR-CRED-01: Originación de Crédito Agropecuario"*, *"PR-SPEI-01: Liquidación Interbancaria SPEI"*, etc.).
   - **Botones de Escenarios Preconfigurados (Presets de 1 Clic):**
     - **Escenario A:** *"Sequía Extrema CONAGUA + Alza TIIE (Choque Agropecuario)"*
     - **Escenario B:** *"Ciberataque / Caída SPEI 8 hrs + Falla de Controles (Choque Tecnológico)"*
     - **Escenario C:** *"Recesión Severa (-6% PIB) + Depreciación FX (+30%)"*
     - **Escenario D:** *"Colapso de Controles Internos (Degradación 80% a No Formalizados NF)"*

2. **Panel Izquierdo de Palancas de Estrés (2 Bloques Claros):**
   - **Bloque A — Choques de Entorno (Macro / Clima / TI):**
     - Contracción PIB ($\Delta\text{PIB}$), Tasa TIIE, Depreciación MXN/USD ($\Delta\text{TC}$), Choque Climático ASG (Sequía) e Indisponibilidad SPEI (horas).
   - **Bloque B — Choque de Control Interno del Proceso (Nuevo):**
     - Slider de **"Degradación / Falla de Controles del Proceso (`0%` a `100%`)"**: Explica que al subir este porcentaje se simula qué ocurre si los controles preventivos/detectivos de los nodos del proceso fallan o son calificados como *No Formalizados (`NF`)* en una auditoría CNBV.

3. **Panel Derecho de Resultados en 4 Bloques Visuales (Antes vs. Después del Estrés):**
   - **Bloque 1 — Tarjetas de Impacto Ejecutivo y Marco RAF:**
     - **ICAP Base vs. ICAP Estresado** (con semáforo RAF),
     - **PEA del Proceso: Actual vs. Estresada ($\Delta\text{PEA}$)**,
     - **PMA Catastrófica: Actual vs. Estresada ($\Delta\text{PMA}$)**,
     - **Riesgos en Zona Roja (Capacidad RAF): Antes vs. Después**.
   - **Bloque 2 — Comparativa Lado a Lado de la Matriz 5×5 del Proceso (`Matriz Residual Actual` vs. `Matriz Residual Estresada`):**
     - Dibuja dos matrices $5\times 5$ compactas lado a lado para el proceso seleccionado:
       - A la izquierda: **Matriz 5×5 Actual (Pre-Estrés)** con los códigos de los riesgos (`RSK-001`) en sus cuadrantes actuales.
       - A la derecha: **Matriz 5×5 Estresada (Post-Choque)** mostrando cómo esos mismos riesgos (`RSK-001`) se desplazaron hacia los cuadrantes Naranja y Rojo.
   - **Bloque 3 — Tabla de Trazabilidad por Proceso, Nodo del Diagrama y Riesgo (`Actual` $\rightarrow$ `Estresado`):**
     - Muestra cada riesgo evaluado con:
       - **Código y Título del Riesgo**,
       - **Proceso y Nodo del Diagrama donde ocurre** (`r.process?.code` y `r.processNode?.label`),
       - **Migración en Matriz 5×5:** `Actual: P×I (Score, Zona)` $\rightarrow$ `Estresado: P_stress×I_stress (Score_stress, Zona_stress)`, resaltando con insignia de alerta los riesgos que rompieron el límite de Tolerancia/Capacidad del Marco RAF,
       - **Incremento Monetario:** `PEA Actual → PEA Estresada` y `PMA Actual → PMA Estresada`,
       - **Botón de Acción Directa (`"+ Crear Plan Contingencia"`):** En cualquier riesgo estresado en Zona Naranja o Roja, un botón que cree con 1 clic en `/api/action-plans` un **Plan de Mitigación / Quick-Win de Contingencia** para ese riesgo y muestre confirmación con sello `SHA-256`.
   - **Bloque 4 — Dictamen Ejecutivo del Copiloto IA Gemini para el CAIR:**
     - El análisis narrativo estructurado para el Comité de Riesgos.

---

## ✅ Criterios de Aceptación y Verificación Final

1. Ejecuta `npx tsc --noEmit` y verifica que existan **0 errores de TypeScript**.
2. Comprueba que al entrar a la pestaña **Simulador**, se ejecute automáticamente una simulación inicial (o al elegir un escenario preconfigurado con 1 clic) para que el usuario vea de inmediato las matrices comparativas `Actual vs. Estresada` y la tabla de riesgos por Proceso y Nodo sin pantallas vacías.
3. Verifica que `http://localhost:3000` responda `HTTP 200 OK`, realiza `git commit` y `git push` a `https://github.com/RicardoAguirreStart/demo-matriz-riesgo-bxplus`.
