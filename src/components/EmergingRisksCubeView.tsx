// src/components/EmergingRisksCubeView.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Layers,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Sparkles,
  RotateCcw,
  Sliders,
  Plus,
  ArrowRight,
  Clock,
  Zap,
  CheckCircle2,
  X,
  Eye,
  RefreshCw,
  Cpu,
  ChevronRight,
  Flame,
  Info,
} from "lucide-react";
import { CustomSelect, CustomSelectOption } from "@/components/ui/CustomSelect";
import { formatMXN, getZoneBadgeClasses } from "@/lib/utils";
import { RoleType } from "@/types";
import {
  EMERGING_CATEGORIES,
  EmergingCategoryCode,
  SCALE_AXIS_X,
  SCALE_AXIS_Y,
  SCALE_AXIS_Z,
} from "@/types/emerging-risks";

interface EmergingRisksCubeViewProps {
  currentRole: RoleType;
  onNavigateToPlans?: () => void;
}

type CubeMode = "RESIDUAL" | "INHERENT" | "PARALLEL_2D_3D";
type AngleView = "ISO_LEFT" | "ISO_FRONT" | "ISO_RIGHT" | "TOP_DOWN";

export function EmergingRisksCubeView({
  currentRole,
  onNavigateToPlans,
}: EmergingRisksCubeViewProps) {
  // Estados de datos
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [cubeMode, setCubeMode] = useState<CubeMode>("RESIDUAL");
  const [speedLayerZ, setSpeedLayerZ] = useState<number | "ALL">("ALL");
  const [viewAngle, setViewAngle] = useState<AngleView>("ISO_FRONT");
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

  // Estados del Simulador Python
  const [simX, setSimX] = useState<number>(4);
  const [simY, setSimY] = useState<number>(4);
  const [simZ, setSimZ] = useState<number>(4);
  const [simDefX, setSimDefX] = useState<number>(0);
  const [simDefY, setSimDefY] = useState<number>(0);
  const [simDefZ, setSimDefZ] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Modal Nuevo Riesgo Emergente
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCause, setNewCause] = useState("");
  const [newConsequence, setNewConsequence] = useState("");
  const [newProcessId, setNewProcessId] = useState("");
  const [newCatCode, setNewCatCode] = useState<EmergingCategoryCode>("TECH_CONCENTRATION");
  const [newX, setNewX] = useState(4);
  const [newY, setNewY] = useState(4);
  const [newZ, setNewZ] = useState(4);
  const [isCreating, setIsCreating] = useState(false);

  // Modal Nuevo Plan Quick-Win
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [planDays, setPlanDays] = useState(30);
  const [planCost, setPlanCost] = useState(85000);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  // 1. Cargar datos del endpoint
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const url = `/api/emerging-risks?processId=${selectedProcessId}&category=${selectedCategory}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.emergingRisks && json.emergingRisks.length > 0) {
          if (!selectedRiskId || !json.emergingRisks.some((r: any) => r.id === selectedRiskId)) {
            const defaultRisk = json.emergingRisks[0];
            setSelectedRiskId(defaultRisk.id);
            setSimX(defaultRisk.systemicImpactX);
            setSimY(defaultRisk.uncertaintyY);
            setSimZ(defaultRisk.materializationSpeedZ);
          }
        }
      }
    } catch (err) {
      console.error("Error loading emerging risks:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedProcessId, selectedCategory, selectedRiskId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Riesgo actualmente seleccionado en el inspector
  const activeRisk = useMemo(() => {
    if (!data?.emergingRisks || !selectedRiskId) return null;
    return data.emergingRisks.find((r: any) => r.id === selectedRiskId) || data.emergingRisks[0];
  }, [data?.emergingRisks, selectedRiskId]);

  // Actualizar sliders cuando cambia el riesgo seleccionado
  useEffect(() => {
    if (activeRisk) {
      setSimX(activeRisk.systemicImpactX);
      setSimY(activeRisk.uncertaintyY);
      setSimZ(activeRisk.materializationSpeedZ);
      setSimDefX(Math.round(activeRisk.mitigationDeltaX * 100));
      setSimDefY(Math.round(activeRisk.mitigationDeltaY * 100));
      setSimDefZ(Math.round(activeRisk.mitigationDeltaZ * 100));
    }
  }, [activeRisk]);

  // Opciones de procesos bancarios
  const processOptions: CustomSelectOption[] = useMemo(() => {
    const opts: CustomSelectOption[] = [
      {
        value: "ALL",
        label: "Todos los Procesos (Portafolio 3D)",
        badge: "Consolidado",
        description: "Visualización transversal de amenazas emergentes en B×+",
      },
    ];

    if (data?.emergingRisks) {
      const seen = new Set<string>();
      data.emergingRisks.forEach((r: any) => {
        if (r.processId && !seen.has(r.processId)) {
          seen.add(r.processId);
          opts.push({
            value: r.processId,
            label: `${r.processCode}: ${r.processName}`,
            badge: r.processCode,
            description: r.processName,
          });
        }
      });
    }
    return opts;
  }, [data?.emergingRisks]);

  // Filtro de riesgos visibles según capa de velocidad Z
  const visibleRisks = useMemo(() => {
    if (!data?.emergingRisks) return [];
    if (speedLayerZ === "ALL") return data.emergingRisks;
    return data.emergingRisks.filter((r: any) => {
      const zVal = cubeMode === "INHERENT" ? r.materializationSpeedZ : Math.round(r.residualZ);
      return zVal === speedLayerZ;
    });
  }, [data?.emergingRisks, speedLayerZ, cubeMode]);

  // Conteo de riesgos de velocidad inmediata en la vista actual
  const highSpeedCount = useMemo(() => {
    if (!visibleRisks) return 0;
    return visibleRisks.filter((r: any) => {
      const z = cubeMode === "INHERENT" ? r.materializationSpeedZ : r.residualZ;
      return z >= 3.8;
    }).length;
  }, [visibleRisks, cubeMode]);

  // Guardar simulación en vivo con el Motor Python
  const handleSaveSimulation = async () => {
    if (!activeRisk) return;
    setIsSimulating(true);
    setSaveStatus(null);
    try {
      const overrideX = Number(Math.max(1, simX * (1 - simDefX / 100)).toFixed(2));
      const overrideY = Number(Math.max(1, simY * (1 - simDefY / 100)).toFixed(2));
      const overrideZ = Number(Math.max(1, simZ * (1 - simDefZ / 100)).toFixed(2));

      const res = await fetch("/api/emerging-risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SIMULATE_OR_UPDATE_CUBE",
          riskId: activeRisk.id,
          systemicImpactX: simX,
          uncertaintyY: simY,
          materializationSpeedZ: simZ,
          overrideResidualX: overrideX,
          overrideResidualY: overrideY,
          overrideResidualZ: overrideZ,
          userRole: currentRole,
        }),
      });

      const resJson = await res.json();
      if (resJson.success) {
        setSaveStatus("Cálculo recalculado y persistido con éxito en el Motor Python 3D.");
        setTimeout(() => setSaveStatus(null), 3500);
        await fetchData();
      } else {
        setSaveStatus("Error: " + (resJson.error || "No se pudo actualizar"));
      }
    } catch (err: any) {
      console.error("Error saving simulation:", err);
      setSaveStatus("Error de red");
    } finally {
      setIsSimulating(false);
    }
  };

  // Crear nuevo riesgo emergente 3D
  const handleCreateRisk = async () => {
    if (!newCode || !newTitle || !newProcessId) {
      alert("Por favor completa el código, título y proceso bancario.");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/emerging-risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_EMERGING_RISK",
          code: newCode,
          title: newTitle,
          cause: newCause,
          consequence: newConsequence,
          processId: newProcessId,
          emergingCategoryCode: newCatCode,
          systemicImpactX: newX,
          uncertaintyY: newY,
          materializationSpeedZ: newZ,
          userRole: currentRole,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        setNewCode("");
        setNewTitle("");
        setNewCause("");
        setNewConsequence("");
        await fetchData();
      } else {
        alert("Error: " + (json.error || "No se pudo crear"));
      }
    } catch (e) {
      console.error(e);
      alert("Error al comunicarse con el servidor");
    } finally {
      setIsCreating(false);
    }
  };

  // Crear Plan de Acción Quick-Win 3LD
  const handleCreatePlan = async () => {
    if (!activeRisk || !planTitle) return;
    setIsCreatingPlan(true);
    try {
      const res = await fetch("/api/action-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ACTION_PLAN",
          title: planTitle,
          description: `Plan de contención rápida frente a amenaza emergente ${activeRisk.code} (${activeRisk.emergingCategoryLabel}) para reducir velocidad Z y aislar contagio X.`,
          riskEventId: activeRisk.id,
          estimatedDays: planDays,
          estimatedCostMXN: planCost,
          improvementPotentialPct: 0.65,
          isQuickWin: true,
          planTypes: ["TECHNOLOGY", "PROCESSES"],
          userRole: currentRole,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsPlanModalOpen(false);
        setPlanTitle("");
        alert("Plan Quick-Win registrado exitosamente en la Matriz 2x2 de Mitigación.");
      } else {
        alert("Error: " + (json.error || "No se pudo crear el plan"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  // Coordenadas calculadas en vivo en el simulador
  const liveResX = useMemo(() => Math.max(1, Number((simX * (1 - simDefX / 100)).toFixed(2))), [simX, simDefX]);
  const liveResY = useMemo(() => Math.max(1, Number((simY * (1 - simDefY / 100)).toFixed(2))), [simY, simDefY]);
  const liveResZ = useMemo(() => Math.max(1, Number((simZ * (1 - simDefZ / 100)).toFixed(2))), [simZ, simDefZ]);
  const liveVol = useMemo(() => Number((liveResX * liveResY * liveResZ).toFixed(1)), [liveResX, liveResY, liveResZ]);

  // Color de zona 3D
  const getZoneColor = (zone: string) => {
    switch (zone) {
      case "RED":
        return "#EF4444";
      case "ORANGE":
        return "#F97316";
      case "YELLOW":
        return "#EAB308";
      case "GREEN":
      default:
        return "#10B981";
    }
  };

  // Proyección isométrica SVG para el Cubo 5x5x5
  const project3D = (x: number, y: number, z: number, angle: AngleView) => {
    // Normalizar a centro (1..5 -> -2..2)
    const nx = x - 3;
    const ny = y - 3;
    const nz = z - 3;

    let px = 0;
    let py = 0;

    if (angle === "ISO_FRONT") {
      px = nx * 32 - ny * 20;
      py = nx * 10 + ny * 16 - nz * 30;
    } else if (angle === "ISO_LEFT") {
      px = -ny * 32 + nx * 18;
      py = ny * 12 + nx * 14 - nz * 30;
    } else if (angle === "ISO_RIGHT") {
      px = nx * 32 + ny * 20;
      py = -nx * 10 + ny * 16 - nz * 30;
    } else {
      // TOP_DOWN
      px = nx * 38;
      py = ny * 38 - nz * 8;
    }

    return { x: 260 + px, y: 220 + py };
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* 1. Header Ejecutivo Taste Index B×+ */}
      <div className="bg-gradient-to-r from-[#1F242B] via-[#242C35] to-[#2B333E] text-white rounded-bx p-5 shadow-card border-l-4 border-[#C0D725] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold font-serif text-white tracking-tight flex items-center gap-2">
              <Box className="w-5 h-5 text-[#C0D725]" />
              Matriz Cúbica de Riesgos Emergentes (5×5×5)
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#101418] text-[#C0D725] font-mono border border-[#C0D725]/40 flex items-center gap-1.5 shadow-xs">
              <Cpu className="w-3 h-3 text-[#C0D725] animate-pulse" />
              {data?.engineTelemetry?.engine || "Python 3D Cube Engine"} •{" "}
              {data?.engineTelemetry?.executionTimeMs || 0}ms
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-700/60 text-gray-300 font-mono">
              125 Vóxeles (X·Y·Z)
            </span>
          </div>
          <p className="text-xs text-gray-300 max-w-3xl leading-relaxed">
            Modelo cuantitativo en 3 dimensiones ortogonales:{" "}
            <strong className="text-white">Eje X (Impacto Sistémico/Contagio)</strong> ×{" "}
            <strong className="text-white">Eje Y (Incertidumbre Epistémica)</strong> ×{" "}
            <strong className="text-white">Eje Z (Velocidad de Materialización)</strong>.
            Monitorea amenazas sistémicas complejas en paralelo con la Matriz 5×5 tradicional,
            revelando puntos ciegos frecuentistas.
          </p>
        </div>

        {/* Botón Nuevo Riesgo Emergente */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold bg-[#C0D725] hover:bg-[#b0c520] text-[#1F242B] rounded-md shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Riesgo Emergente 3D</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Filtros y Modo de Visualización */}
      <div className="bg-white rounded-bx p-4 shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Selector de Proceso Bancario */}
          <div className="w-72">
            <CustomSelect
              value={selectedProcessId}
              onChange={(val) => setSelectedProcessId(val)}
              options={processOptions}
              theme="light"
              searchPlaceholder="Filtrar por proceso bancario..."
            />
          </div>

          {/* Switch de Modo del Cubo */}
          <div className="inline-flex rounded-md border border-gray-300 bg-gray-100 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setCubeMode("RESIDUAL")}
              className={`px-3 py-1 rounded transition-colors ${
                cubeMode === "RESIDUAL"
                  ? "bg-[#1F242B] text-white shadow-xs font-bold"
                  : "text-gray-700 hover:text-black"
              }`}
            >
              Cubo Residual (Con Controles)
            </button>
            <button
              type="button"
              onClick={() => setCubeMode("INHERENT")}
              className={`px-3 py-1 rounded transition-colors ${
                cubeMode === "INHERENT"
                  ? "bg-[#1F242B] text-white shadow-xs font-bold"
                  : "text-gray-700 hover:text-black"
              }`}
            >
              Cubo Inherente (Bruto)
            </button>
            <button
              type="button"
              onClick={() => setCubeMode("PARALLEL_2D_3D")}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                cubeMode === "PARALLEL_2D_3D"
                  ? "bg-[#3299A8] text-white shadow-xs font-bold"
                  : "text-gray-700 hover:text-black"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Gestión Paralela (2D vs. 3D)</span>
            </button>
          </div>
        </div>

        {/* Filtro por Capa de Velocidad Z */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-gray-500 font-medium mr-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Capa Z:
          </span>
          <button
            type="button"
            onClick={() => setSpeedLayerZ("ALL")}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
              speedLayerZ === "ALL"
                ? "bg-[#1F242B] text-[#C0D725] border-[#1F242B]"
                : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            Todas
          </button>
          {[5, 4, 3, 2, 1].map((zVal) => (
            <button
              key={zVal}
              type="button"
              onClick={() => setSpeedLayerZ(zVal)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                speedLayerZ === zVal
                  ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                  : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
              title={`Capa Z=${zVal}: ${SCALE_AXIS_Z.find((s) => s.level === zVal)?.label}`}
            >
              Z={zVal}
            </button>
          ))}
        </div>
      </div>

      {/* Pills de las 8 Categorías de Riesgos Emergentes */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
        <button
          type="button"
          onClick={() => setSelectedCategory("ALL")}
          className={`px-3 py-1 rounded-full font-semibold border shrink-0 transition-all ${
            selectedCategory === "ALL"
              ? "bg-[#1F242B] text-white border-[#1F242B] shadow-xs"
              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
          }`}
        >
          Todas las Categorías ({data?.totalEmergingRisks || 0})
        </button>
        {Object.values(EMERGING_CATEGORIES).map((cat) => {
          const catCount =
            data?.categorySummary?.find((c: any) => c.categoryCode === cat.code)?.count || 0;
          const isSelected = selectedCategory === cat.code;
          return (
            <button
              key={cat.code}
              type="button"
              onClick={() => setSelectedCategory(cat.code)}
              className={`px-2.5 py-1 rounded-full font-semibold border shrink-0 flex items-center gap-1.5 transition-all ${
                isSelected
                  ? "bg-[#1F242B] text-[#C0D725] border-[#C0D725] shadow-xs font-bold"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.shortLabel}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 font-mono">
                {catCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. 4 KPIs Ejecutivos Tridimensionales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Vórtice Crítico 3D */}
        <div className="bg-white rounded-bx p-4 shadow-sm border border-gray-200 border-t-4 border-t-rose-500">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Vórtice Crítico 3D (Zona Roja)</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-gray-900">
              {data?.kpis?.criticalRed3DCount || 0}
            </span>
            <span className="text-xs text-rose-600 font-medium">amenazas críticas</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Volumen $V \ge 64$ o combinación $X \ge 4 \land Z \ge 4$ con efecto multiplicador.
          </p>
        </div>

        {/* KPI 2: Hiper-Velocidad Z >= 4 */}
        <div className="bg-white rounded-bx p-4 shadow-sm border border-gray-200 border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Velocidad Instantánea (Z ≥ 4)</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-gray-900">
              {data?.kpis?.highSpeedCount || 0}
            </span>
            <span className="text-xs text-amber-600 font-medium">impacto en minutos/48h</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Exigen controles <strong className="text-gray-700">ONLINE_REALTIME</strong> (Kill-Switch automatizado).
          </p>
        </div>

        {/* KPI 3: Puntos Ciegos 2D -> 3D */}
        <div className="bg-white rounded-bx p-4 shadow-sm border border-gray-200 border-t-4 border-t-[#3299A8]">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Puntos Ciegos (2D vs. 3D)</span>
            <Eye className="w-4 h-4 text-[#3299A8]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-[#3299A8]">
              {data?.kpis?.blindSpots2Dto3DCount || 0}
            </span>
            <span className="text-xs text-gray-600 font-medium">subestimados en 2D</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Riesgos en zona Verde/Amarilla en matriz 5×5 que el Cubo 3D revela en Naranja/Roja.
          </p>
        </div>

        {/* KPI 4: Vector Medio del Cubo */}
        <div className="bg-white rounded-bx p-4 shadow-sm border border-gray-200 border-t-4 border-t-[#C0D725]">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Vector Medio (X̄, Ȳ, Z̄)</span>
            <Activity className="w-4 h-4 text-[#8EA01A]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono text-gray-900">
              ({data?.kpis?.avgSystemicX || 0}, {data?.kpis?.avgUncertaintyY || 0}, {data?.kpis?.avgSpeedZ || 0})
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Volumen residual medio: <strong className="text-gray-800">{data?.kpis?.avgResidualVolume || 0} / 125</strong>.
          </p>
        </div>
      </div>

      {/* 4. Lienzo Central en 2 Columnas: Visualizador Cubo 3D + Inspector & Simulador Python */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda (7 cols): Cubo Isométrico 3D + Proyecciones Ortogonales */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card del Cubo Isométrico 3D */}
          <div className="bg-white rounded-bx p-4 shadow-sm border border-gray-200">
            {/* Header del Canvas 3D */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[#3299A8]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  Lienzo Isométrico 3D ({cubeMode === "INHERENT" ? "Inherente" : "Residual"})
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 text-[11px] font-medium">Ángulo:</span>
                {(["ISO_FRONT", "ISO_LEFT", "ISO_RIGHT", "TOP_DOWN"] as AngleView[]).map((ang) => (
                  <button
                    key={ang}
                    type="button"
                    onClick={() => setViewAngle(ang)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                      viewAngle === ang
                        ? "bg-[#1F242B] text-white border-[#1F242B]"
                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    {ang === "ISO_FRONT" ? "Frontal" : ang === "ISO_LEFT" ? "Izq" : ang === "ISO_RIGHT" ? "Der" : "Cenital"}
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas SVG del Cubo 5x5x5 con Fondo Blanco */}
            <div className="relative w-full h-[400px] bg-white rounded-md overflow-hidden flex items-center justify-center border border-gray-200">
              {/* Indicador en la parte superior derecha de la representación */}
              <div className="absolute top-2.5 right-2.5 z-10 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded border border-gray-200 shadow-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-gray-800 leading-tight">
                    Amenazas Hiper-Veloces (Z ≥ 4):{" "}
                    <span className="text-rose-600 font-mono font-black">{highSpeedCount}</span>
                  </span>
                  <span className="text-[9px] text-gray-500 leading-tight">
                    Onset &lt; 4h • Exige Kill-Switch en tiempo real
                  </span>
                </div>
              </div>

              <svg viewBox="0 0 520 440" className="w-full h-full select-none">
                {/* Cuadrícula base y patrones del fondo */}
                <defs>
                  {/* Cuadrícula técnica de ingeniería en el fondo */}
                  <pattern id="canvasBgGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" strokeWidth="0.75" />
                  </pattern>
                  <pattern id="canvasBgGridMajor" width="100" height="100" patternUnits="userSpaceOnUse">
                    <rect width="100" height="100" fill="url(#canvasBgGrid)" />
                    <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#D1D5DB" strokeWidth="1.25" />
                  </pattern>

                  {/* Puntas de flecha sólidas y de alto contraste para los 3 ejes */}
                  <marker id="arrowAxisX" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#0284C7" />
                  </marker>
                  <marker id="arrowAxisY" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#16A34A" />
                  </marker>
                  <marker id="arrowAxisZ" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#EA580C" />
                  </marker>

                  <radialGradient id="nodeGlowRed" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                  </radialGradient>
                  <radialGradient id="nodeGlowYellow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#EAB308" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#EAB308" stopOpacity="0.0" />
                  </radialGradient>
                </defs>

                {/* Fondo con Cuadrícula Técnica en Papel Blanco */}
                <rect x="0" y="0" width="520" height="440" fill="url(#canvasBgGridMajor)" />

                {/* Ejes tridimensionales de referencia con Colores Resaltados */}
                {(() => {
                  const o = project3D(1, 1, 1, viewAngle);
                  const pX = project3D(5.35, 1, 1, viewAngle);
                  const pY = project3D(1, 5.35, 1, viewAngle);
                  const pZ = project3D(1, 1, 5.35, viewAngle);
                  return (
                    <g>
                      {/* Eje X (Impacto Sistémico / Contagio) - Azul Eléctrico Vibrante */}
                      <line
                        x1={o.x}
                        y1={o.y}
                        x2={pX.x}
                        y2={pX.y}
                        stroke="#0284C7"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        markerEnd="url(#arrowAxisX)"
                      />
                      {[1, 2, 3, 4, 5].map((val) => {
                        const pt = project3D(val, 1, 1, viewAngle);
                        return (
                          <g key={`tick-x-${val}`}>
                            <circle cx={pt.x} cy={pt.y} r="2.5" fill="#0284C7" />
                            <text x={pt.x} y={pt.y + 11} fill="#0369A1" fontSize="8" fontWeight="bold" textAnchor="middle">{val}</text>
                          </g>
                        );
                      })}
                      <g transform={`translate(${pX.x + 8}, ${pX.y - 10})`}>
                        <rect x="0" y="0" width="96" height="20" rx="4" fill="#0284C7" />
                        <text x="48" y="14" fill="#FFFFFF" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                          Eje X • Contagio
                        </text>
                      </g>

                      {/* Eje Y (Incertidumbre Epistémica) - Verde Esmeralda Vibrante */}
                      <line
                        x1={o.x}
                        y1={o.y}
                        x2={pY.x}
                        y2={pY.y}
                        stroke="#16A34A"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        markerEnd="url(#arrowAxisY)"
                      />
                      {[1, 2, 3, 4, 5].map((val) => {
                        const pt = project3D(1, val, 1, viewAngle);
                        return (
                          <g key={`tick-y-${val}`}>
                            <circle cx={pt.x} cy={pt.y} r="2.5" fill="#16A34A" />
                            <text x={pt.x - 9} y={pt.y + 3} fill="#15803D" fontSize="8" fontWeight="bold" textAnchor="end">{val}</text>
                          </g>
                        );
                      })}
                      <g transform={`translate(${pY.x - 130}, ${pY.y + 4})`}>
                        <rect x="0" y="0" width="124" height="20" rx="4" fill="#16A34A" />
                        <text x="62" y="14" fill="#FFFFFF" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                          Eje Y • Incertidumbre
                        </text>
                      </g>

                      {/* Eje Z (Velocidad de Materialización) - Naranja Rojizo Vibrante */}
                      <line
                        x1={o.x}
                        y1={o.y}
                        x2={pZ.x}
                        y2={pZ.y}
                        stroke="#EA580C"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        markerEnd="url(#arrowAxisZ)"
                      />
                      {[1, 2, 3, 4, 5].map((val) => {
                        const pt = project3D(1, 1, val, viewAngle);
                        return (
                          <g key={`tick-z-${val}`}>
                            <circle cx={pt.x} cy={pt.y} r="2.5" fill="#EA580C" />
                            <text x={pt.x - 9} y={pt.y + 3} fill="#C2410C" fontSize="8" fontWeight="bold" textAnchor="end">{val}</text>
                          </g>
                        );
                      })}
                      <g transform={`translate(${pZ.x - 53}, ${pZ.y - 26})`}>
                        <rect x="0" y="0" width="106" height="20" rx="4" fill="#EA580C" />
                        <text x="53" y="14" fill="#FFFFFF" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                          Eje Z • Velocidad
                        </text>
                      </g>
                    </g>
                  );
                })()}

                {/* Vóxeles de la caja límite (Líneas Negras del Cubo) */}
                {(() => {
                  const corners = [
                    project3D(1, 1, 1, viewAngle),
                    project3D(5, 1, 1, viewAngle),
                    project3D(5, 5, 1, viewAngle),
                    project3D(1, 5, 1, viewAngle),
                    project3D(1, 1, 5, viewAngle),
                    project3D(5, 1, 5, viewAngle),
                    project3D(5, 5, 5, viewAngle),
                    project3D(1, 5, 5, viewAngle),
                  ];
                  return (
                    <g fill="none">
                      {/* Retícula interna sutil del piso base (Z = 1) */}
                      {[2, 3, 4].map((v) => {
                        const lx1 = project3D(v, 1, 1, viewAngle);
                        const lx2 = project3D(v, 5, 1, viewAngle);
                        const ly1 = project3D(1, v, 1, viewAngle);
                        const ly2 = project3D(5, v, 1, viewAngle);
                        return (
                          <g key={`base-grid-${v}`} stroke="#000000" strokeWidth="0.75" opacity="0.12">
                            <line x1={lx1.x} y1={lx1.y} x2={lx2.x} y2={lx2.y} />
                            <line x1={ly1.x} y1={ly1.y} x2={ly2.x} y2={ly2.y} />
                          </g>
                        );
                      })}

                      {/* Capas intermedias de velocidad (Z = 2, 3, 4) en líneas negras punteadas */}
                      {[2, 3, 4].map((zLevel) => {
                        const c0 = project3D(1, 1, zLevel, viewAngle);
                        const c1 = project3D(5, 1, zLevel, viewAngle);
                        const c2 = project3D(5, 5, zLevel, viewAngle);
                        const c3 = project3D(1, 5, zLevel, viewAngle);
                        return (
                          <polygon
                            key={`layer-z-${zLevel}`}
                            points={`${c0.x},${c0.y} ${c1.x},${c1.y} ${c2.x},${c2.y} ${c3.x},${c3.y}`}
                            stroke="#000000"
                            strokeWidth="0.75"
                            strokeDasharray="2 3"
                            opacity="0.22"
                          />
                        );
                      })}

                      {/* Estructura Principal del Cubo: Aristas y Pilares en Negro Sólido */}
                      <g stroke="#000000" strokeWidth="1.75" opacity="0.95">
                        {/* Base inferior (Z = 1) */}
                        <polygon points={`${corners[0].x},${corners[0].y} ${corners[1].x},${corners[1].y} ${corners[2].x},${corners[2].y} ${corners[3].x},${corners[3].y}`} />
                        {/* Tapa superior (Z = 5) */}
                        <polygon points={`${corners[4].x},${corners[4].y} ${corners[5].x},${corners[5].y} ${corners[6].x},${corners[6].y} ${corners[7].x},${corners[7].y}`} />
                        {/* Pilares verticales */}
                        <line x1={corners[0].x} y1={corners[0].y} x2={corners[4].x} y2={corners[4].y} />
                        <line x1={corners[1].x} y1={corners[1].y} x2={corners[5].x} y2={corners[5].y} />
                        <line x1={corners[2].x} y1={corners[2].y} x2={corners[6].x} y2={corners[6].y} />
                        <line x1={corners[3].x} y1={corners[3].y} x2={corners[7].x} y2={corners[7].y} />
                      </g>
                    </g>
                  );
                })()}

                {/* Graficar Vectores 3D de desplazamiento (Inherente -> Residual) */}
                {visibleRisks.map((r: any) => {
                  const pInh = project3D(r.systemicImpactX, r.uncertaintyY, r.materializationSpeedZ, viewAngle);
                  const pRes = project3D(r.residualX, r.residualY, r.residualZ, viewAngle);
                  const isSelected = activeRisk?.id === r.id;

                  return (
                    <g key={`vec-${r.id}`}>
                      {/* Línea vectorial de mitigación */}
                      <line
                        x1={pInh.x}
                        y1={pInh.y}
                        x2={pRes.x}
                        y2={pRes.y}
                        stroke="#4B5563"
                        strokeWidth={isSelected ? "2" : "1.2"}
                        strokeDasharray="3 2"
                        opacity={isSelected ? "0.9" : "0.5"}
                      />
                      {/* Punto fantasma Inherente */}
                      <circle
                        cx={pInh.x}
                        cy={pInh.y}
                        r="3"
                        fill="#F3F4F6"
                        stroke="#4B5563"
                        strokeWidth="1.2"
                        opacity="0.8"
                      />
                    </g>
                  );
                })}

                {/* Graficar Nodos Tridimensionales de cada Riesgo */}
                {visibleRisks.map((r: any) => {
                  const xCoord = cubeMode === "INHERENT" ? r.systemicImpactX : r.residualX;
                  const yCoord = cubeMode === "INHERENT" ? r.uncertaintyY : r.residualY;
                  const zCoord = cubeMode === "INHERENT" ? r.materializationSpeedZ : r.residualZ;
                  const p = project3D(xCoord, yCoord, zCoord, viewAngle);

                  const zone = cubeMode === "INHERENT" ? r.cubeZoneInherent : r.cubeZoneResidual;
                  const color = getZoneColor(zone);
                  const isSelected = activeRisk?.id === r.id;
                  const isHighSpeed = zCoord >= 3.8;

                  return (
                    <g
                      key={`node-${r.id}`}
                      className="cursor-pointer transition-transform duration-150"
                      onClick={() => setSelectedRiskId(r.id)}
                    >
                      {/* Anillo de selección al hacer clic */}
                      {isSelected && (
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="11"
                          fill="none"
                          stroke="#1F242B"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                        />
                      )}

                      {/* Nodo principal (estático, sin animaciones ni parpadeos) */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isSelected ? "7" : "5.5"}
                        fill={color}
                        stroke={isHighSpeed ? "#EF4444" : "#111827"}
                        strokeWidth={isHighSpeed ? "2" : "1.5"}
                      />

                      {/* Etiqueta de código en tipografía oscura y legible */}
                      <text
                        x={p.x + 9}
                        y={p.y + 3.5}
                        fill={isSelected ? "#0F766E" : "#111827"}
                        fontSize={isSelected ? "11" : "9.5"}
                        fontWeight={isSelected ? "bold" : "700"}
                        fontFamily="monospace"
                        className="pointer-events-none select-none"
                      >
                        {r.code}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Leyenda flotante en la esquina del canvas con Fondo Blanco */}
              <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs p-2 rounded text-[10px] text-gray-700 border border-gray-200 shadow-sm flex items-center gap-3">
                <span className="flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Rojo (V ≥ 64)
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Naranja (36 ≤ V &lt; 64)
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" /> Amarillo
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Verde
                </span>
              </div>
            </div>
          </div>

          {/* 3 Proyecciones Ortogonales del Cubo (Planos 5x5) */}
          <div className="bg-white rounded-bx p-4 shadow-sm border border-gray-200 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#3299A8]" />
                Proyecciones Ortogonales (3 Caras 5×5)
              </h4>
              <span className="text-[11px] text-gray-500">Descomposición planar del tensor</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Plano 1: X vs Z (Contagio vs Velocidad) */}
              <div className="p-2.5 rounded bg-gray-50 border border-gray-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-[11px]">Plano X × Z</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-semibold">
                    Choque Relámpago
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  Contagio ($X$) vs. Velocidad ($Z$). Detecta eventos que se propagan en minutos.
                </p>
                <div className="text-[11px] font-mono text-gray-700 bg-white p-1.5 rounded border border-gray-200">
                  {visibleRisks.filter((r: any) => r.residualX >= 3.8 && r.residualZ >= 3.8).length} riesgos en vórtice agudo
                </div>
              </div>

              {/* Plano 2: X vs Y (Contagio vs Incertidumbre) */}
              <div className="p-2.5 rounded bg-gray-50 border border-gray-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-[11px]">Plano X × Y</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-semibold">
                    Cisnes Negros
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  Contagio ($X$) vs. Incertidumbre ($Y$). Identifica eventos inéditos de alto daño.
                </p>
                <div className="text-[11px] font-mono text-gray-700 bg-white p-1.5 rounded border border-gray-200">
                  {visibleRisks.filter((r: any) => r.residualX >= 3.8 && r.residualY >= 3.8).length} amenazas sistémicas complejas
                </div>
              </div>

              {/* Plano 3: Y vs Z (Incertidumbre vs Velocidad) */}
              <div className="p-2.5 rounded bg-gray-50 border border-gray-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-[11px]">Plano Y × Z</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                    Sorpresas Operativas
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  Incertidumbre ($Y$) vs. Velocidad ($Z$). Desafía la capacidad de respuesta humana.
                </p>
                <div className="text-[11px] font-mono text-gray-700 bg-white p-1.5 rounded border border-gray-200">
                  {visibleRisks.filter((r: any) => r.residualY >= 3.8 && r.residualZ >= 3.8).length} vectores hiper-impredecibles
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha (5 cols): Inspector 3D del Riesgo Seleccionado & Simulador Python */}
        <div className="lg:col-span-5 space-y-4">
          {activeRisk ? (
            <div className="bg-white rounded-bx p-5 shadow-sm border border-gray-200 space-y-4">
              {/* Header del Inspector */}
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#1F242B] text-[#C0D725]">
                      {activeRisk.code}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${activeRisk.categoryBadge}`}
                    >
                      {activeRisk.emergingCategoryShort}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      activeRisk.cubeZoneResidual === "RED"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : activeRisk.cubeZoneResidual === "ORANGE"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    Zona 3D: {activeRisk.cubeZoneResidual}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm leading-snug">
                  {activeRisk.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Proceso: <strong className="text-gray-800">{activeRisk.processCode}</strong> • Nodo:{" "}
                  <strong className="text-gray-800">{activeRisk.processNodeLabel}</strong>
                </p>
              </div>

              {/* Comparativa Paralela 2D vs 3D */}
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-gray-800 border-b border-gray-200/80 pb-1.5">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-[#3299A8]" />
                    Comparativa Paralela 2D vs. 3D
                  </span>
                  {activeRisk.isBlindSpot2Dto3D ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-300">
                      Punto Ciego Detectado
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      Congruente
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">Matriz 2D (P × I)</div>
                    <div className="text-sm font-bold font-mono text-gray-800 mt-0.5">
                      {activeRisk.matrix2D?.residualScore || "N/A"} / 25
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Zona {activeRisk.matrix2D?.residualZone || "YELLOW"}
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">Cubo 3D (X × Y × Z)</div>
                    <div className="text-sm font-bold font-mono text-rose-600 mt-0.5">
                      {activeRisk.volumeResidual} / 125
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Tensión: {activeRisk.tensorScore3D} / 100
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-600 italic leading-snug">
                  {activeRisk.parallelComparison?.blindSpotExplanation}
                </p>
              </div>

              {/* Sliders Interactivos de Simulación con Motor Python */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-gray-900 border-b border-gray-100 pb-1">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#C0D725]" />
                    Simulador Vectorial 3D (Motor Python)
                  </span>
                  <span className="text-[11px] font-mono text-rose-600 font-bold">
                    Volumen Vivo: {liveVol} / 125
                  </span>
                </div>

                {/* Slider Eje X (Contagio) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-700">
                    <span className="font-semibold text-blue-700">Eje X — Impacto Sistémico / Contagio:</span>
                    <span className="font-mono font-bold">{simX} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={simX}
                    onChange={(e) => setSimX(Number(e.target.value))}
                    className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-gray-500 flex justify-between">
                    <span>1: Aislado</span>
                    <span>5: Sistémico / BCP</span>
                  </div>
                </div>

                {/* Slider Eje Y (Incertidumbre) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-700">
                    <span className="font-semibold text-[#8EA01A]">Eje Y — Incertidumbre Epistémica:</span>
                    <span className="font-mono font-bold">{simY} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={simY}
                    onChange={(e) => setSimY(Number(e.target.value))}
                    className="w-full accent-[#C0D725] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-gray-500 flex justify-between">
                    <span>1: Conocido</span>
                    <span>5: Cisne Negro</span>
                  </div>
                </div>

                {/* Slider Eje Z (Velocidad) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-700">
                    <span className="font-semibold text-amber-600">Eje Z — Velocidad de Materialización:</span>
                    <span className="font-mono font-bold">{simZ} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={simZ}
                    onChange={(e) => setSimZ(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-gray-500 flex justify-between">
                    <span>1: Lenta (&gt;6m)</span>
                    <span>5: Instantánea (&lt;4h)</span>
                  </div>
                </div>

                {/* Simulación de Defensas por Eje */}
                <div className="bg-gray-50 p-2.5 rounded border border-gray-200 text-xs space-y-2">
                  <span className="font-semibold text-gray-800 block text-[11px]">
                    Defensas y Controles Vectoriales (Art. 88 CUB):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-gray-600 block">Aislamiento ΔX</span>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        value={simDefX}
                        onChange={(e) => setSimDefX(Number(e.target.value))}
                        className="w-full accent-blue-600 h-1"
                      />
                      <span className="text-[10px] font-mono text-gray-500">-{simDefX}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-600 block">Sensores ΔY</span>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={simDefY}
                        onChange={(e) => setSimDefY(Number(e.target.value))}
                        className="w-full accent-[#8EA01A] h-1"
                      />
                      <span className="text-[10px] font-mono text-gray-500">-{simDefY}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-600 block">Kill-Switch ΔZ</span>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        value={simDefZ}
                        onChange={(e) => setSimDefZ(Number(e.target.value))}
                        className="w-full accent-amber-600 h-1"
                      />
                      <span className="text-[10px] font-mono text-gray-500">-{simDefZ}%</span>
                    </div>
                  </div>
                </div>

                {saveStatus && (
                  <div className="p-2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                    {saveStatus}
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveSimulation}
                    disabled={isSimulating}
                    className="flex-1 py-2 text-xs font-bold bg-[#1F242B] hover:bg-black text-[#C0D725] rounded transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>{isSimulating ? "Recalculando en Python..." : "Recalcular con Motor Python 3D"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPlanTitle(`Contención Automatizada para ${activeRisk.code}: ${activeRisk.title}`);
                      setIsPlanModalOpen(true);
                    }}
                    className="px-3 py-2 text-xs font-bold bg-[#3299A8] hover:bg-[#287d8a] text-white rounded transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                    title="Crear plan de mitigación Quick-Win 3LD"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Quick-Win</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-bx p-8 text-center text-gray-500 text-xs border border-gray-200">
              Selecciona un riesgo emergente en el Cubo 3D para inspeccionarlo y simularlo.
            </div>
          )}
        </div>
      </div>

      {/* 5. Tabla Inferior de Trazabilidad: Las 8 Categorías de Riesgos Emergentes */}
      <div className="bg-white rounded-bx shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
              Inventario de Riesgos Emergentes por Proceso y Nodo del Diagrama
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 font-mono">
              {data?.emergingRisks?.length || 0} riesgos
            </span>
          </div>
          <span className="text-[11px] text-gray-500 font-medium">
            Sincronización Transversal con Diagramador, Matriz 5×5 y Planes 3LD
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-[#1F242B] text-gray-200 uppercase font-semibold text-[10px] tracking-wider border-b border-gray-700">
              <tr>
                <th className="py-2.5 px-3">Código & Evento</th>
                <th className="py-2.5 px-3">Categoría Emergente (8 Familias)</th>
                <th className="py-2.5 px-3">Proceso & Nodo</th>
                <th className="py-2.5 px-3 text-center">Ejes Inh (X·Y·Z)</th>
                <th className="py-2.5 px-3 text-center">Mitigación Vectorial</th>
                <th className="py-2.5 px-3 text-center">Ejes Res & Vol (/125)</th>
                <th className="py-2.5 px-3 text-center">Espejo 2D (P×I)</th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.emergingRisks?.map((r: any) => {
                const isSelected = activeRisk?.id === r.id;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRiskId(r.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-amber-50/70 font-medium"
                        : "hover:bg-gray-50/80"
                    }`}
                  >
                    {/* Código y Título */}
                    <td className="py-2 px-3">
                      <div className="font-mono font-bold text-gray-900 text-[11px]">{r.code}</div>
                      <div className="text-gray-600 truncate max-w-xs text-[11px]">{r.title}</div>
                    </td>

                    {/* Categoría Emergente */}
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${r.categoryBadge}`}>
                        {r.emergingCategoryShort}
                      </span>
                    </td>

                    {/* Proceso y Nodo */}
                    <td className="py-2 px-3">
                      <div className="font-semibold text-gray-800 text-[11px]">{r.processCode}</div>
                      <div className="text-gray-500 text-[10px] truncate max-w-[180px]">
                        {r.processNodeLabel}
                      </div>
                    </td>

                    {/* Ejes Inherentes */}
                    <td className="py-2 px-3 text-center font-mono text-[11px]">
                      <span className="text-blue-700 font-bold">{r.systemicImpactX}</span>·
                      <span className="text-[#8EA01A] font-bold">{r.uncertaintyY}</span>·
                      <span className="text-amber-700 font-bold">{r.materializationSpeedZ}</span>
                      <div className="text-[10px] text-gray-400 font-sans">
                        Vol: {r.volumeInherent}
                      </div>
                    </td>

                    {/* Mitigación Vectorial */}
                    <td className="py-2 px-3 text-center text-[10px] font-mono">
                      <div>ΔX: -{r.mitigationDeltaX}</div>
                      <div>ΔY: -{r.mitigationDeltaY}</div>
                      <div className={r.hasRealtimeControl ? "text-emerald-700 font-bold" : ""}>
                        ΔZ: -{r.mitigationDeltaZ} {r.hasRealtimeControl && "⚡"}
                      </div>
                    </td>

                    {/* Ejes Residuales y Volumen */}
                    <td className="py-2 px-3 text-center font-mono">
                      <div className="text-[11px] font-bold text-gray-900">
                        {r.residualX}·{r.residualY}·{r.residualZ}
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          r.cubeZoneResidual === "RED"
                            ? "bg-rose-100 text-rose-800"
                            : r.cubeZoneResidual === "ORANGE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {r.volumeResidual} ({r.cubeZoneResidual})
                      </span>
                    </td>

                    {/* Espejo 2D */}
                    <td className="py-2 px-3 text-center text-[11px]">
                      <div className="font-mono text-gray-700">
                        {r.matrix2D?.residualScore} / 25
                      </div>
                      {r.isBlindSpot2Dto3D ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold border border-rose-300">
                          Punto Ciego
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                          2D: {r.matrix2D?.residualZone}
                        </span>
                      )}
                    </td>

                    {/* Acción */}
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRiskId(r.id);
                        }}
                        className="px-2 py-1 text-[11px] text-[#3299A8] hover:text-[#1F242B] font-semibold rounded hover:bg-gray-100 transition-colors"
                      >
                        Inspeccionar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: + Nuevo Riesgo Emergente 3D */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-bx shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1F242B] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-[#C0D725]" />
                <h3 className="font-bold text-sm">Registrar Nuevo Riesgo Emergente 3D</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Código de Riesgo:</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="Ej. RSK-AI-036"
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 font-mono text-xs focus:ring-1 focus:ring-[#C0D725] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Categoría Emergente:</label>
                  <select
                    value={newCatCode}
                    onChange={(e) => setNewCatCode(e.target.value as EmergingCategoryCode)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs bg-white focus:ring-1 focus:ring-[#C0D725] outline-none"
                  >
                    {Object.values(EMERGING_CATEGORIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Título del Evento Emergente:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Explotación de vulnerabilidad en modelo LLM corporativo..."
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs focus:ring-1 focus:ring-[#C0D725] outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Proceso Bancario Vinculado:</label>
                <select
                  value={newProcessId}
                  onChange={(e) => setNewProcessId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs bg-white focus:ring-1 focus:ring-[#C0D725] outline-none"
                >
                  <option value="">-- Seleccionar Proceso Bancario --</option>
                  {processOptions
                    .filter((p) => p.value !== "ALL")
                    .map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-gray-50 p-2.5 rounded border border-gray-200">
                <div>
                  <label className="block text-blue-700 font-bold mb-1">Eje X (Contagio):</label>
                  <select
                    value={newX}
                    onChange={(e) => setNewX(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-gray-300 font-mono text-xs bg-white"
                  >
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>
                        X = {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#8EA01A] font-bold mb-1">Eje Y (Incertid.):</label>
                  <select
                    value={newY}
                    onChange={(e) => setNewY(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-gray-300 font-mono text-xs bg-white"
                  >
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>
                        Y = {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-amber-600 font-bold mb-1">Eje Z (Veloc.):</label>
                  <select
                    value={newZ}
                    onChange={(e) => setNewZ(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-gray-300 font-mono text-xs bg-white"
                  >
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>
                        Z = {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateRisk}
                  disabled={isCreating}
                  className="px-4 py-1.5 text-xs font-bold bg-[#C0D725] text-[#1F242B] rounded hover:bg-[#b2c820] shadow-sm disabled:opacity-50"
                >
                  {isCreating ? "Guardando en BD..." : "Crear y Posicionar en Cubo 3D"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Crear Plan Quick-Win */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-bx shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1F242B] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C0D725]" />
                <h3 className="font-bold text-sm">Crear Plan Quick-Win (3.ª Línea de Defensa)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Título del Plan de Mitigación:</label>
                <textarea
                  rows={2}
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 text-xs focus:ring-1 focus:ring-[#3299A8] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Plazo Estimado (Días):</label>
                  <input
                    type="number"
                    value={planDays}
                    onChange={(e) => setPlanDays(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Presupuesto (MXN):</label>
                  <input
                    type="number"
                    value={planCost}
                    onChange={(e) => setPlanCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 text-[11px]">
                Este plan se registrará en la <strong>Matriz 2×2 de Priorización Quick-Wins</strong> vinculado a{" "}
                <span className="font-mono font-bold">{activeRisk?.code}</span> y a su nodo del diagrama.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreatePlan}
                  disabled={isCreatingPlan}
                  className="px-4 py-1.5 text-xs font-bold bg-[#3299A8] text-white rounded hover:bg-[#287d8a] shadow-sm disabled:opacity-50"
                >
                  {isCreatingPlan ? "Registrando..." : "Registrar Plan 3LD"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
