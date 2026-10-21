# Prompt Maestro: Creación del Módulo 9 "Marco Teórico, Catálogo de Riesgos y Metodología Institucional B×+"
**Proyecto:** Herramienta Inteligente para la Gestión de Riesgos Relevantes y Emergentes — Banco Ve por Más (B×+)
**Directorio de Trabajo:** `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+`
**Documentos de Referencia Obligatoria:**
1. `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/Documentos_md-MatrizRiesgoBx+/ContextoGeneral-MatrizRiesgoBx+.md`
2. `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/Documentos_md-MatrizRiesgoBx+/DefinicionHerramienta.md`

---

## 🎯 Rol e Instrucción General

Actúa como el **Agente de Desarrollo Principal (Full-Stack Next.js + React + Tailwind CSS + FinTech Risk Architect)**.
Tu objetivo es construir e integrar una **9ª pestaña interactiva en la plataforma** denominada **"Marco Teórico y Metodología"** (`id: "methodology"`), diseñada con la identidad visual del *Taste Index B×+* (`Arvo` Bold 700 para títulos, `Inter` para cuerpo y tablas, paleta `#1F242B`, `#C0D725`, `#3299A8`, `#F5F7F9`).

Esta sección debe servir como el **Manual Ejecutivo y Metodológico Interactivo** para el Comité de Riesgos (CAIR), la UAIR, Auditores Internos/Externos y la CNBV, explicando con total claridad:
1. **Qué riesgos se evalúan en la herramienta** (los 3 Bloques Normativos CNBV, las 11 Taxonomías y los 26 riesgos semilla de Banco B×+).
2. **Cuál es la metodología híbrida de cuantificación y control** (CUB CNBV + Basilea III + NIF C-16 + Metodología Rimac PEA/PMA + Metodología SMNYL de Nodos y Flujos + Taxonomía Sostenible SHCP).
3. **Las fórmulas matemáticas exactas y reglas de negocio** que ejecutan los motores en tiempo real, incluyendo una **Calculadora / Sandbox Pedagógico en vivo** para que el usuario entienda cómo se mueven los números.

---

## 🛠️ Archivos a Crear y Modificar

1. **Crear:** `src/components/MethodologyView.tsx` (Componente completo e interactivo del Módulo 9).
2. **Modificar:** `src/components/Header.tsx` (Agregar la pestaña `{ id: "methodology", label: "Marco Teórico & Metodología", icon: BookOpen }` en `navTabs`).
3. **Modificar:** `src/app/page.tsx` (Importar y renderizar `<MethodologyView onNavigateTab={(tab) => setActiveTab(tab)} />` cuando `activeTab === "methodology"`).

---

## 📐 Estructura Detallada de `src/components/MethodologyView.tsx`

Diseña `MethodologyView.tsx` con una navegación interna por **5 Sub-Secciones (Pills / Tabs internos)** más un buscador de conceptos normativos:

### Sub-Sección 1: Universo de Riesgos Evaluados en Banco B×+ (3 Bloques CNBV y 11 Categorías)
Presenta una vista interactiva con tarjetas expandibles y filtros por bloque regulatorio (Art. 65 al 88 de la CUB):

1. **Bloque I — Riesgos Cuantificables Discrecionales:**
   - **1. Riesgo de Crédito (`CREDIT`):** Incumplimiento de acreditados o contrapartes. Explica cómo la herramienta evalúa la Cartera Comercial/Empresarial (concentración regional/sectorial), Cartera Agropecuaria (FIRA/FEGA, ciclos agrícolas), PyME y Consumo, clasificando dinámicamente en **Etapas 1, 2 y 3 de la NIF C-16**.
   - **2. Riesgo de Liquidez (`LIQUIDITY`):** Incapacidad de fondear activos o cumplir obligaciones sin incurrir en pérdidas extraordinarias. Explica el monitoreo del **CCL ($\ge 100\%$)**, brechas de liquidez (*Gaps* de madurez), concentración de depositantes corporativos y descuento (*haircut*) por liquidación forzada.
   - **3. Riesgo de Mercado (`MARKET`):** Pérdidas por fluctuaciones en tasas de interés (`TIIE 28/91`, `Cetes`, bonos M), tipo de cambio (`USD/MXN`) y *spreads* de sobretasa. Explica el cálculo de **VaR 99%** y **CVaR (*Expected Shortfall* 99%)** y su impacto en el **ICAP ($\ge 10.5\%$)**.

