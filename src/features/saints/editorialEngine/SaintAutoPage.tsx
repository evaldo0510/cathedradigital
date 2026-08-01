/**
 * SaintAutoPage — renderiza um `SaintPageDescriptor` produzido por
 * `buildSaintPage`. Skeleton do Motor Editorial de Santos.
 *
 * Uso:
 *   const descriptor = buildSaintPage(data);
 *   <SaintAutoPage descriptor={descriptor} />
 *
 * Integração com a rota /santos/:id fica para o próximo sprint,
 * após aprovação do skeleton.
 */
import React from 'react';
import { EditorialHero, NexusPanel, ReaderShell } from '@/components/reader';
import { ReaderContinuation } from '@/components/shared/ReaderContinuation';
import { resolveSaintAutoNexus } from '@/services/saintNexusService';
import type { SaintPageDescriptor } from './types';
import { SaintBioBlock } from './blocks/SaintBioBlock';
import { SaintTimelineBlock } from './blocks/SaintTimelineBlock';
import { SaintVirtuesBlock } from './blocks/SaintVirtuesBlock';
import { SaintWritingsBlock } from './blocks/SaintWritingsBlock';
import { SaintPrayersBlock } from './blocks/SaintPrayersBlock';
import { SaintSourcesBlock } from './blocks/SaintSourcesBlock';

interface Props {
  descriptor: SaintPageDescriptor;
}

export const SaintAutoPage: React.FC<Props> = ({ descriptor }) => {
  const { header, blocks } = descriptor;
  const kickerParts = [
    header.category === 'doctor'
      ? 'Doutor da Igreja'
      : header.category === 'father'
        ? 'Padre da Igreja'
        : header.category === 'martyr'
          ? 'Mártir'
          : 'Santo',
    header.epoch,
    header.region,
  ].filter(Boolean);

  // Cadeia canônica do Reader Template Master: hero → conteúdo → nexus →
  // continuation. Sem estes slots o módulo terminava em dead-end e ficava
  // fora do padrão dos demais leitores.
  const virtues = (blocks.find((b) => b.id === 'virtues')?.data ?? []) as Array<
    { name?: string } | string
  >;
  const virtueNames = virtues
    .map((v) => (typeof v === 'string' ? v : v?.name))
    .filter((v): v is string => Boolean(v));

  const nexus = resolveSaintAutoNexus({
    slug: descriptor.slug,
    name: header.name,
    virtues: virtueNames,
  });

  return (
    <ReaderShell
      contentMaxWidth="max-w-3xl"
      ariaLabel={`Santo — ${header.name}`}
      nexus={<NexusPanel output={nexus} kicker={`Conexões · ${header.name}`} />}
      continuation={
        <ReaderContinuation
          context={{
            kind: 'saint',
            id: descriptor.slug,
            graphNodeId: nexus.selfId ?? undefined,
            meta: { theme: virtueNames[0] },
          }}
          suggestions={nexus.suggestions.length > 0 ? nexus.suggestions : undefined}
        />
      }
      hero={
        <EditorialHero
          kicker={kickerParts.join(' · ')}
          title={header.name}
          subtitle={
            header.feast
              ? `Festa: ${header.feast.dateLabel}${header.feast.rank ? ` · ${header.feast.rank}` : ''}`
              : header.shortBio
          }
        />
      }
    >
      <div className="space-y-spacing-lg">
        {header.shortBio && header.feast && (
          <p className="text-premium-md text-foreground/90 leading-relaxed">
            {header.shortBio}
          </p>
        )}

        {blocks.map((b) => {
          switch (b.id) {
            case 'bio':
              return <SaintBioBlock key={b.id} text={b.data as string} />;
            case 'timeline':
              return <SaintTimelineBlock key={b.id} events={b.data as never} />;
            case 'virtues':
              return <SaintVirtuesBlock key={b.id} virtues={b.data as never} />;
            case 'writings':
              return <SaintWritingsBlock key={b.id} writings={b.data as never} />;
            case 'prayers':
              return <SaintPrayersBlock key={b.id} prayers={b.data as never} />;
            case 'sources':
              return <SaintSourcesBlock key={b.id} sources={b.data as never} />;
            default:
              return null;
          }
        })}
      </div>
    </ReaderShell>
  );
};
