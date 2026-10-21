# Prompt Maestro: Alineación Integral por Procesos (Matriz 5×5 por Proceso, Mosaico de Procesos, Matriz Viva y Planes) + Incorporación del Marco RAF en el Marco Teórico
**Proyecto:** Herramienta Inteligente para la Gestión de Riesgos Relevantes y Emergentes — Banco Ve por Más (B×+)
**Directorio de Trabajo:** `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+`
**Documentos de Referencia Obligatoria:**
1. `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/Documentos_md-MatrizRiesgoBx+/ContextoGeneral-MatrizRiesgoBx+.md`
2. `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/Documentos_md-MatrizRiesgoBx+/DefinicionHerramienta.md`

---

## 🎯 Rol e Instrucción General

Actúa como el **Agente de Desarrollo Principal (Full-Stack Next.js + React + Tailwind CSS + Prisma)**.
Tu objetivo es implementar dos mejoras estructurales de alto impacto en la plataforma de Banco B×+, respetando al 100% el *Taste Index B×+* (`Arvo` Bold 700, `Inter`, paleta `#1F242B`, `#C0D725`, `#3299A8`, `#F5F7F9`) y sin romper ninguna funcionalidad existente:

1. **Alineación Integral por Procesos Bancarios (`HeatmapView.tsx`, `RiskAdminView.tsx`, `ActionPlansView.tsx` y `/api/risks/route.ts`):** Hacer que el **Proceso Bancario (y sus Nodos del Diagrama de Flujo)** sea el eje rector de toda la evaluación, permitiendo analizar una **Matriz 5×5 individual por cada proceso**, ver un **Mosaico Comparativo de Matrices 5×5 de todos los procesos** y agrupar tanto la **Matriz Viva** como los **Planes de Acción** por Proceso y Nodo del diagrama.
2. **Incorporación Exhaustiva del Marco RAF (Risk Appetite Framework — Art. 67, 68 y 88 CUB) dentro del Módulo "Marco Teórico" (`MethodologyView.tsx`):** Agregar una sub-sección dedicada e interactiva que explique a fondo qué es el Marco RAF, sus 4 escalones jerárquicos (Apetito, Alerta Temprana, Tolerancia y Capacidad), sus protocolos de escalamiento y la tabla maestra de umbrales prudenciales de Banco B×+.

---

## 🛠️ Parte 1: Alineación Integral por Procesos Bancarios

### 1.1 Evolución de la Matriz 5×5 (`src/components/HeatmapView.tsx` y `src/app/api/risks/route.ts`)

**Problema actual:**
Hoy `HeatmapView.tsx` solo muestra una única Matriz 5×5 consolidada con todos los riesgos revueltos bajo un contador genérico (`"4 riesgos"`), sin permitir ver la Matriz 5×5 propia de cada proceso ni identificar en qué paso/nodo del flujo se encuentra cada riesgo dentro de la matriz.

**Lo que debes implementar:**
1. **Soporte de filtro `processId` en `GET /api/risks` (`src/app/api/risks/route.ts`):**
   - Asegúrate de que `GET /api/risks` acepte el parámetro opcional `processId` (`if (processId && processId !== "ALL") where.processId = processId`) y que siempre incluya `process: { include: { macroProcess: true } }` y `processNode: true`.
2. **Selector de Proceso y 3 Modos de Visualización en `src/components/HeatmapView.tsx`:**
   - Al montar `HeatmapView.tsx`, consulta `/api/processes` para cargar todos los procesos bancarios registrados (incluyendo cualquier proceso nuevo creado con IA en el Diagramador).
   - Agrega en la barra superior de `HeatmapView.tsx`:
     - **Selector de Nivel de Análisis:**
       1. **`"Matriz 5×5 por Proceso Individual"` (Modo por defecto):** Selecciona por defecto el primer proceso del banco y permite cambiar entre cualquiera de los procesos mediante `CustomSelect`.
       2. **`"Mosaico Comparativo (Todas las Matrices por Proceso)"`:** Renderiza en una cuadrícula (`grid-cols-1 xl:grid-cols-2 gap-6`) una **Matriz 5×5 dedicada para cada uno de los procesos del banco** lado a lado, mostrando el nombre del proceso, su Macroproceso, su exposición acumulada ($\text{PEA}$ y $\text{PMA}$) y la ubicación exacta de sus riesgos en su propia cuadrícula $5\times 5$.
       3. **`"Matriz Consolidada Institucional (Vista CAIR)"`:** La vista agregada de todo el banco.