2. **Bloque II — Riesgos Cuantificables No Discrecionales (Riesgo Operacional Integral — Art. 86 Bis CUB):**
   - **4. Riesgo Operacional de Procesos (`OPERATIONAL`):** Fallas en originación, liberación de garantías, conciliación, errores humanos o fraude interno/externo (7 categorías Basilea II).
   - **5. Riesgo Tecnológico y Resiliencia Operacional (`TECHNOLOGICAL`):** Caídas o latencia en el **Sistema de Pagos Electrónicos Interbancarios (SPEI — Circular 8/2019 Banxico)**, Core Bancario, Banca Móvil/Web, fallas en APIs de terceros y obsolescencia (*legacy*).
   - **6. Riesgo Legal (`LEGAL`):** Contingencias judiciales mercantiles/laborales, vicios en contratos o pagarés, omisión de inscripción de garantías en RUG/RPP y multas regulatorias, con su regla de **reserva contable ($0\%, 50\%, 100\%$)**.
   - **7. Riesgo de Prevención de Lavado de Dinero (`PLD_FT`):** Tipologías inusuales (Art. 115 LIC), clientes PEP, transferencias internacionales y riesgos de bloqueo o sanciones.

3. **Bloque III — Riesgos No Cuantificables y Riesgos Emergentes:**
   - **8. Riesgo de Ciberseguridad (`CYBER_EMERGING`):** *Ransomware*, secuestro de sesión en Banca Digital, *credential stuffing*, exfiltración de datos (Anexos 64 Bis y 72 CUB) e ingeniería social con IA.
   - **9. Riesgo Climático y Ambiental ASG (`ESG_CLIMATE`):** Riesgos físicos (sequías severas CONAGUA, heladas, huracanes que afectan el flujo de pago en Agronegocios B×+) y riesgos de transición bajo la **Taxonomía Sostenible de la SHCP** y el criterio **DNSH (*Do No Significant Harm*)**.
   - **10. Riesgo Reputacional (`REPUTATIONAL`):** Percepción adversa en redes sociales, quejas CONDUSEF o contagio por interrupciones en SPEI/Banca Móvil.
   - **11. Riesgo Estratégico (`STRATEGIC`):** Desviaciones en el modelo de negocio, adopción tecnológica o competencia FinTech.

> **Conexión en Vivo:** En cada una de las 11 tarjetas, incluye un contador en tiempo real o insignia de cuántos riesgos tiene registrados Banco B×+ en esa categoría y un botón **"Ver en Matriz Viva →"** que lleve al usuario a la pestaña `risks`.

---

### Sub-Sección 2: Metodología Híbrida de Evaluación (5 Pilares Metodológicos)
Explica mediante diagramas visuales (tarjetas conectadas paso a paso) cómo la herramienta unifica las mejores prácticas bancarias y consultivas:

1. **Pilar 1 — Vinculación a Procesos y Segregación de Funciones (Metodología SMNYL + CUB Art. 88):**
   - Ningún riesgo vive aislado: cada riesgo se ancla a un **Macroproceso $\rightarrow$ Proceso $\rightarrow$ Nodo específico del flujo** (`PROMOTION`, `ANALYSIS`, `APPROVAL`, `EXECUTION`, `CONTROL_POINT`).
   - Explica la **Regla de Segregación de Funciones (SoD):** Ningún rol de Promoción Comercial puede aprobar o liberar recursos sin un nodo de Control de 2ª Línea o Análisis independiente.
2. **Pilar 2 — Evaluación Cualitativa CNBV (Matriz 5×5 Inherente vs. Residual):**
   - **Riesgo Inherente:** $S_{\text{inh}} = P_{\text{inh}} \times I_{\text{inh}}$ en escala $1 \text{ a } 5$ ($1 \text{ a } 25$).
   - **Zonas del Semáforo RAF:**
     - 🟢 **Verde (Apetito / Bajo):** Score $1\text{–}5$
     - 🟡 **Amarillo (Tolerancia / Moderado):** Score $6\text{–}11$
     - 🟠 **Naranja (Alerta Temprana / Alto):** Score $12\text{–}15$
     - 🔴 **Rojo (Límite Excedido / Crítico):** Score $16\text{–}25$
