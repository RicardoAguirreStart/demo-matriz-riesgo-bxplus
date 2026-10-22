// src/components/HeatmapView.tsx
"use client";

import React, { useState, useEffect } from "react";
import { formatMXN, getZoneBadgeClasses } from "@/lib/utils";
import { BusinessLineBancoBx } from "@/types";
import {
  Filter,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Grid,
  Building2,
  GitBranch,
  TrendingDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface HeatmapViewProps {
  businessLine: BusinessLineBancoBx;
}

export function HeatmapView({ businessLine }: HeatmapViewProps) {
  const [risks, setRisks] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("");
  const [activeProcessDetail, setActiveProcessDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"INHERENT" | "RESIDUAL" | "TARGET">("RESIDUAL");
  const [analysisScope, setAnalysisScope] = useState<"SINGLE_PROCESS" | "MOSAIC" | "INSTITUTIONAL">(
    "SINGLE_PROCESS"
  );
  const [selectedCell, setSelectedCell] = useState<{ prob: number; imp: number } | null>(null);

  const loadProcesses = () => {
    fetch("/api/processes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.processes) {
          setProcesses(data.processes);
          const exists = data.processes.some((p: any) => p.id === selectedProcessId);
          if (!exists && data.processes.length > 0) {
            setSelectedProcessId(data.processes[0].id);
          } else if (data.processes.length === 0) {
            setSelectedProcessId("");
            setActiveProcessDetail(null);
          }
        }
      })
      .catch((err) => console.error("Error fetching processes for heatmap:", err));
  };

  const loadRisks = () => {
    setLoading(true);
    fetch(`/api/risks?businessLine=${businessLine}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRisks(data.risks || []);
        }
      })
      .finally(() => setLoading(false));
  };

  // 1. Cargar catálogo de procesos registrados
  useEffect(() => {
    loadProcesses();
  }, []);

  // 2. Cargar detalle del proceso seleccionado para trazabilidad de nodos
  useEffect(() => {
    if (selectedProcessId) {
      fetch(`/api/processes?processId=${selectedProcessId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.process) {
            setActiveProcessDetail(data.process);
          }
        })
        .catch((err) => console.error("Error fetching process detail:", err));
    } else {
      setActiveProcessDetail(null);
    }
  }, [selectedProcessId]);

  // 3. Cargar riesgos (todos los riesgos o filtrados)
  useEffect(() => {
    loadRisks();
  }, [businessLine]);

  // 4. Sincronización en tiempo real ante eliminación de procesos
  useEffect(() => {
    const handleProcessDeleted = () => {
      loadProcesses();
      loadRisks();
    };
    window.addEventListener("bx_process_deleted", handleProcessDeleted);
    return () => window.removeEventListener("bx_process_deleted", handleProcessDeleted);
  }, [businessLine]);

  // CNBV 5x5 Color Matrix helper
  const getCellZone = (prob: number, imp: number): "GREEN" | "YELLOW" | "ORANGE" | "RED" => {
    const score = prob * imp;
    if (score <= 4) return "GREEN";
    if (score <= 9) return "YELLOW";
    if (score <= 15) return "ORANGE";
    return "RED";
  };

  // Filtrar riesgos según el alcance del análisis
  const currentScopedRisks = React.useMemo(() => {
    if (analysisScope === "SINGLE_PROCESS") {
      return risks.filter((r) => r.processId === selectedProcessId);
    }
    return risks;
  }, [risks, analysisScope, selectedProcessId]);

  // Group risks by cell depending on viewMode
  const getRisksInCell = (prob: number, imp: number, sourceRisks: any[] = currentScopedRisks) => {
    return sourceRisks.filter((r) => {
      if (viewMode === "INHERENT") {
        return Math.round(r.inherentProbability) === prob && Math.round(r.inherentImpact) === imp;
      }
      if (viewMode === "RESIDUAL") {
        return Math.round(r.residualProbability) === prob && Math.round(r.residualImpact) === imp;
      }
      // Target (Post-Plan): Basado en los planes de acción reales asociados al riesgo
      if (r.actionPlans && r.actionPlans.length > 0) {
        const maxImprovement = Math.max(...r.actionPlans.map((p: any) => p.improvementPotentialPct || 0.5));
        const reductionFactor = 1 - maxImprovement * 0.55;
        const targetProb = Math.max(1, Math.round(r.residualProbability * reductionFactor));
        const targetImp = Math.max(1, Math.round(r.residualImpact * reductionFactor));
        return targetProb === prob && targetImp === imp;
      }
      return Math.round(r.residualProbability) === prob && Math.round(r.residualImpact) === imp;
    });
  };

  const selectedCellRisks = selectedCell
    ? getRisksInCell(selectedCell.prob, selectedCell.imp, currentScopedRisks)
    : [];

  const probLabels = [
    { level: 5, name: "5. Casi Seguro" },
    { level: 4, name: "4. Probable" },
    { level: 3, name: "3. Posible" },
    { level: 2, name: "2. Improbable" },
    { level: 1, name: "1. Remoto" },
  ];

  const impLabels = [
    { level: 1, name: "1. Insignificante" },
    { level: 2, name: "2. Menor" },
    { level: 3, name: "3. Moderado" },
    { level: 4, name: "4. Mayor" },
    { level: 5, name: "5. Catastrófico" },
  ];

  const processOptions = processes.map((p) => ({
    value: p.id,
    label: `${p.code}: ${p.name}`,
    description: p.macroProcess?.name || "Macroproceso B×+",
  }));

  // Datos del proceso actualmente activo
  const currentProcess = processes.find((p) => p.id === selectedProcessId) || activeProcessDetail;
  const currentProcessRisks = risks.filter((r) => r.processId === selectedProcessId);
  const totalPEA = currentProcessRisks.reduce((acc, r) => acc + (r.expectedAnnualLossPEA || 0), 0);
  const totalPMA = currentProcessRisks.reduce((acc, r) => acc + (r.maxAnnualLossPMA || 0), 0);

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header Principal y Selectores de Alcance de Análisis */}
      <div className="bg-gradient-to-r from-[#1F242B] to-[#2B333E] text-white rounded-bx p-5 shadow-card border-l-4 border-[#C0D725] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-white tracking-tight">
            Matriz de Riesgo 5×5 (Probabilidad vs. Impacto)
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 mt-1">
            <span className="font-medium text-gray-300">Semaforización CUB:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 inline-block shadow-xs" /> Verde (1-4)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-amber-400 inline-block shadow-xs" /> Amarillo (5-9)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-orange-500 inline-block shadow-xs" /> Naranja (10-15)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-rose-500 inline-block shadow-xs" /> Rojo (16-25)
            </span>
          </div>
        </div>

        {/* Controles de Vista: Selector de Alcance & Escenario 3-Way */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Nivel de Análisis (3 Modos) */}
          <div className="flex items-center bg-[#2A313C] p-1 rounded-lg border border-gray-700 text-xs">
            <button
              type="button"
              onClick={() => {
                setAnalysisScope("SINGLE_PROCESS");
                setSelectedCell(null);
              }}
              className={`px-3 py-1.5 font-bold rounded-md transition-all cursor-pointer ${
                analysisScope === "SINGLE_PROCESS"
                  ? "bg-[#C0D725] text-[#1F242B] shadow-xs"
                  : "text-gray-300 hover:text-white"
              }`}
              title="Ver Matriz 5×5 dedicada por cada proceso bancario y su mapa de trazabilidad"
            >
              Por Proceso Individual
            </button>
            <button
              type="button"
              onClick={() => {
                setAnalysisScope("MOSAIC");
                setSelectedCell(null);
              }}
              className={`px-3 py-1.5 font-bold rounded-md transition-all cursor-pointer ${
                analysisScope === "MOSAIC"
                  ? "bg-[#C0D725] text-[#1F242B] shadow-xs"
                  : "text-gray-300 hover:text-white"
              }`}
              title="Comparar todas las matrices 5×5 de los procesos bancarios en mosaico lado a lado"
            >
              Mosaico de Procesos
            </button>
            <button
              type="button"
              onClick={() => {
                setAnalysisScope("INSTITUTIONAL");
                setSelectedCell(null);
              }}
              className={`px-3 py-1.5 font-bold rounded-md transition-all cursor-pointer ${
                analysisScope === "INSTITUTIONAL"
                  ? "bg-[#C0D725] text-[#1F242B] shadow-xs"
                  : "text-gray-300 hover:text-white"
              }`}
              title="Matriz consolidada con todos los riesgos del banco"
            >
              Consolidado Institucional
            </button>
          </div>

          {/* 3-Way Scenario Switch (Inherente / Residual / Objetivo) */}
          <div className="flex items-center bg-[#2A313C] p-1 rounded-lg border border-gray-700 text-xs">
            <button
              type="button"
              onClick={() => {
                setViewMode("INHERENT");
                setSelectedCell(null);
              }}
              className={`px-2.5 py-1.5 font-bold rounded-md transition-all cursor-pointer ${
                viewMode === "INHERENT"
                  ? "bg-[#C0D725] text-[#1F242B] shadow-xs"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              1. Inherente
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("RESIDUAL");
                setSelectedCell(null);
              }}
              className={`px-2.5 py-1.5 font-bold rounded-md transition-all cursor-pointer ${
                viewMode === "RESIDUAL"
                  ? "bg-[#C0D725] text-[#1F242B] shadow-xs font-black"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              2. Residual Actual
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("TARGET");
                setSelectedCell(null);
              }}
              className={`px-2.5 py-1.5 font-bold rounded-md transition-all cursor-pointer ${
                viewMode === "TARGET"
                  ? "bg-[#C0D725] text-[#1F242B] shadow-xs font-bold"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              3. Objetivo
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barra Contextual de Proceso (visible en Modo Proceso Individual) */}
      {analysisScope === "SINGLE_PROCESS" && (
        <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-gray-700">Seleccionar Proceso:</span>
            <CustomSelect
              options={processOptions}
              value={selectedProcessId}
              onChange={(val) => {
                setSelectedProcessId(val);
                setSelectedCell(null);
              }}
              theme="light"
              className="min-w-[280px] max-w-[420px]"
              dropdownClassName="w-[420px]"
            />
          </div>

          {/* Métricas Agregadas del Proceso */}
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-gray-500 block text-[10px]">Riesgos Asociados</span>
              <span className="font-bold text-gray-900 font-mono text-sm">{currentProcessRisks.length}</span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="text-right">
              <span className="text-gray-500 block text-[10px]">PEA Estimada</span>
              <span className="font-bold text-gray-900 font-mono">{formatMXN(totalPEA)}</span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="text-right">
              <span className="text-gray-500 block text-[10px]">PMA (Catastrófico)</span>
              <span className="font-bold text-orange-700 font-mono">{formatMXN(totalPMA)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODO 1: MATRIZ 5x5 POR PROCESO INDIVIDUAL */}
      {analysisScope === "SINGLE_PROCESS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matriz 5x5 con Chips de Riesgos y Nodos del Flujo */}
          <div className="lg:col-span-2 bg-white rounded-bx p-5 shadow-card border border-gray-200 overflow-x-auto">
            <div className="min-w-[540px]">
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
                    <div className="text-right pr-2 text-[11px] font-bold text-gray-700 flex items-center justify-end">
                      {prob.name}
                    </div>

                    {impLabels.map((imp) => {
                      const cellZone = getCellZone(prob.level, imp.level);
                      const cellRisks = getRisksInCell(prob.level, imp.level, currentProcessRisks);
                      const isSelected =
                        selectedCell?.prob === prob.level && selectedCell?.imp === imp.level;

                      let bgStyle =
                        "bg-emerald-100/70 hover:bg-emerald-200/90 text-emerald-900 border-emerald-300";
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
                          className={`min-h-[96px] rounded-lg p-2 flex flex-col justify-between cursor-pointer border-2 transition-all ${bgStyle} ${
                            isSelected ? "ring-4 ring-[#1F242B] scale-[1.02] shadow-md z-10" : ""
                          }`}
                        >
                          <div className="flex justify-between items-start text-[10px] font-bold opacity-80">
                            <span>{score} pts</span>
                          </div>

                          {/* Chips de Riesgos y Nodos del Flujo */}
                          <div className="my-1 space-y-1">
                            {cellRisks.slice(0, 2).map((r) => (
                              <div
                                key={r.id}
                                className="bg-white/95 text-[#1F242B] px-1.5 py-0.5 rounded shadow-2xs border border-black/15 text-[10px] leading-tight truncate"
                                title={`${r.code}: ${r.title} • Nodo: ${r.processNode?.label || "Proceso General"}`}
                              >
                                <span className="font-mono font-bold text-gray-900">{r.code}</span>
                                <span className="mx-1 text-gray-400">•</span>
                                <span className="text-gray-700 truncate">
                                  {r.processNode?.label || "Proceso"}
                                </span>
                              </div>
                            ))}

                            {cellRisks.length > 2 && (
                              <div className="text-[9px] font-bold text-center bg-black/10 rounded py-0.5">
                                +{cellRisks.length - 2} más
                              </div>
                            )}

                            {cellRisks.length === 0 && (
                              <div className="text-center text-[10px] opacity-25 py-2">—</div>
                            )}
                          </div>

                          {/* Total PMA en la celda */}
                          <div className="text-[9px] truncate text-center font-mono font-semibold">
                            {cellRisks.length > 0
                              ? formatMXN(cellRisks.reduce((s, r) => s + (r.maxAnnualLossPMA || 0), 0))
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

          {/* Panel Lateral: Mapa de Trazabilidad del Proceso (Nodos del Flujo vs. Matriz 5x5) */}
          <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm font-serif">
                    Mapa de Trazabilidad del Proceso
                  </h3>
                  <p className="text-[11px] text-gray-500">Nodos del Flujo vs. Desplazamiento en Matriz 5×5</p>
                </div>
                <span className="text-[11px] font-mono font-bold bg-[#1F242B] text-white px-2 py-0.5 rounded">
                  {currentProcess?.code || "PROCESO"}
                </span>
              </div>

              {/* Lista secuencial de Nodos y sus Riesgos Mitigados */}
              <div className="mt-3.5 space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {activeProcessDetail?.flowNodes && activeProcessDetail.flowNodes.length > 0 ? (
                  activeProcessDetail.flowNodes.map((node: any, idx: number) => {
                    const nodeRisks = currentProcessRisks.filter((r) => r.processNodeId === node.id);

                    return (
                      <div
                        key={node.id}
                        className="p-3 rounded-lg border border-gray-200 bg-gray-50/60 text-xs space-y-2"
                      >
                        {/* Cabecera del Nodo */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-gray-500">
                            Paso #{idx + 1} • {node.nodeType}
                          </span>
                          {node.responsibleRole && (
                            <span className="text-[9px] bg-slate-200/80 text-gray-700 px-1.5 py-0.2 rounded font-medium">
                              {node.responsibleRole}
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-gray-900 leading-tight">{node.label}</div>

                        {/* Riesgos Anclados a este Paso del Proceso */}
                        {nodeRisks.length > 0 ? (
                          <div className="space-y-1.5 pt-1 border-t border-gray-200/60">
                            {nodeRisks.map((r) => {
                              const inhScore = r.inherentProbability * r.inherentImpact;
                              const resScore = r.residualProbability * r.residualImpact;
                              const mitigationPoints = inhScore - resScore;

                              return (
                                <div key={r.id} className="bg-white p-2 rounded border border-gray-200 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-bold text-[10px] text-gray-800">{r.code}</span>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getZoneBadgeClasses(
                                        r.residualZone
                                      )}`}
                                    >
                                      {r.residualZone} ({resScore} pts)
                                    </span>
                                  </div>

                                  <div className="text-[11px] text-gray-700 font-medium line-clamp-1">{r.title}</div>

                                  {/* Desplazamiento Inherente -> Residual */}
                                  <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">
                                    <span>
                                      Inh: {r.inherentProbability}×{r.inherentImpact} ({inhScore}p)
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-[#3299A8]" />
                                    <span>
                                      Res: {r.residualProbability}×{r.residualImpact} ({resScore}p)
                                    </span>
                                    {mitigationPoints > 0 && (
                                      <span className="text-emerald-700 font-bold">
                                        &darr; -{mitigationPoints}p
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex justify-between text-[9px] font-mono text-gray-500 pt-0.5">
                                    <span>PEA: {formatMXN(r.expectedAnnualLossPEA)}</span>
                                    <span className="font-bold text-orange-700">PMA: {formatMXN(r.maxAnnualLossPMA)}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 italic">
                            Sin riesgos residuales anclados a este paso operativo.
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-gray-400 text-xs">
                    Cargando trazabilidad de nodos del proceso...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODO 2: MOSAICO COMPARATIVO (UNA MATRIZ 5x5 POR CADA PROCESO BANCARIO) */}
      {analysisScope === "MOSAIC" && (
        <div className="space-y-4">
          <div className="bg-[#1F242B] text-white p-4 rounded-bx shadow-sm flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4 text-[#C0D725]" />
              <span>
                Mosaico Comparativo: Visualizando <strong>{processes.length} procesos bancarios</strong> lado a lado con sus matrices 5×5 dedicadas.
              </span>
            </div>
            <span className="text-gray-400 font-mono text-[11px]">Banco Ve por Más (B×+)</span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {processes.map((proc) => {
              const procRisks = risks.filter((r) => r.processId === proc.id);
              const procPEA = procRisks.reduce((s, r) => s + (r.expectedAnnualLossPEA || 0), 0);
              const procPMA = procRisks.reduce((s, r) => s + (r.maxAnnualLossPMA || 0), 0);

              return (
                <div
                  key={proc.id}
                  className="bg-white rounded-bx p-5 shadow-card border border-gray-200 space-y-4 hover:border-[#3299A8]/50 transition-all"
                >
                  {/* Cabecera del Proceso en el Mosaico */}
                  <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200">
                          {proc.code}
                        </span>
                        {proc.macroProcess?.name && (
                          <span className="text-[10px] font-semibold text-[#3299A8] bg-[#3299A8]/10 px-2 py-0.5 rounded">
                            {proc.macroProcess.name}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 font-serif text-sm mt-1">{proc.name}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProcessId(proc.id);
                        setAnalysisScope("SINGLE_PROCESS");
                      }}
                      className="text-xs bg-[#1F242B] text-white hover:bg-[#3299A8] font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      <span>Ver Detalle</span>
                      <ExternalLink className="w-3 h-3 text-[#C0D725]" />
                    </button>
                  </div>

                  {/* Resumen de Exposición */}
                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-gray-500 block">Riesgos</span>
                      <span className="font-bold text-gray-900">{procRisks.length}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">PEA Total</span>
                      <span className="font-bold text-gray-900">{formatMXN(procPEA)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">PMA Total</span>
                      <span className="font-bold text-orange-700">{formatMXN(procPMA)}</span>
                    </div>
                  </div>

                  {/* Mini Matriz 5x5 del Proceso */}
                  <div className="grid grid-cols-6 gap-1 text-[9px] pt-1">
                    <div className="text-[9px] font-bold text-gray-400 flex items-end justify-center">P \ I</div>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="text-center font-bold text-gray-500 py-0.5">
                        I{i}
                      </div>
                    ))}

                    {[5, 4, 3, 2, 1].map((p) => (
                      <React.Fragment key={p}>
                        <div className="text-right pr-1 font-bold text-gray-500 flex items-center justify-end">
                          P{p}
                        </div>
                        {[1, 2, 3, 4, 5].map((i) => {
                          const cellZone = getCellZone(p, i);
                          const cellRisks = getRisksInCell(p, i, procRisks);

                          let bg = "bg-emerald-100/70 border-emerald-200 text-emerald-900";
                          if (cellZone === "YELLOW") bg = "bg-amber-100/70 border-amber-200 text-amber-900";
                          if (cellZone === "ORANGE") bg = "bg-orange-100/70 border-orange-200 text-orange-900";
                          if (cellZone === "RED") bg = "bg-rose-100/70 border-rose-200 text-rose-900";

                          return (
                            <div
                              key={i}
                              className={`h-9 rounded border flex items-center justify-center font-mono font-bold transition-all ${bg} ${
                                cellRisks.length > 0 ? "ring-2 ring-[#1F242B]" : "opacity-60"
                              }`}
                              title={`P${p} × I${i} • ${cellRisks.length} riesgos`}
                            >
                              {cellRisks.length > 0 ? (
                                <span className="bg-white px-1 rounded shadow-2xs text-[10px]">
                                  {cellRisks.length}
                                </span>
                              ) : (
                                "·"
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. MODO 3: CONSOLIDADO INSTITUCIONAL (VISTA CAIR) */}
      {analysisScope === "INSTITUTIONAL" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matriz Agregada Global */}
          <div className="lg:col-span-2 bg-white rounded-bx p-5 shadow-card border border-gray-200 overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="text-center font-bold text-xs uppercase tracking-wider text-gray-500 mb-2">
                Impacto / Severidad Financiera & Reputacional &rarr;
              </div>

              <div className="grid grid-cols-6 gap-2">
                <div className="text-[10px] font-bold text-gray-400 flex items-end justify-center pb-2">
                  Probabilidad &darr;
                </div>

                {impLabels.map((imp) => (
                  <div
                    key={imp.level}
                    className="text-center text-[11px] font-bold text-gray-700 bg-gray-50 py-1.5 rounded"
                  >
                    {imp.name}
                  </div>
                ))}

                {probLabels.map((prob) => (
                  <React.Fragment key={prob.level}>
                    <div className="text-right pr-2 text-[11px] font-bold text-gray-700 flex items-center justify-end">
                      {prob.name}
                    </div>

                    {impLabels.map((imp) => {
                      const cellZone = getCellZone(prob.level, imp.level);
                      const cellRisks = getRisksInCell(prob.level, imp.level, risks);
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
                          </div>

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

                          <div className="text-[9px] truncate text-center font-mono font-semibold">
                            {cellRisks.length > 0
                              ? formatMXN(cellRisks.reduce((s, r) => s + (r.maxAnnualLossPMA || 0), 0))
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

                  <div className="max-h-[460px] overflow-y-auto space-y-2.5 pr-1">
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
                        <div className="text-[10px] text-gray-500">
                          Proceso: <span className="font-medium text-gray-700">{r.process?.name || "Sin proceso"}</span>
                          {r.processNode?.label && (
                            <> • Nodo: <span className="font-medium text-gray-700">{r.processNode.label}</span></>
                          )}
                        </div>
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
      )}
    </div>
  );
}