3. **Desglose Visual de Riesgos y Nodos dentro de cada Celda $(P \times I)$ (cuando se visualiza por Proceso):**
   - En el modo **`"Matriz 5×5 por Proceso Individual"`**:
     - En cada celda $(P, I)$ que tenga riesgos de ese proceso, **además del puntaje**, muestra directamente las **píldoras/chips individuales con el código del riesgo (`RSK-BX-001`) y el nombre abreviado del Nodo del Diagrama** donde se ubica (ej. `RSK-001 • Nodo: Avalúo FEGA`).
     - En el panel derecho o inferior de la Matriz 5×5 del proceso, muestra el **"Mapa de Trazabilidad del Proceso: Nodos del Flujo vs. Posición en Matriz 5×5"**, listando en orden secuencial los pasos (`ProcessNode`) de ese proceso y mostrando para cada paso:
       - Qué riesgos tiene anclados,
       - Su coordenada **Inherente $(P_{\text{inh}} \times I_{\text{inh}})$ $\rightarrow$ Residual $(P_{\text{res}} \times I_{\text{res}})$** (demostrando visualmente cuántos cuadrantes bajó el riesgo gracias a los controles del nodo),
       - Su $\text{PEA}$ y $\text{PMA}$ en $\text{MXN}$.

---

### 1.2 Agrupación y Filtro por Proceso y Nodo en `Matriz Viva` (`src/components/RiskAdminView.tsx`)

**Lo que debes implementar en `src/components/RiskAdminView.tsx`:**
1. **Filtro por Proceso Bancario (`CustomSelect`):**
   - Agrega en la barra de filtros un selector **"Filtrar por Proceso Bancario"** (`Todos los Procesos` o cada uno de los procesos cargados desde `/api/processes`).
2. **Interruptor de Vista: `"Vista Agrupada por Proceso Bancario"` (Por defecto) vs. `"Vista Tabular Plana"`:**
   - En el modo **"Agrupada por Proceso Bancario"**, organiza los riesgos en **bloques/secciones por cada Proceso del banco**:
     - Cabecera del bloque del Proceso: Código y Nombre del Proceso, Macroproceso, Unidad de Negocio, total de riesgos en el proceso, suma de $\text{PEA}$ y suma de $\text{PMA}$ del proceso.
     - Dentro de cada Proceso, muestra en cada fila de riesgo explícitamente la columna **"Nodo / Paso del Diagrama"** (`r.processNode?.label || "Nivel Proceso General"` y el tipo de figura `TASK_STEP`, `DECISION_GATEWAY`, `CONTROL_POINT`, etc.), de modo que haya trazabilidad total entre el Diagramador y la Matriz Viva.

---

### 1.3 Agrupación y Filtro por Proceso en `Planes & Quick-Wins` (`src/components/ActionPlansView.tsx`)

**Lo que debes implementar en `src/components/ActionPlansView.tsx`:**
1. Agrega un selector **"Filtrar Planes por Proceso Bancario"** en la barra superior.
2. En cada tarjeta de **Quick-Win** y en la tabla del **Inventario de Planes de Acción**, muestra explícitamente la etiqueta del **Proceso Bancario** (`plan.riskEvent?.process?.name`) y el **Nodo del Flujo** al que pertenece el riesgo mitigado, permitiendo agrupar los planes por proceso.

---

## 🛠️ Parte 2: Incorporación del Marco RAF (Risk Appetite Framework) en el Módulo "Marco Teórico" (`src/components/MethodologyView.tsx`)

**Lo que debes implementar en `src/components/MethodologyView.tsx`:**
1. Agrega una nueva pestaña/sub-sección principal en la barra de navegación interna de `MethodologyView.tsx` (colócala como la **Sub-Sección 2** o **Sub-Sección destacada**):
   - **`"Marco RAF (Apetito al Riesgo CNBV)"`** (`activeSubTab === "RAF_FRAMEWORK"`).
