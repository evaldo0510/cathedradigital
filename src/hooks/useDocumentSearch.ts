import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

/**
 * STAB-004.3.2 — Busca em memória dentro do documento renderizado.
 *
 * Estratégia:
 *  - Após o React renderizar o Markdown, percorremos os TextNodes com TreeWalker.
 *  - Cada ocorrência vira um <mark> classificado; a atual recebe uma classe extra.
 *  - Ao mudar query/conteúdo, desfazemos os marks anteriores (unwrap) antes de reaplicar.
 *  - Sem consultas ao servidor. Sem alteração da árvore React.
 */

const HIT_CLASS = 'mag-search-hit rounded-sm px-0.5 bg-primary/15 text-inherit transition-colors';
const CURRENT_CLASS = 'is-current !bg-primary !text-primary-foreground shadow-sm';

function unwrapMarks(marks: HTMLElement[]) {
  const parentsToNormalize = new Set<Node>();
  for (const m of marks) {
    const parent = m.parentNode;
    if (!parent) continue;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
    parentsToNormalize.add(parent);
  }
  parentsToNormalize.forEach((p) => (p as Element).normalize?.());
}

export function useDocumentSearch(
  containerRef: RefObject<HTMLElement | null>,
  query: string,
  contentVersion: unknown,
) {
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(0); // 1-based; 0 = nenhum
  const marksRef = useRef<HTMLElement[]>([]);

  // Aplicar / limpar highlights
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Desfaz marks anteriores
    if (marksRef.current.length) {
      unwrapMarks(marksRef.current);
      marksRef.current = [];
    }

    const q = query.trim();
    if (q.length < 2) {
      setTotal(0);
      setCurrent(0);
      return;
    }

    const needle = q.toLowerCase();

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        const parent = (node as Text).parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        // Evita SCRIPT/STYLE e conteúdo do próprio mark (não deveria haver aqui, mas seguro)
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'MARK') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes: Text[] = [];
    let cur: Node | null;
    while ((cur = walker.nextNode())) textNodes.push(cur as Text);

    const newMarks: HTMLElement[] = [];
    for (const node of textNodes) {
      const text = node.textContent ?? '';
      const lower = text.toLowerCase();
      let idx = lower.indexOf(needle);
      if (idx === -1) continue;

      const frag = document.createDocumentFragment();
      let last = 0;
      while (idx !== -1) {
        if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
        const mark = document.createElement('mark');
        mark.className = HIT_CLASS;
        mark.textContent = text.slice(idx, idx + needle.length);
        frag.appendChild(mark);
        newMarks.push(mark);
        last = idx + needle.length;
        idx = lower.indexOf(needle, last);
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode?.replaceChild(frag, node);
    }

    marksRef.current = newMarks;
    setTotal(newMarks.length);
    setCurrent(newMarks.length > 0 ? 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, contentVersion]);

  // Marca a ocorrência atual e faz scroll
  useEffect(() => {
    const marks = marksRef.current;
    if (!marks.length) return;
    marks.forEach((m, i) => {
      if (i === current - 1) {
        m.className = `${HIT_CLASS} ${CURRENT_CLASS}`;
      } else {
        m.className = HIT_CLASS;
      }
    });
    const active = marks[current - 1];
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [current, total]);

  // Limpa ao desmontar
  useEffect(() => {
    return () => {
      if (marksRef.current.length) {
        unwrapMarks(marksRef.current);
        marksRef.current = [];
      }
    };
  }, []);

  const goNext = useCallback(() => {
    setCurrent((c) => (total === 0 ? 0 : (c % total) + 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrent((c) => (total === 0 ? 0 : c <= 1 ? total : c - 1));
  }, [total]);

  return { total, current, goNext, goPrev };
}
