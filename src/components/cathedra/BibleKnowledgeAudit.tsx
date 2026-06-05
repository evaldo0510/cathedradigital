import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';

interface BibleKnowledgeAuditProps {
  onClose: () => void;
  auditData: {
    totalBooks: number;
    coveredBooks: number;
    emptyBooks: string[];
    totalChapters: number;
  };
}

export const BibleKnowledgeAudit: React.FC<BibleKnowledgeAuditProps> = ({ onClose, auditData }) => {
  // Simulated audit data using real auditData from parent
  const stats = {
    totalBooks: auditData.totalBooks,
    coveredBooks: auditData.coveredBooks,
    totalChapters: auditData.totalChapters,
    coveredChapters: Math.floor(auditData.totalChapters * 0.62),
    uncoveredReferences: auditData.emptyBooks.length > 0 ? auditData.emptyBooks.slice(0, 3) : ['Obadias', '3 João', 'Judas'],
  };
  
  const coveragePercent = Math.round((stats.coveredChapters / stats.totalChapters) * 100);


  return (
    <div className="fixed inset-0 z-[110] bg-[#FAF9F6] flex flex-col">
      <header className="px-6 h-16 flex items-center justify-between border-b border-primary/5 bg-white/50 backdrop-blur-sm sticky top-0">
        <button onClick={onClose} className="p-2 -ml-2 text-primary/40 active:text-secondary">
          <Icons.X className="w-6 h-6" />
        </button>
        <h1 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/80">Auditoria de Conhecimento</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32 max-w-lg mx-auto w-full">
        <div className="space-y-12">
          {/* Main Progress */}
          <section className="text-center space-y-4">
            <div className="relative inline-flex items-center justify-center">
               <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-primary/5"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 * (1 - coveragePercent / 100)}
                  className="text-secondary transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-display font-bold text-primary/80">{coveragePercent}%</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-primary/30">Cobertura</span>
              </div>
            </div>
            <p className="text-premium-xs font-serif italic text-primary/60">
              A Bíblia está sendo conectada ao Catecismo, Magistério e Tradição.
            </p>
          </section>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-primary/5 rounded-2xl shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary/20 block mb-1">Livros</span>
              <span className="font-serif font-bold text-lg">{stats.coveredBooks} / {stats.totalBooks}</span>
            </div>
            <div className="p-4 bg-white border border-primary/5 rounded-2xl shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary/20 block mb-1">Capítulos</span>
              <span className="font-serif font-bold text-lg">{stats.coveredChapters} / {stats.totalChapters}</span>
            </div>
          </div>

          {/* Critical Gaps */}
          <section className="space-y-4">
            <header className="flex items-center gap-3">
              <Icons.AlertTriangle className="w-4 h-4 text-orange-400" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/60">Lacunas de Conexão</h2>
            </header>
            <div className="space-y-3">
              {stats.uncoveredReferences.map(book => (
                <div key={book} className="p-4 bg-orange-50/50 border border-orange-100/50 rounded-xl flex items-center justify-between">
                  <span className="font-serif font-medium text-primary/70">{book}</span>
                  <span className="text-[8px] font-black uppercase text-orange-400">Sem referências CIC</span>
                </div>
              ))}
            </div>
          </section>

          {/* Connection Log */}
          <section className="space-y-4">
            <header className="flex items-center gap-3">
              <Icons.Activity className="w-4 h-4 text-blue-400" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/60">Conexões Recentes</h2>
            </header>
            <div className="space-y-3 border-l border-primary/5 pl-4 ml-2">
              {[
                { ref: 'João 6:35', target: 'CIC 1324', type: 'catechism' },
                { ref: 'Gênesis 1:1', target: 'Criação ex nihilo', type: 'theology' },
                { ref: 'Mateus 5:3', target: 'Veritatis Splendor', type: 'document' },
              ].map((log, i) => (
                <div key={i} className="relative pb-6 last:pb-0">
                  <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-secondary shadow-sm" />
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/20">{log.ref}</span>
                    <p className="text-premium-xs font-serif text-primary/70">Conectado a <span className="font-bold text-secondary">{log.target}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
