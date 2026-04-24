import React, { useState, useEffect, useMemo } from 'react';
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
import { Download, Filter, Search, Calendar as CalendarIcon, ArrowUpDown, Info, CheckCircle2, Clock, AlertCircle, XCircle, RotateCcw, ShieldAlert, Copy, Check, ChevronDown, Trash2, Eye } from 'lucide-react';

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
  const [abortController, setAbortController] = useState<AbortController | null>(null);

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

  const fetchAuditLogs = async () => {
    if (!isAdmin) return;
    try {
      const { data, error } = await supabase
        .from('app_metrics')
        .select('*')
        .eq('metric_type', 'csv_export')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setAuditLogs(data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  useEffect(() => {
    fetchAvailablePlans();
    if (isAdmin) fetchAuditLogs();
  }, [isAdmin]);

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

  const logExport = async (recordsCount: number, mode: string) => {
    if (!user) return;
    try {
      await supabase.from('app_metrics').insert([{
        metric_type: 'csv_export',
        metadata: {
          user_id: user.id,
          user_email: user.email,
          mode,
          records_count: recordsCount,
          filters: { status: statusFilter, plan: planFilter, start: startDate, end: endDate, search: userSearch }
        }
      }]);
    } catch (err) {
      console.error('Audit log failed:', err);
    }
  };

  const executeDownload = (data: any[], mode: 'current' | 'all') => {
    const metadata = [
      `"Exportado por:","${user?.email || 'Sistema'}"`,
      `"Data da Exportação:","${format(new Date(), "yyyy-MM-dd HH:mm:ss")}"`,
      `"Filtros:","Status: ${statusFilter}, Plano: ${planFilter}, Início: ${startDate || 'N/A'}, Fim: ${endDate || 'N/A'}"`,
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
    
    logExport(data.length, mode);
    toast.success('Download iniciado!');
    setIsPreviewOpen(false);
  };

  const exportToCSV = async (mode: 'current' | 'all' = 'current') => {
    if (exporting) return;
    
    if (mode === 'all' && statusFilter === 'all' && planFilter === 'all' && !startDate && !endDate && !userSearch.trim()) {
      const confirmAll = window.confirm('Você está tentando exportar TODAS as transações sem nenhum filtro. Isso pode demorar e gerar um arquivo muito grande. Deseja continuar?');
      if (!confirmAll) return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setExporting(true);
    setExportProgress(0);

    try {
      let dataToExport: any[] = [];
      if (mode === 'current') {
        dataToExport = transactions;
      } else {
        let allData: any[] = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        let countQuery = supabase.from('transactions').select('*', { count: 'exact', head: true });
        if (!isAdmin) countQuery = countQuery.eq('user_id', user?.id);
        if (userSearch.trim()) {
          if (userSearch.includes('@')) countQuery = countQuery.filter('profiles.email', 'ilike', `%${userSearch}%`);
          else countQuery = countQuery.filter('profiles.name', 'ilike', `%${userSearch}%`);
        }
        if (statusFilter !== 'all') countQuery = countQuery.eq('status', statusFilter);
        if (planFilter !== 'all') countQuery = countQuery.eq('plan_id', planFilter);
        if (startDate) countQuery = countQuery.gte('created_at', startOfDay(parseISO(startDate)).toISOString());
        if (endDate) countQuery = countQuery.lte('created_at', endOfDay(parseISO(endDate)).toISOString());
        
        const { count: total } = await countQuery;
        setTotalToExport(total || 0);

        while (hasMore) {
          if (controller.signal.aborted) {
            toast.error('Exportação cancelada.');
            setExporting(false);
            return;
          }

          let q = supabase.from('transactions').select('*, profiles(name, email)');
          if (!isAdmin) q = q.eq('user_id', user?.id);
          if (userSearch.trim()) {
            if (userSearch.includes('@')) q = q.filter('profiles.email', 'ilike', `%${userSearch}%`);
            else q = q.filter('profiles.name', 'ilike', `%${userSearch}%`);
          }
          if (statusFilter !== 'all') q = q.eq('status', statusFilter);
          if (planFilter !== 'all') q = q.eq('plan_id', planFilter);
          if (startDate) q = q.gte('created_at', startOfDay(parseISO(startDate)).toISOString());
          if (endDate) q = q.lte('created_at', endOfDay(parseISO(endDate)).toISOString());

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
        case 'approved': return { label: 'Aprovado', color: 'bg-green-500/10 text-green-500', icon: <CheckCircle2 className="w-3 h-3 mr-1" /> };
        case 'pending': return { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-500', icon: <Clock className="w-3 h-3 mr-1" /> };
        case 'rejected': return { label: 'Recusado', color: 'bg-red-500/10 text-red-500', icon: <XCircle className="w-3 h-3 mr-1" /> };
        default: return { label: s, color: 'bg-muted text-muted-foreground', icon: <Info className="w-3 h-3 mr-1" /> };
      }
    };
    const { label, color, icon } = info(status);
    return <Badge className={`${color} flex items-center py-1 font-medium border-0`}>{icon}{label}</Badge>;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-serif font-bold tracking-tight">Histórico de Transações</h1>
          <p className="text-muted-foreground italic font-serif text-sm">Controle financeiro e auditoria de pagamentos.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setIsCleanupOpen(true)} disabled={loading || exporting} className="rounded-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/5">
              <Trash2 className="w-4 h-4" /> Limpar Período
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={loading || exporting} className="rounded-full gap-2 border-primary/20 hover:bg-primary/5">
                {exporting ? <Clock className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exporting ? 'Carregando...' : 'Exportar CSV'}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => exportToCSV('current')}>Exportar Página Atual</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV('all')}>Exportar Tudo (Filtrado)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {exporting && totalToExport > 0 && (
        <Card className="bg-primary/5 border-primary/10 rounded-2xl p-6 space-y-3">
          <div className="flex justify-between items-end">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Buscando registros...</p>
            <p className="text-xl font-bold text-primary">{Math.round((exportProgress / totalToExport) * 100)}%</p>
          </div>
          <Progress value={(exportProgress / totalToExport) * 100} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground italic">{exportProgress} de {totalToExport} transações carregadas.</p>
        </Card>
      )}

      <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 p-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            {isAdmin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Usuário</label>
                <Input placeholder="Nome/Email" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} disabled={loading || exporting} className="rounded-xl h-10 bg-background/50" />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading || exporting}>
                <SelectTrigger className="rounded-xl h-10 bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="rejected">Recusados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Plano</label>
              <Select value={planFilter} onValueChange={setPlanFilter} disabled={loading || exporting}>
                <SelectTrigger className="rounded-xl h-10 bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todos</SelectItem>
                  {availablePlans.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Início</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={loading || exporting} className="rounded-xl h-10 bg-background/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fim</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={loading || exporting} className="rounded-xl h-10 bg-background/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ordem</label>
              <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)} disabled={loading || exporting}>
                <SelectTrigger className="rounded-xl h-10 bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl"><SelectItem value="desc">Recentes</SelectItem><SelectItem value="asc">Antigos</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          {dateError && <p className="text-[10px] text-destructive mt-3 font-bold">{dateError}</p>}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50"><TableRow>
              <TableHead className="py-5 px-8">Data</TableHead>
              {isAdmin && <TableHead>Usuário</TableHead>}
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right px-8">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} className="h-64 text-center italic font-serif text-muted-foreground">Consultando pergaminhos...</TableCell></TableRow> :
               transactions.length === 0 ? <TableRow><TableCell colSpan={6} className="h-64 text-center">
                 <div className="flex flex-col items-center gap-3">
                   <Search className="w-10 h-10 text-muted/30" />
                   <p className="font-serif italic text-muted-foreground">Nenhum registro encontrado.</p>
                   <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold" onClick={() => { setStatusFilter('all'); setPlanFilter('all'); setUserSearch(''); setStartDate(''); setEndDate(''); }}>Limpar Filtros</Button>
                 </div>
               </TableCell></TableRow> :
               transactions.map(tx => (
                 <TableRow key={tx.id} className="group hover:bg-primary/5 transition-colors">
                   <TableCell className="py-5 px-8 flex flex-col">
                     <span className="font-bold text-sm">{format(new Date(tx.created_at), "dd 'de' MMM", { locale: ptBR })}</span>
                     <span className="text-[10px] text-muted-foreground">{format(new Date(tx.created_at), "HH:mm:ss")}</span>
                   </TableCell>
                   {isAdmin && <TableCell className="max-w-[150px] truncate"><div className="flex flex-col"><span className="font-bold text-xs">{tx.profiles?.name || '---'}</span><span className="text-[10px] text-muted-foreground">{tx.profiles?.email}</span></div></TableCell>}
                   <TableCell className="font-serif italic text-sm">{tx.description}</TableCell>
                   <TableCell className="text-right font-bold text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}</TableCell>
                   <TableCell className="text-center flex justify-center py-5">{getStatusBadge(tx.status)}</TableCell>
                   <TableCell className="text-right px-8"><Button variant="ghost" size="sm" onClick={() => { setSelectedTx(tx); setPayloadSearch(''); setIsDetailsOpen(true); }}><Info className="w-4 h-4" /></Button></TableCell>
                 </TableRow>
               ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-6 mt-4">
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="rounded-full px-6 shadow-sm">Anterior</Button>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Página {page} de {Math.ceil(totalCount / pageSize) || 1}</span>
        <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= totalCount || loading} className="rounded-full px-6 shadow-sm">Próxima</Button>
      </div>

      {/* CSV PREVIEW DIALOG */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] bg-background/95 backdrop-blur-xl">
          <DialogHeader><DialogTitle className="text-2xl font-serif font-bold">Preview da Exportação</DialogTitle><DialogDescription>Confira os dados antes de baixar o arquivo CSV.</DialogDescription></DialogHeader>
          <div className="py-4 overflow-x-auto"><Table className="border rounded-xl">
            <TableHeader className="bg-muted/50"><TableRow>
              <TableHead className="text-[10px] font-bold">Data</TableHead>
              <TableHead className="text-[10px] font-bold">Audit_TZ</TableHead>
              <TableHead className="text-[10px] font-bold">E-mail</TableHead>
              <TableHead className="text-[10px] font-bold text-right">Valor</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {previewData.slice(0, 5).map(tx => (
                <TableRow key={tx.id}>
                  <TableCell className="text-[10px]">{format(new Date(tx.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell className="text-[10px] font-mono">{new Date(tx.created_at).toISOString().split('T')[1].substring(0, 8)}</TableCell>
                  <TableCell className="text-[10px] truncate max-w-[120px]">{tx.profiles?.email}</TableCell>
                  <TableCell className="text-[10px] text-right font-bold">{tx.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
          <p className="text-[10px] text-muted-foreground text-center">Mostrando as 5 primeiras de {previewData.length} transações.</p>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="rounded-full">Cancelar</Button>
            <Button onClick={() => executeDownload(previewData, previewMode)} className="rounded-full bg-primary flex-1 font-bold">Confirmar e Baixar CSV</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CLEANUP DIALOG */}
      <Dialog open={isCleanupOpen} onOpenChange={setIsCleanupOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] bg-background/95 backdrop-blur-xl">
          <DialogHeader><DialogTitle className="text-2xl font-serif font-bold text-destructive">Limpar Registros</DialogTitle><DialogDescription>Ação irreversível de exclusão de dados.</DialogDescription></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-destructive/5 rounded-2xl border border-destructive/10 text-xs text-destructive font-bold">Cuidado! Você apagará as transações de {startDate || '---'} até {endDate || '---'}.</div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Digite 'CONFIRMAR' para liberar</label>
              <Input value={cleanupConfirmation} onChange={(e) => setCleanupConfirmation(e.target.value)} placeholder="CONFIRMAR" className="rounded-xl border-destructive/30" />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setIsCleanupOpen(false)} className="rounded-full">Cancelar</Button>
            <Button onClick={handleCleanup} disabled={cleanupLoading || cleanupConfirmation !== 'CONFIRMAR'} className="rounded-full bg-destructive hover:bg-destructive/90 flex-1 font-bold">Excluir Permanentemente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAILS DIALOG */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] bg-background/95 backdrop-blur-xl">
          <DialogHeader><DialogTitle className="text-2xl font-serif font-bold">Detalhes do Processamento</DialogTitle></DialogHeader>
          {selectedTx && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase">ID Interno</p><p className="text-xs font-mono bg-muted p-2 rounded-lg truncate">{selectedTx.id}</p></div>
                <div className="space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase">ID Pagamento (MP)</p><p className="text-xs font-mono bg-muted p-2 rounded-lg truncate">{selectedTx.payment_id || 'N/A'}</p></div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><p className="text-[10px] font-bold uppercase text-muted-foreground">Webhook Payload & Logs</p><div className="flex gap-2 items-center">
                  <div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" /><Input placeholder="Buscar no JSON..." value={payloadSearch} onChange={(e) => setPayloadSearch(e.target.value)} className="h-7 text-[10px] pl-7 w-40 rounded-lg" /></div>
                  <Badge variant="outline" className="text-[9px] font-bold">{filteredJSON?.count} matches</Badge>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => copyToClipboard(JSON.stringify(selectedTx.webhook_payload, null, 2))}>{copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}</Button>
                </div></div>
                <div className="max-h-60 overflow-y-auto bg-slate-950 p-6 rounded-2xl border border-white/5 custom-scrollbar"><pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap">{JSON.stringify(filteredJSON?.data, null, 2)}</pre></div>
              </div>
            </div>
          )}
          <Button onClick={() => setIsDetailsOpen(false)} className="rounded-full w-full font-bold h-12">Fechar Detalhes</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionsPage;