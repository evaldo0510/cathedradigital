import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CIC_SECTIONS } from '@/data/catechism';
import { toast } from 'sonner';


export type RegenerationStatus = 'pending' | 'processing' | 'success' | 'error';

interface FailedParagraphsSectionProps {
  failedParagraphs: any[] | undefined;
  regenerationStatus: Record<number, RegenerationStatus>;
  isRegeneratingAll: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterSection: string;
  setFilterSection: (v: string) => void;
  filterError: string;
  setFilterError: (v: string) => void;
  sortBy: 'paragraph' | 'error';
  setSortBy: (v: 'paragraph' | 'error') => void;
  onRegenerateSection: (paras: { paragraph: number }[]) => void;
  onRegenerateSingle: (para: number) => void;
  onCancelRegeneration: () => void;
}

const FailedParagraphsSection: React.FC<FailedParagraphsSectionProps> = ({
  failedParagraphs,
  regenerationStatus,
  isRegeneratingAll,
  searchTerm,
  setSearchTerm,
  filterSection,
  setFilterSection,
  filterError,
  setFilterError,
  sortBy,
  setSortBy,
  onRegenerateSection,
  onRegenerateSingle,
  onCancelRegeneration,
}) => {
  const filteredFailedParagraphs = useMemo(() => {
    if (!failedParagraphs) return [];
    
    let filtered = failedParagraphs.filter(p => {
      if (regenerationStatus[p.paragraph] === 'success') return false;

      if (filterSection !== 'all') {
        const sectionId = parseInt(filterSection);
        const section = CIC_SECTIONS.flatMap(part => part.sections).find(s => s.id === sectionId);
        if (section) {
          const [start, end] = section.paragraphs;
          if (p.paragraph < start || p.paragraph > end) return false;
        }
      }

      if (filterError !== 'all' && p.status !== filterError) return false;

      if (searchTerm && !p.paragraph.toString().includes(searchTerm) && !p.last_error?.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      return true;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'paragraph') return a.paragraph - b.paragraph;
      if (sortBy === 'error') return (a.last_error || '').localeCompare(b.last_error || '');
      return 0;
    });

    return filtered;
  }, [failedParagraphs, filterSection, filterError, searchTerm, sortBy, regenerationStatus]);

  const failedBySection = useMemo(() => {
    return CIC_SECTIONS.flatMap(part => 
      part.sections.map(section => {
        const [start, end] = section.paragraphs;
        const failed = filteredFailedParagraphs.filter(p => p.paragraph >= start && p.paragraph <= end);
        return { ...section, part: part.part, failed };
      })
    ).filter(s => s.failed.length > 0);
  }, [filteredFailedParagraphs]);

  const getStatusIcon = (paragraph: number) => {
    const status = regenerationStatus[paragraph];
    switch (status) {
      case 'processing': return <Icons.Loader2 className="w-3 h-3 animate-spin text-primary" />;
      case 'success': return <Icons.Check className="w-3 h-3 text-green-500" />;
      case 'error': return <Icons.AlertTriangle className="w-3 h-3 text-destructive" />;
      case 'pending': return <Icons.Clock className="w-3 h-3 text-muted-foreground" />;
      default: return <Icons.RotateCcw className="w-3 h-3 text-destructive" />;
    }
  };

  const handleExportCSV = useCallback(() => {
    if (!filteredFailedParagraphs || filteredFailedParagraphs.length === 0) {
      toast.error("Nenhum dado para exportar.");
      return;
    }

    const headers = ["Parágrafo", "Status", "Erro", "Seção"];
    const rows = filteredFailedParagraphs.map(p => {
      const section = CIC_SECTIONS.flatMap(part => part.sections).find(s => {
        const [start, end] = s.paragraphs;
        return p.paragraph >= start && p.paragraph <= end;
      });
      return [
        p.paragraph,
        p.status,
        `"${(p.last_error || 'Erro desconhecido').replace(/"/g, '""')}"`,
        `"${section?.title || 'N/A'}"`
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `falhas_catecismo_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exportado com sucesso.");
  }, [filteredFailedParagraphs]);

  if (!failedParagraphs || failedParagraphs.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.section 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="space-y-6 bg-destructive/5 border border-destructive/10 rounded-3xl p-6 overflow-hidden"
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Icons.AlertTriangle className="w-5 h-5 text-destructive" />
              <h2 className="text-xl font-bold text-destructive">Falhas de Geração</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExportCSV()}
              className="rounded-xl border-destructive/20 hover:bg-destructive/10 text-destructive text-xs gap-2"
            >
              <Icons.Download className="w-4 h-4" /> Exportar CSV
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input 
              placeholder="Buscar parágrafo ou erro..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background/50 border-destructive/20"
            />
            <Select value={filterSection} onValueChange={setFilterSection}>
              <SelectTrigger className="bg-background/50 border-destructive/20">
                <SelectValue placeholder="Seção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Seções</SelectItem>
                {CIC_SECTIONS.flatMap(p => p.sections).map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterError} onValueChange={setFilterError}>
              <SelectTrigger className="bg-background/50 border-destructive/20">
                <SelectValue placeholder="Tipo de Erro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Erros</SelectItem>
                <SelectItem value="error">Geral (Error)</SelectItem>
                <SelectItem value="error_402">Pagamento (402)</SelectItem>
                <SelectItem value="incomplete">Incompleto</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="bg-background/50 border-destructive/20">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paragraph">Parágrafo</SelectItem>
                <SelectItem value="error">Mensagem de Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-8">
          {failedBySection.length > 0 ? failedBySection.map((section) => (
            <div key={section.id} className="space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-destructive/10 pb-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-widest text-destructive/60">
                    {section.part}
                  </div>
                  <h3 className="text-sm font-bold truncate text-destructive">{section.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {isRegeneratingAll && section.failed.some(p => regenerationStatus[p.paragraph] === 'pending' || regenerationStatus[p.paragraph] === 'processing') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onCancelRegeneration}
                      className="rounded-lg h-7 px-3 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10"
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => onRegenerateSection(section.failed)}
                    disabled={isRegeneratingAll}
                    className="rounded-lg h-7 px-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                  >
                    {isRegeneratingAll ? (
                      <Icons.Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Icons.Zap className="w-3 h-3" />
                    )}
                    Regenerar Seção ({section.failed.length})
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {section.failed.map(p => (
                  <div key={p.paragraph} className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-center justify-between gap-3 group/item relative overflow-hidden">
                    {regenerationStatus[p.paragraph] === 'processing' && (
                      <motion.div 
                        className="absolute bottom-0 left-0 h-0.5 bg-primary/40"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-bold text-destructive">§{p.paragraph}</div>
                        {regenerationStatus[p.paragraph] && (
                          <div className="text-[9px] uppercase font-black opacity-60">
                            {regenerationStatus[p.paragraph]}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-destructive/60 truncate" title={p.last_error || 'Erro desconhecido'}>
                        {p.last_error || 'Erro desconhecido'}
                      </div>
                    </div>
                    <button 
                      onClick={() => onRegenerateSingle(p.paragraph)}
                      className="p-1.5 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
                      title="Regenerar"
                      disabled={regenerationStatus[p.paragraph] === 'processing'}
                    >
                      {getStatusIcon(p.paragraph)}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-destructive/60 italic text-sm">
              Nenhum erro encontrado com os filtros atuais.
            </div>
          )}
        </div>
      </motion.section>
    </AnimatePresence>
  );
};

export default FailedParagraphsSection;
