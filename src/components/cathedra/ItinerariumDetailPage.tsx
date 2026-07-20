import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/constants';
import SEOHead from '@/components/SEOHead';
import {
  EditorialKicker,
  EditorialMeta,
  EditorialGoldMarker,
} from '@/components/editorial/primitives';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

type ComplementaryReading = { title: string; url?: string; source?: string; note?: string };
type RelatedModule = { label: string; to: string; kind?: string; description?: string };
type ItinerariumMetadata = {
  presentation?: string;
  objectives?: string[];
  prerequisites?: string[];
  complementary_readings?: ComplementaryReading[];
  related_modules?: RelatedModule[];
};

const ItinerariumDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [itinerarium, setItinerarium] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const loadData = async () => {
    setLoading(true);
    const [itRes, stepsRes] = await Promise.all([
      supabase.from('itineraria').select('*').eq('id', id!).single(),
      supabase
        .from('itineraria_steps')
        .select('*')
        .eq('itinerarium_id', id!)
        .order('step_order', { ascending: true }),
    ]);

    if (itRes.data) setItinerarium(itRes.data);
    if (stepsRes.data) setSteps(stepsRes.data);

    if (user && id) {
      const { data: progress } = await supabase
        .from('itineraria_progress')
        .select('step_id, reflection')
        .eq('user_id', user.id)
        .eq('itinerarium_id', id);

      if (progress) {
        setCompletedSteps(new Set(progress.map((p) => p.step_id)));
        const reflectionsMap: Record<string, string> = {};
        progress.forEach((p) => {
          if (p.reflection) reflectionsMap[p.step_id] = p.reflection;
        });
        setReflections(reflectionsMap);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user || !id) return;

    const channel = supabase
      .channel('itinerarium_detail_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itineraria_progress',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as any;
          if (payload.eventType === 'INSERT') {
            if (newData?.step_id) {
              setCompletedSteps((prev) => new Set([...Array.from(prev), newData.step_id]));
              if (newData.reflection) {
                setReflections((prev) => ({ ...prev, [newData.step_id]: newData.reflection }));
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            if (newData?.step_id && newData.reflection) {
              setReflections((prev) => ({ ...prev, [newData.step_id]: newData.reflection }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, id]);

  const exportFullPDF = () => {
    if (!itinerarium || !steps.length) return;

    const doc = new jsPDF();

    doc.setFontSize(26);
    doc.setTextColor(41, 128, 185);
    doc.text(itinerarium.title, 20, 30);

    doc.setFontSize(14);
    doc.setTextColor(100);
    const splitDesc = doc.splitTextToSize(itinerarium.description || '', 170);
    doc.text(splitDesc, 20, 45);

    doc.setFontSize(12);
    doc.text(
      `Progresso: ${Math.round((completedSteps.size / steps.length) * 100)}%`,
      20,
      70
    );

    const tableData = steps.map((step) => [
      `Capítulo ${step.step_order}: ${step.title}`,
      completedSteps.has(step.id) ? 'Concluído' : 'Pendente',
      reflections[step.id] || '-',
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['Capítulo', 'Status', 'Minhas Reflexões']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { font: 'helvetica', fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30 },
        2: { cellWidth: 90 },
      },
    });

    doc.save(
      `trilha-${itinerarium.title.toLowerCase().replace(/\s+/g, '-')}.pdf`
    );
    toast.success('PDF da trilha gerado com sucesso!');
  };

  if (loading || !itinerarium) {
    return (
      <div className="w-full py-spacing-4xl space-y-spacing-lg" aria-busy="true">
        <div className="h-6 w-40 rounded-full bg-muted/40 animate-pulse" />
        <div className="h-16 w-3/4 rounded-lg bg-muted/40 animate-pulse" />
        <div className="h-4 w-full rounded bg-muted/30 animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-muted/30 animate-pulse" />
      </div>
    );
  }

  const metadata: ItinerariumMetadata = (itinerarium.metadata ?? {}) as ItinerariumMetadata;
  const progress = steps.length ? (completedSteps.size / steps.length) * 100 : 0;
  const firstIncompleteIdx = steps.findIndex((s) => !completedSteps.has(s.id));
  const resumeStep = firstIncompleteIdx >= 0 ? steps[firstIncompleteIdx] : steps[0];
  const isComplete = steps.length > 0 && completedSteps.size === steps.length;

  return (
    <>
      <SEOHead
        title={`${itinerarium.title} — Trilha de Formação`}
        description={itinerarium.description}
        path={`/itineraria/${id}`}
      />

      <div className="w-full py-spacing-2xl md:py-spacing-3xl space-y-spacing-4xl">
        {/* Breadcrumb / Voltar */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/itineraria')}
            className="group gap-spacing-xs text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-colors"
          >
            <Icons.ArrowLeft className="w-spacing-sm h-spacing-sm group-hover:-translate-x-0.5 transition-transform" />
            Voltar para Trilhas
          </Button>
        </motion.div>

        {/* HERO EDITORIAL */}
        <header className="relative overflow-hidden rounded-[2.5rem] border border-primary/10 bg-gradient-to-br from-primary/[0.03] via-background to-primary/[0.02] p-spacing-2xl md:p-spacing-4xl">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence baseFrequency='0.9' /></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
            }}
          />
          <div className="relative z-10 space-y-spacing-xl max-w-[68ch]">
            <EditorialKicker>
              CATHEDRA · TRILHA {itinerarium.category ? `· ${itinerarium.category}` : ''}
            </EditorialKicker>

            <h1 className="font-serif text-premium-4xl md:text-premium-6xl leading-[1.05] tracking-tight text-foreground">
              {itinerarium.title}
            </h1>

            {itinerarium.subtitle && (
              <p className="font-sans text-premium-lg md:text-premium-xl text-muted-foreground leading-relaxed">
                {itinerarium.subtitle}
              </p>
            )}

            <EditorialGoldMarker />

            <div className="flex flex-wrap items-center gap-x-spacing-lg gap-y-spacing-xs">
              <EditorialMeta>{steps.length} capítulos</EditorialMeta>
              <EditorialMeta>{itinerarium.estimated_days} dias</EditorialMeta>
              <EditorialMeta>Nível · {itinerarium.difficulty || '—'}</EditorialMeta>
            </div>

            <div className="flex flex-wrap items-center gap-spacing-sm pt-spacing-md">
              {resumeStep && (
                <Button
                  size="lg"
                  className="rounded-premium-full gap-spacing-xs bg-primary text-primary-foreground shadow-premium hover:opacity-90"
                  onClick={() =>
                    navigate(`/itineraria/${id}/step?step=${resumeStep.id}`)
                  }
                >
                  {completedSteps.size === 0
                    ? 'Iniciar Trilha'
                    : isComplete
                    ? 'Revisitar Trilha'
                    : 'Continuar de onde parei'}
                  <Icons.ChevronRight className="w-spacing-md h-spacing-md" />
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                onClick={exportFullPDF}
                className="rounded-premium-full gap-spacing-xs border-primary/20 text-[11px] font-black uppercase tracking-widest"
              >
                <Icons.FileDown className="w-spacing-md h-spacing-md" /> Exportar Reflexões
              </Button>
            </div>
          </div>
        </header>

        {/* PROGRESSO */}
        {user && steps.length > 0 && (
          <section aria-label="Progresso da trilha" className="space-y-spacing-md">
            <div className="flex items-baseline justify-between gap-spacing-md">
              <EditorialKicker>Progresso</EditorialKicker>
              <span className="font-sans text-premium-sm text-muted-foreground">
                {completedSteps.size} de {steps.length} · {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2 bg-primary/5" />
          </section>
        )}

        {/* APRESENTAÇÃO */}
        {(metadata.presentation || itinerarium.description) && (
          <section className="space-y-spacing-lg max-w-[68ch]">
            <EditorialKicker>Apresentação</EditorialKicker>
            <div className="font-serif text-premium-lg md:text-premium-xl leading-[1.75] text-foreground/90 whitespace-pre-line">
              {metadata.presentation || itinerarium.description}
            </div>
          </section>
        )}

        {/* OBJETIVOS + PRÉ-REQUISITOS */}
        {(metadata.objectives?.length || metadata.prerequisites?.length) && (
          <section className="grid gap-spacing-xl md:grid-cols-2">
            {metadata.objectives?.length ? (
              <Card className="premium-card rounded-[2rem] border-primary/10 bg-primary/[0.02]">
                <CardContent className="p-spacing-xl space-y-spacing-md">
                  <div className="flex items-center gap-spacing-xs">
                    <Icons.Target className="w-spacing-md h-spacing-md text-primary" />
                    <EditorialKicker>Objetivos</EditorialKicker>
                  </div>
                  <ul className="space-y-spacing-sm font-sans text-premium-base leading-relaxed">
                    {metadata.objectives.map((obj, i) => (
                      <li key={i} className="flex gap-spacing-sm">
                        <Icons.Check className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {metadata.prerequisites?.length ? (
              <Card className="premium-card rounded-[2rem] border-primary/10 bg-background">
                <CardContent className="p-spacing-xl space-y-spacing-md">
                  <div className="flex items-center gap-spacing-xs">
                    <Icons.BookOpen className="w-spacing-md h-spacing-md text-primary" />
                    <EditorialKicker>Pré-requisitos</EditorialKicker>
                  </div>
                  <ul className="space-y-spacing-sm font-sans text-premium-base leading-relaxed text-muted-foreground">
                    {metadata.prerequisites.map((req, i) => (
                      <li key={i} className="flex gap-spacing-sm">
                        <span className="text-primary/60 mt-1">·</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </section>
        )}

        {/* CAPÍTULOS */}
        <section className="space-y-spacing-xl">
          <div className="flex items-center gap-spacing-md">
            <EditorialKicker>Capítulos</EditorialKicker>
            <div className="flex-1 h-px bg-primary/10" />
          </div>

          <ol className="space-y-spacing-md" aria-label="Lista de capítulos da trilha">
            {steps.map((step, idx) => {
              const isCompleted = completedSteps.has(step.id);
              const isLocked =
                !isCompleted && idx > 0 && !completedSteps.has(steps[idx - 1].id);

              return (
                <motion.li
                  key={step.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card
                    className={`premium-card transition-all duration-500 border-primary/5 rounded-[1.75rem] shadow-premium-none group ${
                      isLocked
                        ? 'opacity-40 grayscale pointer-events-none'
                        : 'hover:border-primary/25 hover:bg-primary/[0.02]'
                    } ${isCompleted ? 'bg-primary/[0.03]' : ''}`}
                  >
                    <CardContent className="p-spacing-lg md:p-spacing-xl flex items-center justify-between gap-spacing-lg">
                      <div className="flex items-center gap-spacing-lg flex-1 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-serif text-premium-lg transition-all ${
                            isCompleted
                              ? 'bg-primary text-primary-foreground shadow-premium'
                              : 'bg-primary/5 text-primary/70 border border-primary/15'
                          }`}
                          aria-hidden
                        >
                          {isCompleted ? (
                            <Icons.Check className="w-5 h-5" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-spacing-2xs">
                          <div className="flex items-center gap-spacing-xs">
                            <h3 className="font-serif text-premium-lg md:text-premium-xl text-foreground truncate">
                              {step.title}
                            </h3>
                            {!step.is_free && (
                              <Icons.Lock
                                className="w-4 h-4 text-primary/60"
                                aria-label="Conteúdo premium"
                              />
                            )}
                          </div>
                          {step.subtitle && (
                            <p className="font-sans text-premium-sm text-muted-foreground line-clamp-1">
                              {step.subtitle}
                            </p>
                          )}
                          <div className="flex items-center gap-spacing-sm text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            <span className="flex items-center gap-spacing-2xs">
                              <Icons.Clock className="w-3 h-3" />
                              {step.duration_minutes} min
                            </span>
                            <span aria-hidden>·</span>
                            <span>{step.step_type}</span>
                          </div>
                        </div>
                      </div>

                      {!isLocked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/itineraria/${id}/step?step=${step.id}`)
                          }
                          className="group/btn h-10 px-spacing-lg rounded-premium-full border border-primary/10 hover:bg-primary hover:text-primary-foreground transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          {isCompleted ? 'Revisitar' : 'Iniciar'}
                          <Icons.ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.li>
              );
            })}
          </ol>
        </section>

        {/* LEITURA COMPLEMENTAR */}
        {metadata.complementary_readings?.length ? (
          <section className="space-y-spacing-lg">
            <div className="flex items-center gap-spacing-md">
              <EditorialKicker>Leitura Complementar</EditorialKicker>
              <div className="flex-1 h-px bg-primary/10" />
            </div>
            <ul className="grid gap-spacing-md md:grid-cols-2">
              {metadata.complementary_readings.map((r, i) => {
                const inner = (
                  <Card className="premium-card h-full rounded-[1.5rem] border-primary/10 hover:border-primary/30 transition-colors">
                    <CardContent className="p-spacing-lg space-y-spacing-xs">
                      <div className="flex items-start gap-spacing-sm">
                        <Icons.BookOpen className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif text-premium-lg text-foreground leading-snug">
                            {r.title}
                          </h4>
                          {r.source && (
                            <p className="font-sans text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">
                              {r.source}
                            </p>
                          )}
                          {r.note && (
                            <p className="font-sans text-premium-sm text-muted-foreground mt-2 leading-relaxed">
                              {r.note}
                            </p>
                          )}
                        </div>
                        {r.url && (
                          <Icons.ExternalLink className="w-4 h-4 text-primary/60 flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
                return (
                  <li key={i}>
                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-[1.5rem]"
                      >
                        {inner}
                      </a>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {/* CONEXÕES / MÓDULOS RELACIONADOS */}
        {metadata.related_modules?.length ? (
          <section className="space-y-spacing-lg">
            <div className="flex items-center gap-spacing-md">
              <EditorialKicker>Conexões</EditorialKicker>
              <div className="flex-1 h-px bg-primary/10" />
            </div>
            <div className="flex flex-wrap gap-spacing-sm">
              {metadata.related_modules.map((m, i) => (
                <Link
                  key={i}
                  to={m.to}
                  className="group inline-flex items-center gap-spacing-xs rounded-premium-full border border-primary/15 bg-primary/[0.02] px-spacing-md py-spacing-sm hover:border-primary/40 hover:bg-primary/[0.05] transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {m.kind && (
                    <Badge
                      variant="outline"
                      className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary/70"
                    >
                      {m.kind}
                    </Badge>
                  )}
                  <span className="font-serif text-premium-base text-foreground group-hover:text-primary transition-colors">
                    {m.label}
                  </span>
                  <Icons.ArrowUpRight className="w-3.5 h-3.5 text-primary/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
};

export default ItinerariumDetailPage;
