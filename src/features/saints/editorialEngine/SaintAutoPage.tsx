/**
 * SaintAutoPage — renderiza um `SaintPageDescriptor` produzido por
 * `buildSaintPage` usando exclusivamente o Reader V2 certificado.
 *
 * Cadeia canônica (congelada — Reader V2 baseline):
 *   EditorialHero → StudyContext → conteúdo → NexusPanel →
 *   EditorialClosure → ReaderContinuation
 *
 * Nenhum componente novo. Todos os imports vêm do barrel
 * `@/components/reader`.
 */
import React from 'react';
import {
  EditorialClosure,
  EditorialHero,
  NexusPanel,
  ReaderContinuation,
  ReaderShell,
  StudyContext,
} from '@/components/reader';
import SacredImage from '@/components/cathedra/SacredImage';
import { useSaintNexus } from '@/hooks/useSaintNexus';
import type { SaintPageDescriptor } from './types';
import { SaintBioBlock } from './blocks/SaintBioBlock';
import { SaintTimelineBlock } from './blocks/SaintTimelineBlock';
import { SaintVirtuesBlock } from './blocks/SaintVirtuesBlock';
import { SaintWritingsBlock } from './blocks/SaintWritingsBlock';
import { SaintPrayersBlock } from './blocks/SaintPrayersBlock';
import { SaintSourcesBlock } from './blocks/SaintSourcesBlock';
import { SaintMeditationBlock } from './blocks/SaintMeditationBlock';

interface Props {
  descriptor: SaintPageDescriptor;
}

const CATEGORY_LABEL: Record<string, string> = {
  doctor: 'Doutor da Igreja',
  father: 'Padre da Igreja',
  martyr: 'Mártir',
  saint: 'Santo',
};

export const SaintAutoPage: React.FC<Props> = ({ descriptor }) => {
  const { header, blocks, closure } = descriptor;
  const categoryLabel = CATEGORY_LABEL[header.category] ?? 'Santo';
  const kickerParts = [categoryLabel, header.epoch, header.region].filter(Boolean);

  const virtues = (blocks.find((b) => b.id === 'virtues')?.data ?? []) as Array<
    { name?: string; label?: string } | string
  >;
  const virtueNames = virtues
    .map((v) => (typeof v === 'string' ? v : (v?.label ?? v?.name)))
    .filter((v): v is string => Boolean(v));

  const nexus = useSaintNexus(descriptor.slug, header.name, virtueNames);


  const image = header.iconography?.imageUrl;
  const attributes = header.iconography?.attributes ?? [];

  return (
    <ReaderShell
      contentMaxWidth="max-w-3xl"
      ariaLabel={`Santo — ${header.name}`}
      headerContext={
        <StudyContext
          collectionTitle="Sanctorum"
          position={[header.epoch, header.region].filter(Boolean).join(' · ') || categoryLabel}
          curator={
            header.feast
              ? `Festa: ${header.feast.dateLabel}${header.feast.rank ? ` · ${header.feast.rank}` : ''}`
              : undefined
          }
        />
      }
      nexus={<NexusPanel output={nexus} kicker={`Conexões · ${header.name}`} />}
      continuation={
        <div className="space-y-spacing-lg">
          {closure && <EditorialClosure {...closure} />}
          <ReaderContinuation
            context={{
              kind: 'saint',
              id: descriptor.slug,
              graphNodeId: nexus.selfId ?? undefined,
              meta: { theme: virtueNames[0] },
            }}
            suggestions={nexus.suggestions.length > 0 ? nexus.suggestions : undefined}
          />
        </div>
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
        {image && (
          <figure className="mx-auto max-w-sm space-y-spacing-2xs">
            <SacredImage
              src={image}
              alt={header.iconography?.imageAlt ?? `Representação de ${header.name}`}
              category={header.category}
              className="w-full aspect-[3/4] rounded-premium overflow-hidden"
            />
            {attributes.length > 0 && (
              <figcaption className="text-premium-xs text-muted-foreground text-center">
                Iconografia: {attributes.join(', ')}
              </figcaption>
            )}
          </figure>
        )}

        {header.shortBio && header.feast && (
          <p className="text-premium-md text-foreground/90 leading-relaxed">
            {header.shortBio}
          </p>
        )}

        {blocks.map((b) => {
          switch (b.id) {
            case 'bio':
              return <SaintBioBlock key={b.id} text={b.data as string} />;
            case 'reflection':
              return (
                <SaintBioBlock
                  key={b.id}
                  id="saint-reflection"
                  title="Espiritualidade"
                  text={b.data as string}
                />
              );
            case 'meditation':
              return <SaintMeditationBlock key={b.id} text={b.data as string} />;
            case 'legacy':
              return (
                <SaintBioBlock
                  key={b.id}
                  id="saint-legacy"
                  title="Legado"
                  text={b.data as string}
                />
              );
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
