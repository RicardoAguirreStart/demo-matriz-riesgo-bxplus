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
  let paragraphLines: string[] = [];

  const flushParagraph = (key: string) => {
    if (paragraphLines.length > 0) {
      const fullText = paragraphLines.join("\n").trim();
      if (fullText) {
        elements.push(
          <p key={key} className="leading-relaxed text-gray-800 my-1.5">
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
      return;
    }

    // 2. Encabezados (#, ##, ###, ####)
    if (trimmed.startsWith("#")) {
      flushParagraph(`p-h-${index}`);
      flushList(`list-h-${index}`);

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
      if (!currentList || currentList.type !== "ul") {
        flushList(`list-sw-${index}`);
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      return;
    }

    // 5. Listas numeradas (1. 2. etc)
    const numMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numMatch) {
      flushParagraph(`p-ol-${index}`);
      if (!currentList || currentList.type !== "ol") {
        flushList(`list-sw2-${index}`);
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numMatch[1]);
      return;
    }

    // 6. Texto regular (acumular para párrafo)
    paragraphLines.push(line);
  });

  // Flush final
  flushParagraph("p-final");
  flushList("list-final");

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

  return <div className={`markdown-content space-y-1 ${className}`}>{elements}</div>;
}

/**
 * Función para renderizar elementos en línea: **negritas**, *cursivas*, `código`, enlaces
 */
function renderInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Tokenizar para negritas, cursivas y código
  // Patrón regex que captura: **bold**, *italic*, `code`
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={i} className="font-bold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
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
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
