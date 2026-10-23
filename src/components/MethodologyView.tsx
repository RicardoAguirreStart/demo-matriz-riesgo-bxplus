// src/components/MethodologyView.tsx
"use client";

import React, { useState, useEffect } from "react";
import { formatMXN, getZoneBadgeClasses } from "@/lib/utils";
import {
  calculateOperationalRiskMetrics,
  evaluateControlEffectiveness,
} from "@/lib/engines/operational-risk-engine";
import { CustomSelect, matchesFuzzyMultiWord } from "@/components/ui/CustomSelect";
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
  Gauge,
  Clock,
  Target,
  ShieldCheck,
  Box,
  Eye,
  Calculator,
} from "lucide-react";

interface MethodologyViewProps {
  onNavigateTab: (tab: string) => void;
}

export function MethodologyView({ onNavigateTab }: MethodologyViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "UNIVERSE" | "RAF_FRAMEWORK" | "EMERGING_CUBE" | "PILLARS" | "FORMULAS" | "GOVERNANCE" | "SANDBOX"
  >("UNIVERSE");
  const [selectedBlock, setSelectedBlock] = useState<"ALL" | "BLOCK_1" | "BLOCK_2" | "BLOCK_3">("ALL");
  const [conceptSearch, setConceptSearch] = useState("");
  const [riskCounts, setRiskCounts] = useState<Record<string, number>>({});

  // Emerging Risk Cube 3D & Visibility Gap Live Calculator State
  const [calcP, setCalcP] = useState(1);
  const [calcI, setCalcI] = useState(4);
  const [calcX, setCalcX] = useState(5);
  const [calcY, setCalcY] = useState(4);
  const [calcZ, setCalcZ] = useState(5);

  const calcScore2D = calcP * calcI;
  const calcV = calcX * calcY * calcZ;
  const calcVolNormTerm = 0.45 * (calcV / 125.0);
  const calcWeightedQuadNorm = (0.40 * calcX * calcX + 0.25 * calcY * calcY + 0.35 * calcZ * calcZ) / 25.0;
  const calcQuadWeightedTerm = 0.55 * calcWeightedQuadNorm;
  const calcConvexComb = calcVolNormTerm + calcQuadWeightedTerm;
  const calcGamma = calcX >= 4 && calcZ >= 4 ? 1.15 : 1.0;
  const calcT3D = Math.min(100.0, Math.round(calcConvexComb * 100.0 * calcGamma * 100) / 100);
  const calcS_eq = Math.round((calcT3D / 4.0) * 100) / 100;
  const calcDeltaVis = Math.round((calcS_eq - calcScore2D) * 100) / 100;

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
    const fullText = `${item.name} ${item.regulatoryBase} ${item.summary} ${item.exampleBx}`;
    const matchesSearch = matchesFuzzyMultiWord(fullText, conceptSearch);
    return matchesBlock && matchesSearch;
  });

  const filteredGlossary = glossaryTerms.filter((g) => {
    const fullText = `${g.term} ${g.def}`;
    return matchesFuzzyMultiWord(fullText, conceptSearch);
  });

  return (
    <div className="space-y-6 w-full">
      {/* View Header (Diseño Estándar B×+) */}
      <div className="bg-gradient-to-r from-[#1F242B] to-[#2B333E] text-white rounded-bx p-5 shadow-card border-l-4 border-[#C0D725] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-serif text-white tracking-tight">
            Marco Teórico, Catálogo de Riesgos y Metodología Institucional
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed max-w-4xl">
            Manual Ejecutivo interactivo para el Comité de Administración Integral de Riesgos (CAIR), la UAIR, Auditoría Interna y la Comisión Nacional Bancaria y de Valores (CNBV).
          </p>
        </div>

        {/* Global Concept Search Bar */}
        <div className="flex items-center gap-2 bg-[#2A313C] border border-gray-700 rounded-lg px-3 py-1.5 min-w-[260px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar concepto (ej. CUB, NIF C-16, PEA, SoD, SPEI)..."
            value={conceptSearch}
            onChange={(e) => setConceptSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-xs text-white placeholder-gray-400"
          />
          {conceptSearch && (
            <button onClick={() => setConceptSearch("")} className="text-gray-400 hover:text-white">
              <span className="text-xs font-bold font-mono">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 Main Sub-Section Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveSubTab("UNIVERSE")}
          className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === "UNIVERSE"
              ? "bg-[#1F242B] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#C0D725]" />
          <span>1. Universo de Riesgos (11 CNBV)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("RAF_FRAMEWORK")}
          className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === "RAF_FRAMEWORK"
              ? "bg-[#1F242B] text-white shadow-sm ring-1 ring-[#C0D725]"
              : "bg-white text-gray-700 hover:bg-lime-50 border border-gray-200 font-bold"
          }`}
        >
          <Gauge className="w-3.5 h-3.5 text-[#C0D725]" />
          <span>2. Marco RAF (Apetito al Riesgo CNBV)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("EMERGING_CUBE")}
          className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === "EMERGING_CUBE"
              ? "bg-[#1F242B] text-white shadow-sm ring-1 ring-[#3299A8]"
              : "bg-white text-gray-700 hover:bg-cyan-50 border border-gray-200 font-bold"
          }`}
        >
          <Box className="w-3.5 h-3.5 text-[#3299A8]" />
          <span>3. Cubo 3D Riesgos Emergentes (5×5×5)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("PILLARS")}
          className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === "PILLARS"
              ? "bg-[#1F242B] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-[#3299A8]" />
          <span>4. Metodología Híbrida (5 Pilares)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("FORMULAS")}
          className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === "FORMULAS"
              ? "bg-[#1F242B] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Binary className="w-3.5 h-3.5 text-amber-500" />
          <span>5. Formulario Matemático Auditable</span>
        </button>

        <button
          onClick={() => setActiveSubTab("GOVERNANCE")}
          className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === "GOVERNANCE"
              ? "bg-[#1F242B] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
          <span>6. Ciclo de Vida & Gobernanza 3LD</span>
        </button>

        <button
          onClick={() => setActiveSubTab("SANDBOX")}
          className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === "SANDBOX"
              ? "bg-[#C0D725] text-[#1F242B] shadow-sm font-extrabold"
              : "bg-white text-gray-700 hover:bg-lime-50 border border-gray-300"
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-[#1F242B]" />
          <span>7. Calculadora en Vivo (Sandbox)</span>
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
      {/* SUB-SECCIÓN NUEVA: MARCO RAF (APETITO AL RIESGO CNBV - ART. 67, 68, 88 CUB) */}
      {/* ========================================================================= */}
      {activeSubTab === "RAF_FRAMEWORK" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#1F242B] via-[#2A313C] to-[#1F242B] text-white rounded-bx p-6 shadow-card border-l-4 border-[#C0D725] space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-[#C0D725] text-[#1F242B] px-2 py-0.5 rounded uppercase tracking-wider">
                    Gobernanza CNBV & Basilea III
                  </span>
                  <span className="text-xs text-gray-300 font-mono">
                    Circular Única de Bancos (CUB) • Artículos 67, 68 y 88
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-bold font-serif text-white">
                  Marco de Apetito al Riesgo (Risk Appetite Framework — RAF)
                </h3>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded border border-white/10 text-xs">
                <Gauge className="w-4 h-4 text-[#C0D725]" />
                <span className="text-gray-200 font-medium">Aprobación Anual Consejo de Administración</span>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed max-w-4xl">
              El <strong>Marco RAF</strong> es el conjunto integral de políticas, procesos, controles y límites prudenciales aprobados de forma indelegable por el Consejo de Administración de Banco Ve por Más (B×+). Define con precisión matemática el nivel de riesgo agregado y específico que la institución está dispuesta a asumir en la consecución de sus objetivos de negocio (Apetito), la desviación temporal que puede absorber sin comprometer su viabilidad (Tolerancia) y el límite máximo infranqueable antes de vulnerar los requerimientos legales de la CNBV y Banco de México (Capacidad).
            </p>
          </div>

          {/* Pilares Normativos CUB / Basilea III / FSB */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-cyan-50 text-[#3299A8]">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xs font-serif">
                    CUB Art. 67 & 68 (CNBV)
                  </h4>
                  <span className="text-[10px] text-gray-500 font-mono">Gobernanza & Aprobación</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Establece la estructura indelegable de supervisión: el Consejo de Administración aprueba el Apetito y los límites de exposición; el CAIR vigila su cumplimiento mensual; y la UAIR monitorea desviaciones en tiempo real con plena independencia de las líneas de negocio.
              </p>
            </div>

            <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-lime-50 text-[#1F242B]">
                  <ShieldCheck className="w-4 h-4 text-[#8BA816]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xs font-serif">
                    CUB Art. 88 (Independencia 3LD)
                  </h4>
                  <span className="text-[10px] text-gray-500 font-mono">2ª y 3ª Línea de Defensa</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Exige que la UAIR (2ª Línea) supervise de forma autónoma el cumplimiento de los límites y que la Dirección de Auditoría Interna (3ª Línea) valide de manera periódica que los motores de cálculo, las pruebas de estrés y la bitácora inalterable operen con rigor técnico.
              </p>
            </div>

            <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-slate-100 text-slate-700">
                  <BookOpen className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xs font-serif">
                    Estándares FSB & Basilea III
                  </h4>
                  <span className="text-[10px] text-gray-500 font-mono">Principles for Effective RAF</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Dicta la integración simbiótica entre el Apetito Cuantitativo (coeficientes de solvencia ICAP ≥ 10.5%, liquidez CCL ≥ 100%, apalancamiento) y el Apetito Cualitativo (cero tolerancia a brechas cibernéticas en SPEI, corrupción o riesgos reputacionales).
              </p>
            </div>
          </div>

          {/* LOS 4 ESCALONES JERÁRQUICOS ("EL VELOCÍMETRO PRUDENCIAL") */}
          <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
                  Arquitectura Prudencial Escalonada
                </span>
                <h3 className="text-base font-bold text-gray-900 font-serif">
                  Los 4 Escalones Jerárquicos del Marco RAF (&quot;El Velocímetro Prudencial&quot;)
                </h3>
              </div>
              <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded">
                Art. 68 Frac. III CUB
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Nivel 1: Apetito */}
              <div className="bg-gradient-to-b from-emerald-50/70 to-white rounded-lg p-4 border-2 border-emerald-400 shadow-sm flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">
                      NIVEL 1
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                      Score 5×5: 1 a 5
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm font-serif">
                    🟢 Apetito al Riesgo
                  </h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Nivel y composición del riesgo que Banco B×+ acepta asumir de manera voluntaria y ordinaria para generar valor y rentabilidad sustentable.
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded border border-emerald-200 text-[11px] space-y-1">
                  <strong className="text-emerald-800 block text-[10px] uppercase tracking-wide">
                    Protocolo de Gestión:
                  </strong>
                  <p className="text-gray-600">
                    Monitoreo ordinario trimestral por la UAIR. Operación ordinaria de los Dueños del Proceso (1ª Línea) sin requerir planes extraordinarios.
                  </p>
                </div>
              </div>

              {/* Nivel 2: Alerta Temprana */}
              <div className="bg-gradient-to-b from-amber-50/70 to-white rounded-lg p-4 border-2 border-amber-400 shadow-sm flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-amber-500 text-white px-2 py-0.5 rounded">
                      NIVEL 2
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                      Score 5×5: 6 a 11
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm font-serif">
                    🟡 Alerta Temprana
                  </h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Señal preventiva (<em>Early Warning Indicator</em>) de que un indicador o proceso se está desviando del apetito hacia la frontera de tolerancia.
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded border border-amber-200 text-[11px] space-y-1">
                  <strong className="text-amber-800 block text-[10px] uppercase tracking-wide">
                    Protocolo de Gestión:
                  </strong>
                  <p className="text-gray-600">
                    Notificación automática a la UAIR (2ª Línea) y al Dueño del Proceso (1ª Línea) para ajuste preventivo y calibración inmediata de controles.
                  </p>
                </div>
              </div>

              {/* Nivel 3: Tolerancia */}
              <div className="bg-gradient-to-b from-orange-50/70 to-white rounded-lg p-4 border-2 border-orange-500 shadow-sm flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-orange-600 text-white px-2 py-0.5 rounded">
                      NIVEL 3
                    </span>
                    <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded border border-orange-200">
                      Score 5×5: 12 a 15
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm font-serif">
                    🟠 Tolerancia al Riesgo
                  </h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Desviación máxima admisible temporalmente bajo condiciones adversas o volatilidad sin poner en riesgo la continuidad de la operación del banco.
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded border border-orange-200 text-[11px] space-y-1">
                  <strong className="text-orange-800 block text-[10px] uppercase tracking-wide">
                    Protocolo Obligatorio CUB:
                  </strong>
                  <p className="text-gray-700 font-semibold">
                    Plan de Acción obligatorio firmado por el Titular de Negocio en ≤ 5 días hábiles, con seguimiento quincenal en CAIR.
                  </p>
                </div>
              </div>

              {/* Nivel 4: Capacidad */}
              <div className="bg-gradient-to-b from-rose-50/70 to-white rounded-lg p-4 border-2 border-rose-500 shadow-sm flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-rose-600 text-white px-2 py-0.5 rounded">
                      NIVEL 4
                    </span>
                    <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                      Score 5×5: 16 a 25
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm font-serif">
                    🔴 Capacidad / Límite CNBV
                  </h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Techo absoluto de exposición que el banco puede absorber antes de transgredir los mínimos legales de capitalización o liquidez regulatoria.
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded border border-rose-200 text-[11px] space-y-1">
                  <strong className="text-rose-800 block text-[10px] uppercase tracking-wide">
                    Protocolo de Escalamiento:
                  </strong>
                  <p className="text-rose-900 font-semibold">
                    Escalamiento inmediato a CAIR, Director General y Consejo de Administración; activación de contingencia y freno de colocación.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TABLA MAESTRA EN VIVO DE UMBRALES DEL MARCO RAF (BANCO B×+) */}
          <div className="bg-white rounded-bx shadow-card border border-gray-200 overflow-hidden">
            <div className="bg-[#1F242B] text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-bold font-serif">
                  Tabla Maestra de Umbrales Prudenciales del Marco RAF — Banco B×+
                </h3>
                <p className="text-[11px] text-gray-300 mt-0.5">
                  Calibración oficial conforme al CUB de la CNBV, Banco de México y Basilea III
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#C0D725] text-[#1F242B] px-2.5 py-1 rounded uppercase tracking-wider">
                Vigencia 2026
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7F9] text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Dimensión Prudencial</th>
                    <th className="py-3 px-4">Base Regulatoria</th>
                    <th className="py-3 px-4 text-center bg-emerald-50/50 text-emerald-900">🟢 Apetito (Verde)</th>
                    <th className="py-3 px-4 text-center bg-amber-50/50 text-amber-900">🟡 Alerta Preventiva (Amarillo)</th>
                    <th className="py-3 px-4 text-center bg-orange-50/50 text-orange-900">🟠 Tolerancia (Naranja)</th>
                    <th className="py-3 px-4 text-center bg-rose-50/50 text-rose-900">🔴 Capacidad / Límite (Rojo)</th>
                    <th className="py-3 px-4 text-center">Estatus Actual B×+</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* ICAP */}
                  <tr className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div>Índice de Capitalización (ICAP)</div>
                      <span className="text-[10px] text-gray-400 font-normal">Capital Neto / APR Totales</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600 text-[11px]">
                      CUB Art. 2 Bis 1 • Basilea III
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700 bg-emerald-50/30">
                      ≥ 13.5%
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-amber-700 bg-amber-50/30">
                      12.0% – 13.4%
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-orange-700 bg-orange-50/30">
                      10.8% – 11.9%
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-700 bg-rose-50/30">
                      &lt; 10.5% (Mínimo CNBV)
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        14.20% (Apetito)
                      </span>
                    </td>
                  </tr>

                  {/* CET1 */}
                  <tr className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div>Capital Fundamental (CET1)</div>
                      <span className="text-[10px] text-gray-400 font-normal">Capital Común Tier 1 / APR</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600 text-[11px]">
                      CUB Anexo 1-O • Basilea III
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700 bg-emerald-50/30">
                      ≥ 10.5%
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-amber-700 bg-amber-50/30">
                      8.5% – 10.4%
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-orange-700 bg-orange-50/30">
                      7.1% – 8.4%
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-700 bg-rose-50/30">
                      &lt; 7.0% (Límite Legal)
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        11.15% (Apetito)
                      </span>
                    </td>
                  </tr>

                  {/* CCL */}
                  <tr className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div>Cobertura de Liquidez (CCL 30D)</div>
                      <span className="text-[10px] text-gray-400 font-normal">ALAC / Salidas Netas a 30 Días</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600 text-[11px]">
                      Circular 3/2012 Banxico / LCR
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700 bg-emerald-50/30">
                      ≥ 120.0%
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-amber-700 bg-amber-50/30">
                      110.0% – 119.9%
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-orange-700 bg-orange-50/30">
                      100.0% – 109.9%
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-700 bg-rose-50/30">
                      &lt; 100.0% (Transgresión)
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        148.5% (Apetito)
                      </span>
                    </td>
                  </tr>

                  {/* VaR */}
                  <tr className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div>Riesgo de Mercado (VaR 99% 1D)</div>
                      <span className="text-[10px] text-gray-400 font-normal">Pérdida Máxima Diaria Cartera Neg.</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600 text-[11px]">
                      CUB Título II Cap. IV
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700 bg-emerald-50/30">
                      ≤ $15.0M MXN
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-amber-700 bg-amber-50/30">
                      $15.1M – $22.0M
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-orange-700 bg-orange-50/30">
                      $22.1M – $30.0M
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-700 bg-rose-50/30">
                      &gt; $30.0M MXN (Techo)
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        $18.4M (Preventivo)
                      </span>
                    </td>
                  </tr>

                  {/* SPEI */}
                  <tr className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div>Disponibilidad SPEI</div>
                      <span className="text-[10px] text-gray-400 font-normal">Uptime mensual infraestructura pagos</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600 text-[11px]">
                      Circular 8/2019 Banxico
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700 bg-emerald-50/30">
                      ≥ 99.90%
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-amber-700 bg-amber-50/30">
                      99.50% – 99.89%
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-orange-700 bg-orange-50/30">
                      99.00% – 99.49%
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-700 bg-rose-50/30">
                      &lt; 99.00% (Incidente)
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        99.88% (Preventivo)
                      </span>
                    </td>
                  </tr>

                  {/* Matriz 5x5 */}
                  <tr className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div>Matriz 5×5 (Riesgos de Procesos)</div>
                      <span className="text-[10px] text-gray-400 font-normal">Score Residual P_res × I_res</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600 text-[11px]">
                      CUB Art. 65 • Metodología B×+
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700 bg-emerald-50/30">
                      1 – 5 pts
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-amber-700 bg-amber-50/30">
                      6 – 11 pts
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-orange-700 bg-orange-50/30">
                      12 – 15 pts (Plan ≤ 5d)
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-700 bg-rose-50/30">
                      16 – 25 pts (CAIR)
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                        Evaluación Continua
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CONEXIÓN INTERACTIVA CON EL RESTO DE LA HERRAMIENTA */}
          <div className="bg-white rounded-bx p-5 shadow-card border border-gray-200 space-y-4">
            <div>
              <span className="text-[10px] font-mono text-[#3299A8] uppercase tracking-wider font-bold">
                Ecosistema Integrado B×+
              </span>
              <h3 className="text-base font-bold text-gray-900 font-serif">
                Conexión Operativa del Marco RAF con los Módulos de la Plataforma
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                El Marco RAF gobierna automáticamente el comportamiento de las alertas, la matriz de procesos y la formalización de mitigaciones:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Dashboard C-Level */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-xs">
                    <Activity className="w-4 h-4 text-[#3299A8]" />
                    <span>Dashboard C-Level & Velocímetro</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Monitorea en tiempo real los medidores prudenciales (ICAP, CET1, CCL, VaR, SPEI). Cualquier indicador que cruce a zona amarilla o naranja dispara alertas push en el widget flotante institucional.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab("dashboard")}
                  className="bg-[#1F242B] hover:bg-[#2A313C] text-white text-xs font-bold py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors self-start"
                >
                  <span>Abrir Dashboard C-Level</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C0D725]" />
                </button>
              </div>

              {/* Card 2: Matriz 5x5 por Proceso */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-xs">
                    <Layers className="w-4 h-4 text-[#C0D725]" />
                    <span>Matriz 5×5 por Proceso & Nodos</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Analiza la matriz 5×5 específica de cada proceso del banco o visualiza el mosaico comparativo de todos los procesos lado a lado, con trazabilidad directa nodo por nodo.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab("heatmap")}
                  className="bg-[#1F242B] hover:bg-[#2A313C] text-white text-xs font-bold py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors self-start"
                >
                  <span>Ver Matriz 5×5 por Proceso</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C0D725]" />
                </button>
              </div>

              {/* Card 3: Planes de Acción & Quick-Wins */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-xs">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Planes de Acción & Cuadrante Quick-Wins</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Garantiza el cumplimiento del protocolo RAF: los riesgos en zona de tolerancia exigen planes de acción inmediatos firmados en ≤ 5 días hábiles y sellados con hash SHA-256.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab("plans")}
                  className="bg-[#1F242B] hover:bg-[#2A313C] text-white text-xs font-bold py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors self-start"
                >
                  <span>Ir a Planes & Quick-Wins</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C0D725]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-SECCIÓN 3: CUBO 3D DE RIESGOS EMERGENTES (5x5x5) & MOTOR PYTHON */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SUB-SECCIÓN 3: CUBO 3D DE RIESGOS EMERGENTES (5x5x5) & FORMALIZACIÓN MATEMÁTICA */}
      {/* ========================================================================= */}
      {activeSubTab === "EMERGING_CUBE" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Banner de Presentación y Justificación Estratégica */}
          <div className="bg-gradient-to-r from-[#1F242B] via-[#2A313C] to-[#1F242B] rounded-bx p-5 text-white shadow-md border border-gray-700">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#3299A8] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
                    Innovación Metodológica B×+
                  </span>
                  <span className="bg-white/10 text-gray-200 text-[10px] font-mono px-2 py-0.5 rounded">
                    🐍 Motor Determinista Python 3D • 125 Vóxeles
                  </span>
                  <span className="bg-[#C0D725]/20 text-[#C0D725] text-[10px] font-bold px-2 py-0.5 rounded border border-[#C0D725]/30">
                    CNBV CUB Art. 88 & Basilea III
                  </span>
                  <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30">
                    Rigor Matemático en ℝ³
                  </span>
                </div>
                <h3 className="text-xl font-serif font-bold text-white tracking-tight">
                  Marco Matemático Formal: Matriz Cúbica Tridimensional (5×5×5) y Gestión Paralela (2D vs. 3D)
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Superación cuantitativa del sesgo frecuentista tradicional mediante el modelado ortogonal de 
                  <strong className="text-white"> Contagio Sistémico (Eje X)</strong>, 
                  <strong className="text-white"> Incertidumbre Epistémica (Eje Y)</strong> y 
                  <strong className="text-white"> Velocidad de Materialización / Dynamic Onset (Eje Z)</strong>, 
                  resolviendo matemáticamente el efecto de punto ciego mediante el cálculo determinista del Tensor de Tensión (T_3D) y la Brecha de Visibilidad (Δ_vis).
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row items-stretch lg:items-center gap-2.5">
                <button
                  onClick={() => onNavigateTab("emerging-cube")}
                  className="bg-[#C0D725] hover:bg-[#a8bd1e] text-[#1F242B] font-bold text-xs py-2.5 px-4 rounded-bx shadow-sm flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                >
                  <Box className="w-4 h-4 text-[#1F242B]" />
                  <span>Ir a Matriz Cúbica 3D en Vivo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 1: ESPACIO DE ESTADOS RETICULAR & VOLUMEN CÚBICO BRUTO */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-bx p-5 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#3299A8]" />
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Sección 1 — Espacio de Estados Reticular en ℝ³ y Métrica Volumétrica Discreta (V)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                |S| = 125 Vóxeles Ortogonales
              </span>
            </div>

            <div className="text-xs text-gray-700 leading-relaxed space-y-3">
              <p>
                El universo de amenazas emergentes y sistémicas en Banco B×+ se formaliza como un retículo discreto acotado en el espacio euclidiano tridimensional ℝ³:
              </p>

              <div className="bg-[#1F242B] text-gray-100 p-3.5 rounded font-mono text-xs border border-gray-800 flex items-center justify-between">
                <span className="text-[#C0D725] font-bold">
                  {"S = { (X, Y, Z) ∈ ℕ³ | 1 ≤ X, Y, Z ≤ 5 }"}
                </span>
                <span className="text-gray-400 text-[10px]">
                  dim(S) = 3 • Cardinalidad: 5 × 5 × 5 = 125
                </span>
              </div>

              {/* Definición de los 3 Ejes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
                {/* Eje X */}
                <div className="border border-blue-200 rounded p-3.5 bg-blue-50/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-blue-900 tracking-wider">
                      Eje X • Contagio Sistémico
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                      X ∈ [1, 5]
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-snug">
                    Cuantifica el radio de dispersión de daño interbancario, correlación de caída con otras líneas de negocio o entidades externas y consumo potencial del Capital Neto Regulatorio.
                  </p>
                  <div className="space-y-1 pt-1 text-[10px] font-mono">
                    <div className="p-1.5 rounded bg-white border border-blue-100 flex justify-between items-center">
                      <span className="font-bold text-gray-800">1. Aislado / Local:</span>
                      <span className="text-gray-500">&lt; 0.25% Cap. Neto</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-blue-100 flex justify-between items-center">
                      <span className="font-bold text-gray-800">2. Acotado a Proceso:</span>
                      <span className="text-gray-500">0.25% – 0.75% Cap.</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-blue-100 flex justify-between items-center">
                      <span className="font-bold text-gray-800">3. Inter-Procesos:</span>
                      <span className="text-gray-500">0.75% – 2.0% Cap.</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-blue-100 flex justify-between items-center">
                      <span className="font-bold text-gray-800">4. Transversal B×+:</span>
                      <span className="text-gray-500">2.0% – 5.0% Cap.</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-blue-100 flex justify-between items-center">
                      <span className="font-bold text-rose-700">5. Sistémico / BCP:</span>
                      <span className="text-rose-600 font-bold">&gt; 5.0% Cap. Neto</span>
                    </div>
                  </div>
                </div>

                {/* Eje Y */}
                <div className="border border-purple-200 rounded p-3.5 bg-purple-50/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-purple-900 tracking-wider">
                      Eje Y • Incertidumbre Epistémica
                    </span>
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                      Y ∈ [1, 5]
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-snug">
                    Reemplaza la probabilidad frecuentista tradicional. Mide la carencia de series empíricas previas, falta de modelos predictivos calibrados y ambigüedad causa-efecto (*Deep Uncertainty*).
                  </p>
                  <div className="space-y-1 pt-1 text-[10px] font-mono">
                    <div className="p-1.5 rounded bg-white border border-purple-100 flex justify-between items-center">
                      <span className="font-bold text-gray-800">1. Conocido / Predecible:</span>
                      <span className="text-gray-500">Series temporales robustas</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-purple-100 flex justify-between items-center">
                      <span className="font-bold text-gray-800">2. Incertidumbre Baja:</span>
                      <span className="text-gray-500">Documentado en sector</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-purple-100 flex justify-between items-center">
                      <span className="font-bold text-gray-800">3. Moderada:</span>
                      <span className="text-gray-500">Proxies preliminares</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-purple-100 flex justify-between items-center">
                      <span className="font-bold text-gray-800">4. Alta Ambigüedad:</span>
                      <span className="text-gray-500">Sin precedentes en B×+</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-purple-100 flex justify-between items-center">
                      <span className="font-bold text-rose-700">5. Cisne Negro:</span>
                      <span className="text-rose-600 font-bold">Ignorancia radical</span>
                    </div>
                  </div>
                </div>

                {/* Eje Z */}
                <div className="border border-amber-200 rounded p-3.5 bg-amber-50/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-900 tracking-wider">
                      Eje Z • Velocidad (Onset Speed)
                    </span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                      Z ∈ [1, 5]
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-snug">
                    Evalúa la dinámica temporal intrínseca d(Impacto)/dt y el tiempo transcurrido desde el primer síntoma detectable hasta el impacto total en balance (*Lead Time* de respuesta).
                  </p>
                  <div className="space-y-1 pt-1 text-[10px] font-mono">
                    <div className="p-1.5 rounded bg-white border border-amber-100 flex justify-between items-center">
                      <span className="font-bold text-gray-800">1. Muy Lenta:</span>
                      <span className="text-gray-500">&gt; 6 meses (Comités)</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-amber-100 flex justify-between items-center">
                      <span className="font-bold text-gray-800">2. Gradual:</span>
                      <span className="text-gray-500">1 a 6 meses (Táctico)</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-amber-100 flex justify-between items-center">
                      <span className="font-bold text-gray-800">3. Rápida:</span>
                      <span className="text-gray-500">1 a 4 sem. (Extraord.)</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-amber-100 flex justify-between items-center">
                      <span className="font-bold text-amber-800">4. Aguda:</span>
                      <span className="text-amber-700 font-bold">4 a 72 horas (Crisis)</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-amber-100 flex justify-between items-center">
                      <span className="font-bold text-rose-700">5. Instantánea:</span>
                      <span className="text-rose-600 font-bold">&lt; 4 horas (Kill-Switch)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Métrica de Volumen y Limitación Hiperbólica */}
              <div className="p-4 rounded border border-gray-200 bg-gray-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    Forma Multilineal Simétrica y Limitación de las Superficies de Nivel Hiperbólicas
                  </span>
                  <span className="text-[10px] font-mono text-[#3299A8] font-bold">
                    V = X · Y · Z ∈ [1, 125]
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  El volumen cúbico V(X, Y, Z) = X · Y · Z es una forma multilineal simétrica donde V(λX, Y, Z) = λV(X, Y, Z) y V es invariante bajo cualquier permutación de ejes. Sin embargo, las superficies de nivel V(X, Y, Z) = C son hiperboloides asintóticos a los planos coordenados. Esta propiedad matemática intrínseca genera un grave defecto de subestimación cuando dos ejes alcanzan niveles catastróficos pero el tercero es mínimo.
                </p>

                {/* Contraejemplo Demostrativo */}
                <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Demostración del Contraejemplo Formal (Por qué el Volumen no es suficiente):</span>
                  </div>
                  <p>
                    Supóngase un riesgo con <strong>Contagio Sistémico Máximo (X = 5)</strong>, <strong>Velocidad Instantánea (Z = 5)</strong> y <strong>Baja Incertidumbre (Y = 1, amenaza conocida)</strong>:
                  </p>
                  <p className="font-mono font-bold text-amber-950">
                    V = 5 × 1 × 5 = 25 &nbsp;⟹&nbsp; 25 / 125 = 20.0% (Calificado falsamente como riesgo moderado/verde en volumen puro)
                  </p>
                  <p className="text-gray-700">
                    Un colapso sistémico instantáneo obtendría apenas el 20% de volumen. Por esta razón matemática, el sistema B×+ <strong>no evalúa únicamente el volumen</strong>, sino que construye el <strong>Tensor Compuesto de Tensión Tridimensional (T_3D)</strong> mediante combinación convexa y norma cuadrática.
                  </p>
                </div>
              </div>

              {/* 8 Familias de Riesgos Emergentes B×+ */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Taxonomía Oficial: 8 Familias de Riesgos Emergentes en Banco B×+</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-white border border-gray-200">
                    <strong className="text-gray-900 block">1. Concentración Nube</strong>
                    <span className="text-[10px] text-gray-500">Dependencia de hiper-escaladores</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-gray-200">
                    <strong className="text-gray-900 block">2. Ciberataques IA</strong>
                    <span className="text-[10px] text-gray-500">Ransomware destructivo y zero-day</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-gray-200">
                    <strong className="text-gray-900 block">3. Fraude Sintético</strong>
                    <span className="text-[10px] text-gray-500">Deepfakes biométricos y bypass KYC</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-gray-200">
                    <strong className="text-gray-900 block">4. Contagio Sistémico</strong>
                    <span className="text-[10px] text-gray-500">Efecto dominó hacia solvencia/ICAP</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-gray-200">
                    <strong className="text-gray-900 block">5. Terceros / 4th Parties</strong>
                    <span className="text-[10px] text-gray-500">Vulnerabilidades en proveedores</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-gray-200">
                    <strong className="text-gray-900 block">6. Climático ESG</strong>
                    <span className="text-[10px] text-gray-500">Estrés hídrico en cartera agro</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-gray-200">
                    <strong className="text-gray-900 block">7. Liquidez Digital</strong>
                    <span className="text-[10px] text-gray-500">Corridas 24/7 vía redes y SPEI</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-gray-200">
                    <strong className="text-gray-900 block">8. Modelos e IA Drift</strong>
                    <span className="text-[10px] text-gray-500">Alucinación y sesgo algorítmico</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 2: TENSOR DE TENSIÓN TRIDIMENSIONAL COMPUESTO (T_3D) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-bx p-5 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Binary className="w-5 h-5 text-[#C0D725]" />
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Sección 2 — Tensor de Tensión Tridimensional Compuesto (T_3D) y Homologación (S_eq)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-[#3299A8] font-bold">
                T_3D ∈ [0, 100] • S_eq ∈ [1, 25]
              </span>
            </div>

            <div className="text-xs text-gray-700 leading-relaxed space-y-3">
              <p>
                Para resolver las limitaciones de las superficies hiperbólicas y penalizar de forma convexa los desbalances extremos, se formula el <strong>Índice Compuesto de Tensión Tridimensional (T_3D)</strong> como una combinación convexa de densidad volumétrica y norma euclidiana cuadrática ponderada, modulada por un factor de sinergia no lineal:
              </p>

              {/* Ecuación Maestra */}
              <div className="bg-[#1F242B] text-gray-100 p-4 rounded-bx font-mono text-xs border border-gray-800 space-y-2">
                <div className="text-[#C0D725] font-bold text-sm">
                  {"T_3D = min( 100.0, [ 0.45 · (V / 125) + 0.55 · ( ‖R⃗‖_W² / 25 ) ] · 100 · γ(X, Z) )"}
                </div>
                <div className="text-gray-300 text-[11px]">
                  {"donde ‖R⃗‖_W² = w_x·X² + w_y·Y² + w_z·Z²  con  w_x = 0.40, w_y = 0.25, w_z = 0.35"}
                </div>
              </div>

              {/* Los 4 Componentes Analíticos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Componente A */}
                <div className="p-3.5 rounded border border-gray-200 bg-gray-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">
                      Componente A: Métrica Volumétrica Normalizada
                    </span>
                    <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                      0.45 × (V / 125)
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Aporta el <strong>45% del peso base</strong>. Cuantifica el acoplamiento global y simultáneo de las tres dimensiones. Si las tres variables son altas, el término volumétrico escala exponencialmente hacia 0.45.
                  </p>
                </div>

                {/* Componente B */}
                <div className="p-3.5 rounded border border-gray-200 bg-gray-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">
                      Componente B: Norma Cuadrática Ponderada
                    </span>
                    <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">
                      0.55 × (‖R⃗‖_W² / 25)
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Aporta el <strong>55% del peso base</strong>. Pondera baricéntricamente los cuadrados de cada coordenada: w_x = 0.40 (Contagio), w_z = 0.35 (Velocidad) y w_y = 0.25 (Incertidumbre), con ∑ w_i = 1.0.
                  </p>
                </div>

                {/* Componente C */}
                <div className="p-3.5 rounded border border-gray-200 bg-gray-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">
                      Componente C: Factor de Sinergia Crítica OODA (γ)
                    </span>
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                      {"γ(X, Z) ∈ {1.00, 1.15}"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Modela la amplificación no lineal destructiva del <strong>+15%</strong> cuando X ≥ 4 ∧ Z ≥ 4. Ocurre cuando la velocidad del ataque o choque relámpago supera la capacidad de respuesta del <strong>ciclo OODA (*Observe, Orient, Decide, Act*)</strong> institucional.
                  </p>
                </div>

                {/* Componente D */}
                <div className="p-3.5 rounded border border-gray-200 bg-gray-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">
                      Componente D: Operador de Proyección y Homologación (S_eq)
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      S_eq = round(T_3D / 4.0, 2)
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    El operador de saturación min(100, ·) acota el tensor en [0, 100]. La proyección afín S_eq ≈ T_3D / 4.0 homologa el valor en la escala regulatoria de la matriz CNBV [1, 25] para el cálculo exacto de la Brecha de Visibilidad.
                  </p>
                </div>
              </div>

              {/* Tres Recuadros Explicativos Fundamentales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded border border-indigo-200 bg-indigo-50/40 text-[11px] space-y-1">
                  <strong className="text-indigo-900 block font-bold">
                    ¿Por qué términos al cuadrado (X², Y², Z²)?
                  </strong>
                  <p className="text-gray-700 leading-snug">
                    La norma cuadrática euclidiana actúa como una función de energía potencial. La penalización cuadrática evita que un nivel 5 se diluya: si X=5, su contribución es 5² = 25, aportando 10 puntos completos al numerador y dominando el tensor frente a ejes con valor 1.
                  </p>
                </div>

                <div className="p-3 rounded border border-indigo-200 bg-indigo-50/40 text-[11px] space-y-1">
                  <strong className="text-indigo-900 block font-bold">
                    Justificación de los Pesos (wx &gt; wz &gt; wy):
                  </strong>
                  <p className="text-gray-700 leading-snug">
                    En instituciones de crédito bajo Basilea III, el colapso procede del contagio sistémico (w_x = 0.40) y de la incapacidad de ejecutar medidas de resolución ante corridas relámpago (w_z = 0.35). La incertidumbre (w_y = 0.25) amplifica la varianza pero no genera insolvencia inmediata por sí sola.
                  </p>
                </div>

                <div className="p-3 rounded border border-indigo-200 bg-indigo-50/40 text-[11px] space-y-1">
                  <strong className="text-indigo-900 block font-bold">
                    Normalización Exacta sobre 25:
                  </strong>
                  <p className="text-gray-700 leading-snug">
                    En el vértice extremal (5, 5, 5), ‖R⃗‖_W² = 0.40(25) + 0.25(25) + 0.35(25) = 25.0. Al dividir entre 25, la norma queda rigurosamente acotada en el intervalo cerrado [0.04, 1.00], asegurando convexidad matemática perfecta.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 3: ÁLGEBRA VECTORIAL DE MITIGACIÓN Y ART. 88 CUB */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-bx p-5 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Sección 3 — Álgebra Vectorial de Mitigación y Reglas Regulatorias (CNBV Art. 88 CUB)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Operador de Traslación Vectorial
              </span>
            </div>

            <div className="text-xs text-gray-700 leading-relaxed space-y-3">
              <p>
                A diferencia de los modelos 2D que aplican un porcentaje genérico y difuso sobre el impacto, el sistema de Banco B×+ modela la mitigación como una <strong>traslación vectorial en el espacio de estados</strong> mediante un operador de proyección:
              </p>

              {/* Formulación Vectorial */}
              <div className="bg-[#1F242B] text-gray-100 p-4 rounded-bx font-mono text-xs border border-gray-800 space-y-2">
                <div className="text-[#C0D725] font-bold">
                  {"R⃗_res = max( [ 1.0, 1.0, 1.0 ]ᵀ, R⃗_inh - ΔR⃗_efectivo )"}
                </div>
                <div className="text-gray-300 text-[11px]">
                  {"donde R⃗_inh = [ X_inh, Y_inh, Z_inh ]ᵀ  y  ΔR⃗_efectivo = [ ΔX, ΔY, ΔZ ]ᵀ  con Δu_j ∈ [0.0, 2.5]"}
                </div>
              </div>

              {/* Desacoplamiento de Ejes por Tipología de Control */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded border border-gray-200 bg-gray-50/50 space-y-1.5">
                  <strong className="text-blue-900 font-bold block">
                    ΔX: Desacoplamiento de Contagio (Eje X)
                  </strong>
                  <p className="text-[11px] text-gray-600">
                    Mitigado exclusivamente por controles de arquitectura resiliente: <em>segmentación de red, arquitectura BCP multiregión, aislamiento de colaterales y desconexión programada de APIs</em>.
                  </p>
                </div>

                <div className="p-3 rounded border border-gray-200 bg-gray-50/50 space-y-1.5">
                  <strong className="text-purple-900 font-bold block">
                    ΔY: Desacoplamiento de Incertidumbre (Eje Y)
                  </strong>
                  <p className="text-[11px] text-gray-600">
                    Mitigado por <em>sensores KRI de telemetría continua, Threat Intelligence feeds externos, pruebas de estrés bayesianas y modelos predictivos de dispersión de pérdida</em>.
                  </p>
                </div>

                <div className="p-3 rounded border border-gray-200 bg-gray-50/50 space-y-1.5">
                  <strong className="text-amber-900 font-bold block">
                    ΔZ: Desacoplamiento de Velocidad (Eje Z)
                  </strong>
                  <p className="text-[11px] text-gray-600">
                    Mitigado únicamente por <em>mecanismos autónomos en tiempo real: playbooks SOAR automáticos, kill-switches algorítmicos y reglas preventivas en pasarela de pagos</em>.
                  </p>
                </div>
              </div>

              {/* Reglas Normativas Cruciales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Condición de Falla en Velocidad */}
                <div className="p-3.5 rounded border border-rose-200 bg-rose-50/50 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Condición de Falla en Velocidad (Z ≥ 4 sin Controles en Línea):</span>
                  </div>
                  <p className="text-[11px] text-gray-700 leading-relaxed">
                    Si un riesgo tiene velocidad crítica (Z_inh ≥ 4, materialización en menos de 72 horas) y sus controles son manuales, comités periódicos o firmas diferidas (<code>executionTiming !== "ONLINE_REALTIME"</code> o <code>automation !== "AUTOMATED"</code>), formalmente:
                  </p>
                  <p className="font-mono font-bold text-rose-900 text-xs bg-white p-2 rounded border border-rose-200">
                    {"ΔZ = 0.0  (Inoperancia Matemática de Controles Humanos ante Choques Relámpago)"}
                  </p>
                </div>

                {/* Truncamiento Art. 88 CUB */}
                <div className="p-3.5 rounded border border-amber-200 bg-amber-50/50 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Truncamiento por Control No Formalizado (Art. 88 CUB):</span>
                  </div>
                  <p className="text-[11px] text-gray-700 leading-relaxed">
                    Conforme a la CUB de la CNBV, si un control carece de manual formalizado o evidencia documental válida auditada por 2LD (<code>!isFormalized || !hasValidEvidence</code>), su capacidad de absorción nominal se degrada al 20%:
                  </p>
                  <p className="font-mono font-bold text-amber-900 text-xs bg-white p-2 rounded border border-amber-200">
                    {"Δu_j,efectivo = min( Δu_j,nominal, 2.0 × 0.20 ) = min( Δu_j,nominal, 0.40 )"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 4: ZONIFICACIÓN TOPOLÓGICA DEL CUBO (125 VÓXELES) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-bx p-5 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-600" />
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Sección 4 — Zonificación Topológica y Partición del Espacio de 125 Vóxeles
                </h4>
              </div>
              <span className="text-[11px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                4 Regiones Conexas • Cota Cúbica V = 64
              </span>
            </div>

            <div className="text-xs text-gray-700 leading-relaxed space-y-3">
              <p>
                El espacio S se particiona en cuatro subconjuntos conexos disjuntos gobernados por condiciones booleanas rigurosas, garantizando que amenazas con extrema criticidad en cualquiera de sus ejes no sean clasificadas en zonas verdes o amarillas:
              </p>

              {/* Tabla de Zonificación Topológica */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-gray-200 text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                      <th className="p-2.5 border border-gray-200">Zona Topológica</th>
                      <th className="p-2.5 border border-gray-200">Condición Booleana Exacta</th>
                      <th className="p-2.5 border border-gray-200">Rango Tensor T_3D</th>
                      <th className="p-2.5 border border-gray-200">Mandato de Gobernanza (CUB Art. 88)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-rose-50/70">
                      <td className="p-2.5 border border-gray-200 font-bold text-rose-800">
                        🔴 Crítica Sistémica (RED)
                      </td>
                      <td className="p-2.5 border border-gray-200 font-mono text-[11px] text-rose-950 font-bold">
                        {"V ≥ 64 ∨ (X ≥ 4 ∧ Z ≥ 4) ∨ T_3D ≥ 68.0"}
                      </td>
                      <td className="p-2.5 border border-gray-200 font-mono text-rose-900">
                        T_3D ≥ 68.0 (S_eq ≥ 17.0)
                      </td>
                      <td className="p-2.5 border border-gray-200 text-gray-800">
                        Activación inmediata de BCP, escalamiento urgente al CAIR y sesión extraordinaria de Consejo.
                      </td>
                    </tr>
                    <tr className="bg-amber-50/70">
                      <td className="p-2.5 border border-gray-200 font-bold text-amber-800">
                        🟠 Alerta Temprana (ORANGE)
                      </td>
                      <td className="p-2.5 border border-gray-200 font-mono text-[11px] text-amber-950">
                        {"(36 ≤ V < 64 ∨ X = 5 ∨ Z = 5) ∧ ¬RED"}
                      </td>
                      <td className="p-2.5 border border-gray-200 font-mono text-amber-900">
                        45.0 ≤ T_3D &lt; 68.0
                      </td>
                      <td className="p-2.5 border border-gray-200 text-gray-800">
                        Excede la tolerancia institucional del RAF. Requiere plan de acción Quick-Win de 3LD a 30 días.
                      </td>
                    </tr>
                    <tr className="bg-yellow-50/70">
                      <td className="p-2.5 border border-gray-200 font-bold text-yellow-800">
                        🟡 Vigilancia / Incubación (YELLOW)
                      </td>
                      <td className="p-2.5 border border-gray-200 font-mono text-[11px] text-yellow-950">
                        {"(15 ≤ V < 36 ∨ T_3D ≥ 30.0) ∧ ¬RED ∧ ¬ORANGE"}
                      </td>
                      <td className="p-2.5 border border-gray-200 font-mono text-yellow-900">
                        30.0 ≤ T_3D &lt; 45.0
                      </td>
                      <td className="p-2.5 border border-gray-200 text-gray-800">
                        Amenaza en incubación o con velocidad moderada. Asignación de sensores KRI con reporte quincenal.
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/70">
                      <td className="p-2.5 border border-gray-200 font-bold text-emerald-800">
                        🟢 Latente / Controlada (GREEN)
                      </td>
                      <td className="p-2.5 border border-gray-200 font-mono text-[11px] text-emerald-950">
                        {"V < 15 ∧ T_3D < 30.0"}
                      </td>
                      <td className="p-2.5 border border-gray-200 font-mono text-emerald-900">
                        T_3D &lt; 30.0 (S_eq &lt; 7.5)
                      </td>
                      <td className="p-2.5 border border-gray-200 text-gray-800">
                        Dentro del apetito de riesgo emergente bajo control operativo ordinario de la 1ra Línea de Defensa.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Fundamentación Teórica de la Cota Cúbica y Forzamiento Disyuntivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-3.5 rounded border border-gray-200 bg-gray-50/50 space-y-1.5">
                  <strong className="text-gray-900 font-bold block">
                    Fundamento Matemático de la Cota Cúbica V = 64 (4³ = 64):
                  </strong>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    El valor 64 marca el punto crítico de transición de fase. Corresponde al volumen del subcubo de orden superior (X ≥ 4, Y ≥ 4, Z ≥ 4), donde la convergencia simultánea de los tres factores detona un acoplamiento catastrófico no amortiguable.
                  </p>
                </div>

                <div className="p-3.5 rounded border border-gray-200 bg-gray-50/50 space-y-1.5">
                  <strong className="text-gray-900 font-bold block">
                    Regla de Forzamiento Disyuntivo ∨ (X = 5 ∨ Z = 5):
                  </strong>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Evita que eventos con contagio sistémico catastrófico (X=5) o velocidad relámpago instantánea (Z=5) caigan en Zona Verde debido a un volumen bajo provocado por Y=1. Todo evento con X=5 o Z=5 escala inmediatamente al menos a Zona Naranja.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 5: BRECHA DE VISIBILIDAD, DEMOSTRACIÓN CANÓNICA & CALCULADORA */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-bx p-5 border border-gray-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-600" />
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Sección 5 — El Efecto Punto Ciego (Brecha 2D vs. 3D), Demostración Canónica y Calculadora Interactiva
                </h4>
              </div>
              <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Δ_vis = S_eq(3D) - Score_2D
              </span>
            </div>

            <div className="text-xs text-gray-700 leading-relaxed space-y-4">
              <p>
                La <strong>Brecha de Visibilidad (Δ_vis)</strong> cuantifica el grado de miopía o subestimación regulatoria originada por evaluar un riesgo emergente exclusivamente bajo la matriz bidimensional frecuentista (P × I):
              </p>

              <div className="bg-[#1F242B] text-gray-100 p-3.5 rounded font-mono text-xs border border-gray-800 flex items-center justify-between">
                <span className="text-[#C0D725] font-bold text-sm">
                  {"Δ_vis = S_eq(3D) - Score_2D = ( T_3D / 4.0 ) - ( P_res · I_res )"}
                </span>
                <span className="text-gray-400 text-[10px]">
                  Alerta Punto Ciego: si Δ_vis ≥ +5.0 puntos
                </span>
              </div>

              {/* Demostración Paso a Paso del Caso Canónico */}
              <div className="p-4 rounded border border-purple-200 bg-purple-50/30 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                  <span className="font-bold text-purple-950 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-700" />
                    <span>Demostración Paso a Paso del Caso Canónico Documentado (Ataque Destructivo a SPEI)</span>
                  </span>
                  <span className="text-[10px] font-mono bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded">
                    Δ_vis = +20.74 Puntos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                  <div className="bg-white p-3 rounded border border-purple-100 space-y-1.5">
                    <strong className="text-gray-900 block font-bold">1. Evaluación en Matriz Clásica 2D (CNBV):</strong>
                    <p className="text-gray-600">
                      Como no existe antecedente histórico reciente en el banco, el evaluador asigna <strong>Probabilidad P = 1 (Remota)</strong> e <strong>Impacto I = 4 (Crítico)</strong>:
                    </p>
                    <p className="font-mono font-bold text-emerald-700 pt-1">
                      Score_2D = 1 × 4 = 4.0 / 25 ➔ Zona Verde (Riesgo Aceptable / Monitoreo Anual)
                    </p>
                    <p className="text-gray-500 text-[10px]">
                      Conclusión 2D: La institución no asigna capital, no activa BCP y descarta inversión en kill-switch.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded border border-purple-100 space-y-1.5">
                    <strong className="text-gray-900 block font-bold">2. Evaluación en Cubo 3D de Riesgos Emergentes:</strong>
                    <p className="text-gray-600">
                      Coordenadas reales: <strong>Contagio X = 5</strong> (colapso de liquidación interbancaria), <strong>Incertidumbre Y = 4</strong> (ciberarma zero-day), <strong>Velocidad Z = 5</strong> (propagación en 15 minutos):
                    </p>
                    <div className="font-mono text-[10px] text-gray-800 space-y-0.5 pt-1">
                      <p>• Volumen: V = 5 × 4 × 5 = 100</p>
                      <p>• Aporte Volumétrico: 0.45 × (100 / 125) = <strong>0.3600</strong></p>
                      <p>• ‖R⃗‖_W² = 0.40(25) + 0.25(16) + 0.35(25) = 10 + 4 + 8.75 = 22.75</p>
                      <p>• Aporte Cuadrático: 0.55 × (22.75 / 25) = <strong>0.5005</strong></p>
                      <p>• Combinación Convexa = 0.3600 + 0.5005 = <strong>0.8605</strong></p>
                      <p>• Factor OODA: Como X=5 ≥ 4 y Z=5 ≥ 4 ⟹ <strong>γ = 1.15</strong></p>
                      <p>• Tensor: T_3D = min(100, 0.8605 × 100 × 1.15) = <strong>98.96</strong></p>
                      <p>• Score Homologado: S_eq = 98.96 / 4.0 = <strong>24.74 / 25 (Zona Roja Crítica)</strong></p>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-rose-100 border border-rose-200 text-rose-950 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span><strong>Ecuación de Brecha de Visibilidad:</strong> Δ_vis = S_eq(3D) - Score_2D = 24.74 - 4.00</span>
                  <span className="bg-rose-700 text-white font-bold px-2 py-0.5 rounded text-xs">
                    Δ_vis = +20.74 (PUNTO CIEGO LETAL)
                  </span>
                </div>
              </div>

              {/* CALCULADORA INTERACTIVA EN VIVO */}
              <div className="border-2 border-[#3299A8]/40 rounded-bx p-4 bg-gradient-to-b from-gray-50 to-white shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-[#3299A8]" />
                    <div>
                      <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wide">
                        Laboratorio Cuantitativo Interactivo: Calculadora en Vivo de Brecha de Visibilidad (Δ_vis)
                      </h5>
                      <span className="text-[11px] text-gray-500">
                        Ajusta los sliders de la Matriz 2D y el Cubo 3D para auditar la respuesta del motor en tiempo real:
                      </span>
                    </div>
                  </div>

                  {/* Botones de Presets */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => {
                        setCalcP(1);
                        setCalcI(4);
                        setCalcX(5);
                        setCalcY(4);
                        setCalcZ(5);
                      }}
                      className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold px-2 py-1 rounded transition-colors"
                    >
                      Caso Canónico (Δ = +20.74)
                    </button>
                    <button
                      onClick={() => {
                        setCalcP(1);
                        setCalcI(5);
                        setCalcX(5);
                        setCalcY(1);
                        setCalcZ(5);
                      }}
                      className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2 py-1 rounded transition-colors"
                    >
                      Choque Relámpago (X=5, Z=5)
                    </button>
                    <button
                      onClick={() => {
                        setCalcP(1);
                        setCalcI(1);
                        setCalcX(1);
                        setCalcY(1);
                        setCalcZ(1);
                      }}
                      className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold px-2 py-1 rounded transition-colors"
                    >
                      Vóxel Mínimo (1,1,1)
                    </button>
                    <button
                      onClick={() => {
                        setCalcP(5);
                        setCalcI(5);
                        setCalcX(5);
                        setCalcY(5);
                        setCalcZ(5);
                      }}
                      className="text-[10px] bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold px-2 py-1 rounded transition-colors"
                    >
                      Vóxel Máximo (5,5,5)
                    </button>
                  </div>
                </div>

                {/* Sliders de Entrada */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Controles 2D */}
                  <div className="bg-white p-3.5 rounded border border-gray-200 space-y-3">
                    <span className="font-bold text-gray-900 text-xs block border-b border-gray-100 pb-1">
                      Parámetros de Entrada Matriz Tradicional 2D (P × I):
                    </span>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-gray-700">Probabilidad 2D (P):</span>
                        <span className="font-mono font-bold text-gray-900">{calcP} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={calcP}
                        onChange={(e) => setCalcP(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3299A8]"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-gray-700">Impacto 2D (I):</span>
                        <span className="font-mono font-bold text-gray-900">{calcI} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={calcI}
                        onChange={(e) => setCalcI(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3299A8]"
                      />
                    </div>
                  </div>

                  {/* Controles 3D */}
                  <div className="bg-white p-3.5 rounded border border-gray-200 space-y-3">
                    <span className="font-bold text-gray-900 text-xs block border-b border-gray-100 pb-1">
                      Parámetros de Entrada Cubo Tridimensional 3D (X, Y, Z):
                    </span>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-blue-800">Contagio Sistémico (X):</span>
                        <span className="font-mono font-bold text-blue-900">{calcX} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={calcX}
                        onChange={(e) => setCalcX(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-purple-800">Incertidumbre Epistémica (Y):</span>
                        <span className="font-mono font-bold text-purple-900">{calcY} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={calcY}
                        onChange={(e) => setCalcY(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-amber-800">Velocidad / Onset Speed (Z):</span>
                        <span className="font-mono font-bold text-amber-900">{calcZ} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={calcZ}
                        onChange={(e) => setCalcZ(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Tarjetas de Resultados Reactivos en Vivo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Score 2D */}
                  <div className="p-3 rounded border border-gray-200 bg-white space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase font-mono block">
                      Matriz Clásica 2D
                    </span>
                    <div className="text-xl font-bold font-mono text-gray-900">
                      {calcScore2D} <span className="text-xs font-normal text-gray-500">/ 25</span>
                    </div>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        calcScore2D >= 15
                          ? "bg-rose-100 text-rose-800"
                          : calcScore2D >= 10
                          ? "bg-amber-100 text-amber-800"
                          : calcScore2D >= 6
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {calcScore2D >= 15
                        ? "Zona Roja"
                        : calcScore2D >= 10
                        ? "Zona Naranja"
                        : calcScore2D >= 6
                        ? "Zona Amarilla"
                        : "Zona Verde"}
                    </span>
                  </div>

                  {/* Score 3D */}
                  <div className="p-3 rounded border border-gray-200 bg-white space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase font-mono block">
                      Cubo 3D (T_3D & S_eq)
                    </span>
                    <div className="text-xl font-bold font-mono text-[#1F242B]">
                      {calcS_eq} <span className="text-xs font-normal text-gray-500">/ 25</span>
                      <span className="text-xs font-normal text-gray-400 ml-1">({calcT3D}%)</span>
                    </div>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        calcT3D >= 68 || calcV >= 64 || (calcX >= 4 && calcZ >= 4)
                          ? "bg-rose-100 text-rose-800"
                          : calcT3D >= 45 || calcV >= 36 || calcX === 5 || calcZ === 5
                          ? "bg-amber-100 text-amber-800"
                          : calcT3D >= 30 || calcV >= 15
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {calcT3D >= 68 || calcV >= 64 || (calcX >= 4 && calcZ >= 4)
                        ? "Zona Roja Crítica"
                        : calcT3D >= 45 || calcV >= 36 || calcX === 5 || calcZ === 5
                        ? "Zona Naranja Alerta"
                        : calcT3D >= 30 || calcV >= 15
                        ? "Zona Amarilla Vigilancia"
                        : "Zona Verde Controlada"}
                    </span>
                  </div>

                  {/* Brecha de Visibilidad */}
                  <div className="p-3 rounded border border-gray-200 bg-white space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase font-mono block">
                      Brecha de Visibilidad (Δ_vis)
                    </span>
                    <div
                      className={`text-xl font-bold font-mono ${
                        calcDeltaVis >= 5
                          ? "text-rose-600"
                          : calcDeltaVis > 0
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {calcDeltaVis >= 0 ? `+${calcDeltaVis}` : calcDeltaVis}{" "}
                      <span className="text-xs font-normal text-gray-500">pts</span>
                    </div>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        calcDeltaVis >= 10
                          ? "bg-rose-600 text-white animate-pulse"
                          : calcDeltaVis >= 5
                          ? "bg-amber-500 text-white"
                          : calcDeltaVis > 0
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {calcDeltaVis >= 10
                        ? "🚨 PUNTO CIEGO CRÍTICO"
                        : calcDeltaVis >= 5
                        ? "⚠️ SUBESTIMACIÓN SEVERA"
                        : calcDeltaVis > 0
                        ? "Ajuste Moderado"
                        : "Sin Subestimación"}
                    </span>
                  </div>
                </div>

                {/* Desglose Matemático Reactivo de Términos */}
                <div className="bg-[#1F242B] text-gray-200 p-3 rounded font-mono text-[11px] space-y-1 border border-gray-800">
                  <div className="text-[#C0D725] font-bold text-xs flex justify-between">
                    <span># DESGLOSE ANALÍTICO PASO A PASO EN VIVO</span>
                    <span>Motor v3.5 (Python/TS)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-gray-300 text-[10px]">
                    <p>• Volumen Bruto (V) = {calcX} × {calcY} × {calcZ} = <strong>{calcV}</strong> / 125</p>
                    <p>• Aporte Volumétrico = 0.45 × ({calcV}/125) = <strong>{calcVolNormTerm.toFixed(4)}</strong></p>
                    <p>• Norma Cuadrática (‖R⃗‖_W²) = 0.40({calcX}²) + 0.25({calcY}²) + 0.35({calcZ}²) = <strong>{(calcWeightedQuadNorm * 25).toFixed(2)}</strong></p>
                    <p>• Aporte Cuadrático = 0.55 × (‖R⃗‖_W²/25) = <strong>{calcQuadWeightedTerm.toFixed(4)}</strong></p>
                    <p>• Combinación Convexa Base = {calcVolNormTerm.toFixed(4)} + {calcQuadWeightedTerm.toFixed(4)} = <strong>{calcConvexComb.toFixed(4)}</strong></p>
                    <p>• Factor Sinergia OODA γ({calcX},{calcZ}) = <strong className={calcGamma > 1.0 ? "text-amber-400 font-bold" : ""}>{calcGamma.toFixed(2)}x</strong></p>
                    <p>• Tensor 3D T_3D = min(100, {calcConvexComb.toFixed(4)} × 100 × {calcGamma.toFixed(2)}) = <strong className="text-[#C0D725]">{calcT3D}</strong></p>
                    <p>• Score Homologado S_eq = {calcT3D} / 4.0 = <strong className="text-cyan-300">{calcS_eq}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-SECCIÓN 4: LOS 5 PILARES DE LA METODOLOGÍA HÍBRIDA */}
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
            A continuación se presentan las 7 formulaciones analíticas implementadas en el código fuente (<code>src/lib/engines/*</code>) para verificación de auditores internos, externos y la CNBV:
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

            {/* Fórmula 7: Tensor 3D y Brecha de Visibilidad */}
            <div className="bg-white rounded-bx p-4 shadow-card border border-gray-200 space-y-2.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 font-serif text-xs">
                  7. Tensor de Tensión Tridimensional Compuesto y Brecha de Visibilidad (Cubo 3D vs. Matriz 2D)
                </span>
                <span className="text-[10px] font-mono text-[#C0D725] bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">
                  emerging-risk-cube-engine.ts & scripts/emerging_risk_cube_engine.py
                </span>
              </div>
              <div className="bg-[#1F242B] text-gray-200 p-3 rounded font-mono text-[11px] space-y-1">
                <div className="text-[#C0D725]">
                  T_3D = min(100.0, [0.45 · (V / 125) + 0.55 · ((0.40·X² + 0.25·Y² + 0.35·Z²) / 25)] · 100 · γ(X,Z))
                </div>
                <div className="text-gray-300 text-[10px]">
                  γ(X,Z) = 1.15 si (X ≥ 4 ∧ Z ≥ 4); de lo contrario 1.00 (Ciclo OODA)
                </div>
                <div className="text-cyan-300 text-[10px]">
                  S_eq = round(T_3D / 4.0, 2) ∈ [1.0, 25.0]  |  Score_2D = P · I ∈ [1, 25]
                </div>
                <div className="text-rose-400 font-bold text-[10px]">
                  Δ_vis = S_eq(3D) - Score_2D  (Brecha de Visibilidad / Alerta Punto Ciego)
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Supera el sesgo frecuentista tradicional integrando <strong>Contagio Sistémico (X)</strong>, <strong>Incertidumbre Epistémica (Y)</strong> y <strong>Velocidad (Z)</strong> mediante una combinación convexa de densidad volumétrica (45%) y norma cuadrática ponderada (55%) con amplificación sinérgica OODA (γ = 1.15). La brecha Δ_vis cuantifica la subestimación de la matriz 2D bajo el marco de gestión paralela (CNBV CUB Art. 88 y Basilea III).
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
