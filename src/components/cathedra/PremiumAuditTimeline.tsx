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
  Filter,
  FileText,
  Paperclip,
  Save,
  Trash2,
  ExternalLink,
  ChevronDown,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSavedFilters, SavedFilter } from '@/hooks/useSavedFilters';
import { SavedFiltersManager } from './SavedFiltersManager';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [newFilterName, setNewFilterName] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [exportRange, setExportRange] = useState<'all' | 'visible'>('all');
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  
  const { filters, saveFilter, deleteFilter } = useSavedFilters('premium-audit');
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

    txs?.forEach((tx: any) => {
      const metadata = tx.webhook_payload as any;
      auditEvents.push({
        id: `tx-${tx.id}`,
        type: 'payment_attempt',
        status: tx.status === 'approved' ? 'success' : tx.status === 'pending' ? 'pending' : 'failed',
        title: `Pagamento ${tx.status === 'approved' ? 'Aprovado' : tx.status === 'pending' ? 'Pendente' : 'Falhou'}`,
        description: `${tx.description || 'Assinatura PRO'} - R$ ${tx.amount}`,
        timestamp: tx.created_at,
        transaction_id: tx.payment_id,
        user_id: tx.user_id,
        contract_number: metadata?.contract_number || `CTR-${tx.id.slice(0, 6)}`,
        vendor: metadata?.vendor || 'Stripe/Paddle',
        attachments: metadata?.attachments || []
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

  const handleExportPDF = useCallback((range: 'all' | 'visible' = 'all') => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Linha do Tempo de Auditoria Premium', 14, 22);
    
    const eventsToExport = range === 'visible' 
      ? events.filter(e => {
          const q = searchQuery.toLowerCase();
          if (!q) return true;
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
        })
      : events;

    const tableData = eventsToExport.map(e => [
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
    const eventsWithAttachments = eventsToExport.filter(e => e.attachments && e.attachments.length > 0);
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

    doc.save(`audit_timeline_${userId}_${range}.pdf`);
    toast.success(`PDF (${range === 'all' ? 'Completo' : 'Filtrado'}) gerado com sucesso!`);
  }, [events, userId, searchQuery, filterBy]);

  const handleApplyFilter = (filter: SavedFilter) => {
    setSearchQuery(filter.query || '');
    setFilterBy((filter.filter_by as any) || 'all');
    toast.success(`Filtro "${filter.name}" aplicado!`);
  };

  const handleSaveCurrentFilter = () => {
    if (!newFilterName) {
      toast.error('Dê um nome ao filtro');
      return;
    }
    saveFilter(newFilterName, searchQuery, filterBy);
    setNewFilterName('');
    setIsSaveDialogOpen(false);
    toast.success('Filtro salvo com sucesso!');
  };

  const handleShare = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('q', searchQuery);
    url.searchParams.set('f', filterBy);
    navigator.clipboard.writeText(url.toString());
    toast.success('Combinação de filtros copiada para a área de transferência!');
  }, [searchQuery, filterBy]);

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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'f') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
        if (e.key === 'e') {
          e.preventDefault();
          handleExportPDF('all');
        }
        if (e.key === 'i') {
          e.preventDefault();
          setShowFilters(prev => !prev);
        }
      }
      
      // Item navigation
      if (e.key === 'Escape') {
        setSelectedEventId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExportPDF, selectedEventId, filteredEvents]);

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

          <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl" title="Salvar Filtros">
                <Save className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Salvar combinação de filtros</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Nome do Filtro</label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Pagamentos Aprovados 2024" 
                    value={newFilterName}
                    onChange={(e) => setNewFilterName(e.target.value)}
                  />
                </div>
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  <strong>Query:</strong> {searchQuery || '(Vazio)'} <br/>
                  <strong>Filtro:</strong> {filterBy}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveCurrentFilter}>Salvar Filtro</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl" title="Exportar PDF">
                <Download className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportPDF('all')}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar Tudo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportPDF('visible')}>
                <Search className="w-4 h-4 mr-2" />
                Exportar Visível ({filteredEvents.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" onClick={handleShare} className="rounded-xl" title="Copiar Link com Filtros">
            <ExternalLink className="w-4 h-4" />
          </Button>

          <Sheet open={isManagerOpen} onOpenChange={setIsManagerOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl" title="Gerenciar Filtros Salvos">
                <Settings className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Gerenciar Filtros Salvos</SheetTitle>
              </SheetHeader>
              <div className="py-6">
                <SavedFiltersManager 
                  projectId="premium-audit" 
                  onApply={(f) => {
                    handleApplyFilter(f);
                    setIsManagerOpen(false);
                  }} 
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border mt-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground w-full mb-1">Filtros Salvos:</span>
            {filters.slice(0, 5).map(f => (
              <div key={f.id} className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 pr-2 border border-border">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleApplyFilter(f)}
                  className="h-6 text-[10px] px-2 hover:bg-primary/10"
                >
                  {f.name}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-4 w-4">
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set('q', f.query || '');
                      url.searchParams.set('f', f.filter_by || 'all');
                      navigator.clipboard.writeText(url.toString());
                      toast.success('Link do filtro copiado!');
                    }}>
                      <ExternalLink className="h-3 w-3 mr-2" /> Compartilhar Link
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => deleteFilter(f.id)}>
                      <Trash2 className="h-3 w-3 mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {filters.length > 5 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[10px] px-2 text-primary"
                onClick={() => setIsManagerOpen(true)}
              >
                +{filters.length - 5} mais
              </Button>
            )}
          </div>
        )}

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

            <div 
              className={cn(
                "bg-card border border-border/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer relative",
                selectedEventId === event.id && "ring-2 ring-primary border-primary"
              )}
              onClick={() => setSelectedEventId(selectedEventId === event.id ? null : event.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSelectedEventId(event.id);
                if (e.key === 'Escape') setSelectedEventId(null);
              }}
            >
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
              
              <AnimatePresence>
                {(selectedEventId === event.id) ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-muted-foreground mb-3">{event.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-auto pb-2">
                      {event.transaction_id && (
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/60 uppercase tracking-tighter">
                          <ShieldCheck className="w-3 h-3" />
                          ID: {event.transaction_id}
                        </div>
                      )}
                      {event.contract_number && (
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/60 uppercase tracking-tighter">
                          <FileText className="w-3 h-3" />
                          Contrato: {event.contract_number}
                        </div>
                      )}
                      {event.vendor && (
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/60 uppercase tracking-tighter">
                          <CreditCard className="w-3 h-3" />
                          Fornecedor: {event.vendor}
                        </div>
                      )}
                    </div>

                    {event.attachments && event.attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-2">
                        {event.attachments.map((att, i) => (
                          <div key={i} className="text-[8px] bg-primary/5 text-primary px-2 py-1 rounded flex items-center gap-1">
                            <Paperclip className="w-2.5 h-2.5" />
                            Anexo #{i + 1}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEventId(null);
                      }}>
                        Fechar Detalhes (Esc)
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <p className="text-xs text-muted-foreground line-clamp-1 italic">Clique para ver detalhes...</p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
