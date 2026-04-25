import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/constants';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const UserTransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
      } else {
        setTransactions(data || []);
      }
      setLoading(false);
    };

    fetchTransactions();
  }, [user]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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

      {transactions.length === 0 ? (
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
                      <Button variant="ghost" size="sm" className="h-6 text-[9px] font-bold uppercase gap-1.5" onClick={() => window.print()}>
                        <Icons.Download className="w-3 h-3" /> Imprimir
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserTransactionsPage;