import { Icons } from '@/constants';
import React from 'react';

import { useShare } from '@/hooks/useShare';
import { Button } from '@/components/ui/button';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'icon';
  variant?: 'outline' | 'ghost' | 'default';
}

const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url,
  className = '',
  size = 'icon',
  variant = 'outline',
}) => {
  const share = useShare();

  const isIcon = size === 'icon';

  return (
    <Button
      onClick={() => share({ title, text, url })}
      variant={variant}
      size={isIcon ? 'icon' : 'sm'}
      className={className}
      title="Compartilhar"
    >
      <Icons.Share2 className="w-spacing-md h-spacing-md" />
      {!isIcon && "Compartilhar"}
    </Button>
  );
};

export default ShareButton;
