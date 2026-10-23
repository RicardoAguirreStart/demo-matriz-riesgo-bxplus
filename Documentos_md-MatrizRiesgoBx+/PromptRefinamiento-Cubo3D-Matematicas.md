# Prompt Quirúrgico de Corrección y Rigor Matemático: Matriz Cúbica 3D en Vivo (Cero Mockups) y Fundamentación Formal en Marco Metodológico

**Rol del Agente:** Arquitecto Cuantitativo Full-Stack Senior (Next.js 16, TypeScript, Python 3, Prisma) y Especialista en Modelado Matemático de Riesgos Emergentes (CNBV CUB Art. 88, Basilea III).  
**Objetivo:** Corregir las brechas funcionales detectadas en la auditoría de `EmergingRisksCubeView.tsx`, `scripts/emerging_risk_cube_engine.py` y `/api/emerging-risks/route.ts` para garantizar un funcionamiento **100% real y dinámico (cero elementos estáticos o simulados)**, e incorporar íntegramente el **desarrollo matemático formal en $\mathbb{R}^3$** dentro del **Marco Metodológico (`MethodologyView.tsx`)**.

---

## 🔍 Parte 1: Correcciones en el Motor Python (`scripts/emerging_risk_cube_engine.py`), Motor TS (`src/lib/engines/emerging-risk-cube-engine.ts`) y API (`/api/emerging-risks/route.ts`)

### 1.1 Desglose Matemático Exacto y Brecha de Visibilidad ($\Delta_{\text{vis}}$) en Python y TS
Tanto en `scripts/emerging_risk_cube_engine.py` como en su espejo `src/lib/engines/emerging-risk-cube-engine.ts`:

1. **Cálculo y retorno de los componentes internos del Tensor $T_{\text{3D}}$ para cada riesgo:**
   - **Volumen Normalizado (`volNormalizedTerm`):** $0.45 \times \left(\frac{V}{125}\right)$
   - **Norma Euclidiana Cuadrática Ponderada (`weightedQuadraticNorm`):**
     $$\frac{\|\vec{R}\|_W^2}{25} = \frac{0.40 X^2 + 0.25 Y^2 + 0.35 Z^2}{25}$$
     y su aporte convexo (`quadWeightedTerm`): $0.55 \times \frac{\|\vec{R}\|_W^2}{25}$.
   - **Combinación Convexa Base (`convexCombination`):** `volNormalizedTerm + quadWeightedTerm`.
   - **Factor de Sinergia Crítica / Ciclo OODA (`synergyFactorGamma`):**
     $$\gamma(X, Z) = \begin{cases} 1.15 & \text{si } X \ge 4 \land Z \ge 4 \\ 1.00 & \text{en otro caso} \end{cases}$$
   - **Índice Compuesto de Tensión Emergente (`tensorScore3D`):**
     $$T_{\text{3D}} = \min\left(100.0,\; \text{round}\left(\text{convexCombination} \times 100.0 \times \gamma(X,Z),\; 2\right)\right)$$
   - **Score Homologado Exacto ($S_{\text{eq}} \in [1, 25]$, `equivalentScore25`):**
     $$S_{\text{eq}} = \text{round}\left(\frac{T_{\text{3D}}}{4.0},\; 2\right)$$
   - **Ecuación de la Brecha de Visibilidad (`visibilityGapDelta` = $\Delta_{\text{vis}}$):**
     $$\Delta_{\text{vis}} = \text{round}\left(S_{\text{eq}}(3D) - \text{Score}_{2D},\; 2\right)$$
     donde $\text{Score}_{2D} = P_{\text{res}} \times I_{\text{res}}$.

