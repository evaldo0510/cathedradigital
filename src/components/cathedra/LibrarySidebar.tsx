import React from 'react';
import { cn } from '@/lib/utils';
import { Icons } from '@/constants';

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
    <div className={cn("library-sidebar h-full overflow-y-auto hidden lg:flex", className)}>
      <div className="space-y-1 mb-6">
        <h2 className="font-display text-[10px] tracking-[0.3em] uppercase text-primary/40">{subtitle}</h2>
        <h1 className="font-serif text-2xl font-black text-primary leading-tight">{title}</h1>
      </div>

      <div className="flex flex-col gap-8 pr-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={item.onClick}
            className={cn(
              "library-nav-item group",
              item.isActive && "active"
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn(
                "nav-num transition-colors duration-500",
                item.isActive ? "text-primary" : "text-muted-foreground/40"
              )}>
                {item.num !== undefined ? `§${item.num}` : ''}
              </span>
              {item.status === 'read' && (
                <Icons.Check className="w-2.5 h-2.5 text-primary/40 group-hover:text-primary transition-colors" />
              )}
            </div>
            <span className="nav-label">{item.label}</span>
            
            {item.isActive && (
              <div className="h-px w-full bg-gradient-to-r from-primary/40 to-transparent mt-2" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-10 border-t border-border/10">
        <div className="flex items-center gap-3 text-premium-tiny opacity-30 hover:opacity-100 transition-opacity cursor-help">
          <Icons.ShieldCheck className="w-3 h-3" />
          <span>Santuário Digital</span>
        </div>
      </div>
    </div>
  );
};

export default LibrarySidebar;
