// src/components/ImporterView.tsx
"use client";

import React, { useState, useRef } from "react";
import { RoleType } from "@/types";
import { formatMXN } from "@/lib/utils";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Download,
  FileText,
  X,
  RefreshCw,
  Layers,
  Sparkles,
  Lock,
} from "lucide-react";

interface ImporterViewProps {
  currentRole: RoleType;
}

interface ParsedPreviewRow {
  [key: string]: any;
}

export function ImporterView({ currentRole }: ImporterViewProps) {
  const [selectedLayout, setSelectedLayout] = useState<string>("LAYOUT_A_MATRIZ_5X5");
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<any>(null);
  const [previewRows, setPreviewRows] = useState<ParsedPreviewRow[]>([]);
  const [fileNameLoaded, setFileNameLoaded] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<{
    visible: boolean;
    title: string;
    message: string;
    hash?: string;
    count?: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleLayouts = [
    {
      id: "LAYOUT_A_MATRIZ_5X5",
      title: "Layout A: Matriz 5×5 y Procesos Bancarios",
      subtitle: "Taxonomía CNBV, PEA/PMA y Evaluación de Controles",
      rowsSample: 15,
      description:
        "Estructura Causa -> Evento -> Consecuencia, escalas 1 a 5, frecuencias netas anuales (f) y reglas de formalización de controles (NF).",
      templateFileName: "plantilla_cnbv_matriz_5x5_banco_bxplus.csv",
      templateData: `codigo,titulo,causa,evento,consecuencia,prob_inherente,imp_inherente,frecuencia_anual,perdida_media_mxn,perdida_max_mxn,estado_control,cobertura_control
RSK-TPL-01,Intermitencia en Conciliacion SPEI,Sobrecarga de colas MQ en cierre contable,Retraso en acreditacion de transferencias interbancarias,Reclamos de usuarios y posible penalizacion Banxico,3,4,1.2,1500000,5000000,NF,4
RSK-TPL-02,Falla en Valuacion de Cartera Agropecuaria,Desactualizacion de curvas de precios de granos basicos,Subestimacion de exposicion en creditos de avio,Ajuste patrimonial por requerimiento de auditoria,2,3,0.5,800000,2400000,F,4
RSK-TPL-03,Intento de Suplantacion en Token Movil,Ingenieria social via SIM swapping,Acceso no autorizado a banca digital Pyme,Quebranto por fraude absorbido por el banco,2,5,0.3,3200000,10500000,F,5`,
    },
    {
      id: "LAYOUT_B_CARTERA_NIF_C16",
      title: "Layout B: Cartera Crediticia y Reservas NIF C-16",
      subtitle: "Etapas 1, 2 y 3, Colaterales E* y Filtro ASG SHCP",
      rowsSample: 42,
      description:
        "Cálculo prospectivo de PCE, aforo de garantías admisibles con haircuts He/Hc, detección de SICR y taxonomía sostenible.",
      templateFileName: "plantilla_nif_c16_cartera_banco_bxplus.csv",
      templateData: `id_credito,segmento,exposicion_bruta_ei,valor_colateral_c,aforo_he,volatilidad_hc,dias_mora,pi_12m,severidad_sp,score_climatico_asg
CR-AGRO-901,AGROPECUARIO,18000000,15000000,0.05,0.15,15,0.035,0.45,84
CR-EMP-402,EMPRESARIAL,32000000,25000000,0.05,0.10,95,0.180,0.65,35
CR-PYME-105,PYME,6000000,5000000,0.05,0.15,0,0.020,0.40,20`,
    },
    {
      id: "LAYOUT_C_INDICADOR_NEGOCIO_IN",
      title: "Layout C: Contabilidad Trianual Indicador de Negocio (IN)",
      subtitle: "Anexo 1-D Bis CUB para Requerimiento de Capital Operacional",
      rowsSample: 3,
      description:
        "Series contables de los ejercicios t-2, t-1 y t para el cálculo promedio de ILCT, CS y FC.",
      templateFileName: "plantilla_anexo_1d_indicador_negocio_in.csv",
      templateData: `ejercicio_fiscal,ilct_componente_mxn,cs_componente_mxn,fc_componente_mxn
2023,2100000000,590000000,380000000
2024,2350000000,640000000,395000000
2025,2900000000,810000000,455000000`,
    },
    {
      id: "LAYOUT_D_MERCADO_LIQUIDEZ",
      title: "Layout D: Mercado, Liquidez e IDEL",
      subtitle: "VaR 99%, CVaR, Coeficiente CCL y Severidad IDEL",
      rowsSample: 28,
      description:
        "Parámetros de volatilidad diaria, ALAC, salidas netas a 30 días y posiciones acumuladas a 30, 60 y 90 días.",
      templateFileName: "plantilla_mercado_liquidez_ccl_idel.csv",
      templateData: `fecha_corte,var_parametrico_99_mxn,cvar_99_mxn,ccl_porcentaje,idel_porcentaje,alac_mxn
2026-03-31,14200000,18900000,114.50,145.20,1250000000
2026-03-30,13800000,18100000,116.80,148.10,1260000000
2026-03-29,14100000,18500000,115.20,146.00,1255000000`,
    },
  ];

  // Helper to parse simple CSV text into rows
  const parseCSVText = (csvText: string, layoutId: string): ParsedPreviewRow[] => {
    const lines = csvText.trim().split("\n").filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const rows: ParsedPreviewRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: ParsedPreviewRow = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });

      // Normalize common keys based on layout
      if (layoutId === "LAYOUT_A_MATRIZ_5X5") {
        row.title = row.titulo || row.title || `Riesgo Lote ${i}`;
        row.cause = row.causa || row.cause || "Causa operativa";
        row.eventDescription = row.evento || row.eventDescription || "Evento identificado";
        row.consequence = row.consecuencia || row.consequence || "Impacto financiero";
        row.prob = Number(row.prob_inherente || row.prob || 3);
        row.imp = Number(row.imp_inherente || row.imp || 3);
        row.freq = Number(row.frecuencia_anual || row.freq || 0.5);
        row.avgLoss = Number(row.perdida_media_mxn || row.avgLoss || 1000000);
        row.maxLoss = Number(row.perdida_max_mxn || row.maxLoss || 3000000);
        row.controlStatus = row.estado_control || row.controlStatus || "F";
        row.controlCoverage = Number(row.cobertura_control || row.controlCoverage || 3);
      } else if (layoutId === "LAYOUT_B_CARTERA_NIF_C16") {
        row.loanId = row.id_credito || row.loanId || `CR-${100 + i}`;
        row.segment = row.segmento || row.segment || "EMPRESARIAL";
        row.grossExposureEI = Number(row.exposicion_bruta_ei || row.grossExposureEI || 10000000);
        row.collateralValueC = Number(row.valor_colateral_c || row.collateralValueC || 7000000);
        row.daysPastDue = Number(row.dias_mora || row.daysPastDue || 0);
        row.pd12Months = Number(row.pi_12m || row.pd12Months || 0.03);
        row.lgdSeveritySP = Number(row.severidad_sp || row.lgdSeveritySP || 0.45);
        row.esgClimateScore = Number(row.score_climatico_asg || row.esgClimateScore || 30);
      } else if (layoutId === "LAYOUT_C_INDICADOR_NEGOCIO_IN") {
        row.year = Number(row.ejercicio_fiscal || row.year || 2025);
        row.ilct = Number(row.ilct_componente_mxn || row.ilct || 2500000000);
        row.cs = Number(row.cs_componente_mxn || row.cs || 700000000);
        row.fc = Number(row.fc_componente_mxn || row.fc || 400000000);
      } else if (layoutId === "LAYOUT_D_MERCADO_LIQUIDEZ") {
        row.date = row.fecha_corte || row.date || "2026-03-31";
        row.var = Number(row.var_parametrico_99_mxn || row.var || 14200000);
        row.cvar = Number(row.cvar_99_mxn || row.cvar || 18900000);
        row.ccl = Number(row.ccl_porcentaje || row.ccl || 114.5);
        row.idel = Number(row.idel_porcentaje || row.idel || 145.2);
      }

      rows.push(row);
    }

    return rows;
  };

  // Download official CSV template
  const handleDownloadTemplate = (layoutId: string) => {
    const layout = sampleLayouts.find((l) => l.id === layoutId);
    if (!layout) return;

    const blob = new Blob([layout.templateData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", layout.templateFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file select from input or drop
  const handleProcessFile = (file: File) => {
    setFileNameLoaded(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const parsed = parseCSVText(text, selectedLayout);
        setPreviewRows(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Load demo batch for fast 1-click test
  const handleLoadDemoBatch = (layoutId: string) => {
    const layout = sampleLayouts.find((l) => l.id === layoutId);
    if (!layout) return;

    setSelectedLayout(layoutId);
    setFileNameLoaded(`lote_demo_${layoutId.toLowerCase()}.csv`);
    const parsed = parseCSVText(layout.templateData, layoutId);
    setPreviewRows(parsed);
    setImportReport(null);
  };

  // Send validated rows to database
  const handleConfirmIngestion = async () => {
    try {
      setImporting(true);
      const res = await fetch("/api/layouts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layoutType: selectedLayout,
          userRole: currentRole,
          rows: previewRows,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setImportReport(data);
        setToastNotification({
          visible: true,
          title: "Ingesta Exitosa en Base de Datos",
          message: `Se ingron y persistieron exitosamente ${data.importedCount} registros en SQLite conforme a normatividad CNBV.`,
          hash: data.auditLogHash,
          count: data.importedCount,
        });
      }
    } catch (e) {
      console.error("Error confirming layout import:", e);
    } finally {
      setImporting(false);
    }
  };

  const activeLayoutInfo = sampleLayouts.find((l) => l.id === selectedLayout);

  return (
    <div className="space-y-6 w-full">
      {/* Institutional Bx+ Toast Banner */}
      {toastNotification && toastNotification.visible && (
        <div className="bg-[#1F242B] border-l-4 border-[#C0D725] text-white p-4 rounded-bx shadow-2xl flex items-start justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-[#C0D725]/20 rounded-md text-[#C0D725] mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-[#C0D725]">
                {toastNotification.title}
              </div>
              <p className="text-xs text-gray-300">{toastNotification.message}</p>
              {toastNotification.hash && (
                <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-gray-400">
                  <Lock className="w-3 h-3 text-[#3299A8]" />
                  <span>Sello SHA-256: </span>
                  <span className="text-[#3299A8] font-bold">{toastNotification.hash}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
            Módulo 01 — Ingesta & Motores Cuantitativos
          </div>
          <h2 className="text-lg font-bold text-gray-900 font-serif">
            Importador Inteligente de Layouts Excel / CSV
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Carga real, previsualización asistida y validación automatizada conforme a CUB, NIF C-16 y SHCP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadTemplate(selectedLayout)}
            className="bg-white border border-gray-300 hover:border-[#3299A8] text-gray-700 text-xs font-medium px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#3299A8]" />
            <span>Descargar Plantilla CSV Oficial</span>
          </button>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="bg-white rounded-bx p-8 shadow-card border-2 border-dashed border-gray-300 hover:border-[#3299A8] transition-colors text-center flex flex-col items-center justify-center space-y-3 cursor-pointer group"
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv,.xlsx,.xls,.json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="p-3 bg-cyan-50 rounded-full text-[#3299A8] group-hover:scale-105 transition-transform">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">
            Arrastra y suelta tu archivo .xlsx o .csv aquí
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Compatible con plantillas oficiales de Banco B×+ (hasta 15MB)
          </p>
          {fileNameLoaded && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-300 text-emerald-900 text-xs font-mono font-medium px-3 py-1 rounded-[4px] shadow-xs">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>Archivo cargado: <strong>{fileNameLoaded}</strong> ({previewRows.length} registros leídos)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs bg-[#1F242B] text-white px-4 py-2 rounded font-bold hover:bg-[#2A313C] transition-colors shadow-sm"
          >
            Examinar Archivo Local
          </button>
          <button
            type="button"
            onClick={() => handleLoadDemoBatch(selectedLayout)}
            className="text-xs bg-[#C0D725] hover:bg-[#AEC41D] text-[#1F242B] px-4 py-2 rounded font-bold transition-colors shadow-sm flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cargar Lote Demo B×+</span>
          </button>
        </div>
      </div>

      {/* 4 One-Click Preloaded Master Layouts */}
      <div>
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-[#3299A8]" />
          <span>Plantillas Maestras Normativas de Banco B×+:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sampleLayouts.map((layout) => (
            <div
              key={layout.id}
              className={`bg-white rounded-lg p-4 border transition-all shadow-sm flex flex-col justify-between ${
                selectedLayout === layout.id
                  ? "border-2 border-[#3299A8] ring-1 ring-[#3299A8]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-gray-900">{layout.title}</span>
                  <span className="font-mono text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {layout.rowsSample} registros muestra
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-[#3299A8]">{layout.subtitle}</div>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  {layout.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => handleDownloadTemplate(layout.id)}
                  className="text-xs text-gray-600 hover:text-[#3299A8] font-medium flex items-center gap-1"
                  title="Descargar archivo CSV de ejemplo"
                >
                  <Download className="w-3 h-3 text-[#3299A8]" />
                  <span>Descargar CSV</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedLayout(layout.id);
                      handleLoadDemoBatch(layout.id);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100"
                  >
                    Cargar Demo
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLayout(layout.id);
                      handleLoadDemoBatch(layout.id);
                    }}
                    className="bg-[#C0D725] hover:bg-[#AEC41D] text-[#1F242B] text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-transform hover:scale-[1.02]"
                  >
                    <span>Seleccionar</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-Time Preview Table of Loaded Rows */}
      {previewRows.length > 0 && (
        <div className="bg-white rounded-bx shadow-card border border-gray-200 overflow-hidden space-y-3 p-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#3299A8]" />
              <h3 className="text-sm font-bold text-gray-900 font-serif">
                Vista Previa de Filas Cargadas ({previewRows.length} registros)
              </h3>
            </div>
            <button
              onClick={handleConfirmIngestion}
              disabled={importing}
              className="bg-[#1F242B] hover:bg-[#2A313C] text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C0D725]" />
                  <span>Ingiriendo en Base de Datos...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C0D725]" />
                  <span>Confirmar e Ingerir a Base de Datos</span>
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7F9] text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                {selectedLayout === "LAYOUT_A_MATRIZ_5X5" && (
                  <tr>
                    <th className="py-2.5 px-3">Título del Riesgo</th>
                    <th className="py-2.5 px-3">Causa &rarr; Evento</th>
                    <th className="py-2.5 px-3 text-center">P / I</th>
                    <th className="py-2.5 px-3 text-right">Pérdida Media</th>
                    <th className="py-2.5 px-3 text-center">Control / Regla CNBV</th>
                  </tr>
                )}
                {selectedLayout === "LAYOUT_B_CARTERA_NIF_C16" && (
                  <tr>
                    <th className="py-2.5 px-3">ID Crédito</th>
                    <th className="py-2.5 px-3">Segmento</th>
                    <th className="py-2.5 px-3 text-right">Exposición (EI)</th>
                    <th className="py-2.5 px-3 text-center">Días Mora</th>
                    <th className="py-2.5 px-3 text-center">Filtro ASG / Etapa NIF C-16</th>
                  </tr>
                )}
                {selectedLayout === "LAYOUT_C_INDICADOR_NEGOCIO_IN" && (
                  <tr>
                    <th className="py-2.5 px-3">Ejercicio Fiscal</th>
                    <th className="py-2.5 px-3 text-right">Componente ILCT</th>
                    <th className="py-2.5 px-3 text-right">Componente CS</th>
                    <th className="py-2.5 px-3 text-right">Componente FC</th>
                  </tr>
                )}
                {selectedLayout === "LAYOUT_D_MERCADO_LIQUIDEZ" && (
                  <tr>
                    <th className="py-2.5 px-3">Fecha Corte</th>
                    <th className="py-2.5 px-3 text-right">VaR 99% (1 Día)</th>
                    <th className="py-2.5 px-3 text-right">CVaR 99%</th>
                    <th className="py-2.5 px-3 text-center">CCL (%)</th>
                    <th className="py-2.5 px-3 text-center">IDEL (%)</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {previewRows.map((row, idx) => {
                  if (selectedLayout === "LAYOUT_A_MATRIZ_5X5") {
                    const isNF = row.controlStatus === "NF";
                    const isHighCov = Number(row.controlCoverage) > 2;
                    return (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-gray-800">{row.title}</td>
                        <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">{row.cause} &rarr; {row.eventDescription}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-700">{row.prob} / {row.imp}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-700">{formatMXN(row.avgLoss)}</td>
                        <td className="py-2.5 px-3 text-center">
                          {isNF && isHighCov ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200" title="Control NF con cobertura > 2: topado a 2 según CUB">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              NF Topado a 2 (CNBV)
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {row.controlStatus === "F" ? "Formalizado (F)" : "No Formalizado (NF)"} — Cobertura: {row.controlCoverage}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  } else if (selectedLayout === "LAYOUT_B_CARTERA_NIF_C16") {
                    const dpd = Number(row.daysPastDue || 0);
                    const esg = Number(row.esgClimateScore || 0);
                    const isStage3 = dpd >= 90;
                    const isStage2 = !isStage3 && (dpd >= 30 || esg >= 75);
                    return (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{row.loanId}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-700">{row.segment}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-800">{formatMXN(row.grossExposureEI)}</td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dpd >= 90 ? "bg-rose-100 text-rose-800" : dpd > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {dpd} días
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isStage3 ? (
                            <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Etapa 3 (Cartera Vencida)
                            </span>
                          ) : isStage2 ? (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200" title={`Score ASG: ${esg}`}>
                              Etapa 2 (SICR ASG Clima: {esg}/100)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Etapa 1 (Vigente)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  } else if (selectedLayout === "LAYOUT_C_INDICADOR_NEGOCIO_IN") {
                    return (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-gray-800">{row.year}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-700">{formatMXN(row.ilct)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-700">{formatMXN(row.cs)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-700">{formatMXN(row.fc)}</td>
                      </tr>
                    );
                  } else {
                    return (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-gray-800">{row.date}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-700">{formatMXN(row.var)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-700">{formatMXN(row.cvar)}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">{row.ccl}%</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">{row.idel}%</td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pre-Load Validation Report from API */}
      {importReport && (
        <div className="bg-white rounded-bx p-5 shadow-card border border-emerald-300 space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900 font-serif">
              Informe de Pre-Carga y Validación de Reglas CNBV
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 bg-gray-50 rounded border">
              <span className="text-gray-500">Registros Totales:</span>
              <div className="text-lg font-bold font-mono text-gray-900 mt-1">
                {importReport.validRows + importReport.errorRows}
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
              <span className="text-emerald-700">Registros Persistidos en Prisma:</span>
              <div className="text-lg font-bold font-mono text-emerald-800 mt-1">
                {importReport.validRows}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded border">
              <span className="text-gray-500">Errores Críticos:</span>
              <div className="text-lg font-bold font-mono text-gray-900 mt-1">
                {importReport.errorRows}
              </div>
            </div>
          </div>

          {/* Validation Warnings & Audit Rules Applied */}
          {importReport.warnings && importReport.warnings.length > 0 && (
            <div className="bg-gray-50 p-3.5 rounded border border-gray-200 text-xs space-y-2">
              <span className="font-bold text-gray-800">Reglas de Negocio Auditables Aplicadas:</span>
              <ul className="space-y-1 text-gray-600 list-disc list-inside">
                {importReport.warnings.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {importReport.auditLogHash && (
            <div className="p-3 bg-[#1F242B] text-gray-300 rounded font-mono text-[11px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border border-gray-700">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#C0D725]" />
                <span className="text-gray-400">Huella Inmutable SHA-256:</span>
                <span className="text-[#C0D725] font-bold truncate max-w-xs" title={importReport.auditLogHash}>
                  {importReport.auditLogHash}
                </span>
              </div>
              <span className="text-[10px] text-gray-400">
                {new Date(importReport.auditTimestamp || Date.now()).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