2. **Contenido estructurado y visual de la Sub-Sección `"Marco RAF"`:**
   - **A. Definición Institucional y Fundamento Regulatorio (CUB Art. 67, 68 y 88 / Basilea III / FSB):**
     - Explica qué es el **Marco de Apetito al Riesgo (RAF)**: el sistema de gobernanza aprobado por el Consejo de Administración de Banco B×+ que establece cuánto riesgo acepta asumir el banco en la búsqueda de rentabilidad, cuánto tolera como desviación temporal y cuál es su límite máximo de solvencia y liquidez.
   - **B. Diagrama Visual de los 4 Escalones Jerárquicos del Marco RAF (El "Velocímetro Prudencial"):**
     - Diseña 4 tarjetas conectadas progresivamente de menor a mayor severidad:
       1. **🟢 Nivel 1 — Apetito al Riesgo (Zona Verde | Score 5×5: 1–5):** Nivel de riesgo deseado y aceptado en la operación ordinaria de las líneas de negocio. *Protocolo:* Monitoreo ordinario trimestral.
       2. **🟡 Nivel 2 — Umbral de Alerta Temprana / Atención Preventiva (Zona Amarilla | Score 5×5: 6–11):** Señal preventiva (*Early Warning*) de que un indicador se aproxima al límite de tolerancia. *Protocolo:* Notificación automática a la UAIR (2ª Línea) y al Dueño del Proceso (1ª Línea) para ajuste preventivo de controles.
       3. **🟠 Nivel 3 — Tolerancia al Riesgo (Zona Naranja | Score 5×5: 12–15):** Desviación máxima aceptable de forma temporal bajo condiciones adversas sin detener la operación, pero que exige remediación inmediata. *Protocolo:* **Plan de Acción de Mitigación obligatorio firmado por el Titular de Negocio en un plazo máximo de 5 días hábiles**.
       4. **🔴 Nivel 4 — Capacidad de Riesgo / Límite Prudencial Regulatorio (Zona Roja | Score 5×5: 16–25):** Techo absoluto que el banco puede soportar con su Capital Neto y Liquidez antes de transgredir mínimos de CNBV o Banxico. *Protocolo:* **Escalamiento inmediato al Comité de Riesgos (CAIR), Director General y Consejo de Administración; activación de plan de contingencia y freno de exposición**.
   - **C. Tabla Maestra en Vivo de Umbrales del Marco RAF de Banco B×+:**
     - Muestra la tabla comparativa con los umbrales reales parametrizados en la herramienta para cada dimensión regulatoria:
       - **Solvencia ($\text{ICAP}$ Basilea III):** Verde $\ge 13.5\%$ | Amarillo $12.0\%\text{–}13.4\%$ | Naranja $10.8\%\text{–}11.9\%$ | Rojo $< 10.5\%$ (Mínimo CNBV).
       - **Capital Fundamental ($\text{CET1}$):** Verde $\ge 10.5\%$ | Amarillo $8.5\%\text{–}10.4\%$ | Naranja $7.1\%\text{–}8.4\%$ | Rojo $< 7.0\%$.
       - **Liquidez a 30 Días ($\text{CCL}$ Banxico):** Verde $\ge 120\%$ | Amarillo $110\%\text{–}119\%$ | Naranja $100\%\text{–}109\%$ | Rojo $< 100\%$.
       - **Riesgo de Mercado ($\text{VaR } 99\%$ 1 día):** Verde $\le \$15\text{M}$ | Amarillo $\$15.1\text{M–}\$22\text{M}$ | Naranja $\$22.1\text{M–}\$30\text{M}$ | Rojo $> \$30\text{M}$.
       - **Disponibilidad Canal SPEI (Circular 8/2019):** Verde $\ge 99.90\%$ | Amarillo $99.50\%\text{–}99.89\%$ | Naranja $99.00\%\text{–}99.49\%$ | Rojo $< 99.00\%$.
       - **Matriz de Riesgos de Procesos ($5\times 5$):** Verde $1\text{–}5\text{ pts}$ | Amarillo $6\text{–}11\text{ pts}$ | Naranja $12\text{–}15\text{ pts}$ | Rojo $16\text{–}25\text{ pts}$.
   - **D. Conexión Interactiva con el Resto de la Herramienta:**
     - Explica cómo el Marco RAF conecta automáticamente el **Dashboard C-Level**, el **Widget Flotante de Alertas**, la **Matriz 5×5 por Proceso** y la exigencia de firma en **Planes & Quick-Wins**, con botones para navegar a cada uno.

---

## ✅ Criterios de Aceptación y Verificación Final

1. Ejecuta `npx tsc --noEmit` y comprueba que existan **0 errores de TypeScript**.
2. Verifica que en la pestaña **Matriz 5x5 (`HeatmapView.tsx`)** el usuario pueda:
   - Seleccionar cualquier proceso individual del banco y ver su Matriz 5×5 dedicada con los códigos de riesgo y nodos dentro de las celdas.
   - Cambiar a la vista de **Mosaico de Procesos** para ver las matrices 5×5 de todos los procesos lado a lado.
   - Cambiar a la vista **Consolidada Institucional**.
3. Verifica que en **Marco Teórico (`MethodologyView.tsx`)** esté disponible la nueva sub-sección interactiva del **Marco RAF**.
4. Comprueba que `http://localhost:3000` responda `HTTP 200 OK`, realiza `git commit` y `git push` a `https://github.com/RicardoAguirreStart/demo-matriz-riesgo-bxplus`.
