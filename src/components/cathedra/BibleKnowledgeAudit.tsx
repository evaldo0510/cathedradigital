import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { toast } from 'sonner';


interface BibleKnowledgeAuditProps {
  onClose: () => void;
  auditData: {
    totalBooks: number;
    coveredBooks: number;
    emptyBooks: string[];
    totalChapters: number;
    themesCount?: number;
    theologicalThemes?: { id: string, label: string, connections: number, tags: string[] }[];
  };
}



interface BibleKnowledgeAuditProps {
  onClose: () => void;
  auditData: {
    totalBooks: number;
    coveredBooks: number;
    emptyBooks: string[];
    totalChapters: number;
    themesCount?: number;
    theologicalThemes?: { id: string, label: string, connections: number, tags: string[] }[];
  };
  onThemeClick?: (theme: string) => void;
}

export const BibleKnowledgeAudit: React.FC<BibleKnowledgeAuditProps> = ({ onClose, auditData, onThemeClick }) => {

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
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const csv = `Tipo,Referencia,Target\n` + 
                `Conexao,João 6:35,CIC 1324\n` +
                `Conexao,Gênesis 1:1,Criação ex nihilo\n` +
                `Lacuna,Obadias,Sem mapeamento\n` +
                `Lacuna,3 João,Sem mapeamento\n` +
                `Lacuna,Judas,Sem mapeamento`;
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `auditoria-cathedra-${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="p-2 text-primary/40 active:text-secondary"
            title="Exportar Relatório"
          >
            <Icons.FileText className="w-5 h-5" />
          </button>
          <div className="w-10" />
        </div>

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
            
            {/* Evolution Chart */}
            <div className="w-full h-32 flex items-end gap-1 px-4 pt-8">
              {[45, 48, 52, 51, 58, 60, 62].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div 
                    className="w-full bg-secondary/20 rounded-t-lg transition-all duration-1000 group-hover:bg-secondary/40 relative"
                    style={{ height: `${val}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      v1.{i} - {val}%
                    </div>
                  </div>
                  <span className="text-[7px] font-black text-primary/20 uppercase tracking-tighter">0{i+1}/06</span>
                </div>
              ))}
            </div>
            
            <p className="text-premium-xs font-serif italic text-primary/60">

              A Bíblia está sendo conectada ao Catecismo, Magistério e Tradição.
            </p>
          </section>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-primary/5 rounded-2xl shadow-sm">
              <span className="text-[8px] font-black uppercase tracking-widest text-primary/20 block mb-1">Livros</span>
              <span className="font-serif font-bold text-base">{stats.coveredBooks} / {stats.totalBooks}</span>
            </div>
            <div className="p-3 bg-white border border-primary/5 rounded-2xl shadow-sm">
              <span className="text-[8px] font-black uppercase tracking-widest text-primary/20 block mb-1">Capítulos</span>
              <span className="font-serif font-bold text-base">{stats.coveredChapters} / {stats.totalChapters}</span>
            </div>
            <div className="p-3 bg-white border border-primary/5 rounded-2xl shadow-sm">
              <span className="text-[8px] font-black uppercase tracking-widest text-primary/20 block mb-1">Temas</span>
              <span className="font-serif font-bold text-base">{auditData.themesCount || 0}</span>
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

          {/* Theological Themes Index (Phase 3) */}
          <section className="space-y-4">
            <header className="flex items-center gap-3">
              <Icons.Tag className="w-4 h-4 text-secondary" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/60">Temas Teológicos</h2>
            </header>
            <div className="bg-white border border-primary/5 rounded-2xl overflow-hidden divide-y divide-primary/[0.03]">
              {auditData.theologicalThemes?.map(theme => (
                <div key={theme.id} className="p-4 flex items-center justify-between group hover:bg-primary/[0.01] transition-colors">
                  <div className="space-y-1">
                    <span className="font-serif font-bold text-primary/80">{theme.label}</span>
                    <div className="flex gap-1">
                      {theme.tags.map(tag => (
                        <span key={tag} className="text-[7px] font-black uppercase text-primary/30 border border-primary/5 px-1 rounded-sm">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-secondary">{theme.connections} conexões</span>
                    <Icons.ChevronRight className="w-3 h-3 text-primary/10" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Identified Gaps Index (Phase 3) */}

          <section className="space-y-4">
            <header className="flex items-center gap-3">
              <Icons.List className="w-4 h-4 text-primary/40" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/60">Índice de Lacunas</h2>
            </header>
            <div className="bg-white border border-primary/5 rounded-2xl overflow-hidden divide-y divide-primary/[0.03]">
              {auditData.emptyBooks.map(book => (
                <div key={book} className="p-4 flex items-center justify-between group hover:bg-primary/[0.01] transition-colors">
                  <div className="space-y-1">
                    <span className="font-serif font-bold text-primary/80">{book}</span>
                    <p className="text-[9px] font-medium text-stone-400 uppercase tracking-tighter">Faltam referências do CIC e Magistério</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => toast.success(`${book} marcado como validado`)}
                      className="p-2 rounded-lg bg-green-50 text-green-600 active:scale-95"
                      title="Marcar como Validado"
                    >
                      <Icons.Check className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => toast.info(`Iniciando mapeamento para ${book}`)}
                      className="p-2 rounded-lg bg-secondary/5 text-secondary active:scale-95"
                      title="Mapear Manualmente"
                    >
                      <Icons.Plus className="w-4 h-4" />
                    </button>
                  </div>

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

