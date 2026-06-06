import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  ShieldCheck,
  Search,
  Download,
  Copy,
  Plus,
  X,
  Keyboard,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useSearchParams } from 'react-router-dom';

interface AuditEvent {
  id: string;
  type: 'payment_attempt' | 'webhook_received' | 'status_change' | 'activation' | 'expiration';
  status: 'success' | 'failed' | 'pending';
  title: string;
  description: string;
  timestamp: string;
  transaction_id?: string;
  user_id?: string;
  contract_number?: string;
  vendor?: string;
  attachments?: string[];
}

export const PremiumAuditTimeline: React.FC<{ userId: string }> = ({ userId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filterBy, setFilterBy] = useState<'id' | 'vendor' | 'user' | 'contract' | 'all'>((searchParams.get('f') as any) || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchAuditTrail = useCallback(async () => {
    setIsLoading(true);
    
    // Fetch transactions
    const { data: txs } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    const auditEvents: AuditEvent[] = [];

    txs?.forEach(tx => {
      auditEvents.push({
        id: `tx-${tx.id}`,
        type: 'payment_attempt',
        status: tx.status === 'approved' ? 'success' : tx.status === 'pending' ? 'pending' : 'failed',
        title: `Pagamento ${tx.status === 'approved' ? 'Aprovado' : tx.status === 'pending' ? 'Pendente' : 'Falhou'}`,
        description: `${tx.description || 'Assinatura PRO'} - R$ ${tx.amount}`,
        timestamp: tx.created_at,
        transaction_id: tx.payment_id,
        user_id: tx.user_id,
        contract_number: tx.metadata?.contract_number || `CTR-${tx.id.slice(0, 6)}`,
        vendor: tx.metadata?.vendor || 'Stripe/Paddle',
        attachments: tx.metadata?.attachments || []
      });

      if (tx.status === 'approved') {
        auditEvents.push({
          id: `act-${tx.id}`,
          type: 'activation',
          status: 'success',
          title: 'Acesso PRO Ativado',
          description: 'Assinatura premium liberada com sucesso.',
          timestamp: tx.created_at,
          transaction_id: tx.payment_id,
          user_id: tx.user_id
        });
      }
    });

    auditEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setEvents(auditEvents);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAuditTrail();
  }, [fetchAuditTrail]);

  const handleExportPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Linha do Tempo de Auditoria Premium', 14, 22);
    
    const tableData = events.map(e => [
      format(new Date(e.timestamp), "dd/MM/yyyy HH:mm"),
      e.title,
      e.status.toUpperCase(),
      e.transaction_id || '-',
      e.contract_number || '-'
    ]);

    (doc as any).autoTable({
      head: [['Data', 'Evento', 'Status', 'ID Transação', 'Contrato']],
      body: tableData,
      startY: 30,
    });

    // Appendix for attachments
    const eventsWithAttachments = events.filter(e => e.attachments && e.attachments.length > 0);
    if (eventsWithAttachments.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Apêndice: Anexos e Referências', 14, 22);
      
      let yOffset = 30;
      eventsWithAttachments.forEach(e => {
        doc.setFontSize(10);
        doc.text(`Evento: ${e.title} (${format(new Date(e.timestamp), "dd/MM/yyyy")})`, 14, yOffset);
        yOffset += 5;
        e.attachments?.forEach(att => {
          doc.setTextColor(0, 0, 255);
          doc.text(`- Ver anexo: ${att}`, 20, yOffset);
          doc.setTextColor(0, 0, 0);
          yOffset += 5;
        });
        yOffset += 5;
      });
    }

    doc.save(`audit_timeline_${userId}.pdf`);
    toast.success('PDF gerado com sucesso!');
  }, [events, userId]);

  const handleShare = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('q', searchQuery);
    url.searchParams.set('f', filterBy);
    navigator.clipboard.writeText(url.toString());
    toast.success('Combinação de filtros copiada para a área de transferência!');
  }, [searchQuery, filterBy]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'f') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
        if (e.key === 'e') {
          e.preventDefault();
          handleExportPDF();
        }
        if (e.key === 'i') {
          e.preventDefault();
          setShowFilters(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExportPDF]);

  const filteredEvents = events.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    switch (filterBy) {
      case 'id': return e.transaction_id?.toLowerCase().includes(q);
      case 'vendor': return e.vendor?.toLowerCase().includes(q);
      case 'user': return e.user_id?.toLowerCase().includes(q);
      case 'contract': return e.contract_number?.toLowerCase().includes(q);
      default: return (
        e.title.toLowerCase().includes(q) || 
        e.transaction_id?.toLowerCase().includes(q) ||
        e.contract_number?.toLowerCase().includes(q)
      );
    }
  });

  if (isLoading) return <div className="animate-pulse space-y-4">
    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}
  </div>;

  if (events.length === 0) return (
    <div className="text-center py-8 bg-muted/20 rounded-2xl border border-dashed border-border">
      <p className="text-sm text-muted-foreground italic">Nenhum histórico de transação encontrado.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 bg-card border border-border p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              ref={searchInputRef}
              placeholder="Buscar na linha do tempo... (Ctrl+F)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className="rounded-xl">
            <Filter className={cn("w-4 h-4", showFilters && "text-primary")} />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExportPDF} className="rounded-xl" title="Exportar PDF (Ctrl+E)">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare} className="rounded-xl" title="Compartilhar Filtros">
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border mt-2">
                {(['all', 'id', 'vendor', 'user', 'contract'] as const).map(f => (
                  <Button 
                    key={f}
                    variant={filterBy === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterBy(f)}
                    className="text-[10px] uppercase font-bold rounded-lg"
                  >
                    {f === 'all' ? 'Todos' : f === 'id' ? 'ID' : f === 'vendor' ? 'Fornecedor' : f === 'user' ? 'Usuário' : 'Contrato'}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative pl-6 border-l-2 border-primary/20 space-y-8 py-2">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-2xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground italic">Nenhum evento encontrado para os filtros selecionados.</p>
          </div>
        ) : filteredEvents.map((event, index) => (
          <motion.div 
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative"
          >
            <div className={`absolute -left-[27px] top-0 w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center z-10 ${
              event.status === 'success' ? 'border-green-500' : 
              event.status === 'failed' ? 'border-red-500' : 'border-amber-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                event.status === 'success' ? 'bg-green-500' : 
                event.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
              }`} />
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
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
              <p className="text-xs text-muted-foreground mb-3">{event.description}</p>
              
              <div className="grid grid-cols-2 gap-2 mt-auto">
                {event.transaction_id && (
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/60 uppercase tracking-tighter">
                    <ShieldCheck className="w-3 h-3" />
                    ID: {event.transaction_id}
                  </div>
                )}
                {event.contract_number && (
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/60 uppercase tracking-tighter">
                    <Icons.FileText className="w-3 h-3" />
                    Contrato: {event.contract_number}
                  </div>
                )}
              </div>

              {event.attachments && event.attachments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-2">
                  {event.attachments.map((att, i) => (
                    <div key={i} className="text-[8px] bg-primary/5 text-primary px-2 py-1 rounded flex items-center gap-1">
                      <Icons.Paperclip className="w-2.5 h-2.5" />
                      Anexo #{i + 1}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
