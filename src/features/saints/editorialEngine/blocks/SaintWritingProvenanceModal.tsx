import React from 'react';
import {
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Link as LinkIcon,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { SaintWritingRef } from '../types';

interface Props {
  writing: SaintWritingRef | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UsageScope {
  label: string;
  allowed: 'yes' | 'no' | 'conditional';
  note?: string;
}

/**
 * Deriva um resumo de permissões de uso a partir da licença/domínio público.
 * Heurística editorial — não substitui parecer jurídico, mas orienta o leitor.
 */
function deriveUsageScope(w: SaintWritingRef): UsageScope[] {
  const license = (w.license ?? '').toLowerCase();
  const isCC0 = /cc0|public domain dedication/.test(license);
  const isCCBy = /cc[\s-]?by(?![\s-]?nc|[\s-]?nd|[\s-]?sa)/.test(license);
  const isCCBySa = /cc[\s-]?by[\s-]?sa/.test(license);
  const isCCByNc = /cc[\s-]?by[\s-]?nc/.test(license);
  const isCCByNd = /cc[\s-]?by[\s-]?nd/.test(license);
  const pd = Boolean(w.isPublicDomain) || isCC0;

  if (pd) {
    return [
      { label: 'Leitura pessoal', allowed: 'yes' },
      { label: 'Citação em estudos', allowed: 'yes' },
      { label: 'Redistribuição', allowed: 'yes' },
      { label: 'Uso comercial', allowed: 'yes' },
      { label: 'Obras derivadas', allowed: 'yes' },
      {
        label: 'Atribuição',
        allowed: 'conditional',
        note: 'Recomendada por cortesia editorial, ainda que não exigida.',
      },
    ];
  }
  if (isCCBy || isCCBySa) {
    return [
      { label: 'Leitura pessoal', allowed: 'yes' },
      { label: 'Redistribuição com crédito', allowed: 'yes' },
      { label: 'Uso comercial', allowed: 'yes' },
      {
        label: 'Obras derivadas',
        allowed: isCCBySa ? 'conditional' : 'yes',
        note: isCCBySa ? 'Compartilhar sob a mesma licença (SA).' : undefined,
      },
      { label: 'Atribuição obrigatória', allowed: 'yes' },
    ];
  }
  if (isCCByNc) {
    return [
      { label: 'Leitura pessoal', allowed: 'yes' },
      { label: 'Uso educacional sem fins lucrativos', allowed: 'yes' },
      { label: 'Uso comercial', allowed: 'no' },
      { label: 'Atribuição obrigatória', allowed: 'yes' },
    ];
  }
  if (isCCByNd) {
    return [
      { label: 'Leitura pessoal', allowed: 'yes' },
      { label: 'Redistribuição integral', allowed: 'yes' },
      { label: 'Obras derivadas', allowed: 'no' },
      { label: 'Atribuição obrigatória', allowed: 'yes' },
    ];
  }
  return [
    { label: 'Leitura pessoal no Cathedra', allowed: 'yes' },
    {
      label: 'Redistribuição / uso comercial',
      allowed: 'conditional',
      note: 'Verifique os termos da fonte oficial antes de reutilizar.',
    },
  ];
}

const SCOPE_ICON: Record<UsageScope['allowed'], React.ReactNode> = {
  yes: <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-label="Permitido" />,
  no: <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" aria-label="Não permitido" />,
  conditional: (
    <AlertTriangle
      className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400"
      aria-label="Condicional"
    />
  ),
};

/**
 * Modal editorial de proveniência: atribuição, licença completa,
 * escopo de uso, URL canônica e notas de domínio público.
 *
 * Acessibilidade: `Dialog` do shadcn/Radix já provê focus trap,
 * foco inicial no primeiro elemento focável, retorno ao gatilho ao fechar,
 * fechamento por Escape e navegação por Tab.
 */
export const SaintWritingProvenanceModal: React.FC<Props> = ({
  writing,
  open,
  onOpenChange,
}) => {
  if (!writing) return null;
  const isInternal = Boolean(writing.slug);
  const canonical = writing.canonicalUrl ?? writing.externalUrl;
  const scopes = deriveUsageScope(writing);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="saint-writing-provenance-modal">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            {isInternal ? (
              <BookOpen className="w-4 h-4 text-primary" aria-hidden />
            ) : (
              <ExternalLink className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden />
            )}
            {writing.title}
          </DialogTitle>
          <DialogDescription>
            {isInternal
              ? 'Hospedado no Cathedra — texto editado e revisado internamente.'
              : `Conteúdo linkado${writing.externalSourceLabel ? ` · ${writing.externalSourceLabel}` : ''}.`}
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-3 text-sm">
          {writing.attribution && (
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Atribuição
              </dt>
              <dd className="text-foreground/90 mt-0.5">{writing.attribution}</dd>
            </div>
          )}

          <div>
            <dt className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Licença
            </dt>
            <dd className="text-foreground/90 mt-0.5 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-primary/70 flex-shrink-0" aria-hidden />
              <span>
                {writing.isPublicDomain
                  ? `Domínio público${writing.license ? ` · ${writing.license}` : ''}`
                  : writing.license ?? 'Licença não informada.'}
              </span>
            </dd>
          </div>

          <div>
            <dt className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              O que você pode fazer
            </dt>
            <dd className="mt-1">
              <ul className="grid grid-cols-1 gap-1.5" aria-label="Escopo de uso">
                {scopes.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-start gap-2 text-foreground/90"
                  >
                    <span className="mt-0.5 flex-shrink-0">{SCOPE_ICON[s.allowed]}</span>
                    <span>
                      <span className="font-medium">{s.label}</span>
                      {s.note && (
                        <span className="block text-muted-foreground text-xs leading-relaxed">
                          {s.note}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-muted-foreground/80 italic">
                Resumo editorial. Consulte a licença oficial para termos completos.
              </p>
            </dd>
          </div>

          {writing.isPublicDomain && writing.publicDomainNote && (
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Nota de domínio público
              </dt>
              <dd className="text-foreground/80 mt-0.5 leading-relaxed">
                {writing.publicDomainNote}
              </dd>
            </div>
          )}

          {canonical && (
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                URL canônica
              </dt>
              <dd className="mt-0.5">
                <a
                  href={canonical}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline break-all"
                >
                  <LinkIcon className="w-3 h-3 flex-shrink-0" aria-hidden />
                  {canonical}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </DialogContent>
    </Dialog>
  );
};

