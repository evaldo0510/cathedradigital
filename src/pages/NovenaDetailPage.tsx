import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link, Navigate } from 'react-router-dom';
import { Icons } from '@/constants';
import { EditorialHero } from '@/components/editorial/harmony/EditorialHero';
import { NexusPanel, ReaderShell } from '@/components/reader';
import { resolvePrayerAutoNexus } from '@/core/knowledge/adapters/prayerAutoNexus';
import { ReaderContinuation } from '@/components/shared/ReaderContinuation';
import { EditorialCard } from '@/components/editorial/harmony/EditorialCard';
import { Button } from '@/components/ui/button';
import { getNovenaBySlug } from '@/data/novenas';
import { loadProgress, saveProgress, type NovenaProgress } from '@/lib/novenas/progress';
import { generateNovenaProgressPdf } from '@/lib/novenas/pdf';
import { toast } from 'sonner';


const NovenaDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const novena = slug ? getNovenaBySlug(slug) : undefined;

  const [progress, setProgress] = useState<NovenaProgress | null>(null);

  useEffect(() => {
    if (!slug) return;
    const requestedDay = Number(searchParams.get('dia'));
    const total = novena?.days.length ?? 9;
    const clampDay = (d: number) => Math.min(Math.max(1, d), total);
    const existing = loadProgress(slug);
    if (existing) {
      if (requestedDay && requestedDay !== existing.currentDay) {
        const next = { ...existing, currentDay: clampDay(requestedDay) };
        setProgress(next);
        saveProgress(slug, next);
      } else {
        setProgress(existing);
      }
    } else {
      setProgress({
        startedAt: new Date().toISOString(),
        completedDays: [],
        currentDay: requestedDay ? clampDay(requestedDay) : 1,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);


  const currentDay = progress?.currentDay ?? 1;
  const completedSet = useMemo(() => new Set(progress?.completedDays ?? []), [progress]);

  if (!novena) return <Navigate to="/novenas" replace />;

  const day = novena.days.find((d) => d.day === currentDay) ?? novena.days[0];
  const totalDays = novena.days.length;
  const completedCount = completedSet.size;
  const percent = Math.round((completedCount / totalDays) * 100);

  const markCurrentDone = () => {
    if (!progress) return;
    const already = completedSet.has(currentDay);
    const nextCompleted = already
      ? progress.completedDays.filter((d) => d !== currentDay)
      : [...progress.completedDays, currentDay];
    const nextDay = !already && currentDay < totalDays ? currentDay + 1 : currentDay;
    const next: NovenaProgress = {
      ...progress,
      completedDays: nextCompleted,
      currentDay: nextDay,
    };
    setProgress(next);
    saveProgress(novena.slug, next);
  };

  const goToDay = (d: number) => {
    if (!progress) return;
    const next = { ...progress, currentDay: d };
    setProgress(next);
    saveProgress(novena.slug, next);
  };

  const resetProgress = () => {
    if (!progress) return;
    const next: NovenaProgress = { startedAt: new Date().toISOString(), completedDays: [], currentDay: 1 };
    setProgress(next);
    saveProgress(novena.slug, next);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/novenas/${novena.slug}?dia=${currentDay}`;
    const text = `Estou rezando a ${novena.title} — dia ${currentDay} de ${totalDays} (${percent}% concluído).`;
    const shareData = { title: novena.title, text, url };
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      /* fallback */
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success('Link copiado para a área de transferência.');
    } catch {
      toast.error('Não foi possível compartilhar.');
    }
  };
  const handleDownloadPdf = () => {
    if (!progress) return;
    try {
      generateNovenaProgressPdf(novena, progress);
      toast.success('PDF gerado com seu progresso.');
    } catch {
      toast.error('Não foi possível gerar o PDF.');
    }
  };



  // Reader Template Master: hero no slot `hero`, corpo em children,
  // continuidade no slot `continuation` — mesmo esqueleto dos demais leitores.
  return (
    <ReaderShell
      contentMaxWidth="max-w-3xl"
      ariaLabel={`Novena — ${novena.title}`}
      hero={
        <EditorialHero align="center" density="balanced">
          <EditorialHero.Eyebrow>Dia {currentDay} de {totalDays}</EditorialHero.Eyebrow>
          <EditorialHero.Title>{novena.title}</EditorialHero.Title>
          {novena.latin && (
            <EditorialHero.Subtitle>
              <span className="font-serif italic">{novena.latin}</span>
            </EditorialHero.Subtitle>
          )}
        </EditorialHero>
      }
      nexus={
        <NexusPanel
          output={resolvePrayerAutoNexus({
            slug: novena.slug,
            title: novena.title,
            category: 'novena',
          })}
          kicker={`Conexões · ${novena.title}`}
        />
      }
      continuation={
        <ReaderContinuation
          context={{
            kind: 'prayer',
            id: novena.slug,
            meta: { prayerCategory: 'novena' },
          }}
        />
      }
    >
      <div className="flex items-center gap-[var(--sp-s)]">
        <Link
          to="/novenas"
          className="inline-flex items-center gap-[var(--sp-xs)] type-caption text-muted-foreground hover:text-primary transition-colors"
        >
          <Icons.ArrowLeft className="w-4 h-4" /> Todas as novenas
        </Link>
      </div>

      {/* Progresso */}
      <div className="max-w-3xl mx-auto space-y-[var(--sp-s)]">
        <div className="flex items-center justify-between type-caption text-muted-foreground">
          <span>{completedCount}/{totalDays} dias completos</span>
          <span>{percent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--rule-gold))] transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-[var(--sp-xs)] justify-center pt-[var(--sp-xs)]">
          {novena.days.map((d) => {
            const done = completedSet.has(d.day);
            const active = d.day === currentDay;
            return (
              <button
                key={d.day}
                onClick={() => goToDay(d.day)}
                aria-label={`Ir para o dia ${d.day}`}
                aria-current={active ? 'true' : undefined}
                className={[
                  'w-8 h-8 rounded-full type-caption font-medium transition-all',
                  active
                    ? 'bg-primary text-primary-foreground scale-110'
                    : done
                    ? 'bg-[hsl(var(--rule-gold))]/20 text-foreground border border-[hsl(var(--rule-gold))]/40'
                    : 'bg-card text-muted-foreground border border-border hover:border-primary/40',
                ].join(' ')}
              >
                {d.day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Abertura */}
      <EditorialCard density="balanced" className="max-w-3xl mx-auto">
        <EditorialCard.Eyebrow>Oração inicial</EditorialCard.Eyebrow>
        <EditorialCard.Description>
          <span className="font-serif text-premium-base whitespace-pre-line block text-foreground/80 leading-relaxed">
            {novena.opening}
          </span>
        </EditorialCard.Description>
      </EditorialCard>

      {/* Dia atual */}
      <EditorialCard density="balanced" className="max-w-3xl mx-auto">
        <EditorialCard.Eyebrow>Dia {day.day} · {day.title}</EditorialCard.Eyebrow>
        <EditorialCard.Title>{day.title}</EditorialCard.Title>
        {day.scripture && (
          <p className="type-rubrica text-primary">{day.scripture}</p>
        )}
        <EditorialCard.Description>
          <span className="font-serif text-premium-lg leading-relaxed text-foreground/85 block">
            {day.meditation}
          </span>
        </EditorialCard.Description>
        <div className="pt-[var(--sp-s)] border-t border-border/40 mt-[var(--sp-s)]">
          <p className="type-rubrica text-muted-foreground mb-[var(--sp-xs)]">Intenção do dia</p>
          <p className="font-serif italic text-foreground/80">{day.intention}</p>
        </div>
      </EditorialCard>

      {/* Encerramento */}
      <EditorialCard density="balanced" className="max-w-3xl mx-auto">
        <EditorialCard.Eyebrow>Oração final</EditorialCard.Eyebrow>
        <EditorialCard.Description>
          <span className="font-serif whitespace-pre-line block text-foreground/80 leading-relaxed">
            {novena.finalPrayer}
          </span>
        </EditorialCard.Description>
        <div className="pt-[var(--sp-s)] border-t border-border/40 mt-[var(--sp-s)]">
          <p className="font-serif italic text-foreground/70 whitespace-pre-line">{novena.closing}</p>
        </div>
      </EditorialCard>

      {/* Ações */}
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-[var(--sp-m)] pt-[var(--sp-l)]">
        <div className="flex flex-wrap gap-[var(--sp-s)]">
          <Button variant="outline" onClick={resetProgress} className="type-caption">
            <Icons.RefreshCw className="w-4 h-4 mr-2" />
            Reiniciar
          </Button>
          <Button variant="outline" onClick={handleShare} className="type-caption">
            <Icons.Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
          <Button variant="outline" onClick={handleDownloadPdf} className="type-caption">
            <Icons.Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
        <Button onClick={markCurrentDone} className="min-w-[220px]">
          {completedSet.has(currentDay) ? (
            <>
              <Icons.X className="w-4 h-4 mr-2" />
              Desmarcar dia {currentDay}
            </>
          ) : currentDay < totalDays ? (
            <>
              <Icons.Check className="w-4 h-4 mr-2" />
              Concluir dia {currentDay} · seguir
            </>
          ) : (
            <>
              <Icons.Check className="w-4 h-4 mr-2" />
              Concluir novena
            </>
          )}
        </Button>
      </div>
    </ReaderShell>
  );
};

export default NovenaDetailPage;
