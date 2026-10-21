// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function sha256(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

async function main() {
  console.log("🌱 Iniciando seed maestro para Banco Ve por Más (B×+)...");

  // Limpiar datos existentes en orden inverso de relaciones
  await prisma.auditLog.deleteMany();
  await prisma.actionPlanEvidence.deleteMany();
  await prisma.actionPlan.deleteMany();
  await prisma.controlEvidence.deleteMany();
  await prisma.riskControlMap.deleteMany();
  await prisma.control.deleteMany();
  await prisma.kRIMeasurement.deleteMany();
  await prisma.kRI.deleteMany();
  await prisma.lossEvent.deleteMany();
  await prisma.riskMatrixSnapshot.deleteMany();
  await prisma.riskEvent.deleteMany();
  await prisma.riskTaxonomy.deleteMany();
  await prisma.processEdge.deleteMany();
  await prisma.processNode.deleteMany();
  await prisma.subProcess.deleteMany();
  await prisma.process.deleteMany();
  await prisma.macroProcess.deleteMany();
  await prisma.creditExposureNifC16.deleteMany();
  await prisma.operationalBusinessIndicator.deleteMany();
  await prisma.legalPortfolioCase.deleteMany();
  await prisma.financialLayoutUpload.deleteMany();
  await prisma.rAFThreshold.deleteMany();
  await prisma.user.deleteMany();
  await prisma.businessUnit.deleteMany();

  // 1. UNIDADES DE NEGOCIO BANCO B×+
  const buTes = await prisma.businessUnit.create({
    data: {
      code: "TES-01",
      name: "Tesorería y Mercado de Dinero",
      businessLine: "TESORERIA_MERCADO_DINERO",
    },
  });

  const buAgro = await prisma.businessUnit.create({
    data: {
      code: "CRED-AGRO",
      name: "Banca Agropecuaria (Agronegocios)",
      businessLine: "AGRONEGOCIOS",
    },
  });

  const buPyme = await prisma.businessUnit.create({
    data: {
      code: "CRED-PYME",
      name: "Banca PyME y Empresarial",
      businessLine: "BANCA_PYME",
    },
  });

  const buSpei = await prisma.businessUnit.create({
    data: {
      code: "OP-SPEI",
      name: "Operaciones y Pagos Interbancarios (SPEI)",
      businessLine: "OPERACIONES_Y_SPEI",
    },
  });

  const buTi = await prisma.businessUnit.create({
    data: {
      code: "TI-CIB",
      name: "Tecnología y Ciberseguridad",
      businessLine: "TI_Y_CIBERSEGURIDAD",
    },
  });

  const buJur = await prisma.businessUnit.create({
    data: {
      code: "JUR-01",
      name: "Dirección Jurídica y Fiduciario",
      businessLine: "BANCA_EMPRESARIAL_CORPORATIVA",
    },
  });

  console.log("✅ 6 Unidades de Negocio B×+ creadas.");

  // 2. USUARIOS Y TRES LÍNEAS DE DEFENSA
  const uCair = await prisma.user.create({
    data: {
      email: "cair.presidencia@vepormas.com.mx",
      fullName: "Lic. Fernando Vallejo (Presidente CAIR)",
      role: "C_LEVEL_CAIR",
      businessUnitId: buTes.id,
    },
  });

  const uUairAdmin = await prisma.user.create({
    data: {
      email: "uair.director@vepormas.com.mx",
      fullName: "Mtra. Sofía Garza (Directora UAIR - 2ª Línea)",
      role: "UAIR_ADMIN",
      businessUnitId: buTes.id,
    },
  });

  const uOwnerTes = await prisma.user.create({
    data: {
      email: "tesoreria.head@vepormas.com.mx",
      fullName: "Ing. Carlos Mendoza (Head Tesorería - 1ª Línea)",
      role: "PROCESS_OWNER",
      businessUnitId: buTes.id,
    },
  });

  const uOwnerAgro = await prisma.user.create({
    data: {
      email: "agro.director@vepormas.com.mx",
      fullName: "Lic. Mauricio Echeverría (Director Agronegocios - 1ª Línea)",
      role: "PROCESS_OWNER",
      businessUnitId: buAgro.id,
    },
  });

  const uAuditor = await prisma.user.create({
    data: {
      email: "auditoria.interna@vepormas.com.mx",
      fullName: "C.P. Claudia Treviño (Auditora Líder - 3ª Línea CNBV)",
      role: "INTERNAL_AUDITOR",
      businessUnitId: buJur.id,
    },
  });

  console.log("✅ Usuarios de Gobernanza creados.");

  // 3. TAXONOMÍA CNBV (11 Tipos de Riesgo)
  const taxCredit = await prisma.riskTaxonomy.create({
    data: {
      code: "TAX-CRED-01",
      classification: "QUANTIFIABLE_DISCRETIONARY",
      riskType: "CREDIT",
      baselLevel1: "Riesgo de Crédito y Contraparte",
      baselLevel2: "Deterioro de Cartera y Concentración",
      cnbvReference: "CUB Anexo 15 Bis / NIF C-16",
    },
  });

  const taxMarket = await prisma.riskTaxonomy.create({
    data: {
      code: "TAX-MKT-01",
      classification: "QUANTIFIABLE_DISCRETIONARY",
      riskType: "MARKET",
      baselLevel1: "Riesgo de Mercado",
      baselLevel2: "Volatilidad de Tasas y Tipo de Cambio",
      cnbvReference: "CUB Título II Cap. IV (VaR 99%)",
    },
  });

  const taxLiq = await prisma.riskTaxonomy.create({
    data: {
      code: "TAX-LIQ-01",
      classification: "QUANTIFIABLE_DISCRETIONARY",
      riskType: "LIQUIDITY",
      baselLevel1: "Riesgo de Liquidez",
      baselLevel2: "Descalce de Plazos y Salidas Netas",
      cnbvReference: "Banxico CCL / Anexo 12-C IDEL",
    },
  });

  const taxOp = await prisma.riskTaxonomy.create({
    data: {
      code: "TAX-OP-01",
      classification: "QUANTIFIABLE_NON_DISCRETIONARY",
      riskType: "OPERATIONAL",
      baselLevel1: "Ejecución, entrega y gestión de procesos",
      baselLevel2: "Errores operativos y procesamiento de transacciones",
      cnbvReference: "Anexo 1-D Bis (Indicador Negocio IN)",
    },
  });

  const taxTech = await prisma.riskTaxonomy.create({
    data: {
      code: "TAX-TECH-01",
      classification: "QUANTIFIABLE_NON_DISCRETIONARY",
      riskType: "TECHNOLOGICAL",
      baselLevel1: "Fallas de sistemas e infraestructura",
      baselLevel2: "Indisponibilidad de canales y Core Bancario",
      cnbvReference: "CUB Art. 86 / Serie R24",
    },
  });

  const taxLegal = await prisma.riskTaxonomy.create({
    data: {
      code: "TAX-LEG-01",
      classification: "QUANTIFIABLE_NON_DISCRETIONARY",
      riskType: "LEGAL",
      baselLevel1: "Riesgo Legal y Contractual",
      baselLevel2: "Litigios, contingencias y sentencias desfavorables",
      cnbvReference: "Portafolio Global de Juicios CUB",
    },
  });

  const taxCyber = await prisma.riskTaxonomy.create({
    data: {
      code: "TAX-CYBER-01",
      classification: "NON_QUANTIFIABLE_EMERGING",
      riskType: "CYBERSECURITY",
      baselLevel1: "Ataques cibernéticos y brechas de seguridad",
      baselLevel2: "Compromiso de canal SPEI / Ransomware",
      cnbvReference: "Anexo 64 Bis, Anexo 72 y Circular 8/2019",
    },
  });

  const taxEsg = await prisma.riskTaxonomy.create({
    data: {
      code: "TAX-ESG-01",
      classification: "NON_QUANTIFIABLE_EMERGING",
      riskType: "ESG_CLIMATE",
      baselLevel1: "Riesgo Ambiental, Social y Gobernanza",
      baselLevel2: "Riesgos Físicos (Sequía/Huracán) y de Transición",
      cnbvReference: "Taxonomía Sostenible SHCP / DNSH",
    },
  });

  const taxRep = await prisma.riskTaxonomy.create({
    data: {
      code: "TAX-REP-01",
      classification: "NON_QUANTIFIABLE_EMERGING",
      riskType: "REPUTATIONAL",
      baselLevel1: "Riesgo Reputacional",
      baselLevel2: "Afectación de imagen pública y pérdida de confianza",
      cnbvReference: "CUB Art. 85 / Escala 1 a 5 Rimac",
    },
  });

  const taxStrat = await prisma.riskTaxonomy.create({
    data: {
      code: "TAX-STRAT-01",
      classification: "NON_QUANTIFIABLE_EMERGING",
      riskType: "STRATEGIC",
      baselLevel1: "Riesgo Estratégico",
      baselLevel2: "Desviación de objetivos quinquenales y margen",
      cnbvReference: "CUB Art. 85",
    },
  });

  const taxFraud = await prisma.riskTaxonomy.create({
    data: {
      code: "TAX-FRAUD-01",
      classification: "NON_QUANTIFIABLE_EMERGING",
      riskType: "FRAUD_INTERNAL_EXTERNAL",
      baselLevel1: "Conductas Observables de Fraude",
      baselLevel2: "Suplantación de identidad y alteración de folios",
      cnbvReference: "Plan Director Anexo 12-E CUB",
    },
  });

  console.log("✅ 11 Tipos de Taxonomía CNBV creados.");

  // 4. LOS 4 PROCESOS BANCARIOS MODELADOS EN EL DIAGRAMA DE FLUJO (REACT FLOW)
  // Macroprocesos
  const mpCred = await prisma.macroProcess.create({
    data: {
      code: "MP-CRED-01",
      name: "Originación y Administración de Crédito Agro y PyME",
      category: "BUSINESS",
      businessUnitId: buAgro.id,
    },
  });

  const mpTes = await prisma.macroProcess.create({
    data: {
      code: "MP-TES-01",
      name: "Gestión Integral de Tesorería, Liquidez y SPEI",
      category: "BUSINESS",
      businessUnitId: buTes.id,
    },
  });

  const mpTi = await prisma.macroProcess.create({
    data: {
      code: "MP-TI-01",
      name: "Seguridad de la Información y Continuidad Tecnológica",
      category: "SUPPORT",
      businessUnitId: buTi.id,
    },
  });

  // PROCESO 1: Originación y Dispersión de Crédito Agropecuario con Filtro ASG
  const procAgro = await prisma.process.create({
    data: {
      code: "PR-AGRO-01",
      name: "Originación y Dispersión de Crédito Agropecuario con Filtro ASG",
      description: "Flujo integral desde la solicitud de crédito agrícola hasta la dispersión de fondos, integrando validación DNSH y mitigación de garantías prendarias.",
      macroProcessId: mpCred.id,
      ownerId: uOwnerAgro.id,
      isCriticalBCP: true,
      rtoHours: 4,
      rpoHours: 1,
    },
  });

  // Nodos Proceso 1
  const nAgro1 = await prisma.processNode.create({
    data: {
      processId: procAgro.id,
      nodeType: "START_END",
      creditStage: "PROMOTION",
      label: "1. Solicitud de Crédito y Cuestionario ASG",
      description: "Recepción de expediente agrícola en sucursal y llenado de cuestionario de taxonomía sostenible.",
      responsibleRole: "Ejecutivo Agro B×+",
      systemUsed: "Portal Originación B×+",
      positionX: 50,
      positionY: 150,
    },
  });

  const nAgro2 = await prisma.processNode.create({
    data: {
      processId: procAgro.id,
      nodeType: "CONTROL_POINT",
      creditStage: "EVALUATION",
      label: "2. Filtro Climático DNSH y Scoring NIF C-16",
      description: "Evaluación de estrés por sequía/huracán (Anexo 12-D) y cálculo de PI estresada.",
      responsibleRole: "Analista de Crédito Agro",
      systemUsed: "Motor NIF C-16 / GIS Conagua",
      positionX: 350,
      positionY: 150,
    },
  });

  const nAgro3 = await prisma.processNode.create({
    data: {
      processId: procAgro.id,
      nodeType: "FRAUD_CHECKPOINT",
      creditStage: "EVALUATION",
      label: "3. Inspección Física y Valuación de Colateral",
      description: "Aforo de certificados de depósito (CDs) y cálculo de E* con haircuts He y Hc.",
      responsibleRole: "Valuador Externo Certificado",
      systemUsed: "Módulo Garantías Core",
      positionX: 650,
      positionY: 150,
    },
  });

  const nAgro4 = await prisma.processNode.create({
    data: {
      processId: procAgro.id,
      nodeType: "DECISION_GATEWAY",
      creditStage: "APPROVAL",
      label: "4. Comité de Crédito y Grupo de Riesgo Común",
      description: "Aprobación formal verificando límite de acumulación contra capital básico (Art. 2 Bis 69).",
      responsibleRole: "Comité de Crédito Divisional",
      systemUsed: "Sistema de Comités B×+",
      positionX: 950,
      positionY: 150,
    },
  });

  const nAgro5 = await prisma.processNode.create({
    data: {
      processId: procAgro.id,
      nodeType: "EXTERNAL_SYSTEM",
      creditStage: "INSTRUMENTATION",
      label: "5. Dispersión Mayorista de Fondos vía SPEI",
      description: "Ejecución de transferencia masiva hacia la cuenta del acreditado en Banxico.",
      responsibleRole: "Operaciones de Crédito",
      systemUsed: "Motor SPEI Banxico / Core",
      positionX: 1250,
      positionY: 150,
    },
  });

  // Conectores Proceso 1
  await prisma.processEdge.createMany({
    data: [
      { processId: procAgro.id, sourceNodeId: nAgro1.id, targetNodeId: nAgro2.id, conditionLabel: "Expediente Completo", animated: true },
      { processId: procAgro.id, sourceNodeId: nAgro2.id, targetNodeId: nAgro3.id, conditionLabel: "Score Aprobado", animated: true },
      { processId: procAgro.id, sourceNodeId: nAgro3.id, targetNodeId: nAgro4.id, conditionLabel: "Garantía Validada", animated: true },
      { processId: procAgro.id, sourceNodeId: nAgro4.id, targetNodeId: nAgro5.id, conditionLabel: "Acta Firmada", animated: true },
    ],
  });

  // PROCESO 2: Operación de Money Market y Liquidación Mayorista SPEI
  const procTes = await prisma.process.create({
    data: {
      code: "PR-TES-01",
      name: "Operación de Money Market y Liquidación Mayorista SPEI",
      description: "Negociación de reportos, compra-venta de papel gubernamental y liquidación en tiempo real verificando límites de VaR y CCL.",
      macroProcessId: mpTes.id,
      ownerId: uOwnerTes.id,
      isCriticalBCP: true,
      rtoHours: 1,
      rpoHours: 0,
    },
  });

  const nTes1 = await prisma.processNode.create({
    data: {
      processId: procTes.id,
      nodeType: "START_END",
      label: "1. Petición de Postura y Confirmación en Bloomberg",
      description: "Pactación de tasa y monto con contrapartes bancarias.",
      responsibleRole: "Trader Mesa de Dinero",
      systemUsed: "Bloomberg FIT / PMS",
      positionX: 50,
      positionY: 150,
    },
  });

  const nTes2 = await prisma.processNode.create({
    data: {
      processId: procTes.id,
      nodeType: "CONTROL_POINT",
      label: "2. Verificación Pre-Trade de Límites VaR y Contraparte",
      description: "Control preventivo (d+0) para impedir pactos que excedan la tolerancia del RAF.",
      responsibleRole: "Analista Riesgo de Mercado (UAIR)",
      systemUsed: "Motor VaR B×+",
      positionX: 350,
      positionY: 150,
    },
  });

  const nTes3 = await prisma.processNode.create({
    data: {
      processId: procTes.id,
      nodeType: "TASK_STEP",
      label: "3. Captura y Conciliación en Back Office",
      description: "Generación de boleto de operación y pareo con Indeval.",
      responsibleRole: "Operador Back Office",
      systemUsed: "Core Bancario / Dalí Indeval",
      positionX: 650,
      positionY: 150,
    },
  });

  const nTes4 = await prisma.processNode.create({
    data: {
      processId: procTes.id,
      nodeType: "FRAUD_CHECKPOINT",
      label: "4. Doble Autorización Criptográfica Mayorista",
      description: "Firma mancomunada con token físico para traspasos > $1M USD (Circular 8/2019 Banxico).",
      responsibleRole: "Subdirector de Tesorería",
      systemUsed: "HSM Criptográfico B×+",
      positionX: 950,
      positionY: 150,
    },
  });

  const nTes5 = await prisma.processNode.create({
    data: {
      processId: procTes.id,
      nodeType: "EXTERNAL_SYSTEM",
      label: "5. Liquidación Final en Enlace SPEI / Banxico",
      description: "Afectación de cuenta única de depósito en Banco de México.",
      responsibleRole: "Sistema Automatizado",
      systemUsed: "SPEI Banxico",
      positionX: 1250,
      positionY: 150,
    },
  });

  await prisma.processEdge.createMany({
    data: [
      { processId: procTes.id, sourceNodeId: nTes1.id, targetNodeId: nTes2.id, conditionLabel: "Boleto Pactado", animated: true },
      { processId: procTes.id, sourceNodeId: nTes2.id, targetNodeId: nTes3.id, conditionLabel: "Límite OK", animated: true },
      { processId: procTes.id, sourceNodeId: nTes3.id, targetNodeId: nTes4.id, conditionLabel: "Pareo Exitoso", animated: true },
      { processId: procTes.id, sourceNodeId: nTes4.id, targetNodeId: nTes5.id, conditionLabel: "Firma Validada", animated: true },
    ],
  });

  // PROCESO 3: Gestión de Garantías y Calificación de Cartera NIF C-16
  const procGar = await prisma.process.create({
    data: {
      code: "PR-CRED-02",
      name: "Gestión de Garantías y Calificación de Cartera NIF C-16",
      description: "Monitoreo mensual de aforos de garantías inmobiliarias/prendarias, detección de SICR y constitución de reservas crediticias.",
      macroProcessId: mpCred.id,
      ownerId: uOwnerAgro.id,
      isCriticalBCP: false,
    },
  });

  const nGar1 = await prisma.processNode.create({
    data: {
      processId: procGar.id,
      nodeType: "START_END",
      label: "1. Extracción de Saldos y Días de Mora al Cierre Mensual",
      responsibleRole: "Contabilidad de Crédito",
      systemUsed: "Core Bancario",
      positionX: 50,
      positionY: 150,
    },
  });

  const nGar2 = await prisma.processNode.create({
    data: {
      processId: procGar.id,
      nodeType: "CONTROL_POINT",
      label: "2. Actualización de Avalúos y Aforos de Garantía (E*)",
      responsibleRole: "Unidad de Garantías",
      systemUsed: "Módulo Colaterales",
      positionX: 350,
      positionY: 150,
    },
  });

  const nGar3 = await prisma.processNode.create({
    data: {
      processId: procGar.id,
      nodeType: "DECISION_GATEWAY",
      label: "3. Clasificación en Etapas 1, 2 o 3 (NIF C-16)",
      responsibleRole: "UAIR Crédito",
      systemUsed: "Motor NIF C-16",
      positionX: 650,
      positionY: 150,
    },
  });

  const nGar4 = await prisma.processNode.create({
    data: {
      processId: procGar.id,
      nodeType: "TASK_STEP",
      label: "4. Contabilización de Reservas PCE y Reporte R10",
      responsibleRole: "Dirección de Finanzas",
      systemUsed: "ERP SAP / CNBV SITI",
      positionX: 950,
      positionY: 150,
    },
  });

  await prisma.processEdge.createMany({
    data: [
      { processId: procGar.id, sourceNodeId: nGar1.id, targetNodeId: nGar2.id, animated: true },
      { processId: procGar.id, sourceNodeId: nGar2.id, targetNodeId: nGar3.id, animated: true },
      { processId: procGar.id, sourceNodeId: nGar3.id, targetNodeId: nGar4.id, animated: true },
    ],
  });

  // PROCESO 4: Monitoreo de Ciberincidentes y Continuidad Operativa SPEI
  const procCyber = await prisma.process.create({
    data: {
      code: "PR-TI-01",
      name: "Monitoreo de Ciberincidentes y Continuidad Operativa SPEI",
      description: "Detección temprana de anomalías en tráfico de red, contención de intrusiones y reporte regulatorio bajo Anexos 64 Bis y 72 de la CUB.",
      macroProcessId: mpTi.id,
      ownerId: uUairAdmin.id,
      isCriticalBCP: true,
      rtoHours: 1,
      rpoHours: 0,
    },
  });

  const nCib1 = await prisma.processNode.create({
    data: {
      processId: procCyber.id,
      nodeType: "START_END",
      label: "1. Ingesta y Correlación de Eventos en SIEM (24/7)",
      responsibleRole: "Analista SOC L1",
      systemUsed: "Splunk / CrowdStrike",
      positionX: 50,
      positionY: 150,
    },
  });

  const nCib2 = await prisma.processNode.create({
    data: {
      processId: procCyber.id,
      nodeType: "CONTROL_POINT",
      label: "2. Detección de Anomalías en Tráfico Enlace SPEI",
      responsibleRole: "Ingeniero Ciberseguridad",
      systemUsed: "NDR / Firewall Checkpoint",
      positionX: 350,
      positionY: 150,
    },
  });

  const nCib3 = await prisma.processNode.create({
    data: {
      processId: procCyber.id,
      nodeType: "DECISION_GATEWAY",
      label: "3. Triage de Severidad y Aislamiento de Red",
      responsibleRole: "CISO B×+",
      systemUsed: "Orquestador SOAR",
      positionX: 650,
      positionY: 150,
    },
  });

  const nCib4 = await prisma.processNode.create({
    data: {
      processId: procCyber.id,
      nodeType: "EXTERNAL_SYSTEM",
      label: "4. Notificación Regulatoria Banxico y CNBV (Anexo 64 Bis)",
      responsibleRole: "Oficial de Seguridad de la Información",
      systemUsed: "Portal SITI Ciberseguridad",
      positionX: 950,
      positionY: 150,
    },
  });

  await prisma.processEdge.createMany({
    data: [
      { processId: procCyber.id, sourceNodeId: nCib1.id, targetNodeId: nCib2.id, animated: true },
      { processId: procCyber.id, sourceNodeId: nCib2.id, targetNodeId: nCib3.id, animated: true },
      { processId: procCyber.id, sourceNodeId: nCib3.id, targetNodeId: nCib4.id, animated: true },
    ],
  });

  console.log("✅ 4 Procesos Bancarios completos creados con Nodos y Conectores.");

  // 5. CONTROLES TÉCNICOS (Preventivos, Detectivos, d+0, d+1, d+7, d+30, NF)
  const ctrl1 = await prisma.control.create({
    data: {
      code: "CTRL-SPEI-01",
      name: "Validación Criptográfica HSM en Línea (d+0)",
      description: "Firma digital y verificación de certificados TLS en tiempo real para cada instrucción SPEI mayorista.",
      nature: "PREVENTIVE",
      automation: "AUTOMATED",
      executionTiming: "ONLINE_REALTIME",
      isFormalized: true,
      coverageLevel: 4,
      rawEffectiveness: 5,
      adjustedEffectScore: 0.85,
      hasValidEvidence: true,
      ownerId: uUairAdmin.id,
      processNodeId: nTes4.id,
    },
  });

  const ctrl2 = await prisma.control.create({
    data: {
      code: "CTRL-AGRO-02",
      name: "Revisión Satelital y Cuestionario ASG de Acreditados",
      description: "Cuestionario de alineación a Taxonomía Sostenible SHCP y monitoreo de sequía en coordenadas de predio.",
      nature: "PREVENTIVE",
      automation: "SEMI_AUTOMATED",
      executionTiming: "ONLINE_REALTIME",
      isFormalized: true,
      coverageLevel: 3,
      rawEffectiveness: 4,
      adjustedEffectScore: 0.51,
      hasValidEvidence: true,
      ownerId: uOwnerAgro.id,
      processNodeId: nAgro2.id,
    },
  });

  const ctrl3 = await prisma.control.create({
    data: {
      code: "CTRL-TES-03",
      name: "Conciliación Diaria Ex-Post de Saldos en Banxico (d+1)",
      description: "Cruce diario matutino entre cuenta única de Banco de México y movimientos en Core Bancario.",
      nature: "DETECTIVE",
      automation: "SEMI_AUTOMATED",
      executionTiming: "DAILY_D1", // Penalizado temporalmente a max 4 (Alta)
      isFormalized: true,
      coverageLevel: 4,
      rawEffectiveness: 4,
      adjustedEffectScore: 0.68,
      hasValidEvidence: true,
      ownerId: uOwnerTes.id,
      processNodeId: nTes3.id,
    },
  });

  const ctrl4NF = await prisma.control.create({
    data: {
      code: "CTRL-PYME-04",
      name: "Revisión Manual en Hoja Excel de Garantías Prendarias (NF)",
      description: "Control no formalizado operado en hojas de cálculo compartidas sin bitácora de auditoría.",
      nature: "DETECTIVE",
      automation: "MANUAL",
      executionTiming: "WEEKLY_D7", // Penalizado temporalmente y por no formalizado (Cobertura max 2)
      isFormalized: false, // REGLA CNBV: Cobertura máxima topada a 2
      coverageLevel: 3,
      rawEffectiveness: 3,
      adjustedEffectScore: 0.178, // (2/4) * (3/5) * 0.7 * 0.85 = 0.1785
      hasValidEvidence: false,
      ownerId: uOwnerAgro.id,
      processNodeId: nAgro3.id,
    },
  });

  const ctrl5 = await prisma.control.create({
    data: {
      code: "CTRL-SOC-05",
      name: "Monitoreo Continuo SIEM y Reglas de Correlación CUB",
      description: "Reglas automáticas de detección de tráfico inusual en IP de canales digitales.",
      nature: "DETECTIVE",
      automation: "AUTOMATED",
      executionTiming: "ONLINE_REALTIME",
      isFormalized: true,
      coverageLevel: 4,
      rawEffectiveness: 4,
      adjustedEffectScore: 0.68,
      hasValidEvidence: true,
      ownerId: uUairAdmin.id,
      processNodeId: nCib2.id,
    },
  });

  console.log("✅ Controles técnicos creados con reglas de formalización y penalización temporal.");

  // 6. CATÁLOGO RICO DE +25 RIESGOS BANCARIOS REALISTAS (11 TIPOS CNBV)
  const risksSeed = [
    // RIESGO 1: Ciberseguridad / SPEI (Crítico / Top 1)
    {
      code: "RSK-CYBER-001",
      title: "Intercepción de Instrucciones de Pago Mayorista en Enlace SPEI",
      cause: "Vulnerabilidad en canal de comunicación entre el sistema PMS y el concentrador SPEI por credenciales de servicio compartidas.",
      eventDescription: "Inyección o manipulación de cuentas CLABE beneficiarias en transferencias interbancarias mayoristas.",
      consequence: "Pérdida patrimonial directa no recuperable, sanción de Banxico y desconexión temporal del canal SPEI.",
      taxonomyId: taxCyber.id,
      origin: "TECHNOLOGY",
      businessUnitId: buSpei.id,
      processId: procTes.id,
      processNodeId: nTes4.id,
      inherentProbability: 3,
      inherentImpact: 5,
      inherentScore: 15,
      inherentZone: "ORANGE",
      controlMitigationFactor: 0.65,
      residualProbability: 1.44,
      residualImpact: 3.05,
      residualScore: 4.39,
      residualZone: "GREEN",
      annualFrequencyNet: 0.1,
      avgFinancialImpactMXN: 25000000,
      worstCaseImpactMXN: 85000000,
      expectedAnnualLossPEA: 2500000,
      maxAnnualLossPMA: 58000000,
      reputationalImpactLevel: 5,
      isEmergingRisk: true,
      speiImpact: true,
      cyberAttackVector: "Compromiso de Credenciales / Inyección API SPEI",
      criticalityRankScore: 78.5,
    },
    // RIESGO 2: ASG / Crédito Agropecuario (Zona Roja / Top 2)
    {
      code: "RSK-ASG-002",
      title: "Deterioro Masivo de Cartera Agrícola por Sequía Extrema y Omisión DNSH",
      cause: "Concentración en distritos de riego con estrés hídrico extremo (>80%) sin validación del criterio No Causar Daño Significativo.",
      eventDescription: "Pérdida total de cosechas de maíz y sorgo en Sinaloa y Sonora, imposibilitando el servicio de la deuda.",
      consequence: "Migración masiva de Etapa 1 a Etapa 2 y 3 (NIF C-16) con incremento súbito de reservas crediticias por $42M MXN.",
      taxonomyId: taxEsg.id,
      origin: "EXTERNAL_EVENTS",
      businessUnitId: buAgro.id,
      processId: procAgro.id,
      processNodeId: nAgro2.id,
      inherentProbability: 4,
      inherentImpact: 4,
      inherentScore: 16,
      inherentZone: "RED",
      controlMitigationFactor: 0.35,
      residualProbability: 2.88,
      residualImpact: 3.16,
      residualScore: 9.1,
      residualZone: "YELLOW",
      annualFrequencyNet: 0.5,
      avgFinancialImpactMXN: 18000000,
      worstCaseImpactMXN: 48000000,
      expectedAnnualLossPEA: 9000000,
      maxAnnualLossPMA: 36500000,
      reputationalImpactLevel: 4,
      isEmergingRisk: true,
      esgSectorSHCP: "Agropecuario y Forestal",
      esgDnshCompliant: false,
      criticalityRankScore: 74.2,
    },
    // RIESGO 3: Riesgo de Mercado / Tasas TIIE (Top 3)
    {
      code: "RSK-MKT-003",
      title: "Descalce de Tasas de Interés en Cartera de Deuda Soberana Mbonos",
      cause: "Incremento imprevisto en la curva de rendimientos de Banxico (TIIE de Fondeo +150 bps) en el libro de negociación.",
      eventDescription: "Minusvalía por valoración a mercado en bonos a tasa fija a plazo de 5 y 10 años.",
      consequence: "Pérdida en el Resultado Integral de Financiamiento y reducción del Capital Fundamental (CET1).",
      taxonomyId: taxMarket.id,
      origin: "EXTERNAL_EVENTS",
      businessUnitId: buTes.id,
      processId: procTes.id,
      processNodeId: nTes2.id,
      inherentProbability: 3,
      inherentImpact: 4,
      inherentScore: 12,
      inherentZone: "ORANGE",
      controlMitigationFactor: 0.55,
      residualProbability: 1.68,
      residualImpact: 2.68,
      residualScore: 4.5,
      residualZone: "GREEN",
      annualFrequencyNet: 1.0,
      avgFinancialImpactMXN: 12000000,
      worstCaseImpactMXN: 32000000,
      expectedAnnualLossPEA: 12000000,
      maxAnnualLossPMA: 29500000,
      reputationalImpactLevel: 3,
      isEmergingRisk: false,
      criticalityRankScore: 66.8,
    },
    // RIESGO 4: Liquidez / IDEL (Top 4)
    {
      code: "RSK-LIQ-004",
      title: "Concentración de Depósitos Mayoristas y Fuga en Horizonte 30 Días",
      cause: "Alta dependencia de depósitos a plazo de 5 grandes clientes corporativos con vencimientos concentrados.",
      eventDescription: "No renovación simultánea de depósitos ante búsqueda de mayor rendimiento en casas de bolsa.",
      consequence: "Caída del CCL por debajo del 100% y necesidad de activar el Plan de Financiamiento de Contingencia (Anexo 12-C).",
      taxonomyId: taxLiq.id,
      origin: "EXTERNAL_EVENTS",
      businessUnitId: buTes.id,
      processId: procTes.id,
      processNodeId: nTes1.id,
      inherentProbability: 2,
      inherentImpact: 5,
      inherentScore: 10,
      inherentZone: "ORANGE",
      controlMitigationFactor: 0.45,
      residualProbability: 1.28,
      residualImpact: 3.65,
      residualScore: 4.67,
      residualZone: "GREEN",
      annualFrequencyNet: 0.2,
      avgFinancialImpactMXN: 35000000,
      worstCaseImpactMXN: 90000000,
      expectedAnnualLossPEA: 7000000,
      maxAnnualLossPMA: 65000000,
      reputationalImpactLevel: 4,
      isEmergingRisk: false,
      criticalityRankScore: 69.5,
    },
    // RIESGO 5: Fraude Interno / Anexo 12-E (Top 5)
    {
      code: "RSK-FRAUD-005",
      title: "Alteración de Folios y Expedientes en Mesa de Control PyME",
      cause: "Colusión entre analista de crédito y gestor externo aprovechando control no formalizado en validación de poderes.",
      eventDescription: "Aprobación y desembolso de línea de crédito simple por $15M MXN a empresa fantasma.",
      consequence: "Quebranto patrimonial total al primer impago y querella penal ante la Fiscalía General de la República.",
      taxonomyId: taxFraud.id,
      origin: "PEOPLE",
      businessUnitId: buPyme.id,
      processId: procAgro.id,
      processNodeId: nAgro4.id,
      inherentProbability: 3,
      inherentImpact: 4,
      inherentScore: 12,
      inherentZone: "ORANGE",
      controlMitigationFactor: 0.25,
      residualProbability: 2.4,
      residualImpact: 3.4,
      residualScore: 8.16,
      residualZone: "YELLOW",
      annualFrequencyNet: 0.3,
      avgFinancialImpactMXN: 15000000,
      worstCaseImpactMXN: 22000000,
      expectedAnnualLossPEA: 4500000,
      maxAnnualLossPMA: 21000000,
      reputationalImpactLevel: 4,
      isEmergingRisk: false,
      criticalityRankScore: 63.4,
    },
    // RIESGO 6: Ciberseguridad / Ransomware en Servidores Core
    {
      code: "RSK-CYBER-006",
      title: "Infección por Ransomware en Servidores de Base de Datos Core",
      cause: "Campaña de phishing dirigida a empleados de TI con escalación de privilegios.",
      eventDescription: "Cifrado malicioso de volúmenes de almacenamiento del sistema transaccional.",
      consequence: "Indisponibilidad total del servicio bancario por más de 12 horas y reporte de evento relevante a CNBV.",
      taxonomyId: taxCyber.id,
      origin: "TECHNOLOGY",
      businessUnitId: buTi.id,
      processId: procCyber.id,
      processNodeId: nCib3.id,
      inherentProbability: 2,
      inherentImpact: 5,
      inherentScore: 10,
      inherentZone: "ORANGE",
      controlMitigationFactor: 0.6,
      residualProbability: 1.04,
      residualImpact: 3.2,
      residualScore: 3.33,
      residualZone: "GREEN",
      annualFrequencyNet: 0.05,
      avgFinancialImpactMXN: 40000000,
      worstCaseImpactMXN: 120000000,
      expectedAnnualLossPEA: 2000000,
      maxAnnualLossPMA: 78000000,
      reputationalImpactLevel: 5,
      isEmergingRisk: true,
      criticalityRankScore: 72.1,
    },
    // RIESGO 7: Crédito / Concentración Grupo de Riesgo Común (Art. 2 Bis 69)
    {
      code: "RSK-CRED-007",
      title: "Exceso Inadvertido en Límite de Financiamiento a Grupo de Riesgo Común",
      cause: "Falta de consolidación automática en tiempo real de acreditados con vínculos patrimoniales cruzados.",
      eventDescription: "Autorización de nuevo crédito que eleva la exposición a un solo consorcio por encima del 40% del Capital Básico.",
      consequence: "Sanción pecuniaria de la CNBV y exigencia de constitución de reservas adicionales inmediatas.",
      taxonomyId: taxCredit.id,
      origin: "PROCESSES",
      businessUnitId: buAgro.id,
      processId: procAgro.id,
      processNodeId: nAgro4.id,
      inherentProbability: 2,
      inherentImpact: 4,
      inherentScore: 8,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.4,
      residualProbability: 1.36,
      residualImpact: 3.04,
      residualScore: 4.13,
      residualZone: "GREEN",
      annualFrequencyNet: 0.15,
      avgFinancialImpactMXN: 8000000,
      worstCaseImpactMXN: 25000000,
      expectedAnnualLossPEA: 1200000,
      maxAnnualLossPMA: 18000000,
      reputationalImpactLevel: 3,
      isEmergingRisk: false,
      criticalityRankScore: 52.8,
    },
    // RIESGO 8: Tecnológico / Caída de Enlace de Telecomunicaciones Sucursales
    {
      code: "RSK-TECH-008",
      title: "Falla Generalizada de Red WAN y Enlaces MPLS en Red de Sucursales",
      cause: "Corte de fibra óptica del proveedor de telecomunicaciones sin conmutación automática 4G/5G.",
      eventDescription: "Imposibilidad de operar ventanilla bancaria en 35 sucursales del Bajío y Norte del país.",
      consequence: "Afectación de la Serie R24 (disponibilidad <99%) y quejas formales de clientes ante CONDUSEF.",
      taxonomyId: taxTech.id,
      origin: "THIRD_PARTY_SUPPLIERS",
      businessUnitId: buTi.id,
      processId: procCyber.id,
      processNodeId: nCib1.id,
      inherentProbability: 3,
      inherentImpact: 3,
      inherentScore: 9,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.5,
      residualProbability: 1.8,
      residualImpact: 2.1,
      residualScore: 3.78,
      residualZone: "GREEN",
      annualFrequencyNet: 2.0,
      avgFinancialImpactMXN: 750000,
      worstCaseImpactMXN: 3500000,
      expectedAnnualLossPEA: 1500000,
      maxAnnualLossPMA: 4200000,
      reputationalImpactLevel: 3,
      isEmergingRisk: false,
      criticalityRankScore: 41.5,
    },
    // RIESGO 9: Legal / Portafolio de Juicios
    {
      code: "RSK-LEG-009",
      title: "Resolución Judicial Desfavorable en Juicio Especial Mercantil de Garantía Hipotecaria",
      cause: "Defectos en el proceso de notificación o nulidad de contrato de fideicomiso de garantía.",
      eventDescription: "Sentencia firme que declara inejecutable la hipoteca de una nave industrial en Querétaro.",
      consequence: "Pérdida de la garantía admisible ($E^*$), aumento de severidad (SP) y reclasificación a Etapa 3 NIF C-16.",
      taxonomyId: taxLegal.id,
      origin: "PROCESSES",
      businessUnitId: buJur.id,
      processId: procGar.id,
      processNodeId: nGar2.id,
      inherentProbability: 2,
      inherentImpact: 4,
      inherentScore: 8,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.35,
      residualProbability: 1.44,
      residualImpact: 3.16,
      residualScore: 4.55,
      residualZone: "GREEN",
      annualFrequencyNet: 0.25,
      avgFinancialImpactMXN: 14000000,
      worstCaseImpactMXN: 22000000,
      expectedAnnualLossPEA: 3500000,
      maxAnnualLossPMA: 19500000,
      reputationalImpactLevel: 2,
      isEmergingRisk: false,
      criticalityRankScore: 51.2,
    },
    // RIESGO 10: Reputacional / Campaña Negativa en Redes Sociales
    {
      code: "RSK-REP-010",
      title: "Campaña Desinformadora Viral sobre Supuesta Fragilidad Financiera",
      cause: "Difusión maliciosa de rumores falsos en plataformas digitales sobre retención de depósitos.",
      eventDescription: "Filas de clientes en sucursales solicitando retiros en efectivo por pánico financiero.",
      consequence: "Estrés severo de liquidez en ventanilla y necesidad de desplegar comunicados institucionales urgentes.",
      taxonomyId: taxRep.id,
      origin: "EXTERNAL_EVENTS",
      businessUnitId: buTes.id,
      processId: procTes.id,
      processNodeId: nTes1.id,
      inherentProbability: 2,
      inherentImpact: 4,
      inherentScore: 8,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.4,
      residualProbability: 1.36,
      residualImpact: 3.04,
      residualScore: 4.13,
      residualZone: "GREEN",
      annualFrequencyNet: 0.1,
      avgFinancialImpactMXN: 5000000,
      worstCaseImpactMXN: 18000000,
      expectedAnnualLossPEA: 500000,
      maxAnnualLossPMA: 12000000,
      reputationalImpactLevel: 5,
      isEmergingRisk: true,
      criticalityRankScore: 56.4,
    },
    // RIESGO 11: Estratégico / Desviación de Margen Financiero
    {
      code: "RSK-STRAT-011",
      title: "Compresión del Margen Financiero por Competencia Agresiva en Captación Digital",
      cause: "Entrada de Sofipos digitales ofreciendo tasas pasivas superiores al 13% anual.",
      eventDescription: "Migración de saldos a la vista de personas físicas hacia competidores del sector fintech.",
      consequence: "Encarecimiento del costo de fondeo y deterioro del margen de intermediación proyectado en el presupuesto anual.",
      taxonomyId: taxStrat.id,
      origin: "EXTERNAL_EVENTS",
      businessUnitId: buPyme.id,
      processId: procTes.id,
      processNodeId: nTes1.id,
      inherentProbability: 3,
      inherentImpact: 3,
      inherentScore: 9,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.3,
      residualProbability: 2.28,
      residualImpact: 2.46,
      residualScore: 5.61,
      residualZone: "YELLOW",
      annualFrequencyNet: 1.0,
      avgFinancialImpactMXN: 8500000,
      worstCaseImpactMXN: 16000000,
      expectedAnnualLossPEA: 8500000,
      maxAnnualLossPMA: 15500000,
      reputationalImpactLevel: 2,
      isEmergingRisk: false,
      criticalityRankScore: 48.9,
    },
    // RIESGO 12: Operacional / Error de Dedo en Liquidación Indeval
    {
      code: "RSK-OP-012",
      title: "Error Operativo en Digitación de Cantidad de Títulos en Sistema Dalí (Fat Finger)",
      cause: "Falta de validación preventiva automatizada de rangos de importe en la captura manual de boletos.",
      eventDescription: "Captura de 1,000,000 de títulos Cetes en lugar de 100,000 generando un sobregiro transitorio.",
      consequence: "Costo financiero por reposición de fondos de último minuto ante Banxico y penalización de Indeval.",
      taxonomyId: taxOp.id,
      origin: "PEOPLE",
      businessUnitId: buTes.id,
      processId: procTes.id,
      processNodeId: nTes3.id,
      inherentProbability: 3,
      inherentImpact: 3,
      inherentScore: 9,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.6,
      residualProbability: 1.56,
      residualImpact: 1.92,
      residualScore: 3.0,
      residualZone: "GREEN",
      annualFrequencyNet: 0.8,
      avgFinancialImpactMXN: 1200000,
      worstCaseImpactMXN: 4500000,
      expectedAnnualLossPEA: 960000,
      maxAnnualLossPMA: 4100000,
      reputationalImpactLevel: 2,
      isEmergingRisk: false,
      criticalityRankScore: 38.2,
    },
    // RIESGO 13: Crédito / Deterioro en Portafolio PyME por Inflación
    {
      code: "RSK-CRED-013",
      title: "Incremento de Cartera Vencida PyME por Incremento en Costo de Insumos",
      cause: "Presión inflacionaria prolongada que contrae el flujo operativo de micro y pequeñas empresas acreditadas.",
      eventDescription: "Aumento del Índice de Morosidad (IMOR) de Banca PyME por encima del 4.5% anual.",
      consequence: "Mayor requerimiento de constitución de reservas NIF C-16 y castigo de cartera en balance.",
      taxonomyId: taxCredit.id,
      origin: "EXTERNAL_EVENTS",
      businessUnitId: buPyme.id,
      processId: procGar.id,
      processNodeId: nGar3.id,
      inherentProbability: 4,
      inherentImpact: 3,
      inherentScore: 12,
      inherentZone: "ORANGE",
      controlMitigationFactor: 0.45,
      residualProbability: 2.56,
      residualImpact: 2.19,
      residualScore: 5.61,
      residualZone: "YELLOW",
      annualFrequencyNet: 1.0,
      avgFinancialImpactMXN: 11000000,
      worstCaseImpactMXN: 24000000,
      expectedAnnualLossPEA: 11000000,
      maxAnnualLossPMA: 23500000,
      reputationalImpactLevel: 3,
      isEmergingRisk: false,
      criticalityRankScore: 59.7,
    },
    // RIESGO 14: ASG / Cartera Cañera y de Granos (Vulnerabilidad de Transición)
    {
      code: "RSK-ASG-014",
      title: "Riesgo de Transición por Nueva Regulación Hídrica y de Plaguicidas",
      cause: "Prohibición regulatoria repentina de agroquímicos convencionales sin sustitutos económicamente viables.",
      eventDescription: "Caída del 30% en rendimientos de productores cañeros acreditados en Veracruz.",
      consequence: "Deterioro crediticio de la cartera con reclasificación a Etapa 2 de la NIF C-16.",
      taxonomyId: taxEsg.id,
      origin: "EXTERNAL_EVENTS",
      businessUnitId: buAgro.id,
      processId: procAgro.id,
      processNodeId: nAgro1.id,
      inherentProbability: 3,
      inherentImpact: 3,
      inherentScore: 9,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.35,
      residualProbability: 2.16,
      residualImpact: 2.37,
      residualScore: 5.12,
      residualZone: "YELLOW",
      annualFrequencyNet: 0.4,
      avgFinancialImpactMXN: 6000000,
      worstCaseImpactMXN: 15000000,
      expectedAnnualLossPEA: 2400000,
      maxAnnualLossPMA: 12500000,
      reputationalImpactLevel: 2,
      isEmergingRisk: true,
      esgSectorSHCP: "Agropecuario y Forestal",
      criticalityRankScore: 49.3,
    },
    // RIESGOS ADICIONALES PARA LLEGAR A 25+
    {
      code: "RSK-CYBER-015",
      title: "Ataque de Denegación de Servicio Distribuido (DDoS) a Banca Digital",
      cause: "Saturación maliciosa de peticiones sobre la infraestructura pública de banca por internet.",
      eventDescription: "Indisponibilidad del portal transaccional de personas morales durante el horario de cierre bancario.",
      consequence: "Reclamos masivos por imposibilidad de dispersar nóminas e impacto en la Serie R24.",
      taxonomyId: taxCyber.id,
      origin: "TECHNOLOGY",
      businessUnitId: buTi.id,
      processId: procCyber.id,
      processNodeId: nCib2.id,
      inherentProbability: 3,
      inherentImpact: 4,
      inherentScore: 12,
      inherentZone: "ORANGE",
      controlMitigationFactor: 0.65,
      residualProbability: 1.44,
      residualImpact: 2.44,
      residualScore: 3.51,
      residualZone: "GREEN",
      annualFrequencyNet: 0.5,
      avgFinancialImpactMXN: 3500000,
      worstCaseImpactMXN: 9000000,
      expectedAnnualLossPEA: 1750000,
      maxAnnualLossPMA: 8200000,
      reputationalImpactLevel: 4,
      isEmergingRisk: true,
      criticalityRankScore: 58.6,
    },
    {
      code: "RSK-OP-016",
      title: "Demora en Envío de Reportes Regulatorios a la CNBV (SITI)",
      cause: "Inconsistencia en scripts de consolidación nocturna de cartera crediticia.",
      eventDescription: "Envío extemporáneo de los reportes de la Serie R01 y R10 con posterioridad a la hora límite.",
      consequence: "Multa regulatoria de la CNBV y apercibimiento en acta de inspección ordinaria.",
      taxonomyId: taxOp.id,
      origin: "PROCESSES",
      businessUnitId: buJur.id,
      processId: procGar.id,
      processNodeId: nGar4.id,
      inherentProbability: 2,
      inherentImpact: 3,
      inherentScore: 6,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.5,
      residualProbability: 1.2,
      residualImpact: 2.1,
      residualScore: 2.52,
      residualZone: "GREEN",
      annualFrequencyNet: 0.3,
      avgFinancialImpactMXN: 2200000,
      worstCaseImpactMXN: 5000000,
      expectedAnnualLossPEA: 660000,
      maxAnnualLossPMA: 4100000,
      reputationalImpactLevel: 3,
      isEmergingRisk: false,
      criticalityRankScore: 36.4,
    },
    {
      code: "RSK-FRAUD-017",
      title: "Suplantación de Identidad en Apertura Remota de Cuentas PyME",
      cause: "Falsificación de comprobantes de domicilio y constancias de situación fiscal en onboarding digital.",
      eventDescription: "Apertura de cuenta utilizada posteriormente como 'cuenta puente' para lavado de activos.",
      consequence: "Bloqueo por parte de la Unidad de Inteligencia Financiera (UIF) y contingencia reputacional.",
      taxonomyId: taxFraud.id,
      origin: "PEOPLE",
      businessUnitId: buPyme.id,
      processId: procAgro.id,
      processNodeId: nAgro1.id,
      inherentProbability: 3,
      inherentImpact: 4,
      inherentScore: 12,
      inherentZone: "ORANGE",
      controlMitigationFactor: 0.45,
      residualProbability: 1.92,
      residualImpact: 2.92,
      residualScore: 5.61,
      residualZone: "YELLOW",
      annualFrequencyNet: 0.4,
      avgFinancialImpactMXN: 4500000,
      worstCaseImpactMXN: 12000000,
      expectedAnnualLossPEA: 1800000,
      maxAnnualLossPMA: 10500000,
      reputationalImpactLevel: 4,
      isEmergingRisk: false,
      criticalityRankScore: 57.3,
    },
    {
      code: "RSK-TECH-018",
      title: "Obsolescencia de Versión de Base de Datos en Servidor Transaccional",
      cause: "Postergación de ventana de actualización mayor de base de datos por temor a disrupción operativa.",
      eventDescription: "Fin de soporte oficial del fabricante dejando al banco expuesto a vulnerabilidades de día cero.",
      consequence: "Observación crítica de auditoría externa y sobrecosto por soporte extendido de emergencia.",
      taxonomyId: taxTech.id,
      origin: "TECHNOLOGY",
      businessUnitId: buTi.id,
      processId: procCyber.id,
      processNodeId: nCib1.id,
      inherentProbability: 3,
      inherentImpact: 3,
      inherentScore: 9,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.35,
      residualProbability: 2.16,
      residualImpact: 2.37,
      residualScore: 5.12,
      residualZone: "YELLOW",
      annualFrequencyNet: 0.2,
      avgFinancialImpactMXN: 3000000,
      worstCaseImpactMXN: 8000000,
      expectedAnnualLossPEA: 600000,
      maxAnnualLossPMA: 6500000,
      reputationalImpactLevel: 2,
      isEmergingRisk: false,
      criticalityRankScore: 39.8,
    },
    {
      code: "RSK-MKT-019",
      title: "Descalce Cambiario en Posición Corta de Opciones USD/MXN",
      cause: "Incremento súbito en la volatilidad implícita del tipo de cambio por evento geopolítico.",
      eventDescription: "Disparo del umbral de VaR de Mercado en la mesa de derivados.",
      consequence: "Pérdida por revaluación y requerimiento inmediato de aportación de garantías ante el CCV.",
      taxonomyId: taxMarket.id,
      origin: "EXTERNAL_EVENTS",
      businessUnitId: buTes.id,
      processId: procTes.id,
      processNodeId: nTes2.id,
      inherentProbability: 2,
      inherentImpact: 4,
      inherentScore: 8,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.55,
      residualProbability: 1.12,
      residualImpact: 2.68,
      residualScore: 3.0,
      residualZone: "GREEN",
      annualFrequencyNet: 0.5,
      avgFinancialImpactMXN: 6000000,
      worstCaseImpactMXN: 18000000,
      expectedAnnualLossPEA: 3000000,
      maxAnnualLossPMA: 16000000,
      reputationalImpactLevel: 2,
      isEmergingRisk: false,
      criticalityRankScore: 47.6,
    },
    {
      code: "RSK-LIQ-020",
      title: "Falta de Colateral Admisible para Obtener Liquidez Intradía en Banxico",
      cause: "Compromiso excesivo de papel gubernamental en operaciones de reporto con el mercado privado.",
      eventDescription: "Insuficiencia transitoria de títulos en cuenta única para respaldar líneas de crédito intradía.",
      consequence: "Retraso en la compensación de órdenes de transferencia SPEI salientes de clientes corporativos.",
      taxonomyId: taxLiq.id,
      origin: "PROCESSES",
      businessUnitId: buTes.id,
      processId: procTes.id,
      processNodeId: nTes5.id,
      inherentProbability: 2,
      inherentImpact: 4,
      inherentScore: 8,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.5,
      residualProbability: 1.2,
      residualImpact: 2.8,
      residualScore: 3.36,
      residualZone: "GREEN",
      annualFrequencyNet: 0.3,
      avgFinancialImpactMXN: 4000000,
      worstCaseImpactMXN: 12000000,
      expectedAnnualLossPEA: 1200000,
      maxAnnualLossPMA: 11000000,
      reputationalImpactLevel: 3,
      isEmergingRisk: false,
      criticalityRankScore: 46.2,
    },
    {
      code: "RSK-CRED-021",
      title: "Subvaluación de Garantías Prendarias en Bodegas Habilitadas",
      cause: "Deterioro físico o merma de granos almacenados en silos no detectada por auditorías periódicas.",
      eventDescription: "Al momento de intentar ejecutar la prenda, el volumen real es 40% menor al certificado amparado.",
      consequence: "Incremento directo en la Severidad de la Pérdida (SP) con impacto directo en reservas NIF C-16.",
      taxonomyId: taxCredit.id,
      origin: "THIRD_PARTY_SUPPLIERS",
      businessUnitId: buAgro.id,
      processId: procAgro.id,
      processNodeId: nAgro3.id,
      inherentProbability: 3,
      inherentImpact: 4,
      inherentScore: 12,
      inherentZone: "ORANGE",
      controlMitigationFactor: 0.3,
      residualProbability: 2.28,
      residualImpact: 3.28,
      residualScore: 7.48,
      residualZone: "YELLOW",
      annualFrequencyNet: 0.2,
      avgFinancialImpactMXN: 12000000,
      worstCaseImpactMXN: 28000000,
      expectedAnnualLossPEA: 2400000,
      maxAnnualLossPMA: 23000000,
      reputationalImpactLevel: 3,
      isEmergingRisk: false,
      criticalityRankScore: 58.1,
    },
    {
      code: "RSK-OP-022",
      title: "Extravío de Pagarés Físicos en Bóveda Central Fiduciaria",
      cause: "Deficiencias en el control de acceso y bitácora física de entradas y salidas de títulos de crédito.",
      eventDescription: "Imposibilidad de localizar el pagaré original requerido por el juez para admitir demanda ejecutiva mercantil.",
      consequence: "Retraso de más de 18 meses en el cobro judicial y riesgo de prescripción de la acción cambiaria.",
      taxonomyId: taxOp.id,
      origin: "PROCESSES",
      businessUnitId: buJur.id,
      processId: procGar.id,
      processNodeId: nGar2.id,
      inherentProbability: 2,
      inherentImpact: 3,
      inherentScore: 6,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.45,
      residualProbability: 1.28,
      residualImpact: 2.19,
      residualScore: 2.8,
      residualZone: "GREEN",
      annualFrequencyNet: 0.1,
      avgFinancialImpactMXN: 5000000,
      worstCaseImpactMXN: 11000000,
      expectedAnnualLossPEA: 500000,
      maxAnnualLossPMA: 8900000,
      reputationalImpactLevel: 2,
      isEmergingRisk: false,
      criticalityRankScore: 35.7,
    },
    {
      code: "RSK-ASG-023",
      title: "Incumplimiento de Criterios de Salvaguarda Social en Proyecto Financiado",
      cause: "Falta de consulta indígena previa y controversia territorial en ejido acreditado para parque solar.",
      eventDescription: "Bloqueo de obras por parte de comunidades locales con amplia cobertura en prensa nacional.",
      consequence: "Detención de flujo del proyecto, imposibilidad de pago de deuda y daño a la imagen corporativa.",
      taxonomyId: taxEsg.id,
      origin: "EXTERNAL_EVENTS",
      businessUnitId: buAgro.id,
      processId: procAgro.id,
      processNodeId: nAgro1.id,
      inherentProbability: 2,
      inherentImpact: 4,
      inherentScore: 8,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.4,
      residualProbability: 1.36,
      residualImpact: 3.04,
      residualScore: 4.13,
      residualZone: "GREEN",
      annualFrequencyNet: 0.1,
      avgFinancialImpactMXN: 10000000,
      worstCaseImpactMXN: 25000000,
      expectedAnnualLossPEA: 1000000,
      maxAnnualLossPMA: 18500000,
      reputationalImpactLevel: 4,
      isEmergingRisk: true,
      esgSectorSHCP: "Energía Renovable",
      criticalityRankScore: 54.3,
    },
    {
      code: "RSK-LEG-024",
      title: "Demanda Laboral Colectiva por Interpretación de Esquema de Comisiones",
      cause: "Modificación en el esquema de incentivos comerciales sin adendum contractual debidamente firmado.",
      eventDescription: "Reclamo conjunto de 45 ejecutivos de cuenta en el Tribunal Laboral Federal.",
      consequence: "Constitución forzosa de provisión de pasivo contingente por $18M MXN en balance.",
      taxonomyId: taxLegal.id,
      origin: "PEOPLE",
      businessUnitId: buJur.id,
      processId: procGar.id,
      processNodeId: nGar4.id,
      inherentProbability: 3,
      inherentImpact: 3,
      inherentScore: 9,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.4,
      residualProbability: 2.04,
      residualImpact: 2.28,
      residualScore: 4.65,
      residualZone: "GREEN",
      annualFrequencyNet: 0.2,
      avgFinancialImpactMXN: 9000000,
      worstCaseImpactMXN: 18000000,
      expectedAnnualLossPEA: 1800000,
      maxAnnualLossPMA: 15200000,
      reputationalImpactLevel: 3,
      isEmergingRisk: false,
      criticalityRankScore: 44.9,
    },
    {
      code: "RSK-STRAT-025",
      title: "Desaceleración Económica Sectorial en Arrendamiento de Maquinaria Agroindustrial",
      cause: "Retracción de la inversión fija bruta en el sector agroalimentario por incertidumbre comercial.",
      eventDescription: "Disminución del 25% en la colocación de contratos de arrendamiento puro y financiero.",
      consequence: "Desvío del cumplimiento del plan quinquenal de crecimiento de la subsidiaria de arrendamiento.",
      taxonomyId: taxStrat.id,
      origin: "EXTERNAL_EVENTS",
      businessUnitId: buAgro.id,
      processId: procAgro.id,
      processNodeId: nAgro1.id,
      inherentProbability: 3,
      inherentImpact: 3,
      inherentScore: 9,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.3,
      residualProbability: 2.28,
      residualImpact: 2.46,
      residualScore: 5.61,
      residualZone: "YELLOW",
      annualFrequencyNet: 1.0,
      avgFinancialImpactMXN: 7000000,
      worstCaseImpactMXN: 14000000,
      expectedAnnualLossPEA: 7000000,
      maxAnnualLossPMA: 13500000,
      reputationalImpactLevel: 2,
      isEmergingRisk: false,
      criticalityRankScore: 47.1,
    },
    {
      code: "RSK-CYBER-026",
      title: "Fuga de Información Confidencial de Clientes Corporativos por Empleado Saliente",
      cause: "Falta de revocación inmediata de accesos y ausencia de software de prevención de pérdida de datos (DLP).",
      eventDescription: "Descarga no autorizada de base de datos con saldos y estados de cuenta en dispositivo USB.",
      consequence: "Notificación obligatoria al INAI, multa regulatoria y daño irreparable en la relación con clientes institucionales.",
      taxonomyId: taxCyber.id,
      origin: "PEOPLE",
      businessUnitId: buTi.id,
      processId: procCyber.id,
      processNodeId: nCib3.id,
      inherentProbability: 2,
      inherentImpact: 4,
      inherentScore: 8,
      inherentZone: "YELLOW",
      controlMitigationFactor: 0.5,
      residualProbability: 1.2,
      residualImpact: 2.8,
      residualScore: 3.36,
      residualZone: "GREEN",
      annualFrequencyNet: 0.15,
      avgFinancialImpactMXN: 6000000,
      worstCaseImpactMXN: 20000000,
      expectedAnnualLossPEA: 900000,
      maxAnnualLossPMA: 16500000,
      reputationalImpactLevel: 5,
      isEmergingRisk: true,
      criticalityRankScore: 55.9,
    },
  ];

  const createdRisks = [];
  for (const r of risksSeed) {
    const risk = await prisma.riskEvent.create({
      data: {
        ...r,
        ownerId: uOwnerAgro.id,
      },
    });
    createdRisks.push(risk);
  }

  console.log(`✅ ${createdRisks.length} Riesgos Bancarios CNBV creados en la Matriz Viva.`);

  // Asociar controles a los riesgos creados
  const rCyber = createdRisks[0];
  const rAgro = createdRisks[1];
  const rTes = createdRisks[2];

  await prisma.riskControlMap.create({
    data: {
      riskEventId: rCyber.id,
      controlId: ctrl1.id,
      mitigatesProbWeight: 0.7,
      mitigatesImpWeight: 0.3,
    },
  });

  await prisma.riskControlMap.create({
    data: {
      riskEventId: rAgro.id,
      controlId: ctrl2.id,
      mitigatesProbWeight: 0.6,
      mitigatesImpWeight: 0.4,
    },
  });

  await prisma.riskControlMap.create({
    data: {
      riskEventId: rAgro.id,
      controlId: ctrl4NF.id,
      mitigatesProbWeight: 0.3,
      mitigatesImpWeight: 0.2,
    },
  });

  await prisma.riskControlMap.create({
    data: {
      riskEventId: rTes.id,
      controlId: ctrl3.id,
      mitigatesProbWeight: 0.5,
      mitigatesImpWeight: 0.5,
    },
  });

  // 7. PLANES DE ACCIÓN (CON QUICK-WINS)
  await prisma.actionPlan.create({
    data: {
      code: "PA-2026-001",
      title: "Implementación de Doble Factor Criptográfico Obligatorio en Conector SPEI",
      description: "Automatización en línea (d+0) para bloquear transferencias > $500k USD sin confirmación HSM dual.",
      planTypes: JSON.stringify(["TECHNOLOGY", "PROCESSES"]),
      riskEventId: rCyber.id,
      controlId: ctrl1.id,
      ownerId: uOwnerTes.id,
      improvementPotentialPct: 0.85,
      estimatedCostMXN: 150000,
      costScale: "LOW",
      estimatedDays: 45,
      timeScale: "LOW",
      combinedEffortScore: 1.8,
      expectedPEAReductionMXN: 2125000,
      expectedPMAReductionMXN: 49300000,
      isQuickWin: true, // >= 60% y esfuerzo LOW
      isSuggestedByAI: true,
      status: "APPROVED_COMMITTED",
      dueDate: new Date(Date.now() + 45 * 24 * 3600 * 1000),
      signedByBusinessHead: true,
    },
  });

  await prisma.actionPlan.create({
    data: {
      code: "PA-2026-002",
      title: "Módulo Automatizado de Scoring Climático y Validación DNSH Satelital",
      description: "Integración de API de estrés hídrico de Conagua al flujo de originación de crédito agropecuario.",
      planTypes: JSON.stringify(["TECHNOLOGY"]),
      riskEventId: rAgro.id,
      controlId: ctrl2.id,
      ownerId: uOwnerAgro.id,
      improvementPotentialPct: 0.70,
      estimatedCostMXN: 180000,
      costScale: "LOW",
      estimatedDays: 60,
      timeScale: "LOW",
      combinedEffortScore: 2.0,
      expectedPEAReductionMXN: 6300000,
      expectedPMAReductionMXN: 25550000,
      isQuickWin: true,
      isSuggestedByAI: true,
      status: "IN_PROGRESS",
      dueDate: new Date(Date.now() + 60 * 24 * 3600 * 1000),
      signedByBusinessHead: true,
    },
  });

  await prisma.actionPlan.create({
    data: {
      code: "PA-2026-003",
      title: "Formalización y Migración del Control de Garantías a Sistema Core (Eliminar Excel)",
      description: "Reemplazo de la hoja de cálculo manual por módulo fiduciario con huella criptográfica.",
      planTypes: JSON.stringify(["PROCESSES", "ORGANIZATION"]),
      riskEventId: rAgro.id,
      controlId: ctrl4NF.id,
      ownerId: uOwnerAgro.id,
      improvementPotentialPct: 0.50,
      estimatedCostMXN: 450000,
      costScale: "HIGH",
      estimatedDays: 120,
      timeScale: "MEDIUM",
      combinedEffortScore: 3.5,
      expectedPEAReductionMXN: 4500000,
      expectedPMAReductionMXN: 18250000,
      isQuickWin: false,
      isSuggestedByAI: false,
      status: "DRAFT",
      dueDate: new Date(Date.now() + 120 * 24 * 3600 * 1000),
      signedByBusinessHead: false,
    },
  });

  console.log("✅ Planes de Acción y Quick-Wins creados.");

  // 8. MARCO DE APETITO AL RIESGO (RAF ART. 88 CUB) Y KRIs
  const rafIcap = await prisma.rAFThreshold.create({
    data: {
      metricCode: "ICAP",
      metricName: "Índice de Capitalización Total (ICAP Basilea III)",
      riskType: "CREDIT",
      unit: "%",
      direction: "LOWER_IS_WORSE",
      appetiteValue: 13.0,
      toleranceValue: 11.5,
      regulatoryLimitValue: 10.5,
      capacityValue: 16.0,
      currentValue: 13.85,
      currentZone: "GREEN",
    },
  });

  const rafCet1 = await prisma.rAFThreshold.create({
    data: {
      metricCode: "CET1",
      metricName: "Capital Fundamental (CET1)",
      riskType: "CREDIT",
      unit: "%",
      direction: "LOWER_IS_WORSE",
      appetiteValue: 9.5,
      toleranceValue: 8.0,
      regulatoryLimitValue: 7.0,
      capacityValue: 12.0,
      currentValue: 10.42,
      currentZone: "GREEN",
    },
  });

  const rafCcl = await prisma.rAFThreshold.create({
    data: {
      metricCode: "CCL",
      metricName: "Coeficiente de Cobertura de Liquidez (CCL 30 Días)",
      riskType: "LIQUIDITY",
      unit: "%",
      direction: "LOWER_IS_WORSE",
      appetiteValue: 120.0,
      toleranceValue: 110.0,
      regulatoryLimitValue: 100.0,
      capacityValue: 150.0,
      currentValue: 114.5,
      currentZone: "YELLOW", // Preventivo: entre 110% y 120%
    },
  });

  const rafVar = await prisma.rAFThreshold.create({
    data: {
      metricCode: "VAR_MKT",
      metricName: "Valor en Riesgo de Mercado (VaR 99% 1 Día)",
      riskType: "MARKET",
      unit: "MXN",
      direction: "HIGHER_IS_WORSE",
      appetiteValue: 15000000,
      toleranceValue: 20000000,
      regulatoryLimitValue: 25000000,
      capacityValue: 30000000,
      currentValue: 14200000,
      currentZone: "GREEN",
    },
  });

  const rafSpei = await prisma.rAFThreshold.create({
    data: {
      metricCode: "SPEI_AVAIL",
      metricName: "Disponibilidad del Canal SPEI (Serie R24)",
      riskType: "CYBERSECURITY",
      unit: "%",
      direction: "LOWER_IS_WORSE",
      appetiteValue: 99.90,
      toleranceValue: 99.50,
      regulatoryLimitValue: 99.00,
      capacityValue: 100.0,
      currentValue: 99.96,
      currentZone: "GREEN",
    },
  });

  const rafPeaOp = await prisma.rAFThreshold.create({
    data: {
      metricCode: "PEA_OP",
      metricName: "Pérdida Esperada Anual Operativa (PEA)",
      riskType: "OPERATIONAL",
      unit: "MXN",
      direction: "HIGHER_IS_WORSE",
      appetiteValue: 35000000,
      toleranceValue: 50000000,
      regulatoryLimitValue: 65000000,
      capacityValue: 80000000,
      currentValue: 38400000,
      currentZone: "YELLOW", // Preventivo
    },
  });

  // KRIs
  const kri1 = await prisma.kRI.create({
    data: {
      code: "KRI-SPEI-01",
      name: "Tiempo de Respuesta y Latencia en Despacho SPEI",
      description: "Monitoreo en milisegundos de la latencia en confirmación de transferencias interbancarias.",
      periodicity: "DIARIO",
      riskEventId: rCyber.id,
      rafThresholdId: rafSpei.id,
      ownerId: uOwnerTes.id,
      greenMax: 800,
      yellowMax: 1500,
      orangeMax: 3000,
      currentValue: 420,
      currentZone: "GREEN",
    },
  });

  const kri2 = await prisma.kRI.create({
    data: {
      code: "KRI-AGRO-02",
      name: "Porcentaje de Cartera Agro en Distritos con Sequía Severa",
      description: "Exposición crediticia acumulada en zonas catalogadas D3/D4 por el Monitor de Sequía.",
      periodicity: "MENSUAL",
      riskEventId: rAgro.id,
      ownerId: uOwnerAgro.id,
      greenMax: 15.0,
      yellowMax: 25.0,
      orangeMax: 35.0,
      currentValue: 28.5,
      currentZone: "ORANGE", // Excede tolerancia: requiere Plan firmado
    },
  });

  console.log("✅ Marco RAF y KRIs semaforizados creados.");

  // 9. CARTERA CREDITICIA REALISTA NIF C-16 (ETAPAS 1, 2 Y 3)
  const creditLoansSeed = [
    {
      periodDate: new Date("2026-09-30"),
      loanId: "CR-AGRO-2024-8921",
      commonRiskGroupId: "GRP-AGRO-SONORA-NORTE",
      portfolioSegment: "AGROPECUARIO",
      economicSectorSHCP: "Agropecuario y Forestal",
      daysPastDue: 12,
      hasQualitativeSICR: false,
      nifStage: 1,
      grossExposureEI: 18500000,
      collateralValueC: 22000000,
      haircutExposureHe: 0.05,
      haircutCollateralHc: 0.15,
      haircutFxHfx: 0.0,
      adjustedExposureE: 1475000,
      pd12Months: 0.025,
      pdLifetime: 0.078,
      lgdSeveritySP: 0.35,
      effectiveRate: 0.125,
      remainingTermYears: 2.5,
      expectedCreditLossPCE: 11467,
      rwaAPRC: 1172625,
      esgClimateScore: 45.0,
    },
    {
      periodDate: new Date("2026-09-30"),
      loanId: "CR-AGRO-2023-4112",
      commonRiskGroupId: "GRP-PRODUCTORES-SINALOA",
      portfolioSegment: "AGROPECUARIO",
      economicSectorSHCP: "Agropecuario y Forestal",
      daysPastDue: 55, // Mora 30-89 días -> Etapa 2
      hasQualitativeSICR: true,
      nifStage: 2,
      grossExposureEI: 32000000,
      collateralValueC: 25000000,
      haircutExposureHe: 0.08,
      haircutCollateralHc: 0.20,
      haircutFxHfx: 0.0,
      adjustedExposureE: 14560000,
      pd12Months: 0.085,
      pdLifetime: 0.245,
      lgdSeveritySP: 0.45,
      effectiveRate: 0.138,
      remainingTermYears: 3.0,
      expectedCreditLossPCE: 1215432,
      rwaAPRC: 15433600,
      esgClimateScore: 82.0, // Vulnerabilidad climática alta
    },
    {
      periodDate: new Date("2026-09-30"),
      loanId: "CR-PYME-2022-1094",
      commonRiskGroupId: "GRP-DISTRIBUIDORES-BAJIO",
      portfolioSegment: "PYME",
      economicSectorSHCP: "Comercio Mayorista",
      daysPastDue: 115, // >=90 días -> Etapa 3 (Cartera Vencida)
      hasQualitativeSICR: true,
      nifStage: 3,
      grossExposureEI: 14800000,
      collateralValueC: 8000000,
      haircutExposureHe: 0.10,
      haircutCollateralHc: 0.30,
      haircutFxHfx: 0.0,
      adjustedExposureE: 10680000,
      pd12Months: 1.0,
      pdLifetime: 1.0,
      lgdSeveritySP: 0.65,
      effectiveRate: 0.145,
      remainingTermYears: 1.5,
      expectedCreditLossPCE: 6062882,
      rwaAPRC: 17002560,
      esgClimateScore: 30.0,
    },
    {
      periodDate: new Date("2026-09-30"),
      loanId: "CR-CORP-2025-0033",
      commonRiskGroupId: "GRP-INDUSTRIAL-MONTERREY",
      portfolioSegment: "EMPRESARIAL",
      economicSectorSHCP: "Manufactura y Metalmecánica",
      daysPastDue: 0,
      hasQualitativeSICR: false,
      nifStage: 1,
      grossExposureEI: 75000000,
      collateralValueC: 90000000,
      haircutExposureHe: 0.05,
      haircutCollateralHc: 0.15,
      haircutFxHfx: 0.0,
      adjustedExposureE: 2250000,
      pd12Months: 0.012,
      pdLifetime: 0.038,
      lgdSeveritySP: 0.30,
      effectiveRate: 0.118,
      remainingTermYears: 4.0,
      expectedCreditLossPCE: 7245,
      rwaAPRC: 1788750,
      esgClimateScore: 25.0,
    },
  ];

  for (const loan of creditLoansSeed) {
    await prisma.creditExposureNifC16.create({ data: loan });
  }

  console.log("✅ Cartera Crediticia NIF C-16 creada.");

  // 10. CONTABILIDAD TRIANUAL INDICADOR DE NEGOCIO (IN - ANEXO 1-D BIS CUB)
  await prisma.operationalBusinessIndicator.create({
    data: {
      calculationYear: 2026,
      ilctComponentMXN: 845200000, // Promedio 3 años Intereses
      csComponentMXN: 295400000,   // Servicios
      fcComponentMXN: 112800000,   // Financiero
      totalBusinessIndIN: 1253400000, // Total IN
      regulatoryCapitalOP: 150408000, // Requerimiento Capital Operacional
      rawAccountingJson: JSON.stringify({
        exercises: [
          { year: 2023, interestIncome: 4200000000, interestExpense: 3350000000, feeIncome: 380000000 },
          { year: 2024, interestIncome: 4650000000, interestExpense: 3810000000, feeIncome: 410000000 },
          { year: 2025, interestIncome: 4980000000, interestExpense: 4125000000, feeIncome: 445000000 },
        ],
      }),
    },
  });

  // 11. PORTAFOLIO GLOBAL DE JUICIOS (RIESGO LEGAL)
  await prisma.legalPortfolioCase.createMany({
    data: [
      {
        caseNumber: "EXP-MERC-2025-1422",
        legalType: "MERCANTIL",
        claimedAmountMXN: 28500000,
        adverseProbPct: 35.0,
        provisionedAmountMXN: 9975000,
        status: "DESAHOGO_PRUEBAS",
      },
      {
        caseNumber: "EXP-LAB-2024-0891",
        legalType: "LABORAL",
        claimedAmountMXN: 14200000,
        adverseProbPct: 65.0,
        provisionedAmountMXN: 9230000,
        status: "AUDIENCIA_CONCILIACION",
      },
      {
        caseNumber: "EXP-CNBV-2026-004",
        legalType: "ADMINISTRATIVO_CNBV",
        claimedAmountMXN: 5600000,
        adverseProbPct: 20.0,
        provisionedAmountMXN: 1120000,
        status: "CONTESTACION_OFICIO",
      },
    ],
  });

  // 12. EVENTOS HISTÓRICOS DE PÉRDIDA Y SERIE R24
  await prisma.lossEvent.createMany({
    data: [
      {
        eventCode: "EVT-2025-041",
        riskEventId: rCyber.id,
        occurrenceDate: new Date("2025-07-14"),
        discoveryDate: new Date("2025-07-14"),
        accountingDate: new Date("2025-07-28"),
        grossLossMXN: 1850000,
        recoveryAmountMXN: 1200000,
        netLossMXN: 650000,
        channelAffected: "SPEI",
        downtimeMinutes: 18,
        accountingAccount: "5501-08-001 (Quebrantos Operativos)",
      },
      {
        eventCode: "EVT-2026-009",
        occurrenceDate: new Date("2026-02-10"),
        discoveryDate: new Date("2026-02-11"),
        accountingDate: new Date("2026-02-28"),
        grossLossMXN: 420000,
        recoveryAmountMXN: 0,
        netLossMXN: 420000,
        channelAffected: "Banca Móvil B×+",
        downtimeMinutes: 45,
        accountingAccount: "5501-08-004 (Fallas en Canales Digitales)",
      },
    ],
  });

  // 13. BITÁCORA CRIPTOGRÁFICA INALTERABLE (AUDIT LOG SHA-256 HASH CHAIN)
  const genesisHash = "0000000000000000000000000000000000000000000000000000000000000000_GENESIS_BANCO_BX_PLUS";
  const now = new Date();

  // Log 1: Creación del Sistema y Marco RAF
  const payload1 = `${genesisHash}|${now.toISOString()}|${uCair.id}|INIT_SYSTEM|{"rafThresholds":6}`;
  const hash1 = sha256(payload1);

  await prisma.auditLog.create({
    data: {
      timestamp: now,
      userId: uCair.id,
      userRole: "C_LEVEL_CAIR",
      actionType: "INIT_SYSTEM",
      entityName: "RAFThreshold",
      entityId: "SYS-INIT",
      previousStateJson: null,
      newStateJson: JSON.stringify({ message: "Aprobación y carga de Umbrales RAF Art. 88 CUB por el CAIR" }),
      ipAddress: "10.0.12.4 (Red Central B×+)",
      previousHash: genesisHash,
      currentHash: hash1,
    },
  });

  // Log 2: Publicación de Matriz Viva
  const time2 = new Date(now.getTime() + 1000);
  const payload2 = `${hash1}|${time2.toISOString()}|${uUairAdmin.id}|PUBLISH_RISK_MATRIX|{"risksCount":26}`;
  const hash2 = sha256(payload2);

  await prisma.auditLog.create({
    data: {
      timestamp: time2,
      userId: uUairAdmin.id,
      userRole: "UAIR_ADMIN",
      actionType: "PUBLISH_RISK_MATRIX",
      entityName: "RiskEvent",
      entityId: "MATRIX-2026-Q3",
      previousStateJson: JSON.stringify({ status: "DRAFT" }),
      newStateJson: JSON.stringify({ status: "PUBLISHED_ACTIVE", count: 26 }),
      ipAddress: "10.0.12.89 (UAIR Segurizada)",
      previousHash: hash1,
      currentHash: hash2,
    },
  });

  // Log 3: Aprobación de Plan Quick-Win
  const time3 = new Date(now.getTime() + 2000);
  const payload3 = `${hash2}|${time3.toISOString()}|${uOwnerTes.id}|APPROVE_QUICK_WIN|{"planCode":"PA-2026-001"}`;
  const hash3 = sha256(payload3);

  await prisma.auditLog.create({
    data: {
      timestamp: time3,
      userId: uOwnerTes.id,
      userRole: "PROCESS_OWNER",
      actionType: "APPROVE_QUICK_WIN",
      entityName: "ActionPlan",
      entityId: "PA-2026-001",
      previousStateJson: JSON.stringify({ status: "DRAFT" }),
      newStateJson: JSON.stringify({ status: "APPROVED_COMMITTED", isQuickWin: true, signedByBusinessHead: true }),
      ipAddress: "10.0.14.22 (Mesa Tesorería)",
      previousHash: hash2,
      currentHash: hash3,
    },
  });

  console.log("✅ Bitácora Criptográfica Inalterable (Audit Trail SHA-256) sellada exitosamente.");
  console.log("🎉 Seed completo finalizado con éxito.");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
