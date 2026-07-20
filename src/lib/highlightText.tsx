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

  const nText = norm(text);
  const pattern = new RegExp(tokens.map((t) => escapeRegExp(norm(t))).join('|'), 'g');

  // Percorre índices no texto normalizado, mas fatiando o original
  // (comprimento por caractere é preservado após NFD porque removemos combining marks).
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(nText)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));
    nodes.push(
      <mark key={`m-${start}`} className={className}>
        {text.slice(start, end)}
      </mark>,
    );
    lastIndex = end;
    if (m[0].length === 0) pattern.lastIndex++;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
