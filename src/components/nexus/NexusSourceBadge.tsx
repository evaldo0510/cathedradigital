/**
 * NexusSourceBadge — indica a fonte automática de uma conexão do Nexus
 * (nó `kind` + ID canônico no KnowledgeGraph).
 *
 * Acessibilidade:
 *   • É um `<button type="button">` para receber foco por Tab.
 *   • `aria-label` explícito descreve tipo e id.
 *   • Tooltip Radix (via shadcn) abre no hover E no foco por teclado,
 *     fecha automaticamente com `Esc`. O conteúdo do tooltip é
 *     duplicado no `aria-describedby` para leitores de tela.
 *   • Focus visible com anel do design system (`stitch-secondary`).
 *
 * Reutilizável em Glossário, Jornadas e futuros consumidores.
 * Nenhuma URL é construída aqui; a página apenas rende o descritor
 * devolvido pelo grafo.
 */
import * as React from 'react';
import type { ResolvedNode } from '@/core/knowledge/types';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props {
  node: ResolvedNode['node'];
  /** Rótulo semântico opcional da seção (ex.: "Escritura", "Catecismo"). */
  sectionLabel?: string;
}

export function NexusSourceBadge({ node, sectionLabel }: Props) {
  const description =
    `Fonte automática: KnowledgeGraph → ${node.id}` +
    (sectionLabel ? ` (seção ${sectionLabel})` : '');

  const ariaLabel =
    `Fonte automática KnowledgeGraph, tipo ${node.kind}, id ${node.id}` +
    (sectionLabel ? `, seção ${sectionLabel}` : '');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          title={description}
          className="mt-2 inline-flex cursor-help items-center gap-1.5 rounded-full border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest px-2 py-[2px] font-stitch-label text-[10px] uppercase tracking-[0.16em] text-stitch-on-surface-variant transition-colors hover:border-stitch-secondary/50 hover:text-stitch-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-stitch-background"
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-stitch-secondary" />
          <span>{node.kind}</span>
          {/* O id canônico permanece acessível (aria-label + tooltip), mas não
              é impresso na leitura: dentro do leitor ele soava técnico. */}
          <span className="sr-only">{node.id}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-xs">
        <div className="flex flex-col gap-1">
          <span className="font-stitch-body text-[10px] uppercase tracking-widest opacity-80">
            Fonte automática
          </span>
          <span className="font-stitch-body text-xs">
            KnowledgeGraph → <span className="font-semibold">{node.kind}</span>
          </span>
          <code className="font-mono text-[11px]">{node.id}</code>
          {sectionLabel && (
            <span className="mt-1 font-stitch-body text-[10px] italic opacity-80">
              Seção: {sectionLabel}
            </span>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default NexusSourceBadge;
