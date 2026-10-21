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
} from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface ActionPlansViewProps {
  currentRole: RoleType;
}

export function ActionPlansView({ currentRole }: ActionPlansViewProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

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

  // Fetch processes
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

  const handleSignPlan = async (planId: string) => {
    try {
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
        setStatusBanner("Plan de Remediación firmado formalmente y sellado en el Audit Trail.");
        setTimeout(() => setStatusBanner(null), 3500);
        fetchPlans();
      }
    } catch (e) {
      console.error("Error signing plan:", e);
    }
  };

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
        setStatusBanner("Plan de acción registrado y cuantificado con éxito en la base de datos.");
        setTimeout(() => setStatusBanner(null), 3500);
        fetchPlans();
      }
    } catch (err) {
      console.error("Error creating plan:", err);
    } finally {
      setSubmittingPlan(false);
    }
  };

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
        setStatusBanner(`Evidencia adjuntada exitosamente con huella criptográfica SHA-256: ${data.fileHashSha256.slice(0, 16)}...`);
        setTimeout(() => setStatusBanner(null), 4500);
        fetchPlans();
      }
    } catch (err) {
      console.error("Error uploading evidence:", err);
    } finally {
      setSubmittingEvidence(false);
    }
  };

  // Filter plans based on selected process
  const filteredPlans = useMemo(() => {
    if (selectedProcessId === "ALL") return plans;
    return plans.filter((p) => p.riskEvent?.processId === selectedProcessId);
  }, [plans, selectedProcessId]);

  const quickWins = useMemo(() => {
    return filteredPlans.filter((p) => p.isQuickWin);
  }, [filteredPlans]);

  const selectedRisk = risks.find((r) => r.id === selectedRiskId);
  const livePEAReduction = selectedRisk ? selectedRisk.expectedAnnualLossPEA * improvementPct : 0;
  const livePMAReduction = selectedRisk ? selectedRisk.maxAnnualLossPMA * improvementPct : 0;

  const liveIsQuickWin =
    improvementPct >= 0.60 &&
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
    { value: "0.60", label: "Media Mitigación (60% reducción de pérdidas)" },
    { value: "0.25", label: "Baja Mitigación (25% reducción de pérdidas)" },
  ];

  return (
    <div className="space-y-6 w-full">
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

      {/* Header and Process Filter */}
      <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 font-serif">
            Matriz de Priorización de Mitigación y Cuadrante &quot;Quick-Wins&quot;
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cruce analítico de Potencial de Mejora (&ge;60% PEA) vs. Esfuerzo de Implementación (&le;90 días) por Proceso Bancario
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Filtro por Proceso */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Filtrar por Proceso:</span>
            <div className="w-64 min-w-0">
              <CustomSelect
                options={[
                  { value: "ALL", label: "Todos los Procesos Bancarios" },
                  ...processes.map((p) => ({
                    value: p.id,
                    label: `${p.code} — ${p.name}`,
                  })),
                ]}
                value={selectedProcessId}
                onChange={setSelectedProcessId}
                theme="light"
              />
            </div>
          </div>

          <span className="text-xs font-mono font-bold bg-[#C0D725] text-[#1F242B] px-3 py-1.5 rounded-[4px] border border-[#AEC41D] flex items-center gap-1.5 shadow-xs uppercase tracking-wide">
            <Zap className="w-3.5 h-3.5 fill-[#1F242B]" />
            <span>{quickWins.length} Quick-Wins</span>
          </span>

          <button
            onClick={() => setIsNewPlanModalOpen(true)}
            className="bg-[#1F242B] hover:bg-[#2A313C] text-white text-xs font-bold px-3.5 py-1.5 rounded-md shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#C0D725]" />
            <span>+ Nuevo Plan de Mitigación</span>
          </button>
        </div>
      </div>

      {/* QUICK-WINS HIGHLIGHT SECTION */}
      <div className="bg-gradient-to-r from-emerald-50 via-lime-50/40 to-white rounded-bx p-5 border-2 border-[#C0D725] shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#C0D725] text-[#1F242B]">
              <Zap className="w-5 h-5 fill-[#1F242B]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-serif">
                Iniciativas de Máxima Prioridad Ejecutiva (Quick-Wins)
              </h3>
              <p className="text-[11px] text-gray-600">
                Iniciativas con reducción &ge; 60% en PEA/PMA y esfuerzo Bajo o Muy Bajo (&le;90 días).
                {selectedProcessId !== "ALL" && (
                  <span className="font-semibold text-emerald-800 ml-1">
                    Filtrado por proceso activo.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {quickWins.length === 0 ? (
          <div className="p-6 text-center bg-white/60 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500">
            No se identificaron iniciativas Quick-Win para el proceso seleccionado. Cambia el filtro para ver otros procesos o da de alta un nuevo plan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickWins.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      {plan.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-emerald-600" />
                      <span>QUICK-WIN ({plan.timeScale})</span>
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-900 text-xs mt-1.5 leading-snug">
                    {plan.title}
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Etiquetas de Proceso y Nodo del Diagrama */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
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
                      <span className="truncate max-w-[140px]" title={plan.riskEvent?.processNode?.label || "Paso General"}>
                        Nodo: {plan.riskEvent?.processNode?.label || "Paso General"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Metrics & Signature Status */}
                <div className="pt-2 border-t border-gray-100 text-xs space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500">Beneficio Anual PEA:</span>
                    <strong className="text-emerald-700 font-mono">
                      -{formatMXN(plan.expectedPEAReductionMXN)}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500">Reducción PMA:</span>
                    <strong className="text-orange-700 font-mono">
                      -{formatMXN(plan.expectedPMAReductionMXN)}
                    </strong>
                  </div>

                  {/* Evidences summary if any */}
                  {plan.evidences && plan.evidences.length > 0 && (
                    <div className="bg-gray-50 p-2 rounded border border-gray-200 text-[10px] space-y-1">
                      <div className="flex items-center gap-1 text-gray-700 font-semibold">
                        <Paperclip className="w-3 h-3 text-[#3299A8]" />
                        <span>{plan.evidences.length} Evidencia(s) SHA-256 vinculadas</span>
                      </div>
                      {plan.evidences.slice(0, 2).map((ev: any) => (
                        <div key={ev.id} className="text-gray-500 truncate font-mono">
                          {ev.fileName} <span className="text-gray-400">({ev.fileHashSha256.slice(0, 10)}...)</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      {plan.signedByBusinessHead ? (
                        <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Firmado por Titular</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-orange-700 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Firma Pendiente</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedPlanForEvidence(plan);
                          setIsEvidenceModalOpen(true);
                        }}
                        className="text-[10px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1 transition-colors border"
                        title="Adjuntar evidencia de remediación y sellar con hash SHA-256"
                      >
                        <Paperclip className="w-3 h-3 text-[#3299A8]" />
                        <span>+ Evidencia</span>
                      </button>

                      {!plan.signedByBusinessHead && (
                        <button
                          onClick={() => handleSignPlan(plan.id)}
                          className="bg-[#1F242B] hover:bg-[#2A313C] text-white text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
                        >
                          <PenTool className="w-3 h-3 text-[#C0D725]" />
                          <span>Firmar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ALL ACTION PLANS TABLE */}
      <div className="bg-white rounded-bx shadow-card border border-gray-200 overflow-hidden">
        <div className="bg-[#1F242B] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold font-serif">
              Inventario Completo de Planes de Acción de Banco B×+
            </h3>
            {selectedProcessId !== "ALL" && (
              <span className="text-[10px] font-mono bg-[#C0D725] text-[#1F242B] font-bold px-2 py-0.5 rounded">
                Filtrado
              </span>
            )}
          </div>
          <span className="text-xs text-gray-300">
            {filteredPlans.length} Planes Mostrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7F9] text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 w-28">Código</th>
                <th className="py-2.5 px-4">Iniciativa / Plan de Acción</th>
                <th className="py-2.5 px-4">Riesgo & Proceso / Nodo</th>
                <th className="py-2.5 px-4 text-center">Mejora Estimada</th>
                <th className="py-2.5 px-4 text-center">Plazo</th>
                <th className="py-2.5 px-4 text-center">Firma Titular</th>
                <th className="py-2.5 px-4 text-center">Evidencias</th>
                <th className="py-2.5 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPlans.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-gray-600">
                    {p.code}
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-bold text-gray-900 leading-snug">{p.title}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                      {p.description}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{p.riskEvent?.title}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getZoneBadgeClasses(
                          p.riskEvent?.residualZone
                        )}`}
                      >
                        {p.riskEvent?.residualZone}
                      </span>
                      {p.riskEvent?.process && (
                        <span
                          className="text-[9px] font-mono text-[#3299A8] bg-cyan-50/90 px-1.5 py-0.5 rounded border border-cyan-200 truncate max-w-[140px]"
                          title={p.riskEvent.process.name}
                        >
                          {p.riskEvent.process.code}
                        </span>
                      )}
                      {p.riskEvent?.processNode && (
                        <span className="text-[9px] font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                          <Workflow className="w-2.5 h-2.5 text-gray-500" />
                          <span className="truncate max-w-[130px]" title={p.riskEvent.processNode.label}>
                            {p.riskEvent.processNode.label}
                          </span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold font-mono text-emerald-700 text-xs">
                      {(p.improvementPotentialPct * 100).toFixed(0)}%
                    </span>
                    <div className="text-[10px] text-gray-400">
                      -{formatMXN(p.expectedPEAReductionMXN)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-gray-700">
                    {p.estimatedDays} días
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.signedByBusinessHead ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Firmado
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedPlanForEvidence(p);
                        setIsEvidenceModalOpen(true);
                      }}
                      className="text-[10px] font-semibold text-[#3299A8] hover:text-[#267C89] bg-cyan-50 px-2 py-1 rounded border border-cyan-200 inline-flex items-center gap-1"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>{p.evidences?.length || 0} Archivo(s)</span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: NUEVO PLAN DE MITIGACIÓN */}
      {isNewPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-gray-200">
              <div>
                <span className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
                  Gobernanza CNBV & Quick-Wins
                </span>
                <h3 className="text-base font-bold text-gray-900 font-serif">
                  Nuevo Plan de Acción de Mitigación
                </h3>
              </div>
              <button
                onClick={() => setIsNewPlanModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Riesgo a Mitigar (Matriz Viva):</label>
                <CustomSelect
                  options={risks
                    .filter((r) => selectedProcessId === "ALL" || r.processId === selectedProcessId)
                    .map((r) => ({
                      value: r.id,
                      label: `${r.code} - ${r.title}`,
                      badge: `${r.residualZone} (${r.process?.code || "TRANS"} • ${r.processNode?.label || "General"})`,
                    }))}
                  value={selectedRiskId}
                  onChange={setSelectedRiskId}
                  theme="light"
                  className="w-full"
                  dropdownClassName="w-[480px]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Título de la Iniciativa:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Implementación de doble factor biométrico en transferencias corporativas..."
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-[#3299A8]"
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
                  className="w-full p-2 border rounded outline-none"
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
                  <label className="font-bold text-gray-700 block mb-1">Potencial de Mejora:</label>
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
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tiempo de Implem. (Días):</label>
                  <input
                    type="number"
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(Number(e.target.value))}
                    className="w-full p-2 border rounded bg-white"
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
                        ? "¡Califica para Cuadrante QUICK-WIN!"
                        : "Iniciativa de Mitigación Estándar"}
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
                  className="px-4 py-2 border rounded font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPlan}
                  className="px-5 py-2 bg-[#1F242B] hover:bg-[#2A313C] text-white rounded font-bold transition-colors disabled:opacity-50"
                >
                  {submittingPlan ? "Guardando..." : "Crear y Cuantificar Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUNTAR EVIDENCIA DOCUMENTAL SHA-256 */}
      {isEvidenceModalOpen && selectedPlanForEvidence && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-gray-200">
              <div>
                <span className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
                  Sello Criptográfico CNBV
                </span>
                <h3 className="text-base font-bold text-gray-900 font-serif">
                  Adjuntar Evidencia de Remediación
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Plan: {selectedPlanForEvidence.code} — {selectedPlanForEvidence.title}
                </p>
              </div>
              <button
                onClick={() => setIsEvidenceModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
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
                  className="w-full p-2 border rounded font-mono text-xs outline-none focus:ring-1 focus:ring-[#3299A8]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Comentarios / Observaciones de Auditoría:</label>
                <textarea
                  rows={3}
                  placeholder="Describa la prueba de efectividad del control, fechas de validación o referencias a minutas..."
                  value={evidenceComments}
                  onChange={(e) => setEvidenceComments(e.target.value)}
                  className="w-full p-2 border rounded text-xs outline-none"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded text-[11px] text-slate-700 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#3299A8]" />
                  <span>Sello Inalterable CUB Art. 88</span>
                </div>
                <p className="text-slate-600">
                  Al subir el archivo, el sistema computará un hash criptográfico SHA-256 único y registrará el sello de tiempo en la bitácora inalterable del banco.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEvidenceModalOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingEvidence}
                  className="px-5 py-2 bg-[#1F242B] hover:bg-[#2A313C] text-white rounded font-bold transition-colors disabled:opacity-50"
                >
                  {submittingEvidence ? "Sellando Evidencia..." : "Registrar y Sellar SHA-256"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
