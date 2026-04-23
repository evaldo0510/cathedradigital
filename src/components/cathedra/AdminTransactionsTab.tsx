import React from 'react';
import { ArrowUpRight, User } from 'lucide-react';
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
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{t.description || 'Transação'}</p>
                    {t.profiles?.name && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground flex items-center gap-1">
                        <User className="w-2.5 h-2.5" />
                        {t.profiles.name}
                      </span>
                    )}
                  </div>
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
