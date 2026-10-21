// src/components/FlowchartView.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  addEdge,
  Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { formatMXN, getZoneBadgeClasses } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  Shield,
  AlertTriangle,
  Sparkles,
  Plus,
  X,
  Server,
  UserCheck,
  Zap,
  Save,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Lock,
} from "lucide-react";

// CUSTOM NODE COMPONENT (Pure typography, zero emojis or icons inside the node)
function BankingProcessNode({ data, selected }: NodeProps) {
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
  } = (data as any) || {};

  let borderColor = "border-gray-300";
  let headerBg = "bg-gray-100 text-gray-800";

  if (nodeType === "START_END") {
    borderColor = "border-emerald-500";
    headerBg = "bg-emerald-600 text-white";
  } else if (nodeType === "CONTROL_POINT") {
    borderColor = "border-[#3299A8]";
    headerBg = "bg-[#3299A8] text-white";
  } else if (nodeType === "FRAUD_CHECKPOINT") {
    borderColor = "border-amber-500";
    headerBg = "bg-amber-600 text-white";
  } else if (nodeType === "DECISION_GATEWAY") {
    borderColor = "border-indigo-500";
    headerBg = "bg-indigo-600 text-white";
  } else if (nodeType === "EXTERNAL_SYSTEM") {
    borderColor = "border-purple-500";
    headerBg = "bg-purple-600 text-white";
  }

  if (hasSodViolation && sodAuditActive) {
    borderColor = "border-rose-600 ring-2 ring-rose-500 ring-offset-1 shadow-rose-100";
  }

  const cleanNodeTypeLabel = (nodeType || "").replace(/_/g, " ");

  return (
    <div
      className={`min-w-[240px] max-w-[280px] bg-white rounded-lg shadow-md border-2 transition-all text-xs ${borderColor} ${
        selected ? "ring-2 ring-[#C0D725] shadow-lg" : ""
      }`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-[#3299A8]" />

      {/* Node Header - Clean Typography without icons/emojis */}
      <div className={`px-2.5 py-1.5 rounded-t-md font-bold flex items-center justify-between ${headerBg}`}>
        <span className="tracking-wide uppercase text-[10px] font-mono truncate">
          {cleanNodeTypeLabel}
        </span>
        {creditStage && creditStage !== "NOT_APPLICABLE" && (
          <span className="text-[9px] uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded text-white">
            {creditStage}
          </span>
        )}
      </div>

      {/* Node Body */}
      <div className="p-2.5 space-y-1.5">
        <div className="font-bold text-gray-900 leading-snug line-clamp-2">
          {label}
        </div>

        <div className="text-[11px] text-gray-500 space-y-0.5">
          {responsibleRole && (
            <div className="truncate">
              <span className="text-gray-400 font-medium">Responsable: </span>
              <span className="text-gray-700">{responsibleRole}</span>
            </div>
          )}
          {systemUsed && (
            <div className="truncate font-mono text-[10px]">
              <span className="text-gray-400">Sistema: </span>
              <span className="text-gray-600">{systemUsed}</span>
            </div>
          )}
        </div>

        {/* Real-time Badges */}
        <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-1 items-center justify-between">
          {riskCount > 0 ? (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getZoneBadgeClasses(
                maxResidualZone
              )}`}
            >
              {riskCount} {riskCount === 1 ? "Riesgo" : "Riesgos"} ({maxResidualZone})
            </span>
          ) : (
            <span className="text-[9px] text-gray-400 bg-gray-50 px-1 py-0.5 rounded">
              Sin riesgos anclados
            </span>
          )}

          {totalPMA > 0 && (
            <span className="text-[9px] font-bold font-mono text-orange-700">
              PMA: {formatMXN(totalPMA)}
            </span>
          )}
        </div>

        {/* CUB Segregation of Duties Warning */}
        {hasSodViolation && (
          <div className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
            sodAuditActive ? "bg-rose-100 text-rose-800 border-rose-300 font-bold" : "bg-red-50 text-red-700 border-red-200"
          }`}>
            Violación SoD (CUB Art. 65 / 88)
          </div>
        )}

        {hasFraudCheckpoint && (
          <div className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-200">
            Control Fraude Anexo 12-E
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-[#3299A8]" />
    </div>
  );
}

const nodeTypes = {
  bankingNode: BankingProcessNode,
};

export function FlowchartView({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  const [processes, setProcesses] = useState<any[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("");
  const [activeProcess, setActiveProcess] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [aiAuditing, setAiAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  // SoD Auditor Mode State
  const [sodAuditActive, setSodAuditActive] = useState(false);
  const [sodViolationsCount, setSodViolationsCount] = useState(0);

  // Interactive Toolbar State
  const [isNewNodeModalOpen, setIsNewNodeModalOpen] = useState(false);
  const [savingPositions, setSavingPositions] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // New Node Form State
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeType, setNewNodeType] = useState("TASK_STEP");
  const [newNodeRole, setNewNodeRole] = useState("ANALYSIS");
  const [newNodeCreditStage, setNewNodeCreditStage] = useState("NOT_APPLICABLE");
  const [newNodeSystem, setNewNodeSystem] = useState("Core Bancario T24");
  const [newNodeDescription, setNewNodeDescription] = useState("");

  // New risk form inside drawer
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

  // 1. Cargar lista de procesos
  useEffect(() => {
    fetch("/api/processes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.processes.length > 0) {
          setProcesses(data.processes);
          setSelectedProcessId(data.processes[0].id);
        }
      });
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
                  riskCount,
                  maxResidualZone,
                  totalPEA,
                  totalPMA,
                  hasFraudCheckpoint: fn.nodeType === "FRAUD_CHECKPOINT",
                  hasSodViolation,
                  sodAuditActive: sodActive,
                  sodFindings: sodExplanations[fn.id] || [],
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
    [setNodes, setEdges]
  );

  useEffect(() => {
    if (selectedProcessId) {
      loadProcessDetail(selectedProcessId, sodAuditActive);
      setIsDrawerOpen(false);
      setSelectedNode(null);
      setAuditResult(null);
    }
  }, [selectedProcessId, loadProcessDetail, sodAuditActive]);

  // Manejar conexión interactiva entre nodos en el lienzo
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

  // Crear nuevo nodo bancario
  const handleCreateNewNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeLabel || !selectedProcessId) return;

    try {
      const nextX = (nodes.length % 3) * 290 + 60;
      const nextY = Math.floor(nodes.length / 3) * 180 + 80;

      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_NODE",
          processId: selectedProcessId,
          label: newNodeLabel,
          description: newNodeDescription || "Paso operativo añadido vía diagramador",
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
        setStatusBanner("Nuevo nodo bancario insertado en el flujo.");
        setTimeout(() => setStatusBanner(null), 3000);
      }
    } catch (err) {
      console.error("Error creating node:", err);
    }
  };

  const onNodeClick = (_: any, node: any) => {
    setSelectedNode({
      ...node.data.rawNode,
      hasSodViolation: node.data.hasSodViolation,
      sodFindings: node.data.sodFindings,
    });
    setIsDrawerOpen(true);
    setAuditResult(null);
    setShowAddRiskForm(false);
  };

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

  const processOptions = processes.map((p) => ({
    value: p.id,
    label: `${p.code}: ${p.name}`,
  }));

  const nodeTypeOptions = [
    { value: "TASK_STEP", label: "Paso de Proceso Operativo" },
    { value: "DECISION_GATEWAY", label: "Compuerta de Decisión" },
    { value: "CONTROL_POINT", label: "Punto de Control Preventivo/Detectivo" },
    { value: "FRAUD_CHECKPOINT", label: "Control de Fraude (Anexo 12-E)" },
    { value: "EXTERNAL_SYSTEM", label: "Sistema Core TI / API SPEI" },
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
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-[#C0D725]" />
            <span>{statusBanner}</span>
          </div>
          <button onClick={() => setStatusBanner(null)} className="text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Process Selection and Action Toolbar */}
      <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 flex flex-wrap items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-cyan-50 text-[#3299A8]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
              Cadena de Valor & Diagramador de Procesos
            </div>
            <h2 className="text-base font-bold text-gray-900 font-serif">
              {activeProcess?.name || "Selecciona un Proceso Bancario"}
            </h2>
          </div>
        </div>

        {/* Process Selector and Interactive Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Proceso:</span>
            <CustomSelect
              value={selectedProcessId}
              onChange={(val) => setSelectedProcessId(val)}
              options={processOptions}
              theme="light"
              className="min-w-[260px]"
              dropdownClassName="w-[340px]"
            />
          </div>

          <button
            onClick={() => setSodAuditActive(!sodAuditActive)}
            className={`text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 border transition-all ${
              sodAuditActive
                ? "bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-400"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
            }`}
            title="Auditoría normativa de Segregación de Funciones según CUB Art. 65 y Art. 88"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${sodAuditActive ? "text-rose-600" : "text-gray-500"}`} />
            <span>Auditoría SoD (CUB)</span>
            {sodViolationsCount > 0 && (
              <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-[3px] font-mono font-semibold">
                {sodViolationsCount}
              </span>
            )}
          </button>

          <button
            onClick={handleSaveLayout}
            disabled={savingPositions}
            className="bg-white border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
          >
            {savingPositions ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3299A8]" />
            ) : (
              <Save className="w-3.5 h-3.5 text-[#3299A8]" />
            )}
            <span>Guardar Layout</span>
          </button>

          <button
            onClick={() => setIsNewNodeModalOpen(true)}
            className="bg-[#1F242B] hover:bg-[#2A313C] text-white text-xs font-bold px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-[#C0D725]" />
            <span>+ Nuevo Nodo Bancario</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area - Full Width */}
      <div className="relative w-full h-[720px] bg-white rounded-bx shadow-card border border-gray-200 overflow-hidden">
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

        {/* Canvas Floating Legend - Clean Typography without icons or emojis */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-md shadow border border-gray-200 text-[11px] space-y-1.5 pointer-events-none select-none">
          <div className="font-bold text-gray-800 border-b border-gray-100 pb-1">
            Tipología de Nodos:
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            <span className="font-medium text-gray-700">Inicio / Fin</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#3299A8]"></span>
            <span className="font-medium text-gray-700">Punto de Control</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
            <span className="font-medium text-gray-700">Control de Fraude (Anexo 12-E)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span>
            <span className="font-medium text-gray-700">Compuerta de Decisión</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span>
            <span className="font-medium text-gray-700">Sistema Core / API SPEI</span>
          </div>
          {sodAuditActive && (
            <div className="pt-1 mt-1 border-t border-gray-100 flex items-center gap-2 text-rose-700 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
              <span>Conflicto SoD Activo (CUB)</span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: NUEVO NODO BANCARIO */}
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
                  <label className="font-bold text-gray-700 block mb-1">Tipo de Nodo:</label>
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

      {/* INSPECTOR SIDE DRAWER */}
      {isDrawerOpen && selectedNode && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-gray-200 p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="flex items-start justify-between pb-3 border-b border-gray-200">
            <div>
              <span className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
                Inspector del Nodo de Proceso
              </span>
              <h3 className="text-base font-bold text-gray-900 font-serif leading-snug mt-0.5">
                {selectedNode.label}
              </h3>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-gray-400 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SoD Regulatory Breach Alert in Drawer */}
          {selectedNode.hasSodViolation && (
            <div className="bg-rose-50 border border-rose-300 rounded-lg p-3.5 space-y-2 animate-in fade-in-50 duration-200">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Conflicto de Segregación de Funciones (CUB Art. 65 / Art. 88)</span>
              </div>
              <ul className="text-[11px] text-rose-700 list-disc list-inside space-y-1">
                {selectedNode.sodFindings?.map((finding: string, i: number) => (
                  <li key={i}>{finding}</li>
                ))}
              </ul>
              <p className="text-[10px] text-gray-500 pt-1 border-t border-rose-200">
                Recomendación CNBV: Insertar un Punto de Control Preventivo (2ª Línea UAIR) o desvincular facultades de originación frente a autorización.
              </p>
            </div>
          )}

          {/* Node Meta info */}
          <div className="bg-[#F5F7F9] p-3 rounded text-xs space-y-1.5 text-gray-600">
            <div className="flex justify-between">
              <span className="font-semibold">Tipo de Nodo:</span>
              <span className="font-bold text-gray-800">{selectedNode.nodeType}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Rol Responsable:</span>
              <span className="text-gray-800">{selectedNode.responsibleRole || "No asignado"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Sistema Utilizado:</span>
              <span className="font-mono text-gray-800">{selectedNode.systemUsed || "No especificado"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Etapa de Crédito CUB:</span>
              <span className="text-gray-800">{selectedNode.creditStage}</span>
            </div>
          </div>

          {/* Action: Auditar Nodo con Gemini */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>B×+ Risk Copilot (Gemini RAG)</span>
              </span>
              <button
                onClick={handleAuditNode}
                disabled={aiAuditing}
                className="bg-[#C0D725] hover:bg-[#AEC41D] text-[#1F242B] font-bold text-xs px-2.5 py-1 rounded shadow-sm flex items-center gap-1 transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                {aiAuditing ? (
                  <span>Auditando...</span>
                ) : (
                  <>
                    <span>Auditar Nodo</span>
                    <Sparkles className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-gray-600">
              Examina brechas de control, conductas de fraude (Anexo 12-E), ciberseguridad SPEI o salvaguardas ASG en este paso del flujo.
            </p>

            {/* AI Audit Findings Display */}
            {auditResult && (
              <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-3">
                <div className="text-xs text-gray-800 bg-white p-2.5 rounded border border-emerald-100 shadow-sm leading-relaxed">
                  <strong>Diagnóstico IA:</strong> {auditResult.analysisSummary}
                </div>

                {/* Emerging Risks Suggested */}
                {auditResult.emergingRiskAlerts?.map((alertItem: any, i: number) => (
                  <div key={i} className="bg-white p-2.5 rounded border border-rose-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-700 text-[11px] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{alertItem.riskType} ({alertItem.cnbvAnnex})</span>
                      </span>
                      <button
                        onClick={() => handleInsertSuggestion("RISK", alertItem)}
                        className="text-[10px] font-bold bg-[#1F242B] text-white px-2 py-0.5 rounded hover:bg-gray-800"
                      >
                        + Anclar a Matriz
                      </button>
                    </div>
                    <div className="text-[11px] text-gray-700">
                      <strong>Evento:</strong> {alertItem.event}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      <strong>Causa:</strong> {alertItem.cause}
                    </div>
                  </div>
                ))}

                {/* Quick-Win Plans Suggested */}
                {auditResult.prioritizedActionPlans?.map((plan: any, i: number) => (
                  <div key={i} className="bg-white p-2.5 rounded border border-[#C0D725] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-[11px] flex items-center gap-1">
                        <Zap className="w-3 h-3 text-[#3299A8]" />
                        <span>{plan.title}</span>
                      </span>
                      <button
                        onClick={() => handleInsertSuggestion("ACTION_PLAN", plan)}
                        className="text-[10px] font-bold bg-[#C0D725] text-[#1F242B] px-2 py-0.5 rounded hover:bg-[#AEC41D]"
                      >
                        + Crear Quick-Win
                      </button>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold">
                      Mejora estimada: {(plan.improvementPotentialPct * 100).toFixed(0)}% (PMA: -{formatMXN(plan.expectedPMAReductionMXN)})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anchored Risks List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                Riesgos Anclados ({selectedNode.riskEvents?.length || 0})
              </h4>
              <button
                onClick={() => setShowAddRiskForm(!showAddRiskForm)}
                className="text-xs text-[#3299A8] hover:text-[#277A87] font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Anclar Nuevo Riesgo</span>
              </button>
            </div>

            {/* Formulario de Alta In-Situ */}
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
                  placeholder="Evento operacional..."
                  value={newRiskEvent}
                  onChange={(e) => setNewRiskEvent(e.target.value)}
                  required
                  rows={2}
                  className="w-full p-1.5 border rounded outline-none"
                />
                <textarea
                  placeholder="Consecuencia patrimonial/regulatoria..."
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
                <button
                  type="submit"
                  className="w-full bg-[#1F242B] text-white py-1.5 rounded font-bold hover:bg-gray-800"
                >
                  Guardar y Vincular
                </button>
              </form>
            )}

            {/* List of existing risks on this node */}
            <div className="space-y-2">
              {selectedNode.riskEvents?.map((r: any) => (
                <div key={r.id} className="p-3 bg-white border border-gray-200 rounded shadow-sm text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-gray-500">{r.code}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getZoneBadgeClasses(r.residualZone)}`}>
                      {r.residualZone} (Score: {r.residualScore})
                    </span>
                  </div>
                  <div className="font-bold text-gray-900">{r.title}</div>
                  <div className="text-[11px] text-gray-600 line-clamp-2">{r.consequence}</div>
                  <div className="flex justify-between pt-1 text-[10px] text-gray-500 border-t border-gray-100">
                    <span>PEA: {formatMXN(r.expectedAnnualLossPEA)}</span>
                    <span className="font-bold text-orange-700">PMA: {formatMXN(r.maxAnnualLossPMA)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
