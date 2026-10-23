# Prompt de Desarrollo: Nueva Sección "Matriz Riesgos Emergentes" (Cubo Tridimensional $5 \times 5 \times 5$), Motor en Python y Capítulo en Marco Metodológico

**Rol del Agente:** Arquitecto Full-Stack Senior (Next.js 16, TypeScript, Tailwind CSS, Prisma, Python 3) y Especialista en Gestión de Riesgos Emergentes y Sistémicos (CNBV CUB Art. 88, Basilea III, WEF Global Risks).  
**Documento Base de Especificación:** `Documentos_md-MatrizRiesgoBx+/Definicion-MatrizCubicaRiesgosEmergentes.md`

---

## 🎯 Objetivo General

Implementar de extremo a extremo la nueva sección **"Matriz Riesgos Emergentes"** basada en el **Modelo de Matriz Tridimensional (Cubo de Riesgo $5 \times 5 \times 5$)** que opera en paralelo con la Matriz $5\times 5$ tradicional dentro de la misma arquitectura centrada en procesos (`Macroproceso → Proceso → Nodo del Diagrama → Riesgo → Controles Art. 88 → Planes 3LD`), junto con su **Motor Cuantitativo en Python (`scripts/emerging_risk_cube_engine.py`)** y su **Capítulo Teórico en `MethodologyView.tsx`**.

---

## 🛠️ Instrucciones de Implementación por Componente

### 1. Motor Especializado en Python (`scripts/emerging_risk_cube_engine.py`) + Módulo Espejo TypeScript (`src/lib/engines/emerging-risk-cube-engine.ts`)

