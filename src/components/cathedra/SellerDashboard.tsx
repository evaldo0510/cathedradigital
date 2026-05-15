import React from 'react';
import { CathedraCard as Card, CathedraCardContent as CardContent, CathedraCardHeader as CardHeader, CathedraCardTitle as CardTitle, CathedraCardDescription as CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Store } from 'lucide-react';

const WalletHistory: React.FC = () => {
  return (
    <Card className="shadow-none border-border/50">
      <CathedraCardHeader as CardHeader>
        <CathedraCardTitle as CardTitle className="text-xl font-serif font-bold">Histórico da Carteira</CathedraCardTitle as CardTitle>
        <CathedraCardDescription as CardDescription>Visualize todas as suas movimentações financeiras.</CathedraCardDescription as CardDescription>
      </CathedraCardHeader as CardHeader>
      <CathedraCardContent as CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>26/04/2026</TableCell>
              <TableCell>Venda</TableCell>
              <TableCell className="text-emerald-600 font-bold">R$ 150,00</TableCell>
              <TableCell><Badge className="bg-emerald-500/10 text-emerald-500">Concluído</Badge></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CathedraCardContent as CardContent>
    </Card>
  );
};

const WithdrawalRequests: React.FC = () => {
  return (
    <Card className="shadow-none border-border/50">
      <CathedraCardHeader as CardHeader>
        <CathedraCardTitle as CardTitle className="text-xl font-serif font-bold">Solicitações de Saque</CathedraCardTitle as CardTitle>
        <CathedraCardDescription as CardDescription>Acompanhe o status dos seus pedidos de resgate.</CathedraCardDescription as CardDescription>
      </CathedraCardHeader as CardHeader>
      <CathedraCardContent as CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>25/04/2026</TableCell>
              <TableCell className="font-bold">R$ 500,00</TableCell>
              <TableCell><Badge variant="secondary">Pendente</Badge></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CathedraCardContent as CardContent>
    </Card>
  );
};

const SellerDashboard: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Store className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Painel do Vendedor</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Gestão de Vendas e Saques</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WalletHistory />
        <WithdrawalRequests />
      </div>
    </div>
  );
};

export default SellerDashboard;
