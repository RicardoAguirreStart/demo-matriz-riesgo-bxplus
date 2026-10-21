// src/components/CopilotView.tsx
"use client";

import React, { useState } from "react";
import { formatMXN, formatPct, getZoneBadgeClasses } from "@/lib/utils";
import { RoleType } from "@/types";
import { Sparkles, Sliders, Send, AlertTriangle, ShieldCheck, Activity, BrainCircuit } from "lucide-react";

interface CopilotViewProps {
  currentRole: RoleType;
}

export function CopilotView({ currentRole }: CopilotViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"SIMULATOR" | "CHAT">("SIMULATOR");

  // Stress Simulator State
  const [deltaGdp, setDeltaGdp] = useState(-4.5);
  const [tiie, setTiie] = useState(13.5);
  const [deltaFx, setDeltaFx] = useState(20.0);
  const [climateShock, setClimateShock] = useState(0.75);
  const [speiDowntime, setSpeiDowntime] = useState(4);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "copilot"; text: string }>>([
    {
      sender: "copilot",
      text: "¡Hola! Soy **B×+ Risk Copilot**, tu asistente cuantitativo y especialista en administración integral de riesgos de Banco Ve por Más. Estoy conectado a la base de datos viva del banco y capacitado en la CUB, NIF C-16, Basilea III, Circular 8/2019 de Banxico y la Taxonomía Sostenible de la SHCP. ¿Qué deseas consultar hoy?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Run Stress Simulation
  const handleRunStressSimulation = async () => {
    try {
      setSimulating(true);
      const res = await fetch("/api/copilot/stress-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deltaGdpPct: deltaGdp,
          tiieRatePct: tiie,
          deltaFxPct: deltaFx,
          climateShockScore: climateShock,
          speiDowntimeHours: speiDowntime,
          userRole: currentRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimResult(data);
      }
    } catch (e) {
      console.error("Error in stress test:", e);
    } finally {
      setSimulating(false);
    }
  };

  // Send Chat Message
  const handleSendMessage = async (msgToSend?: string) => {
    const text = msgToSend || inputMessage;
    if (!text.trim()) return;

    const newHistory = [...chatMessages, { sender: "user" as const, text }];
    setChatMessages(newHistory);
    setInputMessage("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          userRole: currentRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages([...newHistory, { sender: "copilot", text: data.answer }]);
      } else {
        setChatMessages([
          ...newHistory,
          { sender: "copilot", text: "Disculpa, ocurrió un error temporal al procesar tu solicitud." },
        ]);
      }
    } catch (e) {
      console.error("Error in chat:", e);
    } finally {
      setChatLoading(false);
    }
  };

  const samplePrompts = [
    "¿Qué impacto tiene el KRI de sequía en la migración a Etapa 2 de la NIF C-16?",
    "Explícame cómo se calcula el Indicador de Negocio (IN) para riesgo operacional bajo Anexo 1-D Bis",
    "¿Qué controles preventivos exige la Circular 8/2019 de Banxico para enlaces SPEI?",
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1F242B] to-[#2B333E] text-white rounded-bx p-5 shadow-card border-l-4 border-[#C0D725] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#C0D725] uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded font-bold">
              Google Gemini 2.5 Pro + RAG Grounding
            </span>
            <span className="text-xs text-gray-300">
              CUB Anexos 12-B / 12-D & Circular 8/2019 Banxico
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif mt-1 text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C0D725]" />
            <span>B×+ Risk Copilot & Simulador de Pruebas de Estrés</span>
          </h2>
          <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
            Pruebas de estrés macroeconómicas y climáticas en tiempo real, formulación de dictámenes ejecutivos para el CAIR y chat analítico conectado a la base de datos de Banco B×+.
          </p>
        </div>

        {/* Sub-Tabs Switch */}
        <div className="flex bg-[#171B20] p-1 rounded-lg border border-gray-700 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab("SIMULATOR")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === "SIMULATOR"
                ? "bg-[#C0D725] text-[#1F242B]"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Simulador de Estrés (What-If)</span>
          </button>
          <button
            onClick={() => setActiveSubTab("CHAT")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === "CHAT"
                ? "bg-[#C0D725] text-[#1F242B]"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Chat RAG Regulatorio</span>
          </button>
        </div>
      </div>

      {/* 1. SIMULADOR DE ESTRÉS (WHAT-IF) */}
      {activeSubTab === "SIMULATOR" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sliders Control Panel */}
          <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                Parámetros de Choque Macroeconómico & Climático
              </h3>
            </div>

            {/* Slider 1: GDP Shock */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Contracción PIB (&Delta;PIB):</span>
                <span className="font-mono font-bold text-rose-700">{deltaGdp}%</span>
              </div>
              <input
                type="range"
                min={-10}
                max={5}
                step={0.5}
                value={deltaGdp}
                onChange={(e) => setDeltaGdp(Number(e.target.value))}
                className="w-full accent-[#3299A8]"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>-10% (Severo)</span>
                <span>0%</span>
                <span>+5% (Expansión)</span>
              </div>
            </div>

            {/* Slider 2: TIIE Rate */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Tasa TIIE de Fondeo:</span>
                <span className="font-mono font-bold text-amber-700">{tiie}%</span>
              </div>
              <input
                type="range"
                min={7}
                max={20}
                step={0.25}
                value={tiie}
                onChange={(e) => setTiie(Number(e.target.value))}
                className="w-full accent-[#3299A8]"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>7.0%</span>
                <span>13.5% (Actual)</span>
                <span>20.0% (Pánico)</span>
              </div>
            </div>

            {/* Slider 3: FX Shock */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Depreciación MXN/USD (&Delta;TC):</span>
                <span className="font-mono font-bold text-indigo-700">+{deltaFx}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                step={1}
                value={deltaFx}
                onChange={(e) => setDeltaFx(Number(e.target.value))}
                className="w-full accent-[#3299A8]"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>0% (Estable)</span>
                <span>+20% (Moderado)</span>
                <span>+40% (Crisis)</span>
              </div>
            </div>

            {/* Slider 4: Climate Shock (Agro) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Choque Climático (Sequía Agro):</span>
                <span className="font-mono font-bold text-emerald-700">{(climateShock * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={climateShock}
                onChange={(e) => setClimateShock(Number(e.target.value))}
                className="w-full accent-[#3299A8]"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>0% (Normal)</span>
                <span>50% (D1/D2)</span>
                <span>100% (D3/D4 Catástrofe)</span>
              </div>
            </div>

            {/* Slider 5: SPEI Downtime */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Indisponibilidad Canal SPEI:</span>
                <span className="font-mono font-bold text-red-700">{speiDowntime} horas</span>
              </div>
              <input
                type="range"
                min={0}
                max={24}
                step={1}
                value={speiDowntime}
                onChange={(e) => setSpeiDowntime(Number(e.target.value))}
                className="w-full accent-[#3299A8]"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>0 hrs (Normal)</span>
                <span>4 hrs (Contingencia)</span>
                <span>24 hrs (R24 Caído)</span>
              </div>
            </div>

            <button
              onClick={handleRunStressSimulation}
              disabled={simulating}
              className="w-full bg-[#1F242B] hover:bg-[#2A313C] text-white py-2.5 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#C0D725]" />
              <span>{simulating ? "Ejecutando Simulación..." : "Ejecutar Simulación con Gemini"}</span>
            </button>
          </div>

          {/* Simulation Output Dashboard */}
          <div className="lg:col-span-2 space-y-4">
            {simResult ? (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-bx border shadow-sm">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      ICAP Estresado (Solvencia)
                    </span>
                    <div className="text-2xl font-bold font-serif mt-1 text-[#1F242B]">
                      {formatPct(simResult.metrics.stressedICAP)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getZoneBadgeClasses(simResult.metrics.icapZone)}`}>
                        {simResult.metrics.icapZone}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Base: {formatPct(simResult.metrics.baseICAP)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-bx border shadow-sm">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      Nuevas Reservas PCE NIF C-16
                    </span>
                    <div className="text-2xl font-bold font-serif mt-1 text-rose-700">
                      {formatMXN(simResult.metrics.stressedTotalPCE)}
                    </div>
                    <span className="text-[10px] text-gray-500">
                      Incremento de +{formatMXN(simResult.metrics.additionalReserveMXN)} (+{simResult.metrics.pceIncreasePct}%)
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-bx border shadow-sm">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      Límite Regulatorio CUB
                    </span>
                    <div className="text-2xl font-bold font-serif mt-1 text-gray-800">
                      10.50%
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {simResult.metrics.stressedICAP >= 10.5
                        ? "✓ Cumple Suplemento Conservación"
                        : "⚠️ ALERTA: Rompe Límite Mínimo"}
                    </span>
                  </div>
                </div>

                {/* AI Executive Assessment for CAIR */}
                <div className="bg-white rounded-bx p-5 shadow-card border border-emerald-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-gray-900 text-sm font-serif">
                      Dictamen Oficial B×+ Risk Copilot para el CAIR (Anexos 12-B / 12-D)
                    </h3>
                  </div>
                  <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-[#F8FAF8] p-4 rounded border border-emerald-100">
                    {simResult.aiNarrative}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-bx p-12 shadow-card border border-gray-200 text-center flex flex-col items-center justify-center space-y-3">
                <Sliders className="w-10 h-10 text-gray-300" />
                <h3 className="text-sm font-bold text-gray-700">
                  Ajusta los sliders macroeconómicos y presiona "Ejecutar Simulación con Gemini"
                </h3>
                <p className="text-xs text-gray-500 max-w-md">
                  El motor calculará el impacto no lineal sobre la PI estresada, el aumento de provisiones NIF C-16 y la compresión del ICAP regulatorio.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. CHAT RAG CONTEXTUALIZADO */}
      {activeSubTab === "CHAT" && (
        <div className="bg-white rounded-bx shadow-card border border-gray-200 flex flex-col h-[600px] overflow-hidden">
          {/* Chat Messages Log */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-[#FAFBFD]">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-2xl ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.sender === "user"
                      ? "bg-[#1F242B] text-white"
                      : "bg-[#C0D725] text-[#1F242B]"
                  }`}
                >
                  {msg.sender === "user" ? "Tú" : "IA"}
                </div>
                <div
                  className={`p-3 rounded-lg text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#1F242B] text-white rounded-tr-none shadow-sm"
                      : "bg-white text-gray-800 rounded-tl-none border border-gray-200 shadow-sm"
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-2.5 max-w-md">
                <div className="w-7 h-7 rounded-full bg-[#C0D725] text-[#1F242B] flex items-center justify-center text-xs font-bold animate-pulse">
                  IA
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>B×+ Risk Copilot razonando sobre la CUB y balances...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2 bg-gray-50 border-t border-gray-200 flex gap-2 overflow-x-auto text-[11px]">
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p)}
                className="whitespace-nowrap bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-2.5 py-1 rounded font-medium transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Pregunta a B×+ Risk Copilot sobre límites RAF, NIF C-16, SPEI o auditorías..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 p-2 border border-gray-300 rounded text-xs outline-none focus:border-[#3299A8]"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={chatLoading}
              className="bg-[#1F242B] hover:bg-[#2A313C] text-white p-2 rounded text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
