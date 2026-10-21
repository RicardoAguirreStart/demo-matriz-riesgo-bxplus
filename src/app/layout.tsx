// src/app/layout.tsx

import type { Metadata } from "next";
import { Arvo, Inter } from "next/font/google";
import "./globals.css";

const arvo = Arvo({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-arvo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Herramienta Inteligente de Gestión de Riesgos Relevantes y Emergentes — Banco Ve por Más (B×+)",
  description:
    "Plataforma integral de administración de riesgos bancarios bajo regulación CNBV, CUB, NIF C-16, Basilea III y Taxonomía Sostenible SHCP, con B×+ Risk Copilot (Gemini AI).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${arvo.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-bx-surface text-bx-slate-dark antialiased">
        {children}
      </body>
    </html>
  );
}
