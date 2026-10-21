# Prompt Maestro de Refinamiento (Fase 2 — Cierre de Brechas de Auditoría Técnica)
**Proyecto:** Herramienta Inteligente para la Gestión de Riesgos Relevantes y Emergentes — Banco Ve por Más (B×+)
**Directorio de Trabajo:** `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+`
**Documentos de Referencia Obligatoria:**
1. `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/Documentos_md-MatrizRiesgoBx+/AuditoriaTecnica-MatrizRiesgoBx+.md`
2. `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/Documentos_md-MatrizRiesgoBx+/DefinicionHerramienta.md`
3. `/Users/raguirre/Documents/Propuestas/Demo-MatrizRiesgoBx+/Documentos_md-MatrizRiesgoBx+/ContextoGeneral-MatrizRiesgoBx+.md`

---

## 🎯 Rol e Instrucción General

Actúa como el **Agente de Desarrollo Principal (Full-Stack Next.js + Prisma + React Flow + FinTech Risk Engines)**.
La Fase 1 de la plataforma ya fue auditada y aprobada en su arquitectura, esquema Prisma (22 modelos), motores matemáticos (`src/lib/engines/*`), integración con Gemini y estilo visual (*Taste Index B×+*).

Tu objetivo en esta **Fase 2** es implementar de forma quirúrgica **5 mejoras funcionales de interactividad y gobernanza** detectadas en la Auditoría Técnica (`AuditoriaTecnica-MatrizRiesgoBx+.md`), **sin romper ni degradar** ninguno de los motores matemáticos, semillas ni vistas existentes.

---

## 🛠️ Los 5 Hallazgos a Resolver (Especificación Quirúrgica)

### Hallazgo 1: Carga Real de Archivos CSV/XLSX, Plantillas Descargables y Eliminación de `alert()` en el Importador (`ImporterView.tsx` y `/api/layouts/import/route.ts`)

**Estado actual:**
- `src/components/ImporterView.tsx` muestra una vista previa estática de los 4 layouts oficiales (`LAYOUT_A_MATRIZ_5X5`, `LAYOUT_B_CARTERA_NIF_C16`, `LAYOUT_C_INDICADOR_NEGOCIO_IN`, `LAYOUT_D_MERCADO_LIQUIDEZ`), no tiene un `<input type="file">` funcional ni permite descargar una plantilla CSV de ejemplo, y en la línea 207 usa un `alert()` nativo del navegador.
- `src/app/api/layouts/import/route.ts` solo crea un registro en `FinancialLayoutUpload` con conteos fijos sin insertar ni actualizar registros reales en `RiskEvent`, `CreditExposureNifC16` o `OperationalBusinessIndicator`.

**Lo que debes implementar:**
1. **Selector y Drag & Drop Real de Archivos (`.csv` / `.xlsx` / `.json`) en `src/components/ImporterView.tsx`:**
   - Agrega un `<input type="file" accept=".csv,.xlsx,.xls" />` oculto accionado por la zona de *Drag & Drop* y un botón **"Seleccionar Archivo CSV / Excel"** además de mantener un botón **"Cargar Lote Demo B×+"** para pruebas rápidas con 1 clic.
   - Agrega un botón **"Descargar Plantilla CSV Oficial"** para cada uno de los 4 layouts que genere y descargue en el navegador un archivo `.csv` real con las columnas normativas de ese layout y 3 filas de ejemplo de Banco B×+.
   - Parsea el archivo CSV/XLSX en el cliente (o envíalo al backend) mostrando en la tabla de *Vista Previa* las filas reales leídas del archivo, aplicando en tiempo real las validaciones normativas:
     - **Layout A (Matriz 5×5):** Detectar si un control viene como `NF` (*No Formalizado*) con cobertura $> 2$ y mostrar la advertencia amarilla de tope automático CNBV ($\le 2$).
     - **Layout B (Cartera NIF C-16):** Detectar si `daysPastDue >= 90` (Etapa 3) o `climateVulnerabilityScore >= 75` (migración automática a Etapa 2 por riesgo climático ASG).
