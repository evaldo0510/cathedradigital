import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, ArrowRight, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';

interface ProConversionBannerProps {
  /** Where the banner is shown for analytics */
  context: 'lectio' | 'jornada' | 'dashboard' | 'logos';
  /** Optional override to force visibility (e.g. for Logos deep response) */
  forceVisible?: boolean;
}

/**
 * Contextual PRO conversion banner.
 * Only shows after the user has written 2+ reflections (journal entries or journey reflections).
 * Does not show for PRO users or if dismissed in this session.
 */
const ProConversionBanner: React.FC<ProConversionBannerProps> = ({ context, forceVisible }) => {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [reflectionCount, setReflectionCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || isPremium) return;

    if (forceVisible) {
      setVisible(true);
      return;
    }

    const checkReflections = async () => {
      // Count total reflections: journal entries + journey reflections
      const [journalRes, journeyRes] = await Promise.all([
        supabase
          .from('spiritual_journal')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('journey_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('reflection', 'is', null),
      ]);

      const total = (journalRes.count ?? 0) + (journeyRes.count ?? 0);
      setReflectionCount(total);

      // Show after 2+ reflections or if context is logos (handled by forceVisible usually)
      if (total >= 2 || context === 'logos') {
        const sessionKey = `pro_banner_dismissed_${context}`;
        if (!sessionStorage.getItem(sessionKey)) {
          setVisible(true);
        }
      }
    };

    checkReflections();
  }, [user, isPremium, context, forceVisible]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    sessionStorage.setItem(`pro_banner_dismissed_${context}`, '1');
  };

  if (!visible || dismissed || isPremium) return null;

  const copy = getCopy(context, reflectionCount);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 md:p-8 shadow-lg"
      >
        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-primary/10 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon */}
          <motion.div
            className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            <Crown className="w-7 h-7 text-primary" />
          </motion.div>

          {/* Content */}
          <div className="flex-1 space-y-1.5 min-w-0">
            <h4 className="text-sm font-bold text-foreground">{copy.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{copy.message}</p>
            {reflectionCount >= 2 && context !== 'logos' && (
              <div className="flex items-center gap-1.5 text-xs text-primary/70">
                <Flame className="w-3.5 h-3.5" />
                <span>{reflectionCount} reflexões escritas</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate(AppRoute.PRICING)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-md whitespace-nowrap flex-shrink-0"
          >
            Desbloquear experiência completa <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

function getCopy(context: string, reflections: number): { title: string; message: string } {
  if (context === 'logos') {
    return {
      title: 'Existe um nível mais profundo disso.',
      message: 'Sua busca por entendimento tocou em algo real. A Logos Pro oferece análises teológicas sem limites e conexões que a versão gratuita ainda não revela.',
    };
  }

  if (context === 'jornada') {
    return {
      title: 'Continue essa transformação.',
      message: 'Você avançou no seu caminho e o progresso é visível. A experiência completa desbloqueia as próximas etapas e ferramentas exclusivas de contemplação.',
    };
  }

  if (reflections >= 2) {
    return {
      title: 'Você começou a entender…',
      message: 'Aprofunde isso. Suas reflexões estão amadurecendo e o Pro oferece o espaço ilimitado e as ferramentas de discernimento que sua alma busca agora.',
    };
  }

  // Fallbacks
  if (context === 'lectio') {
    return {
      title: 'A Palavra está agindo em você',
      message: 'Sua escuta se tornou mais atenta. Com o Pro, você acessa o repositório completo de meditações e o suporte contínuo da Logos.',
    };
  }

  return {
    title: 'Aprofunde sua caminhada',
    message: 'Suas reflexões mostram um novo horizonte. A experiência Pro oferece o suporte necessário para que essa clareza se torne constante.',
  };
}

export default ProConversionBanner;