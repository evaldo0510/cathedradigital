import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * DocumentViewer — utilitário de lightbox para documentos externos (iframe).
 *
 * C0.5.b (Parallel Readers Migration): NÃO é um Reader do Template Master.
 * Sua responsabilidade é apresentar conteúdo EXTERNO (PDF/HTML de terceiros)
 * dentro de um modal fullscreen — não conteúdo editorial próprio da Cathedra.
 * Por isso está isento da Regra COS §10 (Reader Architecture Rule) e não
 * consome `ReaderShell`. Consumidores atuais: `SaintDetail` (fontes primárias).
 *
 * Se um dia precisarmos internalizar o conteúdo, migrar a chamada para o
 * ReaderShell canônico correspondente (Magistério / Santos / etc.).
 */
interface DocumentViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ url, title, onClose }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-[80] flex flex-col "
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between px-spacing-md md:px-spacing-xl py-spacing-sm bg-card border-b border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-spacing-sm min-w-spacing-0">
          <Button
            onClick={onClose}
            className="p-spacing-xs rounded-premium-full hover:bg-secondary transition-colors flex-shrink-0"
          >
            <Icons.X className="w-spacing-md h-spacing-md text-foreground" />
          </Button>
          <h3 className="text-premium-sm font-bold text-foreground truncate">{title}</h3>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-spacing-2xs px-spacing-sm py-spacing-2xs text-premium-xs font-bold text-primary hover:underline flex-shrink-0"
        >
          Abrir original <Icons.ExternalLink className="w-spacing-sm h-spacing-sm" />
        </a>
      </motion.div>
      <div className="flex-1" onClick={e => e.stopPropagation()}>
        <iframe
          src={url}
          title={title}
          className="w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </motion.div>
  </AnimatePresence>
);

export default DocumentViewer;
