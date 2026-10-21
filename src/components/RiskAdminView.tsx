// src/components/RiskAdminView.tsx
"use client";

import React, { useState, useEffect } from "react";
import { formatMXN, getZoneBadgeClasses } from "@/lib/utils";
import { RISK_TYPE_LABELS } from "@/lib/constants";
import { BusinessLineBancoBx, RiskTypeCNBV, RoleType } from "@/types";
import {
  Plus,
  Search,
  Filter,
  ShieldCheck,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface RiskAdminViewProps {
  businessLine: BusinessLineBancoBx;
  currentRole: RoleType;
}

export function RiskAdminView({ businessLine, currentRole }: RiskAdminViewProps) {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedZone, setSelectedZone] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [cause, setCause] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [consequence, setConsequence] = useState("");
  const [taxonomyId, setTaxonomyId] = useState("");
  const [taxonomies, setTaxonomies] = useState<any[]>([]);
  const [prob, setProb] = useState(3);
  const [imp, setImp] = useState(4);
  const [frequency, setFrequency] = useState(0.5);
  const [avgImpact, setAvgImpact] = useState(2500000);
  const [worstImpact, setWorstImpact] = useState(8000000);
  const [reputation, setReputation] = useState(3);
  const [isEmerging, setIsEmerging] = useState(false);
  const [speiImpact, setSpeiImpact] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch risks based on filters
  const fetchRisks = () => {
    setLoading(true);
    let url = `/api/risks?businessLine=${businessLine}`;
    if (selectedZone !== "ALL") url += `&zone=${selectedZone}`;
    if (selectedType !== "ALL") url += `&riskType=${selectedType}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRisks(data.risks);
          if (data.risks.length > 0 && !taxonomyId) {
            setTaxonomyId(data.risks[0].taxonomyId);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRisks();
  }, [businessLine, selectedZone, selectedType, search]);

  // Extract unique taxonomies for the form
  useEffect(() => {
    fetch("/api/risks")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const uniqueTax = Array.from(
            new Map(data.risks.map((r: any) => [r.taxonomy.id, r.taxonomy])).values()
          );
          setTaxonomies(uniqueTax);
          if (uniqueTax.length > 0 && !taxonomyId) {
            setTaxonomyId((uniqueTax[0] as any).id);
          }
        }
      });
  }, []);

  // Governance: Approve risk by 2nd line
  const handleApproveRisk = async (riskId: string) => {
    setApprovingId(riskId);
    try {
      const res = await fetch("/api/risks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_AND_PUBLISH",
          riskId,
          userRole: currentRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusBanner("Riesgo formalmente validado, aprobado y publicado en la Matriz Viva (2ª Línea UAIR).");
        setTimeout(() => setStatusBanner(null), 3500);
        fetchRisks();
      }
    } catch (err) {
      console.error("Error approving risk:", err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleSubmitRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole === "INTERNAL_AUDITOR") return;

    try {
      setSubmitting(true);
      const targetStatus = currentRole === "PROCESS_OWNER" ? "UNDER_REVIEW" : "PUBLISHED";

      const res = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          cause,
          eventDescription,
          consequence,
          taxonomyId,
          origin: "PROCESSES",
          businessUnitId: risks[0]?.businessUnitId,
          processId: risks[0]?.processId,
          inherentProbability: prob,
          inherentImpact: imp,
          combinedControlFactor: 0.35,
          annualFrequencyNet: frequency,
          avgFinancialImpactMXN: avgImpact,
          worstCaseImpactMXN: worstImpact,
          reputationalImpactLevel: reputation,
          isEmergingRisk: isEmerging,
          speiImpact: speiImpact,
          userRole: currentRole,
          status: targetStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setTitle("");
        setCause("");
        setEventDescription("");
        setConsequence("");
        fetchRisks();

        if (targetStatus === "UNDER_REVIEW") {
          setStatusBanner("Riesgo registrado en 1ª Línea y enviado a revisión de la UAIR (2ª Línea).");
        } else {
          setStatusBanner("Riesgo registrado y publicado en la Matriz Viva.");
        }
        setTimeout(() => setStatusBanner(null), 3500);
      }
    } catch (e) {
      console.error("Error creating risk:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const isInternalAudit = currentRole === "INTERNAL_AUDITOR";
  const canApprove = currentRole === "UAIR_ADMIN" || currentRole === "C_LEVEL_CAIR";

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

      {/* Header and Controls */}
      <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
            Módulo 03 — Administración Core de Riesgos (Matriz Viva)
          </div>
          <h2 className="text-lg font-bold text-gray-900 font-serif">
            Catálogo Integral y Gobernanza de las 3 Líneas de Defensa
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Estructuración obligatoria CNBV: Causa Raíz &rarr; Evento de Riesgo &rarr; Consecuencia Financiera
          </p>
        </div>

        {isInternalAudit ? (
          <div className="bg-slate-100 border border-slate-300 text-slate-700 text-xs px-3.5 py-2 rounded-md flex items-center gap-2 font-medium">
            <Lock className="w-4 h-4 text-slate-500" />
            <span>Modo Auditoría 3ª Línea (Solo Lectura — CUB Art. 88)</span>
          </div>
        ) : (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#1F242B] hover:bg-[#2A313C] text-white text-xs font-bold px-3.5 py-2 rounded-md shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-[#C0D725]" />
            <span>+ Dar de Alta Nuevo Riesgo</span>
          </button>
        )}
      </div>

      {/* 11 CNBV Risk Types Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {(Object.keys(RISK_TYPE_LABELS) as RiskTypeCNBV[]).map((typeKey) => {
          const info = RISK_TYPE_LABELS[typeKey];
          const count = risks.filter((r) => r.taxonomy.riskType === typeKey).length;
          const isSelected = selectedType === typeKey;

          return (
            <div
              key={typeKey}
              onClick={() => setSelectedType(isSelected ? "ALL" : typeKey)}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? "bg-[#1F242B] text-white border-[#1F242B] shadow-md"
                  : "bg-white text-gray-800 border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="truncate">{info.name.split(" ")[0]}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              </div>
              <div className={`text-[10px] truncate mt-1 ${isSelected ? "text-gray-300" : "text-gray-500"}`}>
                {info.badge}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-bx p-3 shadow-card border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código, título, causa o consecuencia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-xs text-gray-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-medium whitespace-nowrap">Filtrar por Zona RAF:</span>
          <div className="w-60">
            <CustomSelect
              options={[
                { value: "ALL", label: "Todas las Zonas" },
                { value: "GREEN", label: "Verde (Dentro Apetito)", dotColor: "#10B981" },
                { value: "YELLOW", label: "Amarillo (Preventivo)", dotColor: "#F59E0B" },
                { value: "ORANGE", label: "Naranja (Excede Tolerancia)", dotColor: "#F97316" },
                { value: "RED", label: "Rojo (Transgresión)", dotColor: "#EF4444" },
              ]}
              value={selectedZone}
              onChange={setSelectedZone}
              theme="light"
            />
          </div>
        </div>
      </div>

      {/* Risks Table with Governance Actions */}
      <div className="bg-white rounded-bx shadow-card border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7F9] text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 w-28">Código</th>
                <th className="py-2.5 px-4">Triada CNBV (Causa &rarr; Evento &rarr; Consecuencia)</th>
                <th className="py-2.5 px-4">Tipo & Unidad</th>
                <th className="py-2.5 px-4 text-center">Inherente</th>
                <th className="py-2.5 px-4 text-center">Residual</th>
                <th className="py-2.5 px-4 text-right">PMA (VaR 99.9%)</th>
                <th className="py-2.5 px-4 text-right">PEA (Esperada)</th>
                <th className="py-2.5 px-4 text-center">Gobernanza / Aprobación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {risks.map((r) => {
                const isUnderReview = r.status === "UNDER_REVIEW";
                return (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-600">
                      <div>{r.code}</div>
                      <div className="text-[10px] text-gray-400 font-normal">
                        {new Date(r.createdAt).toLocaleDateString("es-MX")}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <div className="font-bold text-gray-900 leading-snug">{r.title}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                        <strong className="text-gray-700">Causa:</strong> {r.cause}
                      </div>
                      <div className="text-[11px] text-gray-600 line-clamp-1">
                        <strong className="text-gray-700">Consecuencia:</strong> {r.consequence}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-800 text-[11px]">
                        {r.taxonomy?.riskType}
                      </span>
                      <div className="text-[10px] text-gray-400">{r.businessUnit?.name}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="font-semibold text-gray-700">{r.inherentScore}</span>
                      <span className="text-[10px] text-gray-400 block">
                        ({r.inherentProbability}×{r.inherentImpact})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getZoneBadgeClasses(
                          r.residualZone
                        )}`}
                      >
                        {r.residualScore} ({r.residualZone})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-orange-700">
                      {formatMXN(r.maxAnnualLossPMA)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium font-mono text-gray-700">
                      {formatMXN(r.expectedAnnualLossPEA)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isUnderReview ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            En Revisión UAIR (1ª Línea)
                          </span>
                          {canApprove && (
                            <button
                              onClick={() => handleApproveRisk(r.id)}
                              disabled={approvingId === r.id}
                              className="bg-[#1F242B] hover:bg-[#2A313C] text-white text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-transform hover:scale-105 shadow-sm disabled:opacity-50"
                              title="Aprobar y publicar este riesgo en la Matriz Viva (2ª Línea)"
                            >
                              {approvingId === r.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-[#C0D725]" />
                              ) : (
                                <ShieldCheck className="w-3 h-3 text-[#C0D725]" />
                              )}
                              <span>Aprobar y Publicar</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Publicado (Matriz Viva)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ALTA DE RIESGO */}
      {isModalOpen && !isInternalAudit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-gray-200">
              <div>
                <span className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
                  Gobernanza CNBV — Matriz Viva
                </span>
                <h3 className="text-lg font-bold text-gray-900 font-serif">
                  Alta de Nuevo Evento de Riesgo
                </h3>
                <div className="mt-1 text-xs">
                  {currentRole === "PROCESS_OWNER" ? (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                      Flujo 1ª Línea: Se registrará en estado &quot;En Revisión UAIR&quot;
                    </span>
                  ) : (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                      Flujo 2ª Línea: Se publicará directamente en la Matriz Viva
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRisk} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Título del Riesgo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Descalce de liquidez en derivados FX..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded outline-none focus:border-[#3299A8]"
                />
              </div>

              {/* Triada CNBV */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">1. Causa Raíz:</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Vulnerabilidad en proceso, persona o tecnología..."
                    value={cause}
                    onChange={(e) => setCause(e.target.value)}
                    className="w-full p-2 border rounded outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">2. Evento Operativo:</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Materialización concreta clasificada CUB..."
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="w-full p-2 border rounded outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">3. Consecuencia:</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Impacto patrimonial, capital ICAP o sanción..."
                    value={consequence}
                    onChange={(e) => setConsequence(e.target.value)}
                    className="w-full p-2 border rounded outline-none text-xs"
                  />
                </div>
              </div>

              {/* Taxonomía y Cuantificación */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Taxonomía CNBV:</label>
                  <CustomSelect
                    options={taxonomies.map((t) => ({
                      value: t.id,
                      label: `${t.riskType} (${t.code})`,
                    }))}
                    value={taxonomyId}
                    onChange={setTaxonomyId}
                    theme="light"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Probabilidad Inherente (1-5):</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={prob}
                    onChange={(e) => setProb(Number(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Impacto Inherente (1-5):</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={imp}
                    onChange={(e) => setImp(Number(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {/* Parámetros Cuantitativos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded border">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Frecuencia Neta Anual (f):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={frequency}
                    onChange={(e) => setFrequency(Number(e.target.value))}
                    className="w-full p-1.5 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Impacto Medio (I_medio MXN):</label>
                  <input
                    type="number"
                    value={avgImpact}
                    onChange={(e) => setAvgImpact(Number(e.target.value))}
                    className="w-full p-1.5 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Peor Escenario (I_max MXN):</label>
                  <input
                    type="number"
                    value={worstImpact}
                    onChange={(e) => setWorstImpact(Number(e.target.value))}
                    className="w-full p-1.5 border rounded bg-white"
                  />
                </div>
              </div>

              {/* Flags de Riesgo Emergente */}
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEmerging}
                    onChange={(e) => setIsEmerging(e.target.checked)}
                    className="rounded text-[#3299A8]"
                  />
                  <span>Riesgo Emergente (ASG / Ciberseguridad)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={speiImpact}
                    onChange={(e) => setSpeiImpact(e.target.checked)}
                    className="rounded text-red-600"
                  />
                  <span>Afecta Canal SPEI (Circular 8/2019)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#1F242B] hover:bg-[#2A313C] text-white rounded font-bold transition-colors disabled:opacity-50"
                >
                  {submitting
                    ? "Registrando..."
                    : currentRole === "PROCESS_OWNER"
                    ? "Enviar a Revisión UAIR"
                    : "Publicar en Matriz Viva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