1. **Crear el motor en Python `scripts/emerging_risk_cube_engine.py`:**
   - Debe recibir un payload JSON por `stdin` (o argumento CLI `--input`) con la lista de riesgos emergentes, sus coordenadas inherentes $(X_{\text{inh}}, Y_{\text{inh}}, Z_{\text{inh}} \in \{1..5\})$, controles asociados (con `isFormalized`, `hasValidEvidence`, `automation`, `executionTiming`, `nature`, `rawEffectiveness`) y coordenadas 2D tradicionales (`inherentProbability`, `inherentImpact`, `residualProbability`, `residualImpact`, `residualScore`, `residualZone`).
   - **Definición de los 3 Ejes del Cubo ($1$ a $5$):**
     - **Eje $X$ (`systemicImpactX`): Impacto Sistémico / Potencial de Contagio** ($1=$ Aislado/Local, $2=$ Acotado a Proceso, $3=$ Contagio Inter-Procesos, $4=$ Transversal Institucional B×+, $5=$ Sistémico / Crítico BCP).
     - **Eje $Y$ (`uncertaintyY`): Incertidumbre Epistémica** ($1=$ Conocido/Predecible, $2=$ Incertidumbre Baja, $3=$ Incertidumbre Moderada, $4=$ Alta Ambigüedad, $5=$ Cisne Negro / Ignorancia Radical).
     - **Eje $Z$ (`materializationSpeedZ`): Velocidad de Materialización / *Time-to-Impact*** ($1=$ Muy Lenta $>6\text{m}$, $2=$ Gradual $1\text{–}6\text{m}$, $3=$ Rápida $1\text{–}4\text{ sem}$, $4=$ Aguda $4\text{–}72\text{h}$, $5=$ Instantánea/Algorítmica $<4\text{h}$).
   - **Cálculos Matemáticos en Python:**
     - **Volumen Cúbico Inherente ($V_{\text{inh}} \in [1, 125]$):**
       $$V_{\text{inh}} = X_{\text{inh}} \times Y_{\text{inh}} \times Z_{\text{inh}}$$
     - **Mitigación Vectorial Diferenciada por Eje ($\Delta X, \Delta Y, \Delta Z$) con Regla CNBV Art. 88:**
       - Si un control es **No Formalizado (`NF`: `!isFormalized || !hasValidEvidence`)**, su efectividad se topa a un máximo del **$20\%$** (`0.20`) conforme al Art. 88 de la CUB.
       - **Reducción del Eje $X$ (Contagio):** Controles de aislamiento, redundancia o planes BCP reducen $X$ hasta en un $45\%$ (`X_res = max(1.0, round(X_inh * (1 - factor_X), 2))`).
       - **Reducción del Eje $Y$ (Incertidumbre):** Sensores KRI, monitoreo continuo o modelos predictivos reducen $Y$ hasta en un $40\%$ (`Y_res = max(1.0, round(Y_inh * (1 - factor_Y), 2))`).
       - **Reducción del Eje $Z$ (Velocidad):** **Regla crítica de velocidad:** Si $Z_{\text{inh}} \ge 4$, **únicamente** los controles con `automation === "AUTOMATED"` y `executionTiming === "ONLINE_REALTIME"` pueden reducir significativamente el eje $Z$ (hasta $45\%$); los controles manuales o mensuales tienen efectividad máxima de $10\%$ sobre el eje $Z$.
     - **Volumen Cúbico Residual ($V_{\text{res}} \in [1.0, 125.0]$):**
       $$V_{\text{res}} = \text{round}(X_{\text{res}} \times Y_{\text{res}} \times Z_{\text{res}}, 2)$$
     - **Tensor de Tensión Tridimensional ($T_{\text{3D}} \in [1.0, 100.0]$) y Score Homologado 25 ($S_{\text{eq25}} \in [1.0, 25.0]$):**
       $$\gamma = 1.15 \text{ si } (X_{\text{res}} \ge 4 \text{ y } Z_{\text{res}} \ge 4) \text{ sino } 1.0$$
       $$T_{\text{3D}} = \min\left(100.0,\; \text{round}\left(\left(0.45 \cdot \frac{V_{\text{res}}}{125.0} + 0.55 \cdot \frac{0.40 X_{\text{res}}^2 + 0.25 Y_{\text{res}}^2 + 0.35 Z_{\text{res}}^2}{25.0}\right) \times 100.0 \times \gamma,\; 1\right)\right)$$
       $$S_{\text{eq25}} = \text{round}\left(\frac{T_{\text{3D}}}{4.0},\; 1\right)$$
     - **Zonificación del Cubo 3D (`cubeZoneResidual` y `cubeZoneInherent`):**
       - `"RED"` (Crítico Sistémico): $V \ge 64$ o $(X \ge 4 \text{ y } Z \ge 4)$ o $T_{\text{3D}} \ge 68$.
       - `"ORANGE"` (Alerta Temprana): $36 \le V < 64$ o $X = 5$ o $Z = 5$ o $T_{\text{3D}} \ge 45$.
       - `"YELLOW"` (Vigilancia / Incubación): $15 \le V < 36$ o $T_{\text{3D}} \ge 22$.
       - `"GREEN"` (Latente / Controlado): $V < 15$ y $T_{\text{3D}} < 22$.
     - **Diagnóstico de Gestión Paralela ("Punto Ciego 2D vs. 3D" — `isBlindSpot2Dto3D`):**
       - `true` cuando en la Matriz $5\times 5$ tradicional el riesgo está en zona `"GREEN"` o `"YELLOW"` (por baja probabilidad histórica), pero en el Cubo 3D está en `"ORANGE"` o `"RED"` (por alta incertidumbre $Y$ y velocidad $Z$).

2. **Crear `src/lib/engines/emerging-risk-cube-engine.ts`:**
   - Implementa el puente que ejecuta `python3 scripts/emerging_risk_cube_engine.py` mediante `child_process.execFileSync` / `spawnSync` (midiendo el tiempo de ejecución `executionTimeMs` y versión de Python), e incluye la misma función matemática determinista en TypeScript como respaldo instantáneo si el entorno serverless no tuviera binario de Python disponible.
   - Define el catálogo oficial de las **8 Categorías de Riesgos Emergentes**:
     1. `TECH_CONCENTRATION`: **Concentración Tecnológica y Nube**
     2. `CYBER_ADVANCED`: **Ciberataques Avanzados e IA Maliciosa**
     3. `DIGITAL_FRAUD`: **Fraude Sofisticado e Identidad Sintética**
     4. `SYSTEMIC_CONTAGION`: **Contagio Sistémico e Inter-Procesos**
     5. `THIRD_PARTY_EXTENDED`: **Riesgos de Terceros y Cuartas Partes**
     6. `CLIMATE_FINANCIAL`: **Riesgo Climático-Financiero (ESG)**
     7. `DIGITAL_LIQUIDITY`: **Liquidez Digital y Corridas Instantáneas**
     8. `MODEL_DATA_AI`: **Modelos, Algoritmos y Gobernanza de Datos / IA**

---

### 2. Endpoint Backend: `src/app/api/emerging-risks/route.ts` (GET, POST, PATCH)

