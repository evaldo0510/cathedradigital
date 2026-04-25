import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Icons } from '@/constants';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PAGE_SIZE = 10;

const TransactionSkeleton: React.FC = () => (
  <Card className="overflow-hidden border-border/50 opacity-60 animate-pulse">
    <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="space-y-2 text-right">
          <div className="h-5 w-20 bg-muted rounded" />
          <div className="h-2 w-10 bg-muted rounded ml-auto" />
        </div>
        <div className="h-6 w-16 bg-muted rounded-full" />
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
  const loaderRef = useRef<HTMLDivElement>(null);

  // Reset state when user changes
  useEffect(() => {
    setTransactions([]);
    setPage(0);
    setHasMore(true);
    setError(null);
    setLoading(true);
  }, [user?.id]);


  const fetchTransactions = useCallback(async (pageNum: number) => {
    if (!user) return;
    
    setError(null);
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
      const { data, error: supabaseError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (supabaseError) throw supabaseError;

      const newItems = data || [];
      
      setTransactions(prev => {
        if (pageNum === 0) return newItems;
        
        // Deduplication: only add items that are not already in the list
        const existingIds = new Set(prev.map(tx => tx.id));
        const filteredNewItems = newItems.filter(tx => !existingIds.has(tx.id));
        return [...prev, ...filteredNewItems];
      });

      setHasMore(newItems.length === PAGE_SIZE);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Erro ao carregar transações. Verifique sua conexão.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      fetchTransactions(0);
    }
  }, [fetchTransactions, user?.id]);

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
      <div className="max-w-4xl mx-auto space-y-8 py-6">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <TransactionSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Icons.History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Minhas Doações</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Histórico de contribuições e assinaturas</p>
        </div>
      </div>

      {error && transactions.length === 0 ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Icons.AlertTriangle className="w-12 h-12 text-destructive/50" />
            <div className="text-center">
              <p className="text-destructive font-medium">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchTransactions(0)}
                className="mt-4 gap-2 border-destructive/20 text-destructive hover:bg-destructive/10"
              >
                <Icons.RotateCcw className="w-4 h-4" /> Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : transactions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Icons.Heart className="w-12 h-12 text-muted-foreground/30" />
            <div className="text-center">
              <p className="text-muted-foreground font-medium">Você ainda não possui transações.</p>
              <p className="text-xs text-muted-foreground">Que tal fazer sua primeira doação hoje?</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {transactions.map((tx, idx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-all">
                <CardContent className="p-0">
                  <div className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.is_donation ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                        {tx.is_donation ? <Icons.Heart className="w-5 h-5 fill-current" /> : <Icons.Star className="w-5 h-5 fill-current" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{tx.description || (tx.is_donation ? 'Doação Voluntária' : 'Assinatura PRO')}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(tx.created_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full md:w-auto gap-6">
                      <div className="text-right">
                        <p className="text-lg font-black text-foreground">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Valor</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(tx.status)}
                        {tx.payment_id && (
                          <p className="text-[8px] font-mono text-muted-foreground">ID: {tx.payment_id}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {tx.status === 'approved' && (
                    <div className="bg-muted/30 px-4 md:px-6 py-2 border-t border-border/50 flex justify-between items-center">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Comprovante disponível</span>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-[9px] font-bold uppercase gap-1.5" 
                          onClick={() => setSelectedTx(tx)}
                        >
                          <Icons.Info className="w-3 h-3" /> Detalhes
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[9px] font-bold uppercase gap-1.5" onClick={() => window.print()}>
                          <Icons.Download className="w-3 h-3" /> Imprimir
                        </Button>
                      </div>
                    </div>
                  )}
                  {tx.status !== 'approved' && (
                    <div className="bg-muted/30 px-4 md:px-6 py-2 border-t border-border/50 flex justify-end items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[9px] font-bold uppercase gap-1.5" 
                        onClick={() => setSelectedTx(tx)}
                      >
                        <Icons.Info className="w-3 h-3" /> Detalhes
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {loadingMore && (
            <div className="grid gap-4 mt-4">
              {[1, 2].map(i => <TransactionSkeleton key={i} />)}
            </div>
          )}

          {error && transactions.length > 0 && (
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 text-center space-y-3 mt-4">
              <p className="text-xs text-destructive font-medium">{error}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => fetchTransactions(page)}
                className="h-8 text-[10px] uppercase font-bold text-destructive hover:bg-destructive/10"
              >
                Tentar novamente
              </Button>
            </div>
          )}
          
          {hasMore && !loadingMore && !error && (
            <div ref={loaderRef} className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchTransactions(nextPage);
                }}
                className="text-[10px] uppercase font-bold text-muted-foreground hover:text-primary"
              >
                Carregar mais
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <DialogContent className="max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedTx?.is_donation ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                {selectedTx?.is_donation ? <Icons.Heart className="w-5 h-5 fill-current" /> : <Icons.Star className="w-5 h-5 fill-current" />}
              </div>
              Detalhes da Transação
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-widest font-bold pt-2">
              Informações completas do seu apoio
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
                  {getStatusBadge(selectedTx.status)}
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor</p>
                  <p className="text-xl font-black text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedTx.amount)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Descrição</span>
                  <span className="text-xs font-bold text-foreground">{selectedTx.description || (selectedTx.is_donation ? 'Doação Voluntária' : 'Assinatura PRO')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Data</span>
                  <span className="text-xs font-medium text-foreground">
                    {format(new Date(selectedTx.created_at), "dd/MM/yyyy, HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {selectedTx.payment_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">ID Pagamento</span>
                    <span className="text-[10px] font-mono text-foreground">{selectedTx.payment_id}</span>
                  </div>
                )}
                {selectedTx.coupon_code && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Cupom</span>
                    <Badge variant="outline" className="text-[9px] font-mono">{selectedTx.coupon_code}</Badge>
                  </div>
                )}
              </div>

              {selectedTx.status === 'approved' && (
                <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 flex items-center gap-3">
                  <Icons.CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-green-600">Aprovado</p>
                    <p className="text-[10px] text-green-600/80">Sua contribuição já está ajudando nossa missão!</p>
                  </div>
                </div>
              )}

              {selectedTx.error_message && (
                <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10">
                  <p className="text-[10px] font-black uppercase text-destructive mb-1">Motivo do Problema</p>
                  <p className="text-xs text-destructive/80 italic">{selectedTx.error_message}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest" 
                  onClick={() => setSelectedTx(null)}
                >
                  Fechar
                </Button>
                {selectedTx.status === 'approved' && (
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2"
                    onClick={() => window.print()}
                  >
                    <Icons.Download className="w-3 h-3" /> Imprimir
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