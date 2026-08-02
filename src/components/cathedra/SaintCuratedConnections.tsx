/**
 * SaintCuratedConnections — Sprint 4 · Nexus v1
 *
 * Renderiza as conexões curadas de um santo lidas de `nexus_relations`
 * (obras, virtudes exemplificadas, santos relacionados). Reutiliza
 * `EditorialCard` e ícones Lucide — sem componentes duplicados.
 */
import * as React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ScrollText, Sparkles, Users, type LucideIcon } from 'lucide-react';

import type { NexusRelation } from '@/types/nexus';
import { getSaintRelations, type SaintRelationGroups } from '@/services/saintNexusService';
import { resolveNexusHref, extractNexusRefId } from '@/lib/nexusHref';

function RelationItem({ rel }: { rel: NexusRelation }) {
  const id = extractNexusRefId(rel.target_ref) ?? '';
  const title = String(rel.target_ref?.title ?? id);
  const href = resolveNexusHref(rel.target_kind, rel.target_ref);

  const content = (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-medium text-foreground">{title}</span>
      {rel.note ? (
        <span className="text-xs text-muted-foreground">· {rel.note}</span>
      ) : null}
    </span>
  );
  return (
    <li className="flex items-start gap-2 py-1 text-sm">
      <span
        aria-hidden="true"
        className="mt-1.5 inline-block h-1.5 w-1.5 flex-none rounded-full bg-secondary"
      />
      <div className="min-w-0">
        {href ? (
          <Link
            to={href}
            className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            aria-label={`Abrir ${title}`}
          >
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    </li>
  );
}

function Section({
  icon: Icon,
  title,
  relations,
}: {
  icon: LucideIcon;
  title: string;
  relations: NexusRelation[];
}) {
  if (relations.length === 0) return null;
  return (
    <section className="space-y-2" aria-label={title}>
      <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
        <Icon aria-hidden className="h-3.5 w-3.5 text-secondary" />
        {title}
      </h3>
      <ul className="space-y-0.5">
        {relations.map((r) => (
          <RelationItem key={r.id} rel={r} />
        ))}
      </ul>
    </section>
  );
}

export interface SaintCuratedConnectionsProps {
  saintId: string;
  saintName?: string;
}

export function SaintCuratedConnections({ saintId, saintName }: SaintCuratedConnectionsProps) {
  const [groups, setGroups] = React.useState<SaintRelationGroups | null>(null);

  React.useEffect(() => {
    let alive = true;
    getSaintRelations(saintId).then((g) => {
      if (alive) setGroups(g);
    });
    return () => {
      alive = false;
    };
  }, [saintId]);

  if (!groups || groups.all.length === 0) return null;

  return (
    <div className="mb-spacing-lg rounded-lg border border-border/60 bg-card text-card-foreground shadow-sm">
      <div className="space-y-4 p-spacing-md">
        <header>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-secondary">
            Nexus Theologicus
          </p>
          <h2 className="mt-1 font-serif text-lg text-foreground">
            Conexões curadas{saintName ? ` · ${saintName}` : ''}
          </h2>
        </header>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Section icon={BookOpen} title="Obras" relations={groups.works} />
          <Section icon={Sparkles} title="Virtudes" relations={groups.virtues} />
          <Section icon={Users} title="Relacionados" relations={groups.relatedSaints} />
          <Section icon={ScrollText} title="Catecismo" relations={groups.catechism} />
        </div>

      </div>
    </div>
  );
}

export default SaintCuratedConnections;
