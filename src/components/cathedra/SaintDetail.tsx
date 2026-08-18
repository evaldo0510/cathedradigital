import React, { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import SacredImage from './SacredImage';
import PassageActions from '@/components/shared/PassageActions';
import DocumentViewer from './DocumentViewer';
import Relatio from './Relatio';
import DeepContentSection from './DeepContentSection';
const SaintDetailTabs = lazy(() => import('./SaintDetailTabs'));
import { type Saint } from '@/data/saints';

import { AppRoute } from '@/types';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/hooks/useLang';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import AudioContentPlayer from './AudioContentPlayer';
import SourceAttribution from './SourceAttribution';
import { ReaderContinuation } from '@/components/shared/ReaderContinuation';
import { resolveSaintAutoNexus } from '@/core/knowledge/adapters/saintAutoNexus';
import { NexusPanel } from '@/components/reader';
const SaintCuratedConnections = lazy(() => import('@/components/cathedra/SaintCuratedConnections'));
const SaintWorksSection = lazy(() => import('@/components/cathedra/SaintWorksSection'));
import { EditorialReaderHeader, EditorialDivider } from '@/components/editorial';
import { ReaderToolbar } from '@/components/reader';
import SanctumEditorial, { SanctumCurationBadge } from './SanctumEditorial';
import { SEO_CONFIG } from '@/config/seo';
import SaintAILearn from './SaintAILearn';
import { CATEGORY_LABELS } from './SaintDetail.categories';
import { EditorialClosure } from '@/components/reader';
import { resolveEditorialClosure } from '@/lib/editorial/resolveClosure';

// Reexporta para consumidores existentes (Saints.tsx etc.)
export { CATEGORY_LABELS };

const VIRTUE_TO_JOURNEY: Record<string, { id: string, name: string }> = {
  'paciência': { id: '0b8ddab7-b106-4873-bc4d-3987421d265d', name: 'Rotina de Transformação' },
  'fé': { id: 'b25b02f4-0533-483f-9a7b-c2e866e6f25d', name: 'Mística' },
  'identidade': { id: '150f78d3-019b-40c0-962e-a83576309ea5', name: 'Coração' },
  'dor': { id: 'f0f35259-85b3-44fa-99c1-4f9ec87c9f4d', name: 'Cura' },
  'perseverança': { id: '0b8ddab7-b106-4873-bc4d-3987421d265d', name: 'Rotina de Transformação' },
  'humildade': { id: '0b8ddab7-b106-4873-bc4d-3987421d265d', name: 'Rotina de Transformação' },
  'contemplação': { id: 'b25b02f4-0533-483f-9a7b-c2e866e6f25d', name: 'Mística' },
  'oração': { id: 'b25b02f4-0533-483f-9a7b-c2e866e6f25d', name: 'Mística' },
  'silêncio': { id: 'b25b02f4-0533-483f-9a7b-c2e866e6f25d', name: 'Mística' },
  'penitência': { id: 'f0f35259-85b3-44fa-99c1-4f9ec87c9f4d', name: 'Cura' },
  'cura': { id: 'f0f35259-85b3-44fa-99c1-4f9ec87c9f4d', name: 'Cura' },
  'esperança': { id: '150f78d3-019b-40c0-962e-a83576309ea5', name: 'Coração' },
  'caridade': { id: '150f78d3-019b-40c0-962e-a83576309ea5', name: 'Coração' },
  'sabedoria': { id: 'b25b02f4-0533-483f-9a7b-c2e866e6f25d', name: 'Mística' },
  'fidelidade': { id: '0b8ddab7-b106-4873-bc4d-3987421d265d', name: 'Rotina de Transformação' },
  'perdão': { id: 'f0f35259-85b3-44fa-99c1-4f9ec87c9f4d', name: 'Cura' },
  'santidade': { id: 'b25b02f4-0533-483f-9a7b-c2e866e6f25d', name: 'Mística' },
  'sofrimento': { id: 'f0f35259-85b3-44fa-99c1-4f9ec87c9f4d', name: 'Cura' },
  'vocação': { id: 'b1b2c3d4-3333-4000-8000-000000000003', name: 'Discernimento Vocacional' },
  'missão': { id: '0b8ddab7-b106-4873-bc4d-3987421d265d', name: 'Rotina de Transformação' },
};

const SaintDetail: React.FC<{ saint: Saint; onClose: () => void; autoReflect?: boolean; legacy?: boolean }> = ({ saint, onClose, autoReflect = false, legacy = false }) => {
  const { isPremium } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null);

  const suggestedJourney = React.useMemo(() => {
    const mainVirtue = saint.virtues?.[0]?.toLowerCase() || 'santidade';
    
    // Direct match
    if (VIRTUE_TO_JOURNEY[mainVirtue]) return VIRTUE_TO_JOURNEY[mainVirtue];
    
    // Keyword match
    for (const v of (saint.virtues || [])) {
      const lv = v.toLowerCase();
      const foundKey = Object.keys(VIRTUE_TO_JOURNEY).find(key => lv.includes(key));
      if (foundKey) return VIRTUE_TO_JOURNEY[foundKey];
    }
    
    return VIRTUE_TO_JOURNEY['paciência']; // Default
  }, [saint.virtues]);

  // SEO: Schema.org Person + ReligiousOccasion (dia de festa)
  const canonicalPath = `/santos/${(saint as any).slug || saint.id}`;
  const canonicalUrl = `${SEO_CONFIG.BASE_URL}${canonicalPath}`;
  const seoDescription = (saint.bio || saint.fullBio || `Vida, virtudes e testemunho de ${saint.name}.`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
  const personLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: saint.name,
    alternateName: saint.title || undefined,
    description: seoDescription,
    url: canonicalUrl,
    image: typeof saint.image === 'string' ? saint.image : Array.isArray(saint.image) ? saint.image[0] : undefined,
    birthDate: saint.born || undefined,
    deathDate: saint.died || undefined,
    knowsAbout: saint.virtues && saint.virtues.length > 0 ? saint.virtues : undefined,
    sameAs: (saint as any).url || undefined,
    ...(saint.quotes && saint.quotes[0]
      ? {
          subjectOf: {
            '@type': 'Quotation',
            text: saint.quotes[0],
          },
        }
      : {}),
  };
  const occasionLd: Record<string, unknown> | null = saint.feastDay
    ? {
        '@context': 'https://schema.org',
        '@type': 'Event',
        additionalType: 'https://schema.org/ReligiousOccasion',
        name: `Festa de ${saint.name}`,
        description: `Memória litúrgica de ${saint.name} — ${saint.feastDay}.`,
        about: { '@type': 'Person', name: saint.name },
        eventSchedule: {
          '@type': 'Schedule',
          repeatFrequency: 'P1Y',
          byMonthDay: (saint as any).feastDayNum || undefined,
          byMonth: (saint as any).feastMonth || undefined,
        },
        url: canonicalUrl,
      }
    : null;

  return (
    <>
    <Helmet>
      <title>{`${saint.name}${saint.title ? ' — ' + saint.title : ''} · Sanctorum · Cathedra Digital`}</title>
      <meta name="description" content={seoDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="profile" />
      <meta property="og:site_name" content="Cathedra Digital" />
      <meta property="og:title" content={`${saint.name}${saint.title ? ' — ' + saint.title : ''}`} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:url" content={canonicalUrl} />
      {typeof saint.image === 'string' && (
        <>
          <meta property="og:image" content={saint.image} />
          <meta property="og:image:secure_url" content={saint.image} />
          <meta property="og:image:alt" content={`Sanctorum · ${saint.name}${saint.feastDay ? ' · ' + saint.feastDay : ''}`} />
        </>
      )}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={saint.name} />
      <meta name="twitter:description" content={seoDescription} />
      {typeof saint.image === 'string' && <meta name="twitter:image" content={saint.image} />}
      <script type="application/ld+json">{JSON.stringify(personLd)}</script>
      {occasionLd && <script type="application/ld+json">{JSON.stringify(occasionLd)}</script>}
    </Helmet>
    <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-background z-[100] flex items-center justify-center p-spacing-xs md:p-spacing-xl "
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      className="bg-card rounded-[2.5rem] max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-premium-hover border border-border flex flex-col md:flex-row relative"
      onClick={e => e.stopPropagation()}
    >
      <div className="absolute top-spacing-lg right-spacing-lg z-20 flex items-center gap-spacing-xs">
        <button
          type="button"
          onClick={() => {
            const targetId = (saint as any).slug || saint.id;
            const nextLegacy = !legacy;
            try {
              localStorage.setItem('cathedra:saints:reader-variant', nextLegacy ? 'legacy' : 'new');
            } catch { /* ignore */ }
            const params = new URLSearchParams(window.location.search);
            params.set('legacy', nextLegacy ? '1' : '0');
            const qs = params.toString();
            const base = nextLegacy ? `/saints-legacy/${targetId}` : `/santos/${targetId}`;
            navigate(qs ? `${base}?${qs}` : base);
          }}
          aria-label={legacy ? t('version_new') : t('version_previous')}
          title={legacy ? t('version_new') : t('version_previous')}
          className="h-spacing-2xl px-spacing-md rounded-premium-full bg-foreground/10 hover:bg-foreground/20 text-foreground font-stitch-body text-[11px] font-bold uppercase tracking-[0.18em] transition-all"
        >
          {legacy ? t('version_new') : t('version_previous')}
        </button>
        <Button
          onClick={onClose}
          aria-label={t('close')}
          className="p-spacing-sm bg-foreground/10 hover:bg-foreground/20 rounded-premium-full text-foreground transition-all"
        >
          <Icons.X className="w-spacing-md h-spacing-md" aria-hidden="true" />
        </Button>
      </div>

      {/* Sidebar Visual: Sacred visual matched to Mobile Nav */}
      <div className="hidden md:flex md:w-[40%] sticky top-0 h-screen overflow-hidden bg-primary/5 border-r border-primary/5">
        <SacredImage src={saint.image} className="w-full h-full object-cover opacity-60 mix-blend-multiply" alt={saint.name} />
        <div className="absolute inset-0 bg-gradient-to-l from-background via-transparent to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-spacing-xl text-center space-y-spacing-lg">
           <div className="w-spacing-4xl h-spacing-4xl mx-auto rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-premium">
             <Icons.BookOpen className="w-spacing-xl h-spacing-xl text-secondary" />
           </div>
           <div className="space-y-spacing-xs">
             <h2 className="font-display text-4xl text-primary/40 tracking-widest uppercase italic">{saint.name}</h2>
             <p className="text-[10px] uppercase tracking-[0.4em] text-secondary/60 font-bold">{saint.title}</p>
           </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
          {!legacy && (
            <ReaderToolbar
              kicker={`${t('saint_reader_kicker')} · ${CATEGORY_LABELS[saint.category] || saint.category}`}
              title={saint.name}
              subtitle={saint.title}
              shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/santos/${saint.id}` : undefined}
            />
          )}

          <div className="p-spacing-lg md:p-spacing-2xl space-y-spacing-2xl">
            {/* 1. Nome & Título (Cabeçalho Editorial) */}
            <EditorialReaderHeader
              className="pt-0"
              kicker={`${t('saint_reader_kicker')} · ${CATEGORY_LABELS[saint.category] || saint.category}`}
              title={saint.name}
              subtitle={saint.title}
              meta={[saint.feastDay && `${t('feast_day')} · ${saint.feastDay}`, saint.born, saint.died].filter(Boolean).join(' · ')}
            />

            {/* 2. Biografia (Resumo e Status) */}
            <section className="space-y-spacing-lg">
              {saint.contentStatus && saint.contentStatus !== 'complete' && (
                <SanctumCurationBadge status={saint.contentStatus} />
              )}
              
              <div className="flex flex-wrap items-center gap-spacing-lg py-spacing-md border-y border-border/10">
                <div className="flex items-center gap-spacing-sm">
                  <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/10 flex items-center justify-center text-primary">
                    <Icons.Calendar className="w-spacing-md h-spacing-md" />
                  </div>
                  <div>
                    <span className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground block">{t('feast_day')}</span>
                    <span className="text-premium-sm font-bold text-foreground">{saint.feastDay}</span>
                  </div>
                </div>
                <div className="flex items-center gap-spacing-sm">
                  <div className="w-spacing-xl h-spacing-xl rounded-premium bg-secondary flex items-center justify-center text-secondary-foreground">
                    <Icons.Shield className="w-spacing-md h-spacing-md" />
                  </div>
                  <div>
                    <span className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground block">{t('main_virtue')}</span>
                    <span className="text-premium-sm font-bold text-foreground">{saint.virtues?.[0] || 'Santidade'}</span>
                  </div>
                </div>
                <div className="flex-1 flex justify-end">
                  <AudioContentPlayer 
                    text={`${saint.name}. ${saint.title}. ${saint.bio}. ${saint.fullBio || ''}.`}
                    title={t('listen_content')}
                  />
                </div>
              </div>

              <div className="prose prose-premium max-w-none">
                <p className="text-premium-lg font-serif leading-relaxed text-foreground/90">
                  {saint.bio}
                </p>
              </div>
            </section>

            {/* 3. Vida & História (Timeline e Detalhes) */}
            <EditorialDivider variant="gold-fade" />
            <section className="space-y-spacing-xl">
              <div className="flex items-center gap-spacing-xs text-primary">
                <Icons.User className="w-spacing-md h-spacing-md" />
                <h3 className="text-premium-small font-black uppercase tracking-[0.2em]">Trajetória de Santidade</h3>
              </div>
              
              <Suspense fallback={<div className="h-40 animate-pulse bg-muted/20 rounded-premium" />}>
                <SaintDetailTabs
                  saint={saint}
                  autoReflect={autoReflect}
                  onReflect={() => {
                    const targetId = (saint as any).slug || saint.id;
                    navigate(`/logos?about=${encodeURIComponent(`saint:${targetId}`)}`);
                    onClose();
                  }}
                />
              </Suspense>

              <SanctumEditorial saint={saint} />
            </section>

            {/* 4. Espiritualidade & Ensinamentos */}
            <EditorialDivider variant="gold-fade" />
            <div className="grid md:grid-cols-2 gap-spacing-xl">
              <div className="space-y-spacing-md">
                <div className="flex items-center gap-spacing-xs text-primary">
                  <Icons.Quote className="w-spacing-md h-spacing-md" />
                  <h3 className="text-premium-small font-black uppercase tracking-[0.2em]">Palavra do Santo</h3>
                </div>
                <div className="bg-secondary/30 p-spacing-xl rounded-[2rem] border border-border relative group hover:border-primary/20 transition-all min-h-[160px]">
                  <p className="text-premium-xl font-serif italic text-foreground relative z-10 leading-relaxed">
                    "{saint.quotes?.[0] || "Tudo para a maior glória de Deus."}"
                  </p>
                </div>
              </div>

              <div className="space-y-spacing-md">
                <div className="flex items-center gap-spacing-xs text-primary">
                  <Icons.Heart className="w-spacing-md h-spacing-md" />
                  <h3 className="text-premium-small font-black uppercase tracking-[0.2em]">Prática Diária</h3>
                </div>
                <div className="bg-primary/5 p-spacing-xl rounded-[2rem] border border-primary/10 relative group hover:bg-primary/10 transition-all min-h-[160px]">
                  <p className="text-premium-sm font-medium text-foreground relative z-10 leading-relaxed italic">
                    {saint.aplicacaoPratica || "Procure imitar a humildade deste santo em suas tarefas ordinárias."}
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Nexus (Justificativa Teológica) */}
            <EditorialDivider variant="gold-fade" />
            {(() => {
              const saintSlug = (saint as any).slug || (saint as any).id;
              const nexus = resolveSaintAutoNexus({
                slug: String(saintSlug ?? ''),
                name: saint.name ?? saint.title ?? '',
                virtues: saint.virtues ?? [],
              });
              return (
                <div className="space-y-spacing-xl">
                  <div className="flex items-center gap-spacing-xs text-primary">
                    <Icons.Activity className="w-spacing-md h-spacing-md" />
                    <h3 className="text-premium-small font-black uppercase tracking-[0.2em]">Nexus Teológico</h3>
                  </div>
                  <NexusPanel output={nexus} kicker={`Por que isso está conectado? · ${saint.name}`} />
                  
                  <SaintCuratedConnections
                    saintId={String(saintSlug ?? '')}
                    saintName={saint.name ?? saint.title ?? ''}
                  />
                </div>
              );
            })()}

            {/* 6. Oração / Reflexão Final */}
            <section className="bg-primary/5 rounded-[2.5rem] p-spacing-xl md:p-spacing-2xl border border-primary/10">
              <div className="max-w-2xl mx-auto text-center space-y-spacing-lg">
                <Icons.Sparkles className="w-spacing-2xl h-spacing-2xl text-gold-text mx-auto" />
                <h3 className="text-premium-xl font-serif italic text-primary">Oração</h3>
                <p className="text-premium-md font-serif leading-relaxed text-foreground/80 italic">
                  {saint.spiritualPractice?.prayer || "Senhor, pela intercessão de Vosso santo, concedei-nos a graça de seguir Vossos caminhos com fidelidade."}
                </p>
              </div>
            </section>

            {/* 7. Próximo Conteúdo (Jornada) */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-accent rounded-[2rem] p-spacing-xl border border-border flex flex-col md:flex-row items-center justify-between gap-spacing-lg group transition-all"
            >
              <div className="flex items-center gap-spacing-md">
                <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/20 flex items-center justify-center text-primary">
                  <Icons.Route className="w-spacing-lg h-spacing-lg" />
                </div>
                <div>
                  <p className="text-premium-xs font-black uppercase tracking-widest text-primary/60 mb-spacing-2xs">Continuar Caminhada</p>
                  <h4 className="text-premium-lg font-bold text-foreground font-serif">Jornada {suggestedJourney.name}</h4>
                </div>
              </div>
              <Button 
                onClick={() => {
                  navigate(`/jornadas/${suggestedJourney.id}`);
                  onClose();
                }}
                className="h-spacing-2xl px-spacing-xl bg-primary text-primary-foreground font-black uppercase text-premium-xs tracking-[0.2em] rounded-premium-full shadow-premium"
              >
                Começar Jornada <Icons.ChevronRight className="w-spacing-md h-spacing-md ml-spacing-xs" />
              </Button>
            </motion.div>

            {/* Obras & Créditos */}
            <SaintWorksSection saintId={saint.id} saintSlug={(saint as any).slug} />
            
            <SourceAttribution
              source={(saint as any).source_name || (saint as any).source}
              sourceUrl={(saint as any).source_url || (saint as any).sourceUrl || (saint as any).url}
            />
          </div>
        </div>
    </motion.div>
  </motion.div>
  
  <AnimatePresence>
    {viewingDoc && (
      <DocumentViewer 
        url={viewingDoc.url} 
        title={viewingDoc.title} 
        onClose={() => setViewingDoc(null)} 
      />
    )}
  </AnimatePresence>
  </>
  );
};

export default SaintDetail;
