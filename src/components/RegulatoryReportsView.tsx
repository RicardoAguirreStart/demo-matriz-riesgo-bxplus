// src/components/RegulatoryReportsView.tsx
"use client";

import React, { useState, useEffect } from "react";
import { formatMXN, getZoneBadgeClasses } from "@/lib/utils";
import { RoleType } from "@/types";
import { FileText, Shield, Scale, Hash, CheckCircle2, Download, AlertCircle } from "lucide-react";

interface RegulatoryReportsViewProps {
  currentRole: RoleType;
}

export function RegulatoryReportsView({ currentRole }: RegulatoryReportsViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState<"R24" | "LEGAL" | "ART88" | "AUDIT">("R24");

  useEffect(() => {
    setLoading(true);
    fetch("/api/reports")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C0D725]"></div>
        <p className="mt-2 text-xs text-gray-500">Generando reportes regulatorios CNBV y verificando cadena SHA-256...</p>
      </div>
    );
  }

  const { serieR24, legalPortfolio, article88RAF, auditTrail } = data || {};

  return (
    <div className="space-y-6">
      {/* Header and Sub-tabs */}
      <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
            Reporteo Oficial CNBV / Banxico & Bitácora Inalterable
          </div>
          <h2 className="text-lg font-bold text-gray-900 font-serif">
            Módulo Regulatorio de Supervisión e Integridad Criptográfica
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cumplimiento normativo de la Serie R24, Portafolio Global de Juicios, Art. 88 CUB y Audit Trail
          </p>
        </div>

        <div className="flex flex-wrap bg-[#F5F7F9] p-1 rounded-lg border border-gray-200 text-xs">
          <button
            onClick={() => setActiveReportTab("R24")}
            className={`px-3 py-1.5 font-bold rounded-md transition-all ${
              activeReportTab === "R24"
                ? "bg-[#1F242B] text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Serie R24 (Canales)
          </button>
          <button
            onClick={() => setActiveReportTab("LEGAL")}
            className={`px-3 py-1.5 font-bold rounded-md transition-all ${
              activeReportTab === "LEGAL"
                ? "bg-[#1F242B] text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Portafolio de Juicios
          </button>
          <button
            onClick={() => setActiveReportTab("ART88")}
            className={`px-3 py-1.5 font-bold rounded-md transition-all ${
              activeReportTab === "ART88"
                ? "bg-[#1F242B] text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Informe Art. 88 CUB
          </button>
          <button
            onClick={() => setActiveReportTab("AUDIT")}
            className={`px-3 py-1.5 font-bold rounded-md transition-all flex items-center gap-1 ${
              activeReportTab === "AUDIT"
                ? "bg-[#3299A8] text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Audit Trail SHA-256</span>
          </button>
        </div>
      </div>

      {/* 1. SERIE R24 */}
      {activeReportTab === "R24" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-bx border shadow-sm">
              <span className="text-xs text-gray-500 font-semibold uppercase">Pérdida Bruta Registrada:</span>
              <div className="text-xl font-bold font-serif text-gray-900 mt-1">
                {formatMXN(serieR24?.totalGrossLoss)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-bx border shadow-sm">
              <span className="text-xs text-gray-500 font-semibold uppercase">Pérdida Neta (Post-Recuperación):</span>
              <div className="text-xl font-bold font-serif text-rose-700 mt-1">
                {formatMXN(serieR24?.totalNetLoss)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-bx border shadow-sm">
              <span className="text-xs text-gray-500 font-semibold uppercase">Indisponibilidad Acumulada:</span>
              <div className="text-xl font-bold font-serif text-amber-700 mt-1">
                {serieR24?.totalDowntimeMinutes} minutos
              </div>
            </div>
          </div>

          <div className="bg-white rounded-bx shadow-card border border-gray-200 overflow-hidden">
            <div className="bg-[#1F242B] text-white px-5 py-3 flex items-center justify-between">
              <span className="font-serif font-bold text-sm">
                Registro de Eventos de Pérdida Operativa y Fallas en Canales (Serie R24)
              </span>
              <button
                onClick={() => alert("Generando archivo SITI R24 en formato XML oficial...")}
                className="text-xs bg-[#C0D725] text-[#1F242B] font-bold px-2.5 py-1 rounded flex items-center gap-1 hover:bg-[#AEC41D]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar SITI CNBV</span>
              </button>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7F9] text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Código Evento</th>
                  <th className="py-2.5 px-4">Fecha Descubrimiento</th>
                  <th className="py-2.5 px-4">Canal Afectado</th>
                  <th className="py-2.5 px-4 text-center">Indisponibilidad</th>
                  <th className="py-2.5 px-4 text-right">Pérdida Bruta</th>
                  <th className="py-2.5 px-4 text-right">Recuperación</th>
                  <th className="py-2.5 px-4 text-right">Pérdida Neta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {serieR24?.events?.map((e: any) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-gray-800">{e.eventCode}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(e.discoveryDate).toLocaleDateString("es-MX")}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{e.channelAffected || "N/A"}</td>
                    <td className="py-3 px-4 text-center font-mono">
                      {e.downtimeMinutes ? `${e.downtimeMinutes} min` : "0 min"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-gray-800">
                      {formatMXN(e.grossLossMXN)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                      {formatMXN(e.recoveryAmountMXN)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                      {formatMXN(e.netLossMXN)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. PORTAFOLIO GLOBAL DE JUICIOS */}
      {activeReportTab === "LEGAL" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-bx border shadow-sm">
              <span className="text-xs text-gray-500 font-semibold uppercase">Cuantía Total Reclamada:</span>
              <div className="text-2xl font-bold font-serif text-gray-900 mt-1">
                {formatMXN(legalPortfolio?.totalClaimedMXN)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-bx border shadow-sm">
              <span className="text-xs text-gray-500 font-semibold uppercase">Reserva / Provisión Contable:</span>
              <div className="text-2xl font-bold font-serif text-rose-700 mt-1">
                {formatMXN(legalPortfolio?.totalProvisionedMXN)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-bx shadow-card border border-gray-200 overflow-hidden">
            <div className="bg-[#1F242B] text-white px-5 py-3 flex items-center justify-between">
              <span className="font-serif font-bold text-sm">
                Portafolio Global de Litigios y Contingencias Judiciales
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7F9] text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Número de Expediente</th>
                  <th className="py-2.5 px-4">Materia Jurídica</th>
                  <th className="py-2.5 px-4 text-right">Cuantía Reclamada</th>
                  <th className="py-2.5 px-4 text-center">Prob. Desfavorable</th>
                  <th className="py-2.5 px-4 text-right">Provisión Constituida</th>
                  <th className="py-2.5 px-4 text-center">Estado Procesal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {legalPortfolio?.cases?.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-gray-800">{c.caseNumber}</td>
                    <td className="py-3 px-4 font-semibold text-gray-700">{c.legalType}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                      {formatMXN(c.claimedAmountMXN)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-700">
                      {c.adverseProbPct}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                      {formatMXN(c.provisionedAmountMXN)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-mono">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. INFORME DEL ARTÍCULO 88 CUB (MARCO RAF) */}
      {activeReportTab === "ART88" && (
        <div className="bg-white rounded-bx shadow-card border border-gray-200 overflow-hidden">
          <div className="bg-[#1F242B] text-white px-5 py-3 flex items-center justify-between">
            <span className="font-serif font-bold text-sm">
              Cédula de Monitoreo Trimestral del Marco de Apetito al Riesgo (Artículo 88 CUB)
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7F9] text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Indicador RAF</th>
                <th className="py-2.5 px-4">Tipo de Riesgo</th>
                <th className="py-2.5 px-4 text-center">Apetito</th>
                <th className="py-2.5 px-4 text-center">Tolerancia</th>
                <th className="py-2.5 px-4 text-center">Límite</th>
                <th className="py-2.5 px-4 text-center font-bold">Valor Actual</th>
                <th className="py-2.5 px-4 text-center">Semaforización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {article88RAF?.thresholds?.map((th: any) => (
                <tr key={th.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold text-gray-900">{th.metricName}</td>
                  <td className="py-3 px-4 text-gray-500">{th.riskType}</td>
                  <td className="py-3 px-4 text-center font-mono font-semibold">
                    {th.unit === "%" ? `${th.appetiteValue}%` : formatMXN(th.appetiteValue)}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-semibold">
                    {th.unit === "%" ? `${th.toleranceValue}%` : formatMXN(th.toleranceValue)}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-rose-700">
                    {th.unit === "%" ? `${th.regulatoryLimitValue}%` : formatMXN(th.regulatoryLimitValue)}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-black text-sm text-[#1F242B]">
                    {th.unit === "%" ? `${th.currentValue}%` : formatMXN(th.currentValue)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-[3px] inline-flex items-center gap-1.5 ${getZoneBadgeClasses(th.currentZone)}`}>
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
                      <span>{th.currentZone}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. BITÁCORA CRIPTOGRÁFICA INALTERABLE (AUDIT TRAIL SHA-256) */}
      {activeReportTab === "AUDIT" && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-bx p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-900 text-xs">
                  Cadena Criptográfica Íntegra y Sellada (Blockchain-like SHA-256)
                </span>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Cada transacción sella el hash del bloque anterior: <code>SHA-256(previousHash + timestamp + user + payload)</code>. Imposible de alterar a posteriori por auditores o administradores.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-white text-emerald-800 px-3 py-1 rounded border border-emerald-200 shadow-sm shrink-0">
              {auditTrail?.totalLogs} Bloques Sellados
            </span>
          </div>

          <div className="bg-white rounded-bx shadow-card border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#F5F7F9] text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4 w-36">Timestamp</th>
                    <th className="py-2.5 px-4">Usuario & Rol</th>
                    <th className="py-2.5 px-4">Acción Auditada</th>
                    <th className="py-2.5 px-4">Hash Anterior (Parent)</th>
                    <th className="py-2.5 px-4">Hash Actual (SHA-256 Seal)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[11px]">
                  {auditTrail?.logs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("es-MX")}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-bold text-gray-900">{log.user?.fullName}</div>
                        <div className="text-[10px] text-gray-500">{log.userRole}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#3299A8]">
                        {log.actionType}
                      </td>
                      <td className="py-3 px-4 text-gray-400 truncate max-w-xs" title={log.previousHash}>
                        {log.previousHash.slice(0, 16)}...
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-800 truncate max-w-xs" title={log.currentHash}>
                        <span className="bg-emerald-50 text-emerald-900 px-1 py-0.5 rounded border border-emerald-200">
                          {log.currentHash.slice(0, 16)}...
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
