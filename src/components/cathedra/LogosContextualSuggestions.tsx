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
      label: 'Aprofundar Mistério',
      prompt: `Por favor, ajude-me a contemplar mais profundamente o significado teológico e espiritual deste trecho no contexto da Tradição: ${context}`,
      icon: <Icons.Sparkles className="w-3.5 h-3.5" strokeWidth={0.5} />
    },
    {
      id: 'connections',
      label: 'Pontes Sagradas',
      prompt: `Quais conexões invisíveis existem entre este texto e outras passagens da Bíblia ou documentos da Igreja? ${context}`,
      icon: <Icons.Compass className="w-3.5 h-3.5" strokeWidth={0.5} />
    },
    {
      id: 'reflection',
      label: 'Via de Oração',
      prompt: `Ofereça uma reflexão silenciosa e meditativa para auxiliar minha oração baseada neste texto: ${context}`,
      icon: <Icons.Feather className="w-3.5 h-3.5" strokeWidth={0.5} />
    }
  ];

  if (settings.totalSilence) return null;

  return (
    <div className="mt-16 py-10 border-t border-primary/5">
      <div className="flex items-center gap-4 mb-8 opacity-20">
        <div className="w-px h-10 bg-gradient-to-b from-transparent via-primary to-transparent" />
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-primary">Caminhos de Aprofundamento</p>
      </div>
      
      <div className="flex flex-wrap gap-4">
        {suggestions.map((suggestion) => (
          <motion.button
            key={suggestion.id}
            whileHover={{ y: -1, opacity: 1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectSuggestion(suggestion.prompt)}
            className="flex items-center gap-4 px-6 py-4 rounded-premium bg-primary/[0.01] border border-primary/[0.03] hover:bg-primary/[0.02] hover:border-primary/10 transition-all group opacity-60"
          >
            <span className="text-primary/40 group-hover:text-primary/60 transition-colors">
              {suggestion.icon}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/50 group-hover:text-primary transition-colors">
              {suggestion.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