2. **Álgebra de Mitigación Vectorial ($\vec{R}_{\text{res}} = \max([1,1,1]^T, \vec{R}_{\text{inh}} - \vec{\Delta R}_{\text{efectivo}})$) y Regla Art. 88 CUB:**
   - En lugar de un porcentaje genérico confuso, modela explícitamente la **traslación vectorial** $\vec{\Delta R}_{\text{efectivo}} = [\Delta X, \Delta Y, \Delta Z]^T$:
     - **Condición de Falla en Velocidad ($Z$):** Si $Z_{\text{inh}} = 5$ y el riesgo **no** cuenta con un control automatizado en tiempo real (`automation === "AUTOMATED"` y `executionTiming === "ONLINE_REALTIME"`), entonces formalmente $\Delta Z = 0$ desde controles manuales/diferidos.
     - **Truncamiento Art. 88 CUB para Controles No Formalizados (`NF`):** Si un control está en estado No Formalizado (`!isFormalized || !hasValidEvidence`), su absorción efectiva se trunca a $\min(\Delta u_{j,\text{nominal}}, 0.40)$ (máximo $\le 1$ punto de reducción discreta en el eje).

3. **En `src/app/api/emerging-risks/route.ts`:**
   - En `GET /api/emerging-risks`, devuelve también la lista completa de **Procesos Bancarios con sus Nodos (`processesWithNodes`)** para que el modal de creación permita elegir tanto el **Proceso** como el **Nodo exacto del Diagrama** (`processNodeId`).
   - En `POST /api/emerging-risks`:
     - En `SIMULATE_OR_UPDATE_CUBE`, permite actualizar tanto $(X_{\text{inh}}, Y_{\text{inh}}, Z_{\text{inh}})$ como la traslación vectorial $(\Delta X, \Delta Y, \Delta Z)$ o $(X_{\text{res}}, Y_{\text{res}}, Z_{\text{res}})$ y también los valores 2D $(P, I)$ si se ajustan, recalculando con el motor Python y guardando en la base de datos.
     - Agrega una acción `TOGGLE_CONTROL_FORMALIZATION` o vinculación rápida de un control tipificado por eje (*Control de Aislamiento BCP para Eje X*, *Sensor KRI / Threat Intel para Eje Y*, *Kill-Switch Automático SOAR para Eje Z*) que cree o actualice un registro real en la tabla `Control` y `RiskControlMap` de Prisma y recalcule el cubo.

---

## 🖥️ Parte 2: Eliminar Elementos Estáticos / Incompletos en `src/components/EmergingRisksCubeView.tsx`

Corrige los siguientes 4 puntos en `src/components/EmergingRisksCubeView.tsx` para que toda la pantalla sea 100% interactiva y real:

1. **Hacer 100% Funcional la Vista `"Gestión Paralela (2D vs. 3D)"` (`cubeMode === "PARALLEL_2D_3D"`):**
   - Actualmente, al hacer clic en el botón `"Gestión Paralela (2D vs. 3D)"`, el lienzo sigue mostrando solo el cubo 3D.
   - **Corrección:** Cuando `cubeMode === "PARALLEL_2D_3D"`, renderiza en el panel principal una **Vista Comparativa Lado a Lado Real**:
     - **Mitad Izquierda: Matriz Clásica 2D ($5 \times 5$: Probabilidad $P$ vs. Impacto $I$)** con sus 25 celdas coloreadas y los chips de los riesgos emergentes ubicados en sus coordenadas $(P_{\text{res}}, I_{\text{res}})$.
     - **Mitad Derecha: Proyección de Homologación 3D y Tabla/Gráfico de Brecha de Visibilidad ($\Delta_{\text{vis}} = S_{\text{eq}}(3D) - \text{Score}_{2D}$)** mostrando cómo cada riesgo salta desde su $\text{Score}_{2D}$ (ej. $4/25$ en Verde/Amarillo) hasta su Score Homologado $S_{\text{eq}}(3D)$ (ej. $24.74/25$ en Rojo Crítico, con $\Delta_{\text{vis}} = +20.74$).

2. **Reemplazar las 3 Tarjetas de Texto de "Proyecciones Ortogonales (3 Caras 5×5)" por 3 Matrices $5 \times 5$ Visuales e Interactivas Reales:**
   - En la sección `"Proyecciones Ortogonales (3 Caras 5×5)"` debajo del cubo isométrico, dibuja **las 3 cuadrículas $5 \times 5$ reales**:
     - **Cara 1: Matriz $X \times Z$ ($5 \times 5$ — Contagio vs. Velocidad: *Choque Relámpago*)**
     - **Cara 2: Matriz $X \times Y$ ($5 \times 5$ — Contagio vs. Incertidumbre: *Cisnes Negros*)**
     - **Cara 3: Matriz $Y \times Z$ ($5 \times 5$ — Incertidumbre vs. Velocidad: *Sorpresas Operativas*)**
   - Cada celda $(i, j) \in \{1..5\}^2$ debe mostrar los puntos/códigos de los riesgos que caen en esa coordenada planar y permitir hacer clic para seleccionar el riesgo en el inspector.

