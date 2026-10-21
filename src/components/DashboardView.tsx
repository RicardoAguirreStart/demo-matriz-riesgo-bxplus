// src/components/DashboardView.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { formatMXN, formatPct, getZoneBadgeClasses } from "@/lib/utils";
import { BusinessLineBancoBx, RoleType } from "@/types";
import { CustomSelect, CustomSelectOption } from "@/components/ui/CustomSelect";
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
  Filter,
  Check,
  Clock,
  Zap,
  BarChart3,
  Network,
  RotateCcw,
  Link2,
} from "lucide-react";

interface DashboardViewProps {
  businessLine: BusinessLineBancoBx;
  currentRole: RoleType;
  onNavigateTab: (tab: string) => void;
  onOpenCopilot: () => void;
}

function formatThresholdValue(val: number, unit: string) {
  if (unit === "MXN") return formatMXN(val);
  if (unit === "%") return formatPct(val);
  return `${val} ${unit}`;
}

function RafProgressBar({ threshold }: { threshold: any }) {
  const isHigherWorse = threshold.direction === "HIGHER_IS_WORSE";
  const {
    currentValue,
    appetiteValue,
    toleranceValue,
    regulatoryLimitValue,
    currentZone,
    unit,
  } = threshold;

  // Definir rangos normalizados para posicionar el marcador
  let minRange = 0;
  let maxRange = 100;
  if (isHigherWorse) {
    minRange = 0;
    maxRange = Math.max(regulatoryLimitValue * 1.2, currentValue * 1.1, 1);
  } else {
    minRange = Math.min(regulatoryLimitValue * 0.75, currentValue * 0.85);
    maxRange = Math.max(appetiteValue * 1.15, currentValue * 1.05, 100);
  }

  const rangeSpan = Math.max(maxRange - minRange, 1);
  const currentPct = Math.min(
    Math.max(((currentValue - minRange) / rangeSpan) * 100, 2),
    98
  );

  const appetitePct = Math.min(
    Math.max(((appetiteValue - minRange) / rangeSpan) * 100, 0),
    100
  );
  const tolerancePct = Math.min(
    Math.max(((toleranceValue - minRange) / rangeSpan) * 100, 0),
    100
  );
  const limitPct = Math.min(
    Math.max(((regulatoryLimitValue - minRange) / rangeSpan) * 100, 0),
    100
  );

  const markerColor =
    currentZone === "GREEN"
      ? "bg-emerald-600 ring-emerald-200"
      : currentZone === "YELLOW"
      ? "bg-amber-500 ring-amber-200"
      : currentZone === "ORANGE"
      ? "bg-orange-600 ring-orange-200"
      : "bg-rose-600 ring-rose-200";

  return (
    <div className="mt-3 pt-2.5 border-t border-gray-100">
      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1.5 font-medium">
        <span>
          Apetito:{" "}
          <strong className="text-emerald-700">
            {formatThresholdValue(appetiteValue, unit)}
          </strong>
        </span>
        <span>
          Tolerancia:{" "}
          <strong className="text-amber-700">
            {formatThresholdValue(toleranceValue, unit)}
          </strong>
        </span>
        <span>
          Límite:{" "}
          <strong className="text-rose-700">
            {formatThresholdValue(regulatoryLimitValue, unit)}
          </strong>
        </span>
      </div>

      {/* Barra de Umbrales Semafóricos */}
      <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
        {isHigherWorse ? (
          <>
            <div
              style={{ width: `${appetitePct}%` }}
              className="h-full bg-emerald-200"
              title="Apetito"
            />
            <div
              style={{ width: `${Math.max(tolerancePct - appetitePct, 0)}%` }}
              className="h-full bg-amber-200"
              title="Atención Preventiva"
            />
            <div
              style={{ width: `${Math.max(limitPct - tolerancePct, 0)}%` }}
              className="h-full bg-orange-200"
              title="Tolerancia"
            />
            <div
              style={{ width: `${Math.max(100 - limitPct, 0)}%` }}
              className="h-full bg-rose-200"
              title="Transgresión"
            />
          </>
        ) : (
          <>
            <div
              style={{ width: `${limitPct}%` }}
              className="h-full bg-rose-200"
              title="Transgresión"
            />
            <div
              style={{ width: `${Math.max(tolerancePct - limitPct, 0)}%` }}
              className="h-full bg-orange-200"
              title="Tolerancia"
            />
            <div
              style={{ width: `${Math.max(appetitePct - tolerancePct, 0)}%` }}
              className="h-full bg-amber-200"
              title="Atención Preventiva"
            />
            <div
              style={{ width: `${Math.max(100 - appetitePct, 0)}%` }}
              className="h-full bg-emerald-200"
              title="Apetito"
            />
          </>
        )}
      </div>

      {/* Pin Indicador de Valor Actual */}
      <div className="relative h-3 w-full mt-0.5">
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
          style={{ left: `${currentPct}%` }}
        >
          <div className={`w-2.5 h-2.5 rounded-full ring-2 ${markerColor}`} />
        </div>
      </div>
    </div>
  );
}