2. **Persistencia Transaccional Real en `src/app/api/layouts/import/route.ts`:**
   - Cuando el usuario haga clic en **"Confirmar e Ingerir a Base de Datos"**, envía las filas validadas al endpoint `POST /api/layouts/import`.
   - En `POST /api/layouts/import`, además de registrar el lote en `FinancialLayoutUpload` y sellar el bloque en `AuditLog` (`SHA-256`), inserta o actualiza (`upsert` / `create`) registros reales en Prisma según el `layoutType`:
     - Si es `LAYOUT_A_MATRIZ_5X5`: crea el nuevo `RiskEvent` calculando sus métricas con `calculateOperationalRiskMetrics`.
     - Si es `LAYOUT_B_CARTERA_NIF_C16`: crea o actualiza registros en `CreditExposureNifC16` calculando su etapa NIF C-16, $E^*$, $\text{PCE}_t$ y $\text{APRC}$ con `credit-engine.ts`.
     - Si es `LAYOUT_C_INDICADOR_NEGOCIO_IN`: actualiza o inserta en `OperationalBusinessIndicator`.
     - Si es `LAYOUT_D_MERCADO_LIQUIDEZ`: actualiza el valor actual (`currentValue` y `currentZone`) de los indicadores en `RafThreshold` / `KriIndicator` (`CCL`, `VaR`).
3. **Reemplazo de `alert()` nativo:**
   - Elimina por completo el `alert(...)` de la línea 207 de `src/components/ImporterView.tsx` y reemplázalo por un **Banner / Toast Institucional B×+** dentro de la interfaz (con fondo `#1F242B`, borde izquierdo `#C0D725`, resumen de filas insertadas en Prisma y el hash `SHA-256` del `AuditLog` generado).

---

### Hallazgo 2: Barra de Herramientas Interactiva en el Diagramador de Procesos (`FlowchartView.tsx` y `/api/processes/route.ts`)

**Estado actual:**
- `src/app/api/processes/route.ts` (líneas 67–113) **ya tiene implementadas** las acciones `UPDATE_NODE_POSITIONS`, `CREATE_NODE` y `CREATE_EDGE`.
- Sin embargo, `src/components/FlowchartView.tsx` solo carga el diagrama en modo lectura/inspección y no expone controles para agregar nodos, conectar aristas ni guardar posiciones arrastradas.

**Lo que debes implementar en `src/components/FlowchartView.tsx`:**
1. **Conectar Eventos del Lienzo (`@xyflow/react`):**
   - Implementa `onConnect` para que al arrastrar una conexión entre dos nodos en el lienzo se llame a `POST /api/processes` con `action: "CREATE_EDGE"` y se persista la arista en SQLite.
   - Agrega un botón **"Guardar Layout de Nodos"** en la barra superior del lienzo (o auto-guardado con *debounce* en `onNodeDragStop`) que invoque `POST /api/processes` con `action: "UPDATE_NODE_POSITIONS"`, mostrando confirmación visual en pantalla.
2. **Modal / Popover `"+ Nuevo Nodo Bancario"` en la Barra del Lienzo:**
   - Permite añadir un nuevo paso al proceso seleccionado capturando:
     - Nombre del paso (`label`),
     - Tipo de nodo (`PROCESS_STEP`, `DECISION`, `CONTROL_POINT`, `EXTERNAL_ENTITY`, `SYSTEM_API`),
     - Rol ejecutante (`responsibleRole`: `PROMOTION`, `ANALYSIS`, `APPROVAL`, `EXECUTION`, `CONTROL_2ND_LINE`),
     - Sistema TI (`systemName`, ej. `"Core Bancario T24"`, `"Motor PLD"`),
     - SLA en horas (`slaHours`).
   - Al guardar, invoca `POST /api/processes` con `action: "CREATE_NODE"` y refresca el diagrama inmediatamente.

---

