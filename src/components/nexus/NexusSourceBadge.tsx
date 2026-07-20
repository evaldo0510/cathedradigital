/**
 * NexusSourceBadge — indica visualmente a fonte automática de uma conexão
 * do Nexus (nó `kind` + ID canônico no KnowledgeGraph). Reutilizável em
 * Glossário, Jornadas e futuros consumidores. Nenhuma URL é construída
 * aqui; a página apenas rende o descritor devolvido pelo grafo.
 */
import type { ResolvedNode } from '@/core/knowledge/types';

export function NexusSourceBadge({ node }: { node: ResolvedNode['node'] }) {
  return (
    <span
      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest px-2 py-[2px] font-stitch-label text-[10px] uppercase tracking-[0.16em] text-stitch-on-surface-variant"
      title={`Fonte automática: KnowledgeGraph → ${node.id}`}
      aria-label={`Fonte automática KnowledgeGraph, tipo ${node.kind}, id ${node.id}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-stitch-secondary" />
      <span>{node.kind}</span>
      <span aria-hidden="true" className="text-stitch-outline-variant">·</span>
      <code className="font-mono text-[10px] normal-case tracking-normal text-stitch-on-surface">{node.id}</code>
    </span>
  );
}

export default NexusSourceBadge;
