// src/components/FloatingSafetyWidget.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Layers,
  Zap,
} from "lucide-react";
import { formatMXN, formatPct, getZoneBadgeClasses } from "@/lib/utils";

interface FloatingSafetyWidgetProps {
  onOpenCopilot: () => void;
  onNavigateToPlans: () => void;
}

export function FloatingSafetyWidget({
  onOpenCopilot,
  onNavigateToPlans,
}: FloatingSafetyWidgetProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      const json = await res.json();
      if (json.success) {
        setStatsData(json);
      }
    } catch (err) {
      console.error("Error al cargar alertas en tiempo real:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  // Sincronización en tiempo real ante eliminación de procesos
  useEffect(() => {
    const handleProcessDeleted = () => {
      loadAlerts();
    };
    window.addEventListener("bx_process_deleted", handleProcessDeleted);
    return () => window.removeEventListener("bx_process_deleted", handleProcessDeleted);
  }, []);

  const kris = statsData?.liveAlerts?.kris || [];
  const rafAlerts = statsData?.liveAlerts?.rafAlerts || [];
  const topQW = statsData?.liveAlerts?.topQuickWinOpportunity;
  const mitigationStats = statsData?.mitigationStats;

  // 1. KRI más crítico (ORANGE o RED primero, sino YELLOW)
  const activeKri =
    kris.find((k: any) => k.currentZone === "ORANGE" || k.currentZone === "RED") ||
    kris.find((k: any) => k.currentZone === "YELLOW") ||
    kris[0];

  // 2. Umbral RAF en alerta (CCL, PEA_OP, o el que esté en tolerancia/transgresión)
  const activeRaf =
    rafAlerts.find((r: any) => r.metricCode === "PEA_OP" || r.metricCode === "CCL") ||
    rafAlerts[0] ||
    statsData?.rafThresholds?.[0];

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-sm w-full transition-all duration-300">
      <div className="bg-white rounded-lg shadow-xl border-t-4 border-[#C0D725] border-x border-b border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1F242B] text-white px-3.5 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wide">
              Alertas RAF & Vigilancia UAIR
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
            title={isMinimized ? "Expandir" : "Minimizar"}
          >
            {isMinimized ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Content Body */}
        {!isMinimized && (
          <div className="p-3.5 text-xs space-y-2.5 bg-[#FCFDFF]">
            {/* Alerta 1: KRI en Zona Preventiva / Tolerancia */}
            {activeKri ? (
              <div
                className={`p-2.5 rounded-r border-l-2 ${
                  activeKri.currentZone === "RED"
                    ? "bg-rose-50 border-rose-500"
                    : activeKri.currentZone === "ORANGE"
                    ? "bg-orange-50 border-orange-500"
                    : "bg-amber-50 border-amber-500"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="font-semibold text-gray-900 flex items-center gap-1 leading-snug">
                    <AlertTriangle
                      className={`w-3.5 h-3.5 shrink-0 ${
                        activeKri.currentZone === "RED"
                          ? "text-rose-600"
                          : activeKri.currentZone === "ORANGE"
                          ? "text-orange-600"
                          : "text-amber-600"
                      }`}
                    />
                    <span>
                      {activeKri.code}: {activeKri.name}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono shrink-0 ${
                      activeKri.currentZone === "RED"
                        ? "bg-rose-200 text-rose-800"
                        : activeKri.currentZone === "ORANGE"
                        ? "bg-orange-200 text-orange-800"
                        : "bg-amber-200 text-amber-800"
                    }`}
                  >
                    Zona {activeKri.currentZone}
                  </span>
                </div>
                <p className="text-gray-600 mt-1 text-[11px] leading-relaxed">
                  Nivel medido:{" "}
                  <strong className="text-gray-900 font-mono">
                    {activeKri.currentValue}%
                  </strong>{" "}
                  en proceso{" "}
                  <span className="font-mono text-gray-700">
                    {activeKri.processCode}
                  </span>
                  . Requiere supervisión de apetito y plan activo.
                </p>
                <button
                  onClick={onNavigateToPlans}
                  className="mt-1 text-[11px] text-[#3299A8] hover:text-[#277A87] font-semibold flex items-center gap-1"
                >
                  <span>Ver Planes de Mitigación</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ) : null}

            {/* Alerta 2: Indicador RAF en Vigilancia */}
            {activeRaf ? (
              <div
                className={`p-2.5 rounded-r border-l-2 ${
                  activeRaf.currentZone === "RED"
                    ? "bg-rose-50 border-rose-500"
                    : activeRaf.currentZone === "ORANGE"
                    ? "bg-orange-50 border-orange-500"
                    : activeRaf.currentZone === "YELLOW"
                    ? "bg-amber-50 border-amber-500"
                    : "bg-emerald-50 border-emerald-500"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="font-semibold text-gray-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#3299A8] shrink-0" />
                    <span>
                      {activeRaf.metricCode}:{" "}
                      {activeRaf.unit === "MXN"
                        ? formatMXN(activeRaf.currentValue)
                        : activeRaf.unit === "%"
                        ? formatPct(activeRaf.currentValue)
                        : `${activeRaf.currentValue} ${activeRaf.unit}`}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono shrink-0 ${
                      activeRaf.currentZone === "RED"
                        ? "bg-rose-200 text-rose-800"
                        : activeRaf.currentZone === "ORANGE"
                        ? "bg-orange-200 text-orange-800"
                        : activeRaf.currentZone === "YELLOW"
                        ? "bg-amber-200 text-amber-800"
                        : "bg-emerald-200 text-emerald-800"
                    }`}
                  >
                    {activeRaf.currentZone === "GREEN"
                      ? "Apetito"
                      : activeRaf.currentZone === "YELLOW"
                      ? "Preventivo"
                      : activeRaf.currentZone === "ORANGE"
                      ? "Tolerancia"
                      : "Límite"}
                  </span>
                </div>
                <p className="text-gray-600 text-[11px] mt-0.5 leading-relaxed">
                  {activeRaf.metricName}. Apetito:{" "}
                  <strong className="text-gray-800">
                    {activeRaf.unit === "%"
                      ? formatPct(activeRaf.appetiteValue)
                      : activeRaf.unit === "MXN"
                      ? formatMXN(activeRaf.appetiteValue)
                      : activeRaf.appetiteValue}
                  </strong>
                  .
                </p>
              </div>
            ) : null}

            {/* Recomendación Proactiva Dinámica B×+ */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded p-2.5 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-[11px] text-gray-700">
                <span className="font-semibold text-emerald-950 block">
                  Recomendación Proactiva B×+:
                </span>
                <p className="mt-0.5 leading-relaxed">
                  {topQW?.descriptionText ||
                    `Existen ${mitigationStats?.quickWinsCount || 0} planes Quick-Win activos con un ahorro potencial de ${formatMXN(mitigationStats?.totalPEAReductionMXN || 0)} en la PEA.`}
                </p>
                {topQW && (
                  <button
                    onClick={onNavigateToPlans}
                    className="mt-1 font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline"
                  >
                    <Zap className="w-3 h-3 text-emerald-700" />
                    <span>Examinar {topQW.code} en Matriz 2x2</span>
                  </button>
                )}
              </div>
            </div>

            {/* Botón de Acción a Copilot */}
            <button
              onClick={onOpenCopilot}
              className="w-full bg-[#1F242B] hover:bg-[#2A313C] text-white text-xs font-semibold py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C0D725]" />
              <span>Consultar con B×+ Risk Copilot</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
