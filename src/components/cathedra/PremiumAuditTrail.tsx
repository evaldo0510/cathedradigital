import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Icons } from '@/constants';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PremiumAuditTrail: React.FC = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAuditTrail = async () => {
      setLoading(true);
      try {
        // Fetch webhook logs that might be related to this user
        // We look for the user's ID in the payload (external_reference or userId)
        const { data: logs, error: logsError } = await supabase
          .from('webhook_logs')
          .select('*')
          .or(`payload->>external_reference.eq.${user.id},payload->>userId.eq.${user.id},payload->data->>external_reference.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (logsError) throw logsError;

        // Also fetch transactions to cross-reference
        const { data: txs, error: txsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (txsError) throw txsError;

        // Combine and sort
        const combined = [
          ...(logs || []).map(l => ({ ...l, type: 'webhook', date: new Date(l.created_at) })),
          ...(txs || []).map(t => ({ ...t, type: 'transaction', date: new Date(t.created_at) }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime());

        setAuditLogs(combined);
      } catch (err) {
        console.error('Error fetching audit trail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditTrail();
  }, [user]);

  if (loading) return <div className="p-4 text-center animate-pulse">Carregando trilha de auditoria...</div>;

  if (auditLogs.length === 0) return (
    <div className="p-8 text-center text-muted-foreground italic border border-dashed rounded-premium">
      Nenhuma atividade premium registrada ainda.
    </div>
  );

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-border before:h-full">
        {auditLogs.map((item, idx) => (
          <div key={idx} className="relative pl-10">
            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center z-10 ${
              item.type === 'transaction' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {item.type === 'transaction' ? (
                <Icons.CreditCard className="w-3 h-3" />
              ) : (
                <Icons.Webhook className="w-3 h-3" />
              )}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-premium-sm font-bold text-foreground">
                  {item.type === 'transaction' ? 'Atualização de Pagamento' : `Webhook: ${item.event_type}`}
                </p>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {format(item.date, "dd/MM/yy HH:mm", { locale: ptBR })}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={item.status === 'approved' || item.status === 'success' ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0">
                  {item.status.toUpperCase()}
                </Badge>
                {item.payment_id && (
                  <span className="text-[10px] text-muted-foreground">ID: {item.payment_id}</span>
                )}
              </div>

              {item.error_message && (
                <p className="text-[10px] text-red-500 italic mt-1">{item.error_message}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default PremiumAuditTrail;