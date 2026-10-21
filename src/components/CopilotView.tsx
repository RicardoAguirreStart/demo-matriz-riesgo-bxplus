// src/components/CopilotView.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { formatMXN, formatPct, getZoneBadgeClasses } from "@/lib/utils";
import { RoleType } from "@/types";
import { CustomSelect, CustomSelectOption } from "@/components/ui/CustomSelect";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import {
  Sparkles,
  Sliders,
  Send,
  AlertTriangle,
  ShieldCheck,
  Activity,
  BrainCircuit,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Search,
  FileCheck,
  Flame,
  RefreshCw,
  Plus,
  Layers,
  Workflow,
  Building2,
  Zap,
  TrendingUp,
} from "lucide-react";

interface CopilotViewProps {
  currentRole: RoleType;
}

export function CopilotView({ currentRole }: CopilotViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"SIMULATOR" | "CHAT">("SIMULATOR");

  // Proceso y Procesos Disponibles
  const [processes, setProcesses] = useState<any[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("ALL");

  // Parámetros de Estrés
  const [deltaGdp, setDeltaGdp] = useState(-4.5);
  const [tiie, setTiie] = useState(13.5);
  const [deltaFx, setDeltaFx] = useState(20.0);
  const [climateShock, setClimateShock] = useState(0.75);
  const [speiDowntime, setSpeiDowntime] = useState(4);
  const [controlDegradation, setControlDegradation] = useState(30);

  // Estado de Ejecución
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Filtros de la Tabla de Trazabilidad
  const [tableSearch, setTableSearch] = useState("");
  const [tableFilterZone, setTableFilterZone] = useState<"ALL" | "CRITICAL" | "RED">("ALL");
  const [highlightedRiskCode, setHighlightedRiskCode] = useState<string | null>(null);

  // Creación de Planes de Contingencia In-Situ
  const [creatingPlanRiskId, setCreatingPlanRiskId] = useState<string | null>(null);
  const [createdPlans, setCreatedPlans] = useState<Record<string, { code: string; sha256: string }>>({});
  const [toastMessage, setToastMessage] = useState<{ title: string; description: string; type?: "success" | "info" } | null>(null);

  // Chat RAG State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "copilot"; text: string }>>([
    {
      sender: "copilot",
      text: "¡Hola! Soy **B×+ Risk Copilot**, tu asistente cuantitativo y especialista en administración integral de riesgos de Banco Ve por Más. Estoy conectado a la base de datos viva del banco y capacitado en la CUB, NIF C-16, Basilea III, Circular 8/2019 de Banxico y la Taxonomía Sostenible de la SHCP. ¿Qué deseas consultar hoy?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-ajuste de altura del campo de escritura del chat
  useEffect(() => {
    if (chatTextareaRef.current) {
      chatTextareaRef.current.style.height = "auto";
      chatTextareaRef.current.style.height = `${Math.min(chatTextareaRef.current.scrollHeight, 130)}px`;
    }
  }, [inputMessage]);

  // Auto-scroll al final del chat
  useEffect(() => {
    if (activeSubTab === "CHAT") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading, activeSubTab]);

  // 1. Cargar lista de procesos
  useEffect(() => {
    async function loadProcesses() {
      try {
        const res = await fetch("/api/processes");
        const data = await res.json();
        if (data.success && data.processes) {
          setProcesses(data.processes);
        }
      } catch (e) {
        console.error("Error loading processes:", e);
      }
    }
    loadProcesses();
  }, []);

  // 2. Ejecutar Simulación de Estrés
  const handleRunStressSimulation = useCallback(
    async (overrideParams?: {
      procId?: string;
      gdp?: number;
      t?: number;
      fx?: number;
      climate?: number;
      spei?: number;
      ctrlDeg?: number;
    }) => {
      try {
        setSimulating(true);
        const pId = overrideParams?.procId !== undefined ? overrideParams.procId : selectedProcessId;
        const g = overrideParams?.gdp !== undefined ? overrideParams.gdp : deltaGdp;
        const ti = overrideParams?.t !== undefined ? overrideParams.t : tiie;
        const f = overrideParams?.fx !== undefined ? overrideParams.fx : deltaFx;
        const c = overrideParams?.climate !== undefined ? overrideParams.climate : climateShock;
        const s = overrideParams?.spei !== undefined ? overrideParams.spei : speiDowntime;
        const cd = overrideParams?.ctrlDeg !== undefined ? overrideParams.ctrlDeg : controlDegradation;

        const res = await fetch("/api/copilot/stress-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            processId: pId,
            deltaGdpPct: g,
            tiieRatePct: ti,
            deltaFxPct: f,
            climateShockScore: c,
            speiDowntimeHours: s,
            controlDegradationPct: cd,
            userRole: currentRole,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setSimResult(data);
        }
      } catch (e) {
        console.error("Error running stress test:", e);
      } finally {
        setSimulating(false);
      }
    },
    [selectedProcessId, deltaGdp, tiie, deltaFx, climateShock, speiDowntime, controlDegradation, currentRole]
  );

  // 3. Ejecutar simulación inicial automática para que la vista nunca aparezca vacía
  useEffect(() => {
    handleRunStressSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 4. Presets de 1 Clic
  const handleApplyPreset = (presetKey: "AGRO" | "TECH" | "RECESSION" | "CONTROLS") => {
    if (presetKey === "AGRO") {
      const agroProc = processes.find((p) => p.code === "PR-AGRO-01");
      const targetId = agroProc ? agroProc.id : "ALL";
      setSelectedProcessId(targetId);
      setDeltaGdp(-5.0);
      setTiie(14.5);
      setDeltaFx(15.0);
      setClimateShock(0.9);
      setSpeiDowntime(2);
      setControlDegradation(25);
      handleRunStressSimulation({
        procId: targetId,
        gdp: -5.0,
        t: 14.5,
        fx: 15.0,
        climate: 0.9,
        spei: 2,
        ctrlDeg: 25,
      });
    } else if (presetKey === "TECH") {
      const tiProc = processes.find((p) => p.code === "PR-TI-01" || p.code === "PR-TES-01");
      const targetId = tiProc ? tiProc.id : "ALL";
      setSelectedProcessId(targetId);
      setDeltaGdp(-2.5);
      setTiie(12.0);
      setDeltaFx(10.0);
      setClimateShock(0.2);
      setSpeiDowntime(8);
      setControlDegradation(70);
      handleRunStressSimulation({
        procId: targetId,
        gdp: -2.5,
        t: 12.0,
        fx: 10.0,
        climate: 0.2,
        spei: 8,
        ctrlDeg: 70,
      });
    } else if (presetKey === "RECESSION") {
      setSelectedProcessId("ALL");
      setDeltaGdp(-6.0);
      setTiie(16.0);
      setDeltaFx(30.0);
      setClimateShock(0.5);
      setSpeiDowntime(4);
      setControlDegradation(40);
      handleRunStressSimulation({
        procId: "ALL",
        gdp: -6.0,
        t: 16.0,
        fx: 30.0,
        climate: 0.5,
        spei: 4,
        ctrlDeg: 40,
      });
    } else if (presetKey === "CONTROLS") {
      setSelectedProcessId("ALL");
      setDeltaGdp(-3.0);
      setTiie(13.5);
      setDeltaFx(20.0);
      setClimateShock(0.6);
      setSpeiDowntime(6);
      setControlDegradation(80);
      handleRunStressSimulation({
        procId: "ALL",
        gdp: -3.0,
        t: 13.5,
        fx: 20.0,
        climate: 0.6,
        spei: 6,
        ctrlDeg: 80,
      });
    }
  };

  // 5. Crear Plan de Contingencia con 1 Clic
  const handleCreateContingencyPlan = async (risk: any) => {
    try {
      setCreatingPlanRiskId(risk.id);
      const res = await fetch("/api/action-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Plan de Contingencia: Mitigación de Estrés para ${risk.code}`,
          description: `Plan de contingencia y mitigación preventiva activado desde el Simulador de Pruebas de Estrés ante choque severo sobre nodo "${risk.processNodeLabel}".`,
          planTypes: ["PROCESSES", "TECHNOLOGY"],
          riskEventId: risk.id,
          improvementPotentialPct: 0.7,
          estimatedCostMXN: 150000,
          costScale: "LOW",
          estimatedDays: 30,
          timeScale: "LOW",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          userRole: currentRole,
        }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setCreatedPlans((prev) => ({
          ...prev,
          [risk.id]: {
            code: data.plan.code,
            sha256: `SHA256-${data.plan.id.slice(-8).toUpperCase()}`,
          },
        }));
        setToastMessage({
          title: `Plan ${data.plan.code} Creado Exitosamente`,
          description: `Plan de Contingencia asignado a "${risk.code}". Registrado con sello criptográfico para auditoría CNBV CUB Art. 88.`,
          type: "success",
        });
        setTimeout(() => setToastMessage(null), 6000);
      }
    } catch (err) {
      console.error("Error creating contingency plan:", err);
    } finally {
      setCreatingPlanRiskId(null);
    }
  };

  // 6. Chat con Risk Copilot
  const handleSendMessage = async (msgToSend?: string) => {
    const text = msgToSend || inputMessage;
    if (!text.trim()) return;

    const newHistory = [...chatMessages, { sender: "user" as const, text }];
    setChatMessages(newHistory);
    setInputMessage("");
    if (chatTextareaRef.current) {
      chatTextareaRef.current.style.height = "auto";
    }
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

  // Opciones de procesos para el CustomSelect
  const processOptions: CustomSelectOption[] = useMemo(() => {
    const opts: CustomSelectOption[] = [
      {
        value: "ALL",
        label: "Todos los Procesos (Portafolio Consolidado B×+)",
        badge: "Consolidado",
        description: "Evaluación integral sobre todos los procesos bancarios y matrices 5×5",
      },
    ];
    processes.forEach((p) => {
      opts.push({
        value: p.id,
        label: `${p.code}: ${p.name}`,
        badge: `${p._count?.riskEvents || 0} riesgos`,
        description: p.macroProcess?.name || "Macroproceso B×+",
      });
    });
    return opts;
  }, [processes]);

  // Filtrado de riesgos en tabla
  const filteredRisks = useMemo(() => {
    if (!simResult?.stressedRisks) return [];
    return simResult.stressedRisks.filter((r: any) => {
      const matchesSearch =
        tableSearch === "" ||
        r.code.toLowerCase().includes(tableSearch.toLowerCase()) ||
        r.title.toLowerCase().includes(tableSearch.toLowerCase()) ||
        r.processNodeLabel.toLowerCase().includes(tableSearch.toLowerCase()) ||
        r.processCode.toLowerCase().includes(tableSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (tableFilterZone === "RED") {
        return r.stressedResidualZone === "RED";
      }
      if (tableFilterZone === "CRITICAL") {
        return r.stressedResidualZone === "RED" || r.stressedResidualZone === "ORANGE" || r.migratedToCritical;
      }
      return true;
    });
  }, [simResult, tableSearch, tableFilterZone]);

  // Dimensiones de la Matriz 5x5
  const probLevels = [
    { level: 5, label: "5. Frecuente" },
    { level: 4, label: "4. Probable" },
    { level: 3, label: "3. Posible" },
    { level: 2, label: "2. Poco Prob." },
    { level: 1, label: "1. Remota" },
  ];
  const impLevels = [
    { level: 1, label: "1. Insignif." },
    { level: 2, label: "2. Menor" },
    { level: 3, label: "3. Moderado" },
    { level: 4, label: "4. Mayor" },
    { level: 5, label: "5. Catastróf." },
  ];

  const getCellClasses = (score: number) => {
    if (score <= 4) return "bg-emerald-100/70 border-emerald-300 text-emerald-950";
    if (score <= 9) return "bg-amber-100/70 border-amber-300 text-amber-950";
    if (score <= 15) return "bg-orange-100/70 border-orange-300 text-orange-950";
    return "bg-rose-100/70 border-rose-300 text-rose-950";
  };

  return (
    <div className="space-y-6">
      {/* Toast de Confirmación de Plan de Contingencia */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1F242B] text-white p-4 rounded-lg shadow-2xl border-l-4 border-[#C0D725] max-w-md animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#C0D725] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-white">{toastMessage.title}</div>
              <div className="text-[11px] text-gray-300 leading-relaxed">{toastMessage.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner de Cabecera */}
      <div className="bg-gradient-to-r from-[#1F242B] to-[#2B333E] text-white rounded-bx p-5 shadow-card border-l-4 border-[#C0D725] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#C0D725] uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded font-bold">
              Simulador por Procesos & Nodos • CUB Art. 65, 88 & Anexo 12-B / 12-D
            </span>
            <span className="text-xs text-gray-300">Google Gemini 2.5 Flash</span>
          </div>
          <h2 className="text-xl font-bold font-serif mt-1 text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C0D725]" />
            <span>Simulador de Pruebas de Estrés por Proceso, Nodo y Riesgo</span>
          </h2>
          <p className="text-xs text-gray-300 mt-1 max-w-3xl leading-relaxed">
            Modela el impacto de choques macroeconómicos, climáticos, interrupciones SPEI y fallas de control interno sobre los procesos bancarios de Banco Ve por Más (B×+), contrastando la Matriz 5×5 Actual vs. Estresada y activando Planes de Contingencia.
          </p>
        </div>

        {/* Sub-Tabs Switch */}
        <div className="flex bg-[#171B20] p-1 rounded-lg border border-gray-700 self-start md:self-auto shrink-0">
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

      {/* 1. SECCIÓN PRINCIPAL: SIMULADOR DE ESTRÉS POR PROCESO */}
      {activeSubTab === "SIMULATOR" && (
        <div className="space-y-6">
          {/* BARRA SUPERIOR: SELECTOR DE ALCANCE + PRESETS DE 1-CLIC */}
          <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="w-full lg:w-96 space-y-1">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-[#3299A8]" />
                  <span>1. Seleccionar Proceso Bancario a Estresar:</span>
                </label>
                <CustomSelect
                  value={selectedProcessId}
                  onChange={(val) => {
                    setSelectedProcessId(val);
                    handleRunStressSimulation({ procId: val });
                  }}
                  options={processOptions}
                  theme="light"
                  placeholder="Selecciona un proceso..."
                  className="w-full"
                  dropdownClassName="w-full md:w-[420px]"
                />
              </div>

              {/* Botones de Presets de 1 Clic */}
              <div className="flex-1 space-y-1">
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Escenarios Preconfigurados de Estrés (1 Clic):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("AGRO")}
                    className="p-2 rounded border text-left transition-all hover:border-[#3299A8] hover:shadow-xs bg-emerald-50/50 border-emerald-200 cursor-pointer"
                  >
                    <div className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                      <span>🌾 Sequía + TIIE Agro</span>
                    </div>
                    <div className="text-[9px] text-emerald-800 line-clamp-1">
                      Sequía 90%, TIIE 14.5%, PR-AGRO-01
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset("TECH")}
                    className="p-2 rounded border text-left transition-all hover:border-[#3299A8] hover:shadow-xs bg-purple-50/50 border-purple-200 cursor-pointer"
                  >
                    <div className="text-[11px] font-bold text-purple-950 flex items-center gap-1">
                      <span>🛡️ Ciberataque + SPEI 8h</span>
                    </div>
                    <div className="text-[9px] text-purple-800 line-clamp-1">
                      Caída SPEI 8 hrs + Falla Controles 70%
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset("RECESSION")}
                    className="p-2 rounded border text-left transition-all hover:border-[#3299A8] hover:shadow-xs bg-rose-50/50 border-rose-200 cursor-pointer"
                  >
                    <div className="text-[11px] font-bold text-rose-950 flex items-center gap-1">
                      <span>📉 Recesión Severa -6%</span>
                    </div>
                    <div className="text-[9px] text-rose-800 line-clamp-1">
                      PIB -6%, FX +30%, TIIE 16%, Todo el banco
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset("CONTROLS")}
                    className="p-2 rounded border text-left transition-all hover:border-[#3299A8] hover:shadow-xs bg-amber-50/50 border-amber-200 cursor-pointer"
                  >
                    <div className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                      <span>⚠️ Colapso Controles (NF)</span>
                    </div>
                    <div className="text-[9px] text-amber-800 line-clamp-1">
                      Degradación 80% hacia Inmanente
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* GRID: PALANCAS DE CONTROL (IZQUIERDA) Y RESULTADOS MULTI-CAPA (DERECHA) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* PANEL IZQUIERDO: PALANCAS DE ESTRÉS (4 COLS) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#3299A8]" />
                    <span>Palancas de Estrés del Escenario</span>
                  </h3>
                  <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    Anexo 12-B CUB
                  </span>
                </div>

                {/* BLOQUE A: CHOQUES DE ENTORNO */}
                <div className="space-y-3.5">
                  <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                    A. Variables Macroeconómicas y de Entorno
                  </div>

                  {/* 1. PIB */}
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
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                      <span>-10% (Severo)</span>
                      <span>0%</span>
                      <span>+5%</span>
                    </div>
                  </div>

                  {/* 2. TIIE */}
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
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                      <span>7.0%</span>
                      <span>13.5% (Actual)</span>
                      <span>20.0%</span>
                    </div>
                  </div>

                  {/* 3. FX */}
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
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                      <span>0% (Estable)</span>
                      <span>+20%</span>
                      <span>+40% (Crisis)</span>
                    </div>
                  </div>

                  {/* 4. Sequía Clima */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-700">Severidad Sequía CONAGUA (ASG):</span>
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
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                      <span>0% (Normal)</span>
                      <span>50% (D1/D2)</span>
                      <span>100% (D4 Catástrofe)</span>
                    </div>
                  </div>

                  {/* 5. SPEI */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-700">Indisponibilidad Enlace SPEI:</span>
                      <span className="font-mono font-bold text-purple-700">{speiDowntime} horas</span>
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
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                      <span>0 hrs</span>
                      <span>4 hrs</span>
                      <span>24 hrs (Caída Total)</span>
                    </div>
                  </div>
                </div>

                {/* BLOQUE B: CHOQUE DE CONTROL INTERNO DEL PROCESO (NUEVO) */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="text-[10px] font-mono font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>B. Choque de Control Interno del Proceso</span>
                  </div>

                  <div className="space-y-1 bg-orange-50/50 p-2.5 rounded border border-orange-200">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-orange-950">Falla de Controles (Hacia NF):</span>
                      <span className="font-mono font-bold text-orange-700">{controlDegradation}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={controlDegradation}
                      onChange={(e) => setControlDegradation(Number(e.target.value))}
                      className="w-full accent-orange-600"
                    />
                    <div className="flex justify-between text-[9px] text-orange-700 font-mono">
                      <span>0% (Control Efectivo)</span>
                      <span>50% (Parcial NF)</span>
                      <span>100% (Colapso Total)</span>
                    </div>
                    <p className="text-[10px] text-orange-800 leading-tight pt-1">
                      Simula la degradación de controles de los nodos hacia No Formalizados (NF) bajo auditoría CNBV, devolviendo el riesgo residual hacia su riesgo inherente.
                    </p>
                  </div>
                </div>

                {/* BOTÓN EJECUTAR */}
                <button
                  type="button"
                  onClick={() => handleRunStressSimulation()}
                  disabled={simulating}
                  className="w-full bg-[#1F242B] hover:bg-[#2A313C] text-white py-2.5 rounded-md font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {simulating ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-[#C0D725] animate-spin" />
                      <span>Simulando con Gemini IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#C0D725]" />
                      <span>Ejecutar Simulación de Estrés</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* PANEL DERECHO: RESULTADOS EN 4 CAPAS VISUALES (8 COLS) */}
            <div className="lg:col-span-8 space-y-6">
              {simResult ? (
                <>
                  {/* CAPA 1: KPIS DE IMPACTO EJECUTIVO Y MARCO RAF */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Card 1: ICAP Estresado */}
                    <div className="bg-white p-3.5 rounded-bx border border-gray-200 shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        ICAP Estresado (Solvencia)
                      </span>
                      <div className="text-xl sm:text-2xl font-bold font-serif text-[#1F242B]">
                        {formatPct(simResult.metrics.stressedICAP)}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono font-bold ${getZoneBadgeClasses(simResult.metrics.icapZone)}`}>
                          {simResult.metrics.icapZone}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          Base: {formatPct(simResult.metrics.baseICAP)}
                        </span>
                      </div>
                    </div>

                    {/* Card 2: PEA del Proceso */}
                    <div className="bg-white p-3.5 rounded-bx border border-gray-200 shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        PEA Proceso (&Delta;PEA)
                      </span>
                      <div className="text-xl sm:text-2xl font-bold font-serif text-rose-700 truncate">
                        {formatMXN(simResult.metrics.totalStressedPEA)}
                      </div>
                      <div className="text-[10px] text-rose-700 font-semibold truncate">
                        +{formatMXN(simResult.metrics.totalDeltaPEA)} (+{simResult.metrics.peaIncreasePct}%)
                      </div>
                    </div>

                    {/* Card 3: PMA Catastrófica */}
                    <div className="bg-white p-3.5 rounded-bx border border-gray-200 shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        PMA Catastrófica (VaR)
                      </span>
                      <div className="text-xl sm:text-2xl font-bold font-serif text-amber-700 truncate">
                        {formatMXN(simResult.metrics.totalStressedPMA)}
                      </div>
                      <div className="text-[10px] text-amber-800 font-mono truncate">
                        Base: {formatMXN(simResult.metrics.totalBasePMA)}
                      </div>
                    </div>

                    {/* Card 4: Riesgos en Zona Roja */}
                    <div className="bg-white p-3.5 rounded-bx border border-gray-200 shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Riesgos en Zona Roja
                      </span>
                      <div className="text-xl sm:text-2xl font-bold font-serif text-rose-600 flex items-center gap-1.5">
                        <span>{simResult.metrics.totalStressedRed}</span>
                        <span className="text-xs font-normal text-gray-400 font-sans">
                          (de {simResult.metrics.totalBaseRed})
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold text-rose-700">
                        {simResult.metrics.totalMigratedToCritical} rompieron tolerancia RAF
                      </div>
                    </div>
                  </div>

                  {/* CAPA 2: COMPARATIVA LADO A LADO DE LA MATRIZ 5×5 (ACTUAL VS. ESTRESADA) */}
                  <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-100 gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#3299A8]" />
                          <span>Comparativa Lado a Lado: Matriz 5×5 Actual (Pre-Estrés) vs. Estresada (Post-Choque)</span>
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Observa cómo los riesgos del proceso se desplazan hacia cuadrantes Naranja/Rojo tras el impacto macroeconómico y la falla de controles.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold self-start sm:self-auto">
                        {simResult.stressedRisks?.length || 0} riesgos evaluados
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* MATRIZ A: ACTUAL (PRE-ESTRÉS) */}
                      <div className="space-y-1.5 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            <span>1. Matriz Actual (Pre-Estrés)</span>
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">Línea Base</span>
                        </div>

                        <div className="space-y-1">
                          {probLevels.map((prob) => (
                            <div key={prob.level} className="grid grid-cols-5 gap-1">
                              {impLevels.map((imp) => {
                                const score = prob.level * imp.level;
                                const cellRisks = simResult.stressedRisks.filter(
                                  (r: any) =>
                                    Math.round(r.baseResidualProb) === prob.level &&
                                    Math.round(r.baseResidualImp) === imp.level
                                );
                                return (
                                  <div
                                    key={imp.level}
                                    className={`min-h-[58px] p-1 rounded border flex flex-col justify-between transition-all ${getCellClasses(
                                      score
                                    )}`}
                                  >
                                    <div className="text-[9px] font-bold opacity-75 font-mono">{score}</div>
                                    <div className="space-y-0.5 overflow-hidden">
                                      {cellRisks.slice(0, 2).map((r: any) => (
                                        <button
                                          key={r.id}
                                          type="button"
                                          onClick={() => setHighlightedRiskCode(r.code === highlightedRiskCode ? null : r.code)}
                                          className={`block w-full text-left truncate text-[8px] font-mono px-1 py-0.2 rounded font-bold border ${
                                            highlightedRiskCode === r.code
                                              ? "bg-[#1F242B] text-white border-black ring-1 ring-[#C0D725]"
                                              : "bg-white/95 text-gray-900 border-black/15 shadow-2xs"
                                          }`}
                                          title={`${r.code}: ${r.title} • Nodo: ${r.processNodeLabel}`}
                                        >
                                          {r.code}
                                        </button>
                                      ))}
                                      {cellRisks.length > 2 && (
                                        <div className="text-[8px] font-bold text-center text-gray-700 bg-white/70 rounded">
                                          +{cellRisks.length - 2}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* MATRIZ B: ESTRESADA (POST-CHOQUE) */}
                      <div className="space-y-1.5 p-3 rounded-lg border border-rose-200 bg-rose-50/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-600 inline-block animate-pulse" />
                            <span>2. Matriz Estresada (Post-Choque)</span>
                          </span>
                          <span className="text-[10px] font-mono text-rose-800 font-bold bg-rose-100 px-1.5 rounded">
                            {simResult.metrics.totalStressedRed} en Rojo
                          </span>
                        </div>

                        <div className="space-y-1">
                          {probLevels.map((prob) => (
                            <div key={prob.level} className="grid grid-cols-5 gap-1">
                              {impLevels.map((imp) => {
                                const score = prob.level * imp.level;
                                const cellRisks = simResult.stressedRisks.filter(
                                  (r: any) =>
                                    Math.round(r.stressedResidualProb) === prob.level &&
                                    Math.round(r.stressedResidualImp) === imp.level
                                );
                                return (
                                  <div
                                    key={imp.level}
                                    className={`min-h-[58px] p-1 rounded border flex flex-col justify-between transition-all ${getCellClasses(
                                      score
                                    )}`}
                                  >
                                    <div className="text-[9px] font-bold opacity-75 font-mono">{score}</div>
                                    <div className="space-y-0.5 overflow-hidden">
                                      {cellRisks.slice(0, 2).map((r: any) => (
                                        <button
                                          key={r.id}
                                          type="button"
                                          onClick={() => setHighlightedRiskCode(r.code === highlightedRiskCode ? null : r.code)}
                                          className={`block w-full text-left truncate text-[8px] font-mono px-1 py-0.2 rounded font-bold border transition-all ${
                                            highlightedRiskCode === r.code
                                              ? "bg-[#1F242B] text-white border-black ring-1 ring-[#C0D725]"
                                              : r.migratedToCritical
                                              ? "bg-rose-600 text-white border-rose-800 shadow-2xs animate-pulse"
                                              : "bg-white/95 text-gray-900 border-black/15 shadow-2xs"
                                          }`}
                                          title={`${r.code}: ${r.title} • Nodo: ${r.processNodeLabel} • P×I Estresado: ${r.stressedResidualProb}×${r.stressedResidualImp}`}
                                        >
                                          {r.code} {r.migratedToCritical ? "↑" : ""}
                                        </button>
                                      ))}
                                      {cellRisks.length > 2 && (
                                        <div className="text-[8px] font-bold text-center text-gray-700 bg-white/70 rounded">
                                          +{cellRisks.length - 2}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CAPA 3: TABLA DE TRAZABILIDAD POR PROCESO, NODO DEL DIAGRAMA Y RIESGO */}
                  <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                      <div>
                        <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#3299A8]" />
                          <span>Trazabilidad de Riesgos por Nodo del Diagrama (Actual &rarr; Estresado)</span>
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Identifica los nodos operativos donde se genera la pérdida y activa Planes de Contingencia inmediatos.
                        </p>
                      </div>

                      {/* Filtros de la Tabla */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Buscar código, título o nodo..."
                            value={tableSearch}
                            onChange={(e) => setTableSearch(e.target.value)}
                            className="text-xs pl-8 pr-2.5 py-1 border border-gray-300 rounded bg-white outline-none focus:border-[#3299A8] w-48 sm:w-56"
                          />
                        </div>

                        <div className="flex rounded border border-gray-200 bg-gray-50 p-0.5 text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setTableFilterZone("ALL")}
                            className={`px-2 py-0.5 rounded transition-all ${
                              tableFilterZone === "ALL" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-900"
                            }`}
                          >
                            Todos ({simResult.stressedRisks?.length || 0})
                          </button>
                          <button
                            type="button"
                            onClick={() => setTableFilterZone("CRITICAL")}
                            className={`px-2 py-0.5 rounded transition-all ${
                              tableFilterZone === "CRITICAL" ? "bg-orange-600 text-white shadow-2xs" : "text-gray-500 hover:text-orange-700"
                            }`}
                          >
                            Críticos ({simResult.metrics.totalMigratedToCritical})
                          </button>
                          <button
                            type="button"
                            onClick={() => setTableFilterZone("RED")}
                            className={`px-2 py-0.5 rounded transition-all ${
                              tableFilterZone === "RED" ? "bg-rose-600 text-white shadow-2xs" : "text-gray-500 hover:text-rose-700"
                            }`}
                          >
                            En Rojo ({simResult.metrics.totalStressedRed})
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tabla de Resultados */}
                    <div className="overflow-x-auto max-h-[460px] overflow-y-auto border border-gray-100 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#1F242B] text-white uppercase text-[10px] font-mono tracking-wider sticky top-0 z-10">
                          <tr>
                            <th className="py-2.5 px-3">Código & Riesgo</th>
                            <th className="py-2.5 px-3">Proceso & Nodo del Diagrama</th>
                            <th className="py-2.5 px-3">Matriz 5×5 (Pre &rarr; Post)</th>
                            <th className="py-2.5 px-3 text-right">Pérdida PEA (&Delta;PEA)</th>
                            <th className="py-2.5 px-3 text-center">Acción de Contingencia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredRisks.map((r: any) => {
                            const planCreated = createdPlans[r.id];
                            const isHighlighted = highlightedRiskCode === r.code;

                            return (
                              <tr
                                key={r.id}
                                className={`transition-colors hover:bg-gray-50/80 ${
                                  isHighlighted
                                    ? "bg-amber-50/90 ring-1 ring-amber-400"
                                    : r.migratedToCritical
                                    ? "bg-rose-50/30"
                                    : ""
                                }`}
                              >
                                {/* 1. Código & Riesgo */}
                                <td className="py-2.5 px-3 align-top min-w-[200px]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-gray-900 text-[11px]">{r.code}</span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                      {r.riskType}
                                    </span>
                                  </div>
                                  <div className="font-semibold text-gray-800 text-xs mt-0.5 line-clamp-2" title={r.title}>
                                    {r.title}
                                  </div>
                                </td>

                                {/* 2. Proceso & Nodo del Diagrama */}
                                <td className="py-2.5 px-3 align-top min-w-[190px]">
                                  <div className="flex items-center gap-1 font-mono text-[10px] text-gray-500 font-bold">
                                    <Building2 className="w-3 h-3 text-[#3299A8]" />
                                    <span>{r.processCode}</span>
                                  </div>
                                  <div className="text-gray-800 font-medium text-xs mt-0.5 flex items-center gap-1">
                                    <Workflow className="w-3 h-3 text-indigo-600 shrink-0" />
                                    <span className="line-clamp-2" title={r.processNodeLabel}>
                                      {r.processNodeLabel}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-400 truncate mt-0.5">
                                    Rol: {r.responsibleRole}
                                  </div>
                                </td>

                                {/* 3. Matriz 5×5 (Pre -> Post) */}
                                <td className="py-2.5 px-3 align-top min-w-[220px]">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {/* Pre-Estrés */}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-semibold ${getZoneBadgeClasses(r.baseResidualZone)}`}>
                                      {r.baseResidualProb}×{r.baseResidualImp} ({r.baseResidualScore}p)
                                    </span>

                                    <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />

                                    {/* Post-Estrés */}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-bold ${getZoneBadgeClasses(r.stressedResidualZone)}`}>
                                      {r.stressedResidualProb}×{r.stressedResidualImp} ({r.stressedResidualScore}p)
                                    </span>
                                  </div>

                                  {r.migratedToCritical && (
                                    <div className="mt-1 text-[9px] font-bold text-rose-700 bg-rose-100/90 px-1.5 py-0.2 rounded border border-rose-300 inline-flex items-center gap-1">
                                      <span>⚠️ Ruptura Límite RAF (Tolerancia)</span>
                                    </div>
                                  )}
                                </td>

                                {/* 4. Pérdida PEA (&Delta;PEA) */}
                                <td className="py-2.5 px-3 align-top text-right min-w-[150px]">
                                  <div className="font-mono font-bold text-gray-900 text-xs">
                                    {formatMXN(r.stressedPEA)}
                                  </div>
                                  <div className="text-[10px] font-mono text-rose-700 font-semibold mt-0.5">
                                    +{formatMXN(r.deltaPEA)}
                                  </div>
                                  <div className="text-[9px] font-mono text-gray-400">
                                    Base: {formatMXN(r.basePEA)}
                                  </div>
                                </td>

                                {/* 5. Acción de Contingencia */}
                                <td className="py-2.5 px-3 align-top text-center min-w-[160px]">
                                  {planCreated ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] border border-emerald-300">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>{planCreated.code}</span>
                                      </span>
                                      <div className="text-[9px] font-mono text-gray-500 font-semibold">
                                        {planCreated.sha256}
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={creatingPlanRiskId === r.id}
                                      onClick={() => handleCreateContingencyPlan(r)}
                                      className={`px-2.5 py-1 rounded text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                                        r.stressedResidualZone === "RED"
                                          ? "bg-rose-600 hover:bg-rose-700 text-white"
                                          : r.stressedResidualZone === "ORANGE"
                                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                                          : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-300"
                                      }`}
                                    >
                                      {creatingPlanRiskId === r.id ? (
                                        <>
                                          <RefreshCw className="w-3 h-3 animate-spin" />
                                          <span>Creando...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-3 h-3" />
                                          <span>Plan Contingencia</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* CAPA 4: DICTAMEN EJECUTIVO DE GEMINI PARA EL CAIR */}
                  <div className="bg-white rounded-bx p-5 shadow-card border border-emerald-300 space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-emerald-100">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-bold text-gray-900 text-sm font-serif">
                          Dictamen Oficial B×+ Risk Copilot para el CAIR (CUB Anexos 12-B / 12-D & NIF C-16)
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">
                        Resolución Automatizada IA
                      </span>
                    </div>
                    <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-line bg-[#F8FAF8] p-4 rounded-lg border border-emerald-100 font-sans space-y-2">
                      {simResult.aiNarrative}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-bx p-12 shadow-card border border-gray-200 text-center flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-gray-300 animate-spin" />
                  <h3 className="text-sm font-bold text-gray-700">Cargando Simulación de Estrés por Procesos...</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. SUB-TAB: CHAT RAG REGULATORIO */}
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
                  {msg.sender === "copilot" ? (
                    <MarkdownRenderer content={msg.text} />
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-2.5 max-w-md">
                <div className="w-7 h-7 rounded-full bg-[#C0D725] text-[#1F242B] flex items-center justify-center text-xs font-bold animate-pulse">
                  IA
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-500 flex items-center gap-2 shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span>B×+ Risk Copilot razonando sobre la CUB, NIF C-16 y procesos bancarios...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2 bg-gray-50 border-t border-gray-200 flex gap-2 overflow-x-auto text-[11px]">
            {[
              "¿Qué impacto tiene la sequía y el criterio DNSH en la migración a Etapa 2 de NIF C-16?",
              "¿Por qué la degradación de controles a No Formalizados (NF) eleva la PEA del proceso?",
              "¿Qué controles preventivos exige la Circular 8/2019 de Banxico para enlaces SPEI?",
            ].map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(p)}
                className="whitespace-nowrap bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Input Bar con Textarea Auto-ajustable */}
          <div className="p-3 bg-white border-t border-gray-200 flex items-end gap-2">
            <textarea
              ref={chatTextareaRef}
              rows={1}
              placeholder="Pregunta a B×+ Risk Copilot sobre límites RAF, NIF C-16, estrés por procesos o auditorías CNBV... (Shift + Enter para nueva línea)"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 p-2 border border-gray-300 rounded text-xs outline-none focus:border-[#3299A8] resize-none min-h-[38px] max-h-[130px] leading-relaxed transition-all"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={chatLoading || !inputMessage.trim()}
              className="bg-[#1F242B] hover:bg-[#2A313C] text-white p-2.5 rounded text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer shrink-0 h-[38px] flex items-center justify-center"
              title="Enviar consulta"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
