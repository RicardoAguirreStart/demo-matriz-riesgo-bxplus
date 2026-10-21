// src/components/ui/CustomSelect.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  badge?: string;
  description?: string;
  dotColor?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  icon?: React.ReactNode;
  theme?: "dark" | "light";
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  icon,
  theme = "dark",
  placeholder = "Seleccionar...",
  className = "",
  dropdownClassName = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDark = theme === "dark";

  return (
    <div ref={containerRef} className={`relative inline-block text-xs ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-md border font-medium transition-all ${
          isDark
            ? "bg-[#292F38] text-gray-200 border-gray-700 hover:border-gray-500 focus:ring-1 focus:ring-[#C0D725]"
            : "bg-white text-gray-800 border-gray-300 hover:border-gray-400 focus:ring-1 focus:ring-[#3299A8] shadow-sm"
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {icon && <span className="shrink-0">{icon}</span>}
          {selectedOption?.dotColor && (
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
              style={{ backgroundColor: selectedOption.dotColor }}
            />
          )}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#C0D725]" : "text-gray-400"
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 mt-1 min-w-[220px] max-h-64 overflow-y-auto rounded-md shadow-2xl z-50 border p-1 text-xs animate-in fade-in-50 zoom-in-95 duration-150 ${
            isDark
              ? "bg-[#1F242B] border-gray-700 text-gray-200"
              : "bg-white border-gray-200 text-gray-800"
          } ${dropdownClassName}`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-2.5 py-2 rounded cursor-pointer transition-colors ${
                  isSelected
                    ? isDark
                      ? "bg-[#292F38] text-[#C0D725] font-bold"
                      : "bg-cyan-50 text-[#3299A8] font-bold"
                    : isDark
                    ? "hover:bg-[#2A313C] text-gray-300"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  {opt.dotColor && (
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
                      style={{ backgroundColor: opt.dotColor }}
                    />
                  )}
                  <div className="truncate">
                    <div className="truncate">{opt.label}</div>
                    {opt.description && (
                      <div className="text-[10px] opacity-60 truncate">{opt.description}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {opt.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        isDark ? "bg-[#171B20] text-gray-400" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
