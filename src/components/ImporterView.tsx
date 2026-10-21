// src/components/ImporterView.tsx
"use client";

import React, { useState } from "react";
import { RoleType } from "@/types";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";

interface ImporterViewProps {
  currentRole: RoleType;
}

export function ImporterView({ currentRole }: ImporterViewProps) {
  const [selectedLayout, setSelectedLayout] = useState<string>("LAYOUT_A_MATRIZ_5X5");
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<any>(null);

  const sampleLayouts = [
    {
      id: "LAYOUT_A_MATRIZ_5X5",
      title: "Layout A: Matriz 5×5 y Procesos Bancarios",
      subtitle: "Taxonomía CNBV, PEA/PMA y Evaluación de Controles",
      rowsSample: 15,
      description:
        "Estructura Causa -> Evento -> Consecuencia, escalas 1 a 5, frecuencias netas anuales (f) y reglas de formalización de controles (NF).",
    },
    {
      id: "LAYOUT_B_CARTERA_NIF_C16",
      title: "Layout B: Cartera Crediticia y Reservas NIF C-16",
      subtitle: "Etapas 1, 2 y 3, Colaterales E* y Filtro ASG SHCP",
      rowsSample: 42,
      description:
        "Cálculo prospectivo de PCE, aforo de garantías admisibles con haircuts He/Hc, detección de SICR y taxonomía sostenible.",
    },
    {
      id: "LAYOUT_C_INDICADOR_NEGOCIO_IN",
      title: "Layout C: Contabilidad Trianual Indicador de Negocio (IN)",
      subtitle: "Anexo 1-D Bis CUB para Requerimiento de Capital Operacional",
      rowsSample: 3,
      description:
        "Series contables de los ejercicios t-2, t-1 y t para el cálculo promedio de ILCT, CS y FC.",
    },
    {
      id: "LAYOUT_D_MERCADO_LIQUIDEZ",
      title: "Layout D: Mercado, Liquidez e IDEL",
      subtitle: "VaR 99%, CVaR, Coeficiente CCL y Severidad IDEL",
      rowsSample: 28,
      description:
        "Parámetros de volatilidad diaria, ALAC, salidas netas a 30 días y posiciones acumuladas a 30, 60 y 90 días.",
    },
  ];

  const handleRunImport = async (layoutId: string) => {
    try {
      setImporting(true);
      setImportReport(null);
      const res = await fetch("/api/layouts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layoutType: layoutId,
          userRole: currentRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setImportReport(data);
      }
    } catch (e) {
      console.error("Error importing layout:", e);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
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
            Panel de pre-carga y validación asistida conforme a circulares CNBV y NIF C-16
          </p>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div className="bg-white rounded-bx p-8 shadow-card border-2 border-dashed border-gray-300 hover:border-[#3299A8] transition-colors text-center flex flex-col items-center justify-center space-y-3 cursor-pointer">
        <div className="p-3 bg-cyan-50 rounded-full text-[#3299A8]">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">
            Arrastra y suelta tu archivo .xlsx o .csv aquí
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Compatible con plantillas oficiales de Banco B×+ (hasta 15MB)
          </p>
        </div>
        <button
          onClick={() => handleRunImport(selectedLayout)}
          className="text-xs bg-[#1F242B] text-white px-4 py-2 rounded font-bold hover:bg-[#2A313C] transition-colors"
        >
          Examinar Archivo Local
        </button>
      </div>

      {/* 4 One-Click Preloaded Master Layouts */}
      <div>
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-[#3299A8]" />
          <span>O prueba con 4 Plantillas Maestras Integradas (Carga en 1 Clic):</span>
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
                    {layout.rowsSample} registros
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-[#3299A8]">{layout.subtitle}</div>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  {layout.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedLayout(layout.id)}
                  className="text-xs text-gray-500 hover:text-gray-900 font-medium"
                >
                  Seleccionar Plantilla
                </button>
                <button
                  onClick={() => handleRunImport(layout.id)}
                  disabled={importing}
                  className="bg-[#C0D725] hover:bg-[#AEC41D] text-[#1F242B] text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-transform hover:scale-[1.02] disabled:opacity-50"
                >
                  <span>{importing ? "Validando..." : "Cargar y Validar CNBV"}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pre-Load Validation Report */}
      {importReport && (
        <div className="bg-white rounded-bx p-5 shadow-card border border-emerald-300 space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900 font-serif">
              Informe de Pre-Carga y Validación de Reglas CNBV
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 bg-gray-50 rounded border">
              <span className="text-gray-500">Registros Totales:</span>
              <div className="text-lg font-bold font-mono text-gray-900 mt-1">
                {importReport.validRows + importReport.errorRows}
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
              <span className="text-emerald-700">Registros Válidos:</span>
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
          <div className="bg-gray-50 p-3.5 rounded border border-gray-200 text-xs space-y-2">
            <span className="font-bold text-gray-800">Reglas de Negocio Auditables Aplicadas:</span>
            <ul className="space-y-1 text-gray-600 list-disc list-inside">
              {importReport.warnings?.map((w: string, i: number) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => alert("Datos persistidos y motores de cálculo recalculados.")}
              className="bg-[#1F242B] text-white text-xs font-bold px-4 py-2 rounded hover:bg-gray-800 transition-colors"
            >
              Confirmar y Publicar en Base Transaccional
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