1. **`GET /api/emerging-risks`:**
   - Soporta filtros `?processId=ALL|...` y `?category=ALL|...`.
   - **Auto-hidratación determinista de las 8 Categorías Emergentes:** Garantiza que los riesgos de la base de datos vinculados a los procesos bancarios (`PR-AGRO-01`, `PR-TES-01`, `PR-CRED-02`, `PR-TI-01` y procesos adicionales) cubran las **8 categorías de riesgos emergentes** (si alguna de las 8 categorías aún no tiene un evento representativo en `RiskEvent` con `isEmergingRisk: true`, lo auto-crea o enriquece de forma determinista con coordenadas 3D realistas vinculadas a su proceso y nodo del diagrama).
   - Procesa todos los riesgos a través del **Motor Python 3D** (`emerging_risk_cube_engine.py`) y devuelve:
     - `engineTelemetry`: `{ engine: "Python 3D Cube Engine", pythonVersion, executionTimeMs, totalVoxels: 125 }`.
     - `kpis`:
       - `totalEmergingRisks`: conteo total.
       - `criticalRed3DCount`: riesgos en Zona Roja del Cubo 3D.
       - `highSpeedCount`: riesgos con velocidad de materialización $Z \ge 4$ (minutos/horas).
       - `blindSpots2Dto3DCount`: riesgos que en 2D parecían Verdes/Amarillos pero en el Cubo 3D son Naranjas/Rojos.
       - `avgSystemicX`, `avgUncertaintyY`, `avgSpeedZ`, `totalEmergingPEA`, `totalEmergingPMA`.
     - `categorySummary`: conteo y volumen medio por cada una de las 8 categorías emergentes.
     - `emergingRisks`: lista completa enriquecida con:
       - Datos del Proceso (`process.code`, `process.name`) y Nodo del Diagrama (`processNode.label`, `processNode.nodeType`).
       - Categoría Emergente (`emergingCategoryCode`, `emergingCategoryLabel`).
       - Coordenadas 3D Inherentes $(X_{\text{inh}}, Y_{\text{inh}}, Z_{\text{inh}})$ y Residuales $(X_{\text{res}}, Y_{\text{res}}, Z_{\text{res}})$.
       - Métricas 3D (`volumeInherent`, `volumeResidual`, `tensorScore3D`, `equivalentScore25`, `cubeZoneInherent`, `cubeZoneResidual`).
       - Vectores de mitigación por eje (`mitigationDeltaX`, `mitigationDeltaY`, `mitigationDeltaZ`, `hasRealtimeControl`, `hasNFControlPenalty`).
       - Comparativa Paralela con la Matriz $5\times 5$ Tradicional (`matrix2D`: `inherentProb`, `inherentImpact`, `residualProb`, `residualImpact`, `residualScore`, `residualZone`, `isBlindSpot2Dto3D`).
       - Controles y Planes de Acción 3LD vinculados.

2. **`POST /api/emerging-risks` y `PATCH /api/emerging-risks`:**
   - Permite:
     - **Recalcular / Simular en vivo con el Motor Python (`action: "SIMULATE_OR_UPDATE_CUBE"`):** Ajustar las coordenadas $(X, Y, Z)$ o simular la incorporación de controles específicos por eje (*Aislamiento BCP en Eje X*, *Sensores KRI en Eje Y*, *Kill-Switch Automático en Eje Z*), persistiendo la evaluación y registrando el bloque SHA-256 en `AuditLog` (`EMERGING_CUBE_EVALUATION`).
     - **Registrar un nuevo Riesgo Emergente 3D (`action: "CREATE_EMERGING_RISK"`):** Vinculado a Proceso, Nodo, Categoría Emergente (1 de las 8) y ejes $(X, Y, Z)$, sincronizándolo automáticamente en paralelo con la Matriz $5\times 5$.

---

### 3. Interfaz Visual: `src/components/EmergingRisksCubeView.tsx`

Construye una interfaz ejecutiva de alto impacto siguiendo el *Taste Index B×+* (`#1F242B`, `#C0D725`, `#3299A8`):

