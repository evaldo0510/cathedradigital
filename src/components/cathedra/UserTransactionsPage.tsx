import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Icons } from '@/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const PAGE_SIZE = 10;

const TransactionSkeleton: React.FC = () => (
  <Card className="overflow-hidden border-border/50 opacity-60 animate-pulse">
    <CardContent className="p-spacing-md md:p-spacing-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-spacing-md">
      <div className="flex items-center gap-spacing-md">
        <div className="w-spacing-xl h-spacing-xl rounded-premium bg-muted" />
        <div className="space-y-spacing-xs">
          <div className="h-spacing-md w-spacing-4xl bg-muted rounded" />
          <div className="h-spacing-sm w-spacing-4xl bg-muted rounded" />
        </div>
      </div>
      <div className="flex items-center gap-spacing-lg">
        <div className="space-y-spacing-xs text-right">
          <div className="h-spacing-md w-spacing-3xl bg-muted rounded" />
          <div className="h-spacing-xs w-spacing-xl bg-muted rounded ml-auto" />
        </div>
        <div className="h-spacing-lg w-spacing-3xl bg-muted rounded-premium" />
      </div>
    </CardContent>
  </Card>
);

const UserTransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [announcement, setAnnouncement] = useState('');
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedTx) {
      const statusText = selectedTx.status === 'approved' ? 'aprovada' : selectedTx.status === 'pending' ? 'pendente' : 'cancelada';
      let msg = `Detalhes da transação de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedTx.amount)} abertos. Status: ${statusText}. Pressione Escape para fechar.`;
      if (selectedTx.error_message) msg += ` Erro: ${selectedTx.error_message}`;
      setAnnouncement(msg);
    }
  }, [selectedTx]);

  useEffect(() => {
    if (loading) {
      setAnnouncement('Carregando transações...');
    } else if (transactions.length > 0) {
      setAnnouncement(`${transactions.length} transações carregadas.`);
    }
  }, [loading, transactions.length]);

  useEffect(() => {
    if (searchTerm) {
      const timer = setTimeout(() => {
        setAnnouncement(`Buscando por: ${searchTerm}`);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (statusFilter !== 'all') {
      setAnnouncement(`Filtrando por status: ${statusFilter}`);
    }
  }, [statusFilter]);

  const fetchTransactions = useCallback(async (pageNum: number) => {
    if (!user) return;
    
    setError(null);
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        const isNumeric = !isNaN(Number(searchTerm));
        if (isNumeric) {
          query = query.or(`payment_id.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,amount.eq.${searchTerm}`);
        } else {
          query = query.or(`payment_id.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }
      }

      const { data, error: supabaseError } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (supabaseError) throw supabaseError;

      const newItems = data || [];
      
      setTransactions(prev => {
        if (pageNum === 0) return newItems;
        const existingIds = new Set(prev.map(tx => tx.id));
        const filteredNewItems = newItems.filter(tx => !existingIds.has(tx.id));
        return [...prev, ...filteredNewItems];
      });

      setHasMore(newItems.length === PAGE_SIZE);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Erro ao carregar transações.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, statusFilter, searchTerm]);

  // Reset state when filters or user change
  useEffect(() => {
    setTransactions([]);
    setPage(0);
    setHasMore(true);
    setError(null);
    setLoading(true);
    fetchTransactions(0);
  }, [user?.id, statusFilter]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setTransactions([]);
      setPage(0);
      setHasMore(true);
      setError(null);
      setLoading(true);
      fetchTransactions(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setPage(prev => {
            const nextPage = prev + 1;
            fetchTransactions(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchTransactions]);

  const copyPaymentId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('ID do pagamento copiado!');
  };

  const handleExportPDF = () => {
    if (transactions.length === 0) {
      toast.error('Nenhuma transação para exportar.');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Relatório de Doações - Cathedra', 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30);
    doc.text(`Usuário: ${user?.email}`, 14, 35);

    const tableData = transactions.map(tx => [
      format(new Date(tx.created_at), "dd/MM/yyyy"),
      tx.description || (tx.is_donation ? 'Doação' : 'Assinatura'),
      tx.payment_id || '-',
      tx.status === 'approved' ? 'Aprovado' : tx.status === 'pending' ? 'Pendente' : 'Cancelado',
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)
    ]);

    (doc as any).autoTable({
      startY: 45,
      head: [['Data', 'Descrição', 'ID Pagamento', 'Status', 'Valor']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: '#8B5CF6' },
      styles: { fontSize: 8 },
    });

    const total = transactions
      .filter(tx => tx.status === 'approved')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(12);
    doc.text(`Total Aprovado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}`, 14, finalY + 10);

    doc.save(`doacoes_cathedra_${format(new Date(), "yyyyMMdd")}.pdf`);
    toast.success('PDF exportado com sucesso!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pendente</Badge>;
      case 'failure':
      case 'cancelled':
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Recusado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading && transactions.length === 0) {
    return (
    <div className="max-w-spacing-4xl mx-auto space-y-spacing-xl py-spacing-lg">
      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>
        <div className="flex items-center gap-spacing-md animate-pulse">
          <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-muted" />
          <div className="space-y-spacing-xs">
            <div className="h-spacing-lg w-spacing-4xl bg-muted rounded" />
            <div className="h-spacing-md w-spacing-4xl bg-muted rounded" />
          </div>
        </div>
        <div className="grid gap-spacing-md">
          {[1, 2, 3].map(i => <TransactionSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-spacing-4xl mx-auto space-y-spacing-xl py-spacing-lg">
      <div className="flex flex-col md:flex-row items-center justify-between gap-spacing-md">
        <div className="flex items-center gap-spacing-md">
          <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/10 flex items-center justify-center text-primary">
            <Icons.History className="w-spacing-lg h-spacing-lg" />
          </div>
          <div>
            <h1 className="text-premium-2xl font-black text-foreground">Minhas Doações</h1>
            <p className="text-premium-xs text-muted-foreground uppercase tracking-widest font-bold">Histórico de contribuições</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportPDF}
          className="gap-spacing-xs font-bold uppercase text-premium-xs tracking-widest rounded-premium-full"
        >
          <Icons.Download className="w-spacing-md h-spacing-md" /> Exportar PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-md">
        <div className="md:col-span-2 relative">
          <Icons.Search className="absolute left-spacing-sm top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-muted-foreground" />
          <Input 
            placeholder="Buscar por ID ou valor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-spacing-xl bg-muted/50 border-border/50 focus:bg-background transition-all rounded-premium-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-muted/50 border-border/50 rounded-premium-full">
            <div className="flex items-center gap-spacing-xs">
              <Icons.Filter className="w-spacing-md h-spacing-md text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-premium-full">
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && transactions.length === 0 ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-spacing-2xl space-y-spacing-md">
            <Icons.AlertTriangle className="w-spacing-2xl h-spacing-2xl text-destructive/50" />
            <div className="text-center">
              <p className="text-destructive font-medium">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchTransactions(0)}
                className="mt-spacing-md gap-spacing-xs border-destructive/20 text-destructive hover:bg-destructive/10"
              >
                <Icons.RotateCcw className="w-spacing-md h-spacing-md" /> Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : transactions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-spacing-2xl space-y-spacing-md">
            <Icons.Heart className="w-spacing-2xl h-spacing-2xl text-muted-foreground/60" />
            <div className="text-center">
              <p className="text-muted-foreground font-medium">Nenhuma transação encontrada.</p>
              <p className="text-premium-xs text-muted-foreground">Tente ajustar seus filtros ou busca.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-spacing-md">
          {transactions.map((tx, idx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-all">
                <CardContent className="p-spacing-0">
                  <div className="p-spacing-md md:p-spacing-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-spacing-md">
                    <div className="flex items-center gap-spacing-md">
                      <div className={`w-spacing-xl h-spacing-xl rounded-premium-full flex items-center justify-center ${tx.is_donation ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                        {tx.is_donation ? <Icons.Heart className="w-spacing-md h-spacing-md fill-current" /> : <Icons.Star className="w-spacing-md h-spacing-md fill-current" />}
                      </div>
                      <div>
                        <p className="text-premium-sm font-bold text-foreground">{tx.description || (tx.is_donation ? 'Doação Voluntária' : 'Assinatura PRO')}</p>
                        <p className="text-premium-xs text-muted-foreground">
                          {format(new Date(tx.created_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full md:w-auto gap-spacing-lg">
                      <div className="text-right">
                        <p className="text-premium-lg font-black text-foreground">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                        </p>
                        <p className="text-premium-xs text-muted-foreground uppercase font-bold tracking-tighter">Valor</p>
                      </div>
                      <div className="flex flex-col items-end gap-spacing-2xs">
                        {getStatusBadge(tx.status)}
                        {tx.payment_id && (
                          <p className="text-premium-xs font-mono text-muted-foreground">ID: {tx.payment_id}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 px-spacing-md md:px-spacing-lg py-spacing-xs border-t border-border/50 flex justify-between items-center">
                    <span className="text-premium-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {tx.status === 'approved' ? 'Comprovante disponível' : 'Histórico da transação'}
                    </span>
                    <div className="flex gap-spacing-xs">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-spacing-lg text-premium-xs font-bold uppercase gap-spacing-2xs" 
                        onClick={() => setSelectedTx(tx)}
                      >
                        <Icons.Info className="w-spacing-sm h-spacing-sm" /> Detalhes
                      </Button>
                      {tx.status === 'approved' && (
                        <Button variant="ghost" size="sm" className="h-spacing-lg text-premium-xs font-bold uppercase gap-spacing-2xs" onClick={() => window.print()}>
                          <Icons.Download className="w-spacing-sm h-spacing-sm" /> Imprimir
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {loadingMore && (
            <div className="grid gap-spacing-md mt-spacing-md">
              {[1, 2].map(i => <TransactionSkeleton key={i} />)}
            </div>
          )}

          {error && transactions.length > 0 && (
            <div className="p-spacing-md rounded-premium bg-destructive/5 border border-destructive/10 text-center space-y-spacing-sm mt-spacing-md">
              <p className="text-premium-xs text-destructive font-medium">{error}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => fetchTransactions(page)}
                className="h-spacing-xl text-premium-xs uppercase font-bold text-destructive hover:bg-destructive/10"
              >
                Tentar novamente
              </Button>
            </div>
          )}
          
          {hasMore && !loadingMore && !error && (
            <div ref={loaderRef} className="flex flex-col items-center justify-center py-spacing-xl space-y-spacing-md">
              <div className="w-spacing-lg h-spacing-lg border-2 border-primary border-t-transparent rounded-premium animate-spin opacity-50" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchTransactions(nextPage);
                }}
                className="text-premium-xs uppercase font-bold text-muted-foreground hover:text-primary"
              >
                Carregar mais
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog 
        open={!!selectedTx} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTx(null);
            setAnnouncement('Modal de detalhes fechado.');
          }
        }}
      >
        <DialogContent 
          className="max-w-spacing-md rounded-[2rem]"
          onEscapeKeyDown={() => setSelectedTx(null)}
          onPointerDownOutside={() => setSelectedTx(null)}
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-premium-xl flex items-center gap-spacing-sm">
              <div className={`w-spacing-xl h-spacing-xl rounded-premium-full flex items-center justify-center ${selectedTx?.is_donation ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                {selectedTx?.is_donation ? <Icons.Heart className="w-spacing-md h-spacing-md fill-current" /> : <Icons.Star className="w-spacing-md h-spacing-md fill-current" />}
              </div>
              Detalhes da Transação
            </DialogTitle>
            <DialogDescription className="text-premium-xs uppercase tracking-widest font-bold pt-spacing-xs">
              Informações completas do seu apoio
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-spacing-lg pt-spacing-md">
              <div className="grid grid-cols-2 gap-spacing-md">
                <div className="space-y-spacing-2xs">
                  <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Status</p>
                  {getStatusBadge(selectedTx.status)}
                </div>
                <div className="space-y-spacing-2xs text-right">
                  <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Valor</p>
                  <p className="text-premium-xl font-black text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedTx.amount)}
                  </p>
                </div>
              </div>

              <div className="space-y-spacing-sm bg-muted/30 p-spacing-md rounded-premium border border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-premium-xs font-bold text-muted-foreground uppercase">Descrição</span>
                  <span className="text-premium-xs font-bold text-foreground">{selectedTx.description || (selectedTx.is_donation ? 'Doação Voluntária' : 'Assinatura PRO')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-premium-xs font-bold text-muted-foreground uppercase">Data</span>
                  <span className="text-premium-xs font-medium text-foreground">
                    {format(new Date(selectedTx.created_at), "dd/MM/yyyy, HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {selectedTx.payment_id && (
                  <div className="flex justify-between items-center group">
                    <span className="text-premium-xs font-bold text-muted-foreground uppercase">ID Pagamento</span>
                    <div className="flex items-center gap-spacing-xs">
                      <span className="text-premium-xs font-mono text-foreground">{selectedTx.payment_id}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-spacing-md w-spacing-md opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyPaymentId(selectedTx.payment_id)}
                        aria-label="Copiar ID do pagamento"
                      >
                        <Icons.Copy className="w-spacing-sm h-spacing-sm" />
                      </Button>
                    </div>
                  </div>
                )}
                {selectedTx.coupon_code && (
                  <div className="flex justify-between items-center">
                    <span className="text-premium-xs font-bold text-muted-foreground uppercase">Cupom</span>
                    <Badge variant="outline" className="text-premium-xs font-mono">{selectedTx.coupon_code}</Badge>
                  </div>
                )}
              </div>

              {selectedTx.status === 'approved' && (
                <div className="space-y-spacing-md">
                  <div className="p-spacing-md rounded-premium bg-green-500/5 border border-green-500/10 flex items-center gap-spacing-sm">
                    <Icons.CheckCircle className="w-spacing-md h-spacing-md text-green-500" />
                    <div>
                      <p className="text-premium-xs font-black uppercase text-green-600">Aprovado</p>
                      <p className="text-premium-xs text-green-600/80">Sua contribuição já está ajudando nossa missão!</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="link" 
                    className="w-full text-premium-xs font-bold uppercase tracking-widest text-primary gap-spacing-xs h-auto p-spacing-0"
                    onClick={() => window.print()}
                  >
                    <Icons.ExternalLink className="w-spacing-sm h-spacing-sm" /> Ver Comprovante
                  </Button>
                </div>
              )}

              {selectedTx.error_message && (
                <div className="p-spacing-md rounded-premium bg-destructive/5 border border-destructive/10">
                  <p className="text-premium-xs font-black uppercase text-destructive mb-spacing-2xs">Motivo do Problema</p>
                  <p className="text-premium-xs text-destructive/80 italic">{selectedTx.error_message}</p>
                </div>
              )}

              <div className="flex gap-spacing-sm">
                <DialogClose asChild>
                  <Button 
                    className="flex-1 rounded-premium-full font-bold uppercase text-premium-xs tracking-widest" 
                    autoFocus
                  >
                    Fechar
                  </Button>
                </DialogClose>
                {selectedTx.status === 'approved' && (
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-premium-full font-bold uppercase text-premium-xs tracking-widest gap-spacing-xs"
                    onClick={() => window.print()}
                  >
                    <Icons.Download className="w-spacing-sm h-spacing-sm" /> Imprimir
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserTransactionsPage;
