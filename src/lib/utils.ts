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
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "YELLOW":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "ORANGE":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "RED":
      return "bg-rose-100 text-rose-800 border-rose-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
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
