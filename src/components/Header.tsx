// src/components/Header.tsx
"use client";

import React from "react";
import { BUSINESS_LINES_CONFIG, DEMO_ROLES } from "@/lib/constants";
import { BusinessLineBancoBx, RoleType } from "@/types";
import { Sparkles, Shield, Building2, UserCheck, ChevronDown } from "lucide-react";

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
  const currentRoleObj = DEMO_ROLES.find((r) => r.id === currentRole) || DEMO_ROLES[0];

  const navTabs = [
    { id: "dashboard", label: "Dashboard C-Level & RAF", icon: "📊" },
    { id: "flowchart", label: "Diagramador de Procesos", icon: "🔄" },
    { id: "heatmap", label: "Matriz 5x5 CNBV", icon: "🎯" },
    { id: "risks", label: "Matriz Viva & Catálogo", icon: "📋" },
    { id: "plans", label: "Planes & Quick-Wins", icon: "⚡" },
    { id: "importer", label: "Importador Layouts", icon: "📥" },
    { id: "copilot", label: "Simulador de Estrés", icon: "🧪" },
    { id: "reports", label: "Reportes & Audit Trail", icon: "📜" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#1F242B] text-white border-b border-gray-800 shadow-md">
      {/* Top Banner with Brand & Selectors */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo Banco Bx+ */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
          <div className="flex items-center tracking-tight font-serif text-2xl font-bold text-white">
            <span>B</span>
            <span className="text-gray-400 font-sans mx-0.5">×</span>
            <span className="text-[#C0D725] text-3xl leading-none font-sans font-black">+</span>
          </div>
          <div className="h-6 w-[1px] bg-gray-700 hidden sm:block" />
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-gray-200 tracking-wide uppercase">
              Banco Ve por Más
            </div>
            <div className="text-[10px] text-[#C0D725] tracking-wider font-mono">
              RIESGOS RELEVANTES Y EMERGENTES
            </div>
          </div>
        </div>

        {/* Global Selectors: Business Unit & Role Switcher */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Business Line Selector */}
          <div className="relative flex items-center bg-[#292F38] rounded-md px-2.5 py-1.5 border border-gray-700 hover:border-gray-600 text-xs">
            <Building2 className="w-3.5 h-3.5 text-[#3299A8] mr-1.5" />
            <select
              value={selectedBusinessLine}
              onChange={(e) => setSelectedBusinessLine(e.target.value as BusinessLineBancoBx)}
              className="bg-transparent text-gray-200 outline-none cursor-pointer pr-4 font-medium"
            >
              {BUSINESS_LINES_CONFIG.map((bl) => (
                <option key={bl.id} value={bl.id} className="bg-[#1F242B] text-white">
                  {bl.label}
                </option>
              ))}
            </select>
          </div>

          {/* RBAC Role Switcher */}
          <div className="relative flex items-center bg-[#292F38] rounded-md px-2.5 py-1.5 border border-gray-700 hover:border-gray-600 text-xs">
            <Shield className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as RoleType)}
              className="bg-transparent text-gray-200 outline-none cursor-pointer pr-4 font-medium"
            >
              {DEMO_ROLES.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#1F242B] text-white">
                  {r.label} ({r.lineDef})
                </option>
              ))}
            </select>
          </div>

          {/* Insignia Button: Bx+ Risk Copilot */}
          <button
            onClick={onOpenCopilot}
            className="flex items-center space-x-1.5 bg-[#C0D725] hover:bg-[#AEC41D] text-[#1F242B] font-bold text-xs px-3.5 py-2 rounded-md shadow-sm transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 fill-[#1F242B]" />
            <span>✨ B×+ Risk Copilot</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Header Tabs */}
      <div className="bg-[#171B20] px-4 sm:px-6 lg:px-8 border-t border-gray-800/80">
        <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto py-1 scrollbar-none">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3.5 py-2 text-xs font-semibold rounded-t-md transition-all flex items-center space-x-1.5 border-b-2 ${
                  isActive
                    ? "border-[#C0D725] text-[#C0D725] bg-[#21262E]"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#1E232B]"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
