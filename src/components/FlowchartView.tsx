// src/components/FlowchartView.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  ReactFlowProvider,
  useReactFlow,
  addEdge,
  Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { formatMXN, getZoneBadgeClasses } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  AlertTriangle,
  Sparkles,
  Plus,
  X,
  Save,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Send,
  Trash2,
  HelpCircle,
  ShieldAlert,
  Maximize2,
} from "lucide-react";

// ============================================================================
// 1. COMPONENTE DE FIGURAS GEOMÉTRICAS BANCARIAS (Estilo Miro / Canva)
// ============================================================================
function BankingProcessNode({ id, data, selected }: NodeProps) {
  const {
    label,
    nodeType,
    creditStage,
    responsibleRole,
    systemUsed,
    riskCount = 0,
    maxResidualZone = "GREEN",
    totalPMA = 0,
    hasSodViolation = false,
    hasFraudCheckpoint = false,
    sodAuditActive = false,
    styleConfig = {},
    onAddNext,
  } = (data as any) || {};

  // Parsear styleConfig si viene como string
  const config = typeof styleConfig === "string" ? JSON.parse(styleConfig || "{}") : styleConfig || {};

  // Configuración de estilo geométrico según nodeType
  let shapeClasses = "rounded-md border-2 border-gray-400 bg-white";
  let headerBg = "bg-gray-100 text-gray-800";
  let typeSymbol = "▭";
  let typeLabel = "PASO OPERATIVO";

  if (nodeType === "START_END") {
    shapeClasses = "rounded-3xl border-2 border-emerald-500 bg-emerald-50/10";
    headerBg = "bg-emerald-600 text-white";
    typeSymbol = "◯";
    typeLabel = config.stage === "END" ? "FIN DE PROCESO" : "INICIO DE PROCESO";
  } else if (nodeType === "DECISION_GATEWAY") {
    // Rombo / Compuerta de Decisión en Índigo
    shapeClasses = "rounded-md border-2 border-indigo-600 bg-indigo-50/20 shadow-md";
    headerBg = "bg-indigo-700 text-white";
    typeSymbol = "◆";
    typeLabel = "COMPUERTA DE DECISIÓN";
  } else if (nodeType === "CONTROL_POINT") {
    // Hexágono / Punto de Control en Turquesa B×+
    shapeClasses = "rounded-md border-2 border-[#3299A8] bg-cyan-50/20";
    headerBg = "bg-[#3299A8] text-white";
    typeSymbol = "⬡";
    typeLabel = "PUNTO DE CONTROL (CUB)";
  } else if (nodeType === "FRAUD_CHECKPOINT") {
    // Control de Fraude Anexo 12-E en Ámbar
    shapeClasses = "rounded-md border-2 border-amber-600 bg-amber-50/20";
    headerBg = "bg-amber-600 text-white";
    typeSymbol = "⛨";
    typeLabel = "CONTROL DE FRAUDE (12-E)";
  } else if (nodeType === "EXTERNAL_SYSTEM") {
    // Bloque Técnico de Sistema TI / API en Púrpura
    shapeClasses = "rounded-md border-2 border-purple-600 bg-purple-50/20 font-mono";
    headerBg = "bg-purple-700 text-white";
    typeSymbol = "▱";
    typeLabel = "SISTEMA TI / API CORE";
  }

  if (hasSodViolation && sodAuditActive) {
    shapeClasses += " border-rose-600 ring-2 ring-rose-500 ring-offset-1 shadow-rose-100";
  }

  return (
    <div
      className={`relative min-w-[250px] max-w-[290px] shadow-sm transition-all text-xs ${shapeClasses} ${
        selected ? "ring-2 ring-[#C0D725] shadow-lg" : ""
      }`}
    >
      {/* Handle de Entrada Izquierdo */}
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-[#3299A8] border-2 border-white" />

      {/* Cabecera Geométrica */}
      <div className={`px-2.5 py-1.5 rounded-t-sm font-bold flex items-center justify-between ${headerBg}`}>
        <span className="tracking-wide uppercase text-[10px] font-mono flex items-center gap-1 truncate">
          <span>{typeSymbol}</span>
          <span>{typeLabel}</span>
        </span>
        {creditStage && creditStage !== "NOT_APPLICABLE" && (
          <span className="text-[9px] uppercase tracking-wider bg-black/20 px-1.5 py-0.2 rounded text-white shrink-0">
            {creditStage}
          </span>
        )}
      </div>

      {/* Cuerpo del Nodo */}
      <div className="p-2.5 space-y-1.5">
        {/* Título o Pregunta Lógica */}
        <div className="font-bold text-gray-900 leading-snug">
          {nodeType === "DECISION_GATEWAY" ? (
            <span className="text-indigo-950 font-serif">{config.decisionQuestion || label}</span>
          ) : (
            <span>{label}</span>
          )}
        </div>

        {/* Criterios condicionales si es Rombo de Decisión */}
        {nodeType === "DECISION_GATEWAY" && (
          <div className="bg-indigo-50 border border-indigo-200/80 p-1.5 rounded text-[10px] space-y-1">
            <div className="text-emerald-800 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-[1px] inline-block"></span>
              <span>Rama Sí: {config.yesCriteria || "Aprobación Automática"}</span>
            </div>
            <div className="text-amber-800 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-600 rounded-[1px] inline-block"></span>
              <span>Rama No: {config.noCriteria || "Escalamiento a Comité"}</span>
            </div>
          </div>
        )}

        {/* Metadatos operativos */}
        <div className="text-[11px] text-gray-500 space-y-0.5">
          {responsibleRole && (
            <div className="truncate">
              <span className="text-gray-400 font-medium">Rol: </span>
              <span className="text-gray-700 font-semibold">{responsibleRole}</span>
            </div>
          )}
          {systemUsed && (
            <div className="truncate font-mono text-[10px]">
              <span className="text-gray-400">Sistema: </span>
              <span className="text-gray-700">{systemUsed}</span>
            </div>
          )}
        </div>

        {/* Badges de Riesgos y PMA */}
        <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-1 items-center justify-between">
          {riskCount > 0 ? (
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-[3px] inline-flex items-center gap-1 ${getZoneBadgeClasses(
                maxResidualZone
              )}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-[1px] inline-block ${
                  maxResidualZone === "GREEN"
                    ? "bg-emerald-600"
                    : maxResidualZone === "YELLOW"
                    ? "bg-amber-500"
                    : maxResidualZone === "ORANGE"
                    ? "bg-orange-600"
                    : "bg-rose-600"
                }`}
              />
              <span>{riskCount} {riskCount === 1 ? "Riesgo" : "Riesgos"} ({maxResidualZone})</span>
            </span>
          ) : (
            <span className="text-[9px] font-mono text-gray-400 bg-gray-50 px-1 py-0.5 rounded-[3px] border border-gray-200">
              0 riesgos anclados
            </span>
          )}

          {totalPMA > 0 && (
            <span className="text-[9px] font-bold font-mono text-orange-800">
              PMA: {formatMXN(totalPMA)}
            </span>
          )}
        </div>

        {/* Alerta de Segregación de Funciones (SoD) */}
        {hasSodViolation && (
          <div
            className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono font-semibold uppercase border ${
              sodAuditActive
                ? "bg-rose-100 text-rose-900 border-rose-300 font-bold"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            Conflicto SoD (CUB Art. 65/88)
          </div>
        )}

        {hasFraudCheckpoint && (
          <div className="bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono font-semibold uppercase border border-amber-300">
            Candado Fraude Anexo 12-E
          </div>
        )}
      </div>

      {/* Handle de Salida Derecho */}
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-[#3299A8] border-2 border-white" />

      {/* Botón "+" Estilo Miro / Canva para añadir y conectar siguiente figura */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAddNext?.(id, nodeType, label);
        }}
        className="nodrag absolute -right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1F242B] hover:bg-[#C0D725] text-white hover:text-[#1F242B] border-2 border-white shadow-md flex items-center justify-center text-xs font-black transition-all hover:scale-110 z-10 cursor-pointer"
        title="Agregar siguiente figura conectada en el flujo"
      >
        +
      </button>
    </div>
  );
}

const nodeTypes = {
  bankingNode: BankingProcessNode,
};

// ============================================================================
// 2. COMPONENTE PRINCIPAL FLOWCHART VIEW (INNER)
// ============================================================================
function FlowchartViewInner({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  const { fitView } = useReactFlow();
  const [processes, setProcesses] = useState<any[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("");
  const [activeProcess, setActiveProcess] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"CONFIG" | "COPILOT" | "RISKS">("CONFIG");
  const [aiAuditing, setAiAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  // SoD Auditor Mode State
  const [sodAuditActive, setSodAuditActive] = useState(false);
  const [sodViolationsCount, setSodViolationsCount] = useState(0);

  // General Status Banner
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [savingPositions, setSavingPositions] = useState(false);

  // Modal 1: Nuevo Nodo Manual Clásico
  const [isNewNodeModalOpen, setIsNewNodeModalOpen] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeType, setNewNodeType] = useState("TASK_STEP");
  const [newNodeRole, setNewNodeRole] = useState("ANALYSIS");
  const [newNodeCreditStage, setNewNodeCreditStage] = useState("NOT_APPLICABLE");
  const [newNodeSystem, setNewNodeSystem] = useState("Core Bancario T24");
  const [newNodeDescription, setNewNodeDescription] = useState("");

  // Modal 2: Creador Conversacional de Nuevos Procesos con IA
  const [isAiGenerateModalOpen, setIsAiGenerateModalOpen] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<
    { role: "user" | "assistant"; content: string; suggestedChips?: string[] }[]
  >([]);
  const [aiChatInput, setAiChatInput] = useState("");
  const [isGeneratingProcess, setIsGeneratingProcess] = useState(false);

  // Modal 4: Confirmar Eliminación de Proceso
  const [isDeleteProcessModalOpen, setIsDeleteProcessModalOpen] = useState(false);
  const [isDeletingProcess, setIsDeletingProcess] = useState(false);

  // Auto-resize y auto-scroll para la conversación del Asistente IA
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Helper para desplegar texto conversacional limpio sin sintaxis ni asteriscos markdown
  const cleanAssistantText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*([^*\n]+)\*/g, "$1")
      .replace(/^(\s*)\*\s+/gm, "$1- ")
      .replace(/\*/g, "")
      .replace(/^#+\s+/gm, "")
      .trim();
  };

  useEffect(() => {
    if (chatTextareaRef.current) {
      chatTextareaRef.current.style.height = "auto";
      const scrollHeight = chatTextareaRef.current.scrollHeight;
      chatTextareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 38), 130)}px`;
    }
  }, [aiChatInput]);

  useEffect(() => {
    if (isAiGenerateModalOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiChatMessages, isGeneratingProcess, isAiGenerateModalOpen]);

  // Modal 3: Evaluador Integral de Riesgos IA Cross-Process
  const [isEvaluatorModalOpen, setIsEvaluatorModalOpen] = useState(false);
  const [isEvaluatingProcess, setIsEvaluatingProcess] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [anchoringRiskId, setAnchoringRiskId] = useState<string | null>(null);

  // Popover Miro/Canva: Añadir siguiente figura al dar clic en "+"
  const [addNextSource, setAddNextSource] = useState<{ id: string; nodeType: string; label: string } | null>(null);
  const [addNextCondition, setAddNextCondition] = useState<"YES" | "NO">("YES");

  // Formulario Contextual de Edición en Drawer
  const [editLabel, setEditLabel] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editNodeType, setEditNodeType] = useState("TASK_STEP");
  const [editRole, setEditRole] = useState("ANALYSIS");
  const [editSystem, setEditSystem] = useState("Core Bancario T24");
  const [editCreditStage, setEditCreditStage] = useState("NOT_APPLICABLE");
  const [editStyleConfig, setEditStyleConfig] = useState<any>({});
  const [savingNodeEdit, setSavingNodeEdit] = useState(false);

  // Formulario para anclar riesgo dentro del drawer
  const [showAddRiskForm, setShowAddRiskForm] = useState(false);
  const [newRiskTitle, setNewRiskTitle] = useState("");
  const [newRiskCause, setNewRiskCause] = useState("");
  const [newRiskEvent, setNewRiskEvent] = useState("");
  const [newRiskConsequence, setNewRiskConsequence] = useState("");
  const [newRiskProb, setNewRiskProb] = useState(3);
  const [newRiskImp, setNewRiskImp] = useState(4);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  // Auto-ajustar vista del canvas cuando cargan o cambian las figuras del proceso
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.15, duration: 400 });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, selectedProcessId, fitView]);

  // 1. Cargar lista de procesos
  const refreshProcessList = useCallback(async (selectId?: string) => {
    try {
      const res = await fetch("/api/processes");
      const data = await res.json();
      if (data.success) {
        const procList = data.processes || [];
        setProcesses(procList);
        if (selectId) {
          setSelectedProcessId(selectId);
        } else if (procList.length > 0) {
          // Si el seleccionado actual ya no existe en la lista, seleccionar el primero disponible
          const exists = procList.some((p: any) => p.id === selectedProcessId);
          if (!exists || !selectedProcessId) {
            setSelectedProcessId(procList[0].id);
          }
        } else {
          setSelectedProcessId("");
          setActiveProcess(null);
          setNodes([]);
          setEdges([]);
        }
      }
    } catch (err) {
      console.error("Error refreshing processes:", err);
    }
  }, [selectedProcessId, setNodes, setEdges]);

  useEffect(() => {
    refreshProcessList();
  }, [refreshProcessList]);

  // Manejar clic en botón "+" de una figura (Añadir siguiente figura)
  const handleOpenAddNext = useCallback((sourceNodeId: string, nodeType: string, label: string) => {
    setAddNextSource({ id: sourceNodeId, nodeType, label });
    setAddNextCondition("YES");
  }, []);

  // 2. Cargar detalle del proceso seleccionado con detección de SoD (CUB CNBV)
  const loadProcessDetail = useCallback(
    (id: string, sodActive: boolean = false) => {
      if (!id) return;
      fetch(`/api/processes?processId=${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.process) {
            setActiveProcess(data.process);

            // Algoritmo Auditor de Segregación de Funciones (SoD)
            const outgoingMap: Record<string, string[]> = {};
            data.process.flowEdges.forEach((e: any) => {
              if (!outgoingMap[e.sourceNodeId]) outgoingMap[e.sourceNodeId] = [];
              outgoingMap[e.sourceNodeId].push(e.targetNodeId);
            });

            const nodeById: Record<string, any> = {};
            data.process.flowNodes.forEach((n: any) => {
              nodeById[n.id] = n;
            });

            let totalSodDetected = 0;
            const sodExplanations: Record<string, string[]> = {};

            data.process.flowNodes.forEach((fn: any) => {
              const conflicts: string[] = [];
              const role = (fn.responsibleRole || "").toUpperCase();
              const stage = fn.creditStage || "";

              // Regla SoD 1: Promoción conectando directo a Aprobación/Dispersión sin Control Intermedio
              if (role.includes("PROMO") || stage === "PROMOTION") {
                const targets = outgoingMap[fn.id] || [];
                targets.forEach((targetId) => {
                  const target = nodeById[targetId];
                  if (target) {
                    const tRole = (target.responsibleRole || "").toUpperCase();
                    const tStage = target.creditStage || "";
                    const isApprovalOrExec =
                      tRole.includes("APPROV") ||
                      tRole.includes("APROB") ||
                      tRole.includes("EXEC") ||
                      tRole.includes("EJEC") ||
                      tRole.includes("DISPERS") ||
                      tStage === "APPROVAL" ||
                      tStage === "INSTRUMENTATION";
                    if (isApprovalOrExec && target.nodeType !== "CONTROL_POINT") {
                      conflicts.push(
                        `Infracción CUB Art. 65: Conexión directa desde originación a aprobación/ejecución (${target.label}) sin estación independiente de análisis ni control dual.`
                      );
                    }
                  }
                });
              }

              // Regla SoD 2: Paso con riesgo crítico en zona Roja/Naranja con controles no formalizados (NF) o nulos
              const hasCriticalRisk = fn.riskEvents?.some(
                (r: any) => r.residualZone === "RED" || r.residualZone === "ORANGE"
              );
              const hasUnformalizedControls = fn.controls?.some((c: any) => !c.isFormalized);
              const lacksControls = !fn.controls || fn.controls.length === 0;

              if (hasCriticalRisk && (hasUnformalizedControls || lacksControls)) {
                conflicts.push(
                  "Infracción CUB Art. 88: Paso operativo operando con riesgos en zona Roja/Naranja sin controles formalizados (NF) aprobados por la UAIR."
                );
              }

              if (conflicts.length > 0) {
                sodExplanations[fn.id] = conflicts;
                totalSodDetected++;
              }
            });

            setSodViolationsCount(totalSodDetected);

            const mappedNodes = data.process.flowNodes.map((fn: any) => {
              const riskCount = fn.riskEvents?.length || 0;
              const maxResidualZone =
                riskCount > 0
                  ? fn.riskEvents.some((r: any) => r.residualZone === "RED")
                    ? "RED"
                    : fn.riskEvents.some((r: any) => r.residualZone === "ORANGE")
                    ? "ORANGE"
                    : fn.riskEvents.some((r: any) => r.residualZone === "YELLOW")
                    ? "YELLOW"
                    : "GREEN"
                  : "GREEN";

              const totalPEA = fn.riskEvents?.reduce(
                (s: number, r: any) => s + (r.expectedAnnualLossPEA || 0),
                0
              ) || 0;
              const totalPMA = fn.riskEvents?.reduce(
                (s: number, r: any) => s + (r.maxAnnualLossPMA || 0),
                0
              ) || 0;

              const hasSodViolation = Boolean(sodExplanations[fn.id]);

              return {
                id: fn.id,
                type: "bankingNode",
                position: { x: fn.positionX, y: fn.positionY },
                data: {
                  rawNode: fn,
                  label: fn.label,
                  description: fn.description,
                  nodeType: fn.nodeType,
                  creditStage: fn.creditStage,
                  responsibleRole: fn.responsibleRole,
                  systemUsed: fn.systemUsed,
                  styleConfig: fn.styleConfig,
                  riskCount,
                  maxResidualZone,
                  totalPEA,
                  totalPMA,
                  hasFraudCheckpoint: fn.nodeType === "FRAUD_CHECKPOINT",
                  hasSodViolation,
                  sodAuditActive: sodActive,
                  sodFindings: sodExplanations[fn.id] || [],
                  onAddNext: handleOpenAddNext,
                },
              };
            });

            const mappedEdges = data.process.flowEdges.map((fe: any) => ({
              id: fe.id,
              source: fe.sourceNodeId,
              target: fe.targetNodeId,
              label: fe.conditionLabel || undefined,
              animated: fe.animated,
              style: { stroke: "#3299A8", strokeWidth: 2 },
            }));

            setNodes(mappedNodes);
            setEdges(mappedEdges);
          }
        });
    },
    [setNodes, setEdges, handleOpenAddNext]
  );

  useEffect(() => {
    if (selectedProcessId) {
      loadProcessDetail(selectedProcessId, sodAuditActive);
      setIsDrawerOpen(false);
      setSelectedNode(null);
      setAuditResult(null);
    }
  }, [selectedProcessId, loadProcessDetail, sodAuditActive]);

  // Manejar conexión interactiva manual entre nodos
  const onConnect = useCallback(
    async (params: Connection) => {
      if (!selectedProcessId || !params.source || !params.target) return;
      setEdges((eds) =>
        addEdge(
          { ...params, animated: true, style: { stroke: "#3299A8", strokeWidth: 2 } },
          eds
        )
      );
      try {
        await fetch("/api/processes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "CREATE_EDGE",
            processId: selectedProcessId,
            sourceNodeId: params.source,
            targetNodeId: params.target,
          }),
        });
        setStatusBanner("Conexión entre nodos guardada en base de datos.");
        setTimeout(() => setStatusBanner(null), 3000);
      } catch (err) {
        console.error("Error creating edge:", err);
      }
    },
    [selectedProcessId, setEdges]
  );

  // Guardar posiciones arrastradas
  const handleSaveLayout = async () => {
    if (!nodes.length) return;
    setSavingPositions(true);
    try {
      const payload = nodes.map((n) => ({
        id: n.id,
        positionX: Math.round(n.position.x),
        positionY: Math.round(n.position.y),
      }));
      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_NODE_POSITIONS",
          nodes: payload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusBanner("Layout de posiciones guardado exitosamente en SQLite.");
        setTimeout(() => setStatusBanner(null), 3000);
      }
    } catch (err) {
      console.error("Error saving positions:", err);
    } finally {
      setSavingPositions(false);
    }
  };

  // Clic en cualquier nodo para abrir Drawer y cargar formulario contextual
  const onNodeClick = (_: any, node: any) => {
    const raw = node.data.rawNode;
    setSelectedNode({
      ...raw,
      hasSodViolation: node.data.hasSodViolation,
      sodFindings: node.data.sodFindings,
    });

    // Cargar datos al formulario de edición contextual
    setEditLabel(raw.label || "");
    setEditDescription(raw.description || "");
    setEditNodeType(raw.nodeType || "TASK_STEP");
    setEditRole(raw.responsibleRole || "ANALYSIS");
    setEditSystem(raw.systemUsed || "Core Bancario T24");
    setEditCreditStage(raw.creditStage || "NOT_APPLICABLE");
    const parsedConfig = typeof raw.styleConfig === "string" ? JSON.parse(raw.styleConfig || "{}") : raw.styleConfig || {};
    setEditStyleConfig(parsedConfig);

    setDrawerTab("CONFIG");
    setIsDrawerOpen(true);
    setAuditResult(null);
    setShowAddRiskForm(false);
  };

  // Guardar cambios del formulario contextual de la figura
  const handleSaveNodeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;
    setSavingNodeEdit(true);
    try {
      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_NODE",
          nodeId: selectedNode.id,
          label: editLabel,
          description: editDescription,
          nodeType: editNodeType,
          creditStage: editCreditStage,
          responsibleRole: editRole,
          systemUsed: editSystem,
          styleConfig: editStyleConfig,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusBanner("Datos y configuración de la figura guardados.");
        setTimeout(() => setStatusBanner(null), 3000);
        loadProcessDetail(selectedProcessId, sodAuditActive);
        setSelectedNode(data.node);
      }
    } catch (err) {
      console.error("Error updating node:", err);
    } finally {
      setSavingNodeEdit(false);
    }
  };

  // Eliminar nodo
  const handleDeleteNode = async () => {
    if (!selectedNode || !confirm(`¿Deseas eliminar la figura "${selectedNode.label}" del diagrama?`)) return;
    try {
      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_NODE",
          nodeId: selectedNode.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsDrawerOpen(false);
        setSelectedNode(null);
        setStatusBanner("Figura eliminada del proceso.");
        setTimeout(() => setStatusBanner(null), 3000);
        loadProcessDetail(selectedProcessId, sodAuditActive);
      }
    } catch (err) {
      console.error("Error deleting node:", err);
    }
  };

  // Insertar figura conectada (Miro / Canva Popover)
  const handleSelectShapeFromMenu = async (shapeType: string) => {
    if (!addNextSource || !selectedProcessId) return;

    try {
      const sourceNode = nodes.find((n) => n.id === addNextSource.id);
      const isNoBranch = addNextSource.nodeType === "DECISION_GATEWAY" && addNextCondition === "NO";

      const nextX = sourceNode ? sourceNode.position.x + 320 : 350;
      const nextY = sourceNode ? sourceNode.position.y + (isNoBranch ? 150 : 0) : 100;

      let defaultLabel = "Nueva Actividad";
      let defaultDesc = "Paso operativo agregado vía selector in-situ";
      let defaultRole = "ANALYSIS";
      let defaultSystem = "Core Bancario T24";
      let defaultStage = "EVALUATION";
      let initialConfig: any = {};

      if (shapeType === "DECISION_GATEWAY") {
        defaultLabel = "¿Cumple Criterios Facultados?";
        defaultDesc = "Evaluación paramétrica de aprobación o escalamiento";
        defaultRole = "APPROVAL";
        defaultStage = "APPROVAL";
        initialConfig = {
          decisionQuestion: "¿Cumple Criterios Facultados?",
          yesCriteria: "Pasa a siguiente estación",
          noCriteria: "Escalamiento o Rechazo",
          thresholdMXN: 5000000,
        };
      } else if (shapeType === "CONTROL_POINT") {
        defaultLabel = "Punto de Control Dual CUB";
        defaultDesc = "Validación preventiva independiente de 2ª Línea UAIR";
        defaultRole = "CONTROL_2ND_LINE";
        defaultStage = "APPROVAL";
        initialConfig = { isFormalized: true, periodicity: "d+0", controlNature: "PREVENTIVE_AUTOMATED" };
      } else if (shapeType === "FRAUD_CHECKPOINT") {
        defaultLabel = "Candado Fraude Anexo 12-E";
        defaultDesc = "Monitoreo preventivo de conductas observables y listas negras";
        defaultRole = "CONTROL_2ND_LINE";
        initialConfig = { isFormalized: true, periodicity: "d+0" };
      } else if (shapeType === "EXTERNAL_SYSTEM") {
        defaultLabel = "Interfaz Core Bancario / SPEI";
        defaultDesc = "Transmisión telemática de datos o dispersión de fondos";
        defaultRole = "EXECUTION";
        defaultSystem = "Banxico SPEI / Core T24";
        initialConfig = { interfaceType: "REST_SYNC", rtoHours: 2 };
      } else if (shapeType === "START_END") {
        defaultLabel = "Fin: Cierre Operativo";
        defaultDesc = "Conclusión formal del expediente y archivo digital";
        defaultRole = "EXECUTION";
        initialConfig = { stage: "END" };
      }

      const conditionLabel =
        addNextSource.nodeType === "DECISION_GATEWAY"
          ? addNextCondition === "YES"
            ? "Sí / Cumple"
            : "No / Requiere Comité"
          : null;

      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_CONNECTED_NODE",
          processId: selectedProcessId,
          sourceNodeId: addNextSource.id,
          nodeType: shapeType,
          label: defaultLabel,
          description: defaultDesc,
          responsibleRole: defaultRole,
          systemUsed: defaultSystem,
          creditStage: defaultStage,
          conditionLabel,
          positionX: nextX,
          positionY: nextY,
          styleConfig: initialConfig,
        }),
      });

      const data = await res.json();
      if (data.success && data.node) {
        setAddNextSource(null);
        setStatusBanner(`Figura "${defaultLabel}" agregada y conectada.`);
        setTimeout(() => setStatusBanner(null), 3000);
        loadProcessDetail(selectedProcessId, sodAuditActive);

        // Abrir Drawer inmediatamente sobre el nuevo nodo
        setSelectedNode(data.node);
        setEditLabel(data.node.label);
        setEditDescription(data.node.description || "");
        setEditNodeType(data.node.nodeType);
        setEditRole(data.node.responsibleRole || "ANALYSIS");
        setEditSystem(data.node.systemUsed || "Core Bancario T24");
        setEditCreditStage(data.node.creditStage || "NOT_APPLICABLE");
        setEditStyleConfig(initialConfig);
        setDrawerTab("CONFIG");
        setIsDrawerOpen(true);
      }
    } catch (err) {
      console.error("Error creating connected shape:", err);
    }
  };

  // Abrir modal de entrevista IA para generar nuevo proceso
  const handleOpenAiProcessGenerator = () => {
    setIsAiGenerateModalOpen(true);
    if (aiChatMessages.length === 0) {
      setAiChatMessages([
        {
          role: "assistant",
          content: `¡Hola! Soy el Arquitecto de Procesos y Riesgos Bancarios con IA de Banco B×+.
Describe el proceso que deseas modelar (ej. "Originación de Arrendamiento Puro PyME", "Apertura Digital de Cuenta con SPEI y Biometría", "Reestructura de Cartera Agropecuaria FIRA").
Te formularé de 3 a 4 preguntas clave para estructurar el diagrama con compuertas de decisión, puntos de control y sistemas TI conforme a la CUB.`,
          suggestedChips: [
            "Originación de Arrendamiento Puro PyME",
            "Apertura Remota de Cuenta y SPEI Móvil",
            "Crédito Agropecuario con Garantía Líquida FIRA",
            "Operaciones de Mesa de Dinero y Fondeo",
          ],
        },
      ]);
    }
  };

  // Enviar mensaje en la entrevista de generación de proceso
  const handleSendInterviewMessage = async (textToSend?: string) => {
    const messageText = textToSend || aiChatInput;
    if (!messageText.trim() || isGeneratingProcess) return;

    const newMessages = [...aiChatMessages, { role: "user" as const, content: messageText.trim() }];
    setAiChatMessages(newMessages);
    setAiChatInput("");
    setIsGeneratingProcess(true);

    try {
      const res = await fetch("/api/copilot/generate-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "INTERVIEW",
          processDescription: messageText.trim(),
          messages: newMessages,
        }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setAiChatMessages([
          ...newMessages,
          {
            role: "assistant",
            content: data.reply,
            suggestedChips: data.suggestedQuickReplies || [],
          },
        ]);
      }
    } catch (err) {
      console.error("Error in AI interview:", err);
    } finally {
      setIsGeneratingProcess(false);
    }
  };

  // Construir diagrama completo con IA
  const handleBuildProcessNow = async () => {
    const contextFromInput = aiChatInput.trim();
    const lastUserMessage =
      contextFromInput ||
      [...aiChatMessages].reverse().find((m) => m.role === "user")?.content ||
      "Proceso Bancario B×+";
    setIsGeneratingProcess(true);

    try {
      const res = await fetch("/api/copilot/generate-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BUILD",
          processDescription: lastUserMessage,
          messages: aiChatMessages,
        }),
      });

      const data = await res.json();
      if (data.success && data.processId) {
        setIsAiGenerateModalOpen(false);
        setStatusBanner(data.message || "Proceso generado exitosamente en SQLite.");
        setTimeout(() => setStatusBanner(null), 4000);
        await refreshProcessList(data.processId);
      } else {
        alert(data.error || "Ocurrió un error al generar el proceso");
      }
    } catch (err: any) {
      console.error("Error building process with AI:", err);
      alert("Error de conexión al generar proceso: " + (err?.message || "Intente nuevamente"));
    } finally {
      setIsGeneratingProcess(false);
    }
  };

  // Ejecutar Evaluador de Riesgos IA (Proceso Completo Cross-Process)
  const handleRunFullProcessEvaluation = async () => {
    if (!selectedProcessId) return;
    setIsEvaluatorModalOpen(true);
    setIsEvaluatingProcess(true);
    setEvaluationResult(null);

    try {
      const res = await fetch("/api/copilot/evaluate-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processId: selectedProcessId,
        }),
      });

      const data = await res.json();
      if (data.success && data.evaluation) {
        setEvaluationResult(data.evaluation);
      }
    } catch (err) {
      console.error("Error evaluating process with AI:", err);
    } finally {
      setIsEvaluatingProcess(false);
    }
  };

  // Anclar un riesgo detectado por el evaluador
  const handleAnchorDetectedRisk = async (riskItem: any, shouldReload: boolean = true) => {
    try {
      setAnchoringRiskId(riskItem.title);
      const targetProcessId = activeProcess?.id || selectedProcessId;
      const res = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: riskItem.title,
          cause: riskItem.cause,
          eventDescription: riskItem.eventDescription,
          consequence: riskItem.consequence,
          taxonomyId: riskItem.taxonomyId,
          origin: "PROCESSES",
          businessUnitId: riskItem.businessUnitId || activeProcess?.macroProcess?.businessUnitId,
          processId: targetProcessId,
          processNodeId: riskItem.processNodeId,
          inherentProbability: riskItem.inherentProbability || 3,
          inherentImpact: riskItem.inherentImpact || 4,
          avgFinancialImpactMXN: riskItem.expectedAnnualLossPEA || 800000,
          worstCaseImpactMXN: riskItem.maxAnnualLossPMA || 4000000,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusBanner(`Riesgo "${riskItem.title}" anclado al nodo y a la Matriz Viva.`);
        setTimeout(() => setStatusBanner(null), 3000);
        if (shouldReload) {
          loadProcessDetail(targetProcessId, sodAuditActive);
          setTimeout(() => {
            fitView({ padding: 0.15, duration: 400 });
          }, 200);
        }
      }
    } catch (err) {
      console.error("Error anchoring detected risk:", err);
    } finally {
      setAnchoringRiskId(null);
    }
  };

  // Anclar todos los riesgos detectados
  const handleAnchorAllDetectedRisks = async () => {
    if (!evaluationResult?.detectedRisks) return;
    const targetProcessId = activeProcess?.id || selectedProcessId;
    for (const r of evaluationResult.detectedRisks) {
      await handleAnchorDetectedRisk(r, false);
    }
    setIsEvaluatorModalOpen(false);
    setStatusBanner("Todos los riesgos detectados han sido anclados al proceso y a la Matriz Viva.");
    setTimeout(() => setStatusBanner(null), 4000);
    // Recargar el diagrama completo una sola vez al finalizar el anclaje masivo
    loadProcessDetail(targetProcessId, sodAuditActive);
    setTimeout(() => {
      fitView({ padding: 0.15, duration: 400 });
    }, 200);
  };

  // Eliminar el proceso actual seleccionado
  const handleDeleteCurrentProcess = async () => {
    if (!selectedProcessId) return;
    setIsDeletingProcess(true);
    try {
      const res = await fetch(`/api/processes?processId=${selectedProcessId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleteProcessModalOpen(false);
        setStatusBanner(data.message || "Proceso eliminado exitosamente.");
        setTimeout(() => setStatusBanner(null), 4500);
        setSelectedNode(null);
        setIsDrawerOpen(false);
        await refreshProcessList();
      } else {
        alert(data.error || "Error al eliminar el proceso");
      }
    } catch (err: any) {
      console.error("Error deleting process:", err);
      alert("Error de red al intentar eliminar el proceso.");
    } finally {
      setIsDeletingProcess(false);
    }
  };

  // Auditar nodo individual con Copilot (Drawer)
  const handleAuditNode = async () => {
    if (!selectedNode) return;
    try {
      setAiAuditing(true);
      const res = await fetch("/api/copilot/audit-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: selectedNode.id }),
      });
      const data = await res.json();
      if (data.success) {
        setAuditResult(data.auditResult);
      }
    } catch (e) {
      console.error("Error auditing node:", e);
    } finally {
      setAiAuditing(false);
    }
  };

  const handleInsertSuggestion = async (type: "RISK" | "ACTION_PLAN", item: any) => {
    try {
      const res = await fetch("/api/copilot/insert-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          item,
          processNodeId: selectedNode.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusBanner("Elemento insertado en la base de datos de Banco B×+.");
        setTimeout(() => setStatusBanner(null), 3000);
        loadProcessDetail(selectedProcessId, sodAuditActive);
      }
    } catch (e) {
      console.error("Error inserting suggestion:", e);
    }
  };

  // Formulario de creación de riesgo en el nodo
  const handleCreateRiskOnNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode || !activeProcess) return;

    try {
      const res = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newRiskTitle,
          cause: newRiskCause,
          eventDescription: newRiskEvent,
          consequence: newRiskConsequence,
          taxonomyId: (await (await fetch("/api/risks")).json()).risks[0]?.taxonomyId,
          origin: "PROCESSES",
          businessUnitId: activeProcess.macroProcess.businessUnitId,
          processId: activeProcess.id,
          processNodeId: selectedNode.id,
          inherentProbability: newRiskProb,
          inherentImpact: newRiskImp,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddRiskForm(false);
        setNewRiskTitle("");
        setNewRiskCause("");
        setNewRiskEvent("");
        setNewRiskConsequence("");
        loadProcessDetail(selectedProcessId, sodAuditActive);
        setStatusBanner("Riesgo anclado exitosamente al nodo.");
        setTimeout(() => setStatusBanner(null), 3000);
      }
    } catch (e) {
      console.error("Error adding risk to node:", e);
    }
  };

  // Crear nodo manual clásico
  const handleCreateNewNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeLabel || !selectedProcessId) return;

    try {
      const nextX = (nodes.length % 3) * 320 + 80;
      const nextY = Math.floor(nodes.length / 3) * 180 + 100;

      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_NODE",
          processId: selectedProcessId,
          label: newNodeLabel,
          description: newNodeDescription || "Paso operativo añadido",
          nodeType: newNodeType,
          responsibleRole: newNodeRole,
          creditStage: newNodeCreditStage,
          systemUsed: newNodeSystem,
          positionX: nextX,
          positionY: nextY,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsNewNodeModalOpen(false);
        setNewNodeLabel("");
        setNewNodeDescription("");
        loadProcessDetail(selectedProcessId, sodAuditActive);
        setStatusBanner("Nuevo nodo bancario insertado en el lienzo.");
        setTimeout(() => setStatusBanner(null), 3000);
      }
    } catch (err) {
      console.error("Error creating node:", err);
    }
  };

  const processOptions = processes.map((p) => ({
    value: p.id,
    label: `${p.code}: ${p.name}`,
  }));

  const nodeTypeOptions = [
    { value: "TASK_STEP", label: "▭ Paso de Acción Operativa (TASK_STEP)" },
    { value: "DECISION_GATEWAY", label: "◆ Rombo de Decisión (DECISION_GATEWAY)" },
    { value: "CONTROL_POINT", label: "⬡ Punto de Control CUB (CONTROL_POINT)" },
    { value: "FRAUD_CHECKPOINT", label: "⛨ Control de Fraude Anexo 12-E" },
    { value: "EXTERNAL_SYSTEM", label: "▱ Sistema TI / API SPEI" },
    { value: "START_END", label: "◯ Inicio / Fin de Proceso" },
  ];

  const roleOptions = [
    { value: "PROMOTION", label: "Promoción y Originación (1ª Línea)" },
    { value: "ANALYSIS", label: "Análisis de Riesgos y Mesa de Control" },
    { value: "APPROVAL", label: "Comité de Crédito / Aprobación Facultada" },
    { value: "EXECUTION", label: "Mesa de Operaciones / Dispersión" },
    { value: "CONTROL_2ND_LINE", label: "Validación UAIR (2ª Línea)" },
  ];

  const creditStageOptions = [
    { value: "NOT_APPLICABLE", label: "No Aplica a Crédito" },
    { value: "PROMOTION", label: "Etapa 1: Promoción" },
    { value: "EVALUATION", label: "Etapa 2: Evaluación" },
    { value: "APPROVAL", label: "Etapa 3: Aprobación" },
    { value: "INSTRUMENTATION", label: "Etapa 4: Instrumentación" },
    { value: "CONTROL_RECOVERY", label: "Etapa 5: Control y Cobranza" },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Status Notification Banner */}
      {statusBanner && (
        <div className="bg-[#1F242B] border-l-4 border-[#C0D725] text-white p-3 rounded-bx shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-[#C0D725] shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button onClick={() => setStatusBanner(null)} className="text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Process Toolbar */}
      <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 flex flex-wrap items-center justify-between gap-4 w-full">
        <div>
          <h2 className="text-base font-bold text-gray-900 font-serif">
            {activeProcess?.name || "Selecciona un Proceso Bancario"}
          </h2>
          {activeProcess?.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{activeProcess.description}</p>
          )}
        </div>

        {/* Process Selector and Interactive Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Procesos */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-600">Proceso:</span>
            <CustomSelect
              value={selectedProcessId}
              onChange={(val) => setSelectedProcessId(val)}
              options={processOptions}
              theme="light"
              className="min-w-[240px]"
              dropdownClassName="w-[320px]"
            />
            {selectedProcessId && (
              <button
                type="button"
                onClick={() => setIsDeleteProcessModalOpen(true)}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-xs font-semibold"
                title={`Eliminar el proceso actual "${activeProcess?.name || ''}"`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar</span>
              </button>
            )}
          </div>

          {/* Botón: Generar Proceso con IA */}
          <button
            onClick={handleOpenAiProcessGenerator}
            className="bg-[#C0D725] hover:bg-[#AEC41D] text-[#1F242B] font-bold text-xs px-3.5 py-1.5 rounded flex items-center gap-1.5 shadow-sm transition-all transform hover:scale-[1.02] cursor-pointer"
            title="Diseñar un proceso bancario completo mediante entrevista interactiva con Gemini"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#1F242B]" />
            <span>Generar Proceso con IA</span>
          </button>

          {/* Botón: Evaluador Riesgos IA (Proceso Completo) */}
          <button
            onClick={handleRunFullProcessEvaluation}
            className="bg-[#1F242B] hover:bg-[#2A313C] text-white font-bold text-xs px-3.5 py-1.5 rounded flex items-center gap-1.5 shadow-sm transition-colors border border-gray-700 cursor-pointer"
            title="Auditoría integral con IA y contexto transversal de todos los procesos de B×+"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#C0D725]" />
            <span>Evaluador Riesgos IA</span>
          </button>

          {/* Botón: Auditoría SoD (CUB) */}
          <button
            onClick={() => setSodAuditActive(!sodAuditActive)}
            className={`text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 border transition-all cursor-pointer ${
              sodAuditActive
                ? "bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-400"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
            }`}
            title="Auditoría normativa de Segregación de Funciones según CUB Art. 65 y Art. 88"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${sodAuditActive ? "text-rose-600" : "text-gray-500"}`} />
            <span>Auditoría SoD</span>
            {sodViolationsCount > 0 && (
              <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-[3px] font-mono font-semibold">
                {sodViolationsCount}
              </span>
            )}
          </button>

          {/* Botón: Centrar / Ajustar Vista */}
          <button
            type="button"
            onClick={() => fitView({ padding: 0.15, duration: 400 })}
            className="bg-white border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            title="Ajustar y centrar todas las figuras del diagrama en pantalla"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#3299A8]" />
            <span>Centrar Diagrama</span>
          </button>

          {/* Botón: Guardar Layout */}
          <button
            onClick={handleSaveLayout}
            disabled={savingPositions}
            className="bg-white border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {savingPositions ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3299A8]" />
            ) : (
              <Save className="w-3.5 h-3.5 text-[#3299A8]" />
            )}
            <span>Guardar Layout</span>
          </button>

          {/* Botón: + Nuevo Nodo Manual */}
          <button
            onClick={() => setIsNewNodeModalOpen(true)}
            className="bg-white border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#3299A8]" />
            <span>+ Nodo Manual</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="relative w-full h-[740px] bg-white rounded-bx shadow-card border border-gray-200 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-dot-grid w-full h-full"
        >
          <Background color="#CBD5E1" gap={20} size={1} />
          <Controls position="bottom-right" />
          <MiniMap
            position="top-right"
            nodeColor={(n: any) =>
              n.data?.maxResidualZone === "RED"
                ? "#EF4444"
                : n.data?.maxResidualZone === "ORANGE"
                ? "#F97316"
                : n.data?.maxResidualZone === "YELLOW"
                ? "#F59E0B"
                : "#10B981"
            }
            className="bg-white/90 border border-gray-200 rounded shadow"
          />
        </ReactFlow>

        {/* Leyenda Geométrica Flotante */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-md shadow border border-gray-200 text-[11px] space-y-1.5 pointer-events-none select-none">
          <div className="font-bold text-gray-800 border-b border-gray-100 pb-1 font-mono uppercase text-[10px]">
            Simbología de Diagrama de Flujo:
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-emerald-600 font-bold">◯</span>
            <span className="font-medium text-gray-700">Óvalo: Inicio / Fin de Proceso</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-800 font-bold">▭</span>
            <span className="font-medium text-gray-700">Rectángulo: Cuadro de Acción / Tarea</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-indigo-600 font-bold">◆</span>
            <span className="font-medium text-gray-700">Rombo: Compuerta de Decisión (Sí / No)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[#3299A8] font-bold">⬡</span>
            <span className="font-medium text-gray-700">Hexágono: Punto de Control CUB</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-600 font-bold">⛨</span>
            <span className="font-medium text-gray-700">Escudo: Control de Fraude (Anexo 12-E)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-purple-600 font-bold">▱</span>
            <span className="font-medium text-gray-700">Bloque TI: Core T24 / Banxico SPEI</span>
          </div>
          {sodAuditActive && (
            <div className="pt-1 mt-1 border-t border-gray-100 flex items-center gap-1.5 text-rose-700 font-bold">
              <span className="w-2 h-2 rounded-[1px] bg-rose-600 animate-pulse"></span>
              <span>Auditoría SoD Activa (CUB Art. 65 / 88)</span>
            </div>
          )}
        </div>
      </div>

      {/* POPOVER ESTILO MIRO/CANVA: SELECTOR DE FIGURA SIGUIENTE (al dar clic al "+") */}
      {addNextSource && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-5 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
                  Interacción Miro / Canva
                </span>
                <h3 className="text-sm font-bold text-gray-900 font-serif">
                  Conectar Siguiente Figura desde: &quot;{addNextSource.label}&quot;
                </h3>
              </div>
              <button
                onClick={() => setAddNextSource(null)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Si el nodo origen es un Rombo de Decisión, seleccionar rama */}
            {addNextSource.nodeType === "DECISION_GATEWAY" && (
              <div className="bg-indigo-50 border border-indigo-200 p-3 rounded space-y-1.5 text-xs">
                <span className="font-bold text-indigo-900 block">Condición de Salida de la Compuerta:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddNextCondition("YES")}
                    className={`p-2 rounded text-left border font-semibold flex items-center gap-1.5 transition-all ${
                      addNextCondition === "YES"
                        ? "bg-white border-emerald-500 text-emerald-800 shadow-xs ring-1 ring-emerald-400"
                        : "bg-white/60 border-gray-300 text-gray-600"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-[1px] bg-emerald-600"></span>
                    <span>Sí / Cumple Criterio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddNextCondition("NO")}
                    className={`p-2 rounded text-left border font-semibold flex items-center gap-1.5 transition-all ${
                      addNextCondition === "NO"
                        ? "bg-white border-amber-500 text-amber-800 shadow-xs ring-1 ring-amber-400"
                        : "bg-white/60 border-gray-300 text-gray-600"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-[1px] bg-amber-600"></span>
                    <span>No / Escala o Rechaza</span>
                  </button>
                </div>
              </div>
            )}

            {/* Opciones de figuras de diagrama de flujo */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-gray-700 block">Elige la figura a insertar:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectShapeFromMenu("TASK_STEP")}
                  className="p-2.5 rounded border border-gray-200 hover:border-[#1F242B] hover:bg-gray-50 text-left transition-all group flex items-start gap-2"
                >
                  <span className="font-mono text-base font-bold text-gray-800 mt-0.5">▭</span>
                  <div>
                    <div className="font-bold text-gray-900 group-hover:text-[#1F242B]">Cuadro de Acción</div>
                    <div className="text-[10px] text-gray-500">Actividad o trámite operativo</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectShapeFromMenu("DECISION_GATEWAY")}
                  className="p-2.5 rounded border border-gray-200 hover:border-indigo-600 hover:bg-indigo-50/40 text-left transition-all group flex items-start gap-2"
                >
                  <span className="font-mono text-base font-bold text-indigo-600 mt-0.5">◆</span>
                  <div>
                    <div className="font-bold text-gray-900 group-hover:text-indigo-700">Rombo de Decisión</div>
                    <div className="text-[10px] text-gray-500">Bifurcación lógica (¿...?)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectShapeFromMenu("CONTROL_POINT")}
                  className="p-2.5 rounded border border-gray-200 hover:border-[#3299A8] hover:bg-cyan-50/40 text-left transition-all group flex items-start gap-2"
                >
                  <span className="font-mono text-base font-bold text-[#3299A8] mt-0.5">⬡</span>
                  <div>
                    <div className="font-bold text-gray-900 group-hover:text-[#3299A8]">Punto de Control</div>
                    <div className="text-[10px] text-gray-500">Validación dual / Preventiva</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectShapeFromMenu("FRAUD_CHECKPOINT")}
                  className="p-2.5 rounded border border-gray-200 hover:border-amber-600 hover:bg-amber-50/40 text-left transition-all group flex items-start gap-2"
                >
                  <span className="font-mono text-base font-bold text-amber-600 mt-0.5">⛨</span>
                  <div>
                    <div className="font-bold text-gray-900 group-hover:text-amber-700">Control de Fraude</div>
                    <div className="text-[10px] text-gray-500">Candado Anexo 12-E / PLD</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectShapeFromMenu("EXTERNAL_SYSTEM")}
                  className="p-2.5 rounded border border-gray-200 hover:border-purple-600 hover:bg-purple-50/40 text-left transition-all group flex items-start gap-2"
                >
                  <span className="font-mono text-base font-bold text-purple-600 mt-0.5">▱</span>
                  <div>
                    <div className="font-bold text-gray-900 group-hover:text-purple-700">Sistema TI / API</div>
                    <div className="text-[10px] text-gray-500">Core T24 / Banxico SPEI</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectShapeFromMenu("START_END")}
                  className="p-2.5 rounded border border-gray-200 hover:border-emerald-600 hover:bg-emerald-50/40 text-left transition-all group flex items-start gap-2"
                >
                  <span className="font-mono text-base font-bold text-emerald-600 mt-0.5">◯</span>
                  <div>
                    <div className="font-bold text-gray-900 group-hover:text-emerald-700">Fin del Proceso</div>
                    <div className="text-[10px] text-gray-500">Conclusión formal del flujo</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GENERADOR CONVERSACIONAL DE PROCESOS CON IA */}
      {isAiGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200">
            {/* Header del Chat */}
            <div className="flex items-start justify-between pb-3 border-b border-gray-200">
              <div>
                <span className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
                  B×+ Process AI Architect (Gemini 2.5)
                </span>
                <h3 className="text-lg font-bold text-gray-900 font-serif">
                  Generar Nuevo Proceso Bancario con IA
                </h3>
              </div>
              <button
                onClick={() => setIsAiGenerateModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Historial de la Entrevista */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded border border-gray-200 max-h-[420px] text-xs">
              {aiChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#1F242B] text-white"
                        : "bg-white text-gray-800 border border-gray-200 shadow-xs"
                    }`}
                  >
                    <div className="font-bold text-[10px] opacity-75 mb-1 font-mono uppercase">
                      {msg.role === "user" ? "Usuario" : "Arquitecto de Procesos B×+"}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed text-[12px]">{cleanAssistantText(msg.content)}</div>

                    {/* Chips de Respuestas Rápidas Sugeridas */}
                    {msg.suggestedChips && msg.suggestedChips.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                        {msg.suggestedChips.map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => handleSendInterviewMessage(chip)}
                            className="bg-[#F5F7F9] hover:bg-[#C0D725]/20 text-[#1F242B] border border-gray-300 hover:border-[#AEC41D] text-[10px] px-2 py-0.5 rounded font-mono transition-colors"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isGeneratingProcess && (
                <div className="flex items-center gap-2 text-xs text-gray-500 italic p-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3299A8]" />
                  <span>El Arquitecto IA está analizando la estructura del proceso...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input y Botón de Construcción */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-end gap-2">
                <textarea
                  ref={chatTextareaRef}
                  rows={1}
                  placeholder="Escribe tu respuesta o el nombre del proceso... (Enter para enviar, Shift+Enter para salto de línea)"
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendInterviewMessage();
                    }
                  }}
                  disabled={isGeneratingProcess}
                  className="flex-1 p-2.5 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#3299A8] resize-none overflow-y-auto leading-relaxed bg-white text-gray-800"
                  style={{ minHeight: "38px", maxHeight: "130px" }}
                />
                <button
                  type="button"
                  onClick={() => handleSendInterviewMessage()}
                  disabled={isGeneratingProcess || !aiChatInput.trim()}
                  className="h-[38px] px-3.5 bg-[#1F242B] text-white rounded font-bold text-xs hover:bg-[#2A313C] disabled:opacity-50 flex items-center justify-center gap-1 shrink-0 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar</span>
                </button>
              </div>

              {/* Botón Maestro de Construcción */}
              <button
                type="button"
                onClick={handleBuildProcessNow}
                disabled={isGeneratingProcess}
                className="w-full py-2.5 bg-[#C0D725] hover:bg-[#AEC41D] text-[#1F242B] font-bold text-xs rounded shadow-sm flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] disabled:opacity-50"
              >
                {isGeneratingProcess ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#1F242B]" />
                    <span>Construyendo figuras y persistiendo en SQLite...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-[#1F242B]" />
                    <span>Ya tengo suficiente contexto: Construir Diagrama Completo Ahora</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EVALUADOR INTEGRAL DE RIESGOS IA (CROSS-PROCESS) */}
      {isEvaluatorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200">
            {/* Header del Evaluador */}
            <div className="flex items-start justify-between pb-3 border-b border-gray-200">
              <div>
                <span className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
                  Evaluador Integral de Riesgos IA (Cross-Process)
                </span>
                <h3 className="text-lg font-bold text-gray-900 font-serif">
                  Auditoría End-to-End: &quot;{activeProcess?.name}&quot;
                </h3>
              </div>
              <button
                onClick={() => setIsEvaluatorModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido de la Evaluación */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {isEvaluatingProcess ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#3299A8] mx-auto" />
                  <p className="font-bold text-gray-800">
                    Auditando diagrama con Gemini 2.5 y cruzando dependencias con los demás procesos de Banco B×+...
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Evaluando compuertas de decisión, fallas en Core T24 / SPEI y brechas de segregación CUB.
                  </p>
                </div>
              ) : evaluationResult ? (
                <>
                  {/* Diagnóstico Ejecutivo */}
                  <div className="bg-[#1F242B] text-white p-4 rounded-lg shadow-sm space-y-1.5">
                    <span className="text-[10px] font-mono text-[#C0D725] uppercase tracking-wider font-bold">
                      Diagnóstico Ejecutivo Institucional
                    </span>
                    <p className="leading-relaxed text-gray-200">{evaluationResult.executiveDiagnosis}</p>
                  </div>

                  {/* Hallazgos Transversales (Cross-Process) */}
                  {evaluationResult.crossProcessInsights && evaluationResult.crossProcessInsights.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg space-y-2">
                      <span className="text-[10px] font-mono text-amber-900 uppercase tracking-wider font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Dependencias y Contagio Transversal (Cross-Process B×+)</span>
                      </span>
                      <ul className="text-amber-950 list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                        {evaluationResult.crossProcessInsights.map((insight: string, idx: number) => (
                          <li key={idx}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tarjetas de Riesgos Detectados Nodo por Nodo */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800 uppercase tracking-wide font-mono text-[11px]">
                        Riesgos Específicos Detectados ({evaluationResult.detectedRisks?.length || 0}):
                      </span>
                      <button
                        type="button"
                        onClick={handleAnchorAllDetectedRisks}
                        className="bg-[#C0D725] hover:bg-[#AEC41D] text-[#1F242B] font-bold text-xs px-3 py-1 rounded shadow-xs transition-colors"
                      >
                        + Anclar Todos los Riesgos al Proceso
                      </button>
                    </div>

                    <div className="space-y-3">
                      {evaluationResult.detectedRisks?.map((riskItem: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-xs space-y-2 hover:border-[#3299A8] transition-colors"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <span className="text-[9px] font-mono uppercase bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200 font-semibold mr-1.5">
                                Nodo: {riskItem.nodeLabel}
                              </span>
                              <span className="text-[9px] font-mono uppercase bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 font-semibold">
                                {riskItem.riskType}
                              </span>
                              <h4 className="font-bold text-gray-900 mt-1 text-sm font-serif">
                                {riskItem.title}
                              </h4>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAnchorDetectedRisk(riskItem)}
                              disabled={anchoringRiskId === riskItem.title}
                              className="bg-[#1F242B] hover:bg-[#2A313C] text-white font-bold text-[10px] px-2.5 py-1 rounded transition-colors disabled:opacity-50 shrink-0"
                            >
                              {anchoringRiskId === riskItem.title ? "Anclando..." : "+ Anclar a este Nodo"}
                            </button>
                          </div>

                          <div className="text-[11px] space-y-1 text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-100">
                            <div>
                              <strong className="text-gray-800">Causa:</strong> {riskItem.cause}
                            </div>
                            <div>
                              <strong className="text-gray-800">Evento:</strong> {riskItem.eventDescription}
                            </div>
                            <div>
                              <strong className="text-gray-800">Consecuencia:</strong> {riskItem.consequence}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between text-[10px] font-mono pt-1 text-gray-600 border-t border-gray-100">
                            <div className="flex items-center gap-3">
                              <span>Prob: {riskItem.inherentProbability}/5</span>
                              <span>Imp: {riskItem.inherentImpact}/5</span>
                              <span>PEA: {formatMXN(riskItem.expectedAnnualLossPEA)}</span>
                              <span className="font-bold text-orange-700">
                                PMA: {formatMXN(riskItem.maxAnnualLossPMA)}
                              </span>
                            </div>

                            {riskItem.isQuickWin && (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Sugiere Quick-Win
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* INSPECTOR CONTEXTUAL LATERAL (DRAWER) CON CONFIGURACIÓN DE LA FIGURA */}
      {isDrawerOpen && selectedNode && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-gray-200 p-6 overflow-y-auto space-y-4 animate-in slide-in-from-right duration-300">
          {/* Header del Drawer */}
          <div className="flex items-start justify-between pb-3 border-b border-gray-200">
            <div>
              <span className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
                Inspector Contextual de Figura
              </span>
              <h3 className="text-base font-bold text-gray-900 font-serif leading-snug mt-0.5">
                {selectedNode.label}
              </h3>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pestañas del Drawer */}
          <div className="flex border-b border-gray-200 text-xs">
            <button
              type="button"
              onClick={() => setDrawerTab("CONFIG")}
              className={`flex-1 py-2 font-bold text-center border-b-2 transition-colors ${
                drawerTab === "CONFIG"
                  ? "border-[#3299A8] text-[#3299A8]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Configuración & Lógica
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab("COPILOT")}
              className={`flex-1 py-2 font-bold text-center border-b-2 transition-colors ${
                drawerTab === "COPILOT"
                  ? "border-[#3299A8] text-[#3299A8]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Auditoría Copilot
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab("RISKS")}
              className={`flex-1 py-2 font-bold text-center border-b-2 transition-colors ${
                drawerTab === "RISKS"
                  ? "border-[#3299A8] text-[#3299A8]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Riesgos ({selectedNode.riskEvents?.length || 0})
            </button>
          </div>

          {/* TAB 1: FORMULARIO DINÁMICO ADAPTADO A LA LÓGICA DE LA FIGURA */}
          {drawerTab === "CONFIG" && (
            <form onSubmit={handleSaveNodeEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Nombre / Título de la Figura:</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  required
                  className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-[#3299A8]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Tipo de Figura Geométrica:</label>
                <CustomSelect
                  options={nodeTypeOptions}
                  value={editNodeType}
                  onChange={setEditNodeType}
                  theme="light"
                />
              </div>

              {/* CAMPOS ESPECÍFICOS SEGÚN EL TIPO DE FIGURA */}
              {editNodeType === "DECISION_GATEWAY" && (
                <div className="bg-indigo-50 border border-indigo-200 p-3 rounded space-y-2.5">
                  <span className="text-[10px] font-mono text-indigo-900 uppercase tracking-wider font-bold">
                    ◆ Parámetros del Rombo de Decisión
                  </span>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-0.5">Pregunta / Regla Lógica:</label>
                    <input
                      type="text"
                      value={editStyleConfig.decisionQuestion || editLabel}
                      onChange={(e) => setEditStyleConfig({ ...editStyleConfig, decisionQuestion: e.target.value })}
                      placeholder="¿Monto > $5,000,000 MXN o Score ASG >= 75?"
                      className="w-full p-1.5 border rounded bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-0.5">Criterio Rama Sí (Positiva):</label>
                    <input
                      type="text"
                      value={editStyleConfig.yesCriteria || ""}
                      onChange={(e) => setEditStyleConfig({ ...editStyleConfig, yesCriteria: e.target.value })}
                      placeholder="Pasa a validación facultada"
                      className="w-full p-1.5 border rounded bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-0.5">Criterio Rama No (Negativa/Escala):</label>
                    <input
                      type="text"
                      value={editStyleConfig.noCriteria || ""}
                      onChange={(e) => setEditStyleConfig({ ...editStyleConfig, noCriteria: e.target.value })}
                      placeholder="Escala a Comité de Riesgos CAIR"
                      className="w-full p-1.5 border rounded bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-0.5">Umbral Monetario (MXN):</label>
                    <input
                      type="number"
                      value={editStyleConfig.thresholdMXN || 0}
                      onChange={(e) => setEditStyleConfig({ ...editStyleConfig, thresholdMXN: Number(e.target.value) })}
                      className="w-full p-1.5 border rounded bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {editNodeType === "TASK_STEP" && (
                <div className="bg-gray-50 border border-gray-200 p-3 rounded space-y-2.5">
                  <span className="text-[10px] font-mono text-gray-700 uppercase tracking-wider font-bold">
                    ▭ Parámetros del Paso Operativo
                  </span>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-0.5">Rol Ejecutante:</label>
                    <CustomSelect
                      options={roleOptions}
                      value={editRole}
                      onChange={setEditRole}
                      theme="light"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-0.5">Etapa de Crédito CUB:</label>
                    <CustomSelect
                      options={creditStageOptions}
                      value={editCreditStage}
                      onChange={setEditCreditStage}
                      theme="light"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-0.5">SLA Operativo (Horas):</label>
                    <input
                      type="number"
                      value={editStyleConfig.slaHours || 4}
                      onChange={(e) => setEditStyleConfig({ ...editStyleConfig, slaHours: Number(e.target.value) })}
                      className="w-full p-1.5 border rounded bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {(editNodeType === "CONTROL_POINT" || editNodeType === "FRAUD_CHECKPOINT") && (
                <div className="bg-cyan-50 border border-cyan-200 p-3 rounded space-y-2.5">
                  <span className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
                    ⬡ Parámetros del Punto de Control Normativo
                  </span>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-0.5">Estado de Formalización CNBV:</label>
                    <select
                      value={editStyleConfig.isFormalized ? "F" : "NF"}
                      onChange={(e) => setEditStyleConfig({ ...editStyleConfig, isFormalized: e.target.value === "F" })}
                      className="w-full p-1.5 border rounded bg-white text-xs font-medium"
                    >
                      <option value="F">Formalizado en Manual de Operación (F) — 100% Cobertura</option>
                      <option value="NF">No Formalizado (NF) — Tope Cobertura &le; 2 (Máx. 15% Mitigación)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-0.5">Periodicidad de Ejecución:</label>
                    <select
                      value={editStyleConfig.periodicity || "d+0"}
                      onChange={(e) => setEditStyleConfig({ ...editStyleConfig, periodicity: e.target.value })}
                      className="w-full p-1.5 border rounded bg-white text-xs font-medium"
                    >
                      <option value="d+0">Tiempo Real / En Línea (d+0) — Factor 5/5</option>
                      <option value="d+1">Diario al Cierre (d+1) — Factor 4/5</option>
                      <option value="d+7">Semanal (d+7) — Factor 3/5</option>
                      <option value="d+30">Mensual (d+30) — Factor 2/5</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-0.5">Evidencia Documental Generada:</label>
                    <input
                      type="text"
                      value={editStyleConfig.evidenceType || "Bitácora Digital SHA-256"}
                      onChange={(e) => setEditStyleConfig({ ...editStyleConfig, evidenceType: e.target.value })}
                      className="w-full p-1.5 border rounded bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              {editNodeType === "EXTERNAL_SYSTEM" && (
                <div className="bg-purple-50 border border-purple-200 p-3 rounded space-y-2.5">
                  <span className="text-[10px] font-mono text-purple-900 uppercase tracking-wider font-bold">
                    ▱ Parámetros del Sistema TI / API
                  </span>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-0.5">Sistema / Servicio Core:</label>
                    <input
                      type="text"
                      value={editSystem}
                      onChange={(e) => setEditSystem(e.target.value)}
                      placeholder="Core Bancario T24, Banxico SPEI..."
                      className="w-full p-1.5 border rounded bg-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-0.5">Tipo de Interfaz:</label>
                    <select
                      value={editStyleConfig.interfaceType || "REST_SYNC"}
                      onChange={(e) => setEditStyleConfig({ ...editStyleConfig, interfaceType: e.target.value })}
                      className="w-full p-1.5 border rounded bg-white text-xs font-medium"
                    >
                      <option value="REST_SYNC">API Síncrona REST / WebService</option>
                      <option value="MQ_ASYNC">Cola de Mensajería Asíncrona (MQ)</option>
                      <option value="SPEI_DIRECT">Conexión Directa Banxico SPEI</option>
                      <option value="BATCH_NIGHTLY">Proceso Batch Nocturno</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-0.5">RTO Objetivo de Recuperación (Horas):</label>
                    <input
                      type="number"
                      value={editStyleConfig.rtoHours || 2}
                      onChange={(e) => setEditStyleConfig({ ...editStyleConfig, rtoHours: Number(e.target.value) })}
                      className="w-full p-1.5 border rounded bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-gray-700 block mb-1">Descripción Funcional:</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2 border rounded outline-none text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={savingNodeEdit}
                  className="flex-1 py-2 bg-[#1F242B] hover:bg-[#2A313C] text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {savingNodeEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[#C0D725]" />}
                  <span>Guardar Datos de la Figura</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteNode}
                  className="p-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded transition-colors"
                  title="Eliminar esta figura del proceso"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: AUDITORÍA COPILOT IA DE ESTE NODO */}
          {drawerTab === "COPILOT" && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Auditar Paso con Gemini</span>
                  </span>
                  <button
                    onClick={handleAuditNode}
                    disabled={aiAuditing}
                    className="bg-[#C0D725] hover:bg-[#AEC41D] text-[#1F242B] font-bold text-xs px-2.5 py-1 rounded shadow-xs flex items-center gap-1 transition-transform hover:scale-[1.02] disabled:opacity-50"
                  >
                    {aiAuditing ? <span>Auditando...</span> : <span>Auditar Nodo</span>}
                  </button>
                </div>
                <p className="text-[11px] text-gray-600">
                  Examina brechas de control, conductas de fraude (Anexo 12-E) o ciberseguridad SPEI en este paso.
                </p>

                {auditResult && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-3 text-xs">
                    <div className="bg-white p-2.5 rounded border border-emerald-100 shadow-xs leading-relaxed">
                      <strong>Diagnóstico:</strong> {auditResult.analysisSummary}
                    </div>

                    {auditResult.emergingRiskAlerts?.map((alertItem: any, i: number) => (
                      <div key={i} className="bg-white p-2.5 rounded border border-rose-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-700 text-[11px]">
                            {alertItem.riskType} ({alertItem.cnbvAnnex})
                          </span>
                          <button
                            onClick={() => handleInsertSuggestion("RISK", alertItem)}
                            className="text-[10px] font-bold bg-[#1F242B] text-white px-2 py-0.5 rounded"
                          >
                            + Anclar
                          </button>
                        </div>
                        <div className="text-[11px] text-gray-700"><strong>Evento:</strong> {alertItem.event}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RIESGOS ANCLADOS Y FORMULARIO DE ALTA */}
          {drawerTab === "RISKS" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wide font-mono">
                  Riesgos Anclados ({selectedNode.riskEvents?.length || 0})
                </span>
                <button
                  onClick={() => setShowAddRiskForm(!showAddRiskForm)}
                  className="text-xs text-[#3299A8] hover:text-[#277A87] font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Anclar Nuevo Riesgo</span>
                </button>
              </div>

              {showAddRiskForm && (
                <form onSubmit={handleCreateRiskOnNode} className="bg-gray-50 p-3 rounded border border-gray-200 text-xs space-y-2">
                  <div className="font-bold text-gray-700">Alta de Riesgo en este Nodo:</div>
                  <input
                    type="text"
                    placeholder="Título del riesgo..."
                    value={newRiskTitle}
                    onChange={(e) => setNewRiskTitle(e.target.value)}
                    required
                    className="w-full p-1.5 border rounded outline-none"
                  />
                  <textarea
                    placeholder="Causa raíz..."
                    value={newRiskCause}
                    onChange={(e) => setNewRiskCause(e.target.value)}
                    required
                    rows={2}
                    className="w-full p-1.5 border rounded outline-none"
                  />
                  <textarea
                    placeholder="Evento de riesgo..."
                    value={newRiskEvent}
                    onChange={(e) => setNewRiskEvent(e.target.value)}
                    required
                    rows={2}
                    className="w-full p-1.5 border rounded outline-none"
                  />
                  <textarea
                    placeholder="Consecuencia financiera..."
                    value={newRiskConsequence}
                    onChange={(e) => setNewRiskConsequence(e.target.value)}
                    required
                    rows={2}
                    className="w-full p-1.5 border rounded outline-none"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500">Probabilidad (1-5):</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={newRiskProb}
                        onChange={(e) => setNewRiskProb(Number(e.target.value))}
                        className="w-full p-1 border rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500">Impacto (1-5):</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={newRiskImp}
                        onChange={(e) => setNewRiskImp(Number(e.target.value))}
                        className="w-full p-1 border rounded"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-[#1F242B] text-white py-1.5 rounded font-bold">
                    Guardar y Vincular
                  </button>
                </form>
              )}

              <div className="space-y-2">
                {selectedNode.riskEvents?.map((r: any) => (
                  <div key={r.id} className="p-3 bg-white border border-gray-200 rounded shadow-xs text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-gray-500">{r.code}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border ${getZoneBadgeClasses(r.residualZone)}`}>
                        {r.residualZone} (Score: {r.residualScore})
                      </span>
                    </div>
                    <div className="font-bold text-gray-900">{r.title}</div>
                    <div className="text-[11px] text-gray-600 line-clamp-2">{r.consequence}</div>
                    <div className="flex justify-between pt-1 text-[10px] text-gray-500 border-t border-gray-100 font-mono">
                      <span>PEA: {formatMXN(r.expectedAnnualLossPEA)}</span>
                      <span className="font-bold text-orange-700">PMA: {formatMXN(r.maxAnnualLossPMA)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL CLÁSICO: NUEVO NODO BANCARIO MANUAL */}
      {isNewNodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200 border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 font-serif text-base">
                Agregar Nuevo Nodo al Proceso Bancario
              </h3>
              <button
                onClick={() => setIsNewNodeModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewNode} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Nombre del Paso Operativo:</label>
                <input
                  type="text"
                  placeholder="Ej. Validación Facultada de Colateral y Gravamen..."
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  required
                  className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-[#3299A8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tipo de Figura:</label>
                  <CustomSelect
                    options={nodeTypeOptions}
                    value={newNodeType}
                    onChange={setNewNodeType}
                    theme="light"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Rol Responsable:</label>
                  <CustomSelect
                    options={roleOptions}
                    value={newNodeRole}
                    onChange={setNewNodeRole}
                    theme="light"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Etapa de Crédito CUB:</label>
                  <CustomSelect
                    options={creditStageOptions}
                    value={newNodeCreditStage}
                    onChange={setNewNodeCreditStage}
                    theme="light"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Sistema TI Utilizado:</label>
                  <input
                    type="text"
                    value={newNodeSystem}
                    onChange={(e) => setNewNodeSystem(e.target.value)}
                    placeholder="Core Bancario T24, Motor PLD..."
                    className="w-full p-2 border rounded outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Descripción Funcional:</label>
                <textarea
                  value={newNodeDescription}
                  onChange={(e) => setNewNodeDescription(e.target.value)}
                  rows={2}
                  placeholder="Mecanismo de operación, candados de seguridad y SLA estimado..."
                  className="w-full p-2 border rounded outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewNodeModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 border rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-[#1F242B] text-white font-bold rounded hover:bg-[#2A313C]"
                >
                  Crear y Posicionar Nodo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Confirmación para Eliminar Proceso Bancario */}
      {isDeleteProcessModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-bx shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header del modal */}
            <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Eliminar Proceso Bancario</h3>
                  <p className="text-xs text-rose-700">Esta acción removerá el flujo del catálogo institucional</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteProcessModalOpen(false)}
                disabled={isDeletingProcess}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-gray-500">
                  <span>Código de Proceso:</span>
                  <span className="font-mono font-bold text-gray-800">{activeProcess?.code || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>Nombre del Proceso:</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[280px] truncate">
                    {activeProcess?.name || "Sin nombre"}
                  </span>
                </div>
                {activeProcess?.macroProcess?.name && (
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Macroproceso:</span>
                    <span className="text-gray-800 text-right max-w-[280px] truncate">
                      {activeProcess.macroProcess.name}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-gray-500">
                  <span>Nodos en el diagrama:</span>
                  <span className="font-semibold text-gray-800">{nodes.length} nodos</span>
                </div>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded text-xs text-amber-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Impacto de la eliminación:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-1">
                  <li>Se eliminarán todos los nodos y conectores del diagrama.</li>
                  <li>Se desvincularán los controles asociados a los pasos del proceso.</li>
                  <li>Se registrará una traza inalterable con sello criptográfico <strong>SHA-256</strong> en la Bitácora de Auditoría (Audit Log CNBV).</li>
                </ul>
              </div>

              <p className="text-xs text-gray-600">
                ¿Estás seguro de que deseas eliminar permanentemente este proceso bancario?
              </p>

              {/* Botones de acción */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDeleteProcessModalOpen(false)}
                  disabled={isDeletingProcess}
                  className="px-3.5 py-1.5 text-xs text-gray-700 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCurrentProcess}
                  disabled={isDeletingProcess}
                  className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingProcess ? "Eliminando proceso..." : "Sí, Eliminar Proceso"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper principal con ReactFlowProvider para soporte integral de fitView y auto-centrado
export function FlowchartView({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  return (
    <ReactFlowProvider>
      <FlowchartViewInner onOpenCopilot={onOpenCopilot} />
    </ReactFlowProvider>
  );
}
