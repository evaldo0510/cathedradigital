import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ShieldCheck, Play, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';

const WebhookSimulator: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [status, setStatus] = useState<string>('approved');
  const [planId, setPlanId] = useState<string>('cathedra_pro');
  const [isPremiumAfter, setIsPremiumAfter] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, is_premium')
        .limit(20);
      setUsers(data || []);
      if (data && data.length > 0) setSelectedUserId(data[0].id);
    };
    fetchUsers();
  }, []);

  const runSimulation = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    setIsPremiumAfter(null);

    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-simulate', {
        body: {
          userId: selectedUserId,
          planId,
          status,
          amount: 19.9,
          isTest: true
        }
      });

      if (error) throw error;

      toast.success(`Simulação concluída: ${status}`);
      
      if (selectedUserId === user?.id) {
        await refreshProfile();
      }
      
      // Check if premium status updated
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', selectedUserId)
        .single();
      
      setIsPremiumAfter(profile?.is_premium ?? null);
    } catch (error: any) {
      toast.error('Erro na simulação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-[2.5rem] border-primary/20 bg-primary/5  shadow-premium-hover overflow-hidden">
      <CardHeader className="bg-primary/10 border-b border-primary/10">
        <div className="flex items-center gap-sm">
          <div className="p-xs bg-primary rounded-premium text-primary-foreground">
            <ShieldCheck className="w-md h-md" />
          </div>
          <div>
            <CardTitle className="font-serif text-xl">Simulador de Webhook</CardTitle>
            <CardDescription className="text-xs">Teste a integração de pagamentos e ativação do PRO.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="space-y-2">
            <label className="text-premium-tiny font-bold uppercase tracking-widest text-muted-foreground">Usuário para Teste</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="rounded-full bg-background border-primary/20">
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent className="rounded-full">
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || 'Usuário Sem Nome'} {u.is_premium ? '(PRO)' : '(Free)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-premium-tiny font-bold uppercase tracking-widest text-muted-foreground">Status do Pagamento</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="rounded-full bg-background border-primary/20">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent className="rounded-full">
                <SelectItem value="approved">Aprovado (Ativa PRO)</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="rejected">Recusado</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-lg items-end">
          <div className="flex-1 space-y-2">
            <label className="text-premium-tiny font-bold uppercase tracking-widest text-muted-foreground">Plano ID / Tipo</label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger className="rounded-full bg-background border-primary/20">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="rounded-full">
                <SelectItem value="cathedra_pro">Assinatura PRO</SelectItem>
                <SelectItem value="donation">Doação Voluntária</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={runSimulation} 
            disabled={loading}
            className="rounded-full bg-primary hover:bg-primary/90 px-xl h-2xl shadow-premium shadow-primary/20 gap-xs min-w-[200px]"
          >
            {loading ? <RefreshCcw className="w-md h-md animate-spin" /> : <Play className="w-md h-md" />}
            Executar Simulação
          </Button>
        </div>

        {isPremiumAfter !== null && (
          <div className={`p-md rounded-full flex items-center gap-sm animate-in zoom-in duration-500 ${isPremiumAfter ? 'bg-green-500/10 text-green-700 border border-green-500/20' : 'bg-red-500/10 text-red-700 border border-red-500/20'}`}>
            {isPremiumAfter ? <CheckCircle2 className="w-md h-md" /> : <AlertCircle className="w-md h-md" />}
            <div>
              <p className="text-sm font-bold">Resultado da Ativação</p>
              <p className="text-xs opacity-80">O usuário agora {isPremiumAfter ? 'é ASSINANTE PRO' : 'permanece com ACESSO FREE'}.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WebhookSimulator;