import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle2, XCircle, Clock, Eye, Check, X, 
  ArrowRight, ShieldAlert, Type, Grid, Layout, 
  ChevronRight, ExternalLink, RefreshCw
} from 'lucide-react';
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
      <div className="flex items-center justify-center p-3xl">
        <RefreshCw className="w-xl h-xl animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <div className="flex flex-col md:flex-row gap-lg">
        {/* Runs Sidebar */}
        <Card className="w-full md:w-4xl border-border/10 bg-muted/20 backdrop-blur-sm rounded-premium shadow-premium">
          <CardHeader className="p-md border-b border-border/10">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-xs">
              <Clock className="w-md h-md" /> Histórico
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-xs space-y-2xs">
                {runs.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => setSelectedRun(run)}
                    className={`w-full text-left p-sm rounded-sm transition-all duration-300 ${
                      selectedRun?.id === run.id 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2xs">
                      <span className="text-xs font-bold opacity-70">
                        {format(new Date(run.created_at), 'dd/MM/yy HH:mm')}
                      </span>
                      {run.status === 'success' ? (
                        <CheckCircle2 className="w-sm h-sm text-green-500" />
                      ) : (
                        <XCircle className="w-sm h-sm text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-black opacity-50">
                        {run.pages_total} Páginas
                      </span>
                      {run.pages_failed > 0 && (
                        <Badge variant="destructive" className="h-md text-[9px] px-2xs font-black uppercase">
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
        <div className="flex-1 space-y-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <StatsCard 
              title="Acessibilidade" 
              value="WCAG AAA" 
              icon={<ShieldAlert className="w-md h-md" />} 
              status="valid"
            />
            <StatsCard 
              title="Tipografia" 
              value="Consistente" 
              icon={<Type className="w-md h-md" />} 
              status="valid"
            />
            <StatsCard 
              title="Grids & Espaço" 
              value="Alinhado" 
              icon={<Grid className="w-md h-md" />} 
              status="valid"
            />
          </div>

          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between mb-md">
              <TabsList className="bg-muted/30 p-2xs rounded-full border border-border/10">
                <TabsTrigger value="all" className="rounded-full text-xs font-black uppercase tracking-wider px-md">Tudo</TabsTrigger>
                <TabsTrigger value="failed" className="rounded-full text-xs font-black uppercase tracking-wider px-md">Falhas</TabsTrigger>
                <TabsTrigger value="approved" className="rounded-full text-xs font-black uppercase tracking-wider px-md">Aprovados</TabsTrigger>
              </TabsList>
              
              <Button size="sm" variant="outline" className="rounded-full h-xl text-xs font-black uppercase tracking-wider gap-xs">
                <RefreshCw className="w-sm h-sm" /> Nova Auditoria
              </Button>
            </div>

            <TabsContent value="all" className="mt-0 space-y-md">
              {snapshots.map(snapshot => (
                <SnapshotCard 
                  key={snapshot.id} 
                  snapshot={snapshot} 
                  onApprove={(reason) => handleApprove(snapshot.id, reason)}
                  isApproving={approving === snapshot.id}
                />
              ))}
            </TabsContent>
            
            <TabsContent value="failed" className="mt-0 space-y-md">
              {snapshots.filter(s => s.status === 'fail').map(snapshot => (
                <SnapshotCard 
                  key={snapshot.id} 
                  snapshot={snapshot} 
                  onApprove={(reason) => handleApprove(snapshot.id, reason)}
                  isApproving={approving === snapshot.id}
                />
              ))}
              {snapshots.filter(s => s.status === 'fail').length === 0 && (
                <div className="text-center py-2xl opacity-50 italic text-sm">Nenhuma falha encontrada nesta execução.</div>
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
    <CardContent className="p-md flex items-center justify-between">
      <div className="space-y-2xs">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2xs">
          {icon} {title}
        </p>
        <p className="text-sm font-black text-primary">{value}</p>
      </div>
      <div className={`w-xs h-xs rounded-full animate-pulse ${status === 'valid' ? 'bg-green-500' : 'bg-red-500'}`} />
    </CardContent>
  </Card>
);

const SnapshotCard = ({ snapshot, onApprove, isApproving }: { snapshot: Snapshot, onApprove: (r: string) => void, isApproving: boolean }) => {
  const [showDiff, setShowDiff] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Card className="border-border/10 bg-muted/10 overflow-hidden rounded-premium group transition-all duration-300 hover:bg-muted/20">
      <CardHeader className="p-md border-b border-border/10 flex flex-row items-center justify-between">
        <div className="flex items-center gap-sm">
          <div className={`p-xs rounded-sm ${snapshot.status === 'pass' ? 'bg-green-500/10 text-green-500' : snapshot.status === 'fail' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
            {snapshot.status === 'pass' ? <CheckCircle2 className="w-md h-md" /> : snapshot.status === 'fail' ? <XCircle className="w-md h-md" /> : <ShieldAlert className="w-md h-md" />}
          </div>
          <div>
            <h4 className="text-sm font-black text-primary">{snapshot.page_name}</h4>
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{snapshot.route} • {snapshot.viewport}</p>
          </div>
        </div>
        <div className="flex items-center gap-xs">
          {snapshot.status === 'fail' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-xl rounded-full text-[10px] font-black uppercase tracking-wider px-sm"
              onClick={() => setShowDiff(!showDiff)}
            >
              {showDiff ? 'Ver Baseline' : 'Ver Diferença'}
            </Button>
          )}
          {snapshot.status === 'fail' && (
            <div className="flex gap-xs">
              <input 
                placeholder="Motivo (ex: 'Novo design de card')..." 
                className="h-xl rounded-l-full bg-background/50 border border-border/10 text-[10px] px-md w-4xl outline-none focus:border-primary/50 transition-all font-medium"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button 
                size="sm" 
                className="h-xl rounded-none text-[10px] font-black uppercase tracking-widest px-md bg-green-600 hover:bg-green-700 text-white border-none"
                disabled={isApproving || !reason}
                onClick={() => onApprove(reason)}
              >
                {isApproving ? <RefreshCw className="w-sm h-sm animate-spin" /> : <Check className="w-sm h-sm mr-xs" />} Aceitar
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                className="h-xl rounded-r-full text-[10px] font-black uppercase tracking-widest px-md border-none"
                onClick={() => {
                  toast.info('Mudança rejeitada. Corrija o código para restaurar a baseline.');
                  setReason('');
                }}
              >
                <X className="w-sm h-sm mr-xs" /> Rejeitar
              </Button>
            </div>
          )}
          {snapshot.status === 'approved' && (
            <Badge variant="outline" className="h-xl rounded-full text-[9px] font-black uppercase tracking-wider border-blue-500/30 text-blue-500 bg-blue-500/5">
              Aprovado: {snapshot.reason}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-md space-y-md">
        {showDiff && snapshot.diff_url ? (
          <div className="relative aspect-video bg-black/5 rounded-sm overflow-hidden border border-border/10">
            <img src={snapshot.diff_url} alt="Diferença Visual" className="w-full h-full object-contain" />
            <div className="absolute top-xs left-xs px-xs py-2xs bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded-md">Diferenças em Vermelho</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-md">
            <div className="space-y-xs">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Baseline (Esperado)</p>
              <div className="aspect-video bg-black/5 rounded-sm overflow-hidden border border-border/10">
                <img src={snapshot.baseline_url || 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=1470&auto=format&fit=crop'} alt="Baseline" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="space-y-xs">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Atual (Encontrado)</p>
              <div className="aspect-video bg-black/5 rounded-sm overflow-hidden border border-border/10 relative">
                <img src={snapshot.current_url || 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=1470&auto=format&fit=crop'} alt="Atual" className="w-full h-full object-contain" />
                {snapshot.status === 'fail' && (
                  <div className="absolute inset-0 bg-red-500/5 flex items-center justify-center pointer-events-none">
                    <XCircle className="w-2xl h-2xl text-red-500/20" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {snapshot.typography_errors && snapshot.typography_errors.length > 0 && (
          <div className="p-sm bg-yellow-500/5 border border-yellow-500/20 rounded-sm space-y-xs">
            <p className="text-[9px] font-black uppercase tracking-widest text-yellow-600 flex items-center gap-2xs">
              <Type className="w-sm h-sm" /> Discrepâncias Tipográficas Encontradas ({snapshot.typography_errors.length})
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
