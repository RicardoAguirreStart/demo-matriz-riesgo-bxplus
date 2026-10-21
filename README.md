# Herramienta Inteligente para la Gestión de Riesgos Relevantes y Emergentes — Banco Ve por Más (B×+)

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Google Gemini API](https://img.shields.io/badge/Gemini_API-2.5_Pro-orange?style=flat&logo=google)](https://ai.google.dev/)
[![React Flow](https://img.shields.io/badge/React_Flow-@xyflow/react-pink?style=flat)](https://reactflow.dev/)
[![CNBV / CUB](https://img.shields.io/badge/Regulación-CNBV%20%7C%20CUB%20%7C%20Basilea%20III-emerald?style=flat)](https://www.gob.mx/cnbv)

Plataforma bancaria integral para la administración, cuantificación matemática, diagramación interactiva de procesos y simulación prospectiva de **Riesgos Relevantes y Emergentes** en **Banco Ve por Más (B×+)**, diseñada bajo estricto cumplimiento de la **Circular Única de Bancos (CUB)** de la CNBV, **Basilea III**, **NIF C-16**, la **Circular 8/2019 de Banxico sobre SPEI** y la **Taxonomía Sostenible de la SHCP**.

---

## 🏛️ 1. Contexto Regulatorio y Metodología Integral

La herramienta resuelve de fondo los 4 grandes cuellos de botella de la gestión de riesgos en banca múltiple:
1. **Filtro del Top 5–7 de Riesgos Críticos:** Algoritmo multicriterio que extrae de matrices de más de 80 riesgos aquellos que realmente comprometen el capital o la reputación del banco.
2. **Matriz 5×5 CNBV + Cuantificación Cuantitativa Híbrida (PEA/PMA de Rimac):** Conexión de la probabilidad e impacto cualitativo con la Pérdida Esperada Anual ($PEA = f \times I_{\text{medio}}$) y la Pérdida Máxima Anual ($PMA$ al 99.9% / VaR Operacional).
3. **Cadena de Valor y Diagramas de Flujo Estilo Miro/Canva (SMNYL):** Modelado visual donde los riesgos no son filas aisladas en Excel, sino que se enganchan a las cajas del flujo operativo (validando segregación de funciones CUB: Promoción, Evaluación, Aprobación, Instrumentación y Control).
4. **B×+ Risk Copilot (Google Gemini 2.5 Pro):** Arquitectura RAG conectada a datos internos del banco y circulares normativas para auditar procesos, simular escenarios de estrés macroeconómico/climático y sugerir planes Quick-Win.

---

## 🎨 2. Identidad Visual Institucional (*Taste Index B×+*)

- **Tipografía Dual:**
  - **Titulares y Cifras Clave:** `Arvo` (Google Fonts - Slab Serif Bold 700) para solidez institucional y carácter bancario.
  - **Cuerpo, Tablas y Diagramas:** `Inter` (Google Fonts - Sans Serif 400, 500, 600, 700) para legibilidad densa y control.
- **Paleta Cromática Oficial:**
  - **Acento Primario (Verde Lima B×+):** `#C0D725` (símbolo `+`, indicadores activos y botones de IA/Quick-Wins).
  - **Acento Secundario (Azul Turquesa):** `#3299A8` (enlaces interactivos, *drill-downs* y bordes de flujo).
  - **Base Oscura (Carbono):** `#1F242B` (header de navegación de alto contraste y tarjetas ejecutivas).
  - **Base Neutra:** `#F5F7F9` (superficie general de la aplicación).
- **Semaforización del Marco de Apetito al Riesgo (RAF Art. 88 CUB):**
  - 🟢 **Zona Verde (Dentro de Apetito):** `#10B981`
  - 🟡 **Zona Amarilla (Atención Preventiva):** `#F59E0B`
  - 🟠 **Zona Naranja (Excede Tolerancia — Plan Firmado Obligatorio):** `#F97316`
  - 🔴 **Zona Roja (Transgresión de Límite — Escalamiento al CAIR):** `#EF4444`

---

## 🧩 3. Arquitectura de Módulos

| Módulo | Nombre | Descripción Funcional |
| :--- | :--- | :--- |
| **MOD 06/07** | **Dashboard Ejecutivo C-Level & RAF** | Monitoreo del Marco RAF (ICAP 10.5%, CET1, CCL, VaR, PCE, PEA) y tabla del Top 5–7 de Riesgos Críticos con *drill-down*. |
| **Canvas** | **Creador de Diagramas de Flujo** | Lienzo interactivo en `@xyflow/react` con 4 procesos bancarios, insignias en tiempo real, validación de segregación de funciones CUB, inspector lateral y auditoría con Gemini. |
| **MOD 05** | **Visualizador & Heatmaps CNBV** | Matriz 5x5 dinámica con conmutador en tiempo real: **Riesgo Inherente**, **Residual Actual** y **Objetivo Post-Plan**. |
| **MOD 03** | **Matriz Viva & Catálogo CNBV** | Catálogo de los 11 Tipos de Riesgo CNBV, triada obligatoria `Causa -> Evento -> Consecuencia` y workflow de las 3 Líneas de Defensa. |
| **MOD 02** | **Planes de Acción & Quick-Wins** | Matriz de priorización (Mejora % vs. Esfuerzo), repositorio con huella SHA-256 y requerimiento de firma de negocio para Zona Naranja. |
| **MOD 01** | **Importador de Layouts Financieros** | Ingesta y pre-carga asistida con 4 plantillas maestras integradas en 1 clic (Layouts A, B, C y D). |
| **MOD 04** | **B×+ Risk Copilot & Stress Testing** | Simulador de escenarios macroeconómicos ($\Delta\text{PIB}$, TIIE, FX, Sequía Agro, Caída SPEI) con narrativa ejecutiva por Gemini 2.5 Pro. |
| **Supervisión** | **Reportes CNBV & Audit Trail** | Emisión de Serie R24, Portafolio Global de Juicios, Informe Art. 88 CUB y visor de bitácora inalterable con encadenamiento SHA-256. |

---

## 🧮 4. Motores Matemáticos de Cálculo (`src/lib/engines/`)

1. **Motor de Riesgo de Crédito (`credit-engine.ts`):**
   - Clasificación en **Etapas 1, 2 y 3** bajo **NIF C-16** y **Anexo 15 Bis CUB**.
   - Mitigación por colateral admisible: $E^* = \max\{0, [E(1+H_e) - C(1-H_c-H_{fx})]\}$.
   - $PCE_t = PI_t \times SP_t \times EI_t \times D_t$.
   - Función logística de estrés econométrico y climático ($PI^{\text{Estresada}}$).
2. **Motor de Mercado y Liquidez (`market-liquidity-engine.ts`):**
   - $\text{VaR}_{99\%}$, $\text{CVaR}_{99\%}$ (Expected Shortfall).
   - Coeficiente de Cobertura de Liquidez ($\text{CCL} \ge 100\%$) e Índice de Deficiencia de Liquidez ($\text{IDEL}$).
   - Ratios de Solvencia Basilea III: CET1, Tier 1 e ICAP ($10.5\%$).
3. **Motor de Riesgo Operacional y Controles (`operational-risk-engine.ts`):**
   - **Indicador de Negocio ($\text{IN} = \text{ILCT} + \text{CS} + \text{FC}$)** trianual (Anexo 1-D Bis).
   - Reglas de control: No Formalizado (NF) con tope de Cobertura = 2; penalización temporal $d+0$ (Muy Alta), $d+1$ (Alta), $d+7$ (Media), $d+30$ (Baja).
   - Matriz 5x5, Pérdida Esperada Anual ($\text{PEA} = f \times I_{\text{medio}}$) y Pérdida Máxima Anual ($\text{PMA}$ al 99.9%).
4. **Algoritmo de Priorización Top 5–7 (`prioritization-engine.ts`):**
   - Score compuesto: $35\% \text{ Residual 5x5} + 30\% \text{ PMA} + 15\% \text{ Reputación} + 10\% \text{ Brecha Controles} + 10\% \text{ Emergente/SPEI}$.

---

## 🚀 5. Instalación y Ejecución Local

### Prerrequisitos
- Node.js >= 20.x
- npm >= 10.x

### Paso a Paso
```bash
# 1. Clonar el repositorio
git clone https://github.com/RicardoAguirreStart/demo-matriz-riesgo-bxplus.git
cd demo-matriz-riesgo-bxplus

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (.env)
# DATABASE_URL="file:./dev.db"
# GEMINI_API_KEY="tu_api_key_de_gemini"

# 4. Sincronizar Prisma y ejecutar Seed
npx prisma generate
npx prisma db push
npm run prisma:seed

# 5. Levantar el servidor de desarrollo
npm run dev
```

Abre en tu navegador: [http://localhost:3000](http://localhost:3000).

---

## 🔐 6. Integridad Criptográfica y Seguridad

- **Audit Trail Inalterable:** Cada evento sensible (`CREATE_RISK`, `SIGN_PLAN`, `AI_SIMULATION`, etc.) genera un hash `SHA-256` encadenado con el bloque anterior (`previousHash`), garantizando inmutabilidad auditable ante inspectores de la CNBV.
- **Segregación de 3 Líneas de Defensa:** Roles diferenciados (`C_LEVEL_CAIR`, `UAIR_ADMIN`, `PROCESS_OWNER`, `INTERNAL_AUDITOR`) con limitación de permisos en la administración de umbrales metodológicos.
