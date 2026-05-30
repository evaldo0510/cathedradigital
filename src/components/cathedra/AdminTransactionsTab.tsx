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
        <p className="text-center text-muted-foreground py-xl">Nenhuma transação registrada.</p>
      ) : (
        <div className="space-y-sm">
          {transactions.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between p-md rounded-premium bg-muted/30 border border-border/50">
              <div className="flex items-center gap-sm">
                <div className="w-xl h-xl rounded-premium bg-primary/10 flex items-center justify-center">
                  <ArrowUpRight className="w-md h-md text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-xs">
                    <p className="font-medium text-sm">{t.description || 'Transação'}</p>
                    {t.profiles?.name && (
                      <span className="text-xs bg-muted px-2xs py-3xs rounded text-muted-foreground flex items-center gap-2xs">
                        <User className="w-xs h-xs" />
                        {t.profiles.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-sm">
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
