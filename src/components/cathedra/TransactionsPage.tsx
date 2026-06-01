import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Icons } from '../../constants';
import { format, startOfDay, endOfDay, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';


const TransactionsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCleanupOpen, setIsCleanupOpen] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupConfirmation, setCleanupConfirmation] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [totalToExport, setTotalToExport] = useState(0);
  const [copied, setCopied] = useState(false);
  const [payloadSearch, setPayloadSearch] = useState<string>('');
  const [availablePlans, setAvailablePlans] = useState<string[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewMode, setPreviewMode] = useState<'current' | 'all'>('current');
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditPage, setAuditPage] = useState(0);
  const [hasMoreAudits, setHasMoreAudits] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditAdminFilter, setAuditAdminFilter] = useState('');
  const [auditStart, setAuditStart] = useState('');
  const [auditEnd, setAuditEnd] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const auditObserver = useRef<IntersectionObserver | null>(null);

  const isAdmin = profile?.role === 'admin';

  const fetchAvailablePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('plan_id')
        .not('plan_id', 'is', null);
      
      if (error) throw error;
      const plans = Array.from(new Set(data.map(t => t.plan_id)));
      setAvailablePlans(plans);
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const fetchAuditLogs = async (isNewSearch = false) => {
    if (!isAdmin) return;
    setAuditLoading(true);
    try {
      const currentPage = isNewSearch ? 0 : auditPage;
      let query = supabase
        .from('app_metrics')
        .select('*')
        .eq('metric_type', 'csv_export')
        .order('created_at', { ascending: false });

      if (auditAdminFilter.trim()) {
        query = query.filter('metadata->>user_email', 'ilike', `%${auditAdminFilter}%`);
      }
      if (auditStart) {
        query = query.gte('created_at', startOfDay(parseISO(auditStart)).toISOString());
      }
      if (auditEnd) {
        query = query.lte('created_at', endOfDay(parseISO(auditEnd)).toISOString());
      }

      const { data, error } = await query
        .range(currentPage * 20, (currentPage + 1) * 20 - 1);

      if (error) throw error;
      
      if (isNewSearch) {
        setAuditLogs(data || []);
        setAuditPage(1);
      } else {
        setAuditLogs(prev => [...prev, ...(data || [])]);
        setAuditPage(prev => prev + 1);
      }
      setHasMoreAudits(data && data.length === 20);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const lastAuditElementRef = useCallback((node: HTMLDivElement | null) => {
    if (auditLoading) return;
    if (auditObserver.current) auditObserver.current.disconnect();
    auditObserver.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreAudits) {
        fetchAuditLogs();
      }
    });
    if (node) auditObserver.current.observe(node);
  }, [auditLoading, hasMoreAudits]);

  useEffect(() => {
    if (isAdmin && isAuditOpen) {
      fetchAuditLogs(true);
    }
  }, [isAdmin, isAuditOpen, auditAdminFilter, auditStart, auditEnd]);

  const fetchTransactions = async () => {
    if (!user) return;

    if (startDate && endDate) {
      if (isBefore(parseISO(endDate), parseISO(startDate))) {
        setDateError('Data final não pode ser anterior à inicial');
        setLoading(false);
        return;
      }
    }
    setDateError(null);

    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select('*, profiles(name, email)', { count: 'exact' });

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      } else if (userSearch.trim()) {
        if (userSearch.includes('@')) {
          query = query.filter('profiles.email', 'ilike', `%${userSearch}%`);
        } else {
          query = query.filter('profiles.name', 'ilike', `%${userSearch}%`);
        }
      }

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (planFilter !== 'all') query = query.eq('plan_id', planFilter);
      if (startDate) query = query.gte('created_at', startOfDay(parseISO(startDate)).toISOString());
      if (endDate) query = query.lte('created_at', endOfDay(parseISO(endDate)).toISOString());

      const { data, error, count } = await query
        .order('created_at', { ascending: sortOrder === 'asc' })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;
      setTransactions(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast.error('Erro ao carregar transações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, statusFilter, planFilter, userSearch, startDate, endDate, sortOrder, page, isAdmin]);

  const logExport = async (recordsCount: number, mode: string, status: 'completed' | 'cancelled' = 'completed', customFilters?: any) => {
    if (!user) return;
    try {
      const filtersToLog = customFilters || { status: statusFilter, plan: planFilter, start: startDate, end: endDate, search: userSearch };
      await supabase.from('app_metrics').insert([{
        metric_type: 'csv_export',
        metadata: {
          user_id: user.id,
          user_email: user.email,
          mode,
          records_count: recordsCount,
          status,
          filters: filtersToLog
        }
      }]);
      if (isAuditOpen) fetchAuditLogs(true);
    } catch (err) {
      console.error('Audit log failed:', err);
    }
  };

  const executeDownload = (data: any[], mode: 'current' | 'all', customFilters?: any) => {
    const activeFilters = customFilters || { status: statusFilter, plan: planFilter, start: startDate, end: endDate, search: userSearch };
    
    const metadata = [
      `"Exportado por:","${user?.email || 'Sistema'}"`,
      `"Data da Exportação:","${format(new Date(), "yyyy-MM-dd HH:mm:ss")}"`,
      `"Filtros:","Status: ${activeFilters.status}, Plano: ${activeFilters.plan}, Início: ${activeFilters.start || 'N/A'}, Fim: ${activeFilters.end || 'N/A'}"`,
      `"Total de Registros:","${data.length}"`,
      '""' // Empty line
    ].join('\n');

    const headers = ['ID', 'Data', 'Audit_Timestamp_TZ', 'Usuário', 'E-mail', 'Descrição', 'Valor', 'Status', 'Plano', 'Cupom', 'Doação', 'ID Pagamento'];
    const tzOffset = new Date().getTimezoneOffset();
    const tzString = `UTC${tzOffset > 0 ? '-' : '+'}${Math.abs(tzOffset / 60)}`;

    const csvContent = [
      metadata,
      headers.join(','),
      ...data.map(tx => [
        tx.id,
        format(new Date(tx.created_at), "yyyy-MM-dd HH:mm:ss"),
        `${new Date(tx.created_at).toISOString()} (${tzString})`,
        tx.profiles?.name || '',
        tx.profiles?.email || '',
        tx.description || '',
        tx.amount,
        tx.status,
        tx.plan_id || '',
        tx.coupon_code || '',
        tx.is_donation ? 'Sim' : 'Não',
        tx.payment_id || ''
      ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `transacoes_${mode}_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logExport(data.length, mode, 'completed', customFilters);
    toast.success('Download iniciado!');
    setIsPreviewOpen(false);
  };

  const exportToCSV = async (mode: 'current' | 'all' = 'current', customFilters?: any) => {
    if (exporting) return;
    
    const filters = customFilters || { status: statusFilter, plan: planFilter, start: startDate, end: endDate, search: userSearch };

    if (filters.start && filters.end) {
      if (isBefore(parseISO(filters.end), parseISO(filters.start))) {
        toast.error('Filtros inválidos: Data final anterior à inicial.');
        return;
      }
    }

    if (mode === 'all' && filters.status === 'all' && filters.plan === 'all' && !filters.start && !filters.end && !filters.search?.trim()) {
      const confirmAll = window.confirm('Você está tentando exportar TODAS as transações sem nenhum filtro. Isso pode demorar e gerar um arquivo muito grande. Deseja continuar?');
      if (!confirmAll) return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setExporting(true);
    setExportProgress(0);

    try {
      let dataToExport: any[] = [];
      if (mode === 'current' && !customFilters) {
        dataToExport = transactions;
      } else {
        let allData: any[] = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        let countQuery = supabase.from('transactions').select('*', { count: 'exact', head: true });
        if (!isAdmin) countQuery = countQuery.eq('user_id', user?.id);
        if (filters.search?.trim()) {
          if (filters.search.includes('@')) countQuery = countQuery.filter('profiles.email', 'ilike', `%${filters.search}%`);
          else countQuery = countQuery.filter('profiles.name', 'ilike', `%${filters.search}%`);
        }
        if (filters.status !== 'all') countQuery = countQuery.eq('status', filters.status);
        if (filters.plan !== 'all') countQuery = countQuery.eq('plan_id', filters.plan);
        if (filters.start) countQuery = countQuery.gte('created_at', startOfDay(parseISO(filters.start)).toISOString());
        if (filters.end) countQuery = countQuery.lte('created_at', endOfDay(parseISO(filters.end)).toISOString());
        
        const { count: total } = await countQuery;
        setTotalToExport(total || 0);

        while (hasMore) {
          if (controller.signal.aborted) {
            logExport(allData.length, mode, 'cancelled', filters);
            toast.error('Exportação cancelada.');
            setExporting(false);
            return;
          }

          let q = supabase.from('transactions').select('*, profiles(name, email)');
          if (!isAdmin) q = q.eq('user_id', user?.id);
          if (filters.search?.trim()) {
            if (filters.search.includes('@')) q = q.filter('profiles.email', 'ilike', `%${filters.search}%`);
            else q = q.filter('profiles.name', 'ilike', `%${filters.search}%`);
          }
          if (filters.status !== 'all') q = q.eq('status', filters.status);
          if (filters.plan !== 'all') q = q.eq('plan_id', filters.plan);
          if (filters.start) q = q.gte('created_at', startOfDay(parseISO(filters.start)).toISOString());
          if (filters.end) q = q.lte('created_at', endOfDay(parseISO(filters.end)).toISOString());

          const { data, error } = await q.order('created_at', { ascending: sortOrder === 'asc' }).range(from, from + batchSize - 1);
          if (error) throw error;
          
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += batchSize;
            setExportProgress(allData.length);
            if (data.length < batchSize) hasMore = false;
          } else hasMore = false;
        }
        dataToExport = allData;
      }

      if (dataToExport.length === 0) {
        toast.error('Nenhuma transação encontrada.');
        setExporting(false);
        return;
      }

      setPreviewData(dataToExport);
      setPreviewMode(mode);
      setIsPreviewOpen(true);
      setExporting(false);
    } catch (err: any) {
      toast.error('Erro na exportação: ' + err.message);
      setExporting(false);
    }
  };

  const handleCleanup = async () => {
    if (cleanupConfirmation !== 'CONFIRMAR') {
      toast.error("Digite 'CONFIRMAR' para autorizar.");
      return;
    }
    setCleanupLoading(true);
    try {
      const { error } = await supabase.from('transactions').delete()
        .gte('created_at', startOfDay(parseISO(startDate)).toISOString())
        .lte('created_at', endOfDay(parseISO(endDate)).toISOString());

      if (error) throw error;
      toast.success('Registros removidos com sucesso.');
      setIsCleanupOpen(false);
      setCleanupConfirmation('');
      fetchTransactions();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setCleanupLoading(false);
    }
  };

  const filteredJSON = useMemo(() => {
    if (!selectedTx) return null;
    const fullObj = {
      webhook: selectedTx.webhook_payload,
      error: selectedTx.error_message ? (typeof selectedTx.error_message === 'string' ? JSON.parse(selectedTx.error_message) : selectedTx.error_message) : null
    };
    if (!payloadSearch.trim()) return { data: fullObj, count: 0 };
    
    let matchCount = 0;
    const term = payloadSearch.toLowerCase();

    const filterRecursive = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        if (String(obj).toLowerCase().includes(term)) { matchCount++; return obj; }
        return undefined;
      }
      if (Array.isArray(obj)) {
        const filtered = obj.map(v => filterRecursive(v)).filter(v => v !== undefined);
        return filtered.length > 0 ? filtered : undefined;
      }
      const result: any = {};
      let hasMatch = false;
      for (const key in obj) {
        if (key.toLowerCase().includes(term)) { result[key] = obj[key]; hasMatch = true; matchCount++; continue; }
        const val = filterRecursive(obj[key]);
        if (val !== undefined) { result[key] = val; hasMatch = true; }
      }
      return hasMatch ? result : undefined;
    };
    
    const filtered = filterRecursive(fullObj) || { message: "Nenhum resultado encontrado." };
    return { data: filtered, count: matchCount };
  }, [selectedTx, payloadSearch]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    const info = (s: string) => {
      switch (s) {
        case 'approved': return { label: 'Aprovado', color: 'bg-green-500/10 text-green-500', icon: <Icons.CheckCircle2 className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> };
        case 'pending': return { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-500', icon: <Icons.Clock className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> };
        case 'rejected': return { label: 'Recusado', color: 'bg-red-500/10 text-red-500', icon: <Icons.XCircle className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> };
        default: return { label: s, color: 'bg-muted text-muted-foreground', icon: <Icons.Info className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> };
      }
    };
    const { label, color, icon } = info(status);
    return <Badge className={`${color} flex items-center py-spacing-2xs font-medium border-0`}>{icon}{label}</Badge>;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-spacing-xl py-spacing-xl px-spacing-md animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-spacing-md">
        <div className="space-y-spacing-xs">
          <h1 className="text-premium-3xl font-serif font-bold tracking-tight">Histórico de Transações</h1>
          <p className="text-muted-foreground italic font-serif text-premium-sm">Controle financeiro e auditoria de pagamentos.</p>
        </div>
        
        <div className="flex items-center gap-spacing-sm">
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsAuditOpen(true)} className="rounded-premium-full gap-spacing-xs border-primary/20 hover:bg-primary/5">
                <Icons.ShieldAlert className="w-spacing-md h-spacing-md" /> Auditoria
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsCleanupOpen(true)} disabled={loading || exporting} className="rounded-premium-full gap-spacing-xs text-destructive border-destructive/20 hover:bg-destructive/5">
                <Icons.Trash2 className="w-spacing-md h-spacing-md" /> Limpar Período
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={loading || exporting} className="rounded-premium-full gap-spacing-xs border-primary/20 hover:bg-primary/5">
                {exporting ? <Icons.Clock className="w-spacing-md h-spacing-md animate-spin" /> : <Icons.Download className="w-spacing-md h-spacing-md" />}
                {exporting ? 'Exportando...' : 'Exportar CSV'}
                <Icons.ChevronDown className="w-spacing-sm h-spacing-sm opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-premium-full">
              <DropdownMenuItem onClick={() => exportToCSV('current')}>Exportar Página Atual</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV('all')}>Exportar Tudo (Filtrado)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {exporting && totalToExport > 0 && (
        <Card className="bg-primary/5 border-primary/10 rounded-premium p-spacing-lg space-y-spacing-sm">
          <div className="flex justify-between items-end">
            <div className="space-y-spacing-2xs">
              <p className="text-premium-xs font-bold uppercase tracking-widest text-primary">Buscando registros...</p>
              <p className="text-premium-xs text-muted-foreground italic">{exportProgress} de {totalToExport} transações carregadas.</p>
            </div>
            <div className="flex items-center gap-spacing-md">
              <Button variant="ghost" size="sm" onClick={() => abortController?.abort()} className="h-spacing-xl text-premium-xs text-destructive hover:bg-destructive/10">Cancelar Exportação</Button>
              <p className="text-premium-xl font-bold text-primary">{Math.round((exportProgress / totalToExport) * 100)}%</p>
            </div>
          </div>
          <Progress value={(exportProgress / totalToExport) * 100} className="h-spacing-2xs" />
        </Card>
      )}

      <Card className="rounded-[2.5rem] border-border/50 shadow-premium-hover overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 p-spacing-xl">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-spacing-md items-end">
            {isAdmin && (
              <div className="space-y-spacing-2xs">
                <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Usuário</label>
                <Input placeholder="Nome/Email" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} disabled={loading || exporting} className="rounded-premium-full h-spacing-xl bg-background/50" />
              </div>
            )}
            <div className="space-y-spacing-2xs">
              <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading || exporting}>
                <SelectTrigger className="rounded-premium-full h-spacing-xl bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-premium-full">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="rejected">Recusados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-spacing-2xs">
              <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Plano</label>
              <Select value={planFilter} onValueChange={setPlanFilter} disabled={loading || exporting}>
                <SelectTrigger className="rounded-premium-full h-spacing-xl bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-premium-full">
                  <SelectItem value="all">Todos</SelectItem>
                  {availablePlans.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-spacing-2xs">
              <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Início</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={loading || exporting} className="rounded-premium-full h-spacing-xl bg-background/50" />
            </div>
            <div className="space-y-spacing-2xs">
              <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Fim</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={loading || exporting} className="rounded-premium-full h-spacing-xl bg-background/50" />
            </div>
            <div className="space-y-spacing-2xs">
              <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Ordem</label>
              <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)} disabled={loading || exporting}>
                <SelectTrigger className="rounded-premium-full h-spacing-xl bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-premium-full"><SelectItem value="desc">Recentes</SelectItem><SelectItem value="asc">Antigos</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          {dateError && <p className="text-premium-xs text-destructive mt-spacing-sm font-bold">{dateError}</p>}
        </CardHeader>
        <CardContent className="p-spacing-0">
          <Table>
            <TableHeader className="bg-muted/50"><TableRow>
              <TableHead className="py-spacing-md px-spacing-xl">Data</TableHead>
              {isAdmin && <TableHead>Usuário</TableHead>}
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right px-spacing-xl">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} className="h-spacing-4xl text-center italic font-serif text-muted-foreground">Consultando pergaminhos...</TableCell></TableRow> :
               transactions.length === 0 ? <TableRow><TableCell colSpan={6} className="h-spacing-4xl text-center">
                 <div className="flex flex-col items-center gap-spacing-sm">
                   <Icons.Search className="w-spacing-xl h-spacing-xl text-muted/30" />
                   <p className="font-serif italic text-muted-foreground">Nenhum registro encontrado.</p>
                   <Button variant="ghost" size="sm" className="text-premium-xs uppercase font-bold" onClick={() => { setStatusFilter('all'); setPlanFilter('all'); setUserSearch(''); setStartDate(''); setEndDate(''); }}>Limpar Filtros</Button>
                 </div>
               </TableCell></TableRow> :
               transactions.map(tx => (
                 <TableRow key={tx.id} className="group hover:bg-primary/5 transition-colors">
                   <TableCell className="py-spacing-md px-spacing-xl flex flex-col">
                     <span className="font-bold text-premium-sm">{format(new Date(tx.created_at), "dd 'de' MMM", { locale: ptBR })}</span>
                     <span className="text-premium-xs text-muted-foreground">{format(new Date(tx.created_at), "HH:mm:ss")}</span>
                   </TableCell>
                   {isAdmin && <TableCell className="max-w-[150px] truncate"><div className="flex flex-col"><span className="font-bold text-premium-xs">{tx.profiles?.name || '---'}</span><span className="text-premium-xs text-muted-foreground">{tx.profiles?.email}</span></div></TableCell>}
                   <TableCell className="font-serif italic text-premium-sm">{tx.description}</TableCell>
                   <TableCell className="text-right font-bold text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}</TableCell>
                   <TableCell className="text-center flex justify-center py-spacing-md">{getStatusBadge(tx.status)}</TableCell>
                   <TableCell className="text-right px-spacing-xl"><Button variant="ghost" size="sm" onClick={() => { setSelectedTx(tx); setPayloadSearch(''); setIsDetailsOpen(true); }}><Icons.Info className="w-spacing-md h-spacing-md" /></Button></TableCell>
                 </TableRow>
               ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-spacing-lg mt-spacing-md">
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="rounded-premium-full px-spacing-lg shadow-premium-md">Anterior</Button>
        <span className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Página {page} de {Math.ceil(totalCount / pageSize) || 1}</span>
        <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= totalCount || loading} className="rounded-premium-full px-spacing-lg shadow-premium-md">Próxima</Button>
      </div>

      {/* CSV PREVIEW DIALOG */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-spacing-3xl rounded-[2.5rem] bg-background ">
          <DialogHeader><DialogTitle className="text-premium-2xl font-serif font-bold">Preview da Exportação</DialogTitle><DialogDescription>Confira os dados antes de baixar o arquivo CSV.</DialogDescription></DialogHeader>
          <div className="py-spacing-md overflow-x-auto"><Table className="border rounded-premium-full">
            <TableHeader className="bg-muted/50"><TableRow>
              <TableHead className="text-premium-xs font-bold">Data</TableHead>
              <TableHead className="text-premium-xs font-bold">Audit_TZ</TableHead>
              <TableHead className="text-premium-xs font-bold">E-mail</TableHead>
              <TableHead className="text-premium-xs font-bold text-right">Valor</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {previewData.slice(0, 5).map(tx => (
                <TableRow key={tx.id}>
                  <TableCell className="text-premium-xs">{format(new Date(tx.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell className="text-premium-xs font-mono">{new Date(tx.created_at).toISOString().split('T')[1].substring(0, 8)}</TableCell>
                  <TableCell className="text-premium-xs truncate max-w-[120px]">{tx.profiles?.email}</TableCell>
                  <TableCell className="text-premium-xs text-right font-bold">{tx.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
          <p className="text-premium-xs text-muted-foreground text-center">Mostrando as 5 primeiras de {previewData.length} transações.</p>
          <DialogFooter className="gap-spacing-sm">
            <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="rounded-premium-full">Cancelar</Button>
            <Button onClick={() => executeDownload(previewData, previewMode)} className="rounded-premium-full bg-primary flex-1 font-bold">Confirmar e Baixar CSV</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CLEANUP DIALOG */}
      <Dialog open={isCleanupOpen} onOpenChange={setIsCleanupOpen}>
        <DialogContent className="max-w-spacing-md rounded-[2.5rem] bg-background ">
          <DialogHeader><DialogTitle className="text-premium-2xl font-serif font-bold text-destructive">Limpar Registros</DialogTitle><DialogDescription>Ação irreversível de exclusão de dados.</DialogDescription></DialogHeader>
          <div className="py-spacing-md space-y-spacing-md">
            <div className="p-spacing-md bg-destructive/5 rounded-premium border border-destructive/10 text-premium-xs text-destructive font-bold">Cuidado! Você apagará as transações de {startDate || '---'} até {endDate || '---'}.</div>
            <div className="space-y-spacing-xs">
              <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Digite 'CONFIRMAR' para liberar</label>
              <Input value={cleanupConfirmation} onChange={(e) => setCleanupConfirmation(e.target.value)} placeholder="CONFIRMAR" className="rounded-premium-full border-destructive/30" />
            </div>
          </div>
          <DialogFooter className="gap-spacing-sm">
            <Button variant="ghost" onClick={() => setIsCleanupOpen(false)} className="rounded-premium-full">Cancelar</Button>
            <Button onClick={handleCleanup} disabled={cleanupLoading || cleanupConfirmation !== 'CONFIRMAR'} className="rounded-premium-full bg-destructive hover:bg-destructive/90 flex-1 font-bold">Excluir Permanentemente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAILS DIALOG */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-spacing-2xl rounded-[2.5rem] bg-background ">
          <DialogHeader><DialogTitle className="text-premium-2xl font-serif font-bold">Detalhes do Processamento</DialogTitle></DialogHeader>
          {selectedTx && !Array.isArray(selectedTx) && (
            <div className="space-y-spacing-lg py-spacing-md">
              <div className="grid grid-cols-2 gap-spacing-md">
                <div className="space-y-spacing-2xs"><p className="text-premium-xs font-bold text-muted-foreground uppercase">ID Interno</p><p className="text-premium-xs font-mono bg-muted p-spacing-xs rounded-premium-full truncate">{selectedTx.id}</p></div>
                <div className="space-y-spacing-2xs"><p className="text-premium-xs font-bold text-muted-foreground uppercase">ID Pagamento (MP)</p><p className="text-premium-xs font-mono bg-muted p-spacing-xs rounded-premium-full truncate">{selectedTx.payment_id || 'N/A'}</p></div>
              </div>
              <div className="space-y-spacing-md">
                <div className="flex justify-between items-center"><p className="text-premium-xs font-bold uppercase text-muted-foreground">Webhook Payload & Logs</p><div className="flex gap-spacing-xs items-center">
                  <div className="relative"><Icons.Search className="absolute left-spacing-xs top-spacing-2xs/2 -translate-y-1/2 w-spacing-sm h-spacing-sm text-muted-foreground" /><Input placeholder="Buscar no JSON..." value={payloadSearch} onChange={(e) => setPayloadSearch(e.target.value)} className="h-spacing-lg text-premium-xs pl-spacing-lg w-spacing-4xl rounded-premium-full" /></div>
                  <Badge variant="outline" className="text-premium-xs font-bold">{filteredJSON?.count} matches</Badge>
                  <Button variant="ghost" size="sm" className="h-spacing-lg text-premium-xs" onClick={() => copyToClipboard(JSON.stringify(selectedTx.webhook_payload, null, 2))}>{copied ? <Icons.Check className="w-spacing-sm h-spacing-sm text-green-500" /> : <Icons.Copy className="w-spacing-sm h-spacing-sm" />}</Button>
                </div></div>
                <div className="max-h-spacing-4xl overflow-y-auto bg-slate-950 p-spacing-lg rounded-premium border border-white/5 custom-scrollbar"><pre className="text-premium-small text-slate-300 font-mono whitespace-pre-wrap">{JSON.stringify(filteredJSON?.data, null, 2)}</pre></div>
              </div>
            </div>
          )}
          <Button onClick={() => setIsDetailsOpen(false)} className="rounded-premium-full w-full font-bold h-spacing-2xl">Fechar Detalhes</Button>
        </DialogContent>
      </Dialog>

      {/* AUDIT LOGS DIALOG */}
      <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
        <DialogContent className="max-w-spacing-4xl rounded-[2.5rem] bg-background  max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-premium-2xl font-serif font-bold flex items-center gap-spacing-sm">
              <div className="p-spacing-xs bg-primary/10 rounded-premium text-primary"><Icons.ShieldAlert className="w-spacing-lg h-spacing-lg" /></div>
              Histórico de Exportações
            </DialogTitle>
            <DialogDescription>Rastreabilidade de todos os arquivos CSV gerados por administradores.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-md my-spacing-lg">
            <div className="space-y-spacing-2xs">
              <label className="text-premium-xs font-bold uppercase text-muted-foreground">Admin</label>
              <Input placeholder="E-mail" value={auditAdminFilter} onChange={(e) => setAuditAdminFilter(e.target.value)} className="h-spacing-xl rounded-premium-full text-premium-xs" />
            </div>
            <div className="space-y-spacing-2xs">
              <label className="text-premium-xs font-bold uppercase text-muted-foreground">Início</label>
              <Input type="date" value={auditStart} onChange={(e) => setAuditStart(e.target.value)} className="h-spacing-xl rounded-premium-full text-premium-xs" />
            </div>
            <div className="space-y-spacing-2xs">
              <label className="text-premium-xs font-bold uppercase text-muted-foreground">Fim</label>
              <Input type="date" value={auditEnd} onChange={(e) => setAuditEnd(e.target.value)} className="h-spacing-xl rounded-premium-full text-premium-xs" />
            </div>
          </div>

          <div className="py-spacing-xs">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-premium-xs font-bold">Data</TableHead>
                  <TableHead className="text-premium-xs font-bold">Admin/Status</TableHead>
                  <TableHead className="text-premium-xs font-bold">Registros</TableHead>
                  <TableHead className="text-premium-xs font-bold">Filtros Aplicados</TableHead>
                  <TableHead className="text-right text-premium-xs font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.length === 0 && !auditLoading ? (
                  <TableRow><TableCell colSpan={5} className="h-spacing-4xl text-center italic text-muted-foreground">Nenhum log de exportação encontrado.</TableCell></TableRow>
                ) : (
                  auditLogs.map((log: any) => (
                    <TableRow key={log.id} className="group">
                      <TableCell className="text-premium-xs font-medium">{format(new Date(log.created_at), "dd/MM HH:mm")}</TableCell>
                      <TableCell className="text-premium-xs">
                        <div className="flex flex-col">
                          <span>{log.metadata?.user_email || '---'}</span>
                          <span className={`text-premium-xs font-bold uppercase ${log.metadata?.status === 'cancelled' ? 'text-destructive' : 'text-green-500'}`}>
                            {log.metadata?.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-premium-xs font-bold text-primary">{log.metadata?.records_count}</TableCell>
                      <TableCell className="text-premium-xs max-w-[200px] truncate italic text-muted-foreground">
                        {Object.entries(log.metadata?.filters || {}).map(([k, v]) => v !== 'all' && v ? `${k}:${v}` : null).filter(Boolean).join(', ') || 'Sem filtros'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-spacing-2xs">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-spacing-lg text-premium-xs rounded-premium-full"
                            title="Baixar CSV diretamente"
                            onClick={() => {
                              setIsAuditOpen(false);
                              toast.success('Iniciando download direto...');
                              exportToCSV(log.metadata?.mode || 'all', log.metadata?.filters);
                            }}
                          >
                            <Icons.Download className="w-spacing-sm h-spacing-sm" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-spacing-lg text-premium-xs rounded-premium-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Ver no painel principal"
                            onClick={() => {
                              const f = log.metadata?.filters;
                              setStatusFilter(f.status || 'all');
                              setPlanFilter(f.plan || 'all');
                              setStartDate(f.start || '');
                              setEndDate(f.end || '');
                              setUserSearch(f.search || '');
                              setIsAuditOpen(false);
                              toast.success('Filtros aplicados.');
                            }}
                          >
                            <Icons.RotateCcw className="w-spacing-sm h-spacing-sm" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {auditLoading && <TableRow><TableCell colSpan={5} className="h-spacing-3xl text-center italic text-premium-xs">Carregando...</TableCell></TableRow>}
              </TableBody>
            </Table>

            {hasMoreAudits && (
              <div ref={lastAuditElementRef} className="h-spacing-xl flex items-center justify-center">
                {auditLoading && <Icons.Clock className="w-spacing-md h-spacing-md animate-spin text-muted-foreground" />}
              </div>
            )}
          </div>
          <Button onClick={() => setIsAuditOpen(false)} variant="outline" className="rounded-premium-full w-full font-bold h-spacing-2xl mt-spacing-md">Fechar Auditoria</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionsPage;