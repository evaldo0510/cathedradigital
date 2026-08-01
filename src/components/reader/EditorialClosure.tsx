/**
 * EditorialClosure — encerramento canônico de toda leitura Cathedra.
 *
 * Sequência obrigatória (Constituição Editorial 1.0.0, Cap. IX):
 *
 *   Reflexão → Aplicação → Oração → Próxima leitura → Nexus
 *
 * Este componente vai DENTRO do slot `continuation` do <ReaderShell/>.
 * Não substitui `NexusPanel` (que continua no slot `nexus`) — ele
 * apresenta o convite editorial curto que precede a lista de conexões.
 *
 * Regras:
 *  - Zero domínio: recebe slots já resolvidos.
 *  - Zero URL hardcoded: `nextHref` deve vir de `resolveNexusHref`.
 *  - Copy é editorial, não é UI de produto. Não usar "clique", "saiba mais".
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Icons } from '@/constants';
import { resolveNexusHref } from '@/lib/nexusHref';
import type { NexusKind } from '@/types/nexus';

/**
 * Item de Nexus curado dentro do encerramento editorial.
 * Distinto de `nexus_relations` (grafo global): estas são as 1–3
 * conexões que o editor escolheu como fio de continuidade imediata.
 */
export interface EditorialClosureNexusItem {
  kind: NexusKind;
  ref: string;
  label: string;
  note?: string;
}

export interface EditorialClosureProps {
  /** Pergunta interior, sóbria, não retórica. 1 frase. Opcional em rows legados. */
  reflection?: string;
  /** Passo concreto para as próximas 24h. 1 frase curta. Opcional em rows legados. */
  application?: string;
  /** Oração breve (2 a 4 linhas). Texto puro; quebras de linha respeitadas. Opcional em rows legados. */
  prayer?: string;
  /** Próxima leitura sugerida — decisão editorial, não algoritmo cego. */
  next?: {
    label: string;
    href: string;
    kicker?: string;
  };
  /** Nexus editorial curado — 1 a 3 conexões diretas ao fio da leitura. */
  nexus?: EditorialClosureNexusItem[];
  /** Origem do closure. `cathedra-editorial` = curado; `ai-*` = gerado. */
  source?: 'cathedra-editorial' | 'ai-assisted' | 'ai-generated' | string;
  className?: string;
}

/**
 * Encerramento editorial padrão.
 *
 * Uso mínimo:
 *   <ReaderShell
 *     hero={...}
 *     nexus={<NexusPanel ... />}
 *     continuation={
 *       <EditorialClosure
 *         reflection="Onde, hoje, minha inquietude ainda foge do silêncio?"
 *         application="Reservar dez minutos de silêncio antes do último ofício do dia."
 *         prayer={`Senhor, dai-me o repouso que só em Vós existe.\nAmém.`}
 *         next={{ kicker: "Continuar", label: "O combate interior em Agostinho", href: resolveNexusHref(...) }}
 *       />
 *     }
 *   >
 *     ...
 *   </ReaderShell>
 */
export const EditorialClosure: React.FC<EditorialClosureProps> = ({
  reflection,
  application,
  prayer,
  next,
  nexus,
  source,
  className,
}) => {
  const nexusLinks = (nexus ?? [])
    .map((item) => ({ item, href: resolveNexusHref(item.kind, item.ref) }))
    .filter((x): x is { item: EditorialClosureNexusItem; href: string } => !!x.href);

  const hasAnything =
    !!reflection || !!application || !!prayer || !!next || nexusLinks.length > 0;
  if (!hasAnything) return null;

  return (
    <div
      className={cn(
        'w-full mx-auto max-w-[68ch]',
        'flex flex-col gap-spacing-lg',
        'text-foreground',
        className,
      )}
      data-editorial-closure
      data-constitution-version="1.0.0"
      data-closure-source={source ?? 'cathedra-editorial'}
    >
      {reflection && (
        <ClosureBlock
          kicker="Reflexão"
          icon={<Icons.Compass className="w-4 h-4" aria-hidden />}
        >
          <p className="text-base leading-relaxed italic">{reflection}</p>
        </ClosureBlock>
      )}

      {application && (
        <ClosureBlock
          kicker="Aplicação"
          icon={<Icons.Map className="w-4 h-4" aria-hidden />}
        >
          <p className="text-base leading-relaxed">{application}</p>
        </ClosureBlock>
      )}

      {prayer && (
        <ClosureBlock
          kicker="Oração"
          icon={<Icons.Flame className="w-4 h-4" aria-hidden />}
        >
          <p className="text-base leading-relaxed whitespace-pre-line text-center">
            {prayer}
          </p>
        </ClosureBlock>
      )}

      {nexusLinks.length > 0 && (
        <ClosureBlock
          kicker="Conexões"
          icon={<Icons.Link className="w-4 h-4" aria-hidden />}
        >
          <ul className="flex flex-col gap-spacing-xs">
            {nexusLinks.map(({ item, href }) => (
              <li key={`${item.kind}:${item.ref}`}>
                <Link
                  to={href}
                  className="inline-flex min-h-[44px] items-center text-base leading-relaxed underline underline-offset-4 decoration-secondary/60 hover:decoration-secondary transition-colors"
                >
                  {item.label}
                </Link>
                {item.note && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    — {item.note}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </ClosureBlock>
      )}

      {next && (
        <ClosureBlock
          kicker={next.kicker ?? 'Próxima leitura'}
          icon={<Icons.BookOpen className="w-4 h-4" aria-hidden />}
        >
          <Link
            to={next.href}
            className="inline-flex min-h-[44px] items-center text-base leading-relaxed underline underline-offset-4 decoration-secondary/60 hover:decoration-secondary transition-colors"
          >
            {next.label}
          </Link>
        </ClosureBlock>
      )}
    </div>
  );
};

interface ClosureBlockProps {
  kicker: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const ClosureBlock: React.FC<ClosureBlockProps> = ({ kicker, icon, children }) => (
  <section className="flex flex-col gap-spacing-xs">
    <header className="flex items-center gap-spacing-xs text-secondary/80">
      {icon}
      <span className="text-xs uppercase tracking-[0.18em] font-medium">
        {kicker}
      </span>
    </header>
    <div className="pl-[calc(1rem+var(--stitch-spacing-xs,0.5rem))]">
      {children}
    </div>
  </section>
);

export default EditorialClosure;
