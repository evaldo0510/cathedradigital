import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import SEOHead from '@/components/SEOHead';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CIC_SECTIONS } from '@/data/catechism';
import { toast } from 'sonner';

type RegenerationStatus = 'pending' | 'processing' | 'success' | 'error';

const CatechismHistory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [regenerationStatus, setRegenerationStatus] = useState<Record<number, RegenerationStatus>>({});
  const cancelRegenerationRef = useRef(false);
  
  // Filters
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterError, setFilterError] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'paragraph' | 'error'>('paragraph');

  // 1. History (Last 50)
  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['catechism-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('catechism_paragraphs_read')
        .select('paragraph, read_at')
        .eq('user_id', user.id)
        .order('read_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // 2. All progress for progress bars
  const { data: allProgress } = useQuery({
    queryKey: ['catechism-all-progress', user?.id],
    queryFn: async () => {
      if (!user) return new Set<number>();
      const { data, error } = await supabase
        .from('catechism_paragraphs_read')
        .select('paragraph')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return new Set(data.map(p => p.paragraph));
    },
    enabled: !!user
  });

  // 3. Failed paragraphs with automatic polling when regenerating
  const { data: failedParagraphs } = useQuery({
    queryKey: ['catechism-failed-paragraphs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catechism_cache')
        .select('paragraph, status, last_error')
        .or('status.eq.error,status.eq.error_402,status.eq.incomplete')
        .order('paragraph', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: isRegeneratingAll ? 3000 : false, // Poll every 3s during regeneration
  });

  const regenerateMutation = useMutation({
    mutationFn: async (paragraph: number) => {
      setRegenerationStatus(prev => ({ ...prev, [paragraph]: 'processing' }));
      const { data, error } = await supabase.functions.invoke('catechism-text', {
        body: { paragraph, action: 'reprocess' }
      });
      if (error) {
        setRegenerationStatus(prev => ({ ...prev, [paragraph]: 'error' }));
        throw error;
      }
      setRegenerationStatus(prev => ({ ...prev, [paragraph]: 'success' }));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catechism-failed-paragraphs'] });
    }
  });

  const goBack = () => navigate('/catechism');

  const continueFrom = () => {
    if (!allProgress || allProgress.size === 0) {
      navigate('/catechism?p=1');
      return;
    }
    const sorted = Array.from(allProgress).sort((a, b) => b - a);
    const lastRead = sorted[0];
    const next = lastRead + 1;
    navigate(`/catechism?p=${next > 2865 ? 2865 : next}`);
  };

  const calculateSectionProgress = (start: number, end: number) => {
    if (!allProgress) return 0;
    let count = 0;
    for (let i = start; i <= end; i++) {
      if (allProgress.has(i)) count++;
    }
    return Math.round((count / (end - start + 1)) * 100);
  };

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

  const handleRegenerateSection = async (sectionParagraphs: { paragraph: number }[]) => {
    setIsRegeneratingAll(true);
    cancelRegenerationRef.current = false;
    let successCount = 0;
    let cancelCount = 0;
    
    const initialStatus: Record<number, RegenerationStatus> = {};
    sectionParagraphs.forEach(p => initialStatus[p.paragraph] = 'pending');
    setRegenerationStatus(prev => ({ ...prev, ...initialStatus }));

    for (const p of sectionParagraphs) {
      if (cancelRegenerationRef.current) {
        cancelCount++;
        continue;
      }

      try {
        await regenerateMutation.mutateAsync(p.paragraph);
        successCount++;
      } catch (err) {
        console.error(`Failed to regenerate §${p.paragraph}:`, err);
      }
    }
    
    setIsRegeneratingAll(false);
    if (cancelCount > 0) {
      toast.info(`Regeneração interrompida. ${successCount} concluídos, ${cancelCount} cancelados.`);
    } else {
      toast.success(`${successCount} parágrafos da seção regenerados.`);
    }
  };

  const handleCancelRegeneration = () => {
    cancelRegenerationRef.current = true;
  };

  const handleVerifyIntegrity = async () => {
    if (!user) return;
    setIsRegeneratingAll(true);
    try {
      const { data, error } = await supabase
        .from('catechism_paragraphs_read')
        .select('paragraph, read_at')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const seen = new Set<number>();
      const duplicates: number[] = [];
      data.forEach(p => {
        if (seen.has(p.paragraph)) duplicates.push(p.paragraph);
        seen.add(p.paragraph);
      });
      
      if (duplicates.length > 0) {
        toast.warning(`Detectados ${duplicates.length} conflitos. O banco de dados já os trata via unique constraint.`);
      } else {
        toast.success("Integridade verificada: Sem duplicatas.");
      }
    } catch (err) {
      toast.error("Erro ao verificar integridade.");
    } finally {
      setIsRegeneratingAll(false);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12 min-h-screen pb-24">
      <SEOHead 
        title="Histórico de Leitura do Catecismo | Cathedra" 
        description="Visualize seus últimos parágrafos lidos e continue sua formação na fé."
        path="/catechism/history"
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={goBack}
            className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all"
          >
            <Icons.ArrowDown className="w-5 h-5 rotate-90" />
          </button>
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Minha Jornada</h1>
            <p className="text-muted-foreground">Acompanhe seu progresso no Catecismo.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleVerifyIntegrity} disabled={isRegeneratingAll} className="rounded-xl border-dashed">
             <Icons.Activity className="w-4 h-4 mr-2" /> Verificar Integridade
          </Button>
          <Button onClick={continueFrom} className="h-12 px-8 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2 group">
            Continuar a partir de §{allProgress ? (Math.max(...Array.from(allProgress), 0) + 1) : 1}
            <Icons.ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>

      {/* Progress by Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Icons.Layout className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Progresso por Seção</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CIC_SECTIONS.flatMap(part => 
            part.sections.map(section => {
              const [start, end] = section.paragraphs;
              const progress = calculateSectionProgress(start, end);
              return (
                <Card key={section.id} className="p-4 space-y-3 bg-card/50 backdrop-blur-sm border-border/50">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                        {part.part} • {part.title}
                      </div>
                      <h3 className="text-sm font-bold truncate leading-tight">{section.title}</h3>
                      <div className="text-[10px] text-muted-foreground mt-1">§{start} — §{end}</div>
                    </div>
                    <div className="text-sm font-black text-primary">{progress}%</div>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* Failed Paragraphs */}
      <AnimatePresence>
        {(failedParagraphs && failedParagraphs.length > 0) && (
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
                          onClick={handleCancelRegeneration}
                          className="rounded-lg h-7 px-3 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10"
                        >
                          Cancelar
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleRegenerateSection(section.failed)}
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
                          onClick={() => regenerateMutation.mutate(p.paragraph)}
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
        )}
      </AnimatePresence>

      {/* History List */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Icons.History className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Últimos Lidos</h2>
        </div>
        {isHistoryLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="p-6 animate-pulse bg-muted/20 h-24" />
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item, index) => (
              <motion.div
                key={`${item.paragraph}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group border-border/50"
                  onClick={() => navigate(`/catechism?p=${item.paragraph}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-serif font-bold text-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      §{item.paragraph}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <Icons.History className="w-3 h-3" /> Lido há
                        </div>
                        <div 
                          className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-500/80 bg-green-500/5 px-2 py-0.5 rounded-full border border-green-500/10" 
                          title={`Sincronizado com sucesso em ${format(new Date(item.read_at), "dd/MM/yyyy HH:mm:ss")}`}
                        >
                          <Icons.Check className="w-2.5 h-2.5" /> Sincronizado {format(new Date(item.read_at), "HH:mm")}
                        </div>
                      </div>
                      <div className="text-sm font-medium truncate">
                        {formatDistanceToNow(new Date(item.read_at), { addSuffix: true, locale: ptBR })}
                      </div>
                    </div>
                    <Icons.ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
            <Icons.History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold">Nenhum histórico encontrado</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">Comece a ler o Catecismo para acompanhar seu progresso aqui.</p>
            <Button variant="default" onClick={goBack} className="mt-6">
              Começar a ler
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};

export default CatechismHistory;