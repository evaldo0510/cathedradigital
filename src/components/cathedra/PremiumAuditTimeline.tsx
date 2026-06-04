import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Zap, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AuditEvent {
  id: string;
  type: 'payment_attempt' | 'webhook_received' | 'status_change' | 'activation' | 'expiration';
  status: 'success' | 'failed' | 'pending';
  title: string;
  description: string;
  timestamp: string;
  transaction_id?: string;
}

export const PremiumAuditTimeline: React.FC<{ userId: string }> = ({ userId }) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAuditTrail = async () => {
      setIsLoading(true);
      
      // Fetch transactions
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Fetch webhook logs related to this user (we might need to search in payload if user_id is there)
      // This is a bit tricky if webhook_logs doesn't have user_id, but usually transactions mapping handles it
      
      const auditEvents: AuditEvent[] = [];

      txs?.forEach(tx => {
        // Status Change / Payment Event
        auditEvents.push({
          id: `tx-${tx.id}`,
          type: 'payment_attempt',
          status: tx.status === 'approved' ? 'success' : tx.status === 'pending' ? 'pending' : 'failed',
          title: `Pagamento ${tx.status === 'approved' ? 'Aprovado' : tx.status === 'pending' ? 'Pendente' : 'Falhou'}`,
          description: `${tx.description || 'Assinatura PRO'} - R$ ${tx.amount}`,
          timestamp: tx.created_at,
          transaction_id: tx.payment_id
        });

        if (tx.status === 'approved') {
          auditEvents.push({
            id: `act-${tx.id}`,
            type: 'activation',
            status: 'success',
            title: 'Acesso PRO Ativado',
            description: 'Assinatura premium liberada com sucesso.',
            timestamp: tx.created_at,
            transaction_id: tx.payment_id
          });
        }
      });

      // Sort all by timestamp
      auditEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEvents(auditEvents);
      setIsLoading(false);
    };

    fetchAuditTrail();
  }, [userId]);

  if (isLoading) return <div className="animate-pulse space-y-4">
    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}
  </div>;

  if (events.length === 0) return (
    <div className="text-center py-8 bg-muted/20 rounded-2xl border border-dashed border-border">
      <p className="text-sm text-muted-foreground italic">Nenhum histórico de transação encontrado.</p>
    </div>
  );

  return (
    <div className="relative pl-6 border-l-2 border-primary/20 space-y-8 py-2">
      {events.map((event, index) => (
        <motion.div 
          key={event.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative"
        >
          {/* Timeline Dot */}
          <div className={`absolute -left-[27px] top-0 w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center z-10 ${
            event.status === 'success' ? 'border-green-500' : 
            event.status === 'failed' ? 'border-red-500' : 'border-amber-500'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              event.status === 'success' ? 'bg-green-500' : 
              event.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
            }`} />
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {event.type === 'payment_attempt' && <CreditCard className="w-4 h-4 text-primary" />}
                {event.type === 'activation' && <Zap className="w-4 h-4 text-amber-500" />}
                <h4 className="font-bold text-sm">{event.title}</h4>
              </div>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {format(new Date(event.timestamp), "dd 'de' MMM, HH:mm", { locale: ptBR })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
            {event.transaction_id && (
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/60 uppercase tracking-tighter">
                <ShieldCheck className="w-3 h-3" />
                ID: {event.transaction_id}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
