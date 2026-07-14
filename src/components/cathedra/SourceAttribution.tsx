import React from 'react';
import { Icons } from '@/constants';

interface SourceAttributionProps {
  source?: string | null;
  sourceUrl?: string | null;
  bioSourceUrl?: string | null;
  prayerSourceUrl?: string | null;
  lastScrapedAt?: string | null;
  className?: string;
}

/**
 * Atribuição de fonte para o santo do dia.
 * Exibe o nome da fonte primária + links para bio/oração/página oficial quando disponíveis.
 */
const SourceAttribution: React.FC<SourceAttributionProps> = ({
  source,
  sourceUrl,
  bioSourceUrl,
  prayerSourceUrl,
  lastScrapedAt,
  className = '',
}) => {
  const label = source && source !== 'Cathedra Database' ? source : null;
  const hasAny = Boolean(label || sourceUrl || bioSourceUrl || prayerSourceUrl);
  if (!hasAny) return null;

  const links: { href: string; label: string }[] = [];
  if (sourceUrl) links.push({ href: sourceUrl, label: 'Página oficial' });
  if (bioSourceUrl && bioSourceUrl !== sourceUrl) links.push({ href: bioSourceUrl, label: 'Biografia' });
  if (prayerSourceUrl && prayerSourceUrl !== sourceUrl && prayerSourceUrl !== bioSourceUrl)
    links.push({ href: prayerSourceUrl, label: 'Oração' });

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground border-t border-border/40 pt-3 mt-4 ${className}`}
    >
      <span className="flex items-center gap-1">
        <Icons.Info className="w-3 h-3" />
        <span className="uppercase tracking-widest font-black">Fonte:</span>
      </span>
      {label && <span className="font-medium text-foreground/80">{label}</span>}
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          {l.label} <Icons.ExternalLink className="w-3 h-3" />
        </a>
      ))}
      {lastScrapedAt && (
        <span className="ml-auto opacity-70">
          Atualizado em {new Date(lastScrapedAt).toLocaleDateString('pt-BR')}
        </span>
      )}
    </div>
  );
};

export default SourceAttribution;
