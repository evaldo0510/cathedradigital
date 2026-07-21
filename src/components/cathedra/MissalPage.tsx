/**
 * MissalPage — Missal Romano no Prayer Engine v2.
 *
 * - Ordinário: `usePrayerHierarchy('missa-ordinario')` (banco, engine v2).
 * - Próprio: `useMissalProper` (edge function `missal-proper`, cache 24h).
 *
 * Preserva toggles Latim/Rubricas e favoritos por parte.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { Icons } from '../../constants';
import { useDevotionalReader } from '@/components/mobile/DevotionalReaderContext';
import { useDevotionalFavorites } from '@/hooks/useDevotionalFavorites';
import { usePrayerHierarchy } from '@/prayer-engine/usePrayerHierarchy';
import { flattenSectionToBlocks } from '@/prayer-engine/loadPrayerHierarchy';
import { useDailyLiturgy } from '@/hooks/useDailyLiturgy';
import { useMissalProper } from '@/hooks/useMissalProper';
import { toIsoDateKey } from '@/core/liturgy/LiturgyProvider';
import { MissalProperCards } from './primitives/liturgy/MissalProperCards';
import type { PrayerBlock } from '@/types/prayer';
import type { DBSection } from '@/prayer-engine/loadPrayerHierarchy';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function parseDateParam(raw: string | null): Date {
  if (!raw) return new Date();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return new Date();
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

interface SectionView {
  section: DBSection;
  blocks: PrayerBlock[];
}

const MissalPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const selectedDate = useMemo(() => parseDateParam(searchParams.get('d')), [searchParams]);
  const isoDate = toIsoDateKey(selectedDate);

  const [showLatin, setShowLatin] = useState(false);
  const [showRubrics, setShowRubrics] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { setIndex, setFavorite } = useDevotionalReader();
  const { isFavorited, toggle } = useDevotionalFavorites();

  const { hierarchy, loading: ordinarioLoading } = usePrayerHierarchy('missa-ordinario');
  const { liturgy } = useDailyLiturgy(selectedDate);
  const { proper, isLoading: properLoading } = useMissalProper(isoDate, liturgy);

  const sections: SectionView[] = useMemo(() => {
    if (!hierarchy) return [];
    const sorted = [...hierarchy.sections].sort((a, b) => a.order_index - b.order_index);
    return sorted.map((section) => ({
      section,
      blocks: flattenSectionToBlocks(hierarchy, section),
    }));
  }, [hierarchy]);

  // Expandir a primeira seção assim que carrega.
  useEffect(() => {
    if (!expandedSection && sections.length > 0) {
      setExpandedSection(sections[0].section.slug);
    }
  }, [sections, expandedSection]);

  // Índice para o shell mobile.
  useEffect(() => {
    if (sections.length === 0) return;
    const items = sections.map(({ section }) => ({
      id: section.slug,
      label: section.title,
      hint: section.subtitle ?? undefined,
      active: expandedSection === section.slug,
      onSelect: () => {
        setExpandedSection(section.slug);
        requestAnimationFrame(() =>
          document.getElementById(`missal-${section.slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        );
      },
    }));
    setIndex('Ordo Missæ', items);
    setFavorite(null);
    return () => setIndex('Índice', []);
  }, [sections, expandedSection, setIndex, setFavorite]);

  const handleFavPart = async (sectionSlug: string, blockId: string, label: string, body: string) => {
    const contentId = `${sectionSlug}:${blockId}`;
    try {
      const wasFav = isFavorited('missal_part', contentId);
      await toggle({
        contentType: 'missal_part',
        contentId,
        title: label,
        content: body,
        url: `/missal#missal-${sectionSlug}`,
        metadata: { sectionSlug },
      });
      toast.success(wasFav ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(msg === 'auth-required' ? 'Faça login para favoritar' : 'Erro ao salvar favorito');
    }
  };

  return (
    <div className="max-w-spacing-4xl mx-auto space-y-spacing-xl">
      <div className="text-center space-y-spacing-sm">
        <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 rounded-premium">
          <Icons.Cross className="w-spacing-md h-spacing-md text-primary" />
          <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">Ordo Missæ</span>
        </div>
        <h1 className="text-premium-3xl md:text-premium-5xl font-serif font-bold text-foreground">Missal Romano</h1>
        <p className="text-muted-foreground font-serif italic max-w-spacing-lg mx-auto">
          O Ordinário e o Próprio da Santa Missa — 3ª edição típica do Missal Romano.
        </p>
      </div>

      {/* Próprio do Dia — cache 24h por iso_date */}
      <section aria-label="Próprio da Missa" className="pt-2">
        {(properLoading || proper) && <MissalProperCards proper={proper} isLoading={properLoading} />}
      </section>

      {/* Toggles */}
      <div className="flex justify-center gap-spacing-xs flex-wrap">
        <Button
          onClick={() => setShowLatin(!showLatin)}
          className={`px-spacing-md py-spacing-xs rounded-premium-full text-premium-xs font-bold transition-all ${
            showLatin ? 'bg-foreground text-background' : 'bg-card border border-border text-foreground'
          }`}
        >
          {showLatin ? 'Latim ativado' : 'Mostrar Latim'}
        </Button>
        <Button
          onClick={() => setShowRubrics(!showRubrics)}
          className={`px-spacing-md py-spacing-xs rounded-premium-full text-premium-xs font-bold transition-all ${
            showRubrics ? 'bg-primary text-secondary border border-secondary/20' : 'bg-card border border-border text-foreground'
          }`}
        >
          {showRubrics ? 'Rubricas ativadas' : 'Mostrar Rubricas'}
        </Button>
      </div>

      {/* Navegação rápida */}
      {sections.length > 0 && (
        <div className="flex flex-wrap gap-spacing-xs justify-center">
          {sections.map(({ section }) => (
            <Button
              key={section.id}
              onClick={() => {
                setExpandedSection(section.slug);
                document.getElementById(`missal-${section.slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`px-spacing-sm py-spacing-2xs rounded-premium-full text-premium-xs font-bold uppercase tracking-wider transition-all ${
                expandedSection === section.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-primary border border-border'
              }`}
            >
              {section.title}
            </Button>
          ))}
        </div>
      )}

      {/* Ordinário — vindo do banco */}
      <div className="space-y-spacing-md">
        {ordinarioLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-premium" />
            ))}
          </div>
        )}

        {sections.map(({ section, blocks }) => {
          const isOpen = expandedSection === section.slug;
          return (
            <div
              key={section.id}
              id={`missal-${section.slug}`}
              className="bg-card border border-border rounded-premium overflow-hidden"
            >
              <Button
                onClick={() => setExpandedSection(isOpen ? null : section.slug)}
                className="w-full p-spacing-md flex items-center justify-between text-left hover:bg-primary/5 transition-all"
              >
                <div>
                  <h3 className="text-premium-lg font-serif font-bold text-foreground">{section.title}</h3>
                  {section.subtitle && (
                    <p className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground mt-spacing-3xs">
                      {section.subtitle}
                    </p>
                  )}
                </div>
                <Icons.ChevronDown
                  className={`w-spacing-md h-spacing-md text-muted-foreground transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </Button>

              {isOpen && (
                <div className="border-t border-border divide-y divide-border">
                  {blocks.map((block) => {
                    const label = block.title || block.sourceType || 'Parte';
                    const body = block.body ?? '';
                    const contentId = `${section.slug}:${block.id}`;
                    const fav = isFavorited('missal_part', contentId);
                    return (
                      <div key={block.id} className="p-spacing-md space-y-spacing-sm">
                        <div className="flex items-start justify-between gap-spacing-sm">
                          <h4 className="text-premium-sm font-black uppercase tracking-widest text-primary flex-1">
                            {label}
                          </h4>
                          <button
                            type="button"
                            aria-label={fav ? `Remover ${label} dos favoritos` : `Adicionar ${label} aos favoritos`}
                            aria-pressed={fav}
                            onClick={() => handleFavPart(section.slug, block.id, label, body)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                              fav ? 'text-secondary' : 'text-muted-foreground hover:text-primary'
                            }`}
                          >
                            <Star className={`h-4 w-4 ${fav ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        {showRubrics && block.rubric && (
                          <p className="text-premium-xs text-primary font-medium italic bg-secondary/5 rounded-premium-full px-spacing-md py-spacing-xs border border-secondary/10">
                            ✠ {block.rubric}
                          </p>
                        )}
                        {showLatin && block.latin && (
                          <p className="text-premium-sm text-muted-foreground font-serif italic bg-muted rounded-premium-full p-spacing-md whitespace-pre-line">
                            {block.latin}
                          </p>
                        )}
                        {body && (
                          <p className="text-premium-sm text-foreground/90 font-serif leading-relaxed whitespace-pre-line">
                            {body}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MissalPage;
