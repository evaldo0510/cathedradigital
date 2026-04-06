import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AdminTransactionsTabProps {
  transactions: any[];
}

const AdminTransactionsTab: React.FC<AdminTransactionsTabProps> = ({ transactions }) => (
  <Card>
    <CardHeader>
      <CardTitle>Últimas Transações</CardTitle>
    </CardHeader>
    <CardContent>
      {transactions.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Nenhuma transação registrada.</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <ArrowUpRight className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-medium text-sm">{t.description || 'Transação'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={t.status === 'approved' ? 'default' : 'secondary'}>{t.status || 'pendente'}</Badge>
                <span className="font-bold text-sm">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default AdminTransactionsTab;
