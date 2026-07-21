/**
 * MysteryHero — Hero contemplativo fullscreen exibido antes de cada dezena.
 * Não interfere no progresso: aparecer/desaparecer é decisão de UI apenas.
 */
import React, { useEffect, useRef, useState } from 'react';
import { PlayCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DBMystery } from '@/prayer-engine/loadPrayerHierarchy';
import { readMysteryMeta, readMysteryImageSlug } from './mysteryMeta';
import { resolveMysteryImage } from './mysteryImages';

interface Props {
  mystery: DBMystery;
  onStart: () => void;
  estimatedMinutes?: number;
}

const MysteryHero: React.FC<Props> = ({ mystery, onStart, estimatedMinutes = 4 }) => {
  const meta = readMysteryMeta(mystery);
  const [fading, setFading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setFading(false);
  }, [mystery.id]);

  // Prioriza o download apenas quando o hero entra em viewport.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setIsVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mystery.id]);

  const handleStart = () => {
    setFading(true);
    // Delay para deixar o fade rodar (200ms).
    window.setTimeout(onStart, 220);
  };

  const gradient = meta.hero_gradient ?? 'from-amber-50/30 via-white/10 to-transparent';
  const contemplativeTitle = meta.contemplative_title ?? mystery.title;
  const subtitle = mystery.subtitle;
  const passageRef = meta.primary_passage?.ref ?? mystery.gospel_ref;
  const heroImage = resolveMysteryImage(readMysteryImageSlug(meta), meta.image_collection);
  const hasImage = Boolean(heroImage);

  return (
    <section
      ref={sectionRef}
      aria-label={`Introdução contemplativa: ${mystery.title}`}
      className={cn(
        'relative isolate flex min-h-[70vh] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-stitch-outline-variant/30 px-6 py-16 transition-opacity duration-200 md:min-h-[80vh] md:px-12',
        fading ? 'opacity-0' : 'opacity-100',
      )}
    >
      {hasImage && isVisible ? (
        <>
          <img
            src={heroImage}
            alt=""
            aria-hidden
            width={1024}
            height={1024}
            loading="lazy"
            decoding="async"
            // @ts-expect-error fetchpriority é HTML nativo, ainda não tipado em React
            fetchpriority="high"
            className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover animate-in fade-in duration-500"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/50 to-black/80"
          />
        </>
      ) : (
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b',
            gradient,
          )}
        />
      )}
      <div
        className={cn(
          'mx-auto w-full max-w-2xl text-center',
          hasImage && '[&_h1]:text-white [&_p]:text-white/80',
        )}
      >
        <p className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.32em] text-stitch-secondary">
          Mistério · Contemplação
        </p>
        <h1 className="mt-6 font-stitch-display text-3xl leading-tight text-stitch-on-surface md:text-5xl md:leading-[1.1]">
          {contemplativeTitle}
        </h1>
        {subtitle && (
          <p className="mt-4 font-stitch-serif text-base italic text-stitch-on-surface-variant md:text-lg">
            {subtitle}
          </p>
        )}
        {passageRef && (
          <p className="mt-8 inline-flex items-center gap-2 font-stitch-body text-sm text-stitch-on-surface-variant">
            <BookOpen aria-hidden className="h-4 w-4" />
            <span>{passageRef}</span>
          </p>
        )}
        <p className="mt-2 font-stitch-body text-[11px] uppercase tracking-widest text-stitch-on-surface-variant/70">
          {estimatedMinutes} min de contemplação
        </p>
        <div className="mt-10 flex justify-center">
          <Button
            type="button"
            variant="pill-active"
            size="pill"
            onClick={handleStart}
            aria-label={`Iniciar contemplação: ${mystery.title}`}
          >
            <PlayCircle aria-hidden />
            Iniciar contemplação
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MysteryHero;
