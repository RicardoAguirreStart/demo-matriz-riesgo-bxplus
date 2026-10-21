// src/components/FloatingSafetyWidget.tsx
"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, ChevronUp, ChevronDown, Sparkles, ExternalLink } from "lucide-react";

interface FloatingSafetyWidgetProps {
  onOpenCopilot: () => void;
  onNavigateToPlans: () => void;
}

export function FloatingSafetyWidget({ onOpenCopilot, onNavigateToPlans }: FloatingSafetyWidgetProps) {
  const [isMinimized, setIsMinimized] = useState(false);

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
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Content Body */}
        {!isMinimized && (
          <div className="p-3.5 text-xs space-y-2.5 bg-[#FCFDFF]">
            {/* Alert 1: Orange Zone KRI */}
            <div className="bg-orange-50 border-l-2 border-orange-500 p-2.5 rounded-r">
              <div className="flex items-start justify-between">
                <div className="font-semibold text-orange-900 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>KRI-AGRO-02: Sequía en Cartera Agro</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-200 text-orange-800">
                  ZONA NARANJA
                </span>
              </div>
              <p className="text-gray-600 mt-1 text-[11px] leading-relaxed">
                Nivel actual: <strong className="text-orange-700">28.5%</strong> excede la Tolerancia (25.0%). Requiere Plan de Remediación firmado en &lt;5 días.
              </p>
              <button
                onClick={onNavigateToPlans}
                className="mt-1.5 text-[11px] text-[#3299A8] hover:text-[#277A87] font-semibold flex items-center gap-1"
              >
                <span>Ver Plan Quick-Win asignado</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Alert 2: Yellow Zone CCL */}
            <div className="bg-amber-50 border-l-2 border-amber-500 p-2 rounded-r">
              <div className="flex items-start justify-between">
                <div className="font-semibold text-amber-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>CCL 30 Días: 114.5%</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-800">
                  PREVENTIVO
                </span>
              </div>
              <p className="text-gray-600 text-[11px] mt-0.5">
                Apetito &ge; 120%. Monitoreo preventivo de vencimientos en mesa de fondeo.
              </p>
            </div>

            {/* Proactive Tip from Gemini */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded p-2 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-gray-700">
                <span className="font-semibold text-emerald-900">Recomendación Proactiva B×+:</span>
                <p className="mt-0.5">
                  El conector SPEI tiene un Quick-Win listo para firma que reduce en un <strong>85%</strong> la PMA por ciberfraude.
                </p>
              </div>
            </div>

            {/* Action Bar */}
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
