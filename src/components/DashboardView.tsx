// src/components/DashboardView.tsx
"use client";

import React, { useEffect, useState } from "react";
import { formatMXN, formatPct, getZoneBadgeClasses } from "@/lib/utils";
import { BusinessLineBancoBx, RoleType } from "@/types";
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
} from "lucide-react";

interface DashboardViewProps {
  businessLine: BusinessLineBancoBx;
  currentRole: RoleType;
  onNavigateTab: (tab: string) => void;
  onOpenCopilot: () => void;
}

export function DashboardView({
  businessLine,
  currentRole,
  onNavigateTab,
  onOpenCopilot,
}: DashboardViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/stats?businessLine=${businessLine}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error("Error loading dashboard stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [businessLine]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#C0D725]"></div>
        <p className="mt-3 text-xs text-gray-500 font-medium">
          Cargando métricas ejecutivas y Marco RAF de Banco B×+...
        </p>
      </div>
    );
  }

  const { rafThresholds, topCriticalRisks, financials, zoneCounts, totalRisks } = data || {};

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Welcome Banner */}
      <div className="bg-[#1F242B] text-white rounded-bx p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-[#C0D725]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#C0D725] uppercase tracking-wider bg-[#292F38] px-2 py-0.5 rounded">
              Gobierno de Riesgos Bancarios CUB / CNBV
            </span>
            <span className="text-[11px] text-gray-400">
              Corte al Cierre Activo 2026
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight mt-1 text-white">
            Tablero Ejecutivo de Riesgos Relevantes y Marco RAF
          </h1>
          <p className="text-xs text-gray-300 mt-1 max-w-3xl leading-relaxed">
            Monitoreo en tiempo real de solvencia Basilea III, Cobertura de Liquidez CCL, reservas prospectivas NIF C-16 y priorización automatizada del Top 5–7 de riesgos críticos para el CAIR.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab("flowchart")}
            className="text-xs bg-[#292F38] hover:bg-[#343C47] text-gray-200 px-3 py-2 rounded-md font-medium border border-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#3299A8]" />
            <span>Ver Cadena de Valor</span>
          </button>
          <button
            onClick={onOpenCopilot}
            className="text-xs bg-[#C0D725] hover:bg-[#AEC41D] text-[#1F242B] px-3.5 py-2 rounded-md font-bold shadow-sm flex items-center gap-1.5 transition-transform hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#1F242B]" />
            <span>Simulador de Estrés</span>
          </button>
        </div>
      </div>

      {/* 1. TARJETAS DEL MARCO DE APETITO AL RIESGO (RAF - ART. 88 CUB) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3299A8]" />
            <span>Métricas del Marco de Apetito al Riesgo (RAF — Art. 88 CUB)</span>
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            4 Zonas de Semaforización: Verde | Amarillo | Naranja | Rojo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rafThresholds?.map((th: any) => {
            const isWorseHigher = th.direction === "HIGHER_IS_WORSE";
            let zoneColor = "border-emerald-500 text-emerald-700 bg-emerald-50";
            if (th.currentZone === "YELLOW") zoneColor = "border-amber-500 text-amber-700 bg-amber-50";
            if (th.currentZone === "ORANGE") zoneColor = "border-orange-500 text-orange-700 bg-orange-50";
            if (th.currentZone === "RED") zoneColor = "border-rose-500 text-rose-700 bg-rose-50";

            return (
              <div
                key={th.id}
                className="bg-white rounded-bx p-4 shadow-card border border-gray-200 hover:shadow-card-hover transition-all"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-bold text-gray-500 tracking-wide font-mono">
                    {th.metricCode}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-[3px] inline-flex items-center gap-1.5 ${getZoneBadgeClasses(
                      th.currentZone
                    )}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-[1px] inline-block ${
                        th.currentZone === "GREEN"
                          ? "bg-emerald-600"
                          : th.currentZone === "YELLOW"
                          ? "bg-amber-500"
                          : th.currentZone === "ORANGE"
                          ? "bg-orange-600"
                          : "bg-rose-600"
                      }`}
                    />
                    <span>
                      {th.currentZone === "GREEN"
                        ? "DENTRO DE APETITO"
                        : th.currentZone === "YELLOW"
                        ? "ATENCIÓN PREVENTIVA"
                        : th.currentZone === "ORANGE"
                        ? "EXCEDE TOLERANCIA"
                        : "TRANSGRESIÓN LÍMITE"}
                    </span>
                  </span>
                </div>

                <div className="mt-2">
                  <div className="text-xl sm:text-2xl font-bold font-serif text-[#1F242B]">
                    {th.unit === "MXN"
                      ? formatMXN(th.currentValue)
                      : th.unit === "%"
                      ? formatPct(th.currentValue)
                      : `${th.currentValue} ${th.unit}`}
                  </div>
                  <div className="text-xs font-medium text-gray-600 truncate mt-0.5">
                    {th.metricName}
                  </div>
                </div>

                {/* RAF Threshold Bar */}
                <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] space-y-1 text-gray-500">
                  <div className="flex justify-between">
                    <span>Apetito:</span>
                    <strong className="text-gray-800">
                      {th.unit === "%" ? formatPct(th.appetiteValue) : th.unit === "MXN" ? formatMXN(th.appetiteValue) : th.appetiteValue}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tolerancia:</span>
                    <strong className="text-gray-800">
                      {th.unit === "%" ? formatPct(th.toleranceValue) : th.unit === "MXN" ? formatMXN(th.toleranceValue) : th.toleranceValue}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Límite Regulatorio:</span>
                    <strong className="text-rose-700">
                      {th.unit === "%" ? formatPct(th.regulatoryLimitValue) : th.unit === "MXN" ? formatMXN(th.regulatoryLimitValue) : th.regulatoryLimitValue}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. RESUMEN FINANCIERO Y DISTRIBUCIÓN 5x5 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cartera Crediticia NIF C-16 & Reservas */}
        <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Crédito & Reservas NIF C-16
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Etapas 1, 2 y 3
              </span>
            </div>
            <div className="text-2xl font-bold font-serif text-[#1F242B]">
              {formatMXN(financials?.totalGrossExposureEI)}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Exposición al Incumplimiento Bruta (EI)
            </p>

            <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Pérdida Crediticia Esperada (PCE):</span>
                <strong className="text-rose-700 font-semibold">
                  {formatMXN(financials?.totalExpectedCreditLossPCE)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cobertura de Reservas:</span>
                <strong className="text-gray-800">
                  {financials?.totalGrossExposureEI > 0
                    ? formatPct(
                        (financials.totalExpectedCreditLossPCE / financials.totalGrossExposureEI) * 100
                      )
                    : "0.00%"}
                </strong>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("importer")}
            className="mt-4 w-full bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold py-2 rounded border border-gray-200 flex items-center justify-center gap-1 transition-colors"
          >
            <span>Ver Layout Cartera NIF C-16</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Riesgo Operacional: PEA vs. PMA */}
        <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Riesgo Operacional (PEA & PMA)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Basilea III / Rimac
              </span>
            </div>
            <div className="text-2xl font-bold font-serif text-[#1F242B]">
              {formatMXN(financials?.totalPEA)}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Pérdida Esperada Anual (PEA = f × I_medio)
            </p>

            <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Pérdida Máxima Anual (PMA / VaR 99.9%):</span>
                <strong className="text-orange-700 font-semibold">
                  {formatMXN(financials?.totalPMA)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Multiplicador de Cola PMA/PEA:</span>
                <strong className="text-gray-800">
                  {financials?.totalPEA > 0
                    ? `${(financials.totalPMA / financials.totalPEA).toFixed(2)}x`
                    : "0.00x"}
                </strong>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("heatmap")}
            className="mt-4 w-full bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold py-2 rounded border border-gray-200 flex items-center justify-center gap-1 transition-colors"
          >
            <span>Explorar Matriz 5x5 CNBV</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Distribución de la Matriz Viva (Semaforización) */}
        <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Población de Riesgos Vivos
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                Total: {totalRisks} Riesgos
              </span>
            </div>

            <div className="space-y-2 mt-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>Verde (Dentro Apetito)</span>
                  </span>
                  <span>{zoneCounts?.GREEN || 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${totalRisks ? ((zoneCounts?.GREEN || 0) / totalRisks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    <span>Amarillo (Preventivo)</span>
                  </span>
                  <span>{zoneCounts?.YELLOW || 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${totalRisks ? ((zoneCounts?.YELLOW || 0) / totalRisks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="flex items-center gap-1.5 text-orange-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                    <span>Naranja (Excede Tolerancia)</span>
                  </span>
                  <span>{zoneCounts?.ORANGE || 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${totalRisks ? ((zoneCounts?.ORANGE || 0) / totalRisks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    <span>Rojo (Transgresión Límite)</span>
                  </span>
                  <span>{zoneCounts?.RED || 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-rose-500 h-2 rounded-full"
                    style={{ width: `${totalRisks ? ((zoneCounts?.RED || 0) / totalRisks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("risks")}
            className="mt-4 w-full bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold py-2 rounded border border-gray-200 flex items-center justify-center gap-1 transition-colors"
          >
            <span>Ver Catálogo de 11 Tipos CNBV</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. RANKING AUTOMATIZADO: TOP 5-7 RIESGOS CRÍTICOS */}
      <div className="bg-white rounded-bx shadow-card border border-gray-200 overflow-hidden">
        <div className="bg-[#1F242B] text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#C0D725] uppercase tracking-wider bg-[#292F38] px-2 py-0.5 rounded">
                Algoritmo Multicriterio UAIR
              </span>
              <span className="text-xs text-gray-300">
                Ponderación: 35% Score 5x5 + 30% PMA + 15% Reputación + 10% Evidencias + 10% Emergente
              </span>
            </div>
            <h3 className="text-base font-bold font-serif mt-0.5">
              Ranking Oficial "Top 5–7 Riesgos Críticos" para el CAIR
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab("plans")}
            className="text-xs bg-[#C0D725] text-[#1F242B] font-bold px-3 py-1.5 rounded flex items-center gap-1 shrink-0 hover:bg-[#AEC41D] transition-colors"
          >
            <span>Ver Planes Quick-Win</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tabla Densas de Riesgos Top */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7F9] text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center">Rank</th>
                <th className="py-2.5 px-4">Código & Título del Riesgo</th>
                <th className="py-2.5 px-4">Proceso / Unidad</th>
                <th className="py-2.5 px-4 text-center">Score 5x5</th>
                <th className="py-2.5 px-4 text-right">PMA (VaR 99.9%)</th>
                <th className="py-2.5 px-4 text-right">PEA (Esperada)</th>
                <th className="py-2.5 px-4 text-center">Reputación</th>
                <th className="py-2.5 px-4 text-center">Estado RAF</th>
                <th className="py-2.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topCriticalRisks?.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 text-center font-bold font-mono text-[#3299A8]">
                    #{r.rank}
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-bold text-gray-900 leading-snug">{r.title}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1 rounded">
                        {r.code}
                      </span>
                      {r.isEmergingRisk && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                          EMERGENTE ASG/CIBER
                        </span>
                      )}
                      {r.speiImpact && (
                        <span className="text-[9px] font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded">
                          SPEI
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    <div className="font-medium text-gray-800">{r.processName}</div>
                    <div className="text-[11px] text-gray-400">{r.businessUnitName}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold font-mono text-gray-800 text-sm">
                      {r.residualScore}
                    </span>
                    <span className="text-[10px] text-gray-400 block">/ 25.0</span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold font-mono text-orange-700">
                    {formatMXN(r.maxAnnualLossPMA)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium font-mono text-gray-700">
                    {formatMXN(r.rawRisk?.expectedAnnualLossPEA)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[3px] bg-slate-100 text-slate-800 border border-slate-200 uppercase tracking-wide">
                      Nivel {r.reputationalImpactLevel}/5
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-[3px] inline-flex items-center gap-1.5 ${getZoneBadgeClasses(
                        r.residualZone
                      )}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-[1px] inline-block ${
                          r.residualZone === "GREEN"
                            ? "bg-emerald-600"
                            : r.residualZone === "YELLOW"
                            ? "bg-amber-500"
                            : r.residualZone === "ORANGE"
                            ? "bg-orange-600"
                            : "bg-rose-600"
                        }`}
                      />
                      <span>{r.residualZone}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigateTab("flowchart")}
                      className="text-[11px] text-[#3299A8] hover:text-[#277A87] font-semibold hover:underline"
                    >
                      Ver en Diagrama
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