3. **Pilar 3 — Reglas Estrictas de Efectividad de Controles (Metodología Rimac / Start Consulting):**
   - Presenta la tabla normativa de calificación de controles que aplica el motor `operational-risk-engine.ts`:
     - **Regla de Oro de Formalización:** Si un control está **No Formalizado (`NF`)** (no existe en manual autorizado o carece de evidencia auditable), su calificación de **Cobertura se topa automáticamente a un máximo de $2$ (*"Se aplica ocasionalmente"* / $15\%$ de mitigación máxima)**, sin importar que el área operativa declare que es automático.
     - **Penalización por Oportunidad Temporal:**
       - Preventivo / Tiempo Real ($d+0$): Tope de efectividad $= 5$ (*Muy Alta*)
       - Detectivo Diario ($d+1$): Tope de efectividad $= 4$ (*Alta*)
       - Detectivo Semanal ($d+7$): Tope de efectividad $= 3$ (*Media*)
       - Detectivo Mensual ($d+30$): Tope de efectividad $= 2$ (*Baja*)
4. **Pilar 4 — Cuantificación Monetaria Híbrida ($\text{PEA}$ y $\text{PMA}$ / $\text{VaR}$ Operacional 99.9%):**
   - Explica por qué una matriz 5×5 tradicional es insuficiente para el Comité de Riesgos y cómo la herramienta traduce cada riesgo a pesos mexicanos ($\text{MXN}$):
     - **Pérdida Esperada Anual ($\text{PEA}$):** Impacto al Estado de Resultados y base de provisiones operativas ($\text{PEA} = f_{\text{anual}} \times I_{\text{medio}} \times (1 - C_{\text{mitigación}})$).
     - **Pérdida Máxima Anual ($\text{PMA}$ / Cola $\text{VaR } 99.9\%$):** Escenario catastrófico para consumo de Capital Neto e ICAP.
5. **Pilar 5 — Algoritmo de Priorización "Top 5–7 Riesgos Críticos" y Matriz Quick-Wins:**
   - Muestra la descomposición exacta del **Score Multicriterio de Priorización ($0\text{–}100$)** que alimenta el Dashboard C-Level:
     - **$35\%$** Severidad Residual en Matriz 5×5
     - **$30\%$** Pérdida Máxima Anual ($\text{PMA}$ en $\text{MXN}$)
     - **$15\%$** Impacto Reputacional y Mediático
     - **$10\%$** Penalización por Controles No Formalizados o Sin Evidencia
     - **$10\%$** Factor de Velocidad Emergente / Impacto en SPEI o Ciberataque
   - Explica el criterio de **Quick-Win ($\star$):** Planes con potencial de reducción de riesgo $\ge 60\%$, costo Bajo/Muy Bajo y ejecución $\le 90$ días.

---

### Sub-Sección 3: Formulario Matemático y Regulatorio (Fórmulas Auditables)
Presenta en tarjetas limpias de estilo financiero (con tipografía monoespaciada clara, variables explicadas y cita a la CUB / Basilea III / NIF C-16) las **6 ecuaciones maestras** de los motores de `src/lib/engines/`:

1. **NIF C-16 — Pérdida Crediticia Esperada y Mitigación de Colateral ($E^*$):**
   - $E^* = \max\left(0,\; E \times (1 + H_e) - C \times (1 - H_c - H_{fx})\right)$
   - $\text{PCE}_t = \text{PI}_t \times \text{SP}_t \times E^*_t$ (Etapa 1 a 12 meses; Etapas 2 y 3 por vida remanente + gatillo climático ASG $\ge 75$).
   - $\text{APRC} = 1.06 \times K_{\text{IRB}} \times 12.5 \times E^*$.
2. **Función Logística de Estrés Macroeconómico y Climático:**
   - $\text{PI}^{\text{Estresada}} = \frac{1}{1 + \exp\left(-(\alpha + \beta_1 \Delta\text{TIIE} + \beta_2 \Delta\text{PIB} + \beta_3 \text{Sequía}_{\text{ASG}} + \beta_4 \Delta\text{FX})\right)}$
3. **Anexo 1-D Bis CUB — Indicador de Negocio ($\text{IN}$) para Riesgo Operacional:**
   - $\text{IN} = \text{ILCT} + \text{CS} + \text{FC}$ (promedio móvil de los últimos 3 ejercicios anuales).
4. **Riesgo de Mercado y Liquidez (Basilea III / Banxico):**
   - $\text{VaR}_{99\%} = V_0 \times Z_{0.99} \times \sigma_p \times \sqrt{t}$ y $\text{CVaR}_{99\%}$ (*Expected Shortfall*).
   - $\text{CCL} = \frac{\text{Activos Líquidos Computables (Nivel 1 + 2A + 2B)}}{\text{Salidas Netas de Efectivo a 30 días en Estrés}} \ge 100\%$.
   - $\text{ICAP} = \frac{\text{Capital Neto (CET1 + AT1 + Tier 2)}}{\text{APRC} + \text{APRM} + \text{APRO}} \ge 10.5\%$.
