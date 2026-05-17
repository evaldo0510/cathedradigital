import React from 'react';
import { Share2 } from 'lucide-react';
import { useShare } from '@/hooks/useShare';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'icon' | 'button';
}

const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url,
  className = '',
  size = 'sm',
  variant = 'icon',
}) => {
  const share = useShare();

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  if (variant === 'button') {
    return (
      <button
        onClick={() => share({ title, text, url })}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/30 transition-all ${className}`}
        title="Compartilhar"
      >
        <Share2 className={iconSize} />
        Compartilhar
      </button>
    );
  }

  return (
    <button
      onClick={() => share({ title, text, url })}
      className={`p-2 rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all ${className}`}
      title="Compartilhar"
    >
      <Share2 className={iconSize} />
    </button>
  );
};

export default ShareButton;