1. **Encabezado Ejecutivo y Barra de Filtros:**
   - Título: **"Matriz Cúbica de Riesgos Emergentes ($5 \times 5 \times 5$) & Gestión Paralela"**.
   - Badge en vivo de Telemetría Técnica: **`🐍 Motor Python 3D Activo • 125 Vóxeles (X·Y·Z)`** con tiempo de ejecución en ms.
   - Selector `CustomSelect` para filtrar por **Proceso Bancario** y filtro rápido por las **8 Categorías de Riesgos Emergentes**.
   - Switch de Vista del Cubo:
     - `Cubo Residual (Con Controles Art. 88)`
     - `Cubo Inherente (Sin Controles)`
     - `Gestión Paralela: Matriz 2D (P×I) vs. Cubo 3D (X·Y·Z)`
   - Botón **`+ Nuevo Riesgo Emergente 3D`**.

2. **Fila de 4 KPIs Tridimensionales:**
   - **Vórtice Crítico 3D (Zona Roja):** Conteo de riesgos en zona roja tridimensional y su `PMA` sistémica.
   - **Amenazas Hiper-Veloces ($Z \ge 4$):** Riesgos con materialización en minutos/horas y cuántos cuentan con control `ONLINE_REALTIME`.
   - **Puntos Ciegos Detectados (2D $\rightarrow$ 3D):** Riesgos subestimados por la matriz tradicional $5\times 5$ que el Cubo 3D revela como críticos.
   - **Vector Medio del Cubo ($\bar{X}, \bar{Y}, \bar{Z}$):** Promedio institucional de Contagio ($X$), Incertidumbre ($Y$) y Velocidad ($Z$).

3. **Lienzo Central en 2 Columnas: Visor Interactivo del Cubo 3D ($5 \times 5 \times 5$) + Inspector & Simulador Python:**
   - **Columna Izquierda (7 cols) — Visualizador Tridimensional del Cubo $5 \times 5 \times 5$ y Proyecciones Ortogonales:**
     - **A. Cubo Isométrico Interactivo 3D (SVG/Canvas de Alta Precisión con Rotación y Capas $Z$):**
       - Dibuja el cubo $5 \times 5 \times 5$ con sus 3 ejes claramente etiquetados:
         - **Eje $X$: Impacto Sistémico / Contagio (1–5)**
         - **Eje $Y$: Incertidumbre (1–5)**
         - **Eje $Z$: Velocidad de Materialización (1–5)**
       - Incluye botones para **filtrar/rebanar por Capa de Velocidad ($Z = \text{Todas}, Z=5 \text{ Instantánea}, Z=4, Z=3, Z=2, Z=1$)** y rotar el ángulo de vista isométrica.
       - Grafica cada riesgo emergente como un nodo tridimensional con su código (`RSK-XXX`), color de zona (`RED`, `ORANGE`, `YELLOW`, `GREEN`), pulso si $Z=5$, y **vector punteado 3D** desde su posición Inherente $(X_{\text{inh}}, Y_{\text{inh}}, Z_{\text{inh}})$ hasta su posición Residual $(X_{\text{res}}, Y_{\text{res}}, Z_{\text{res}})$.
     - **B. Las 3 Caras / Proyecciones Ortogonales ($5\times 5$ cada una) debajo del Cubo:**
       - **Cara 1 — Plano $X \times Z$ (Contagio vs. Velocidad):** *"Riesgos de Choque Relámpago"*.
       - **Cara 2 — Plano $X \times Y$ (Contagio vs. Incertidumbre):** *"Cisnes Negros Sistémicos"*.
       - **Cara 3 — Plano $Y \times Z$ (Incertidumbre vs. Velocidad):** *"Sorpresas Operativas"*.
     - **C. Cuando se activa el modo `"Gestión Paralela: Matriz 2D vs. Cubo 3D"`:**
       - Muestra lado a lado la ubicación de los riesgos en la **Matriz $5\times 5$ Tradicional ($P \times I$)** frente al **Cubo $5\times 5\times 5$ ($X \times Y \times Z$)**, destacando con flechas y badges los **"Puntos Ciegos"** revelados por el modelo tridimensional.

   - **Columna Derecha (5 cols) — Inspector 3D del Riesgo Seleccionado & Simulador Python en Vivo:**
     - Muestra el detalle del riesgo seleccionado: Código, Título, **Categoría Emergente (1 de 8)**, **Proceso Bancario y Nodo del Diagrama**.
     - **Comparativa Paralela:** Score 2D ($P \times I = /25$) vs. Volumen Cúbico 3D ($X \times Y \times Z = /125$ y Tensor $T_{3D}/100$).
     - **Sliders Interactivos de Simulación Tridimensional (Conectados al Motor Python):**
       - Permite ajustar $X$ (Contagio), $Y$ (Incertidumbre), $Z$ (Velocidad) y simular los 3 tipos de defensas vectoriales:
         1. *Defensa Eje $X$ (Aislamiento / Redundancia BCP)*
         2. *Defensa Eje $Y$ (Sensores KRI / Threat Intelligence)*
         3. *Defensa Eje $Z$ (Automatización Kill-Switch en Tiempo Real)*
       - Botón **`🐍 Recalcular y Guardar con Motor Python 3D`** y botón **`+ Crear Plan Quick-Win 3LD`** (que registra un plan en `/api/action-plans` para desacelerar o contener el riesgo emergente).

