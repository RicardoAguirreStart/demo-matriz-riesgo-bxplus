// src/components/ActionPlansView.tsx
"use client";

import React, { useState, useEffect } from "react";
import { formatMXN, getZoneBadgeClasses } from "@/lib/utils";
import { RoleType } from "@/types";
import { Zap, CheckCircle2, AlertTriangle, FileText, Plus, ShieldCheck, PenTool } from "lucide-react";

interface ActionPlansViewProps {
  currentRole: RoleType;
}

export function ActionPlansView({ currentRole }: ActionPlansViewProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = () => {
    setLoading(true);
    fetch("/api/action-plans")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPlans(data.plans);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSignPlan = async (planId: string) => {
    try {
      const res = await fetch("/api/action-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SIGN_PLAN",
          planId,
          userRole: currentRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("¡Plan de Remediación firmado formalmente y sellado en el Audit Trail!");
        fetchPlans();
      }
    } catch (e) {
      console.error("Error signing plan:", e);
    }
  };

  const quickWins = plans.filter((p) => p.isQuickWin);
  const standardPlans = plans.filter((p) => !p.isQuickWin);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
            Módulo 02 — Gestión de Planes de Acción & Evidencias
          </div>
          <h2 className="text-lg font-bold text-gray-900 font-serif">
            Matriz de Priorización de Mitigación y Cuadrante "Quick-Wins"
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cruce analítico de Potencial de Mejora (&ge;60% PEA) vs. Esfuerzo de Implementación (&le;90 días)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-[#C0D725] text-[#1F242B] px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-[#1F242B]" />
            <span>{quickWins.length} Quick-Wins Identificados</span>
          </span>
        </div>
      </div>

      {/* QUICK-WINS HIGHLIGHT SECTION */}
      <div className="bg-gradient-to-r from-emerald-50 via-lime-50/40 to-white rounded-bx p-5 border-2 border-[#C0D725] shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#C0D725] text-[#1F242B]">
              <Zap className="w-5 h-5 fill-[#1F242B]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-serif">
                Iniciativas de Máxima Prioridad Ejecutiva (Quick-Wins)
              </h3>
              <p className="text-[11px] text-gray-600">
                Iniciativas con reducción &ge; 60% en PEA/PMA y esfuerzo Bajo o Muy Bajo (&le;90 días).
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickWins.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {plan.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-emerald-600" />
                    <span>QUICK-WIN ({plan.timeScale})</span>
                  </span>
                </div>

                <h4 className="font-bold text-gray-900 text-xs mt-1.5 leading-snug">
                  {plan.title}
                </h4>
                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {/* Metrics & Signature Status */}
              <div className="pt-2 border-t border-gray-100 text-xs space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">Beneficio Anual PEA:</span>
                  <strong className="text-emerald-700 font-mono">
                    -{formatMXN(plan.expectedPEAReductionMXN)}
                  </strong>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">Reducción PMA:</span>
                  <strong className="text-orange-700 font-mono">
                    -{formatMXN(plan.expectedPMAReductionMXN)}
                  </strong>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    {plan.signedByBusinessHead ? (
                      <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Firmado por Titular</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-orange-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Firma Pendiente</span>
                      </span>
                    )}
                  </div>

                  {!plan.signedByBusinessHead && (
                    <button
                      onClick={() => handleSignPlan(plan.id)}
                      className="bg-[#1F242B] hover:bg-[#2A313C] text-white text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
                    >
                      <PenTool className="w-3 h-3 text-[#C0D725]" />
                      <span>Firmar Remediación</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ALL ACTION PLANS TABLE */}
      <div className="bg-white rounded-bx shadow-card border border-gray-200 overflow-hidden">
        <div className="bg-[#1F242B] text-white px-5 py-3 flex items-center justify-between">
          <h3 className="text-sm font-bold font-serif">
            Inventario Completo de Planes de Acción de Banco B×+
          </h3>
          <span className="text-xs text-gray-300">
            {plans.length} Planes Registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7F9] text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 w-28">Código</th>
                <th className="py-2.5 px-4">Iniciativa / Plan de Acción</th>
                <th className="py-2.5 px-4">Riesgo Vinculado</th>
                <th className="py-2.5 px-4 text-center">Mejora Estimada</th>
                <th className="py-2.5 px-4 text-center">Plazo</th>
                <th className="py-2.5 px-4 text-center">Firma Titular</th>
                <th className="py-2.5 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-gray-600">
                    {p.code}
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-bold text-gray-900 leading-snug">{p.title}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                      {p.description}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800">{p.riskEvent?.title}</div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getZoneBadgeClasses(
                        p.riskEvent?.residualZone
                      )}`}
                    >
                      {p.riskEvent?.residualZone}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold font-mono text-emerald-700 text-xs">
                      {(p.improvementPotentialPct * 100).toFixed(0)}%
                    </span>
                    <div className="text-[10px] text-gray-400">
                      -{formatMXN(p.expectedPEAReductionMXN)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-gray-700">
                    {p.estimatedDays} días
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.signedByBusinessHead ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Firmado
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      {p.status}
                    </span>
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
