import React from 'react';
import { cn } from '@/lib/utils';
import { Icons } from '@/constants';
import { motion } from 'framer-motion';

interface LibraryNavItem {
  id: string | number;
  num?: string | number;
  label: string;
  isActive: boolean;
  onClick: () => void;
  status?: 'unread' | 'read' | 'reading';
}

interface LibrarySidebarProps {
  title: string;
  subtitle?: string;
  items: LibraryNavItem[];
  className?: string;
}

const LibrarySidebar: React.FC<LibrarySidebarProps> = ({ title, subtitle, items, className }) => {
  return (
    <div className={cn("library-sidebar h-full overflow-y-auto hidden lg:flex flex-col scrollbar-none", className)}>
      <div className="space-y-2 mb-12">
        <h2 className="font-display text-[9px] tracking-[0.4em] uppercase text-primary/30">{subtitle}</h2>
        <h1 className="font-serif text-3xl font-bold text-primary leading-tight tracking-tight">{title}</h1>
      </div>

      <div className="flex flex-col gap-10 pr-6">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={item.onClick}
            className={cn(
              "library-nav-item group",
              item.isActive && "active"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={cn(
                "nav-num transition-colors duration-700",
                item.isActive ? "text-primary/60" : "text-primary/20"
              )}>
                {item.num !== undefined ? `§${item.num}` : ''}
              </span>
              {item.status === 'read' && (
                <Icons.Check className="w-3 h-3 text-primary/40 group-hover:text-primary transition-all" />
              )}
            </div>
            <span className="nav-label">{item.label}</span>
            
            {item.isActive && (
              <motion.div 
                layoutId="active-indicator"
                className="absolute -left-10 top-0 bottom-0 w-1 bg-primary/40 rounded-r-full" 
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-12 border-t border-primary/5">
        <div className="flex flex-col gap-6 opacity-20 hover:opacity-100 transition-all duration-700">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]">
            <Icons.Compass className="w-4 h-4" />
            <span>Biblioteca Contemplativa</span>
          </div>
          <p className="text-[10px] font-serif italic leading-relaxed">
            "A leitura espiritual é o alimento da alma."
          </p>
        </div>
      </div>
    </div>
  );
};

export default LibrarySidebar;
