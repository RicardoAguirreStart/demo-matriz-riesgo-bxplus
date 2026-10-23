// src/components/Header.tsx
"use client";

import React from "react";
import { BUSINESS_LINES_CONFIG, DEMO_ROLES } from "@/lib/constants";
import { BusinessLineBancoBx, RoleType } from "@/types";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedBusinessLine: BusinessLineBancoBx;
  setSelectedBusinessLine: (line: BusinessLineBancoBx) => void;
  currentRole: RoleType;
  setCurrentRole: (role: RoleType) => void;
  onOpenCopilot: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  selectedBusinessLine,
  setSelectedBusinessLine,
  currentRole,
  setCurrentRole,
  onOpenCopilot,
}: HeaderProps) {
  // Orden exacto solicitado: Dashboard → Marco Teórico → Diagramador → Matriz Viva → Matriz 5x5 → Simulador → Planes & Quick-Wins → Importador → Reportes & Audit Trail
  const navTabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "methodology", label: "Marco Teórico" },
    { id: "flowchart", label: "Diagramador" },
    { id: "risks", label: "Matriz Viva" },
    { id: "heatmap", label: "Matriz 5x5" },
    { id: "emerging-cube", label: "Matriz Riesgos Emergentes" },
    { id: "copilot", label: "Simulador" },
    { id: "plans", label: "Planes & Quick-Wins" },
    { id: "importer", label: "Importador" },
    { id: "reports", label: "Reportes & Audit Trail" },
  ];

  const businessLineOptions = BUSINESS_LINES_CONFIG.map((bl) => ({
    value: bl.id,
    label: bl.label,
    badge: bl.unitCode,
  }));

  const roleOptions = DEMO_ROLES.map((r) => ({
    value: r.id,
    label: r.label,
    badge: r.lineDef,
    description: r.description,
  }));

  return (
    <header className="sticky top-0 z-50 bg-[#1F242B] text-white border-b border-gray-800 shadow-md w-full">
      {/* Top Banner with Brand & Selectors - Full Width */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo Banco Bx+ */}
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => setActiveTab("dashboard")}
        >
          <img
            src="/log_Bx+.svg"
            alt="Banco Ve por Más"
            className="h-8 md:h-9 w-auto object-contain"
          />
          <div className="h-6 w-[1px] bg-gray-700 hidden sm:block" />
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-gray-200 tracking-wide uppercase">
              Banco Ve por Más
            </div>
            <div className="text-[10px] text-[#C0D725] tracking-wider font-mono">
              Herramienta Inteligente para la Gestión de Riesgos Relevantes y Emergentes
            </div>
          </div>
        </div>

        {/* Global Selectors: Business Unit & Role Switcher using CustomSelect (sin iconos) */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Custom Business Line Selector sin icono */}
          <CustomSelect
            value={selectedBusinessLine}
            onChange={(val) => setSelectedBusinessLine(val as BusinessLineBancoBx)}
            options={businessLineOptions}
            theme="dark"
            className="min-w-[210px]"
            dropdownClassName="w-[280px]"
          />

          {/* Custom RBAC Role Switcher sin icono */}
          <CustomSelect
            value={currentRole}
            onChange={(val) => setCurrentRole(val as RoleType)}
            options={roleOptions}
            theme="dark"
            className="min-w-[210px]"
            dropdownClassName="w-[300px]"
          />

          {/* Insignia Button: Bx+ Risk Copilot (sin icono) */}
          <button
            onClick={onOpenCopilot}
            className="bg-[#C0D725] hover:bg-[#AEC41D] text-[#1F242B] font-bold text-xs px-4 py-2 rounded-md shadow-sm transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            B×+ Risk Copilot
          </button>
        </div>
      </div>

      {/* Navigation Sub-Header Tabs - Full Width (sin iconos) */}
      <div className="bg-[#171B20] px-4 sm:px-6 lg:px-8 border-t border-gray-800/80 w-full">
        <div className="w-full flex space-x-1 overflow-x-auto py-1 scrollbar-none">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-4 py-2 text-xs font-semibold rounded-t-md transition-all border-b-2 ${
                  isActive
                    ? "border-[#C0D725] text-[#C0D725] bg-[#21262E]"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#1E232B]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
