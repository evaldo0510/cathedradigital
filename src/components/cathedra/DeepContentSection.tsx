import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { DeepContent } from '@/types';

interface DeepContentSectionProps {
  content: DeepContent;
  title?: string;
}

const DeepContentSection: React.FC<DeepContentSectionProps> = ({ content, title }) => {
  const sections = [
    { id: 'textoBase', label: 'Texto Base', icon: <Icons.Book className="w-4 h-4" />, value: content.textoBase },
    { id: 'explicacao', label: 'Explicação', icon: <Icons.Search className="w-4 h-4" />, value: content.explicacao },
    { id: 'interpretacaoProfunda', label: 'Interpretação Profunda', icon: <Icons.Star className="w-4 h-4" />, value: content.interpretacaoProfunda },
    { id: 'aplicacaoPratica', label: 'Aplicação Prática', icon: <Icons.CheckCircle2 className="w-4 h-4" />, value: content.aplicacaoPratica },
    { id: 'reflexaoFinal', label: 'Reflexão Final', icon: <Icons.Compass className="w-4 h-4" />, value: content.reflexaoFinal },
    { id: 'exercicio', label: 'Exercício', icon: <Icons.Play className="w-4 h-4" />, value: content.exercicio },
  ].filter(s => s.value);

  if (sections.length === 0) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {title && (
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-border/40" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary whitespace-nowrap">{title}</h3>
          <div className="h-px flex-1 bg-border/40" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-3xl border transition-all hover:shadow-lg group ${
              section.id === 'textoBase' 
                ? 'bg-primary/5 border-primary/20 md:col-span-2' 
                : 'bg-card border-border hover:border-primary/30'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${section.id === 'textoBase' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground'} transition-colors`}>
                {section.icon}
              </div>
              <h4 className={`text-xs font-black uppercase tracking-widest ${section.id === 'textoBase' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>
                {section.label}
              </h4>
            </div>
            
            <div className={`font-serif leading-relaxed ${section.id === 'textoBase' ? 'text-lg italic text-foreground' : 'text-foreground/90 text-sm'}`}>
              {section.value.split('\n\n').map((p, i) => (
                <p key={i} className={i > 0 ? 'mt-3' : ''}>{p}</p>
              ))}
            </div>

            {section.id === 'reflexaoFinal' && (
              <div className="mt-6 pt-6 border-t border-border/40">
                <div className="flex items-start gap-3">
                  <Icons.MessageSquare className="w-4 h-4 text-primary mt-0.5" />
                  <p className="text-xs italic text-muted-foreground">Silencie e deixe que esta pergunta ecoe em seu coração.</p>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DeepContentSection;
