/**
 * SafeImage — imagem com skeleton suave e fallback em caso de erro.
 * Usada nos cards e heros de Coleções da Biblioteca.
 */
import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SafeImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  aspect?: string;
  wrapperClassName?: string;
  fallbackLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  aspect = 'aspect-[4/3]',
  wrapperClassName,
  fallbackLabel,
  className,
  loading = 'lazy',
  decoding = 'async',
  ...rest
}) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
    src ? 'loading' : 'error',
  );

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted/40',
        aspect,
        wrapperClassName,
      )}
    >
      {status !== 'error' && src ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding={decoding}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-500',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
            className,
          )}
          {...rest}
        />
      ) : null}

      {status === 'loading' ? (
        <div
          aria-hidden
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/60 via-muted/30 to-muted/60"
        />
      ) : null}

      {status === 'error' ? (
        <div
          role="img"
          aria-label={fallbackLabel ?? alt}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/40 text-muted-foreground"
        >
          <ImageOff className="h-6 w-6" aria-hidden />
          <span className="px-3 text-center font-stitch-body text-[11px] uppercase tracking-[0.15em]">
            {fallbackLabel ?? alt}
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default SafeImage;
