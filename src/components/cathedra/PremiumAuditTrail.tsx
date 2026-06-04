import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Icons } from '@/constants';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Webhook, CreditCard, Activity, Zap, RefreshCcw, AlertCircle, Download, FileJson } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';

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

  const exportTimelineCSV = () => {
    const dataToExport = auditLogs.map(item => ({
      data: format(item.date, "dd/MM/yyyy HH:mm"),
      tipo: item.type === 'transaction' ? 'Transação' : 'Webhook',
      evento: item.event_type || (item.status === 'approved' ? 'Ativação PRO' : 'Pagamento'),
      status: item.status.toUpperCase(),
      id: item.payment_id || item.event_id,
      valor: item.amount || '-',
      erro: item.error_message || '-'
    }));
    
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria_premium_${user?.id}_${Date.now()}.csv`;
    link.click();
    toast.success('Linha do tempo exportada (CSV)');
  };

  const exportTimelinePDF = () => {
    const doc = new jsPDF();
    doc.text("Trilha de Auditoria Premium - Cathedra", 14, 15);
    doc.setFontSize(10);
    doc.text(`Usuário: ${user?.email}`, 14, 22);
    
    const tableData = auditLogs.map(item => [
      format(item.date, "dd/MM/yyyy HH:mm"),
      item.type === 'transaction' ? 'Transação' : 'Webhook',
      item.event_type || (item.status === 'approved' ? 'Ativação PRO' : 'Pagamento'),
      item.status.toUpperCase(),
      item.payment_id || item.event_id || '-',
      item.error_message || '-'
    ]);

    (doc as any).autoTable({
      head: [['Data', 'Tipo', 'Evento', 'Status', 'ID', 'Detalhes']],
      body: tableData,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 }
    });
    
    doc.save(`auditoria_premium_${user?.id}.pdf`);
    toast.success('Linha do tempo exportada (PDF)');
  };

  if (loading) return <div className="p-4 text-center animate-pulse">Carregando trilha de auditoria...</div>;

  if (auditLogs.length === 0) return (
    <div className="p-8 text-center text-muted-foreground italic border border-dashed rounded-premium">
      Nenhuma atividade premium registrada ainda.
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-[10px] h-7 rounded-lg gap-1.5 border-primary/20 text-primary"
          onClick={exportTimelineCSV}
        >
          <Download className="w-3 h-3" /> Exportar CSV
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-[10px] h-7 rounded-lg gap-1.5 border-primary/20 text-primary"
          onClick={exportTimelinePDF}
        >
          <Icons.FileText className="w-3 h-3" /> Exportar PDF
        </Button>
      </div>
      <ScrollArea className="h-[350px] pr-4">
      <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-border before:h-full">
        {auditLogs.map((item, idx) => (
          <div key={idx} className="relative pl-10">
            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center z-10 ${
              item.type === 'transaction' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {item.type === 'transaction' ? (
                <CreditCard className="w-3 h-3" />
              ) : (
                <Webhook className="w-3 h-3" />
              )}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-premium-sm font-bold text-foreground">
                    {item.type === 'transaction' 
                      ? (item.status === 'approved' ? 'Acesso PRO Ativado' : 'Tentativa de Pagamento') 
                      : `Evento Webhook: ${item.event_type}`}
                  </p>
                  {item.type === 'transaction' && item.status === 'approved' && (
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {format(item.date, "dd/MM/yy HH:mm", { locale: ptBR })}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={item.status === 'approved' || item.status === 'success' ? 'default' : item.status === 'pending' ? 'outline' : 'destructive'} className="text-[9px] px-1.5 py-0">
                  {item.status.toUpperCase()}
                </Badge>
                {(item.payment_id || item.event_id) && (
                  <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                    <Icons.ShieldCheck className="w-2 h-2" />
                    ID: {item.payment_id || item.event_id}
                  </span>
                )}
              </div>

              {item.type === 'transaction' && item.amount && (
                <p className="text-[10px] text-muted-foreground">
                  Valor: R$ {item.amount} {item.description ? `· ${item.description}` : ''}
                </p>
              )}

              {item.error_message && (
                <div className="flex items-center gap-1.5 mt-1 bg-red-500/5 p-1 rounded border border-red-500/10">
                  <AlertCircle className="w-2.5 h-2.5 text-red-500" />
                  <p className="text-[10px] text-red-500 italic">{item.error_message}</p>
                </div>
              )}
              
              {item.retry_count > 0 && (
                <p className="text-[9px] text-primary font-bold flex items-center gap-1">
                  <RefreshCcw className="w-2 h-2" />
                  Retentativa #{item.retry_count}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
    </div>
  );
};

export default PremiumAuditTrail;