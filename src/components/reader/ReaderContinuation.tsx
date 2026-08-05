import React from 'react';
import { Link } from 'react-router-dom';
import { Book, User, Church, ScrollText, Heart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditorialKicker } from '@/components/editorial/harmony';

export interface ContinuationLink {
  icon: 'bible' | 'saint' | 'catechism' | 'writings' | 'prayer';
  label: string;
  href: string;
  category: string;
}

interface ReaderContinuationProps {
  links: ContinuationLink[];
  className?: string;
}

const ICON_MAP = {
  bible: Book,
  saint: User,
  catechism: Church,
  writings: ScrollText,
  prayer: Heart,
};

export const ReaderContinuation: React.FC<ReaderContinuationProps> = ({ links, className }) => {
  if (!links || links.length === 0) return null;

  return (
    <div className={cn("space-y-spacing-lg", className)}>
      <EditorialKicker>Continue sua caminhada</EditorialKicker>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-sm">
        {links.map((link, idx) => {
          const Icon = ICON_MAP[link.icon] || Book;
          return (
            <Link
              key={idx}
              to={link.href}
              className="group flex items-center p-spacing-md rounded-premium border border-primary/5 bg-card/40 hover:bg-primary/[0.02] hover:border-primary/20 transition-all gap-spacing-md"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 group-hover:text-primary/60 transition-colors">
                  {link.category}
                </p>
                <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {link.label}
                </h4>
              </div>
              <ArrowRight size={16} className="text-primary/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ReaderContinuation;
