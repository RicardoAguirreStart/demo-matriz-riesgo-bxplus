// src/components/HeatmapView.tsx
"use client";

import React, { useState, useEffect } from "react";
import { formatMXN, getZoneBadgeClasses } from "@/lib/utils";
import { BusinessLineBancoBx } from "@/types";
import { Filter, ArrowRight, Eye, ShieldCheck, Zap } from "lucide-react";

interface HeatmapViewProps {
  businessLine: BusinessLineBancoBx;
}

export function HeatmapView({ businessLine }: HeatmapViewProps) {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"INHERENT" | "RESIDUAL" | "TARGET">("RESIDUAL");
  const [selectedCell, setSelectedCell] = useState<{ prob: number; imp: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/risks?businessLine=${businessLine}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRisks(data.risks);
        }
      })
      .finally(() => setLoading(false));
  }, [businessLine]);

  // CNBV 5x5 Color Matrix helper
  const getCellZone = (prob: number, imp: number): "GREEN" | "YELLOW" | "ORANGE" | "RED" => {
    const score = prob * imp;
    if (score <= 4) return "GREEN";
    if (score <= 9) return "YELLOW";
    if (score <= 15) return "ORANGE";
    return "RED";
  };

  // Group risks by cell depending on viewMode
  const getRisksInCell = (prob: number, imp: number) => {
    return risks.filter((r) => {
      if (viewMode === "INHERENT") {
        return Math.round(r.inherentProbability) === prob && Math.round(r.inherentImpact) === imp;
      }
      if (viewMode === "RESIDUAL") {
        return Math.round(r.residualProbability) === prob && Math.round(r.residualImpact) === imp;
      }
      // Target (Post-Plan): assumes an additional 40% reduction if has action plan
      const targetProb = Math.max(1, Math.round(r.residualProbability * 0.7));
      const targetImp = Math.max(1, Math.round(r.residualImpact * 0.7));
      return targetProb === prob && targetImp === imp;
    });
  };

  const selectedCellRisks = selectedCell ? getRisksInCell(selectedCell.prob, selectedCell.imp) : [];

  const probLabels = [
    { level: 5, name: "5. Casi Seguro / Frecuente" },
    { level: 4, name: "4. Probable" },
    { level: 3, name: "3. Posible" },
    { level: 2, name: "2. Improbable" },
    { level: 1, name: "1. Raro / Remoto" },
  ];

  const impLabels = [
    { level: 1, name: "1. Insignificante" },
    { level: 2, name: "2. Menor" },
    { level: 3, name: "3. Moderado" },
    { level: 4, name: "4. Mayor" },
    { level: 5, name: "5. Catastrófico" },
  ];

  return (
    <div className="space-y-6">
      {/* Header and 3-Way Switch */}
      <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
            Módulo 05 — Visualizador & Heatmaps CNBV
          </div>
          <h2 className="text-lg font-bold text-gray-900 font-serif">
            Matriz de Riesgo 5×5 (Probabilidad vs. Impacto)
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="font-medium text-gray-600">Semaforización CUB:</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 inline-block shadow-xs" /> Verde (1-4)</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[2px] bg-amber-400 inline-block shadow-xs" /> Amarillo (5-9)</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[2px] bg-orange-500 inline-block shadow-xs" /> Naranja (10-15)</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[2px] bg-rose-500 inline-block shadow-xs" /> Rojo (16-25)</span>
          </div>
        </div>

        {/* 3-Way Mode Toggle */}
        <div className="flex items-center bg-[#F5F7F9] p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => {
              setViewMode("INHERENT");
              setSelectedCell(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              viewMode === "INHERENT"
                ? "bg-[#1F242B] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            1. Riesgo Inherente
          </button>
          <button
            onClick={() => {
              setViewMode("RESIDUAL");
              setSelectedCell(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              viewMode === "RESIDUAL"
                ? "bg-[#C0D725] text-[#1F242B] shadow-sm font-black"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            2. Riesgo Residual Actual
          </button>
          <button
            onClick={() => {
              setViewMode("TARGET");
              setSelectedCell(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
              viewMode === "TARGET"
                ? "bg-[#3299A8] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>3. Objetivo (Post-Plan)</span>
          </button>
        </div>
      </div>

      {/* Main Heatmap Grid & Drill-Down Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* The 5x5 Heatmap Matrix */}
        <div className="lg:col-span-2 bg-white rounded-bx p-5 shadow-card border border-gray-200 overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Top axis header */}
            <div className="text-center font-bold text-xs uppercase tracking-wider text-gray-500 mb-2">
              Impacto / Severidad Financiera & Reputacional &rarr;
            </div>

            <div className="grid grid-cols-6 gap-2">
              {/* Empty corner */}
              <div className="text-[10px] font-bold text-gray-400 flex items-end justify-center pb-2">
                Probabilidad &darr;
              </div>

              {/* Impact Columns Header */}
              {impLabels.map((imp) => (
                <div
                  key={imp.level}
                  className="text-center text-[11px] font-bold text-gray-700 bg-gray-50 py-1.5 rounded"
                >
                  {imp.name}
                </div>
              ))}

              {/* Rows (Probability 5 down to 1) */}
              {probLabels.map((prob) => (
                <React.Fragment key={prob.level}>
                  {/* Probability Row Header */}
                  <div className="text-right pr-2 text-[11px] font-bold text-gray-700 flex items-center justify-end">
                    {prob.name}
                  </div>

                  {/* 5 Impact Cells for this Probability */}
                  {impLabels.map((imp) => {
                    const cellZone = getCellZone(prob.level, imp.level);
                    const cellRisks = getRisksInCell(prob.level, imp.level);
                    const isSelected =
                      selectedCell?.prob === prob.level && selectedCell?.imp === imp.level;

                    let bgStyle = "bg-emerald-100/70 hover:bg-emerald-200/90 text-emerald-900 border-emerald-300";
                    if (cellZone === "YELLOW")
                      bgStyle = "bg-amber-100/70 hover:bg-amber-200/90 text-amber-900 border-amber-300";
                    if (cellZone === "ORANGE")
                      bgStyle = "bg-orange-100/70 hover:bg-orange-200/90 text-orange-900 border-orange-300";
                    if (cellZone === "RED")
                      bgStyle = "bg-rose-100/70 hover:bg-rose-200/90 text-rose-900 border-rose-300";

                    const score = prob.level * imp.level;

                    return (
                      <div
                        key={imp.level}
                        onClick={() => setSelectedCell({ prob: prob.level, imp: imp.level })}
                        className={`h-20 rounded-lg p-2 flex flex-col justify-between cursor-pointer border-2 transition-all ${bgStyle} ${
                          isSelected ? "ring-4 ring-[#1F242B] scale-105 shadow-md z-10" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start text-[10px] font-bold opacity-75">
                          <span>{score} pts</span>
                          <span>
                            {prob.level}×{imp.level}
                          </span>
                        </div>

                        {/* Cell Content: Risk Count Badge */}
                        <div className="text-center">
                          {cellRisks.length > 0 ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-[3px] text-xs font-mono font-bold bg-white/95 text-[#1F242B] shadow-xs border border-black/15">
                              {cellRisks.length}{" "}
                              <span className="text-[10px] font-normal ml-1">
                                {cellRisks.length === 1 ? "riesgo" : "riesgos"}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[10px] opacity-30">—</span>
                          )}
                        </div>

                        {/* Bottom Total PMA in cell */}
                        <div className="text-[9px] truncate text-center font-mono font-semibold">
                          {cellRisks.length > 0
                            ? formatMXN(cellRisks.reduce((s, r) => s + r.maxAnnualLossPMA, 0))
                            : ""}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Drill-down side panel */}
        <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-sm font-serif">
                Detalle del Cuadrante Seleccionado
              </h3>
              {selectedCell && (
                <span className="text-xs font-mono font-bold bg-[#1F242B] text-white px-2 py-0.5 rounded">
                  {selectedCell.prob} × {selectedCell.imp} (Score {selectedCell.prob * selectedCell.imp})
                </span>
              )}
            </div>

            {selectedCell ? (
              <div className="mt-3 space-y-3">
                <div className="text-xs text-gray-500">
                  {selectedCellRisks.length} riesgos encontrados bajo la vista{" "}
                  <strong>
                    {viewMode === "INHERENT"
                      ? "Inherente"
                      : viewMode === "RESIDUAL"
                      ? "Residual Actual"
                      : "Objetivo Post-Plan"}
                  </strong>
                  .
                </div>

                <div className="max-h-[420px] overflow-y-auto space-y-2.5 pr-1">
                  {selectedCellRisks.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-lg border border-gray-200 bg-gray-50/70 hover:bg-gray-100 transition-colors text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-gray-500">
                          {r.code}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getZoneBadgeClasses(
                            r.residualZone
                          )}`}
                        >
                          {r.residualZone}
                        </span>
                      </div>
                      <div className="font-bold text-gray-900 leading-snug">{r.title}</div>
                      <div className="text-[11px] text-gray-600 line-clamp-2">
                        {r.consequence}
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-200/80 text-[10px] font-mono text-gray-500">
                        <span>PEA: {formatMXN(r.expectedAnnualLossPEA)}</span>
                        <strong className="text-orange-700">
                          PMA: {formatMXN(r.maxAnnualLossPMA)}
                        </strong>
                      </div>
                    </div>
                  ))}

                  {selectedCellRisks.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-xs">
                      No hay riesgos en este cuadrante para el escenario seleccionado.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400 text-xs">
                <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Haz clic en cualquier celda de la matriz 5×5 para ver el desglose detallado de riesgos.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
