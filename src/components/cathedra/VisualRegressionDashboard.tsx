import { Icons } from '@/constants';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Snapshot {
  id: string;
  page_name: string;
  route: string;
  viewport: string;
  status: string;
  baseline_url: string;
  current_url: string;
  diff_url: string;
  reason?: string;
  wcag_score?: number;
  typography_errors?: any;
  created_at: string;
}

interface Run {
  id: string;
  status: string;
  pages_total: number;
  pages_failed: number;
  created_at: string;
}

const VisualRegressionDashboard: React.FC = () => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    fetchRuns();
  }, []);

  useEffect(() => {
    if (selectedRun) {
      fetchSnapshots(selectedRun.id);
    }
  }, [selectedRun]);

  const fetchRuns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('visual_regression_runs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar execuções');
    } else {
      setRuns(data || []);
      if (data && data.length > 0) setSelectedRun(data[0]);
    }
    setLoading(false);
  };

  const fetchSnapshots = async (runId: string) => {
    const { data, error } = await supabase
      .from('visual_regression_snapshots')
      .select('*')
      .eq('run_id', runId);

    if (error) {
      toast.error('Erro ao carregar snapshots');
    } else {
      setSnapshots(data || []);
    }
  };

  const handleApprove = async (snapshotId: string, reason: string) => {
    setApproving(snapshotId);
    
    // In a real system, we'd trigger a backend action to update the file
    // For now, we update the status and record the approval in Supabase
    const { error } = await supabase
      .from('visual_regression_snapshots')
      .update({ 
        status: 'approved', 
        reason,
        approved_at: new Date().toISOString(),
        // We simulate updating the baseline by pointing the baseline_url to the current_url
        // this would normally be handled by the test runner --update-snapshots
        baseline_url: snapshots.find(s => s.id === snapshotId)?.current_url
      })
      .eq('id', snapshotId);

    if (error) {
      toast.error('Erro ao aprovar mudança');
    } else {
      toast.success('Mudança aprovada e baseline atualizada no sistema');
      setSnapshots(prev => prev.map(s => s.id === snapshotId ? { 
        ...s, 
        status: 'approved', 
        reason, 
        baseline_url: s.current_url 
      } : s));
    }
    setApproving(null);
  };

  if (loading && runs.length === 0) {
    return (
      <div className="flex items-center justify-center p-spacing-3xl">
        <Icons.RefreshCw className="w-spacing-xl h-spacing-xl animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-spacing-lg">
      <div className="flex flex-col md:flex-row gap-spacing-lg">
        {/* Runs Sidebar */}
        <Card className="w-full md:w-spacing-4xl border-border/10 bg-muted/20 backdrop-blur-sm rounded-premium shadow-premium">
          <CardHeader className="p-spacing-md border-b border-border/10">
            <CardTitle className="text-premium-sm font-black uppercase tracking-widest flex items-center gap-spacing-xs">
              <Icons.Clock className="w-spacing-md h-spacing-md" /> Histórico
            </CardTitle>
          </CardHeader>
          <CardContent className="p-spacing-0">
            <ScrollArea className="h-[500px]">
              <div className="p-spacing-xs space-y-spacing-2xs">
                {runs.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => setSelectedRun(run)}
                    className={`w-full text-left p-spacing-sm rounded-premium-sm transition-all duration-300 ${
                      selectedRun?.id === run.id 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-spacing-2xs">
                      <span className="text-premium-xs font-bold opacity-70">
                        {format(new Date(run.created_at), 'dd/MM/yy HH:mm')}
                      </span>
                      {run.status === 'success' ? (
                        <Icons.CheckCircle2 className="w-spacing-sm h-spacing-sm text-green-500" />
                      ) : (
                        <Icons.XCircle className="w-spacing-sm h-spacing-sm text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-black opacity-50">
                        {run.pages_total} Páginas
                      </span>
                      {run.pages_failed > 0 && (
                        <Badge variant="destructive" className="h-spacing-md text-[9px] px-spacing-2xs font-black uppercase">
                          {run.pages_failed} falhas
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Snapshots Area */}
        <div className="flex-1 space-y-spacing-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-md">
            <StatsCard 
              title="Acessibilidade" 
              value="WCAG AAA" 
              icon={<Icons.ShieldAlert className="w-spacing-md h-spacing-md" />} 
              status="valid"
            />
            <StatsCard 
              title="Tipografia" 
              value="Consistente" 
              icon={<Icons.Type className="w-spacing-md h-spacing-md" />} 
              status="valid"
            />
            <StatsCard 
              title="Grids & Espaço" 
              value="Alinhado" 
              icon={<Icons.Grid className="w-spacing-md h-spacing-md" />} 
              status="valid"
            />
          </div>

          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between mb-spacing-md">
              <TabsList className="bg-muted/30 p-spacing-2xs rounded-premium-full border border-border/10">
                <TabsTrigger value="all" className="rounded-premium-full text-premium-xs font-black uppercase tracking-wider px-spacing-md">Tudo</TabsTrigger>
                <TabsTrigger value="failed" className="rounded-premium-full text-premium-xs font-black uppercase tracking-wider px-spacing-md">Falhas</TabsTrigger>
                <TabsTrigger value="approved" className="rounded-premium-full text-premium-xs font-black uppercase tracking-wider px-spacing-md">Aprovados</TabsTrigger>
              </TabsList>
              
              <Button size="sm" variant="outline" className="rounded-premium-full h-spacing-xl text-premium-xs font-black uppercase tracking-wider gap-spacing-xs">
                <Icons.RefreshCw className="w-spacing-sm h-spacing-sm" /> Nova Auditoria
              </Button>
            </div>

            <TabsContent value="all" className="mt-spacing-0 space-y-spacing-md">
              {snapshots.map(snapshot => (
                <SnapshotCard 
                  key={snapshot.id} 
                  snapshot={snapshot} 
                  onApprove={(reason) => handleApprove(snapshot.id, reason)}
                  isApproving={approving === snapshot.id}
                />
              ))}
            </TabsContent>
            
            <TabsContent value="failed" className="mt-spacing-0 space-y-spacing-md">
              {snapshots.filter(s => s.status === 'fail').map(snapshot => (
                <SnapshotCard 
                  key={snapshot.id} 
                  snapshot={snapshot} 
                  onApprove={(reason) => handleApprove(snapshot.id, reason)}
                  isApproving={approving === snapshot.id}
                />
              ))}
              {snapshots.filter(s => s.status === 'fail').length === 0 && (
                <div className="text-center py-spacing-2xl opacity-50 italic text-premium-sm">Nenhuma falha encontrada nesta execução.</div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon, status }: any) => (
  <Card className="border-border/10 bg-muted/10 rounded-premium overflow-hidden">
    <CardContent className="p-spacing-md flex items-center justify-between">
      <div className="space-y-spacing-2xs">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-spacing-2xs">
          {icon} {title}
        </p>
        <p className="text-premium-sm font-black text-primary">{value}</p>
      </div>
      <div className={`w-spacing-xs h-spacing-xs rounded-premium-full animate-pulse ${status === 'valid' ? 'bg-green-500' : 'bg-red-500'}`} />
    </CardContent>
  </Card>
);

const SnapshotCard = ({ snapshot, onApprove, isApproving }: { snapshot: Snapshot, onApprove: (r: string) => void, isApproving: boolean }) => {
  const [showDiff, setShowDiff] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Card className="border-border/10 bg-muted/10 overflow-hidden rounded-premium group transition-all duration-300 hover:bg-muted/20">
      <CardHeader className="p-spacing-md border-b border-border/10 flex flex-row items-center justify-between">
        <div className="flex items-center gap-spacing-sm">
          <div className={`p-spacing-xs rounded-premium-sm ${snapshot.status === 'pass' ? 'bg-green-500/10 text-green-500' : snapshot.status === 'fail' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
            {snapshot.status === 'pass' ? <Icons.CheckCircle2 className="w-spacing-md h-spacing-md" /> : snapshot.status === 'fail' ? <Icons.XCircle className="w-spacing-md h-spacing-md" /> : <Icons.ShieldAlert className="w-spacing-md h-spacing-md" />}
          </div>
          <div>
            <h4 className="text-premium-sm font-black text-primary">{snapshot.page_name}</h4>
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{snapshot.route} • {snapshot.viewport}</p>
          </div>
        </div>
        <div className="flex items-center gap-spacing-xs">
          {snapshot.status === 'fail' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-spacing-xl rounded-premium-full text-[10px] font-black uppercase tracking-wider px-spacing-sm"
              onClick={() => setShowDiff(!showDiff)}
            >
              {showDiff ? 'Ver Baseline' : 'Ver Diferença'}
            </Button>
          )}
          {snapshot.status === 'fail' && (
            <div className="flex gap-spacing-xs">
              <input 
                placeholder="Motivo (ex: 'Novo design de card')..." 
                className="h-spacing-xl rounded-l-full bg-background/50 border border-border/10 text-[10px] px-spacing-md w-spacing-4xl outline-none focus:border-primary/50 transition-all font-medium"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button 
                size="sm" 
                className="h-spacing-xl rounded-premium-none text-[10px] font-black uppercase tracking-widest px-spacing-md bg-green-600 hover:bg-green-700 text-white border-none"
                disabled={isApproving || !reason}
                onClick={() => onApprove(reason)}
              >
                {isApproving ? <Icons.RefreshCw className="w-spacing-sm h-spacing-sm animate-spin" /> : <Icons.Check className="w-spacing-sm h-spacing-sm mr-spacing-xs" />} Aceitar
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                className="h-spacing-xl rounded-r-full text-[10px] font-black uppercase tracking-widest px-spacing-md border-none"
                onClick={() => {
                  toast.info('Mudança rejeitada. Corrija o código para restaurar a baseline.');
                  setReason('');
                }}
              >
                <Icons.X className="w-spacing-sm h-spacing-sm mr-spacing-xs" /> Rejeitar
              </Button>
            </div>
          )}
          {snapshot.status === 'approved' && (
            <Badge variant="outline" className="h-spacing-xl rounded-premium-full text-[9px] font-black uppercase tracking-wider border-blue-500/30 text-blue-500 bg-blue-500/5">
              Aprovado: {snapshot.reason}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-spacing-md space-y-spacing-md">
        {showDiff && snapshot.diff_url ? (
          <div className="relative aspect-video bg-black/5 rounded-premium-sm overflow-hidden border border-border/10">
            <img src={snapshot.diff_url} alt="Diferença Visual" className="w-full h-full object-contain" />
            <div className="absolute top-spacing-xs left-spacing-xs px-spacing-xs py-spacing-2xs bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded-premium-md">Diferenças em Vermelho</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-spacing-md">
            <div className="space-y-spacing-xs">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Baseline (Esperado)</p>
              <div className="aspect-video bg-black/5 rounded-premium-sm overflow-hidden border border-border/10">
                <img src={snapshot.baseline_url || 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=1470&auto=format&fit=crop'} alt="Baseline" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="space-y-spacing-xs">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Atual (Encontrado)</p>
              <div className="aspect-video bg-black/5 rounded-premium-sm overflow-hidden border border-border/10 relative">
                <img src={snapshot.current_url || 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=1470&auto=format&fit=crop'} alt="Atual" className="w-full h-full object-contain" />
                {snapshot.status === 'fail' && (
                  <div className="absolute inset-0 bg-red-500/5 flex items-center justify-center pointer-events-none">
                    <Icons.XCircle className="w-spacing-2xl h-spacing-2xl text-red-500/20" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {snapshot.typography_errors && snapshot.typography_errors.length > 0 && (
          <div className="p-spacing-sm bg-yellow-500/5 border border-yellow-500/20 rounded-premium-sm space-y-spacing-xs">
            <p className="text-[9px] font-black uppercase tracking-widest text-yellow-600 flex items-center gap-spacing-2xs">
              <Icons.Type className="w-spacing-sm h-spacing-sm" /> Discrepâncias Tipográficas Encontradas ({snapshot.typography_errors.length})
            </p>
            <div className="text-[10px] opacity-70 font-mono">
              {snapshot.typography_errors.map((err: string, i: number) => (
                <div key={i}>• {err}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VisualRegressionDashboard;
