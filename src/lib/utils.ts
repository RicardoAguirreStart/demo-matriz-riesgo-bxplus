// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { RAFZone } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMXN(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "$0.00 MXN";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPct(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) return "0.00%";
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: decimals,
  }).format(value);
}

export function getZoneBadgeClasses(zone: RAFZone | string): string {
  switch (zone) {
    case "GREEN":
      return "bg-emerald-50 text-emerald-900 border border-emerald-300/80 font-mono text-[10px] font-semibold tracking-wide uppercase shadow-xs";
    case "YELLOW":
      return "bg-amber-50 text-amber-950 border border-amber-300/80 font-mono text-[10px] font-semibold tracking-wide uppercase shadow-xs";
    case "ORANGE":
      return "bg-orange-50 text-orange-950 border border-orange-300/80 font-mono text-[10px] font-semibold tracking-wide uppercase shadow-xs";
    case "RED":
      return "bg-rose-50 text-rose-950 border border-rose-300/80 font-mono text-[10px] font-semibold tracking-wide uppercase shadow-xs";
    default:
      return "bg-slate-50 text-slate-800 border border-slate-300/80 font-mono text-[10px] font-semibold tracking-wide uppercase shadow-xs";
  }
}

export function getZoneLabel(zone: RAFZone | string): string {
  switch (zone) {
    case "GREEN":
      return "Verde (Apetito)";
    case "YELLOW":
      return "Amarillo (Preventivo)";
    case "ORANGE":
      return "Naranja (Elevado)";
    case "RED":
      return "Rojo (Transgresión)";
    default:
      return zone;
  }
}

export function calculateRafZone(
  current: number,
  direction: string,
  appetite: number,
  tolerance: number,
  regLimit: number
): "GREEN" | "YELLOW" | "ORANGE" | "RED" {
  if (direction === "HIGHER_IS_WORSE") {
    if (current <= appetite) return "GREEN";
    if (current <= tolerance) return "YELLOW";
    if (current <= regLimit) return "ORANGE";
    return "RED";
  } else {
    // LOWER_IS_WORSE (e.g. ICAP, CET1, CCL, SPEI_AVAIL)
    if (current >= appetite) return "GREEN";
    if (current >= tolerance) return "YELLOW";
    if (current >= regLimit) return "ORANGE";
    return "RED";
  }
}
