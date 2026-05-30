import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Store } from 'lucide-react';

const WalletHistory: React.FC = () => {
  return (
    <Card className="shadow-none border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-serif font-bold">Histórico da Carteira</CardTitle>
        <CardDescription>Visualize todas as suas movimentações financeiras.</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

const WithdrawalRequests: React.FC = () => {
  return (
    <Card className="shadow-none border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-serif font-bold">Solicitações de Saque</CardTitle>
        <CardDescription>Acompanhe o status dos seus pedidos de resgate.</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

const SellerDashboard: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-spacing-xl py-spacing-xl px-spacing-md animate-in fade-in duration-700">
      <div className="flex items-center gap-spacing-md">
        <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/10 flex items-center justify-center text-primary">
          <Store className="w-spacing-lg h-spacing-lg" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Painel do Vendedor</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Gestão de Vendas e Saques</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-xl">
        <WalletHistory />
        <WithdrawalRequests />
      </div>
    </div>
  );
};

export default SellerDashboard;
