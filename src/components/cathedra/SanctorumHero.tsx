import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EditorialHero } from '@/components/editorial';

/**
 * SanctorumHero — Hero editorial unificado para todas as páginas Sanctorum
 * (Vidas dos Santos, Papas, Doutores, Santo do Dia, Detalhe do Santo, etc.).
 *
 * Padrão Logos 2030: kicker dourado versalete + título Cormorant + subtítulo Karla
 * + textura de pergaminho + filete dourado sob o título.
 *
 * API unificada (sem gambiarras por página):
 *   <SanctorumHero variant="page" title="Vidas dos Santos" />
 *   <SanctorumHero variant="category" kind="pope" title="Os Papas" />
 *   <SanctorumHero variant="saintOfDay" date={new Date()} title="Santa Maria" />
 *   <SanctorumHero variant="detail" kind="doctor" title="Tomás de Aquino" />
 *
 * O `kicker` explícito sempre vence a inferência automática (backward compat).
 */
export type SanctorumVariant = 'page' | 'category' | 'saintOfDay' | 'detail';

export type SanctorumKind =
  | 'santo'
  | 'pope'
  | 'doctor'
  | 'martyr'
  | 'confessor'
  | 'virgin'
  | 'apostle'
  | 'father';

const KIND_LABEL: Record<SanctorumKind, string> = {
  santo: 'Santos',
  pope: 'Papas',
  doctor: 'Doutores',
  martyr: 'Mártires',
  confessor: 'Confessores',
  virgin: 'Virgens',
  apostle: 'Apóstolos',
  father: 'Padres da Igreja',
};

export interface SanctorumHeroProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  kicker?: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  align?: 'left' | 'center';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Semântica do hero — controla o kicker padrão. */
  variant?: SanctorumVariant;
  /** Tipo de santo — usado por variant="category" e "detail". */
  kind?: SanctorumKind;
  /** Data usada por variant="saintOfDay". Default: hoje. */
  date?: Date;
}

function deriveKicker(
  variant: SanctorumVariant,
  kind?: SanctorumKind,
  date?: Date,
): string {
  switch (variant) {
    case 'saintOfDay': {
      const d = date ?? new Date();
      return `Sanctorum · Santo do Dia · ${format(d, "dd 'de' MMMM", { locale: ptBR })}`;
    }
    case 'category':
      return `Sanctorum · ${kind ? KIND_LABEL[kind] : 'Coleção'}`;
    case 'detail':
      return kind ? `Sanctorum · ${KIND_LABEL[kind]}` : 'Sanctorum Pro';
    case 'page':
    default:
      return 'Sanctorum Pro';
  }
}

export const SanctorumHero: React.FC<SanctorumHeroProps> = ({
  title,
  subtitle,
  kicker,
  meta,
  action,
  align = 'center',
  size = 'md',
  className,
  variant = 'page',
  kind,
  date,
}) => {
  const resolvedKicker = kicker ?? deriveKicker(variant, kind, date);
  return (
    <EditorialHero
      variant="editorial"
      align={align}
      size={size}
      parchment
      rule
      kicker={resolvedKicker}
      title={title}
      subtitle={subtitle}
      meta={meta}
      action={action}
      className={className}
    />
  );
};

export default SanctorumHero;
