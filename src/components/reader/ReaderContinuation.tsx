import React from 'react';
import { Link } from 'react-router-dom';
import { Book, User, Church, ScrollText, Heart, ArrowRight, Compass, Sparkles, Library } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditorialKicker } from '@/components/editorial/harmony';

export interface ContinuationLink {
  icon: 'bible' | 'saint' | 'catechism' | 'writings' | 'prayer' | 'journey' | 'logos' | 'library';
  label: string;
  href: string;
  category: string;
  description?: string;
}

interface ReaderContinuationProps {
  links?: ContinuationLink[];
  className?: string;
  title?: string;
}

const ICON_MAP = {
  bible: Book,
  saint: User,
  catechism: Church,
  writings: ScrollText,
  prayer: Heart,
  journey: Compass,
  logos: Sparkles,
  library: Library,
};

/**
 * ReaderContinuation — Experiência do Peregrino (Fase 7)
 * 
 * Garante que nenhuma leitura termine em um "fim" seco.
 * Oferece caminhos contextuais para continuar a jornada espiritual.
 */
export const ReaderContinuation: React.FC<ReaderContinuationProps> = ({ 
  links, 
  className,
  title = "Continue sua caminhada" 
}) => {
  // Fallback de links caso não sejam providos (Garante direção sempre)
  const displayLinks = links || [
    { icon: 'bible', label: 'Explorar as Escrituras', href: '/bible', category: 'Bíblia' },
    { icon: 'catechism', label: 'Estudar a Doutrina', href: '/catechism', category: 'Catecismo' },
    { icon: 'saint', label: 'Vidas dos Santos', href: '/santos', category: 'Santoral' },
    { icon: 'library', label: 'Voltar ao Acervo', href: '/acervo', category: 'Biblioteca' }
  ];

  return (
    <div className={cn("space-y-spacing-lg max-w-[68ch] mx-auto", className)}>
      <EditorialKicker className="text-center md:text-left">{title}</EditorialKicker>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-sm">
        {displayLinks.map((link, idx) => {
          const Icon = ICON_MAP[link.icon] || Book;
          return (
            <Link
              key={idx}
              to={link.href}
              className="group flex items-center p-spacing-md rounded-premium border border-primary/5 bg-card/40 hover:bg-primary/[0.02] hover:border-primary/20 transition-all gap-spacing-md shadow-premium-sm hover:shadow-premium transition-shadow"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 group-hover:text-primary/60 transition-colors truncate">
                  {link.category}
                </p>
                <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {link.label}
                </h4>
                {link.description && (
                  <p className="text-[10px] text-muted-foreground/60 line-clamp-1 italic font-serif">
                    {link.description}
                  </p>
                )}
              </div>
              <ArrowRight size={16} className="text-primary/20 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ReaderContinuation;
