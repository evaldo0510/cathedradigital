import { Icons } from '@/constants';
import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  id: string;
  description: string | null;
  amount: number;
  status: string;
  created_at: string;
  profiles?: {
    name: string | null;
  };
}

interface AdminTransactionsTabProps {
  transactions: Transaction[];
}

const AdminTransactionsTab: React.FC<AdminTransactionsTabProps> = ({ transactions }) => (
  <Card>
    <CardHeader>
      <CardTitle>Últimas Transações</CardTitle>
    </CardHeader>
    <CardContent>
      {transactions.length === 0 ? (
        <p className="text-center text-muted-foreground py-spacing-xl">Nenhuma transação registrada.</p>
      ) : (
        <div className="space-y-spacing-sm">
          {transactions.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between p-spacing-md rounded-premium bg-muted/30 border border-border/50">
              <div className="flex items-center gap-spacing-sm">
                <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/10 flex items-center justify-center">
                  <Icons.ArrowUpRight className="w-spacing-md h-spacing-md text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-spacing-xs">
                    <p className="font-medium text-premium-sm">{t.description || 'Transação'}</p>
                    {t.profiles?.name && (
                      <span className="text-premium-xs bg-muted px-spacing-2xs py-spacing-3xs rounded text-muted-foreground flex items-center gap-spacing-2xs">
                        <Icons.User className="w-spacing-xs h-spacing-xs" />
                        {t.profiles.name}
                      </span>
                    )}
                  </div>
                  <p className="text-premium-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-spacing-sm">
                <Badge variant={t.status === 'approved' ? 'default' : 'secondary'}>{t.status || 'pendente'}</Badge>
                <span className="font-bold text-premium-sm">
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
