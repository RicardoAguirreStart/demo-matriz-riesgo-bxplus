// src/components/CopilotModal.tsx
"use client";

import React, { useState } from "react";
import { RoleType } from "@/types";
import { Sparkles, X, Send, BrainCircuit, ShieldAlert } from "lucide-react";

interface CopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: RoleType;
}

export function CopilotModal({ isOpen, onClose, currentRole }: CopilotModalProps) {
  const [messages, setMessages] = useState<Array<{ sender: "user" | "copilot"; text: string }>>([
    {
      sender: "copilot",
      text: "¡Hola! Soy **B×+ Risk Copilot**. Estoy analizando en tiempo real la matriz de riesgos de Banco Ve por Más, los consumos del Marco RAF y las circulares vigentes de la CNBV y Banxico. ¿En qué puedo asistirte?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (msgText?: string) => {
    const text = msgText || input;
    if (!text.trim()) return;

    const newMsgs = [...messages, { sender: "user" as const, text }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

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
        setMessages([...newMsgs, { sender: "copilot", text: data.answer }]);
      } else {
        setMessages([
          ...newMsgs,
          { sender: "copilot", text: "Disculpa, ocurrió una intermitencia al conectar con la API de Gemini." },
        ]);
      }
    } catch (e) {
      console.error("Error in Copilot modal chat:", e);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "¿Qué impacto tiene el KRI de sequía en la migración a Etapa 2 de la NIF C-16?",
    "¿Cómo mitigamos el riesgo de ciberataque en el enlace mayorista de SPEI?",
    "Explica los límites de acumulación por Grupo de Riesgo Común (Art. 2 Bis 69 CUB)",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full h-[650px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">
        {/* Header */}
        <div className="bg-[#1F242B] text-white p-4 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#C0D725] text-[#1F242B]">
              <Sparkles className="w-5 h-5 fill-[#1F242B]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-[#C0D725] uppercase font-bold tracking-wider">
                  Gemini 2.5 Pro Grounded RAG
                </span>
              </div>
              <h3 className="text-sm font-bold text-white font-serif">
                B×+ Risk Copilot — Asistente Cuantitativo
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAFBFD]">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-2.5 max-w-[85%] ${
                m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  m.sender === "user"
                    ? "bg-[#1F242B] text-white"
                    : "bg-[#C0D725] text-[#1F242B]"
                }`}
              >
                {m.sender === "user" ? "Tú" : "IA"}
              </div>
              <div
                className={`p-3 rounded-lg text-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-[#1F242B] text-white rounded-tr-none"
                    : "bg-white text-gray-800 rounded-tl-none border border-gray-200 shadow-sm"
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 text-xs text-gray-500 items-center p-2 bg-white rounded border max-w-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Consultando contexto normativo y cuantitativo B×+...</span>
            </div>
          )}
        </div>

        {/* Suggestions Bar */}
        <div className="p-2 bg-gray-50 border-t border-gray-200 flex gap-1.5 overflow-x-auto text-[10px]">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="whitespace-nowrap bg-white hover:bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-300 font-medium"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="Escribe tu consulta sobre riesgos, RAF o NIF C-16..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 p-2 border border-gray-300 rounded text-xs outline-none focus:border-[#3299A8]"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading}
            className="bg-[#1F242B] hover:bg-[#2A313C] text-white p-2 rounded text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