3. **Corregir el Simulador Vectorial 3D en el Inspector Derecho y Mostrar el Desglose Matemático en Vivo:**
   - **Bug corregido:** Sustituye el cálculo erróneo `Math.round(activeRisk.mitigationDeltaX * 100)` por sliders de **Traslación Vectorial $\vec{\Delta R} = (\Delta X, \Delta Y, \Delta Z)$ en unidades de eje ($0.0\text{ a }2.5$ con paso $0.1$)** (además de un switch para simular si los controles están **Formalizados vs. No Formalizados `NF` bajo Art. 88 CUB**, donde al marcar `NF` se aplica el truncamiento $\Delta u_{j,\text{efectivo}} \le 0.40$, y si $Z_{\text{inh}} = 5$ sin control `ONLINE_REALTIME`, se muestra la alerta de $\Delta Z = 0$).
   - **Previsualización en Vivo en el Cubo 3D:** Mientras el usuario mueve los sliders de $(X_{\text{inh}}, Y_{\text{inh}}, Z_{\text{inh}})$ o $(\Delta X, \Delta Y, \Delta Z)$ en el inspector, **el nodo seleccionado y su vector en el Cubo Isométrico 3D deben moverse en tiempo real** y mostrar la tarjeta de desglose matemático en vivo:
     - $V_{\text{inh}} \rightarrow V_{\text{res}}$
     - Aporte Volumétrico ($0.45 \cdot V/125$) + Norma Cuadrática Ponderada ($0.55 \cdot \|\vec{R}\|_W^2 / 25$)
     - Factor de Sinergia $\gamma(X,Z)$ ($1.15\times$ si $X \ge 4 \land Z \ge 4$, ciclo OODA)
     - Tensor $T_{\text{3D}} / 100$ y Score Homologado $S_{\text{eq}} / 25$
     - Brecha de Visibilidad $\Delta_{\text{vis}} = S_{\text{eq}}(3D) - \text{Score}_{2D}$.

4. **Completar el Modal `+ Nuevo Riesgo Emergente 3D`:**
   - Agrega el selector de **Nodo del Diagrama (`processNodeId`)** filtrado dinámicamente según el Proceso Bancario elegido, y los campos de **Probabilidad Histórica 2D ($P \in 1..5$)** e **Impacto 2D ($I \in 1..5$)** para que el nuevo riesgo nazca con su comparativa $\Delta_{\text{vis}}$ exacta.

---

## 📐 Parte 3: Incorporar el Desarrollo Matemático Formal Completo en `src/components/MethodologyView.tsx`

En `src/components/MethodologyView.tsx`, actualiza la sub-sección `activeSubTab === "EMERGING_CUBE"` (y agrega la Fórmula 7 en `activeSubTab === "FORMULAS"`) para que incluya con **rigor matemático completo** las **5 secciones formales**:

