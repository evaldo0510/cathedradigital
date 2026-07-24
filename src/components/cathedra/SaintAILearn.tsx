import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Saint, SaintAIReflection } from '@/data/saints';

interface Props {
  saint: Saint;
}

/**
 * "Aprenda com este Santo" — bloco reutilizável de reflexão editorial
 * gerada por IA a partir da biografia, virtudes, escritos e frases do santo.
 * Cacheada em saints.ai_reflection pela Edge Function `saint-ai-reflection`.
 */
const SaintAILearn: React.FC<Props> = ({ saint }) => {
  const [reflection, setReflection] = useState<SaintAIReflection | null>(saint.aiReflection ?? null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('saint-ai-reflection', {
        body: { saint_id: saint.id },
      });
      if (error) throw error;
      if (data?.reflection) {
        setReflection(data.reflection);
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err: any) {
      console.error('saint-ai-reflection error', err);
      toast.error('Não foi possível gerar a reflexão agora.', {
        description: err?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-labelledby="ai-learn-heading"
      className="space-y-spacing-md rounded-[2rem] border border-primary/15 bg-primary/5 p-spacing-lg md:p-spacing-xl"
    >
      <header className="flex items-center gap-spacing-sm text-primary">
        <Icons.Sparkles className="w-spacing-md h-spacing-md" aria-hidden="true" />
        <h3
          id="ai-learn-heading"
          className="text-premium-small font-black uppercase tracking-[0.2em]"
        >
          Aprenda com este Santo
        </h3>
      </header>

      {!reflection ? (
        <div className="space-y-spacing-md">
          <p className="text-premium-sm text-muted-foreground font-serif italic leading-relaxed">
            Gere uma reflexão espiritual — resumo, ensinamentos, meditação e
            oração — inspirada nos escritos e testemunho de {saint.name}.
          </p>
          <Button
            onClick={generate}
            disabled={loading}
            className="h-spacing-2xl px-spacing-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-premium-xs tracking-[0.2em] rounded-premium-full shadow-premium shadow-primary/20"
          >
            {loading ? (
              <>
                <Icons.Cross className="w-spacing-md h-spacing-md mr-spacing-xs animate-spin" />
                Compondo reflexão…
              </>
            ) : (
              <>
                <Icons.Sparkles className="w-spacing-md h-spacing-md mr-spacing-xs" />
                Gerar reflexão espiritual
              </>
            )}
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-spacing-lg"
        >
          <p className="text-premium-xs text-muted-foreground uppercase tracking-widest">
            Reflexão baseada nos textos e ensinamentos de {saint.name}.
          </p>

          {reflection.summary && (
            <div className="space-y-spacing-2xs">
              <h4 className="text-premium-xs font-black uppercase tracking-widest text-primary">Resumo espiritual</h4>
              <p className="text-premium-sm leading-relaxed text-foreground">{reflection.summary}</p>
            </div>
          )}

          {reflection.teachings?.length > 0 && (
            <div className="space-y-spacing-sm">
              <h4 className="text-premium-xs font-black uppercase tracking-widest text-primary">Principais ensinamentos</h4>
              <ul className="space-y-spacing-sm">
                {reflection.teachings.map((t, i) => (
                  <li key={i} className="rounded-premium border border-border/60 bg-background/40 p-spacing-md">
                    <p className="text-premium-sm font-bold text-foreground">{t.title}</p>
                    <p className="text-premium-xs text-muted-foreground leading-relaxed mt-spacing-2xs">{t.body}</p>
                    {t.source && (
                      <p className="mt-spacing-xs text-premium-xs text-primary/80 italic border-l-2 border-primary/30 pl-spacing-sm">
                        Base: <span className="not-italic">“{t.source}”</span>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reflection.meditation && (
            <div className="space-y-spacing-2xs">
              <h4 className="text-premium-xs font-black uppercase tracking-widest text-primary">Meditação</h4>
              <p className="text-premium-sm leading-relaxed text-foreground whitespace-pre-line font-serif">
                {reflection.meditation}
              </p>
              {reflection.meditation_sources && reflection.meditation_sources.length > 0 && (
                <div className="mt-spacing-sm rounded-premium bg-background/40 border border-border/40 p-spacing-sm">
                  <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground mb-spacing-2xs">
                    Trechos-base da meditação
                  </p>
                  <ul className="space-y-spacing-2xs">
                    {reflection.meditation_sources.map((s, i) => (
                      <li key={i} className="text-premium-xs text-foreground/80 italic leading-relaxed">
                        “{s}”
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {reflection.prayer && (
            <div className="space-y-spacing-2xs rounded-premium border border-primary/20 bg-background/60 p-spacing-md">
              <h4 className="text-premium-xs font-black uppercase tracking-widest text-primary">Oração inspirada</h4>
              <p className="text-premium-sm leading-relaxed italic font-serif text-foreground whitespace-pre-line">
                {reflection.prayer}
              </p>
            </div>
          )}

          {reflection.citations && reflection.citations.length > 0 && (
            <details className="rounded-premium border border-border/60 bg-background/30 p-spacing-md">
              <summary className="cursor-pointer text-premium-xs font-black uppercase tracking-widest text-primary">
                Referências textuais usadas ({reflection.citations.length})
              </summary>
              <ul className="mt-spacing-sm space-y-spacing-xs">
                {reflection.citations.map((c, i) => (
                  <li key={i} className="text-premium-xs text-foreground/80 leading-relaxed">
                    <span className="inline-block mr-spacing-2xs px-spacing-2xs py-[2px] rounded-premium-full bg-primary/10 text-primary uppercase tracking-widest text-[10px] font-black">
                      {c.type}
                    </span>
                    <span className="italic">“{c.text}”</span>
                    {c.used_in && (
                      <span className="ml-spacing-2xs text-muted-foreground">
                        → {c.used_in === 'summary' ? 'resumo' : c.used_in === 'teaching' ? 'ensinamento' : c.used_in === 'meditation' ? 'meditação' : 'oração'}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex items-center justify-between pt-spacing-sm border-t border-border/40">
            <p className="text-premium-xs text-muted-foreground italic">
              Reflexão editorial gerada por IA — fundamentada nas fontes do santo.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={generate}
              disabled={loading}
              className="text-primary hover:bg-primary/10 text-premium-xs uppercase tracking-widest"
            >
              <Icons.RefreshCw className="w-spacing-sm h-spacing-sm mr-spacing-2xs" />
              Regenerar
            </Button>
          </div>
        </motion.div>
      )}
    </section>
  );
};

export default SaintAILearn;
