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
import { Download, Filter, Search, Calendar as CalendarIcon, ArrowUpDown, Info, CheckCircle2, Clock, AlertCircle, XCircle, RotateCcw, ShieldAlert, Copy, Check, ChevronDown, Trash2 } from 'lucide-react';

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
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [totalToExport, setTotalToExport] = useState(0);
  const [copied, setCopied] = useState(false);
  const [payloadSearch, setPayloadSearch] = useState<string>('');
  const [availablePlans, setAvailablePlans] = useState<string[]>([]);

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

  useEffect(() => {
    fetchAvailablePlans();
  }, []);

  const fetchTransactions = async () => {
    if (!user) return;

    // Date validation
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
        // Admin user search (OR condition for name/email)
        // Since Supabase doesn't easily allow cross-table OR in a simple .select() without RPC or nested filter,
        // we'll use a trick if possible or just filter by email if it looks like one.
        if (userSearch.includes('@')) {
          query = query.filter('profiles.email', 'ilike', `%${userSearch}%`);
        } else {
          query = query.filter('profiles.name', 'ilike', `%${userSearch}%`);
        }
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (planFilter !== 'all') {
        query = query.eq('plan_id', planFilter);
      }

      if (startDate) {
        // Normalize to start of day in local time then to ISO
        const start = startOfDay(parseISO(startDate));
        query = query.gte('created_at', start.toISOString());
      }

      if (endDate) {
        // Normalize to end of day in local time then to ISO
        const end = endOfDay(parseISO(endDate));
        query = query.lte('created_at', end.toISOString());
      }

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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Aprovado',
          color: 'bg-green-500/10 text-green-500 border-green-500/20',
          icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
          description: 'O pagamento foi confirmado e o acesso liberado.'
        };
      case 'pending':
        return {
          label: 'Pendente',
          color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
          icon: <Clock className="w-3 h-3 mr-1" />,
          description: 'Aguardando processamento pelo meio de pagamento.'
        };
      case 'rejected':
        return {
          label: 'Recusado',
          color: 'bg-red-500/10 text-red-500 border-red-500/20',
          icon: <XCircle className="w-3 h-3 mr-1" />,
          description: 'O pagamento foi recusado. Verifique os dados e tente novamente.'
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          color: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
          icon: <XCircle className="w-3 h-3 mr-1" />,
          description: 'A transação foi cancelada pelo usuário ou sistema.'
        };
      case 'refunded':
        return {
          label: 'Reembolsado',
          color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          icon: <RotateCcw className="w-3 h-3 mr-1" />,
          description: 'O valor foi devolvido ao comprador.'
        };
      case 'charged_back':
        return {
          label: 'Contestação',
          color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
          icon: <ShieldAlert className="w-3 h-3 mr-1" />,
          description: 'O comprador contestou o pagamento no cartão.'
        };
      case 'in_mediation':
        return {
          label: 'Em Mediação',
          color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
          icon: <AlertCircle className="w-3 h-3 mr-1" />,
          description: 'Há uma disputa ativa sobre esta transação.'
        };
      default:
        return {
          label: status,
          color: 'bg-muted/50 text-muted-foreground border-muted-foreground/20',
          icon: <Info className="w-3 h-3 mr-1" />,
          description: 'Status não reconhecido.'
        };
    }
  };

  const getStatusBadge = (status: string) => {
    const info = getStatusInfo(status);
    return (
      <Badge className={`${info.color} flex items-center justify-center py-1 px-2 font-medium`}>
        {info.icon}
        {info.label}
      </Badge>
    );
  };

  const exportToCSV = async (mode: 'current' | 'all' = 'current') => {
    if (exporting) return;
    
    // Check if any filter is active for "all" mode to avoid accidental massive downloads
    if (mode === 'all' && statusFilter === 'all' && planFilter === 'all' && !startDate && !endDate && !userSearch.trim()) {
      const confirmAll = window.confirm('Você está tentando exportar TODAS as transações sem nenhum filtro. Isso pode demorar e gerar um arquivo muito grande. Deseja continuar?');
      if (!confirmAll) return;
    }

    let dataToExport: any[] = [];
    setExporting(true);
    setExportProgress(0);

    if (mode === 'current') {
      dataToExport = transactions;
    } else {
      toast.info('Preparando exportação completa em lotes...');
      try {
        let allData: any[] = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        // Get total count first for progress
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
        
        const { count: totalCountForExport } = await countQuery;
        setTotalToExport(totalCountForExport || 0);

        while (hasMore) {
          let query = supabase
            .from('transactions')
            .select('*, profiles(name, email)');

          if (!isAdmin) query = query.eq('user_id', user?.id);
          if (userSearch.trim()) {
            if (userSearch.includes('@')) query = query.filter('profiles.email', 'ilike', `%${userSearch}%`);
            else query = query.filter('profiles.name', 'ilike', `%${userSearch}%`);
          }
          if (statusFilter !== 'all') query = query.eq('status', statusFilter);
          if (planFilter !== 'all') query = query.eq('plan_id', planFilter);
          if (startDate) query = query.gte('created_at', startOfDay(parseISO(startDate)).toISOString());
          if (endDate) query = query.lte('created_at', endOfDay(parseISO(endDate)).toISOString());

          const { data, error } = await query
            .order('created_at', { ascending: sortOrder === 'asc' })
            .range(from, from + batchSize - 1);

          if (error) throw error;
          
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += batchSize;
            setExportProgress(allData.length);
            if (data.length < batchSize) hasMore = false;
          } else {
            hasMore = false;
          }
        }
        dataToExport = allData;
      } catch (err: any) {
        toast.error('Erro ao exportar dados: ' + err.message);
        setExporting(false);
        return;
      }
    }

    if (dataToExport.length === 0) {
      toast.error('Nenhuma transação para exportar.');
      setExporting(false);
      return;
    }

    const headers = [
      'ID', 
      'Data', 
      'Audit_Timestamp_TZ',
      'Usuário', 
      'E-mail', 
      'Descrição', 
      'Valor', 
      'Status', 
      'Plano', 
      'Cupom', 
      'Doação', 
      'ID Pagamento'
    ];

    const tzOffset = new Date().getTimezoneOffset();
    const tzString = `UTC${tzOffset > 0 ? '-' : '+'}${Math.abs(tzOffset / 60)}`;

    const csvData = dataToExport.map(tx => [
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
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transacoes_${mode === 'all' ? 'total' : 'pagina'}_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setExporting(false);
    toast.success(`CSV (${mode === 'all' ? 'total' : 'página atual'}) gerado com sucesso!`);
  };

  const handleCleanup = async () => {
    if (!startDate || !endDate) {
      toast.error('Selecione um período (início e fim) para a limpeza.');
      return;
    }

    setCleanupLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .gte('created_at', startOfDay(parseISO(startDate)).toISOString())
        .lte('created_at', endOfDay(parseISO(endDate)).toISOString());

      if (error) throw error;
      
      toast.success('Transações do período removidas com sucesso.');
      setIsCleanupOpen(false);
      fetchTransactions();
    } catch (err: any) {
      toast.error('Erro na limpeza: ' + err.message);
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

    const filterObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        if (String(obj).toLowerCase().includes(term)) {
          matchCount++;
          return obj;
        }
        return undefined;
      }
      
      if (Array.isArray(obj)) {
        const filtered = obj.map(v => filterObject(v)).filter(v => v !== undefined);
        return filtered.length > 0 ? filtered : undefined;
      }
      
      const result: any = {};
      let hasMatch = false;
      
      for (const key in obj) {
        if (key.toLowerCase().includes(term)) {
          result[key] = obj[key];
          hasMatch = true;
          matchCount++;
          continue;
        }
        
        const val = filterObject(obj[key]);
        if (val !== undefined) {
          result[key] = val;
          hasMatch = true;
        }
      }
      
      return hasMatch ? result : undefined;
    };
    
    const filtered = filterObject(fullObj) || { message: "Nenhum resultado para a busca no JSON." };
    return { data: filtered, count: matchCount };
  }, [selectedTx, payloadSearch]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('JSON copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const openDetails = (tx: any) => {
    setSelectedTx(tx);
    setPayloadSearch('');
    setIsDetailsOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-serif font-bold tracking-tight">Histórico de Transações</h1>
          <p className="text-muted-foreground italic font-serif">Acompanhe seus pagamentos e doações no Cathedra.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCleanupOpen(true)}
              disabled={loading || exporting}
              className="rounded-full gap-2 text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Período
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                disabled={loading || exporting}
                className="rounded-full gap-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all shadow-sm"
              >
                {exporting ? <Clock className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exporting ? 'Exportando...' : 'Exportar CSV'}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => exportToCSV('current')}>
                Exportar Página Atual
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV('all')}>
                Exportar Tudo (Filtrado)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {exporting && totalToExport > 0 && (
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 space-y-4 animate-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Progresso da Exportação</p>
              <p className="text-sm font-serif italic text-muted-foreground">
                Carregando {exportProgress} de {totalToExport} transações...
              </p>
            </div>
            <p className="text-2xl font-bold text-primary">{Math.round((exportProgress / totalToExport) * 100)}%</p>
          </div>
          <Progress value={(exportProgress / totalToExport) * 100} className="h-2" />
        </div>
      )}

      <Card className="rounded-[2.5rem] border-border/50 shadow-xl shadow-primary/5 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            {isAdmin && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Search className="w-3 h-3" /> Buscar Usuário
                </label>
                <Input 
                  placeholder="Nome ou Email" 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  disabled={loading || exporting}
                  className="rounded-xl bg-background/50 border-border/30 backdrop-blur-sm"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Filter className="w-3 h-3" /> Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading || exporting}>
                <SelectTrigger className="rounded-xl bg-background/50 border-border/30 backdrop-blur-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="rejected">Recusados</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                  <SelectItem value="refunded">Reembolsados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ShieldAlert className="w-3 h-3" /> Plano
              </label>
              <Select value={planFilter} onValueChange={setPlanFilter} disabled={loading || exporting}>
                <SelectTrigger className="rounded-xl bg-background/50 border-border/30 backdrop-blur-sm">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todos os Planos</SelectItem>
                  {availablePlans.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="w-3 h-3" /> Data Inicial
              </label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading || exporting}
                className={`rounded-xl bg-background/50 border-border/30 backdrop-blur-sm ${dateError ? 'border-destructive' : ''}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="w-3 h-3" /> Data Final
              </label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading || exporting}
                className={`rounded-xl bg-background/50 border-border/30 backdrop-blur-sm ${dateError ? 'border-destructive' : ''}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ArrowUpDown className="w-3 h-3" /> Ordenação
              </label>
              <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)} disabled={loading || exporting}>
                <SelectTrigger className="rounded-xl bg-background/50 border-border/30 backdrop-blur-sm">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="desc">Mais recentes</SelectItem>
                  <SelectItem value="asc">Mais antigos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {dateError && <p className="text-[10px] text-destructive mt-2 font-bold animate-pulse">{dateError}</p>}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border/50">
              <TableRow>
                <TableHead className="py-5 px-8">Data</TableHead>
                {isAdmin && <TableHead className="py-5 px-4">Usuário</TableHead>}
                <TableHead className="py-5 px-4">Descrição</TableHead>
                <TableHead className="py-5 px-4 text-right">Valor</TableHead>
                <TableHead className="py-5 px-4 text-center">Status</TableHead>
                <TableHead className="py-5 px-8 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-muted-foreground italic font-serif">Consultando pergaminhos de transações...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="h-80 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 max-w-xs mx-auto">
                      <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                        <Search className="w-10 h-10 text-muted/50" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-foreground font-serif font-bold">Nenhum registro encontrado</p>
                        <p className="text-muted-foreground italic text-xs leading-relaxed">Não encontramos transações com os filtros aplicados. Tente ajustar o período ou o status.</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-full text-primary hover:bg-primary/10 text-[10px] font-bold uppercase tracking-widest h-9 px-4"
                        onClick={() => {
                          setStatusFilter('all');
                          setPlanFilter('all');
                          setUserSearch('');
                          setStartDate('');
                          setEndDate('');
                        }}
                      >
                        Limpar todos os filtros
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} className="group hover:bg-primary/5 transition-all duration-300">
                    <TableCell className="py-5 px-8">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{format(new Date(tx.created_at), "dd 'de' MMM", { locale: ptBR })}</span>
                        <span className="text-[10px] text-muted-foreground tracking-tighter">{format(new Date(tx.created_at), "HH:mm:ss")}</span>
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="py-5 px-4">
                        <div className="flex flex-col max-w-[150px]">
                          <span className="font-bold text-sm truncate">{tx.profiles?.name || 'Anônimo'}</span>
                          <span className="text-[10px] text-muted-foreground truncate">{tx.profiles?.email}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="py-5 px-4">
                      <div className="flex flex-col">
                        <span className="font-serif italic text-sm text-foreground/90">{tx.description || 'Assinatura Cathedra PRO'}</span>
                        {tx.plan_id && <span className="text-[9px] uppercase tracking-widest text-primary/60 font-bold">{tx.plan_id}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-4 text-right">
                      <span className="font-bold text-primary text-base">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="py-5 px-4 text-center">
                      <div className="flex justify-center">
                        {getStatusBadge(tx.status)}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-full h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary transition-all"
                        onClick={() => openDetails(tx)}
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalCount > pageSize && (
        <div className="flex items-center justify-center gap-6 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full px-6 border-primary/20 hover:bg-primary/5 shadow-sm"
          >
            Anterior
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Página</span>
            <span className="bg-primary text-primary-foreground w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shadow-md">{page}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">de {Math.ceil(totalCount / pageSize)}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page * pageSize >= totalCount}
            className="rounded-full px-6 border-primary/20 hover:bg-primary/5 shadow-sm"
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Detalhes da Transação Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader className="border-b border-border/50 pb-6">
            <DialogTitle className="text-2xl font-serif font-bold flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Info className="w-6 h-6" />
              </div>
              Detalhes da Transação
            </DialogTitle>
            <DialogDescription className="italic font-serif">
              Informações detalhadas sobre o processamento do seu pagamento.
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="py-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID Interno</p>
                  <p className="font-mono text-xs break-all bg-muted/50 p-2 rounded-lg border border-border/30">{selectedTx.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID do Pagamento (MP)</p>
                  <p className="font-mono text-xs break-all bg-muted/50 p-2 rounded-lg border border-border/30">{selectedTx.payment_id || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status Atual</p>
                  <div className="pt-1">{getStatusBadge(selectedTx.status)}</div>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{getStatusInfo(selectedTx.status).description}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Valor Total</p>
                  <p className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedTx.amount)}
                  </p>
                </div>
              </div>

              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 space-y-4">
                <div className="flex justify-between items-center border-b border-primary/10 pb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Plano/Produto</span>
                  <span className="font-serif italic text-sm">{selectedTx.description}</span>
                </div>
                <div className="flex justify-between items-center border-b border-primary/10 pb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Código do Plano</span>
                  <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-bold border-primary/30">{selectedTx.plan_id || 'cathedra_pro'}</Badge>
                </div>
                {selectedTx.coupon_code && (
                  <div className="flex justify-between items-center border-b border-primary/10 pb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cupom Aplicado</span>
                    <span className="text-sm font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">{selectedTx.coupon_code}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tipo</span>
                  <span className="text-xs font-bold px-3 py-1 bg-primary/20 text-primary rounded-full">
                    {selectedTx.is_donation ? 'Contribuição Voluntária' : 'Assinatura PRO'}
                  </span>
                </div>
              </div>

              {(isAdmin || selectedTx.error_message || selectedTx.webhook_payload) && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" /> Logs & Webhook Payload
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-48">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <Input 
                          placeholder="Buscar no JSON..." 
                          value={payloadSearch}
                          onChange={(e) => setPayloadSearch(e.target.value)}
                          className="h-7 text-[10px] pl-8 rounded-lg bg-muted/50 border-border/30"
                        />
                      </div>
                      {selectedTx.webhook_payload && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] gap-1 px-2 rounded-lg hover:bg-primary/10 whitespace-nowrap"
                          onClick={() => copyToClipboard(JSON.stringify(selectedTx.webhook_payload, null, 2))}
                        >
                          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          {copied ? 'Copiado' : 'Copiar'}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto rounded-2xl border border-border/50 bg-slate-950 p-6 shadow-inner custom-scrollbar">
                    <pre className="text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                      {(() => {
                        const fullObj = {
                          webhook: selectedTx.webhook_payload,
                          error: selectedTx.error_message ? (typeof selectedTx.error_message === 'string' ? JSON.parse(selectedTx.error_message) : selectedTx.error_message) : null
                        };
                        
                        if (!payloadSearch.trim()) return JSON.stringify(fullObj, null, 2);
                        
                        // Simple filtering for specific keys or values containing the search term
                        const filterObject = (obj: any, term: string): any => {
                          if (typeof obj !== 'object' || obj === null) return String(obj).toLowerCase().includes(term.toLowerCase()) ? obj : undefined;
                          
                          if (Array.isArray(obj)) {
                            const filtered = obj.map(v => filterObject(v, term)).filter(v => v !== undefined);
                            return filtered.length > 0 ? filtered : undefined;
                          }
                          
                          const result: any = {};
                          let hasMatch = false;
                          
                          for (const key in obj) {
                            if (key.toLowerCase().includes(term.toLowerCase())) {
                              result[key] = obj[key];
                              hasMatch = true;
                              continue;
                            }
                            
                            const val = filterObject(obj[key], term);
                            if (val !== undefined) {
                              result[key] = val;
                              hasMatch = true;
                            }
                          }
                          
                          return hasMatch ? result : undefined;
                        };
                        
                        const filtered = filterObject(fullObj, payloadSearch) || { message: "Nenhum resultado para a busca no JSON." };
                        return JSON.stringify(filtered, null, 2);
                      })()}
                    </pre>
                  </div>
                  <p className="text-[10px] italic text-muted-foreground text-center">
                    Utilize a busca acima para encontrar campos específicos como 'reason', 'status' ou 'id'.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-border/50 pt-6">
            <Button 
              onClick={() => setIsDetailsOpen(false)} 
              className="w-full rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-12 text-base font-bold"
            >
              Fechar Detalhes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionsPage;