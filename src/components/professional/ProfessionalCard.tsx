import React from 'react';
import { Instagram, User, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ProfessionalCardProps {
  name: string;
  bio?: string;
  avatarUrl?: string;
  instagramUrl?: string;
  className?: string;
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  name,
  bio,
  avatarUrl,
  instagramUrl,
  className
}) => {
  if (!name) return null;

  return (
    <div className={cn(
      "p-6 rounded-premium border border-gold-text/20 bg-[#FDF8F3] shadow-sm",
      "flex flex-col sm:flex-row items-center gap-6",
      className
    )}>
      <Avatar className="w-20 h-20 border-2 border-gold-text/30">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
        ) : (
          <AvatarFallback className="bg-primary/5 text-primary">
            <User className="w-8 h-8" />
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className="flex-1 text-center sm:text-left space-y-2">
        <h3 className="font-display text-2xl italic text-primary">{name}</h3>
        {bio && (
          <p className="font-reader text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {bio}
          </p>
        )}
        
        {instagramUrl && (
          <a 
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 text-gold-text hover:text-primary transition-colors font-reader text-xs font-bold uppercase tracking-widest"
          >
            <Instagram className="w-4 h-4" />
            Instagram
            <ArrowRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
