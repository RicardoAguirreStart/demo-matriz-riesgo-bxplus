// src/components/ui/MarkdownRenderer.tsx
"use client";

import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return null;

  // Dividir en bloques por líneas dobles o saltos de bloque
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
  let currentTable: { headers: string[]; rows: string[][] } | null = null;
  let paragraphLines: string[] = [];

  const flushParagraph = (key: string) => {
    if (paragraphLines.length > 0) {
      const fullText = paragraphLines.join("\n").trim();
      if (fullText) {
        elements.push(
          <p key={key} className="leading-relaxed text-gray-800 my-1.5 font-sans">
            {renderInline(fullText)}
          </p>
        );
      }
      paragraphLines = [];
    }
  };

  const flushList = (key: string) => {
    if (currentList && currentList.items.length > 0) {
      if (currentList.type === "ul") {
        elements.push(
          <ul key={key} className="my-2 ml-4 space-y-1 list-disc list-outside text-gray-800 marker:text-[#3299A8]">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed pl-1">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={key} className="my-2 ml-4 space-y-1 list-decimal list-outside text-gray-800 marker:text-gray-600 marker:font-bold">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed pl-1">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  const flushTable = (key: string) => {
    if (currentTable && currentTable.headers.length > 0) {
      elements.push(
        <div key={key} className="overflow-x-auto my-3 border border-gray-200 rounded-lg shadow-2xs">
          <table className="w-full text-xs">
            <thead className="bg-[#1F242B] text-white text-[10px] uppercase font-mono tracking-wider">
              <tr>
                {currentTable.headers.map((h, i) => (
                  <th key={i} className="py-2 px-3 font-semibold text-left">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {currentTable.rows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 text-gray-700">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // 1. Bloques de código ```
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        // Cierre de bloque de código
        elements.push(
          <pre
            key={`code-${index}`}
            className="my-2.5 p-3 rounded-md bg-[#1F242B] text-[#C0D725] font-mono text-[11px] overflow-x-auto border border-gray-800"
          >
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushParagraph(`p-pre-${index}`);
        flushList(`list-pre-${index}`);
        flushTable(`tbl-pre-${index}`);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Líneas vacías
    if (!trimmed) {
      flushParagraph(`p-empty-${index}`);
      flushList(`list-empty-${index}`);
      flushTable(`tbl-empty-${index}`);
      return;
    }

    // Horizontal Rule (--- o *** o ___)
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      flushParagraph(`p-hr-${index}`);
      flushList(`list-hr-${index}`);
      flushTable(`tbl-hr-${index}`);
      elements.push(<hr key={`hr-${index}`} className="my-3 border-gray-200" />);
      return;
    }

    // Tablas Markdown (| col 1 | col 2 |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushParagraph(`p-tbl-${index}`);
      flushList(`list-tbl-${index}`);

      const cells = trimmed
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

      const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));

      if (isSeparator) {
        return;
      }

      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      return;
    } else if (currentTable) {
      flushTable(`tbl-end-${index}`);
    }

    // Encabezados de sección numerados ejecutivos
    // Detecta: "1. DIAGNÓSTICO...", "**1. DIAGNÓSTICO...**", "1. **DIAGNÓSTICO...**", "### 1. DIAGNÓSTICO..."
    const cleanForSection = trimmed
      .replace(/^#{1,4}\s+/, "")
      .replace(/^\*{1,2}/, "")
      .replace(/\*{1,2}:?$/, "")
      .replace(/\*\*/g, "")
      .trim();

    const sectionMatch = cleanForSection.match(/^(\d+)\.\s+([A-ZÁÉÍÓÚÑ\s0-9—–\(\)\/&:\.,\-]{4,})$/);
    if (sectionMatch) {
      flushParagraph(`p-sec-${index}`);
      flushList(`list-sec-${index}`);
      flushTable(`tbl-sec-${index}`);
      const num = sectionMatch[1];
      const rawTitle = sectionMatch[2].replace(/:$/, "").trim();
      elements.push(
        <div key={`section-h-${index}`} className="mt-4 mb-2.5 pt-3 border-t border-emerald-100 first:mt-0 first:pt-0">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1F242B] text-[#C0D725] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 shadow-xs">
              {num}
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 font-serif">
              {rawTitle}
            </h3>
          </div>
        </div>
      );
      return;
    }

    // 2. Encabezados (#, ##, ###, ####)
    if (trimmed.startsWith("#")) {
      flushParagraph(`p-h-${index}`);
      flushList(`list-h-${index}`);
      flushTable(`tbl-h-${index}`);

      const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];

        if (level === 1) {
          elements.push(
            <h1 key={`h1-${index}`} className="text-base font-bold font-serif text-gray-900 mt-3 mb-1.5 pb-1 border-b border-gray-200">
              {renderInline(text)}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2 key={`h2-${index}`} className="text-sm font-bold font-serif text-gray-900 mt-2.5 mb-1 pb-0.5 border-b border-gray-100">
              {renderInline(text)}
            </h2>
          );
        } else if (level === 3) {
          elements.push(
            <h3 key={`h3-${index}`} className="text-xs font-bold text-gray-900 mt-2 mb-1">
              {renderInline(text)}
            </h3>
          );
        } else {
          elements.push(
            <h4 key={`h4-${index}`} className="text-xs font-semibold text-gray-800 mt-1.5 mb-0.5">
              {renderInline(text)}
            </h4>
          );
        }
        return;
      }
    }

    // 3. Citas / Blockquotes (>)
    if (trimmed.startsWith(">")) {
      flushParagraph(`p-quote-${index}`);
      flushList(`list-quote-${index}`);
      flushTable(`tbl-quote-${index}`);
      const quoteText = trimmed.replace(/^>\s*/, "");
      elements.push(
        <blockquote
          key={`quote-${index}`}
          className="my-2 pl-3 border-l-2 border-[#3299A8] text-gray-700 italic bg-cyan-50/40 py-1 pr-2 rounded-r text-xs"
        >
          {renderInline(quoteText)}
        </blockquote>
      );
      return;
    }

    // 4. Listas desordenadas (- o * o •)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph(`p-ul-${index}`);
      flushTable(`tbl-ul-${index}`);
      if (!currentList || currentList.type !== "ul") {
        flushList(`list-sw-${index}`);
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      return;
    }

    // Títulos destacados en mayúsculas aislados (ej. "**DICTAMEN OFICIAL...**")
    const docTitleMatch = trimmed.match(/^\*{2}([A-ZÁÉÍÓÚÑ\s0-9—–\(\)\/&]{8,})\*{2}$/);
    if (docTitleMatch) {
      flushParagraph(`p-doctitle-${index}`);
      flushList(`list-doctitle-${index}`);
      flushTable(`tbl-doctitle-${index}`);
      elements.push(
        <div key={`doctitle-${index}`} className="text-xs font-bold font-serif uppercase tracking-wider text-[#1F242B] my-1">
          {docTitleMatch[1]}
        </div>
      );
      return;
    }

    // Listas numeradas estándar (1. 2. etc)
    const numMatch = trimmed.match(/^(\*{0,2}\d+\*{0,2}\.?\s+)(.*)$/);
    if (numMatch && !sectionMatch) {
      flushParagraph(`p-ol-${index}`);
      flushTable(`tbl-ol-${index}`);
      if (!currentList || currentList.type !== "ol") {
        flushList(`list-sw2-${index}`);
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numMatch[2]);
      return;
    }

    // 6. Texto regular (acumular para párrafo)
    paragraphLines.push(line);
  });

  // Flush final
  flushParagraph("p-final");
  flushList("list-final");
  flushTable("tbl-final");

  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <pre
        key="code-final"
        className="my-2.5 p-3 rounded-md bg-[#1F242B] text-[#C0D725] font-mono text-[11px] overflow-x-auto border border-gray-800"
      >
        <code>{codeBlockLines.join("\n")}</code>
      </pre>
    );
  }

  return <div className={`markdown-content space-y-1.5 ${className}`}>{elements}</div>;
}

/**
 * Función para renderizar elementos en línea: enlaces, **negritas**, *cursivas*, `código`
 */
function renderInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Tokenizar para enlaces, negritas, cursivas y código: [link](url), ***bold italic***, **bold**, *italic*, __bold__, _italic_, `code`
  const regex = /(\[[^\]]+\]\([^)]+\)|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    // Links: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#3299A8] hover:underline font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }
    if (part.startsWith("***") && part.endsWith("***") && part.length >= 6) {
      return (
        <strong key={i} className="font-bold italic text-gray-900">
          {part.slice(3, -3)}
        </strong>
      );
    }
    if (
      (part.startsWith("**") && part.endsWith("**") && part.length >= 4) ||
      (part.startsWith("__") && part.endsWith("__") && part.length >= 4)
    ) {
      return (
        <strong key={i} className="font-bold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (
      (part.startsWith("*") && part.endsWith("*") && part.length >= 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length >= 2)
    ) {
      return (
        <em key={i} className="italic text-gray-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={i}
          className="font-mono text-[11px] bg-gray-100 text-gray-800 px-1 py-0.5 rounded border border-gray-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Limpieza de cualquier asterisco residual que no haya cerrado
    const cleanText = part.replace(/\*\*/g, "").replace(/\*/g, "");
    return <React.Fragment key={i}>{cleanText}</React.Fragment>;
  });
}
