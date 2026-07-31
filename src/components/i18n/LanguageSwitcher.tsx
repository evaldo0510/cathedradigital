import { Globe } from 'lucide-react';
import { useLang } from '@/hooks/useLang';
import { SUPPORTED_LOCALES } from '@/lib/i18n/locales';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  /** `compact` mostra apenas o código (PT/EN); `full` mostra o nome nativo. */
  variant?: 'compact' | 'full';
}

/**
 * Seletor de idioma. A troca altera o prefixo da URL (`/en/...`), mantendo
 * o caminho atual — o português permanece sem prefixo.
 */
export function LanguageSwitcher({ className, variant = 'compact' }: LanguageSwitcherProps) {
  const { lang, setLang } = useLang();
  const current = SUPPORTED_LOCALES.find((l) => l.code === lang) ?? SUPPORTED_LOCALES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2 text-muted-foreground hover:text-foreground', className)}
          aria-label={`Idioma: ${current.nativeName}. Alterar idioma`}
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-medium uppercase tracking-wide">
            {variant === 'full' ? current.nativeName : current.code}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {SUPPORTED_LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onSelect={() => setLang(locale.code)}
            aria-current={locale.code === lang ? 'true' : undefined}
            className={cn(
              'cursor-pointer justify-between',
              locale.code === lang && 'font-semibold text-foreground',
            )}
          >
            <span>{locale.nativeName}</span>
            <span className="text-xs uppercase text-muted-foreground">{locale.code}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