5. **Reserva Legal Ponderada (Riesgo Legal CUB):**
   - Remota ($<20\% \rightarrow 0\%$), Posible ($20\text{–}50\% \rightarrow 50\% + \text{costas}$), Probable ($>50\% \rightarrow 100\% + \text{costas}$).
6. **Inmutabilidad Criptográfica de Auditoría (`AuditLog`):**
   - $\text{Hash}_n = \text{SHA-256}(\text{Hash}_{n-1} \;\|\; \text{Timestamp} \;\|\; \text{UserId} \;\|\; \text{Role} \;\|\; \text{Action} \;\|\; \text{Payload})$.

---

### Sub-Sección 4: Ciclo de Vida y los 4 Caminos para Dar de Alta y Gobernar Riesgos
Presenta un diagrama interactivo del modelo de **3 Líneas de Defensa** y los **4 flujos de captura** en la plataforma:
1. **Vía 1 — Desde el Diagramador de Procesos (`FlowchartView`):** Identificación en el nodo exacto donde ocurre la falla u omisión de Segregación de Funciones (SoD).
2. **Vía 2 — Desde el Formulario Estructurado Causa $\rightarrow$ Evento $\rightarrow$ Consecuencia (`RiskAdminView`):** Clasificación taxonómica CNBV, evaluación inherente y asociación de controles.
3. **Vía 3 — Por Carga Masiva de Layouts Financieros (`ImporterView`):** Ingesta validada de los 4 layouts oficiales (Matriz 5×5, Cartera NIF C-16, Indicador de Negocio $\text{IN}$, Mercado/Liquidez).
4. **Vía 4 — Por Alerta Temprana del Copiloto IA Gemini (`CopilotModal` / `CopilotView`):** Promoción con 1 clic de riesgos emergentes (Ciberataques SPEI, Estrés Hídrico Agronegocios) hacia la Matriz Viva.
- Incluye el diagrama de estados de gobernanza: **`DRAFT` / `UNDER_REVIEW` (1ª Línea: Dueño de Proceso) $\rightarrow$ Validación Metodológica y Publicación `PUBLISHED` (2ª Línea: UAIR) $\rightarrow$ Monitoreo RAF y Comité CAIR $\rightarrow$ Revisión Independiente con Sello SHA-256 (3ª Línea: Auditoría Interna)**.

---

### Sub-Sección 5: Laboratorio / Calculadora Pedagógica en Vivo ("Pruébalo tú mismo")
Para que la sección teórica no sea solo texto estático, incluye un **Simulador Didáctico Interactivo** dentro de `MethodologyView.tsx` donde cualquier miembro del Comité o Auditor pueda mover controles deslizantes (*sliders*) e interruptores y ver cómo operan las reglas metodológicas de la herramienta en tiempo real:
- Selector de **Probabilidad Inherente ($1\text{–}5$)** e **Impacto Inherente ($1\text{–}5$)**.
- Interruptor de **Estado de Formalización del Control**: `Formalizado en Manual (F)` vs. `No Formalizado (NF)` (mostrando en vivo cómo al elegir `NF` el sistema bloquea la cobertura máxima en $2$ y dispara el riesgo residual).
- Selector de **Periodicidad / Oportunidad del Control**: `Tiempo Real (d+0)`, `Diario (d+1)`, `Semanal (d+7)`, `Mensual (d+30)`.
- Inputs de **Frecuencia Anual ($f$)** e **Impacto Severo ($\text{MXN}$)** que calculan al instante el **Score Residual 5×5**, la **Zona del Semáforo RAF**, la **$\text{PEA}$ ($\text{MXN}$)** y la **$\text{PMA}$ ($\text{MXN}$)** usando directamente las funciones reales de `src/lib/engines/operational-risk-engine.ts`.

---

## ✅ Criterios de Aceptación y Verificación Final

1. La nueva pestaña **"Marco Teórico & Metodología"** debe aparecer en la barra de navegación superior (`Header.tsx`) con el ícono `BookOpen` de `lucide-react` y respetar al 100% la paleta y tipografía del *Taste Index B×+*.
2. El laboratorio pedagógico en vivo dentro de `MethodologyView.tsx` debe importar y ejecutar las funciones reales de `src/lib/engines/operational-risk-engine.ts` para demostrar transparencia algorítmica.
3. Verifica que `npx tsc --noEmit` no arroje ningún error de TypeScript y que `http://localhost:3000` responda `HTTP 200 OK`.
4. Haz `git commit` y `git push` de la nueva sección al repositorio remoto `https://github.com/RicardoAguirreStart/demo-matriz-riesgo-bxplus`.