4. **Tabla Inferior de Trazabilidad de las 8 Categorías de Riesgos Emergentes:**
   - Muestra todos los riesgos emergentes con columnas: `Código & Evento`, `Categoría Emergente (8 Familias)`, `Proceso & Nodo del Diagrama`, `Ejes Inherentes (X·Y·Z)`, `Mitigación Vectorial (ΔX, ΔY, ΔZ & Art. 88)`, `Ejes Residuales & Volumen (/125)`, `Espejo Matriz 2D (P×I) & Punto Ciego` y `Acciones`.

---

### 4. Incorporación de la Teoría en `src/components/MethodologyView.tsx`

En `src/components/MethodologyView.tsx`:
1. Agrega una nueva sub-pestaña en la barra de navegación del Marco Teórico (junto a `RAF_FRAMEWORK`):
   - ID: `"EMERGING_CUBE"`
   - Etiqueta: **`Cubo 3D Riesgos Emergentes`**
2. Dentro de esta sub-pestaña (`activeSubTab === "EMERGING_CUBE"`), diseña una sección pedagógica e interactiva completa que explique:
   - **Por qué una Matriz Cúbica ($5\times 5\times 5$) en paralelo a la Matriz $5\times 5$ CNBV:** Explicación del sesgo frecuentista y la necesidad de medir Incertidumbre ($Y$) y Velocidad ($Z$).
   - **Los Tres Ejes del Cubo ($X, Y, Z$) y sus Escalas $1\text{ a }5$:** Tarjetas detalladas y tablas normativas de **Eje $X$ (Impacto Sistémico / Contagio)**, **Eje $Y$ (Incertidumbre Epistémica)** y **Eje $Z$ (Velocidad de Materialización / *Time-to-Impact*)**.
   - **Las 8 Categorías de Amenazas Emergentes en B×+:** Grid explicativo de *Concentración Tecnológica, Ciberataques, Fraude, Contagio, Terceros, Climático-Financiero, Liquidez Digital y Modelos/Datos*.
   - **Fórmulas del Motor en Python y Regla de Mitigación Vectorial:** Explicación de $V = X \cdot Y \cdot Z$, el Tensor de Tensión $T_{3D}$, la regla de que *los riesgos de velocidad instantánea ($Z=5$) solo pueden frenarse con controles automatizados en línea (`ONLINE_REALTIME`)*, el tope Art. 88 CUB para controles `NF` y la convivencia paralela con la Matriz $5\times 5$.
   - Botón directo **`Ir a Matriz Cúbica 3D en Vivo →`** que navega a la nueva pestaña (`onNavigateTab("emerging-cube")`).

---

### 5. Integración en la Navegación Principal (`src/components/Header.tsx` y `src/app/page.tsx`)

1. En `src/components/Header.tsx`:
   - Agrega `{ id: "emerging-cube", label: "Matriz Riesgos Emergentes" }` en `navTabs` justo después de `{ id: "heatmap", label: "Matriz 5x5" }`.
2. En `src/app/page.tsx`:
   - Importa `EmergingRisksCubeView` y renderízalo cuando `activeTab === "emerging-cube"`.

---

## ✅ Criterios de Verificación Obligatorios
1. Verificar que el script en Python `scripts/emerging_risk_cube_engine.py` se ejecute correctamente con `python3` y procese el cálculo tridimensional.
2. Ejecutar `npx tsc --noEmit` y confirmar **0 errores de compilación TypeScript**.
3. Confirmar que tanto la nueva pestaña **"Matriz Riesgos Emergentes"** como la sub-sección **"Cubo 3D Riesgos Emergentes"** dentro de **"Marco Teórico"** funcionen en vivo y estén 100% conectadas con los Procesos Bancarios, Nodos del Diagrama y Planes de Acción.
