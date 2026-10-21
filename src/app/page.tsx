// src/app/page.tsx
"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { FloatingSafetyWidget } from "@/components/FloatingSafetyWidget";
import { CopilotModal } from "@/components/CopilotModal";
import { DashboardView } from "@/components/DashboardView";
import { FlowchartView } from "@/components/FlowchartView";
import { HeatmapView } from "@/components/HeatmapView";
import { RiskAdminView } from "@/components/RiskAdminView";
import { ActionPlansView } from "@/components/ActionPlansView";
import { ImporterView } from "@/components/ImporterView";
import { CopilotView } from "@/components/CopilotView";
import { RegulatoryReportsView } from "@/components/RegulatoryReportsView";
import { BusinessLineBancoBx, RoleType } from "@/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedBusinessLine, setSelectedBusinessLine] = useState<BusinessLineBancoBx>("ALL");
  const [currentRole, setCurrentRole] = useState<RoleType>("C_LEVEL_CAIR");
  const [isCopilotModalOpen, setIsCopilotModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7F9] w-full">
      {/* Institutional Header - Full Width */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedBusinessLine={selectedBusinessLine}
        setSelectedBusinessLine={setSelectedBusinessLine}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        onOpenCopilot={() => setIsCopilotModalOpen(true)}
      />

      {/* Main Content Area - Full Width with proper padding and margins */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "dashboard" && (
          <DashboardView
            businessLine={selectedBusinessLine}
            currentRole={currentRole}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenCopilot={() => setIsCopilotModalOpen(true)}
          />
        )}

        {activeTab === "flowchart" && (
          <FlowchartView onOpenCopilot={() => setIsCopilotModalOpen(true)} />
        )}

        {activeTab === "heatmap" && (
          <HeatmapView businessLine={selectedBusinessLine} />
        )}

        {activeTab === "risks" && (
          <RiskAdminView
            businessLine={selectedBusinessLine}
            currentRole={currentRole}
          />
        )}

        {activeTab === "plans" && (
          <ActionPlansView currentRole={currentRole} />
        )}

        {activeTab === "importer" && (
          <ImporterView currentRole={currentRole} />
        )}

        {activeTab === "copilot" && (
          <CopilotView currentRole={currentRole} />
        )}

        {activeTab === "reports" && (
          <RegulatoryReportsView currentRole={currentRole} />
        )}
      </main>

      {/* Institutional Floating Safety & RAF Alerts Widget */}
      <FloatingSafetyWidget
        onOpenCopilot={() => setIsCopilotModalOpen(true)}
        onNavigateToPlans={() => setActiveTab("plans")}
      />

      {/* Global AI Copilot Modal */}
      <CopilotModal
        isOpen={isCopilotModalOpen}
        onClose={() => setIsCopilotModalOpen(false)}
        currentRole={currentRole}
      />

      {/* Footer - Full Width */}
      <footer className="bg-[#1F242B] text-gray-400 text-xs py-4 px-4 sm:px-6 lg:px-8 border-t border-gray-800 mt-auto w-full">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <span className="font-semibold text-gray-200">Banco Ve por Más, S.A., Institución de Banca Múltiple</span>
            <span className="mx-2">•</span>
            <span>Grupo Financiero Ve por Más (B×+)</span>
          </div>
          <div className="font-mono text-[11px] text-gray-400">
            AIR CNBV • CUB Vigente • Basilea III • NIF C-16 • SHCP Taxonomía Sostenible
          </div>
        </div>
      </footer>
    </div>
  );
}
