// src/components/ActionPlansView.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { formatMXN, getZoneBadgeClasses } from "@/lib/utils";
import { RoleType } from "@/types";
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  ShieldCheck,
  PenTool,
  Paperclip,
  Lock,
  X,
  RefreshCw,
  Sparkles,
  Workflow,
  Building2,
  Filter,
  ArrowRight,
  TrendingUp,
  Target,
  Compass,
  Layers,
  Table as TableIcon,
  Check,
  ShieldAlert,
  Search,
  Clock,
  DollarSign,
  BarChart3,
  Sliders,
} from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface ActionPlansViewProps {
  currentRole: RoleType;
}

type QuadrantType = "ALL" | "Q1_QUICK_WIN" | "Q2_STRUCTURAL" | "Q3_TACTICAL" | "Q4_LOW_PRIORITY";

export function ActionPlansView({ currentRole }: ActionPlansViewProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Estados de Filtro y Visualización
  const [selectedQuadrantFilter, setSelectedQuadrantFilter] = useState<QuadrantType>("ALL");
  const [highlightedPlanId, setHighlightedPlanId] = useState<string | null>(null);
  const [tableLayout, setTableLayout] = useState<"GROUPED" | "FLAT">("GROUPED");
  const [searchTerm, setSearchTerm] = useState("");

  // Acciones en curso
  const [verifyingPlanId, setVerifyingPlanId] = useState<string | null>(null);
  const [signingPlanId, setSigningPlanId] = useState<string | null>(null);

  // Modal 3: Asistente IA Gemini (Previsualización y Selección de Propuestas)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [loadingAIProposals, setLoadingAIProposals] = useState(false);
  const [aiExecutiveDiagnosis, setAiExecutiveDiagnosis] = useState("");
  const [aiProposals, setAiProposals] = useState<any[]>([]);
  const [selectedProposalIndexes, setSelectedProposalIndexes] = useState<Set<number>>(new Set());
  const [committingAIPlans, setCommittingAIPlans] = useState(false);

  // Modal 1: Nuevo Plan de Acción
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [selectedRiskId, setSelectedRiskId] = useState("");
  const [planTitle, setPlanTitle] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [planType, setPlanType] = useState("TECHNOLOGY");
  const [improvementPct, setImprovementPct] = useState(0.7);
  const [costScale, setCostScale] = useState("LOW");
  const [estimatedCost, setEstimatedCost] = useState(120000);
  const [estimatedDays, setEstimatedDays] = useState(45);
  const [dueDate, setDueDate] = useState("2026-06-30");
  const [submittingPlan, setSubmittingPlan] = useState(false);

  // Modal 2: Adjuntar Evidencia Documental SHA-256
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [selectedPlanForEvidence, setSelectedPlanForEvidence] = useState<any>(null);
  const [evidenceFileName, setEvidenceFileName] = useState("");
  const [evidenceComments, setEvidenceComments] = useState("");
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  // Cargar Procesos
  useEffect(() => {
    fetch("/api/processes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.processes) {
          setProcesses(data.processes);
        }
      })
      .catch((err) => console.error("Error fetching processes in ActionPlansView:", err));
  }, []);

  // Cargar Planes
  const fetchPlans = () => {
    setLoading(true);
    fetch("/api/action-plans")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPlans(data.plans);
        }
      })
      .finally(() => setLoading(false));
  };

  // Cargar Riesgos
  const fetchRisks = () => {
    fetch("/api/risks")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.risks.length > 0) {
          setRisks(data.risks);
          if (!selectedRiskId) {
            setSelectedRiskId(data.risks[0].id);
          }
        }
      });
  };

  useEffect(() => {
    fetchPlans();
    fetchRisks();
  }, []);

  // 1. Firma de Compromiso (1ª Línea)
  const handleSignPlan = async (planId: string) => {
    try {
      setSigningPlanId(planId);
      const res = await fetch("/api/action-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SIGN_PLAN",
          planId,
          userRole: currentRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusBanner(`Plan ${data.plan.code} firmado formalmente por la 1ª Línea de Negocio.`);
        setTimeout(() => setStatusBanner(null), 3500);
        fetchPlans();
      }
    } catch (e) {
      console.error("Error signing plan:", e);
    } finally {
      setSigningPlanId(null);
    }
  };

  // 2. Verificación UAIR y Mitigación en Vivo (2ª Línea CUB Art. 88)
  const handleVerifyAndApplyPlan = async (planId: string) => {
    try {
      setVerifyingPlanId(planId);
      const res = await fetch("/api/action-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_AND_APPLY_PLAN",
          planId,
          userRole: currentRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusBanner(
          `✓ Plan ${data.plan.code} VERIFICADO por UAIR. Mitigación aplicada en vivo a la Matriz 5×5 y controles formalizados (Hash: ${data.currentHash.slice(0, 12)}...).`
        );
        setTimeout(() => setStatusBanner(null), 5000);
        fetchPlans();
        fetchRisks();
      }
    } catch (e) {
      console.error("Error verifying plan:", e);
    } finally {
      setVerifyingPlanId(null);
    }
  };

  // 3. Abrir Modal de Sugerencias con IA Gemini (Previsualización en Vivo)
  const handleOpenAISuggestions = async () => {
    setIsAIModalOpen(true);
    setLoadingAIProposals(true);
    setAiExecutiveDiagnosis("");
    setAiProposals([]);
    setSelectedProposalIndexes(new Set());

    try {
      const res = await fetch("/api/action-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "AI_PREVIEW_PLANS_FOR_PROCESS",
          processId: selectedProcessId,
        }),
      });
      const data = await res.json();
      if (data.success && data.proposals) {
        setAiExecutiveDiagnosis(data.executiveDiagnosis || "");
        setAiProposals(data.proposals);
        // Todos seleccionados por defecto
        setSelectedProposalIndexes(new Set(data.proposals.map((_: any, idx: number) => idx)));
      } else {
        setStatusBanner("Aviso: " + (data.error || "No se pudieron obtener propuestas de IA"));
        setTimeout(() => setStatusBanner(null), 4000);
      }
    } catch (err) {
      console.error("Error fetching AI proposals:", err);
      setStatusBanner("Error al conectar con B×+ Risk Copilot (Gemini API)");
      setTimeout(() => setStatusBanner(null), 4000);
    } finally {
      setLoadingAIProposals(false);
    }
  };

  // 3b. Confirmar e Insertar Propuestas Seleccionadas en BD
  const handleCommitSelectedAIPlans = async () => {
    const selectedList = aiProposals.filter((_, idx) => selectedProposalIndexes.has(idx));
    if (selectedList.length === 0) return;

    try {
      setCommittingAIPlans(true);
      const res = await fetch("/api/action-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "AI_COMMIT_SELECTED_PLANS",
          selectedProposals: selectedList,
          processId: selectedProcessId,
          userRole: currentRole,
          executiveDiagnosis: aiExecutiveDiagnosis,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusBanner(
          `✨ B×+ Risk Copilot: Se insertaron exitosamente ${data.count} planes de mitigación en la Matriz 2×2.`
        );
        setTimeout(() => setStatusBanner(null), 5000);
        setIsAIModalOpen(false);
        fetchPlans();
        fetchRisks();
      } else {
        setStatusBanner("Error: " + (data.error || "No se pudieron guardar los planes"));
        setTimeout(() => setStatusBanner(null), 4000);
      }
    } catch (err) {
      console.error("Error committing AI plans:", err);
    } finally {
      setCommittingAIPlans(false);
    }
  };

  const toggleProposalSelection = (index: number) => {
    setSelectedProposalIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleSelectAllProposals = () => {
    if (selectedProposalIndexes.size === aiProposals.length) {
      setSelectedProposalIndexes(new Set());
    } else {
      setSelectedProposalIndexes(new Set(aiProposals.map((_, i) => i)));
    }
  };

  // 4. Crear Plan Manual
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRiskId || !planTitle) return;

    try {
      setSubmittingPlan(true);
      const res = await fetch("/api/action-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: planTitle,
          description: planDescription,
          planTypes: [planType],
          riskEventId: selectedRiskId,
          improvementPotentialPct: improvementPct,
          estimatedCostMXN: estimatedCost,
          costScale,
          estimatedDays,
          timeScale: estimatedDays <= 30 ? "VERY_LOW" : estimatedDays <= 90 ? "LOW" : "MEDIUM",
          dueDate,
          userRole: currentRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsNewPlanModalOpen(false);
        setPlanTitle("");
        setPlanDescription("");
        setStatusBanner(`Plan ${data.plan.code} registrado y cuantificado con éxito en la base de datos.`);
        setTimeout(() => setStatusBanner(null), 3500);
        fetchPlans();
      }
    } catch (err) {
      console.error("Error creating plan:", err);
    } finally {
      setSubmittingPlan(false);
    }
  };

  // 5. Adjuntar Evidencia
  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForEvidence || !evidenceFileName) return;

    try {
      setSubmittingEvidence(true);
      const res = await fetch("/api/action-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_EVIDENCE",
          planId: selectedPlanForEvidence.id,
          fileName: evidenceFileName,
          comments: evidenceComments,
          userRole: currentRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEvidenceModalOpen(false);
        setEvidenceFileName("");
        setEvidenceComments("");
        setStatusBanner(
          `Evidencia sellada exitosamente con huella criptográfica SHA-256: ${data.fileHashSha256.slice(0, 16)}...`
        );
        setTimeout(() => setStatusBanner(null), 4500);
        fetchPlans();
      }
    } catch (err) {
      console.error("Error uploading evidence:", err);
    } finally {
      setSubmittingEvidence(false);
    }
  };

  // Abrir Modal de Plan desde un Riesgo Huérfano
  const handleOpenPlanForOrphanRisk = (risk: any) => {
    setSelectedRiskId(risk.id);
    const nodeLabel = risk.processNode?.label || "Paso Operativo";
    setPlanTitle(`Plan de Remediación: Mitigación de Vulnerabilidad en ${nodeLabel}`);
    setPlanDescription(
      `Implementación de control preventivo y validación obligatoria para neutralizar la causa "${risk.cause.slice(0, 90)}..." identificada en el nodo ${nodeLabel}.`
    );
    setImprovementPct(0.7);
    setCostScale("LOW");
    setEstimatedCost(125000);
    setEstimatedDays(45);
    setIsNewPlanModalOpen(true);
  };

  // Helper para clasificar el cuadrante de cualquier plan
  const getPlanQuadrant = (p: any): "Q1_QUICK_WIN" | "Q2_STRUCTURAL" | "Q3_TACTICAL" | "Q4_LOW_PRIORITY" => {
    const imp = p.improvementPotentialPct || 0;
    const days = p.estimatedDays || 0;
    const costLow = p.costScale === "VERY_LOW" || p.costScale === "LOW";

    if (imp >= 0.6 && days <= 90 && costLow) {
      return "Q1_QUICK_WIN";
    }
    if (imp >= 0.6) {
      return "Q2_STRUCTURAL";
    }
    if (days <= 90) {
      return "Q3_TACTICAL";
    }
    return "Q4_LOW_PRIORITY";
  };

  // Helper para calcular salto en coordenadas 5x5
  const calculateTargetShift = (p: any) => {
    const risk = p.riskEvent;
    if (!risk) {
      return {
        baseP: 3,
        baseI: 3,
        baseScore: 9,
        baseZone: "YELLOW",
        targetP: 2,
        targetI: 2,
        targetScore: 4,
        targetZone: "GREEN",
      };
    }
    const baseP = Math.round(risk.residualProbability || 3);
    const baseI = Math.round(risk.residualImpact || 3);
    const baseScore = baseP * baseI;
    const baseZone = risk.residualZone || "YELLOW";

    const imp = p.improvementPotentialPct || 0.6;
    const reductionFactor = 1 - imp * 0.55;
    const targetP = Math.max(1, Math.round(baseP * reductionFactor));
    const targetI = Math.max(1, Math.round(baseI * reductionFactor));
    const targetScore = targetP * targetI;
    const targetZone =
      targetScore <= 4 ? "GREEN" : targetScore <= 9 ? "YELLOW" : targetScore <= 15 ? "ORANGE" : "RED";

    return { baseP, baseI, baseScore, baseZone, targetP, targetI, targetScore, targetZone };
  };

  // Filtrar planes por proceso seleccionado
  const processScopedPlans = useMemo(() => {
    if (selectedProcessId === "ALL") return plans;
    return plans.filter((p) => p.riskEvent?.processId === selectedProcessId);
  }, [plans, selectedProcessId]);

  // Cuadrantes clasificados
  const q1Plans = useMemo(
    () => processScopedPlans.filter((p) => getPlanQuadrant(p) === "Q1_QUICK_WIN"),
    [processScopedPlans]
  );
  const q2Plans = useMemo(
    () => processScopedPlans.filter((p) => getPlanQuadrant(p) === "Q2_STRUCTURAL"),
    [processScopedPlans]
  );
  const q3Plans = useMemo(
    () => processScopedPlans.filter((p) => getPlanQuadrant(p) === "Q3_TACTICAL"),
    [processScopedPlans]
  );
  const q4Plans = useMemo(
    () => processScopedPlans.filter((p) => getPlanQuadrant(p) === "Q4_LOW_PRIORITY"),
    [processScopedPlans]
  );

  // Filtrar planes para tarjetas y tabla (por cuadrante y búsqueda)
  const displayPlans = useMemo(() => {
    let list = processScopedPlans;

    if (selectedQuadrantFilter !== "ALL") {
      list = list.filter((p) => getPlanQuadrant(p) === selectedQuadrantFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.code?.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.riskEvent?.code?.toLowerCase().includes(q) ||
          p.riskEvent?.title?.toLowerCase().includes(q) ||
          p.riskEvent?.process?.name?.toLowerCase().includes(q) ||
          p.riskEvent?.processNode?.label?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [processScopedPlans, selectedQuadrantFilter, searchTerm]);

  // Proceso actualmente seleccionado
  const currentProcessObj = useMemo(() => {
    if (selectedProcessId === "ALL") return null;
    return processes.find((p) => p.id === selectedProcessId) || null;
  }, [processes, selectedProcessId]);

  // Agrupamiento por Proceso Bancario para la tabla
  const groupedDisplayPlans = useMemo(() => {
    if (tableLayout !== "GROUPED") return [];

    const map = new Map<string, { process: any; plans: any[] }>();

    for (const p of displayPlans) {
      const proc = p.riskEvent?.process;
      const procKey = proc?.id || proc?.code || "SIN_PROCESO";
      if (!map.has(procKey)) {
        map.set(procKey, {
          process: proc || { code: "GENÉRICO", name: "Procesos Centrales / Sin Proceso Asignado" },
          plans: [],
        });
      }
      map.get(procKey)!.plans.push(p);
    }

    return Array.from(map.values()).sort((a, b) =>
      (a.process.code || "").localeCompare(b.process.code || "")
    );
  }, [displayPlans, tableLayout]);

  // Riesgos del proceso seleccionado
  const scopedRisks = useMemo(() => {
    if (selectedProcessId === "ALL") return risks;
    return risks.filter((r) => r.processId === selectedProcessId);
  }, [risks, selectedProcessId]);

  // Radar de Brechas: Riesgos Huérfanos sin Plan o con controles NF
  const orphanRisks = useMemo(() => {
    const coveredRiskIds = new Set(plans.map((p) => p.riskEventId).filter(Boolean));
    return scopedRisks.filter((r) => {
      const hasPlan = coveredRiskIds.has(r.id);
      const hasNFControl = r.controls?.some((c: any) => c.control && !c.control.isFormalized);
      return !hasPlan || hasNFControl;
    });
  }, [scopedRisks, plans]);

  // Métricas de KPIs Dinámicos
  const kpiData = useMemo(() => {
    const totalRisks = scopedRisks.length;
    const coveredRiskIds = new Set(processScopedPlans.map((p) => p.riskEventId).filter(Boolean));
    const coveredRisksCount = scopedRisks.filter((r) => coveredRiskIds.has(r.id)).length;
    const coveragePct = totalRisks > 0 ? Math.round((coveredRisksCount / totalRisks) * 100) : 0;
    const orphanCount = totalRisks - coveredRisksCount;

    const totalPEAReduction = processScopedPlans.reduce(
      (sum, p) => sum + (p.expectedPEAReductionMXN || 0),
      0
    );
    const totalEstimatedCost = processScopedPlans.reduce(
      (sum, p) => sum + (p.estimatedCostMXN || 0),
      0
    );

    const processBasePEA = scopedRisks.reduce((sum, r) => sum + (r.expectedAnnualLossPEA || 0), 0);
    const peaReductionPct =
      processBasePEA > 0 ? Math.round((totalPEAReduction / processBasePEA) * 100) : 0;

    const roiMultiple =
      totalEstimatedCost > 0 ? (totalPEAReduction / totalEstimatedCost).toFixed(1) : "0.0";

    const quickWinsCount = q1Plans.length;
    const signedCount = processScopedPlans.filter((p) => p.signedByBusinessHead).length;
    const verifiedCount = processScopedPlans.filter((p) => p.status === "COMPLETED_VERIFIED").length;

    return {
      totalRisks,
      coveredRisksCount,
      coveragePct,
      orphanCount,
      totalPEAReduction,
      processBasePEA,
      peaReductionPct,
      totalEstimatedCost,
      roiMultiple,
      quickWinsCount,
      signedCount,
      verifiedCount,
    };
  }, [scopedRisks, processScopedPlans, q1Plans]);

  // Opciones para CustomSelect de Procesos
  const processOptions = useMemo(() => {
    const allCount = plans.length;
    const list = [
      {
        value: "ALL",
        label: `Todos los Procesos (Portafolio Consolidado B×+)`,
        badge: `${allCount} Planes`,
        description: "Evaluación transversal sobre todos los procesos del banco",
      },
    ];

    processes.forEach((proc) => {
      const procPlansCount = plans.filter((p) => p.riskEvent?.processId === proc.id).length;
      list.push({
        value: proc.id,
        label: `${proc.code}: ${proc.name}`,
        badge: `${procPlansCount} Planes`,
        description: proc.macroProcess?.name || "Macroproceso B×+",
      });
    });

    return list;
  }, [processes, plans]);

  // Opciones de Nuevo Plan Modal
  const selectedRisk = risks.find((r) => r.id === selectedRiskId);
  const livePEAReduction = selectedRisk ? selectedRisk.expectedAnnualLossPEA * improvementPct : 0;
  const livePMAReduction = selectedRisk ? selectedRisk.maxAnnualLossPMA * improvementPct : 0;
  const liveIsQuickWin =
    improvementPct >= 0.6 &&
    (costScale === "VERY_LOW" || costScale === "LOW") &&
    estimatedDays <= 90;

  const planTypeOptions = [
    { value: "TECHNOLOGY", label: "Tecnología / Automatización Core" },
    { value: "PROCESSES", label: "Reingeniería de Procesos Bancarios" },
    { value: "TRAINING", label: "Capacitación y Certificación de Personal" },
    { value: "POLICY_REGULATION", label: "Políticas, Manuales y Marco Normativo" },
  ];

  const costScaleOptions = [
    { value: "VERY_LOW", label: "Muy Bajo (< $50,000 MXN)" },
    { value: "LOW", label: "Bajo ($50,000 - $200,000 MXN)" },
    { value: "MEDIUM", label: "Medio ($200,000 - $1,000,000 MXN)" },
    { value: "HIGH", label: "Alto (> $1,000,000 MXN)" },
  ];

  const improvementOptions = [
    { value: "0.85", label: "Alta Mitigación (85% reducción de pérdidas)" },
    { value: "0.70", label: "Media-Alta Mitigación (70% reducción de pérdidas)" },
    { value: "0.60", label: "Media Mitigación (60% reducción de pérdidas)" },
    { value: "0.45", label: "Táctica Moderada (45% reducción de pérdidas)" },
    { value: "0.25", label: "Baja Mitigación (25% reducción de pérdidas)" },
  ];

  const renderPlanRow = (p: any) => {
    const shift = calculateTargetShift(p);
    const roi = (p.expectedPEAReductionMXN / (p.estimatedCostMXN || 1)).toFixed(1);
    const qType = getPlanQuadrant(p);

    return (
      <tr
        key={p.id}
        className={`transition-colors ${
          highlightedPlanId === p.id
            ? "bg-lime-50/80 font-medium"
            : "hover:bg-gray-50/80"
        }`}
      >
        {/* Código y Cuadrante */}
        <td className="py-3 px-3 align-top font-mono">
          <div className="font-bold text-gray-900">{p.code}</div>
          <div className="mt-1">
            {qType === "Q1_QUICK_WIN" ? (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 fill-emerald-600" />
                <span>Q1</span>
              </span>
            ) : qType === "Q2_STRUCTURAL" ? (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-100 text-[#267C89] border border-cyan-300">
                Q2 Core
              </span>
            ) : qType === "Q3_TACTICAL" ? (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                Q3 Táctico
              </span>
            ) : (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 border border-gray-300">
                Q4 Baja
              </span>
            )}
          </div>
        </td>

        {/* Título y Descripción */}
        <td className="py-3 px-3 align-top">
          <div className="font-bold text-gray-900 leading-snug">{p.title}</div>
          <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
            {p.description}
          </div>
          {p.isSuggestedByAI && (
            <span className="inline-flex items-center gap-1 text-[9px] font-mono bg-cyan-50 text-[#267C89] px-1.5 py-0.2 rounded mt-1 font-semibold border border-cyan-200">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Sugerido por Copilot IA</span>
            </span>
          )}
        </td>

        {/* Riesgo & Proceso / Nodo */}
        <td className="py-3 px-3 align-top">
          <div className="font-medium text-gray-900 flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-gray-700">
              {p.riskEvent?.code}
            </span>
            <span className="truncate max-w-[150px]" title={p.riskEvent?.title}>
              {p.riskEvent?.title}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1 mt-1 text-[9px] font-mono">
            {p.riskEvent?.process && (
              <span
                className="text-[#3299A8] bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200 truncate max-w-[130px]"
                title={p.riskEvent.process.name}
              >
                {p.riskEvent.process.code}
              </span>
            )}
            {p.riskEvent?.processNode && (
              <span
                className="text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200 truncate max-w-[130px]"
                title={p.riskEvent.processNode.label}
              >
                {p.riskEvent.processNode.label}
              </span>
            )}
          </div>
        </td>

        {/* Salto 5x5 */}
        <td className="py-3 px-3 align-top text-center">
          <div className="inline-flex items-center gap-1 font-mono text-[10px]">
            <span
              className={`px-1.5 py-0.2 rounded font-bold border ${getZoneBadgeClasses(
                shift.baseZone
              )}`}
            >
              {shift.baseP}×{shift.baseI}
            </span>
            <ArrowRight className="w-3 h-3 text-emerald-600" />
            <span
              className={`px-1.5 py-0.2 rounded font-bold border ${getZoneBadgeClasses(
                shift.targetZone
              )}`}
            >
              {shift.targetP}×{shift.targetI}
            </span>
          </div>
          <div className="text-[10px] text-emerald-700 font-mono font-semibold mt-0.5">
            -{(p.improvementPotentialPct * 100).toFixed(0)}% Reducción
          </div>
        </td>

        {/* Inversión & ROI */}
        <td className="py-3 px-3 align-top text-center font-mono">
          <div className="font-bold text-gray-800">{formatMXN(p.estimatedCostMXN)}</div>
          <div className="text-[10px] text-emerald-700 font-semibold">
            -{formatMXN(p.expectedPEAReductionMXN)}
          </div>
          <div className="mt-0.5">
            <span className="text-[9px] bg-[#C0D725] text-[#1F242B] px-1 py-0.2 rounded font-bold border border-[#AEC41D]">
              {roi}x ROI
            </span>
          </div>
        </td>

        {/* Plazo */}
        <td className="py-3 px-3 align-top text-center font-mono">
          <div className="font-bold text-gray-800">{p.estimatedDays} días</div>
          <div className="text-[9px] text-gray-400">{p.timeScale}</div>
        </td>

        {/* Gobernanza 3 Líneas */}
        <td className="py-3 px-3 align-top text-center space-y-1">
          {/* 1ª Línea */}
          <div>
            {p.signedByBusinessHead ? (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                <Check className="w-2.5 h-2.5 text-emerald-600" />
                <span>1ª L: Firmado</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200">
                <span>1ª L: Pendiente</span>
              </span>
            )}
          </div>

          {/* Evidencias SHA-256 */}
          <div>
            <button
              type="button"
              onClick={() => {
                setSelectedPlanForEvidence(p);
                setIsEvidenceModalOpen(true);
              }}
              className="text-[9px] font-mono text-[#3299A8] hover:underline inline-flex items-center gap-0.5"
            >
              <Paperclip className="w-2.5 h-2.5" />
              <span>{p.evidences?.length || 0} Evidencia(s)</span>
            </button>
          </div>

          {/* 2ª Línea UAIR */}
          <div>
            {p.status === "COMPLETED_VERIFIED" ? (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                <span>UAIR Verificado</span>
              </span>
            ) : (
              <span className="text-[9px] text-gray-400 font-mono">UAIR Pendiente</span>
            )}
          </div>
        </td>

        {/* Estado & Acciones */}
        <td className="py-3 px-3 align-top text-center space-y-1">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 block">
            {p.status}
          </span>

          <div className="flex items-center justify-center gap-1 pt-1">
            {!p.signedByBusinessHead && (
              <button
                type="button"
                onClick={() => handleSignPlan(p.id)}
                className="bg-[#1F242B] hover:bg-[#2A313C] text-white text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                title="Firmar compromiso (1ª Línea)"
              >
                Firmar
              </button>
            )}

            {p.status !== "COMPLETED_VERIFIED" && (
              <button
                type="button"
                disabled={verifyingPlanId === p.id}
                onClick={() => handleVerifyAndApplyPlan(p.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer disabled:opacity-50"
                title="Verificar y aplicar mitigación (2ª Línea UAIR)"
              >
                Verificar
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6 w-full">
      {/* Notificación de Estado / Banner */}
      {statusBanner && (
        <div className="bg-[#1F242B] border-l-4 border-[#C0D725] text-white p-3 rounded-bx shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-[#C0D725]" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          CAPA 1: CABECERA EJECUTIVA Y SELECTOR DE PROCESO (DISEÑO ESTÁNDAR B×+)
         ========================================================================= */}
      <div className="bg-gradient-to-r from-[#1F242B] to-[#2B333E] text-white rounded-bx p-5 shadow-card border-l-4 border-[#C0D725] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-white tracking-tight">
            Matriz de Priorización de Mitigación y Cuadrante Quick-Wins
          </h2>
          <p className="text-xs text-gray-300 mt-1 max-w-3xl leading-relaxed">
            Cruce cuantitativo de Potencial de Reducción (&Delta;PEA%) frente a Esfuerzo/Plazo por Proceso
            Bancario, formalización de controles y mitigación en tiempo real.
          </p>
        </div>

        {/* Selector de Proceso & Botones de Acción */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="w-72 min-w-0">
            <CustomSelect
              options={processOptions}
              value={selectedProcessId}
              onChange={setSelectedProcessId}
              theme="dark"
              placeholder="Seleccionar Proceso..."
              className="w-full"
              dropdownClassName="w-[420px]"
            />
          </div>

          {/* Botón Sugerir Planes con IA */}
          <button
            type="button"
            disabled={loadingAIProposals}
            onClick={handleOpenAISuggestions}
            className="bg-[#C0D725] hover:bg-[#AEC41D] text-[#1F242B] text-xs font-bold px-3 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Abrir Asistente IA Gemini para previsualizar y seleccionar propuestas de mitigación"
          >
            {loadingAIProposals ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1F242B]" />
                <span>Razonando con Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#1F242B]" />
                <span>Sugerir Planes con IA</span>
              </>
            )}
          </button>

          {/* Botón Nuevo Plan Manual */}
          <button
            type="button"
            onClick={() => {
              const firstOrphan = orphanRisks[0] || scopedRisks[0];
              if (firstOrphan) {
                setSelectedRiskId(firstOrphan.id);
              }
              setIsNewPlanModalOpen(true);
            }}
            className="bg-[#292F38] hover:bg-[#343C47] text-gray-200 border border-gray-700 text-xs font-bold px-3.5 py-2 rounded-md shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#C0D725]" />
            <span>Nuevo Plan</span>
          </button>
        </div>
      </div>

      {/* 4 TARJETAS KPI DINÁMICAS */}
      <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* KPI 1: Cobertura de Mitigación */}
          <div className="bg-[#FAFBFD] p-3.5 rounded-lg border border-gray-200 space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              1. Cobertura del Proceso
            </span>
            <div className="text-xl sm:text-2xl font-bold font-serif text-[#1F242B]">
              {kpiData.coveredRisksCount} / {kpiData.totalRisks}{" "}
              <span className="text-xs font-sans text-gray-500 font-normal">
                ({kpiData.coveragePct}%)
              </span>
            </div>
            <div className="text-[10px] flex items-center gap-1 font-semibold truncate">
              {kpiData.orphanCount > 0 ? (
                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  ⚠️ {kpiData.orphanCount} riesgos huérfanos sin plan
                </span>
              ) : (
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  ✓ Cobertura 100% formalizada
                </span>
              )}
            </div>
          </div>

          {/* KPI 2: Ahorro Anual Proyectado */}
          <div className="bg-[#FAFBFD] p-3.5 rounded-lg border border-gray-200 space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              2. Ahorro Anual Proyectado (&Delta;PEA)
            </span>
            <div className="text-xl sm:text-2xl font-bold font-serif text-emerald-700 truncate">
              -{formatMXN(kpiData.totalPEAReduction)}
            </div>
            <div className="text-[10px] text-gray-500 font-mono truncate">
              Reducción del {kpiData.peaReductionPct}% sobre PEA del proceso
            </div>
          </div>

          {/* KPI 3: Inversión Estimada vs. ROI */}
          <div className="bg-[#FAFBFD] p-3.5 rounded-lg border border-gray-200 space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              3. Inversión Estimada vs. ROI
            </span>
            <div className="text-xl sm:text-2xl font-bold font-serif text-[#1F242B] truncate">
              {formatMXN(kpiData.totalEstimatedCost)}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono font-bold bg-[#C0D725] text-[#1F242B] px-1.5 py-0.2 rounded border border-[#AEC41D]">
                ROI: {kpiData.roiMultiple}x
              </span>
              <span className="text-[10px] text-gray-400 font-sans">Retorno Anual</span>
            </div>
          </div>

          {/* KPI 4: Quick-Wins & Gobernanza 3LD */}
          <div className="bg-[#FAFBFD] p-3.5 rounded-lg border border-gray-200 space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              4. Quick-Wins & Gobernanza 3LD
            </span>
            <div className="text-xl sm:text-2xl font-bold font-serif text-[#1F242B] flex items-center gap-1.5">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>{kpiData.quickWinsCount} Quick-Wins</span>
            </div>
            <div className="text-[10px] text-gray-600 font-mono flex items-center gap-1 truncate">
              <span className="text-emerald-700 font-bold">{kpiData.verifiedCount} Verif. UAIR</span>
              <span>•</span>
              <span className="text-gray-500">{kpiData.signedCount} Firmados</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CAPA 2: MATRIZ VISUAL 2×2 (7 COLS) + RADAR DE BRECHAS DEL PROCESO (5 COLS)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA (7 COLS): MATRIZ 2×2 DE PRIORIZACIÓN */}
        <div className="lg:col-span-7 bg-white rounded-bx p-5 shadow-card border border-gray-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-serif flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#3299A8]" />
                <span>Matriz Visual 2×2 de Priorización Estratégica</span>
              </h3>
              <p className="text-[11px] text-gray-500">
                Eje Y: Potencial &Delta;PEA% (&ge;60% vs &lt;60%) • Eje X: Esfuerzo/Plazo (&le;90d vs &gt;90d)
              </p>
            </div>

            {selectedQuadrantFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => setSelectedQuadrantFilter("ALL")}
                className="text-[10px] font-bold text-[#3299A8] hover:underline flex items-center gap-1"
              >
                <span>Mostrar Todos ({processScopedPlans.length})</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Cuadrícula 2x2 */}
          <div className="relative border border-gray-300 rounded-lg p-3 bg-gray-50/50 space-y-3">
            {/* Etiquetas de Ejes */}
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-500 px-1">
              <span>&larr; Menor Esfuerzo (&le;90d & Costo Bajo)</span>
              <span>Mayor Esfuerzo (&gt;90d o Costo Alto) &rarr;</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[360px]">
              {/* CUADRANTE I: QUICK-WINS (Top-Left) */}
              <div
                onClick={() =>
                  setSelectedQuadrantFilter(
                    selectedQuadrantFilter === "Q1_QUICK_WIN" ? "ALL" : "Q1_QUICK_WIN"
                  )
                }
                className={`p-3.5 rounded-lg border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  selectedQuadrantFilter === "Q1_QUICK_WIN"
                    ? "ring-2 ring-[#C0D725] bg-emerald-50/90 border-[#C0D725] shadow-md"
                    : "bg-emerald-50/60 border-emerald-400/80 hover:border-[#C0D725] hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-[#C0D725] text-[#1F242B] px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                      <Zap className="w-3 h-3 fill-[#1F242B]" />
                      <span>I. QUICK-WINS</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-900 font-mono">
                      {q1Plans.length} {q1Plans.length === 1 ? "Plan" : "Planes"}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-gray-900 mt-1">
                    Ejecución Inmediata (&le;90d & &ge;60%)
                  </div>
                  <div className="text-[10px] font-mono text-emerald-800 font-semibold mt-0.5">
                    Ahorro: -{formatMXN(q1Plans.reduce((s, p) => s + (p.expectedPEAReductionMXN || 0), 0))}
                  </div>
                </div>

                {/* Chips de Planes */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {q1Plans.map((p) => (
                    <div
                      key={p.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHighlightedPlanId(highlightedPlanId === p.id ? null : p.id);
                      }}
                      className={`p-1.5 rounded text-[10px] border leading-tight transition-all ${
                        highlightedPlanId === p.id
                          ? "bg-[#1F242B] text-white border-[#C0D725]"
                          : "bg-white text-gray-800 border-emerald-200 hover:border-emerald-400"
                      }`}
                      title={`${p.code}: ${p.title} • Nodo: ${p.riskEvent?.processNode?.label || "General"}`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span>{p.code}</span>
                        <span className="text-[9px] text-emerald-700">
                          -{(p.improvementPotentialPct * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="truncate text-[10px] font-sans font-medium">{p.title}</div>
                      <div className="text-[9px] text-gray-500 font-mono truncate">
                        {p.riskEvent?.processNode?.label || "Paso Operativo"}
                      </div>
                    </div>
                  ))}
                  {q1Plans.length === 0 && (
                    <div className="text-center py-4 text-[10px] text-gray-400 italic">
                      Sin iniciativas Quick-Win registradas
                    </div>
                  )}
                </div>
              </div>

              {/* CUADRANTE II: PROYECTOS ESTRUCTURALES (Top-Right) */}
              <div
                onClick={() =>
                  setSelectedQuadrantFilter(
                    selectedQuadrantFilter === "Q2_STRUCTURAL" ? "ALL" : "Q2_STRUCTURAL"
                  )
                }
                className={`p-3.5 rounded-lg border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  selectedQuadrantFilter === "Q2_STRUCTURAL"
                    ? "ring-2 ring-[#3299A8] bg-cyan-50/90 border-[#3299A8] shadow-md"
                    : "bg-cyan-50/50 border-cyan-300 hover:border-[#3299A8] hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-[#3299A8] text-white px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                      <Building2 className="w-3 h-3 text-cyan-200" />
                      <span>II. ESTRUCTURALES CORE</span>
                    </span>
                    <span className="text-[11px] font-bold text-cyan-950 font-mono">
                      {q2Plans.length} {q2Plans.length === 1 ? "Plan" : "Planes"}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-gray-900 mt-1">
                    Alta Inversión (&gt;90d o Costo Medio/Alto & &ge;60%)
                  </div>
                  <div className="text-[10px] font-mono text-[#267C89] font-semibold mt-0.5">
                    Ahorro: -{formatMXN(q2Plans.reduce((s, p) => s + (p.expectedPEAReductionMXN || 0), 0))}
                  </div>
                </div>

                {/* Chips de Planes */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {q2Plans.map((p) => (
                    <div
                      key={p.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHighlightedPlanId(highlightedPlanId === p.id ? null : p.id);
                      }}
                      className={`p-1.5 rounded text-[10px] border leading-tight transition-all ${
                        highlightedPlanId === p.id
                          ? "bg-[#1F242B] text-white border-[#3299A8]"
                          : "bg-white text-gray-800 border-cyan-200 hover:border-[#3299A8]"
                      }`}
                      title={`${p.code}: ${p.title} • Nodo: ${p.riskEvent?.processNode?.label || "General"}`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span>{p.code}</span>
                        <span className="text-[9px] text-[#3299A8]">
                          -{(p.improvementPotentialPct * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="truncate text-[10px] font-sans font-medium">{p.title}</div>
                      <div className="text-[9px] text-gray-500 font-mono truncate">
                        {p.riskEvent?.processNode?.label || "Paso Operativo"}
                      </div>
                    </div>
                  ))}
                  {q2Plans.length === 0 && (
                    <div className="text-center py-4 text-[10px] text-gray-400 italic">
                      Sin proyectos estructurales registrados
                    </div>
                  )}
                </div>
              </div>

              {/* CUADRANTE III: MEJORAS TÁCTICAS OPERATIVAS (Bottom-Left) */}
              <div
                onClick={() =>
                  setSelectedQuadrantFilter(
                    selectedQuadrantFilter === "Q3_TACTICAL" ? "ALL" : "Q3_TACTICAL"
                  )
                }
                className={`p-3.5 rounded-lg border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  selectedQuadrantFilter === "Q3_TACTICAL"
                    ? "ring-2 ring-amber-500 bg-amber-50/90 border-amber-500 shadow-md"
                    : "bg-amber-50/50 border-amber-300 hover:border-amber-500 hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                      <span>🔧 III. MEJORAS TÁCTICAS</span>
                    </span>
                    <span className="text-[11px] font-bold text-amber-950 font-mono">
                      {q3Plans.length} {q3Plans.length === 1 ? "Plan" : "Planes"}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-gray-900 mt-1">
                    Esfuerzo Ágil (&le;90d & &lt;60%)
                  </div>
                  <div className="text-[10px] font-mono text-amber-800 font-semibold mt-0.5">
                    Ahorro: -{formatMXN(q3Plans.reduce((s, p) => s + (p.expectedPEAReductionMXN || 0), 0))}
                  </div>
                </div>

                {/* Chips de Planes */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {q3Plans.map((p) => (
                    <div
                      key={p.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHighlightedPlanId(highlightedPlanId === p.id ? null : p.id);
                      }}
                      className={`p-1.5 rounded text-[10px] border leading-tight transition-all ${
                        highlightedPlanId === p.id
                          ? "bg-[#1F242B] text-white border-amber-400"
                          : "bg-white text-gray-800 border-amber-200 hover:border-amber-400"
                      }`}
                      title={`${p.code}: ${p.title} • Nodo: ${p.riskEvent?.processNode?.label || "General"}`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span>{p.code}</span>
                        <span className="text-[9px] text-amber-700">
                          -{(p.improvementPotentialPct * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="truncate text-[10px] font-sans font-medium">{p.title}</div>
                      <div className="text-[9px] text-gray-500 font-mono truncate">
                        {p.riskEvent?.processNode?.label || "Paso Operativo"}
                      </div>
                    </div>
                  ))}
                  {q3Plans.length === 0 && (
                    <div className="text-center py-4 text-[10px] text-gray-400 italic">
                      Sin mejoras tácticas registradas
                    </div>
                  )}
                </div>
              </div>

              {/* CUADRANTE IV: BAJA PRIORIDAD / REEVALUAR (Bottom-Right) */}
              <div
                onClick={() =>
                  setSelectedQuadrantFilter(
                    selectedQuadrantFilter === "Q4_LOW_PRIORITY" ? "ALL" : "Q4_LOW_PRIORITY"
                  )
                }
                className={`p-3.5 rounded-lg border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  selectedQuadrantFilter === "Q4_LOW_PRIORITY"
                    ? "ring-2 ring-gray-600 bg-gray-100/90 border-gray-600 shadow-md"
                    : "bg-gray-50/70 border-gray-300 hover:border-gray-500 hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-gray-600 text-white px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                      <span>⏸️ IV. REEVALUAR / BAJA PRIORIDAD</span>
                    </span>
                    <span className="text-[11px] font-bold text-gray-900 font-mono">
                      {q4Plans.length} {q4Plans.length === 1 ? "Plan" : "Planes"}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-gray-900 mt-1">
                    Alto Horizonte (&gt;90d & &lt;60%)
                  </div>
                  <div className="text-[10px] font-mono text-gray-600 font-semibold mt-0.5">
                    Ahorro: -{formatMXN(q4Plans.reduce((s, p) => s + (p.expectedPEAReductionMXN || 0), 0))}
                  </div>
                </div>

                {/* Chips de Planes */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {q4Plans.map((p) => (
                    <div
                      key={p.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHighlightedPlanId(highlightedPlanId === p.id ? null : p.id);
                      }}
                      className={`p-1.5 rounded text-[10px] border leading-tight transition-all ${
                        highlightedPlanId === p.id
                          ? "bg-[#1F242B] text-white border-gray-400"
                          : "bg-white text-gray-800 border-gray-200 hover:border-gray-400"
                      }`}
                      title={`${p.code}: ${p.title} • Nodo: ${p.riskEvent?.processNode?.label || "General"}`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span>{p.code}</span>
                        <span className="text-[9px] text-gray-500">
                          -{(p.improvementPotentialPct * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="truncate text-[10px] font-sans font-medium">{p.title}</div>
                      <div className="text-[9px] text-gray-500 font-mono truncate">
                        {p.riskEvent?.processNode?.label || "Paso Operativo"}
                      </div>
                    </div>
                  ))}
                  {q4Plans.length === 0 && (
                    <div className="text-center py-4 text-[10px] text-gray-400 italic">
                      Sin iniciativas en baja prioridad
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (5 COLS): RADAR DE BRECHAS DEL PROCESO (RIESGOS HUÉRFANOS SIN PLAN Y CONTROLES NF) */}
        <div className="lg:col-span-5 bg-white rounded-bx p-5 shadow-card border border-gray-200 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-serif flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-600" />
                <span>Radar de Brechas del Proceso (Riesgos sin Plan)</span>
              </h3>
              <p className="text-[11px] text-gray-500">
                Eventos en diagrama que carecen de plan formal o tienen controles No Formalizados (NF).
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
              {orphanRisks.length} Huérfanos
            </span>
          </div>

          {orphanRisks.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50/60 rounded-lg border border-dashed border-emerald-300 text-xs text-emerald-800 space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <div className="font-bold">¡Excelente Cobertura de Control!</div>
              <p className="text-[11px] text-emerald-700">
                Todos los riesgos de este proceso cuentan con planes de acción vinculados o controles formalizados.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {orphanRisks.map((risk) => {
                const hasNF = risk.controls?.some((c: any) => c.control && !c.control.isFormalized);
                return (
                  <div
                    key={risk.id}
                    className="p-3 bg-[#FAFBFD] hover:bg-white rounded-lg border border-gray-200 hover:border-[#3299A8] transition-all shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                          {risk.code}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getZoneBadgeClasses(
                            risk.residualZone
                          )}`}
                        >
                          {risk.residualZone}
                        </span>
                        {hasNF && (
                          <span className="text-[9px] font-mono font-bold bg-orange-100 text-orange-800 border border-orange-300 px-1.5 py-0.2 rounded">
                            Control NF (Art. 88)
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-gray-400 block font-mono">PEA Actual</span>
                        <span className="text-xs font-mono font-bold text-rose-700">
                          {formatMXN(risk.expectedAnnualLossPEA || 0)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-gray-900 text-xs leading-snug">{risk.title}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono mt-1">
                        <Workflow className="w-3 h-3 text-[#3299A8]" />
                        <span className="truncate" title={risk.processNode?.label || "General"}>
                          Nodo: {risk.processNode?.label || "Paso Operativo General"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                        {risk.process?.code} • {risk.process?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenPlanForOrphanRisk(risk)}
                        className="bg-[#1F242B] hover:bg-[#2A313C] text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3 h-3 text-[#C0D725]" />
                        <span>+ Crear Plan / Quick-Win</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          CAPA 3: TARJETAS EJECUTIVAS DE QUICK-WINS CON SALTO EN MATRIZ 5×5 Y 3LD
         ========================================================================= */}
      <div className="bg-gradient-to-r from-emerald-50 via-lime-50/40 to-white rounded-bx p-5 border-2 border-[#C0D725] shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#C0D725] text-[#1F242B]">
              <Zap className="w-5 h-5 fill-[#1F242B]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-serif">
                Iniciativas de Máxima Prioridad Ejecutiva (Quick-Wins Activos)
              </h3>
              <p className="text-[11px] text-gray-600">
                Iniciativas con reducción &ge;60% en PEA/PMA y esfuerzo Bajo o Muy Bajo (&le;90 días).
                Monitoreo del salto de coordenadas en Matriz 5×5 y ciclo 3LD.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono font-bold bg-white text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-md shadow-2xs self-start sm:self-auto">
            {q1Plans.length} Quick-Wins En Curso
          </div>
        </div>

        {q1Plans.length === 0 ? (
          <div className="p-8 text-center bg-white/70 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500">
            No se identificaron iniciativas Quick-Win para el proceso seleccionado. Haz clic en &quot;✨ Sugerir Planes con IA&quot; para generar propuestas automáticas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {q1Plans.map((plan) => {
              const shift = calculateTargetShift(plan);
              const roi = (plan.expectedPEAReductionMXN / (plan.estimatedCostMXN || 1)).toFixed(1);

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-lg p-4 shadow-sm border transition-all flex flex-col justify-between space-y-3 ${
                    highlightedPlanId === plan.id
                      ? "ring-2 ring-[#C0D725] border-[#1F242B]"
                      : "border-gray-200"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                          {plan.code}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1 font-mono">
                          <Zap className="w-3 h-3 fill-emerald-600" />
                          <span>QUICK-WIN ({plan.timeScale})</span>
                        </span>
                        {plan.isSuggestedByAI && (
                          <span className="text-[9px] font-mono bg-cyan-100 text-[#267C89] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5 text-[#3299A8]" />
                            <span>IA Gemini</span>
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                          plan.status === "COMPLETED_VERIFIED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : plan.status === "APPROVED_COMMITTED"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : plan.status === "EVIDENCE_SUBMITTED"
                            ? "bg-purple-50 text-purple-800 border-purple-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {plan.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-xs leading-snug">{plan.title}</h4>
                    <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">
                      {plan.description}
                    </p>

                    {/* Etiquetas de Proceso y Nodo del Diagrama */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {plan.riskEvent?.process && (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-cyan-50 text-cyan-900 border border-cyan-200 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-[#3299A8]" />
                          <span className="truncate max-w-[170px]" title={plan.riskEvent.process.name}>
                            {plan.riskEvent.process.code} — {plan.riskEvent.process.name}
                          </span>
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                        <Workflow className="w-3 h-3 text-slate-500" />
                        <span
                          className="truncate max-w-[150px]"
                          title={plan.riskEvent?.processNode?.label || "Paso General"}
                        >
                          Nodo: {plan.riskEvent?.processNode?.label || "Paso General"}
                        </span>
                      </span>
                    </div>

                    {/* BLOQUE VISUAL DE SALTO EN MATRIZ 5x5 */}
                    <div className="bg-[#FAFBFD] p-2.5 rounded-lg border border-gray-200 space-y-1.5">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Desplazamiento Matriz 5×5 (Pre &rarr; Post)</span>
                        <span className="text-emerald-700 font-bold font-mono">
                          -{(plan.improvementPotentialPct * 100).toFixed(0)}% Efectividad
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400">Actual:</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold border ${getZoneBadgeClasses(
                              shift.baseZone
                            )}`}
                          >
                            {shift.baseP}×{shift.baseI} ({shift.baseScore})
                          </span>
                        </div>

                        <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400">Objetivo:</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold border ${getZoneBadgeClasses(
                              shift.targetZone
                            )}`}
                          >
                            {shift.targetP}×{shift.targetI} ({shift.targetScore})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Métricas Financieras y ROI */}
                  <div className="pt-2 border-t border-gray-100 text-xs space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-gray-400 block text-[9px]">Ahorro PEA:</span>
                        <strong className="text-emerald-700">
                          -{formatMXN(plan.expectedPEAReductionMXN)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px]">Inversión:</span>
                        <strong className="text-gray-800">{formatMXN(plan.estimatedCostMXN)}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 block text-[9px]">Retorno ROI:</span>
                        <span className="font-bold text-[#1F242B] bg-[#C0D725] px-1.5 py-0.2 rounded border border-[#AEC41D] inline-block">
                          {roi}x
                        </span>
                      </div>
                    </div>

                    {/* Evidencias SHA-256 vinculadas */}
                    {plan.evidences && plan.evidences.length > 0 && (
                      <div className="bg-gray-50 p-2 rounded border border-gray-200 text-[10px] space-y-1">
                        <div className="flex items-center justify-between text-gray-700 font-semibold">
                          <div className="flex items-center gap-1">
                            <Paperclip className="w-3 h-3 text-[#3299A8]" />
                            <span>{plan.evidences.length} Evidencia(s) SHA-256</span>
                          </div>
                          {plan.evidences.some((e: any) => e.approvedByUAIR) && (
                            <span className="text-[9px] text-emerald-700 font-bold">
                              ✓ Aprobada por UAIR
                            </span>
                          )}
                        </div>
                        {plan.evidences.slice(0, 1).map((ev: any) => (
                          <div key={ev.id} className="text-gray-500 truncate font-mono text-[9px]">
                            {ev.fileName} • {ev.fileHashSha256.slice(0, 14)}...
                          </div>
                        ))}
                      </div>
                    )}

                    {/* BARRA DE GOBERNANZA 3RD LÍNEAS DE DEFENSA */}
                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {plan.signedByBusinessHead ? (
                          <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>1ª Línea: Firmado</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={signingPlanId === plan.id}
                            onClick={() => handleSignPlan(plan.id)}
                            className="bg-[#1F242B] hover:bg-[#2A313C] text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <PenTool className="w-3 h-3 text-[#C0D725]" />
                            <span>{signingPlanId === plan.id ? "Firmando..." : "Firmar 1ª Línea"}</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlanForEvidence(plan);
                            setIsEvidenceModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1 transition-colors border border-gray-300 cursor-pointer"
                          title="Adjuntar evidencia de remediación y sellar con hash SHA-256"
                        >
                          <Paperclip className="w-3 h-3 text-[#3299A8]" />
                          <span>+ Evidencia</span>
                        </button>

                        {/* Botón 2ª Línea: Verificar UAIR y Aplicar Mitigación */}
                        {plan.status !== "COMPLETED_VERIFIED" ? (
                          <button
                            type="button"
                            disabled={verifyingPlanId === plan.id}
                            onClick={() => handleVerifyAndApplyPlan(plan.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                            title="Verificar cumplimiento por 2ª Línea UAIR y formalizar controles CUB Art. 88"
                          >
                            {verifyingPlanId === plan.id ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Verificando...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3 h-3" />
                                <span>Verificar UAIR</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Mitigado UAIR</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          CAPA 4: INVENTARIO COMPLETO DE PLANES (AGRUPADO O TABULAR)
         ========================================================================= */}
      <div className="bg-white rounded-bx shadow-card border border-gray-200 overflow-hidden space-y-0">
        {/* Cabecera del Inventario con Filtros y Switch de Vista */}
        <div className="bg-[#1F242B] text-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold font-serif">
              Inventario Maestro de Planes de Mitigación de Banco B×+
            </h3>
            <span className="text-[10px] font-mono bg-[#C0D725] text-[#1F242B] font-bold px-2 py-0.5 rounded">
              {displayPlans.length} Planes Mostrados
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Buscador de Planes */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar plan, riesgo o nodo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#2A313C] text-white text-xs pl-7 pr-3 py-1.5 rounded border border-gray-700 outline-none focus:border-[#C0D725] w-52 placeholder:text-gray-400"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
            </div>

            {/* Switch de Modo: Agrupado por Proceso vs. Tabla Plana */}
            <div className="flex bg-[#2A313C] p-0.5 rounded border border-gray-700 text-xs">
              <button
                type="button"
                onClick={() => setTableLayout("GROUPED")}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  tableLayout === "GROUPED"
                    ? "bg-[#C0D725] text-[#1F242B]"
                    : "text-gray-300 hover:text-white"
                }`}
                title="Agrupar planes por proceso bancario"
              >
                Por Proceso
              </button>
              <button
                type="button"
                onClick={() => setTableLayout("FLAT")}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  tableLayout === "FLAT"
                    ? "bg-[#C0D725] text-[#1F242B]"
                    : "text-gray-300 hover:text-white"
                }`}
                title="Ver lista plana tabular de todos los planes"
              >
                Tabla Plana
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Filtros de Cuadrante */}
        <div className="p-2.5 bg-gray-50 border-b border-gray-200 flex gap-2 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setSelectedQuadrantFilter("ALL")}
            className={`px-2.5 py-1 rounded font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              selectedQuadrantFilter === "ALL"
                ? "bg-[#1F242B] text-white border-[#1F242B]"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            Todos los Cuadrantes ({processScopedPlans.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedQuadrantFilter("Q1_QUICK_WIN")}
            className={`px-2.5 py-1 rounded font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              selectedQuadrantFilter === "Q1_QUICK_WIN"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50"
            }`}
          >
            I. Quick-Wins ({q1Plans.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedQuadrantFilter("Q2_STRUCTURAL")}
            className={`px-2.5 py-1 rounded font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              selectedQuadrantFilter === "Q2_STRUCTURAL"
                ? "bg-[#3299A8] text-white border-[#3299A8]"
                : "bg-white text-[#267C89] border-cyan-300 hover:bg-cyan-50"
            }`}
          >
            II. Estructurales Core ({q2Plans.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedQuadrantFilter("Q3_TACTICAL")}
            className={`px-2.5 py-1 rounded font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              selectedQuadrantFilter === "Q3_TACTICAL"
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-white text-amber-800 border-amber-300 hover:bg-amber-50"
            }`}
          >
            III. Mejoras Tácticas ({q3Plans.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedQuadrantFilter("Q4_LOW_PRIORITY")}
            className={`px-2.5 py-1 rounded font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              selectedQuadrantFilter === "Q4_LOW_PRIORITY"
                ? "bg-gray-700 text-white border-gray-700"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            IV. Baja Prioridad ({q4Plans.length})
          </button>
        </div>

        {/* TABLA PRINCIPAL DE PLANES */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7F9] text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-24">Código</th>
                <th className="py-2.5 px-3 min-w-[220px]">Iniciativa / Plan de Acción</th>
                <th className="py-2.5 px-3 min-w-[200px]">Riesgo & Proceso / Nodo</th>
                <th className="py-2.5 px-3 text-center min-w-[140px]">Salto 5×5 (Pre &rarr; Post)</th>
                <th className="py-2.5 px-3 text-center min-w-[130px]">Inversión & ROI</th>
                <th className="py-2.5 px-3 text-center w-24">Plazo</th>
                <th className="py-2.5 px-3 text-center min-w-[160px]">Gobernanza 3 Líneas</th>
                <th className="py-2.5 px-3 text-center min-w-[140px]">Estado & Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableLayout === "GROUPED" ? (
                groupedDisplayPlans.map((group) => {
                  const groupSavings = group.plans.reduce(
                    (acc: number, p: any) => acc + (p.expectedPEAReductionMXN || 0),
                    0
                  );
                  const groupCost = group.plans.reduce(
                    (acc: number, p: any) => acc + (p.estimatedCostMXN || 0),
                    0
                  );
                  const groupROI = (groupSavings / (groupCost || 1)).toFixed(1);

                  return (
                    <React.Fragment key={group.process.code || group.process.name}>
                      {/* Fila Encabezado de Proceso Bancario */}
                      <tr className="bg-[#1F242B] text-white">
                        <td colSpan={8} className="py-2.5 px-3 border-y border-gray-800">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[#C0D725] bg-[#2A313C] px-2 py-0.5 rounded text-[11px] font-bold border border-[#C0D725]/30">
                                {group.process.code}
                              </span>
                              <span className="font-bold text-white text-xs tracking-wide">
                                {group.process.name}
                              </span>
                              {group.process.macroProcess && (
                                <span className="text-gray-400 text-[10px] hidden md:inline">
                                  • {group.process.macroProcess.name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] font-mono">
                              <span className="bg-[#2A313C] text-gray-200 px-2 py-0.5 rounded border border-gray-700">
                                {group.plans.length} {group.plans.length === 1 ? "plan" : "planes"}
                              </span>
                              <span className="text-emerald-400 font-semibold">
                                -ΔPEA: -{formatMXN(groupSavings)}
                              </span>
                              <span className="text-gray-300">
                                Inv: {formatMXN(groupCost)}
                              </span>
                              <span className="text-[#C0D725] font-bold">
                                ROI: {groupROI}x
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Filas de Planes del Proceso */}
                      {group.plans.map((p: any) => renderPlanRow(p))}
                    </React.Fragment>
                  );
                })
              ) : (
                displayPlans.map((p) => renderPlanRow(p))
              )}
              {displayPlans.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 text-xs">
                    No se encontraron planes para los criterios seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: NUEVO PLAN DE MITIGACIÓN
         ========================================================================= */}
      {isNewPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-gray-200">
            <div className="flex items-start justify-between pb-3 border-b border-gray-200">
              <div>
                <span className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
                  Gobernanza CNBV & Matriz 2×2 Quick-Wins
                </span>
                <h3 className="text-base font-bold text-gray-900 font-serif">
                  Nuevo Plan de Acción de Mitigación
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPlanModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Riesgo a Mitigar (Matriz Viva por Proceso):
                </label>
                <CustomSelect
                  options={risks
                    .filter((r) => selectedProcessId === "ALL" || r.processId === selectedProcessId)
                    .map((r) => ({
                      value: r.id,
                      label: `${r.code} - ${r.title}`,
                      badge: `${r.residualZone} (${r.process?.code || "TRANS"} • ${
                        r.processNode?.label || "General"
                      })`,
                    }))}
                  value={selectedRiskId}
                  onChange={setSelectedRiskId}
                  theme="light"
                  className="w-full"
                  dropdownClassName="w-full md:w-[480px]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Título de la Iniciativa de Mitigación:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Implementación de doble factor biométrico en transferencias corporativas..."
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-xs outline-none focus:border-[#3299A8]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Descripción de la Solución:</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Mecanismo de remediación, entregables técnicos y cambios en el control interno..."
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-xs outline-none focus:border-[#3299A8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tipo de Plan:</label>
                  <CustomSelect
                    options={planTypeOptions}
                    value={planType}
                    onChange={setPlanType}
                    theme="light"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Potencial de Mejora (&Delta;PEA):</label>
                  <CustomSelect
                    options={improvementOptions}
                    value={String(improvementPct)}
                    onChange={(v) => setImprovementPct(Number(v))}
                    theme="light"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Escala de Costo:</label>
                  <CustomSelect
                    options={costScaleOptions}
                    value={costScale}
                    onChange={setCostScale}
                    theme="light"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Costo Estimado (MXN):</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Plazo de Implem. (Días):</label>
                  <input
                    type="number"
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-xs"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div
                className={`p-3 rounded-lg border text-xs space-y-1 ${
                  liveIsQuickWin
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1.5">
                    {liveIsQuickWin && <Zap className="w-4 h-4 fill-emerald-600 text-emerald-600" />}
                    <span>
                      {liveIsQuickWin
                        ? "¡Califica para Cuadrante I: QUICK-WIN!"
                        : "Clasificación: Iniciativa Estándar / Proyecto Estructural"}
                    </span>
                  </div>
                  <span className="font-mono text-[11px]">
                    Impacto: {(improvementPct * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  {liveIsQuickWin
                    ? "Alta rentabilidad: Reducción superior al 60% de pérdidas con esfuerzo bajo (<= 90 días)."
                    : "Iniciativa con horizonte de largo plazo o inversión superior a escala baja."}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div>
                    <span className="text-gray-500">Reducción PEA: </span>
                    <strong className="text-emerald-700">-{formatMXN(livePEAReduction)}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Reducción PMA: </span>
                    <strong className="text-orange-700">-{formatMXN(livePMAReduction)}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPlanModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPlan}
                  className="px-5 py-2 bg-[#1F242B] hover:bg-[#2A313C] text-white rounded font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submittingPlan ? "Guardando..." : "Crear y Cuantificar Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: ADJUNTAR EVIDENCIA DOCUMENTAL SHA-256
         ========================================================================= */}
      {isEvidenceModalOpen && selectedPlanForEvidence && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200 border border-gray-200">
            <div className="flex items-start justify-between pb-3 border-b border-gray-200">
              <div>
                <span className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
                  Sello Criptográfico CNBV CUB Art. 88
                </span>
                <h3 className="text-base font-bold text-gray-900 font-serif">
                  Adjuntar Evidencia de Remediación
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Plan: {selectedPlanForEvidence.code} — {selectedPlanForEvidence.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEvidenceModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadEvidence} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Nombre del Archivo / Documento:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Acta_Comite_Auditoria_Remediacion_v2.pdf"
                  value={evidenceFileName}
                  onChange={(e) => setEvidenceFileName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded font-mono text-xs outline-none focus:border-[#3299A8]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Comentarios / Observaciones de Auditoría:
                </label>
                <textarea
                  rows={3}
                  placeholder="Describa la prueba de efectividad del control, fechas de validación o referencias a minutas..."
                  value={evidenceComments}
                  onChange={(e) => setEvidenceComments(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-xs outline-none focus:border-[#3299A8]"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded text-[11px] text-slate-700 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#3299A8]" />
                  <span>Sello Inalterable CUB Art. 88</span>
                </div>
                <p className="text-slate-600">
                  Al subir el archivo, el sistema computará un hash criptográfico SHA-256 único y registrará el
                  sello de tiempo en la bitácora inalterable del banco para auditoría de 3ª línea y CNBV.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEvidenceModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingEvidence}
                  className="px-5 py-2 bg-[#1F242B] hover:bg-[#2A313C] text-white rounded font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submittingEvidence ? "Sellando Evidencia..." : "Registrar y Sellar SHA-256"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: ASISTENTE IA GEMINI — PREVISUALIZACIÓN Y SELECCIÓN DE PROPUESTAS
         ========================================================================= */}
      {isAIModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col border border-gray-200 animate-in zoom-in-95 duration-200">
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#1F242B] text-[#C0D725]">
                  <Sparkles className="w-5 h-5 text-[#C0D725]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      Google Gemini 2.5 Flash en Vivo
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      CUB Art. 88 • Banxico • NIF C-16
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 font-serif mt-0.5">
                    Asistente IA: Propuestas de Mitigación y Quick-Wins para el Proceso
                  </h3>
                  <p className="text-xs text-gray-500">
                    Proceso:{" "}
                    <strong className="text-gray-800">
                      {selectedProcessId === "ALL"
                        ? "Portafolio Consolidado (Todos los Procesos)"
                        : currentProcessObj
                        ? `${currentProcessObj.code} — ${currentProcessObj.name}`
                        : "Proceso Bancario"}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAIModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Dinámico: Cargando vs. Propuestas */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {loadingAIProposals ? (
                <div className="py-16 text-center space-y-4">
                  <div className="inline-flex p-4 rounded-full bg-cyan-50 border border-cyan-200 text-[#3299A8]">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 font-serif">
                      Gemini 2.5 Flash analizando nodos del diagrama, riesgos en el Radar de Brechas y controles NF...
                    </h4>
                    <p className="text-xs text-gray-500 max-w-lg mx-auto mt-1">
                      Evaluando parámetros CUB Art. 88 (CNBV), Circular 8/2019 Banxico y NIF C-16 para diseñar
                      Quick-Wins y proyectos estructurales con salto cuantificado 5×5 y ROI financiero.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-gray-600">
                    <span className="bg-gray-100 px-2.5 py-1 rounded border border-gray-200">
                      1. Análisis Causal por Nodo
                    </span>
                    <span className="bg-gray-100 px-2.5 py-1 rounded border border-gray-200">
                      2. Estimación Salto Matriz 5×5
                    </span>
                    <span className="bg-gray-100 px-2.5 py-1 rounded border border-gray-200">
                      3. Cuantificación ROI ΔPEA / Costo
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Dictamen Ejecutivo de Gemini */}
                  {aiExecutiveDiagnosis && (
                    <div className="p-3.5 bg-[#1F242B] text-white rounded-lg border border-[#3299A8]/40 shadow-sm flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-[#C0D725] shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-[#C0D725] tracking-wide uppercase text-[10px] font-mono">
                          Dictamen Ejecutivo B×+ Copilot (Gemini 2.5 Flash)
                        </div>
                        <p className="text-gray-200 leading-relaxed font-sans">{aiExecutiveDiagnosis}</p>
                      </div>
                    </div>
                  )}

                  {/* Barra de Selección y Conteo */}
                  <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                      <span>Planes Propuestos ({aiProposals.length} iniciativas diseñadas)</span>
                      <span className="text-gray-500 font-normal">
                        • {selectedProposalIndexes.size} seleccionada(s) para inserción
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleSelectAllProposals}
                      className="text-[#3299A8] hover:text-[#267C89] font-bold text-xs hover:underline cursor-pointer"
                    >
                      {selectedProposalIndexes.size === aiProposals.length
                        ? "Deseleccionar Todas"
                        : "Seleccionar Todas"}
                    </button>
                  </div>

                  {/* Tarjetas de Propuestas con Checkbox */}
                  <div className="space-y-3">
                    {aiProposals.map((prop, idx) => {
                      const isSelected = selectedProposalIndexes.has(idx);
                      const isQW = prop.quadrant === "Q1_QUICK_WIN";
                      const isStruct = prop.quadrant === "Q2_STRUCTURAL";
                      const isTactical = prop.quadrant === "Q3_TACTICAL";

                      return (
                        <div
                          key={prop.riskEventId + "-" + idx}
                          onClick={() => toggleProposalSelection(idx)}
                          className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-white border-[#3299A8] shadow-sm ring-1 ring-[#3299A8]/30"
                              : "bg-gray-50/70 border-gray-200 opacity-60 hover:opacity-90"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleProposalSelection(idx)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded text-[#3299A8] focus:ring-[#3299A8] cursor-pointer mt-1"
                            />

                            <div className="flex-1 space-y-2">
                              {/* Encabezado de la propuesta */}
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  {isQW ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1 font-mono">
                                      <Zap className="w-3 h-3 fill-emerald-600" />
                                      <span>⚡ I. Quick-Win (≤90d & ≥60%)</span>
                                    </span>
                                  ) : isStruct ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-[#267C89] border border-cyan-300 inline-flex items-center gap-1 font-mono">
                                      <Building2 className="w-3 h-3" />
                                      <span>🏗️ II. Estructural Core</span>
                                    </span>
                                  ) : isTactical ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1 font-mono">
                                      <span>🔧 III. Mejora Táctica</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-300 inline-flex items-center gap-1 font-mono">
                                      <span>⏸️ IV. Baja Prioridad</span>
                                    </span>
                                  )}

                                  <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                    {prop.riskCode}
                                  </span>

                                  <span className="text-xs font-semibold text-gray-700 truncate max-w-[280px]">
                                    {prop.riskTitle}
                                  </span>
                                </div>

                                <div className="text-[11px] font-mono text-[#3299A8] bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                                  Nodo: {prop.processNodeLabel}
                                </div>
                              </div>

                              {/* Título y Descripción */}
                              <div>
                                <h4 className="text-xs font-bold text-gray-900 leading-snug">{prop.title}</h4>
                                <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                                  {prop.description}
                                </p>
                              </div>

                              {/* Salto 5x5 y Métricas Cuantitativas */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
                                {/* Salto en Matriz 5x5 */}
                                <div className="inline-flex items-center gap-1.5 font-mono text-[10px]">
                                  <span className="text-gray-500 font-sans font-semibold">Salto 5×5:</span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded font-bold border ${getZoneBadgeClasses(
                                      prop.currentZone
                                    )}`}
                                  >
                                    {prop.currentProb}×{prop.currentImp} ({prop.currentZone})
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-emerald-600" />
                                  <span
                                    className={`px-1.5 py-0.2 rounded font-bold border ${getZoneBadgeClasses(
                                      prop.targetZone
                                    )}`}
                                  >
                                    {prop.targetProb}×{prop.targetImp} ({prop.targetZone})
                                  </span>
                                </div>

                                {/* Chips Cuantitativos */}
                                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                                  <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                                    Mejora: {(prop.improvementPotentialPct * 100).toFixed(0)}%
                                  </span>
                                  <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded border border-gray-200">
                                    Costo: {formatMXN(prop.estimatedCostMXN)}
                                  </span>
                                  <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded border border-gray-200">
                                    Plazo: {prop.estimatedDays}d
                                  </span>
                                  <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                                    -ΔPEA: -{formatMXN(prop.expectedPEAReductionMXN)}
                                  </span>
                                  <span className="bg-[#C0D725] text-[#1F242B] px-1.5 py-0.5 rounded font-bold border border-[#AEC41D]">
                                    ROI: {prop.roiMultiplier}
                                  </span>
                                </div>
                              </div>

                              {/* Rationale AI */}
                              {prop.rationaleAI && (
                                <div className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded border border-gray-200 font-sans flex items-start gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-[#3299A8] shrink-0 mt-0.5" />
                                  <span>
                                    <strong className="text-gray-700">Justificación IA:</strong>{" "}
                                    {prop.rationaleAI}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Barra Inferior / Acciones del Modal */}
            {!loadingAIProposals && aiProposals.length > 0 && (
              <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-gray-600">
                    <strong className="text-gray-900 font-bold">{selectedProposalIndexes.size}</strong> de{" "}
                    {aiProposals.length} iniciativas seleccionadas
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-700">
                    Inversión:{" "}
                    <strong>
                      {formatMXN(
                        aiProposals
                          .filter((_, idx) => selectedProposalIndexes.has(idx))
                          .reduce((s, p) => s + (p.estimatedCostMXN || 0), 0)
                      )}
                    </strong>
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-emerald-700 font-semibold">
                    Ahorro Anual -ΔPEA: -
                    {formatMXN(
                      aiProposals
                        .filter((_, idx) => selectedProposalIndexes.has(idx))
                        .reduce((s, p) => s + (p.expectedPEAReductionMXN || 0), 0)
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAIModalOpen(false)}
                    className="px-3.5 py-1.5 border border-gray-300 rounded font-semibold text-gray-600 hover:bg-gray-50 text-xs cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    disabled={selectedProposalIndexes.size === 0 || committingAIPlans}
                    onClick={handleCommitSelectedAIPlans}
                    className="px-4 py-2 bg-[#1F242B] hover:bg-[#2A313C] text-white rounded font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {committingAIPlans ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C0D725]" />
                        <span>Insertando Planes...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#C0D725]" />
                        <span>Insertar {selectedProposalIndexes.size} Planes en la Matriz 2×2</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
