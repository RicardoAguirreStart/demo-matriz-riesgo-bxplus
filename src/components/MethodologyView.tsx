// src/components/MethodologyView.tsx
"use client";

import React, { useState, useEffect } from "react";
import { formatMXN, getZoneBadgeClasses } from "@/lib/utils";
import {
  calculateOperationalRiskMetrics,
  evaluateControlEffectiveness,
} from "@/lib/engines/operational-risk-engine";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  BookOpen,
  Shield,
  Layers,
  FileSpreadsheet,
  Cpu,
  Binary,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  Scale,
  Activity,
  Zap,
  Lock,
  GitBranch,
  ShieldAlert,
  Sliders,
  DollarSign,
  TrendingDown,
  Building2,
  Leaf,
  Wifi,
  FileText,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

interface MethodologyViewProps {
  onNavigateTab: (tab: string) => void;
}

export function MethodologyView({ onNavigateTab }: MethodologyViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "UNIVERSE" | "PILLARS" | "FORMULAS" | "GOVERNANCE" | "SANDBOX"
  >("UNIVERSE");
  const [selectedBlock, setSelectedBlock] = useState<"ALL" | "BLOCK_1" | "BLOCK_2" | "BLOCK_3">("ALL");
  const [conceptSearch, setConceptSearch] = useState("");
  const [riskCounts, setRiskCounts] = useState<Record<string, number>>({});

  // Sandbox Live Calculator State
  const [sandboxProb, setSandboxProb] = useState(3);
  const [sandboxImp, setSandboxImp] = useState(4);
  const [sandboxFormalized, setSandboxFormalized] = useState(false);
  const [sandboxTiming, setSandboxTiming] = useState<
    "ONLINE_REALTIME" | "DAILY_D1" | "WEEKLY_D7" | "MONTHLY_D30" | "OCCASIONAL"
  >("DAILY_D1");
  const [sandboxCoverage, setSandboxCoverage] = useState(3);
  const [sandboxRawEffectiveness, setSandboxRawEffectiveness] = useState(4);
  const [sandboxFreq, setSandboxFreq] = useState(0.8);
  const [sandboxAvgLoss, setSandboxAvgLoss] = useState(1500000);
  const [sandboxWorstLoss, setSandboxWorstLoss] = useState(6000000);

  // Fetch real risks to show live counters per taxonomy
  useEffect(() => {
    fetch("/api/risks")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.risks) {
          const counts: Record<string, number> = {};
          data.risks.forEach((r: any) => {
            const type = r.taxonomy?.riskType || "OPERATIONAL";
            counts[type] = (counts[type] || 0) + 1;
          });
          setRiskCounts(counts);
        }
      })
      .catch((err) => console.error("Error loading risks for methodology counts:", err));
  }, []);

  // Sandbox calculations using the real engine
  const sandboxMitigationFactor = evaluateControlEffectiveness({
    coverageLevel: sandboxCoverage,
    rawEffectiveness: sandboxRawEffectiveness,
    isFormalized: sandboxFormalized,
    executionTiming: sandboxTiming,
    hasValidEvidence: true,
  });

  const sandboxMetrics = calculateOperationalRiskMetrics({
    inherentProbability: sandboxProb,
    inherentImpact: sandboxImp,
    combinedControlFactor: sandboxMitigationFactor,
    annualFrequencyNet: sandboxFreq,
    avgFinancialImpactMXN: sandboxAvgLoss,
    worstCaseImpactMXN: sandboxWorstLoss,
  });

  // Effective coverage after applying CNBV Rule: if NF, cap at 2
  const effectiveCoverageApplied = sandboxFormalized
    ? Math.min(4, sandboxCoverage)
    : Math.min(2, sandboxCoverage);

  // 11 CNBV Taxonomies Catalog
  const riskCatalog = [
    // BLOQUE I: Cuantificables Discrecionales
    {
      code: "CREDIT",
      name: "Riesgo de Crédito y Concentración",
      block: "BLOCK_1",
      blockName: "Bloque I: Cuantificables Discrecionales",
      regulatoryBase: "CNBV CUB Anexo 15 Bis / NIF C-16 / Basilea III",
      summary:
        "Pérdidas potenciales derivadas del incumplimiento de acreditados comerciales, corporativos, pymes y productores del sector agropecuario.",
      subportfolios:
        "Cartera Comercial Empresarial (concentración sectorial), Cartera Agropecuaria B×+ (FIRA/FEGA, estacionalidad agrícola), Cartera PyME y Consumo.",
      methodologyNote:
        "Clasificación dinámica en Etapas 1, 2 y 3 de la NIF C-16. Descuento de colateral admisible (E*) y gatillo cualitativo por vulnerabilidad climática ASG.",
      exampleBx:
        "Deterioro en la capacidad de pago de acreditados agrícolas en Sinaloa y Sonora por sequía severa y caída en precios internacionales de granos básicos.",
    },
    {
      code: "LIQUIDITY",
      name: "Riesgo de Liquidez y Fondeo",
      block: "BLOCK_1",
      blockName: "Bloque I: Cuantificables Discrecionales",
      regulatoryBase: "Banxico Circular 3/2012 / Anexo 12-C CUB / LCR CCL",
      summary:
        "Incapacidad institucional de fondear compromisos exigibles o liquidar pasivos sin incurrir en pérdidas financieras o liquidación forzada de activos.",
      subportfolios:
        "Fondeo mayorista corporativo, depósitos a plazo, mercado de dinero y disponibilidad de colateral líquido de alta calidad (ALAC).",
      methodologyNote:
        "Monitoreo diario del Coeficiente de Cobertura de Liquidez (CCL >= 100%), brechas acumuladas a 30, 60 y 90 días (Gaps de Madurez) y severidad IDEL.",
      exampleBx:
        "Salida simultánea de depósitos de tesorería corporativa por vencimiento concentrado en fin de mes superior a $1,200 MDP en horizonte de 30 días.",
    },
    {
      code: "MARKET",
      name: "Riesgo de Mercado",
      block: "BLOCK_1",
      blockName: "Bloque I: Cuantificables Discrecionales",
      regulatoryBase: "CUB Título II Capítulo IV / VaR 99% / Basilea III",
      summary:
        "Pérdidas patrimoniales por variaciones desfavorables en factores de riesgo de mercado: curvas de tasas (TIIE, Cetes, Bonos M), tipo de cambio (USD/MXN) y sobretasas crediticias.",
      subportfolios:
        "Mesa de Dinero, Cartera de Negociación, Bonos Gubernamentales M, Derivados FX Swaps y coberturas de tasa.",
      methodologyNote:
        "Cálculo diario de VaR paramétrico y CVaR (Expected Shortfall) al 99% de confianza a 1 día, y evaluación de impacto en el ICAP (>= 10.5%).",
      exampleBx:
        "Aumento sorpresivo de 150 pb en la tasa de referencia Banxico (TIIE) que devalúa el valor de mercado del portafolio de bonos a tasa fija del banco.",
    },

    // BLOQUE II: Cuantificables No Discrecionales
    {
      code: "OPERATIONAL",
      name: "Riesgo Operacional de Procesos",
      block: "BLOCK_2",
      blockName: "Bloque II: Cuantificables No Discrecionales",
      regulatoryBase: "Anexo 1-D Bis CUB / Basilea II (7 Event Types)",
      summary:
        "Pérdidas por deficiencias o fallas en procesos internos, error humano, fraude interno/externo o eventos externos imprevistos.",
      subportfolios:
        "Originación, formalización de pagarés, administración de garantías en RUG/RPP, conciliación bancaria y facturación.",
      methodologyNote:
        "Evaluación cualitativa en Matriz 5x5, penalización por controles No Formalizados (NF) y cálculo trienal del Indicador de Negocio (IN = ILCT + CS + FC).",
      exampleBx:
        "Falta de inscripción oportuna de una hipoteca comercial en el Registro Público de la Propiedad, dejando el crédito en estatus quirografario sin aforo real.",
    },
    {
      code: "TECHNOLOGICAL",
      name: "Riesgo Tecnológico y Resiliencia",
      block: "BLOCK_2",
      blockName: "Bloque II: Cuantificables No Discrecionales",
      regulatoryBase: "Circular 8/2019 Banxico / CUB Art. 86 / Serie R24",
      summary:
        "Vulnerabilidades en infraestructura de TI, caídas del enlace SPEI, interrupción del Core Bancario, obsolescencia de hardware o fallas en proveedores de nube.",
      subportfolios:
        "Módulo SPEI de Banxico, Core Bancario T24, Banca Digital Móvil/Web, Red MPLS de sucursales y enlaces con Buró de Crédito.",
      methodologyNote:
        "Monitoreo de tiempos de indisponibilidad (RTO/RPO), latencia de colas MQ de pagos y arquitectura de respaldo en centro alterno (DRP).",
      exampleBx:
        "Desconexión del servicio de conexión con el participante SPEI durante 45 minutos en horario pico de liquidación de nóminas corporativas.",
    },
    {
      code: "LEGAL",
      name: "Riesgo Legal y Regulatorio",
      block: "BLOCK_2",
      blockName: "Bloque II: Cuantificables No Discrecionales",
      regulatoryBase: "Portafolio Global de Juicios CUB / Anexo 15 Bis",
      summary:
        "Pérdidas por resoluciones judiciales adversas, vicios de nulidad en contratos mercantiles, incumplimiento de cláusulas de crédito o sanciones de la CNBV y CONDUSEF.",
      subportfolios:
        "Juicios ejecutivos mercantiles de recuperación, litigios laborales, juicios de amparo y reclamaciones formales ante la autoridad.",
      methodologyNote:
        "Calificación de contingencia: Remota (<20% -> 0% reserva), Posible (20-50% -> 50% reserva + costas), Probable (>50% -> 100% reserva + costas).",
      exampleBx:
        "Demanda mercantil por supuesta aplicación indebida de comisiones de prepago en un crédito corporativo de $45 MDP con probabilidad de pérdida calificada como Posible.",
    },
    {
      code: "FRAUD_INTERNAL_EXTERNAL",
      name: "Riesgo de Fraude y PLD/FT",
      block: "BLOCK_2",
      blockName: "Bloque II: Cuantificables No Discrecionales",
      regulatoryBase: "Art. 115 Ley de Instituciones de Crédito / Anexo 12-E",
      summary:
        "Conductas delictivas de personal interno o terceros para apoderamiento ilícito de recursos, lavado de dinero, operaciones con recursos de procedencia ilícita o soborno.",
      subportfolios:
        "Operaciones inusuales, clientes PEP (Personas Políticamente Expuestas), transferencias internacionales de alto monto y suplantación de identidad en sucursales.",
      methodologyNote:
        "Identificación de banderas rojas (Red Flags Anexo 12-E), validación biométrica obligatoria en ventanilla y monitoreo transaccional automatizado en PLD.",
      exampleBx:
        "Intento de dispersión fraccionada (pitufeo) en cuentas de cheques de nueva apertura sin justificación económica acorde al perfil del cliente.",
    },

    // BLOQUE III: Emergentes y No Cuantificables
    {
      code: "CYBERSECURITY",
      name: "Ciberseguridad y Amenazas Digitales",
      block: "BLOCK_3",
      blockName: "Bloque III: Emergentes y No Cuantificables",
      regulatoryBase: "Anexos 64 Bis y 72 CUB / Guía de Ciberresiliencia CNBV",
      summary:
        "Ataques dirigidos a la confidencialidad, integridad y disponibilidad de la información bancaria: ransomware, exfiltración, credential stuffing y phishing con IA.",
      subportfolios:
        "Banca por Internet, Tokens móviles, Servidores perimetrales DMZ, Enlaces SWIFT y bases de datos con información sensible de clientes.",
      methodologyNote:
        "Monitoreo 24/7 por el SOC (Security Operations Center), autenticación multifactor (MFA FIDO2), pruebas de penetración y aislamiento de redes.",
      exampleBx:
        "Campaña de phishing avanzado con clonación de voz por IA dirigida al área de Pagos Internacionales para autorizar transferencias urgentes a cuentas fachada.",
    },
    {
      code: "ESG_CLIMATE",
      name: "Riesgo ASG y Cambio Climático",
      block: "BLOCK_3",
      blockName: "Bloque III: Emergentes y No Cuantificables",
      regulatoryBase: "Taxonomía Sostenible SHCP / CUB Art. 88 / Criterio DNSH",
      summary:
        "Impacto de riesgos físicos (sequías, inundaciones, ciclones) y de transición (descarbonización, impuestos al carbono) sobre la solvencia de acreditados y operaciones.",
      subportfolios:
        "Agronegocios, Transporte de Carga, Agroindustria, Energía Renovable y Proyectos Inmobiliarios.",
      methodologyNote:
        "Filtro de salvaguarda ambiental DNSH (Do No Significant Harm), índice de estrés hídrico CONAGUA y migración automática a Etapa 2 NIF C-16 si Score ASG >= 75.",
      exampleBx:
        "Agotamiento del acuífero y declaratoria de emergencia por sequía extrema en el Valle del Mayo, reduciendo un 40% el rendimiento de cosecha de trigo financiada por B×+.",
    },
    {
      code: "REPUTATIONAL",
      name: "Riesgo Reputacional",
      block: "BLOCK_3",
      blockName: "Bloque III: Emergentes y No Cuantificables",
      regulatoryBase: "Metodología Institucional Rimac / Escala 1 a 5 CUB",
      summary:
        "Percepción negativa pública que menoscaba la confianza de clientes, inversionistas, agencias calificadoras o autoridades supervisoras en la marca B×+.",
      subportfolios:
        "Redes sociales, medios financieros, quejas recurrentes ante CONDUSEF y notas adversas en reportes de agencias calificadoras.",
      methodologyNote:
        "Ponderación del 15% en el algoritmo de priorización Top 5-7. Escala de 1 a 5 (desde impacto local no mediático hasta cobertura nacional y daño institucional).",
      exampleBx:
        "Tendencia negativa viral en X (Twitter) derivada de una falla en banca móvil en día de quincena, afectando la percepción de confiabilidad del banco.",
    },
    {
      code: "STRATEGIC",
      name: "Riesgo Estratégico de Negocio",
      block: "BLOCK_3",
      blockName: "Bloque III: Emergentes y No Cuantificables",
      regulatoryBase: "CUB Art. 85 / Plan Estratégico Quinquenal Grupo B×+",
      summary:
        "Desviaciones en los objetivos del plan de negocio por cambios estructurales de mercado, adopción deficiente de tecnología, competencia FinTech o desalineación de metas.",
      subportfolios:
        "Nuevos productos de crédito digital, rentabilidad sobre capital (ROE/ROA), alianzas tecnológicas y apertura de nuevas sucursales patrimoniales.",
      methodologyNote:
        "Evaluación trimestral ante el Consejo de Administración y Comité de Riesgos (CAIR) comparando el presupuesto proyectado contra la ejecución real.",
      exampleBx:
        "Lanzamiento de una línea de crédito digital con absorción de mercado un 50% por debajo de lo proyectado debido a tasas más competitivas de competidores FinTech.",
    },
  ];

  // Glossary terms
  const glossaryTerms = [
    {
      term: "CUB (Circular Única de Bancos)",
      def: "Marco regulatorio rector emitido por la CNBV que establece las reglas prudenciales de capital, crédito, riesgos y control interno para las instituciones de banca múltiple en México.",
    },
    {
      term: "NIF C-16",
      def: "Norma de Información Financiera mexicana para el reconocimiento prospectivo de Pérdidas Crediticias Esperadas (PCE), clasificando créditos en Etapas 1 (vigente), 2 (SICR) y 3 (deterioro/vencida).",
    },
    {
      term: "PEA (Pérdida Esperada Anual)",
      def: "Monto monetario promedio estimado que el banco prevé absorber en su Estado de Resultados durante un ejercicio fiscal: PEA = Frecuencia (f) × Impacto Medio (I_medio).",
    },
    {
      term: "PMA (Pérdida Máxima Anual / VaR 99.9%)",
      def: "Escenario catastrófico de cola correspondiente al percentil 99.9% de la distribución de pérdidas, utilizado para evaluar la suficiencia de Capital Neto y el índice ICAP.",
    },
    {
      term: "SoD (Segregación de Funciones)",
      def: "Principio de control de la CUB (Art. 65 y 88) que prohíbe que el personal comercial de originación tenga facultades para autorizar créditos o dispersar fondos sin un control independiente.",
    },
    {
      term: "Control NF (No Formalizado)",
      def: "Control que opera en la práctica pero carece de documentación oficial en manuales o evidencia auditable. La regla institucional B×+ topa su efectividad en máximo 15% (Cobertura <= 2).",
    },
    {
      term: "CCL (Coeficiente de Cobertura de Liquidez)",
      def: "Métrica de Basilea III y Banxico que mide la proporción de Activos Líquidos Computables (ALAC) frente a las salidas netas de efectivo en un horizonte de 30 días de estrés (mínimo 100%).",
    },
    {
      term: "ICAP (Índice de Capitalización)",
      def: "Relación porcentual entre el Capital Neto del banco y sus Activos Ponderados por Riesgo (APRC + APRM + APRO). El mínimo regulatorio en México con suplementos es 10.5%.",
    },
    {
      term: "DNSH (Do No Significant Harm)",
      def: "Criterio de la Taxonomía Sostenible de la SHCP que exige que una actividad crediticia, aunque cumpla con metas climáticas, no dañe otros objetivos ambientales como la biodiversidad o el agua.",
    },
    {
      term: "E* (Exposición Ajustada por Colateral)",
      def: "Monto neto de exposición crediticia tras aplicar haircuts por aforo (He), volatilidad del colateral (Hc) y descalce de moneda (Hfx) sobre las garantías reales recibidas.",
    },
  ];

  const filteredCatalog = riskCatalog.filter((item) => {
    const matchesBlock = selectedBlock === "ALL" || item.block === selectedBlock;
    const matchesSearch =
      !conceptSearch ||
      item.name.toLowerCase().includes(conceptSearch.toLowerCase()) ||
      item.regulatoryBase.toLowerCase().includes(conceptSearch.toLowerCase()) ||
      item.summary.toLowerCase().includes(conceptSearch.toLowerCase()) ||
      item.exampleBx.toLowerCase().includes(conceptSearch.toLowerCase());
    return matchesBlock && matchesSearch;
  });

  const filteredGlossary = glossaryTerms.filter(
    (g) =>
      !conceptSearch ||
      g.term.toLowerCase().includes(conceptSearch.toLowerCase()) ||
      g.def.toLowerCase().includes(conceptSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full">
      {/* View Header */}
      <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900 font-serif leading-tight">
            Marco Teórico, Catálogo de Riesgos y Metodología Institucional
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed max-w-4xl">
            Manual Ejecutivo interactivo para el Comité de Administración Integral de Riesgos (CAIR), la UAIR, Auditoría Interna y la Comisión Nacional Bancaria y de Valores (CNBV).
          </p>
        </div>

        {/* Global Concept Search Bar */}
        <div className="flex items-center gap-2 bg-[#F5F7F9] border border-gray-300 rounded-lg px-3 py-1.5 min-w-[260px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar concepto (ej. CUB, NIF C-16, PEA, SoD, SPEI)..."
            value={conceptSearch}
            onChange={(e) => setConceptSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-xs text-gray-800 placeholder-gray-400"
          />
          {conceptSearch && (
            <button onClick={() => setConceptSearch("")} className="text-gray-400 hover:text-gray-600">
              <span className="text-xs font-bold font-mono">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 Main Sub-Section Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveSubTab("UNIVERSE")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === "UNIVERSE"
              ? "bg-[#1F242B] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#C0D725]" />
          <span>1. Universo de Riesgos (11 CNBV)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("PILLARS")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === "PILLARS"
              ? "bg-[#1F242B] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-[#3299A8]" />
          <span>2. Metodología Híbrida (5 Pilares)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("FORMULAS")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === "FORMULAS"
              ? "bg-[#1F242B] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Binary className="w-3.5 h-3.5 text-amber-500" />
          <span>3. Formulario Matemático Auditable</span>
        </button>

        <button
          onClick={() => setActiveSubTab("GOVERNANCE")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === "GOVERNANCE"
              ? "bg-[#1F242B] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
          <span>4. Ciclo de Vida & Gobernanza 3LD</span>
        </button>

        <button
          onClick={() => setActiveSubTab("SANDBOX")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === "SANDBOX"
              ? "bg-[#C0D725] text-[#1F242B] shadow-sm font-extrabold"
              : "bg-white text-gray-700 hover:bg-lime-50 border border-gray-300"
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-[#1F242B]" />
          <span>5. Calculadora en Vivo (Sandbox)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-SECCIÓN 1: UNIVERSO DE RIESGOS EVALUADOS EN BANCO B×+ */}
      {/* ========================================================================= */}
      {activeSubTab === "UNIVERSE" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          {/* Regulatory Blocks Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-bx border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700">Filtrar por Bloque CUB:</span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  onClick={() => setSelectedBlock("ALL")}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    selectedBlock === "ALL"
                      ? "bg-[#1F242B] text-white font-bold"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Todos (11 Categorías)
                </button>
                <button
                  onClick={() => setSelectedBlock("BLOCK_1")}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    selectedBlock === "BLOCK_1"
                      ? "bg-[#3299A8] text-white font-bold"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Bloque I: Discrecionales (Crédito, Mercado, Liquidez)
                </button>
                <button
                  onClick={() => setSelectedBlock("BLOCK_2")}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    selectedBlock === "BLOCK_2"
                      ? "bg-amber-600 text-white font-bold"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Bloque II: No Discrecionales (Operacional, TI, Legal, Fraude)
                </button>
                <button
                  onClick={() => setSelectedBlock("BLOCK_3")}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    selectedBlock === "BLOCK_3"
                      ? "bg-emerald-700 text-white font-bold"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Bloque III: Emergentes (Ciberseguridad, ASG, Reputacional, Estratégico)
                </button>
              </div>
            </div>

            <span className="text-xs text-gray-500 font-mono">
              Mostrando {filteredCatalog.length} de {riskCatalog.length} taxonomías
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map((item) => {
              const liveCount = riskCounts[item.code] || 0;
              return (
                <div
                  key={item.code}
                  className="bg-white rounded-bx p-4 shadow-card border border-gray-200 flex flex-col justify-between hover:border-[#3299A8] transition-all space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {item.regulatoryBase}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[3px] bg-cyan-50 text-[#3299A8] border border-cyan-200 uppercase tracking-wide">
                        {liveCount} en Matriz Viva
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 font-serif text-sm leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.summary}</p>

                    <div className="bg-[#F5F7F9] p-2.5 rounded text-[11px] space-y-1 border border-gray-100">
                      <div>
                        <strong className="text-gray-700">Sub-Portafolios B×+: </strong>
                        <span className="text-gray-600">{item.subportfolios}</span>
                      </div>
                      <div className="pt-1 border-t border-gray-200/60">
                        <strong className="text-[#3299A8]">Metodología Cuantitativa: </strong>
                        <span className="text-gray-600">{item.methodologyNote}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-500 border-l-2 border-[#C0D725] pl-2 py-0.5">
                      <strong>Caso Práctico B×+: </strong>
                      <span>{item.exampleBx}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {item.blockName.split(":")[0]}
                    </span>
                    <button
                      onClick={() => onNavigateTab("risks")}
                      className="text-xs font-bold text-[#3299A8] hover:text-[#277A87] flex items-center gap-1 group"
                    >
                      <span>Ver en Matriz Viva</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-SECCIÓN 2: LOS 5 PILARES DE LA METODOLOGÍA HÍBRIDA */}
      {/* ========================================================================= */}
      {activeSubTab === "PILLARS" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          <div className="bg-white rounded-bx p-4 border border-gray-200 text-xs text-gray-600 leading-relaxed">
            <strong className="text-gray-900 font-serif text-sm block mb-1">
              Arquitectura Metodológica Integrada B×+
            </strong>
            Esta herramienta fusiona la estricta regulación de la <strong>CUB de la CNBV</strong>, los estándares de capital de <strong>Basilea III</strong>, las provisiones prospectivas de la <strong>NIF C-16</strong>, las reglas de formalización de controles de la <strong>Metodología Rimac</strong> y el modelado de procesos por nodos de <strong>SMNYL</strong>. A continuación se desglosan los 5 pilares operativos:
          </div>

          <div className="space-y-4">
            {/* Pilar 1 */}
            <div className="bg-white rounded-bx p-5 shadow-card border-l-4 border-[#3299A8] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#3299A8] text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="font-bold text-gray-900 font-serif text-sm">
                    Pilar 1: Vinculación a Procesos Bancarios y Segregación de Funciones (SoD)
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-cyan-50 text-[#3299A8] px-2 py-0.5 rounded border border-cyan-200">
                  CUB Art. 65 & 88 • Metodología SMNYL
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Ningún riesgo se evalúa de manera abstracta. Todo evento se ancla obligatoriamente a una jerarquía estructurada: <strong>Línea de Negocio &rarr; Macroproceso &rarr; Proceso &rarr; Nodo del Diagrama</strong>. Esto permite identificar exactamente quién ejecuta la actividad, en qué sistema bancario reside (T24, SPEI, Mesa de Control) y si existe una estación de control preventivo antes de la materialización.
              </p>
              <div className="bg-[#F5F7F9] p-3 rounded text-xs space-y-2 border border-gray-200">
                <div className="font-bold text-gray-800">Regla Estricta de Segregación de Funciones (SoD):</div>
                <p className="text-gray-600">
                  El sistema bloquea e ilumina en rojo cualquier flujo donde el rol de <em>Promoción / Originación Comercial</em> se conecte directamente a la <em>Aprobación Facultada</em> o <em>Dispersión / Ejecución de Fondos</em> sin la intervención obligatoria de un <strong>Punto de Control Dual</strong> o una <strong>Mesa de Análisis de Riesgos</strong> de 2ª Línea.
                </p>
              </div>
            </div>

            {/* Pilar 2 */}
            <div className="bg-white rounded-bx p-5 shadow-card border-l-4 border-[#C0D725] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#1F242B] text-[#C0D725] flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="font-bold text-gray-900 font-serif text-sm">
                    Pilar 2: Matriz 5×5 Inherente vs. Residual y Zonas de Apetito al Riesgo (RAF)
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  Escala CNBV 1 a 25
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                El riesgo se valora primero en su estado <strong>Inherente</strong> (sin considerar controles) mediante el producto de su Probabilidad de Ocurrencia (1 a 5) y su Impacto Potencial (1 a 5). Posteriormente, al aplicar el <em>Factor Combinado de Mitigación de Controles</em>, se obtiene el <strong>Riesgo Residual</strong> gobernado por las 4 zonas del Marco de Apetito al Riesgo (RAF):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200">
                  <div className="font-bold text-emerald-800">Zona Verde (Score 1 a 5)</div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Dentro de Apetito. Operación bancaria normal con monitoreo trimestral.</p>
                </div>
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200">
                  <div className="font-bold text-amber-800">Zona Amarilla (Score 6 a 11)</div>
                  <p className="text-[11px] text-amber-700 mt-0.5">Tolerancia Preventiva. Notificación a la UAIR y reforzamiento de controles.</p>
                </div>
                <div className="p-2.5 rounded bg-orange-50 border border-orange-200">
                  <div className="font-bold text-orange-800">Zona Naranja (Score 12 a 15)</div>
                  <p className="text-[11px] text-orange-700 mt-0.5">Exceso de Tolerancia. Plan de Remediación firmado obligatorio en menos de 5 días.</p>
                </div>
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200">
                  <div className="font-bold text-rose-800">Zona Roja (Score 16 a 25)</div>
                  <p className="text-[11px] text-rose-700 mt-0.5">Transgresión Crítica. Escalamiento inmediato al CAIR y protocolo de contención.</p>
                </div>
              </div>
            </div>

            {/* Pilar 3 */}
            <div className="bg-white rounded-bx p-5 shadow-card border-l-4 border-amber-500 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h3 className="font-bold text-gray-900 font-serif text-sm">
                    Pilar 3: Reglas Estrictas de Efectividad de Controles y Formalización
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                  Metodología Rimac / Start Consulting
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Para erradicar la sobrestimación de controles que suele ocurrir en auditorías tradicionales, el motor algorítmico de la herramienta aplica dos reglas regulatorias infranqueables:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-1">
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Regla de Oro de Formalización (Controles NF)</span>
                  </div>
                  <p className="text-gray-600 text-[11px] leading-relaxed">
                    Si un control está clasificado como <strong>No Formalizado (NF)</strong> (carece de manual de operación aprobado por la Dirección o no tiene evidencia documental auditable), su calificación de Cobertura <strong>se topa automáticamente en máximo 2 (Se aplica ocasionalmente)</strong>, otorgando como máximo un 15% de mitigación real, impidiendo que un control informal disminuya artificialmente el riesgo.
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-1">
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-[#3299A8]" />
                    <span>Penalización por Oportunidad Temporal</span>
                  </div>
                  <p className="text-gray-600 text-[11px] leading-relaxed">
                    Los controles preventivos en tiempo real (d+0) tienen un techo de efectividad de 5 (Muy Alta). Los controles ex-post diarios (d+1) se topan en 4 (Alta); los semanales (d+7) en 3 (Media); y los mensuales (d+30) en 2 (Baja), reconociendo que mientras más tarde se detecte la falla, mayor es la exposición monetaria.
                  </p>
                </div>
              </div>
            </div>

            {/* Pilar 4 */}
            <div className="bg-white rounded-bx p-5 shadow-card border-l-4 border-indigo-600 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <h3 className="font-bold text-gray-900 font-serif text-sm">
                    Pilar 4: Cuantificación Monetaria Híbrida (PEA y PMA / VaR Operacional 99.9%)
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  Basilea II & III / CUB Anexo 12-A
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Una matriz de colores 5x5 es insuficiente para la toma de decisiones del Consejo de Administración. Por ello, la plataforma cuantifica el valor económico en pesos mexicanos (MXN) a través de dos dimensiones complementarias:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50/60 rounded border border-emerald-200 space-y-1">
                  <div className="font-bold text-emerald-900">Pérdida Esperada Anual (PEA)</div>
                  <div className="font-mono text-emerald-800 text-[11px]">PEA = Frecuencia (f) × Impacto Medio (I_medio)</div>
                  <p className="text-[11px] text-gray-600">
                    Es el costo ordinario previsible que impacta el Estado de Resultados y define el nivel de provisiones requeridas en el ejercicio anual.
                  </p>
                </div>
                <div className="p-3 bg-orange-50/60 rounded border border-orange-200 space-y-1">
                  <div className="font-bold text-orange-900">Pérdida Máxima Anual (PMA / VaR 99.9%)</div>
                  <div className="font-mono text-orange-800 text-[11px]">PMA = Cuantil Extremo (99.9%) / Escenario Catastrófico</div>
                  <p className="text-[11px] text-gray-600">
                    Es la pérdida severa en cola que compromete la solvencia del banco y debe estar respaldada por el Capital Neto regulatorio para preservar el ICAP.
                  </p>
                </div>
              </div>
            </div>

            {/* Pilar 5 */}
            <div className="bg-white rounded-bx p-5 shadow-card border-l-4 border-rose-500 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                    5
                  </div>
                  <h3 className="font-bold text-gray-900 font-serif text-sm">
                    Pilar 5: Algoritmo de Priorización Top 5–7 Críticos y Matriz Quick-Wins
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                  Dashboard Ejecutivo C-Level
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Para evitar la saturación de comités con cientos de riesgos menores, la plataforma ejecuta un <strong>algoritmo multicriterio determinista</strong> ponderado en 5 factores para rankear el Top 5 a 7 de riesgos críticos institucionales:
              </p>
              <div className="bg-[#F5F7F9] p-3 rounded text-xs grid grid-cols-2 sm:grid-cols-5 gap-2 text-center border">
                <div className="p-2 bg-white rounded border">
                  <div className="text-base font-bold font-mono text-gray-900">35%</div>
                  <div className="text-[10px] text-gray-500">Score Residual 5x5</div>
                </div>
                <div className="p-2 bg-white rounded border">
                  <div className="text-base font-bold font-mono text-orange-700">30%</div>
                  <div className="text-[10px] text-gray-500">Pérdida Máxima (PMA)</div>
                </div>
                <div className="p-2 bg-white rounded border">
                  <div className="text-base font-bold font-mono text-purple-700">15%</div>
                  <div className="text-[10px] text-gray-500">Impacto Reputacional</div>
                </div>
                <div className="p-2 bg-white rounded border">
                  <div className="text-base font-bold font-mono text-amber-700">10%</div>
                  <div className="text-[10px] text-gray-500">Controles NF o Sin Evidencia</div>
                </div>
                <div className="p-2 bg-white rounded border">
                  <div className="text-base font-bold font-mono text-rose-700">10%</div>
                  <div className="text-[10px] text-gray-500">Afectación SPEI / Ciberataque</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-SECCIÓN 3: FORMULARIO MATEMÁTICO AUDITABLE */}
      {/* ========================================================================= */}
      {activeSubTab === "FORMULAS" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div className="bg-white rounded-bx p-4 border border-gray-200 text-xs text-gray-600">
            <strong className="text-gray-900 font-serif text-sm block mb-0.5">
              Ecuaciones Maestras de los Motores Cuantitativos de B×+
            </strong>
            A continuación se presentan las 6 formulaciones analíticas implementadas en el código fuente (<code>src/lib/engines/*</code>) para verificación de auditores internos, externos y la CNBV:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fórmula 1: NIF C-16 */}
            <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 font-serif text-xs">
                  1. Mitigación de Colateral y Reserva NIF C-16
                </span>
                <span className="text-[10px] font-mono text-[#3299A8] bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                  credit-engine.ts
                </span>
              </div>
              <div className="bg-[#1F242B] text-gray-200 p-3 rounded font-mono text-[11px] space-y-1">
                <div className="text-[#C0D725]">
                  E* = max(0, E·(1 + He) - C·(1 - Hc - Hfx))
                </div>
                <div className="text-gray-300">
                  PCE_t = PI_t · SP_t · E*_t · D_t
                </div>
                <div className="text-gray-400 text-[10px]">
                  APRC = 1.06 · K_IRB · 12.5 · E*
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Donde <strong>E</strong> es la exposición bruta al incumplimiento, <strong>C</strong> el valor del colateral, <strong>He/Hc/Hfx</strong> los factores de descuento regulatorios, <strong>PI</strong> la probabilidad de incumplimiento y <strong>SP</strong> la severidad de pérdida.
              </p>
            </div>

            {/* Fórmula 2: Estrés Logístico */}
            <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 font-serif text-xs">
                  2. Modelo Logístico de Estrés Macroeconómico & ASG
                </span>
                <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  credit-engine.ts
                </span>
              </div>
              <div className="bg-[#1F242B] text-gray-200 p-3 rounded font-mono text-[11px] space-y-1">
                <div className="text-[#C0D725]">
                  PI_estresada = 1 / [1 + exp(-Z)]
                </div>
                <div className="text-gray-300 text-[10px]">
                  Z = α + β1·ΔTIIE + β2·ΔPIB + β3·Sequía_ASG + β4·ΔFX
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Permite proyectar el incremento no lineal en la cartera vencida ante caídas severas del PIB, alzas de tasa TIIE y sequías extremas registradas por CONAGUA en distritos de riego donde opera B×+.
              </p>
            </div>

            {/* Fórmula 3: Indicador de Negocio IN */}
            <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 font-serif text-xs">
                  3. Indicador de Negocio (IN) para Capital Operacional
                </span>
                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  operational-risk-engine.ts
                </span>
              </div>
              <div className="bg-[#1F242B] text-gray-200 p-3 rounded font-mono text-[11px] space-y-1">
                <div className="text-[#C0D725]">
                  IN = ILCT + CS + FC
                </div>
                <div className="text-gray-300 text-[10px]">
                  Capital_OP = IN_trienal_promedio · 12%
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Conforme al Anexo 1-D Bis de la CUB: <strong>ILCT</strong> es el componente de intereses, arrendamiento y dividendos; <strong>CS</strong> el componente de servicios y comisiones; y <strong>FC</strong> el componente financiero de negociación y balance.
              </p>
            </div>

            {/* Fórmula 4: Mercado y Liquidez */}
            <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 font-serif text-xs">
                  4. VaR de Mercado, Coeficiente CCL e ICAP
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  market-liquidity-engine.ts
                </span>
              </div>
              <div className="bg-[#1F242B] text-gray-200 p-3 rounded font-mono text-[11px] space-y-1">
                <div className="text-[#C0D725]">
                  VaR_99% = V0 · Z_0.99 · σ · √t
                </div>
                <div className="text-gray-300 text-[10px]">
                  CCL = ALAC / Salidas_Netas_30d &ge; 100%
                </div>
                <div className="text-gray-400 text-[10px]">
                  ICAP = Capital_Neto / (APRC + APRM + APRO) &ge; 10.5%
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Garantiza que el banco mantenga suficiente liquidez inmediata para resistir 30 días de estrés continuo y un índice de capitalización superior al mínimo de 10.5% con suplemento de conservación.
              </p>
            </div>

            {/* Fórmula 5: Juicios Legales */}
            <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 font-serif text-xs">
                  5. Reserva Ponderada para Portafolio de Juicios
                </span>
                <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                  CUB Título II Cap. V
                </span>
              </div>
              <div className="bg-[#1F242B] text-gray-200 p-3 rounded font-mono text-[11px] space-y-1">
                <div className="text-[#C0D725]">
                  Reserva = Monto_Reclamado · P_adversa + Gastos_Costas
                </div>
                <div className="text-gray-300 text-[10px]">
                  P_adversa: Remota (0%) | Posible (50%) | Probable (100%)
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Asigna provisiones contables obligatorias para demandas mercantiles y laborales según el dictamen formal del Área Jurídica Institucional de Banco B×+.
              </p>
            </div>

            {/* Fórmula 6: SHA-256 */}
            <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 font-serif text-xs">
                  6. Encadenamiento Criptográfico Inalterable SHA-256
                </span>
                <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  audit.ts
                </span>
              </div>
              <div className="bg-[#1F242B] text-gray-200 p-3 rounded font-mono text-[11px] space-y-1">
                <div className="text-[#C0D725]">
                  H_n = SHA-256(H_(n-1) || Ts || User || Role || Action || Data)
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Cada evento (alta de riesgo, firma de plan, importación de layout o aprobación) se sella en un bloque criptográficamente encadenado donde cualquier intento de manipulación en la base de datos invalida la cadena histórica ante la CNBV.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-SECCIÓN 4: GOBERNANZA DE 3 LÍNEAS DE DEFENSA & 4 VÍAS DE ALTA */}
      {/* ========================================================================= */}
      {activeSubTab === "GOVERNANCE" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          {/* 4 Ingestion Paths */}
          <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200 space-y-4">
            <div>
              <div className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
                Arquitectura de Captura
              </div>
              <h3 className="font-bold text-gray-900 font-serif text-sm">
                Las 4 Vías de Entrada de Riesgos a la Matriz Viva
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded bg-gray-50 border border-gray-200 space-y-1.5">
                <div className="w-7 h-7 rounded bg-[#3299A8] text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div className="font-bold text-gray-900">Vía 1: Diagramador de Procesos</div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Identificación in-situ directamente sobre el nodo operativo del flujo bancario donde ocurre la falla de control o la violación de Segregación de Funciones (SoD).
                </p>
                <button
                  onClick={() => onNavigateTab("flowchart")}
                  className="text-[10px] font-bold text-[#3299A8] hover:underline pt-1 block"
                >
                  Abrir Diagramador &rarr;
                </button>
              </div>

              <div className="p-3.5 rounded bg-gray-50 border border-gray-200 space-y-1.5">
                <div className="w-7 h-7 rounded bg-[#1F242B] text-[#C0D725] flex items-center justify-center font-bold">
                  2
                </div>
                <div className="font-bold text-gray-900">Vía 2: Formulario Causa-Evento-Efecto</div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Alta estructurada bajo la triada regulatoria de la CUB, asociando taxonomía oficial CNBV, probabilidades 1 a 5 y parámetros de pérdida monetaria.
                </p>
                <button
                  onClick={() => onNavigateTab("risks")}
                  className="text-[10px] font-bold text-[#3299A8] hover:underline pt-1 block"
                >
                  Ir al Formulario &rarr;
                </button>
              </div>

              <div className="p-3.5 rounded bg-gray-50 border border-gray-200 space-y-1.5">
                <div className="w-7 h-7 rounded bg-amber-600 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div className="font-bold text-gray-900">Vía 3: Importador de 4 Layouts</div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Carga masiva en archivos CSV/Excel con previsualización interactiva y validaciones normativas automáticas (Tope NF, Mora &ge; 90 días, Score ASG).
                </p>
                <button
                  onClick={() => onNavigateTab("importer")}
                  className="text-[10px] font-bold text-[#3299A8] hover:underline pt-1 block"
                >
                  Ir al Importador &rarr;
                </button>
              </div>

              <div className="p-3.5 rounded bg-gray-50 border border-gray-200 space-y-1.5">
                <div className="w-7 h-7 rounded bg-emerald-600 text-white flex items-center justify-center font-bold">
                  4
                </div>
                <div className="font-bold text-gray-900">Vía 4: Copiloto IA Gemini RAG</div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Detección proactiva de riesgos emergentes mediante auditoría de nodos con IA generativa, permitiendo anclarlos con 1 clic a la base de datos institucional.
                </p>
                <button
                  onClick={() => onNavigateTab("copilot")}
                  className="text-[10px] font-bold text-[#3299A8] hover:underline pt-1 block"
                >
                  Abrir Copiloto IA &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* 3 Lines of Defense Workflow */}
          <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200 space-y-3">
            <h3 className="font-bold text-gray-900 font-serif text-sm">
              Workflow Institucional de las 3 Líneas de Defensa (CUB Art. 88)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-1">
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                  1ª Línea: Dueños de Proceso
                </span>
                <div className="font-bold text-gray-900 mt-1">Registra (UNDER_REVIEW)</div>
                <p className="text-[11px] text-gray-600">
                  Las áreas operativas y de negocio identifican eventos y proponen controles. Los riesgos quedan en estado <em>En Revisión UAIR</em> sin afectar el cómputo oficial.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                  2ª Línea: UAIR / Riesgos
                </span>
                <div className="font-bold text-gray-900 mt-1">Valida y Publica (PUBLISHED)</div>
                <p className="text-[11px] text-gray-600">
                  La Unidad de Administración Integral de Riesgos verifica la triada, audita la formalización del control (F/NF) y publica en la Matriz Viva con sello SHA-256.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded">
                  3ª Línea: Auditoría Interna
                </span>
                <div className="font-bold text-gray-900 mt-1">Dictamen Independiente</div>
                <p className="text-[11px] text-gray-600">
                  Modo Solo Lectura estricto conforme a la CUB. Examina la consistencia de los modelos, la suficiencia de reservas y la inalterabilidad de la bitácora criptográfica.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-SECCIÓN 5: LABORATORIO / CALCULADORA PEDAGÓGICA EN VIVO */}
      {/* ========================================================================= */}
      {activeSubTab === "SANDBOX" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          <div className="bg-gradient-to-r from-lime-50 via-cyan-50 to-white rounded-bx p-4 border border-[#C0D725] text-xs text-gray-700 flex items-start gap-3">
            <Sliders className="w-5 h-5 text-[#1F242B] shrink-0 mt-0.5" />
            <div>
              <strong className="text-gray-900 font-bold block">
                Simulador Dinámico de Reglas Normativas (Pruébalo tú mismo)
              </strong>
              Mueve los controles interactivos para ver en tiempo real cómo opera el motor matemático de <code>operational-risk-engine.ts</code>. Observa cómo al desactivar la formalización del control (NF), el sistema topa automáticamente la cobertura a 2 e incrementa el impacto residual y la PEA.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Input Controls Panel */}
            <div className="lg:col-span-6 bg-white rounded-bx p-5 shadow-card border border-gray-200 space-y-4 text-xs">
              <h4 className="font-bold text-gray-900 font-serif text-sm border-b pb-2">
                Parámetros del Evento de Riesgo & Controles
              </h4>

              {/* Sliders Probabilidad e Impacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-gray-700">
                    <span>Probabilidad Inherente:</span>
                    <span className="font-mono text-base text-[#3299A8]">{sandboxProb} / 5</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={sandboxProb}
                    onChange={(e) => setSandboxProb(Number(e.target.value))}
                    className="w-full accent-[#3299A8] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>1: Rara</span>
                    <span>3: Moderada</span>
                    <span>5: Frecuente</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-gray-700">
                    <span>Impacto Inherente:</span>
                    <span className="font-mono text-base text-rose-600">{sandboxImp} / 5</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={sandboxImp}
                    onChange={(e) => setSandboxImp(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>1: Menor</span>
                    <span>3: Moderado</span>
                    <span>5: Crítico</span>
                  </div>
                </div>
              </div>

              {/* Switch de Formalización del Control (REGLA DE ORO) */}
              <div className="p-3.5 rounded-lg border-2 bg-[#F5F7F9] space-y-2 border-dashed border-gray-300">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 text-xs">
                    ¿Control Formalizado en Manual Institucional?
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSandboxFormalized(true)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        sandboxFormalized
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      Formalizado (F)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSandboxFormalized(false)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        !sandboxFormalized
                          ? "bg-amber-600 text-white shadow-sm"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      No Formalizado (NF)
                    </button>
                  </div>
                </div>

                {!sandboxFormalized && (
                  <div className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Regla CNBV Activa:</strong> Control No Formalizado detectado. Cobertura topada automáticamente a <strong>2 (Se aplica ocasionalmente)</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* Oportunidad Temporal */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 block">
                  Periodicidad / Oportunidad de Ejecución del Control:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  {[
                    { id: "ONLINE_REALTIME", label: "Tiempo Real (d+0)" },
                    { id: "DAILY_D1", label: "Diario (d+1)" },
                    { id: "WEEKLY_D7", label: "Semanal (d+7)" },
                    { id: "MONTHLY_D30", label: "Mensual (d+30)" },
                  ].map((timing) => (
                    <button
                      key={timing.id}
                      type="button"
                      onClick={() => setSandboxTiming(timing.id as any)}
                      className={`p-2 rounded border text-center transition-colors ${
                        sandboxTiming === timing.id
                          ? "bg-[#1F242B] text-white border-[#1F242B] font-bold"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {timing.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parámetros Monetarios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Frecuencia Anual (f):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={sandboxFreq}
                    onChange={(e) => setSandboxFreq(Number(e.target.value))}
                    className="w-full p-1.5 border rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Impacto Medio (I_medio MXN):</label>
                  <input
                    type="number"
                    value={sandboxAvgLoss}
                    onChange={(e) => setSandboxAvgLoss(Number(e.target.value))}
                    className="w-full p-1.5 border rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Peor Escenario (I_max MXN):</label>
                  <input
                    type="number"
                    value={sandboxWorstLoss}
                    onChange={(e) => setSandboxWorstLoss(Number(e.target.value))}
                    className="w-full p-1.5 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Results Live Calculation Display */}
            <div className="lg:col-span-6 bg-white rounded-bx p-5 shadow-card border-2 border-[#C0D725] space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-gray-900 font-serif text-sm">
                  Dictamen Cuantitativo en Tiempo Real
                </h4>
                <span className="text-[10px] font-mono bg-black/10 px-2 py-0.5 rounded font-bold text-gray-700">
                  Motor Algorítmico B×+
                </span>
              </div>

              {/* 5x5 Matrix Comparison */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-gray-50 rounded border">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Riesgo Inherente</div>
                  <div className="text-2xl font-bold font-mono text-gray-800 mt-1">
                    {sandboxMetrics.inherentScore}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    ({sandboxProb} × {sandboxImp}) — Zona {sandboxMetrics.inherentZone}
                  </div>
                </div>

                <div className="p-3 bg-cyan-50/50 rounded border border-cyan-200">
                  <div className="text-[10px] font-bold text-[#3299A8] uppercase">Riesgo Residual</div>
                  <div className="text-2xl font-bold font-mono text-[#3299A8] mt-1">
                    {sandboxMetrics.residualScore}
                  </div>
                  <div className="text-[11px] font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] border ${getZoneBadgeClasses(
                        sandboxMetrics.residualZone
                      )}`}
                    >
                      Zona {sandboxMetrics.residualZone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Monetary Calculations PEA & PMA */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded border space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">
                    Pérdida Esperada Anual (PEA)
                  </span>
                  <div className="text-lg font-bold font-mono text-emerald-800">
                    {formatMXN(sandboxMetrics.expectedAnnualLossPEA)}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Impacto directo estimado en el Estado de Resultados B×+.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded border space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">
                    Pérdida Máxima Anual (PMA)
                  </span>
                  <div className="text-lg font-bold font-mono text-orange-700">
                    {formatMXN(sandboxMetrics.maxAnnualLossPMA)}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    VaR Operacional 99.9% que consume Capital Neto e ICAP.
                  </p>
                </div>
              </div>

              {/* Mitigation Factors Breakdown */}
              <div className="bg-[#1F242B] text-gray-200 p-3.5 rounded-lg text-xs space-y-2">
                <div className="font-bold text-[#C0D725] text-xs">Desglose de Mitigación Algorítmica:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-gray-400">Cobertura Efectiva: </span>
                    <span className="text-white font-bold">{effectiveCoverageApplied} / 4</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Factor Combinado: </span>
                    <span className="text-[#C0D725] font-bold">
                      {(sandboxMitigationFactor * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Oportunidad Temporal: </span>
                    <span className="text-white">{sandboxTiming}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Estado Formalización: </span>
                    <span className={sandboxFormalized ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {sandboxFormalized ? "FORMALIZADO" : "NO FORMALIZADO (NF)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GLOSARIO & CONCEPTOS NORMATIVOS CNBV */}
      {/* ========================================================================= */}
      {filteredGlossary.length > 0 && (
        <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200 space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#3299A8]" />
            <h4 className="font-bold text-gray-900 font-serif text-sm">
              Glosario Normativo & Definiciones Regulatorias
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {filteredGlossary.map((g, idx) => (
              <div key={idx} className="p-3 bg-[#F5F7F9] rounded border border-gray-200 space-y-1">
                <div className="font-bold text-gray-900 font-serif">{g.term}</div>
                <p className="text-[11px] text-gray-600 leading-relaxed">{g.def}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
