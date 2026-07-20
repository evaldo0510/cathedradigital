import React from 'react';

/** Normaliza para comparação sem acentos e sem caixa. */
function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Divide `text` em fragmentos, envolvendo trechos que casam com qualquer
 * termo (case + acento insensível) em <mark>. Retorna nós React.
 */
export function highlightText(
  text: string,
  query: string,
  className = 'bg-secondary/30 text-foreground rounded-sm px-0.5',
): React.ReactNode {
  if (!text || !query || !query.trim()) return text;

  const tokens = Array.from(
    new Set(
      query
        .trim()
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2),
    ),
  );
  if (tokens.length === 0) return text;

  // Constrói normalizado + mapa de índices para o texto original,
  // preservando pontos de corte mesmo com diacríticos removidos.
  let nText = '';
  const map: number[] = []; // map[i] = índice no `text` para o char i em `nText`
  for (let i = 0; i < text.length; i++) {
    const ch = text[i].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    for (let k = 0; k < ch.length; k++) map.push(i);
    nText += ch;
  }

  const pattern = new RegExp(tokens.map((t) => escapeRegExp(norm(t))).join('|'), 'g');
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(nText)) !== null) {
    if (m[0].length === 0) { pattern.lastIndex++; continue; }
    const start = map[m.index];
    const end = (map[m.index + m[0].length - 1] ?? start) + 1;
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));
    nodes.push(
      <mark key={`m-${start}`} className={className}>
        {text.slice(start, end)}
      </mark>,
    );
    lastIndex = end;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