1. **Sección 1 — Espacio de Estados Reticular en $\mathbb{R}^3$ y Volumen Cúbico Bruto ($V$):**
   - Mostrar la definición formal del retículo discreto acotado:
     $$\mathcal{S} = \{ (X, Y, Z) \in \mathbb{N}^3 \mid 1 \le X, Y, Z \le 5 \}$$
   - Definición física y matemática de los 3 ejes:
     - **Eje $X$ (Contagio Sistémico):** Interconectividad, correlación de caída con otras unidades de negocio o entidades externas (radio de dispersión).
     - **Eje $Y$ (Incertidumbre Epistémica):** Ausencia de datos históricos, ambigüedad en relaciones causa-efecto y falta de modelos predictivos calibrados.
     - **Eje $Z$ (Velocidad de Materialización):** Dinámica temporal intrínseca $\frac{d(\text{Impacto})}{dt}$; tiempo transcurrido desde el primer síntoma detectable hasta el impacto total (*lead time*).
   - Ecuación del Volumen Cúbico ($V_{\text{inh}} = X_{\text{inh}} \cdot Y_{\text{inh}} \cdot Z_{\text{inh}}$, $V_{\text{res}} = X_{\text{res}} \cdot Y_{\text{res}} \cdot Z_{\text{res}} \in [1, 125]$), explicando su propiedad de **forma multilineal simétrica** y demostrando la **limitación de las superficies de nivel hiperbólicas** con el contraejemplo numérico:
     $$(X=5, Y=1, Z=5) \implies V = 25 \quad (25/125 = 20\% \text{ moderado en volumen puro pese a contagio y velocidad máximos})$$

2. **Sección 2 — Índice Compuesto de Tensión Emergente ($T_{\text{3D}}$) y Homologación ($S_{\text{eq}}$):**
   - Presentar la ecuación maestra de combinación convexa y norma cuadrática euclidiana ponderada:
     $$T_{\text{3D}} = \min\left(100,\; \left[ 0.45 \cdot \left(\frac{V}{125}\right) + 0.55 \cdot \left(\frac{w_x X^2 + w_y Y^2 + w_z Z^2}{25}\right) \right] \times 100 \times \gamma(X, Z)\right)$$
   - Desglosar explícitamente los **4 Componentes (A, B, C y D)**:
     - **A. Métrica Volumétrica Normalizada ($0.45 \cdot \frac{V}{125}$):** Densidad tridimensional con peso del $45\%$.
     - **B. Norma Euclidiana Cuadrática Ponderada ($0.55 \cdot \frac{\|\vec{R}\|_W^2}{25}$):** Con $\|\vec{R}\|_W^2 = w_x X^2 + w_y Y^2 + w_z Z^2$ y vector baricéntrico $\sum w_i = 1$ ($w_x = 0.40$ Contagio, $w_z = 0.35$ Velocidad, $w_y = 0.25$ Incertidumbre). Incluir los recuadros explicativos de:
       - *¿Por qué términos al cuadrado ($X^2, Y^2, Z^2$)?* (Penalización cuadrática de desbalances extremos: un nivel $5$ aporta $25$ y domina la función de energía).
       - *Justificación de los pesos ($w_x > w_z > w_y$)* (El colapso proviene del acoplamiento sistémico y la incapacidad de reaccionar a tiempo).
       - *Normalización exacta sobre $25$* ($25(w_x + w_y + w_z) = 25 \implies [\frac{1}{25}, 1] = [0.04, 1.0]$).
     - **C. Factor de Sinergia Crítica / No Linealidad ($\gamma(X,Z) = 1.15$ si $X \ge 4 \land Z \ge 4$, sino $1.00$):** Explicación del fenómeno de resonancia destructiva cuando la velocidad rebasa el **ciclo OODA (*Observe, Orient, Decide, Act*)** institucional.
     - **D. Operador de Proyección / Saturación ($\min(100, \cdot)$) y Score Homologado ($S_{\text{eq}} \in [1, 25]$):**
       $$S_{\text{eq}} = 1 + \left( \frac{T_{\text{3D}} - T_{\min}}{100 - T_{\min}} \right) \times 24 \quad \approx \quad \frac{T_{\text{3D}}}{4} \qquad (T_{\min} \approx 2.56 \text{ cuando } X=Y=Z=1)$$

