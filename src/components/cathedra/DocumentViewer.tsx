import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';

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
      className="fixed inset-0 bg-background/95 z-[80] flex flex-col backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between px-4 md:px-8 py-3 bg-card border-b border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          <h3 className="text-sm font-bold text-foreground truncate">{title}</h3>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary hover:underline flex-shrink-0"
        >
          Abrir original <ExternalLink className="w-3.5 h-3.5" />
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
