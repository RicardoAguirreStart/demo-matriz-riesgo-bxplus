// src/components/CopilotModal.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { RoleType } from "@/types";
import { X, Send } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-ajuste de altura del campo de escritura
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 130)}px`;
    }
  }, [input]);

  // Auto-scroll al final del chat al recibir mensajes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (msgText?: string) => {
    const text = msgText || input;
    if (!text.trim()) return;

    const newMsgs = [...messages, { sender: "user" as const, text }];
    setMessages(newMsgs);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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
        {/* Header - Sin icono previo, tipografía institucional limpia */}
        <div className="bg-[#1F242B] text-white p-4 flex items-center justify-between border-b border-gray-800">
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
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 cursor-pointer transition-colors" title="Cerrar asistente">
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
                    ? "bg-[#1F242B] text-white rounded-tr-none shadow-xs"
                    : "bg-white text-gray-800 rounded-tl-none border border-gray-200 shadow-xs"
                }`}
              >
                {m.sender === "copilot" ? (
                  <MarkdownRenderer content={m.text} />
                ) : (
                  <div className="whitespace-pre-wrap">{m.text}</div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 text-xs text-gray-500 items-center p-2.5 bg-white rounded border border-gray-200 max-w-sm shadow-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span>Consultando contexto normativo y cuantitativo B×+...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions Bar */}
        <div className="p-2 bg-gray-50 border-t border-gray-200 flex gap-1.5 overflow-x-auto text-[10px]">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(s)}
              className="whitespace-nowrap bg-white hover:bg-gray-100 text-gray-700 px-2.5 py-1 rounded border border-gray-300 font-medium cursor-pointer transition-colors shrink-0"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar con Textarea Auto-ajustable */}
        <div className="p-3 bg-white border-t border-gray-200 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Escribe tu consulta sobre riesgos, RAF o NIF C-16... (Shift + Enter para nueva línea)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 p-2 border border-gray-300 rounded text-xs outline-none focus:border-[#3299A8] resize-none min-h-[38px] max-h-[130px] leading-relaxed transition-all"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-[#1F242B] hover:bg-[#2A313C] text-white p-2.5 rounded text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer shrink-0 h-[38px] flex items-center justify-center"
            title="Enviar mensaje"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
