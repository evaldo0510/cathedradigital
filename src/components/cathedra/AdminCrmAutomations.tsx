import React, { useState } from 'react';
import {
  Bell, Zap, Clock, Send, CheckCircle2, AlertTriangle,
  Flame, UserMinus, MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const automations = [
  {
    id: 'daily_streak',
    name: 'Lembrete de Streak',
    description: 'Envia notificação diária para manter o streak ativo.',
    icon: <Flame className="w-spacing-md h-spacing-md text-orange-500" />,
    schedule: 'Diário — 08:00',
    status: 'active' as const,
    edgeFunction: 'daily-streak-push',
  },
  {
    id: 'retention_3d',
    name: 'Reengajamento (3 dias)',
    description: 'Notifica usuários inativos há 3+ dias com conteúdo personalizado.',
    icon: <UserMinus className="w-spacing-md h-spacing-md text-secondary" />,
    schedule: 'Diário — 10:00',
    status: 'active' as const,
    edgeFunction: 'retention-notifications',
  },
  {
    id: 'community_digest',
    name: 'Resumo da Comunidade',
    description: 'Notificação semanal com destaques da comunidade.',
    icon: <MessageCircle className="w-spacing-md h-spacing-md text-primary" />,
    schedule: 'Semanal — Domingo 09:00',
    status: 'inactive' as const,
    edgeFunction: null,
  },
];

const AdminCrmAutomations: React.FC = () => {
  const [sending, setSending] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualMessage, setManualMessage] = useState('');
  const [manualTarget, setManualTarget] = useState<'all' | 'at_risk' | 'premium'>('all');

  const handleSendManual = async () => {
    if (!manualTitle.trim() || !manualMessage.trim()) {
      toast.error('Preencha título e mensagem.');
      return;
    }

    setSending(true);
    try {
      const { data: profiles, error } = await supabase.from('profiles').select('id, is_premium, last_visit');
      if (error) throw error;

      let targetUsers = profiles || [];
      if (manualTarget === 'at_risk') {
        targetUsers = targetUsers.filter(p => {
          const days = p.last_visit
            ? Math.floor((Date.now() - new Date(p.last_visit).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          return days >= 4 && days <= 14;
        });
      } else if (manualTarget === 'premium') {
        targetUsers = targetUsers.filter(p => p.is_premium);
      }

      if (targetUsers.length === 0) {
        toast.error('Nenhum usuário no segmento selecionado.');
        setSending(false);
        return;
      }

      // Insert notifications for each user
      const notifications = targetUsers.map(u => ({
        user_id: u.id,
        title: manualTitle.trim(),
        message: manualMessage.trim(),
        type: 'admin_manual',
      }));

      // Batch insert (Supabase handles up to 1000)
      const { error: insertError } = await supabase.from('notifications').insert(notifications);
      if (insertError) throw insertError;

      toast.success(`Notificação enviada para ${targetUsers.length} usuário(s).`);
      setManualTitle('');
      setManualMessage('');
    } catch (err: any) {
      toast.error('Erro ao enviar: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-spacing-lg">
      {/* Automation Status */}
      <div className="space-y-spacing-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-spacing-xs">
          <Zap className="w-spacing-md h-spacing-md" /> Automações Configuradas
        </h3>
        {automations.map(auto => (
          <Card key={auto.id}>
            <CardContent className="py-spacing-md px-spacing-md">
              <div className="flex items-center justify-between gap-spacing-md">
                <div className="flex items-center gap-spacing-sm min-w-0">
                  {auto.icon}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{auto.name}</p>
                    <p className="text-xs text-muted-foreground">{auto.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-spacing-sm shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{auto.schedule}</p>
                    {auto.edgeFunction && (
                      <p className="text-xs font-mono text-muted-foreground/70">{auto.edgeFunction}</p>
                    )}
                  </div>
                  <Badge className={auto.status === 'active'
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-muted text-muted-foreground'
                  }>
                    {auto.status === 'active' ? (
                      <><CheckCircle2 className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> Ativo</>
                    ) : (
                      <><Clock className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> Inativo</>
                    )}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Manual Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-spacing-xs">
            <Send className="w-spacing-md h-spacing-md text-primary" /> Enviar Notificação Manual
          </CardTitle>
          <CardDescription>Dispare uma notificação diretamente para um segmento de usuários.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-spacing-md">
          <div className="flex gap-spacing-xs">
            {(['all', 'at_risk', 'premium'] as const).map(target => (
              <Button
                key={target}
                size="sm"
                variant={manualTarget === target ? 'default' : 'outline'}
                onClick={() => setManualTarget(target)}
                className="text-xs"
              >
                {target === 'all' ? 'Todos' : target === 'at_risk' ? 'Em Risco' : 'PRO'}
              </Button>
            ))}
          </div>
          <Input
            placeholder="Título da notificação"
            value={manualTitle}
            onChange={e => setManualTitle(e.target.value)}
          />
          <Textarea
            placeholder="Mensagem..."
            value={manualMessage}
            onChange={e => setManualMessage(e.target.value)}
            rows={3}
          />
          <Button onClick={handleSendManual} disabled={sending} className="gap-spacing-xs">
            <Send className="w-spacing-md h-spacing-md" /> {sending ? 'Enviando...' : 'Enviar Notificação'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCrmAutomations;
