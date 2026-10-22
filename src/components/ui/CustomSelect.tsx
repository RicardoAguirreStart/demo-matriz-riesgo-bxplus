// src/components/ui/CustomSelect.tsx
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

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
  searchPlaceholder?: string;
  searchable?: boolean;
  className?: string;
  dropdownClassName?: string;
}

export function normalizeSearchString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Realiza una búsqueda abierta multitérmino sin importar el orden ni la contigüidad.
 * Ejemplo: "crédito digital" coincide con "Proceso de Solicitud y Dispersión de Crédito PyME Digital"
 */
export function matchesFuzzyMultiWord(targetText: string, searchQuery: string): boolean {
  const trimmed = searchQuery.trim();
  if (!trimmed) return true;

  const normalizedTarget = normalizeSearchString(targetText);
  const tokens = normalizeSearchString(trimmed)
    .split(/[\s,;/|]+/)
    .filter((t) => t.length > 0);

  if (tokens.length === 0) return true;

  // Cada palabra o token buscado debe estar presente en el texto objetivo
  return tokens.every((token) => normalizedTarget.includes(token));
}

export function CustomSelect({
  value,
  onChange,
  options,
  icon,
  theme = "dark",
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  searchable = true,
  className = "",
  dropdownClassName = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-focus search input when opening dropdown
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  const isDark = theme === "dark";

  // Búsqueda abierta multitérmino (coincide en label, description, badge o value sin importar el orden de las palabras)
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    return options.filter((opt) => {
      const fullTarget = `${opt.label} ${opt.description || ""} ${opt.badge || ""} ${opt.value}`;
      return matchesFuzzyMultiWord(fullTarget, searchTerm);
    });
  }, [options, searchTerm]);

  // Handle keyboard navigation in search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" && filteredOptions.length === 1) {
      onChange(filteredOptions[0].value);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative text-xs min-w-0 ${className ? className : "w-full"}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-w-0 flex items-center justify-between gap-2 px-3 py-1.5 rounded-md border font-medium transition-all ${
          isDark
            ? "bg-[#292F38] text-gray-200 border-gray-700 hover:border-gray-500 focus:ring-1 focus:ring-[#C0D725]"
            : "bg-white text-gray-800 border-gray-300 hover:border-gray-400 focus:ring-1 focus:ring-[#3299A8] shadow-sm"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
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
          className={`absolute left-0 mt-1 w-full min-w-[220px] max-w-[calc(100vw-2rem)] max-h-72 overflow-y-auto rounded-md shadow-2xl z-50 border p-1 text-xs animate-in fade-in-50 zoom-in-95 duration-150 ${
            isDark
              ? "bg-[#1F242B] border-gray-700 text-gray-200"
              : "bg-white border-gray-200 text-gray-800"
          } ${dropdownClassName}`}
        >
          {/* Search Box Header */}
          {searchable && (
            <div
              className={`sticky top-0 z-20 pb-1.5 pt-0.5 px-0.5 border-b mb-1 ${
                isDark
                  ? "bg-[#1F242B] border-gray-700/80"
                  : "bg-white border-gray-200"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative flex items-center">
                <Search
                  className={`w-3.5 h-3.5 absolute left-2.5 shrink-0 pointer-events-none ${
                    isDark ? "text-gray-400" : "text-gray-400"
                  }`}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className={`w-full pl-8 pr-7 py-1.5 rounded text-xs transition-all border outline-none ${
                    isDark
                      ? "bg-[#292F38] text-gray-100 border-gray-700 focus:border-[#C0D725] focus:ring-1 focus:ring-[#C0D725]/50 placeholder:text-gray-500"
                      : "bg-gray-50 text-gray-900 border-gray-300 focus:border-[#3299A8] focus:ring-1 focus:ring-[#3299A8]/50 placeholder:text-gray-400"
                  }`}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      searchInputRef.current?.focus();
                    }}
                    className={`absolute right-2 p-0.5 rounded hover:bg-gray-700/30 transition-colors ${
                      isDark ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
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
                    <div className="flex items-center gap-2 truncate pr-2 min-w-0">
                      {opt.dotColor && (
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
                          style={{ backgroundColor: opt.dotColor }}
                        />
                      )}
                      <div className="truncate min-w-0">
                        <div className="truncate">{opt.label}</div>
                        {opt.description && (
                          <div className="text-[10px] opacity-60 truncate">{opt.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {opt.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-[3px] font-mono font-semibold tracking-wider uppercase border ${
                            isDark
                              ? "bg-[#14181D] text-[#C0D725] border-gray-700/80"
                              : "bg-slate-100 text-[#3299A8] border-slate-200"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className={`py-4 px-3 text-center text-xs ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No se encontraron opciones para &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
