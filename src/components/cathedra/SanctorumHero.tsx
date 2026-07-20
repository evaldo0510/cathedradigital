import React from 'react';
import { EditorialHero } from '@/components/editorial';

/**
 * SanctorumHero — Hero editorial reutilizável para todas as páginas de Santos
 * (Vidas dos Santos, Papas, Santo do Dia, Detalhe do Santo, etc.).
 *
 * Padrão Logos 2030:
 *  - Kicker dourado em versalete (default: "Sanctorum Pro")
 *  - Título em Cormorant Garamond
 *  - Subtítulo em Karla / itálico
 *  - Textura de pergaminho contida no hero
 *  - Filete dourado sob o título
 *
 * Uso:
 *   <SanctorumHero title="Vidas dos Santos" subtitle="..." />
 *   <SanctorumHero kicker="Sanctorum · Papas" title="Os Papas" subtitle="..." />
 */
export interface SanctorumHeroProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  kicker?: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  align?: 'left' | 'center';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SanctorumHero: React.FC<SanctorumHeroProps> = ({
  title,
  subtitle,
  kicker = 'Sanctorum Pro',
  meta,
  action,
  align = 'center',
  size = 'md',
  className,
}) => {
  return (
    <EditorialHero
      variant="editorial"
      align={align}
      size={size}
      parchment
      rule
      kicker={kicker}
      title={title}
      subtitle={subtitle}
      meta={meta}
      action={action}
      className={className}
    />
  );
};

export default SanctorumHero;
