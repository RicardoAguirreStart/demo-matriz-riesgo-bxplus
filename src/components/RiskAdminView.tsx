// src/components/RiskAdminView.tsx
"use client";

import React, { useState, useEffect } from "react";
import { formatMXN, getZoneBadgeClasses } from "@/lib/utils";
import { RISK_TYPE_LABELS } from "@/lib/constants";
import { BusinessLineBancoBx, RiskTypeCNBV, RoleType } from "@/types";
import { Plus, Search, Filter, ShieldCheck, X, Sparkles, AlertCircle } from "lucide-react";

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
          // Extraer taxonomías únicas para el selector
          const uniqueTax = Array.from(
            new Map(data.risks.map((r: any) => [r.taxonomy.id, r.taxonomy])).values()
          );
          setTaxonomies(uniqueTax);
          if (uniqueTax.length > 0 && !taxonomyId) {
            setTaxonomyId((uniqueTax[0] as any).id);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRisks();
  }, [businessLine, selectedZone, selectedType, search]);

  const handleSubmitRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
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
          status: "PUBLISHED",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        // Reset form
        setTitle("");
        setCause("");
        setEventDescription("");
        setConsequence("");
        fetchRisks();
        alert("¡Riesgo registrado y publicado en la Matriz Viva!");
      }
    } catch (e) {
      console.error("Error creating risk:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
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

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#1F242B] hover:bg-[#2A313C] text-white text-xs font-bold px-3.5 py-2 rounded-md shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#C0D725]" />
          <span>+ Dar de Alta Nuevo Riesgo</span>
        </button>
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
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? "bg-[#C0D725] text-[#1F242B]" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              </div>
              <div className="text-[9px] opacity-75 truncate mt-1">{info.badge}</div>
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
          <span className="text-gray-500 font-medium">Filtrar por Zona RAF:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-[#F5F7F9] border border-gray-300 rounded px-2 py-1 outline-none font-medium"
          >
            <option value="ALL">Todas las Zonas</option>
            <option value="GREEN">🟢 Verde (Dentro Apetito)</option>
            <option value="YELLOW">🟡 Amarillo (Preventivo)</option>
            <option value="ORANGE">🟠 Naranja (Excede Tolerancia)</option>
            <option value="RED">🔴 Rojo (Transgresión)</option>
          </select>
        </div>
      </div>

      {/* Risks Table */}
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
                <th className="py-2.5 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {risks.map((r) => (
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
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {r.status || "PUBLISHED"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ALTA DE RIESGO (4 VÍAS DE ENTRADA) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-gray-200">
              <div>
                <span className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
                  Gobernanza CNBV — Matriz Viva
                </span>
                <h3 className="text-lg font-bold text-gray-900 font-serif">
                  Alta Directa de Nuevo Evento de Riesgo
                </h3>
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
                  <select
                    value={taxonomyId}
                    onChange={(e) => setTaxonomyId(e.target.value)}
                    className="w-full p-2 border rounded bg-white"
                  >
                    {taxonomies.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.riskType} ({t.code})
                      </option>
                    ))}
                  </select>
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
                  {submitting ? "Publicando..." : "Publicar en Matriz Viva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