3. **Sección 3 — Álgebra de Mitigación Vectorial y Regla Regulatoria (CNBV Art. 88 CUB):**
   - Formulación matricial/vectorial:
     $$\vec{R}_{\text{inh}} = \begin{bmatrix} X_{\text{inh}} \\ Y_{\text{inh}} \\ Z_{\text{inh}} \end{bmatrix}, \qquad \vec{\Delta R} = \begin{bmatrix} \Delta X \\ \Delta Y \\ \Delta Z \end{bmatrix}, \qquad \vec{R}_{\text{res}} = \max\left( \begin{bmatrix} 1 \\ 1 \\ 1 \end{bmatrix},\; \vec{R}_{\text{inh}} - \vec{\Delta R}_{\text{efectivo}} \right)$$
   - **Desacoplamiento de Ejes por Tipología Física de Control:**
     - $\Delta X = f(\text{Aislamiento, Arquitectura de contingencia, Segmentación de red, BCP})$
     - $\Delta Y = f(\text{Sensores KRI, Threat Intelligence, Modelos predictivos bayesianos})$
     - $\Delta Z = f(\text{Automatización en línea, SOAR, Kill-switches automáticos})$
     - **Condición de Falla:** Un control manual desfasado (auditoría mensual o comité quincenal) tiene formalmente $\Delta Z = 0$ frente a $Z_{\text{inh}} = 5$.
   - **Operador de Truncamiento por Control No Formalizado (Art. 88 CUB):**
     $$\Delta u_{j,\text{efectivo}} = \begin{cases} \min(\Delta u_{j,\text{nominal}},\; 2 \times 0.20) = \min(\Delta u_{j,\text{nominal}},\; 0.40) & \text{si Estado} = \text{No Formalizado (NF)} \\ \Delta u_{j,\text{nominal}} & \text{si Estado} = \text{Formalizado / Validado} \end{cases}$$
     $$\text{Eficacia}_{\text{NF}} \le 20\% \implies \Delta u_j \le 1 \quad (\text{Capacidad de absorción degradada})$$

4. **Sección 4 — Zonificación Topológica del Cubo (Fronteras de Severidad en las 125 Celdas):**
   - Tabla formal de las 4 regiones conexas con sus condiciones booleanas exactas (`Crítica Sistémica RED`, `Alerta Temprana ORANGE`, `Vigilancia / Incubación YELLOW`, `Latente / Controlada GREEN`).
   - Explicación explícita de la **Lógica de la Cota Cúbica $V = 64$ ($4^3 = 64$)** y de la **Regla de Forzamiento Disyuntivo $\lor (X = 5 \lor Z = 5)$** (ej. $X=5, Y=1, Z=2 \implies V=10$, que evita caer en Zona Verde por volumen cuando existe contagio catastrófico).

5. **Sección 5 — El Efecto Punto Ciego (Brecha 2D vs. 3D) y Demostración Paso a Paso + Calculadora Interactiva en Vivo:**
   - Mostrar la **Ecuación de la Brecha de Visibilidad ($\Delta_{\text{vis}} = S_{\text{eq}}(3D) - \text{Score}_{2D}$)** y el **Desarrollo Numérico Completo Paso a Paso** del caso canónico:
     - En Matriz 2D: $P=1, I=4 \implies \text{Score}_{2D} = 4$ (Zona Baja / Verde).
     - En Cubo 3D: $(X=5, Y=4, Z=5) \implies V = 100 \implies \text{Norma Ponderada} = \frac{10 + 4 + 8.75}{25} = 0.91 \implies \text{Combinación Convexa} = 0.36 + 0.5005 = 0.8605 \implies \times \gamma(1.15) = 98.96 \implies T_{\text{3D}} = 98.96 \implies S_{\text{eq}} = 24.74 \implies \Delta_{\text{vis}} = 24.74 - 4 = +20.74$.
   - Incluir además un **Laboratorio / Calculadora Interactiva en Vivo del Tensor 3D y Brecha $\Delta_{\text{vis}}$** ahí mismo en `MethodologyView.tsx` para que el usuario o auditor pueda mover $(P, I)$ y $(X, Y, Z)$ y verificar en vivo cada término de la ecuación.

---

## ✅ Criterios de Verificación
1. Ejecutar `python3 scripts/emerging_risk_cube_engine.py --test` y confirmar que el JSON incluya `volNormalizedTerm`, `weightedQuadraticNorm`, `convexCombination`, `synergyFactorGamma`, `tensorScore3D`, `equivalentScore25` y `visibilityGapDelta`.
2. Ejecutar `npx tsc --noEmit` y confirmar **0 errores de TypeScript**.
3. Hacer commit de los cambios.
