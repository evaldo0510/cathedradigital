import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';

interface Suggestion {
  id: string;
  label: string;
  prompt: string;
  icon: React.ReactNode;
}

interface LogosContextualSuggestionsProps {
  context: string;
  type: 'bible' | 'catechism' | 'magisterium';
  onSelectSuggestion: (prompt: string) => void;
}

export const LogosContextualSuggestions: React.FC<LogosContextualSuggestionsProps> = ({
  context,
  type,
  onSelectSuggestion
}) => {
  const { settings } = useReadingSettings();

  const suggestions: Suggestion[] = [
    {
      id: 'deepen',
      label: 'Aprofundar Passagem',
      prompt: `Por favor, aprofunde o significado teológico e espiritual desta passagem no contexto da Tradição: ${context}`,
      icon: <Icons.Sparkles className="w-3.5 h-3.5" strokeWidth={1} />
    },
    {
      id: 'connections',
      label: 'Conexões na Tradição',
      prompt: `Quais são as principais conexões entre esta passagem e outros textos da Bíblia ou do Magistério? ${context}`,
      icon: <Icons.Compass className="w-3.5 h-3.5" strokeWidth={1} />
    },
    {
      id: 'reflection',
      label: 'Reflexão Complementar',
      prompt: `Ofereça uma reflexão meditativa para oração baseada neste texto: ${context}`,
      icon: <Icons.Feather className="w-3.5 h-3.5" strokeWidth={1} />
    }
  ];

  if (settings.totalSilence) return null;

  return (
    <div className="mt-10 py-8 border-t border-primary/5">
      <div className="flex items-center gap-4 mb-6 opacity-30">
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-primary to-transparent" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Logos Suggestions</p>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {suggestions.map((suggestion) => (
          <motion.button
            key={suggestion.id}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectSuggestion(suggestion.prompt)}
            className="flex items-center gap-3 px-5 py-3 rounded-full bg-primary/[0.02] border border-primary/[0.05] hover:bg-primary/[0.04] hover:border-primary/20 transition-all group"
          >
            <span className="text-primary/30 group-hover:text-primary/60 transition-colors">
              {suggestion.icon}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary/40 group-hover:text-primary/80 transition-colors">
              {suggestion.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
