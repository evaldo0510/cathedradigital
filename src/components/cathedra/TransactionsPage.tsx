import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icons } from '../../constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const TransactionsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);

  const isAdmin = profile?.role === 'admin';

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select('*, profiles(name, email)', { count: 'exact' });

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
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
  }, [user, statusFilter, page, isAdmin]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pendente</Badge>;
      case 'rejected':
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Recusado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-bold tracking-tight">Histórico de Transações</h1>
        <p className="text-muted-foreground italic font-serif">Acompanhe seus pagamentos e doações no Cathedra.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-48">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="rejected">Recusados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="rounded-[2rem] overflow-hidden border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="py-5 px-6">Data</TableHead>
                {isAdmin && <TableHead className="py-5">Usuário</TableHead>}
                <TableHead className="py-5">Descrição</TableHead>
                <TableHead className="py-5 text-right">Valor</TableHead>
                <TableHead className="py-5 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} className="h-32 text-center text-muted-foreground italic font-serif">
                    Carregando transações...
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} className="h-32 text-center text-muted-foreground italic font-serif">
                    Nenhuma transação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-4 px-6 font-medium text-xs">
                      {format(new Date(tx.created_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{tx.profiles?.name || 'Usuário'}</span>
                          <span className="text-[10px] text-muted-foreground">{tx.profiles?.email}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="py-4 font-serif italic text-sm text-foreground/80">
                      {tx.description || 'Assinatura Cathedra PRO'}
                    </TableCell>
                    <TableCell className="py-4 text-right font-bold text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      {getStatusBadge(tx.status)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalCount > pageSize && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl"
          >
            Anterior
          </Button>
          <span className="text-sm font-medium">Página {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page * pageSize >= totalCount}
            className="rounded-xl"
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