### Hallazgo 3: Detección Automática de Violación de Segregación de Funciones (SoD — CUB CNBV) en el Diagramador (`FlowchartView.tsx`)

**Estado actual:**
- El componente `BankingProcessNode` en `src/components/FlowchartView.tsx` (líneas 73–79) ya renderiza la alerta roja `"Violación SoD CUB"` si `data.hasSodViolation === true`, pero `loadProcessDetail` nunca calcula esa propiedad.

**Lo que debes implementar en `src/components/FlowchartView.tsx` (y opcionalmente en `/api/processes/route.ts`):**
1. **Algoritmo Detector de Conflictos SoD (Art. 65 y 88 CUB):**
   - Al construir los nodos del proceso en `loadProcessDetail`, evalúa las aristas (`edges`) y roles (`responsibleRole`):
     - **Regla SoD 1 (Conflicto Promoción / Aprobación o Ejecución sin Control Intermedio):** Si un nodo con `responsibleRole === "PROMOTION"` se conecta directamente a un nodo `APPROVAL` o `EXECUTION` sin pasar por un nodo de tipo `CONTROL_POINT` o rol `ANALYSIS` / `CONTROL_2ND_LINE`, o si la misma unidad/rol ejecuta la originación y la liberación sin control preventivo activo, marca `hasSodViolation = true`.
     - **Regla SoD 2 (Nodo con Riesgo Crítico sin Control Formalizado):** Si un nodo de tipo `APPROVAL` o `EXECUTION` tiene riesgos asociados en zona `RED` o `ORANGE` y carece de controles con `formalizationStatus === "FORMALIZED"` (`F`), o tiene un botón de **"Simular Conflicto SoD (Auditoría CUB)"** en la barra superior del lienzo para demostrar en vivo ante el Comité cómo el diagrama ilumina en rojo los nodos con violación de Segregación de Funciones y explica el incumplimiento en el *drawer* lateral.

---

### Hallazgo 4: Flujo de Gobernanza RBAC (1ª Línea vs. 2ª Línea UAIR) en el Alta y Publicación de Riesgos (`RiskAdminView.tsx` y `/api/risks/route.ts`)

**Estado actual:**
- En `src/components/RiskAdminView.tsx` (línea 95), cualquier riesgo nuevo se envía con `status: "PUBLISHED"` sin importar qué rol esté activo en el selector RBAC del `Header`.

**Lo que debes implementar:**
1. **Diferenciación por Rol Activo (`currentRole`):**
   - En `src/components/RiskAdminView.tsx`, al dar de alta un riesgo:
     - Si `currentRole === "PROCESS_OWNER"` (**1ª Línea de Defensa**), el riesgo debe crearse con `status: "UNDER_REVIEW"` (etiqueta visual: `"En Revisión UAIR — 1ª Línea"` en color Ámbar/Turquesa).
     - Si `currentRole === "UAIR_ADMIN"` o `currentRole === "C_LEVEL_CAIR"` (**2ª Línea / Comité**), el riesgo se crea directamente como `status: "PUBLISHED"` (etiqueta visual: `"Publicado en Matriz Viva"` en color Verde).
     - Si `currentRole === "INTERNAL_AUDIT"` (**3ª Línea — Auditoría Interna**), el botón de crear/editar debe estar deshabilitado en modo **Solo Lectura / Dictamen de Auditoría**, mostrando un aviso institucional de independencia de la 3ª Línea conforme a la CUB.
2. **Acción de Aprobación y Publicación por la 2ª Línea (`UAIR_ADMIN`):**
   - Agrega en `src/app/api/risks/route.ts` un método `PATCH` (o acción `APPROVE_RISK` en `POST`) que permita cambiar el estado de un riesgo de `UNDER_REVIEW` o `DRAFT` a `PUBLISHED`, registrando el evento `"APPROVE_AND_PUBLISH_RISK"` en la bitácora criptográfica `AuditLog` (`SHA-256`).
   - En la tabla de `RiskAdminView.tsx`, muestra una columna o insignia de **Estado de Gobernanza** (`PUBLISHED` vs `UNDER_REVIEW`) y, cuando exista algún riesgo en `UNDER_REVIEW` y el usuario activo sea `UAIR_ADMIN` o `C_LEVEL_CAIR`, muestra un botón directo **"Aprobar y Publicar (UAIR)"** en esa fila.

---

### Hallazgo 5: Modal de Creación de Planes de Acción (`+ Nuevo Plan`) y Carga de Evidencias de Control en `ActionPlansView.tsx`

**Estado actual:**
- `src/app/api/action-plans/route.ts` (líneas 66–143) **ya tiene programada** la creación de planes de acción con cálculo automático de $\Delta\text{PEA}$, $\Delta\text{PMA}$, clasificación *Quick-Win* y registro en `AuditLog`, pero `src/components/ActionPlansView.tsx` no tiene un botón/modal para invocarlo ni para adjuntar evidencias de cierre.

**Lo que debes implementar:**
1. **Modal `"+ Nuevo Plan de Mitigación"` en `src/components/ActionPlansView.tsx`:**
   - Agrega un botón primario en la cabecera de la vista de Planes de Acción que abra un modal conectado a `POST /api/action-plans`:
     - Selector del Riesgo Crítico a mitigar (`riskEventId`, cargado desde `/api/risks`),
     - Título y Descripción del plan,
     - Tipo de plan (`PROCESS`, `TECHNOLOGY`, `TRAINING`, `POLICY_REGULATION`),
     - Potencial de mejora (`improvementPotentialPct`: `0.85` Alta, `0.60` Media, `0.25` Baja),
     - Costo estimado en MXN (`estimatedCostMXN`) y escala de costo (`VERY_LOW`, `LOW`, `MEDIUM`, `HIGH`),
     - Plazo estimado en días (`estimatedDays`) y fecha compromiso (`dueDate`).
   - Muestra en vivo dentro del modal la previsualización del **Ahorro Monetario Anual ($\Delta\text{PEA}$ y $\Delta\text{PMA}$)** y si califica automáticamente como **Quick-Win ($\star$)** antes de guardar.
2. **Carga de Evidencia Documental (`UPLOAD_EVIDENCE`):**
   - En `src/app/api/action-plans/route.ts`, agrega la acción `action === "ADD_EVIDENCE"` que cree un registro en el modelo `ControlEvidence` (con `fileName`, `fileHashSha256` calculado con `crypto.createHash('sha256')`, `uploadedBy` y `validationStatus: "VALIDATED"`), actualice el porcentaje de avance (`completionPercentage`) del `ActionPlan` y selle la entrada en `AuditLog`.
   - En cada tarjeta del tablero Kanban de `ActionPlansView.tsx`, agrega un botón **"Adjuntar Evidencia (SHA-256)"** que permita seleccionar un archivo (o generar el sello digital de un entregable normativo), mostrando en la tarjeta las evidencias adjuntas con su hash truncado.

---

## ✅ Criterios de Aceptación y Verificación Final

Al concluir la implementación de los 5 puntos:
1. Ejecuta `npm run build` (o verifica la compilación de TypeScript con `npx tsc --noEmit`) para asegurar que **no exista ningún error de tipos ni de compilación**.
2. Verifica que el servidor de desarrollo en `http://localhost:3000` responda `HTTP 200 OK` tanto en la vista principal como en todos los endpoints `/api/*`.
3. Realiza un `git status`, asegura que `.env` y `dev.db` sigan excluidos en `.gitignore`, haz `git commit` con el mensaje `"feat(phase-2): complete interactive file import, flowchart editor, SoD detector, RBAC approval workflow, and action plan creation"` y haz `git push` al repositorio remoto `https://github.com/RicardoAguirreStart/demo-matriz-riesgo-bxplus`.
4. Entrega un resumen conciso confirmando la resolución de cada uno de los 5 hallazgos.