export function DashboardView({
  businessLine,
  currentRole,
  onNavigateTab,
  onOpenCopilot,
}: DashboardViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("ALL");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/dashboard/stats?businessLine=${businessLine}&processId=${selectedProcessId}`
      );
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
  }, [businessLine, selectedProcessId]);

  // Opciones para el selector de Procesos Bancarios
  const processOptions: CustomSelectOption[] = useMemo(() => {
    const list: CustomSelectOption[] = [
      {
        value: "ALL",
        label: "Todos los Procesos (Vista Consolidada CAIR)",
        badge: "Consolidado",
      },
    ];

    if (data?.processHealthSummary) {
      data.processHealthSummary.forEach((p: any) => {
        list.push({
          value: p.id,
          label: `${p.code} - ${p.name}`,
          badge: p.code,
          description: p.macroProcessName,
          dotColor:
            p.dominantZone === "RED"
              ? "bg-rose-500"
              : p.dominantZone === "ORANGE"
              ? "bg-orange-500"
              : p.dominantZone === "YELLOW"
              ? "bg-amber-500"
              : "bg-emerald-500",
        });
      });
    }

    return list;
  }, [data?.processHealthSummary]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#C0D725]"></div>
        <p className="mt-3 text-xs text-gray-500 font-medium">
          Cargando métricas ejecutivas, Marco RAF y trazabilidad por procesos...
        </p>
      </div>
    );
  }

  const {
    rafThresholds,
    topCriticalRisks,
    financials,
    zoneCounts,
    totalRisks,
    mitigationStats,
    processHealthSummary,
  } = data || {};

  const activeProcessObj = processHealthSummary?.find(
    (p: any) => p.id === selectedProcessId
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Welcome Banner with Process Selector */}
      <div className="bg-[#1F242B] text-white rounded-bx p-5 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-l-4 border-[#C0D725]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-white">
              Tablero Ejecutivo de Riesgos Relevantes y Marco RAF
            </h1>
            {selectedProcessId !== "ALL" && (
              <span className="text-[10px] font-mono font-bold bg-[#C0D725] text-[#1F242B] px-2 py-0.5 rounded">
                Filtrado: {activeProcessObj?.code || selectedProcessId}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-300 max-w-3xl leading-relaxed">
            Monitoreo en tiempo real de solvencia Basilea III, Cobertura de Liquidez CCL, reservas prospectivas NIF C-16 y priorización automatizada del Top 5–7 de riesgos críticos para el CAIR.
          </p>
        </div>

        {/* Controles de Filtrado y Acciones */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="w-72 max-w-full">
            <CustomSelect
              value={selectedProcessId}
              onChange={(val) => setSelectedProcessId(val)}
              options={processOptions}
              theme="dark"
              placeholder="Filtrar por Proceso..."
            />
          </div>

          {selectedProcessId !== "ALL" && (
            <button
              onClick={() => setSelectedProcessId("ALL")}
              className="text-xs bg-[#292F38] hover:bg-[#343C47] text-gray-300 hover:text-white px-2.5 py-2 rounded-md font-medium border border-gray-700 flex items-center gap-1 transition-colors"
              title="Restablecer a vista consolidada"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#C0D725]" />
              <span className="hidden sm:inline">Todos</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab("flowchart")}
            className="text-xs bg-[#292F38] hover:bg-[#343C47] text-gray-200 px-3 py-2 rounded-md font-medium border border-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#3299A8]" />
            <span>Cadena de Valor</span>
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

      {/* 1. SECCIÓN 1: TARJETAS DEL MARCO DE APETITO AL RIESGO (RAF — ART. 88 CUB) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3299A8]" />
            <span>Métricas del Marco de Apetito al Riesgo (RAF — Art. 88 CUB)</span>
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            4 Zonas de Semaforización: Verde | Amarillo | Naranja | Rojo
          </span>
        </div>

        {/* Grid Balanceado 2 Filas x 3 Columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rafThresholds?.map((th: any) => {
            const isDirectProcessMetric =
              selectedProcessId !== "ALL" &&
              (th.associatedProcessCode === activeProcessObj?.code ||
                (th.metricCode === "PEA_OP" && activeProcessObj));

            return (
              <div
                key={th.id}
                className={`rounded-bx p-4 shadow-card border transition-all flex flex-col justify-between ${
                  isDirectProcessMetric
                    ? "bg-[#F9FCFD] border-[#3299A8] ring-2 ring-[#3299A8]/20 shadow-md"
                    : "bg-white border-gray-200 hover:shadow-card-hover"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-gray-700 tracking-wide font-mono">
                        {th.metricCode}
                      </span>
                      {isDirectProcessMetric && (
                        <span className="text-[9px] font-bold text-teal-900 bg-teal-100 border border-teal-300 px-1.5 py-0.5 rounded uppercase">
                          Métrica Directa del Proceso
                        </span>
                      )}
                    </div>
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

                    {/* Vínculo Proceso Bancario */}
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                      <Link2 className="w-3 h-3 text-[#3299A8] shrink-0" />
                      <span className="truncate">
                        {th.associatedProcessCode === "ALL"
                          ? "Transversal: Todos los Procesos"
                          : `Proceso Clave: ${th.associatedProcessCode} (${th.associatedProcessLabel})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barra Semafórica de Progreso con Marcadores */}
                <RafProgressBar threshold={th} />
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SECCIÓN 2: 4 TARJETAS EJECUTIVAS DE RESUMEN FINANCIERO, MITIGACIÓN 3LD Y MATRIZ 5x5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarjeta 1: Cartera Crediticia NIF C-16 & Reservas */}
        <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Crédito & Reservas NIF C-16
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Etapas 1, 2 y 3
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-[#1F242B]">
              {formatMXN(financials?.totalGrossExposureEI)}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Exposición al Incumplimiento Bruta (EI)
            </p>

            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Pérdida Esperada (PCE):</span>
                <strong className="text-rose-700 font-semibold font-mono">
                  {formatMXN(financials?.totalExpectedCreditLossPCE)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cobertura de Reservas:</span>
                <strong className="text-gray-800 font-mono">
                  {financials?.totalGrossExposureEI > 0
                    ? formatPct(
                        (financials.totalExpectedCreditLossPCE /
                          financials.totalGrossExposureEI) *
                          100
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

        {/* Tarjeta 2: Riesgo Operacional (PEA & PMA) — 100% SINCRONIZADA CON PEA_OP */}
        <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Riesgo Operacional (PEA & PMA)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Basilea III / Rimac
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-[#1F242B]">
              {formatMXN(financials?.totalPEA)}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Pérdida Esperada Anual (PEA Operacional)
            </p>

            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Pérdida Máxima (VaR 99.9%):</span>
                <strong className="text-orange-700 font-semibold font-mono">
                  {formatMXN(financials?.totalPMA)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Multiplicador PMA/PEA:</span>
                <strong className="text-gray-800 font-mono">
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

        {/* Tarjeta 3 (NUEVA): Mitigación Activa, Quick-Wins & ROI (3LD) */}
        <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Mitigación Activa & ROI 3LD
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                {mitigationStats?.roiMultiple || 0}x ROI
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-emerald-700">
              {formatMXN(mitigationStats?.totalPEAReductionMXN || 0)}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Ahorro Anual Proyectado (-ΔPEA)
            </p>

            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Cobertura de Riesgos:</span>
                <strong className="text-gray-800 font-mono">
                  {mitigationStats?.coveredRisksCount || 0}/{totalRisks} (
                  {mitigationStats?.coveragePct || 0}%)
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quick-Wins Activos:</span>
                <strong className="text-teal-700 font-mono font-semibold">
                  {mitigationStats?.quickWinsCount || 0} planes
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gobernanza 3LD:</span>
                <strong className="text-gray-700 font-mono text-[11px]">
                  {mitigationStats?.verifiedByUAIRCount || 0} UAIR /{" "}
                  {mitigationStats?.signedByFirstLineCount || 0} 1ª L
                </strong>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("plans")}
            className="mt-4 w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold py-2 rounded border border-emerald-200 flex items-center justify-center gap-1 transition-colors"
          >
            <span>Ir a Matriz 2x2 & Quick-Wins</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tarjeta 4: Población de Riesgos Vivos (Matriz 5x5) */}
        <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Población de Riesgos Vivos
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-mono">
                {totalRisks} Riesgos
              </span>
            </div>

            <div className="space-y-1.5 mt-2">
              <div>
                <div className="flex justify-between text-[11px] font-medium mb-0.5">
                  <span className="text-emerald-700 font-semibold">
                    Verde (Apetito 1–4)
                  </span>
                  <span className="font-mono">{zoneCounts?.GREEN || 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{
                      width: `${
                        totalRisks ? ((zoneCounts?.GREEN || 0) / totalRisks) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium mb-0.5">
                  <span className="text-amber-700 font-semibold">
                    Amarillo (Preventivo 5–9)
                  </span>
                  <span className="font-mono">{zoneCounts?.YELLOW || 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full"
                    style={{
                      width: `${
                        totalRisks ? ((zoneCounts?.YELLOW || 0) / totalRisks) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium mb-0.5">
                  <span className="text-orange-700 font-semibold">
                    Naranja (Tolerancia 10–15)
                  </span>
                  <span className="font-mono">{zoneCounts?.ORANGE || 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full"
                    style={{
                      width: `${
                        totalRisks ? ((zoneCounts?.ORANGE || 0) / totalRisks) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium mb-0.5">
                  <span className="text-rose-700 font-semibold">
                    Rojo (Capacidad 16–25)
                  </span>
                  <span className="font-mono">{zoneCounts?.RED || 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-rose-500 h-1.5 rounded-full"
                    style={{
                      width: `${
                        totalRisks ? ((zoneCounts?.RED || 0) / totalRisks) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("risks")}
            className="mt-3 w-full bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold py-2 rounded border border-gray-200 flex items-center justify-center gap-1 transition-colors"
          >
            <span>Ver Catálogo de 11 Tipos CNBV</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. SECCIÓN 3: RADIOGRAFÍA DE EXPOSICIÓN, APETITO RAF Y GOBERNANZA POR PROCESO */}
      <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
              <Network className="w-4 h-4 text-[#3299A8]" />
              <span>Exposición, Apetito RAF y Gobernanza por Proceso Bancario</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Radiografía comparativa de consumo de apetito RAF, indicador rector, efectividad de mitigación Art. 88 CUB y cobertura 3LD por proceso. Haz clic en un proceso para aislar sus métricas.
            </p>
          </div>
          {selectedProcessId !== "ALL" && (
            <button
              onClick={() => setSelectedProcessId("ALL")}
              className="text-xs text-[#3299A8] hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Restablecer a Todos los Procesos</span>
            </button>
          )}
        </div>

        {/* Tarjetas de Proceso */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {processHealthSummary?.map((p: any) => {
            const isSelected = selectedProcessId === p.id;
            return (
              <div
                key={p.id}
                onClick={() =>
                  setSelectedProcessId(isSelected ? "ALL" : p.id)
                }
                className={`cursor-pointer rounded-lg p-4 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-[#3299A8] bg-[#F0F8FA] ring-2 ring-[#3299A8]/20 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-card"
                }`}
              >
                <div>
                  {/* Header de la Tarjeta */}
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                      {p.code}
                    </span>
                    <div className="flex items-center gap-1">
                      {p.isCriticalBCP && (
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded uppercase">
                          BCP Crítico
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          p.processRafThreshold?.currentZone === "RED" || p.dominantZone === "RED"
                            ? "bg-rose-100 text-rose-800"
                            : p.processRafThreshold?.currentZone === "ORANGE" || p.dominantZone === "ORANGE"
                            ? "bg-orange-100 text-orange-800"
                            : p.processRafThreshold?.currentZone === "YELLOW" || p.dominantZone === "YELLOW"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {p.processRafThreshold?.currentZone || p.dominantZone}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-xs text-gray-900 mt-2 line-clamp-1 leading-snug">
                    {p.name}
                  </h3>
                  <div className="text-[10px] text-gray-500 truncate">
                    {p.macroProcessName}
                  </div>

                  {/* Píldora Destacada de KRI / RAF Clave del Proceso */}
                  {p.primaryKriMetric && (
                    <div className="mt-2.5 px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            p.primaryKriMetric.zone === "GREEN"
                              ? "bg-emerald-500"
                              : p.primaryKriMetric.zone === "YELLOW"
                              ? "bg-amber-500"
                              : p.primaryKriMetric.zone === "ORANGE"
                              ? "bg-orange-500"
                              : "bg-rose-500"
                          }`}
                        />
                        <span className="text-[10px] text-gray-600 truncate font-medium">
                          Indicador Rector: <strong className="text-gray-900">{p.primaryKriMetric.code}</strong>
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-gray-900 shrink-0">
                        {p.primaryKriMetric.value}
                      </span>
                    </div>
                  )}

                  {/* Bloque Central: Métrica de Consumo de Apetito RAF del Proceso */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-gray-600 font-semibold">
                        Consumo Apetito PEA:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-gray-900 text-xs">
                          {p.processRafThreshold?.appetiteConsumptionPct || 0}%
                        </span>
                        <span className="text-[9px] font-mono text-teal-800 bg-teal-50 border border-teal-200 px-1 py-0.2 rounded font-semibold">
                          {p.peaSharePct}% PEA B×+
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 font-mono mb-1">
                      <div>PEA: <strong className="text-gray-900">{formatMXN(p.totalPEA)}</strong></div>
                      <div>PMA: <strong className="text-orange-700">{formatMXN(p.totalPMA)}</strong></div>
                    </div>

                    {/* Barra de Umbrales RAF del Proceso */}
                    {p.processRafThreshold && (
                      <RafProgressBar threshold={p.processRafThreshold} />
                    )}
                  </div>

                  {/* Bloque Inferior: Mitigación Art. 88 CUB */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-600 font-medium">Mitigación Art. 88 CUB:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        -{p.mitigationEffectivenessPct}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mt-0.5 font-mono">
                      <span>Score: {p.avgInherentScore} → {p.avgResidualScore}</span>
                      <span
                        className={
                          p.nfControlsCount > 0
                            ? "text-amber-700 font-semibold"
                            : "text-emerald-700 font-semibold"
                        }
                      >
                        {p.nfControlsCount} c/Control NF
                      </span>
                    </div>
                  </div>
                </div>

                {/* Conteo de Nodos, Cobertura y Huérfanos */}
                <div className="mt-3 pt-2.5 border-t border-gray-100">
                  <div className="flex items-center justify-between text-[10px] text-gray-600">
                    <span>{p.nodesCount} nodos de flujo</span>
                    <div className="flex items-center gap-1 font-mono">
                      <span className="text-rose-700 font-bold" title="Rojos">
                        {p.zoneCounts.RED}R
                      </span>
                      <span className="text-orange-700 font-bold" title="Naranjas">
                        {p.zoneCounts.ORANGE}N
                      </span>
                      <span className="text-amber-700 font-bold" title="Amarillos">
                        {p.zoneCounts.YELLOW}A
                      </span>
                      <span className="text-emerald-700 font-bold" title="Verdes">
                        {p.zoneCounts.GREEN}V
                      </span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-500">Cobertura Planes:</span>
                      <strong className="font-mono text-gray-800">
                        {p.coveragePct}% ({p.risksCount - p.orphanRisksCount}/{p.risksCount})
                      </strong>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          p.coveragePct >= 60
                            ? "bg-emerald-500"
                            : p.coveragePct >= 30
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${p.coveragePct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-gray-500 mt-1">
                      <span className="text-teal-700 font-medium">
                        {p.quickWinsCount} Quick-Wins
                      </span>
                      <span
                        className={
                          p.orphanRisksCount > 0
                            ? "text-amber-700 font-medium"
                            : "text-emerald-700 font-medium"
                        }
                      >
                        {p.orphanRisksCount} Huérfanos
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SECCIÓN 4: RANKING OFICIAL TOP 5-7 RIESGOS CRÍTICOS PARA EL CAIR */}
      <div className="bg-white rounded-bx shadow-card border border-gray-200 overflow-hidden">
        <div className="bg-[#1F242B] text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#C0D725] uppercase tracking-wider bg-[#292F38] px-2 py-0.5 rounded">
                Algoritmo Multicriterio UAIR
              </span>
              <span className="text-xs text-gray-300">
                Ponderación: 35% Score 5x5 + 30% PMA + 15% Reputación + 10% Falta de Evidencias/Formalización + 10% Emergente/SPEI
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

        {/* Tabla Densa de Riesgos Top */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7F9] text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                <th className="py-2.5 px-4 min-w-[200px]">Código & Título del Riesgo</th>
                <th className="py-2.5 px-4 min-w-[220px]">Proceso & Nodo del Diagrama</th>
                <th className="py-2.5 px-3 text-center">Score 5x5</th>
                <th className="py-2.5 px-3 text-right">PMA (VaR 99.9%)</th>
                <th className="py-2.5 px-3 text-right">PEA (Esperada)</th>
                <th className="py-2.5 px-3 text-center">Reputación</th>
                <th className="py-2.5 px-3 text-center">Estado RAF</th>
                <th className="py-2.5 px-4 text-center min-w-[170px]">Cobertura & Plan 3LD</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topCriticalRisks?.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-3 text-center font-bold font-mono text-[#3299A8]">
                    #{r.rank}
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-bold text-gray-900 leading-snug">{r.title}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono text-gray-600 bg-gray-100 px-1 py-0.5 rounded">
                        {r.code}
                      </span>
                      {r.isEmergingRisk && (
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          EMERGENTE ASG
                        </span>
                      )}
                      {r.speiImpact && (
                        <span className="text-[9px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded">
                          CANAL SPEI
                        </span>
                      )}
                      {r.hasUnverifiedControls && (
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded" title="Control no formalizado o sin evidencia válida (CUB Art. 88)">
                          PENALIZACIÓN CONTROL
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Columna Proceso & Nodo del Diagrama */}
                  <td className="py-3 px-4 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                        {r.processCode}
                      </span>
                      <span className="font-medium text-gray-900 truncate max-w-[180px]">
                        {r.processName}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#3299A8] shrink-0" />
                      <span className="truncate max-w-[200px]" title={r.processNodeLabel}>
                        {r.processNodeLabel}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className="font-bold font-mono text-gray-800 text-sm">
                      {r.residualScore}
                    </span>
                    <span className="text-[10px] text-gray-400 block">/ 25.0</span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold font-mono text-orange-700">
                    {formatMXN(r.maxAnnualLossPMA)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium font-mono text-gray-700">
                    {formatMXN(r.rawRisk?.expectedAnnualLossPEA)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[3px] bg-slate-100 text-slate-800 border border-slate-200 uppercase tracking-wide">
                      Nivel {r.reputationalImpactLevel}/5
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
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

                  {/* Columna Cobertura & Plan 3LD */}
                  <td className="py-3 px-4 text-center">
                    {r.hasVerifiedPlan ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Mitigado UAIR</span>
                        </span>
                        <span className="text-[9px] font-mono text-gray-500 mt-0.5">
                          {r.primaryPlanCode}
                        </span>
                      </div>
                    ) : r.actionPlansCount > 0 ? (
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                            r.quickWinsCount > 0
                              ? "text-teal-800 bg-teal-100 border-teal-300"
                              : "text-amber-800 bg-amber-100 border-amber-300"
                          }`}
                        >
                          {r.quickWinsCount > 0 ? (
                            <Zap className="w-3 h-3 text-teal-700" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-700" />
                          )}
                          <span>
                            {r.quickWinsCount > 0
                              ? "Quick-Win Activo"
                              : "Plan En Curso"}
                          </span>
                        </span>
                        <span className="text-[9px] font-mono text-gray-500 mt-0.5">
                          {r.primaryPlanCode}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onNavigateTab("plans")}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 px-2 py-0.5 rounded transition-colors"
                        title="Hacer clic para crear o asignar un plan de mitigación"
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>Huérfano (Sin Plan)</span>
                      </button>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right">
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
