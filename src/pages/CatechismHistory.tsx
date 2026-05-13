import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/constants';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import SectionProgress from '@/components/cathedra/history/SectionProgress';
import FailedParagraphsSection, { RegenerationStatus } from '@/components/cathedra/history/FailedParagraphsSection';
import HistoryList from '@/components/cathedra/history/HistoryList';

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
    refetchInterval: isRegeneratingAll ? 3000 : false,
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
        <SectionProgress allProgress={allProgress} />
      </section>

      {/* Failed Paragraphs */}
      <FailedParagraphsSection 
        failedParagraphs={failedParagraphs}
        regenerationStatus={regenerationStatus}
        isRegeneratingAll={isRegeneratingAll}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterSection={filterSection}
        setFilterSection={setFilterSection}
        filterError={filterError}
        setFilterError={setFilterError}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onRegenerateSection={handleRegenerateSection}
        onRegenerateSingle={(p) => regenerateMutation.mutate(p)}
        onCancelRegeneration={handleCancelRegeneration}
      />

      {/* History List */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Icons.History className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Últimos Lidos</h2>
        </div>
        <HistoryList 
          history={history} 
          isLoading={isHistoryLoading} 
          onNavigateToCatechism={goBack} 
        />
      </section>
    </div>
  );
};

export default CatechismHistory;
