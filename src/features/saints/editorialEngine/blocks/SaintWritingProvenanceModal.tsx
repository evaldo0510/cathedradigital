import React from 'react';
import { BookOpen, ExternalLink, ShieldCheck, Link as LinkIcon } from 'lucide-react';
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

/**
 * Modal editorial de proveniência: atribuição, licença completa,
 * URL canônica e notas de domínio público quando aplicável.
 */
export const SaintWritingProvenanceModal: React.FC<Props> = ({
  writing,
  open,
  onOpenChange,
}) => {
  if (!writing) return null;
  const isInternal = Boolean(writing.slug);
  const canonical = writing.canonicalUrl ?? writing.externalUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
