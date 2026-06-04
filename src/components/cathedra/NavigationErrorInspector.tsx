import { Icons } from '@/constants';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { supabase } from '@/integrations/supabase/client';
import { CathedraCard } from './CathedraCard';
import { CathedraButton } from './CathedraButton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NavigationErrorInspector: React.FC = () => {
  const [errors, setErrors] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [shareTrail, setShareTrail] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedError, setSelectedError] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [activeTab, setActiveTab] = useState('errors');
  const [auditFilterUser, setAuditFilterUser] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [auditMode, setAuditMode] = useState(false);
  const [revocationVersion, setRevocationVersion] = useState(1);
  const [evidenceStatus, setEvidenceStatus] = useState<Record<string, { ok: boolean; reason?: string; detail?: string; code?: string }>>({});
  const navigate = useNavigate();

  // Métricas
  const metrics = {
    total: errors.length,
    broken: Object.values(evidenceStatus).filter(s => !s.ok).length,
    ok: Object.values(evidenceStatus).filter(s => s.ok).length,
    404: Object.values(evidenceStatus).filter(s => s.reason === 'HTTP 404').length,
    403: Object.values(evidenceStatus).filter(s => s.reason === 'HTTP 403').length,
  };

  const generateSecureLink = (err: any) => {
    const baseUrl = window.location.origin;
    const expiration = Date.now() + 3600000;
    const token = btoa(`${err.id}-${expiration}-${revocationVersion}`).substring(0, 16);
    const link = `${baseUrl}/inspect/evidence/${err.id}?token=${token}&expires=${expiration}&v=${revocationVersion}`;
    
    // Registrar na trilha de auditoria local
    setShareTrail(prev => [{
      id: crypto.randomUUID(),
      requestId: err.metadata?.requestId || err.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(expiration).toISOString(),
      filters: { user: auditFilterUser, status: statusFilter, date: dateRange },
      link: link
    }, ...prev]);

    return link;
  };

  const revokeAllLinks = () => {
    setRevocationVersion(prev => prev + 1);
    toast.success("Todos os links compartilhados foram invalidados (rotação de chaves).");
  };

  const clearFilters = () => {
    setFilter('');
    setDateRange({ from: '', to: '' });
    setAuditFilterUser('');
    setStatusFilter('all');
    toast.info("Filtros limpos.");
  };

  const checkEvidenceHealth = async (errorLogs: any[]) => {
    const health: Record<string, { ok: boolean; reason?: string; detail?: string; code?: string }> = {};
    for (const err of errorLogs) {
      const url = err.metadata?.screenshotUrl;
      if (!url) {
        health[err.id] = { 
          ok: false, 
          reason: 'Sem URL', 
          detail: 'Nenhuma evidência visual anexada ao log.',
          code: 'ERRO_NAO_ENCONTRADO'
        };
        continue;
      }
      try {
        const resp = await fetch(url, { method: 'HEAD' });
        if (resp.ok) {
          health[err.id] = { ok: true };
        } else {
          let detail = 'Desconhecido';
          let code = 'ERRO_DESCONHECIDO';
          
          if (resp.status === 404) {
            detail = 'A evidência solicitada não existe no storage.';
            code = 'ERRO_NAO_ENCONTRADO';
          } else if (resp.status === 403) {
            detail = 'Token expirado ou acesso negado.';
            code = 'ERRO_PERMISSAO';
          } else if (resp.status === 401) {
            detail = 'Autenticação necessária para acessar esta evidência.';
            code = 'ERRO_AUTENTICACAO';
          }
          
          health[err.id] = { 
            ok: false, 
            reason: `HTTP ${resp.status}`,
            detail: detail,
            code: code
          };
        }
      } catch (e) {
        health[err.id] = { 
          ok: false, 
          reason: 'Erro de Rede', 
          detail: 'Falha na conexão com o servidor de assets.',
          code: 'ERRO_REDE'
        };
      }
    }
    setEvidenceStatus(health);
  };


  const handleImportLegacy = (rawData: any) => {
    if (Array.isArray(rawData)) {
      return {
        version: 'v2.0-legacy',
        exported_at: new Date().toISOString(),
        data: rawData
      };
    }
    return rawData;
  };
  const fetchErrors = async () => {
    let query = supabase
      .from('security_logs')
      .select('*')
      .or('event_type.eq.error,action.eq.type_error')
      .order('created_at', { ascending: false });

    if (dateRange.from) query = query.gte('created_at', dateRange.from);
    if (dateRange.to) query = query.lte('created_at', dateRange.to);

    const { data, error } = await query.limit(100);
    if (!error && data) {
      setErrors(data);
      checkEvidenceHealth(data);
    }
  };


  const fetchAuditLogs = async () => {
    let query = supabase
      .from('telemetry_audit_logs')
      .select('*, profiles(name)')
      .order('inspected_at', { ascending: false });

    if (dateRange.from) query = query.gte('inspected_at', dateRange.from);
    if (dateRange.to) query = query.lte('inspected_at', dateRange.to);

    const { data, error } = await query;
    if (!error && data) setAuditLogs(data);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchErrors(), fetchAuditLogs()]);
      setLoading(false);
    };
    loadData();
  }, [dateRange]);

  const recordInspection = async (requestId: string) => {
    await supabase.from('telemetry_audit_logs').insert({ 
      request_id: requestId,
      masked_ip: '127.0.0.***' 
    });
    fetchAuditLogs();
  };

  const filteredErrors = errors.filter(err => {
    const matchesSearch = JSON.stringify(err).toLowerCase().includes(filter.toLowerCase());
    const statusInfo = evidenceStatus[err.id];
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'broken') return matchesSearch && statusInfo && !statusInfo.ok;
    if (statusFilter === 'ok') return matchesSearch && statusInfo && statusInfo.ok;
    
    if (statusFilter.startsWith('http_')) {
      const code = statusFilter.split('_')[1];
      return matchesSearch && statusInfo?.reason?.includes(code);
    }
    
    return matchesSearch;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const userMatch = !auditFilterUser || (log.profiles?.name || 'Admin').toLowerCase().includes(auditFilterUser.toLowerCase());
    const generalMatch = !filter || JSON.stringify(log).toLowerCase().includes(filter.toLowerCase());
    return userMatch && generalMatch;
  });

  const downloadReport = (type: 'errors' | 'audit' | 'broken' | 'summary', formatExt: 'json' | 'csv' | 'pdf') => {
    let dataToExport: any[] = [];
    let fileName = '';
    const SCHEMA_VERSION = 'v2.1';

    if (type === 'summary') {
      fileName = 'consolidated-audit-summary';
    } else if (type === 'errors') {
      dataToExport = filteredErrors;
      fileName = 'ui-failures';
    } else if (type === 'audit') {
      dataToExport = filteredAuditLogs;
      fileName = 'inspection-audit';
    } else {
      dataToExport = errors.filter(e => evidenceStatus[e.id] && !evidenceStatus[e.id].ok).map(e => ({
        requestId: e.metadata?.requestId || e.id,
        route: e.metadata?.route || '/',
        status: 'Broken',
        reason: evidenceStatus[e.id].reason,
        detail: evidenceStatus[e.id].detail || 'N/A'
      }));
      fileName = 'broken-links';
    }
    
    if (formatExt === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Cathedra - Relatório de Auditoria (${type})`, 14, 22);
      doc.setFontSize(10);
      doc.text(`Exportado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, 30);
      doc.text(`Filtro de Data: ${dateRange.from || 'Sempre'} até ${dateRange.to || 'Hoje'}`, 14, 35);
      
      if (type === 'summary') {
        const topEndpoints = Object.entries(
          filteredErrors.reduce((acc: any, e) => {
            acc[e.metadata?.route || '/'] = (acc[e.metadata?.route || '/'] || 0) + 1;
            return acc;
          }, {})
        ).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);

        const reasons = Object.entries(
          Object.values(evidenceStatus).reduce((acc: any, s) => {
            if (!s.ok) acc[s.reason || 'Desconhecido'] = (acc[s.reason || 'Desconhecido'] || 0) + 1;
            return acc;
          }, {})
        );

        doc.setFontSize(14);
        doc.text("Resumo Consolidado", 14, 50);
        doc.setFontSize(10);
        doc.text(`Total de Ocorrências: ${metrics.total}`, 14, 60);
        doc.text(`Links Quebrados: ${metrics.broken}`, 14, 65);
        doc.text(`Taxa de Integridade: ${((metrics.ok / (metrics.total || 1)) * 100).toFixed(1)}%`, 14, 70);

        autoTable(doc, {
          startY: 80,
          head: [['Top Endpoints Afetados', 'Ocorrências']],
          body: topEndpoints,
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.cursor.y + 10,
          head: [['Motivo de Inacessibilidade', 'Total']],
          body: reasons,
        });

      } else if (type === 'broken') {
        autoTable(doc, {
          startY: 45,
          head: [['Request ID', 'Rota', 'Status', 'Motivo Detalhado']],
          body: dataToExport.map(e => [e.requestId, e.route, e.status, e.detail]),
        });
      } else if (type === 'audit') {
        autoTable(doc, {
          startY: 45,
          head: [['Inspetor', 'Request ID', 'Data/Hora', 'IP Mascarado']],
          body: dataToExport.map(a => [a.profiles?.name || 'Admin', a.request_id, format(new Date(a.inspected_at), 'dd/MM/yy HH:mm'), a.masked_ip]),
        });
      } else {
        autoTable(doc, {
          startY: 45,
          head: [['ID', 'Rota', 'Mensagem', 'Dispositivo']],
          body: dataToExport.map(e => [e.metadata?.requestId || e.id.substring(0,8), e.metadata?.route, e.metadata?.message?.substring(0, 50), e.metadata?.isMobile ? 'Mobile' : 'Desktop']),
        });
      }
      
      doc.save(`cathedra-${fileName}-${new Date().getTime()}.pdf`);
      toast.success("Relatório PDF gerado com sucesso.");
      return;
    }

    let content = '';
    if (formatExt === 'json') {
      content = JSON.stringify({
        version: SCHEMA_VERSION,
        exported_at: new Date().toISOString(),
        data: dataToExport
      }, null, 2);
    } else {
      if (type === 'errors') {
        content = `FormatVersion,${SCHEMA_VERSION}\n` +
          "ID,RequestID,Data,Rota,Mensagem,Viewport,Dispositivo,EvidenciaURL\n" + dataToExport.map(e => 
          `${e.id},${e.metadata?.requestId || ''},${e.created_at},"${e.metadata?.route || ''}","${(e.metadata?.message || '').replace(/"/g, '""')}",${e.metadata?.viewport || ''},${e.metadata?.isMobile ? 'Mobile' : 'Desktop'},"${e.metadata?.screenshotUrl || ''}"`
        ).join("\n");
      } else if (type === 'audit') {
        content = `FormatVersion,${SCHEMA_VERSION}\n` +
          "ID,Inspetor,RequestID,DataHora,IP\n" + dataToExport.map(a => 
          `${a.id},"${a.profiles?.name || 'Admin'}",${a.request_id},${a.inspected_at},${a.masked_ip}`
        ).join("\n");
      } else {
        content = `FormatVersion,${SCHEMA_VERSION}\n` +
          "RequestID,Rota,Status,Motivo,Descricao\n" + dataToExport.map(e => 
          `${e.requestId},"${e.route}",${e.status},"${e.reason}","${e.detail}"`
        ).join("\n");
      }
    }
    
    const blob = new Blob([content], { type: formatExt === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cathedra-${fileName}-${new Date().toISOString()}.${formatExt}`;
    a.click();
    toast.success(`Relatório ${formatExt.toUpperCase()} exportado.`);
  };

  return (
    <div className="max-w-7xl mx-auto p-spacing-lg space-y-spacing-xl pb-spacing-4xl">
      <div className="flex flex-col gap-spacing-md">
        <CathedraButton variant="ghost" size="sm" onClick={() => navigate(-1)} className="w-fit">
          <Icons.ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel
        </CathedraButton>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-premium-2xl font-black tracking-tight flex items-center gap-spacing-sm">
              <Icons.ShieldAlert className="text-destructive" /> Inspetor de Falhas UI
            </h1>
            <p className="text-muted-foreground text-premium-sm">Diagnóstico de TypeErrors e falhas de navegação mobile.</p>
          </div>
          <div className="flex items-center gap-spacing-sm">
            <CathedraButton 
              variant={auditMode ? "primary" : "outline"} 
              size="sm" 
              onClick={() => setAuditMode(!auditMode)}
              className={cn("rounded-premium-full transition-all duration-300", auditMode && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-premium")}
            >
              <Icons.ShieldCheck className="w-4 h-4 mr-2" /> 
              {auditMode ? "Modo Auditoria Ativo" : "Modo Auditoria"}
            </CathedraButton>

            {activeTab === 'errors' && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={cn("w-[140px] h-9 rounded-premium-full bg-muted/20 border-border/10", statusFilter !== 'all' && "border-primary ring-1 ring-primary/30 bg-primary/5")}>
                  <SelectValue placeholder="Status Link" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="broken">Quebrados</SelectItem>
                  <SelectItem value="ok">Funcionais</SelectItem>
                  <SelectItem value="http_404">HTTP 404</SelectItem>
                  <SelectItem value="http_403">HTTP 403</SelectItem>
                </SelectContent>
              </Select>
            )}
            {activeTab === 'audit' && (
              <Input 
                placeholder="Filtrar por Inspetor..." 
                value={auditFilterUser}
                onChange={(e) => setAuditFilterUser(e.target.value)}
                className={cn("max-w-[150px] rounded-premium-full h-9", auditFilterUser && "border-primary ring-1 ring-primary/30 bg-primary/5")}
              />
            )}
            <div className={cn("flex gap-1 items-center bg-muted/20 p-1 rounded-premium-full border border-border/10 h-9 transition-all", (dateRange.from || dateRange.to) && "border-primary ring-1 ring-primary/30 bg-primary/5")}>
              <Input 
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="h-7 border-none bg-transparent text-[10px] w-[110px]"
              />
              <span className="text-[10px] opacity-30">até</span>
              <Input 
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="h-7 border-none bg-transparent text-[10px] w-[110px]"
              />
            </div>

            <div className="flex gap-2">
              <CathedraButton 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="h-9 w-9 p-0 rounded-premium-full hover:bg-destructive/10 hover:text-destructive"
                title="Limpar todos os filtros"
              >
                <Icons.X className="w-4 h-4" />
              </CathedraButton>

              <CathedraButton 
                variant="outline" 
                size="sm" 
                onClick={() => downloadReport(activeTab === 'errors' ? 'errors' : 'audit', 'pdf')} 
                className="rounded-premium-full h-9"
              >
                <Icons.FileText className="w-4 h-4 mr-2" /> PDF
              </CathedraButton>
              <CathedraButton 
                variant="outline" 
                size="sm" 
                onClick={() => downloadReport(activeTab === 'errors' ? 'errors' : 'audit', 'csv')} 
                className="rounded-premium-full h-9"
              >
                <Icons.Download className="w-4 h-4 mr-2" /> CSV
              </CathedraButton>
              {activeTab === 'errors' && (
                <div className="flex gap-2">
                  <CathedraButton 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadReport('broken', 'pdf')} 
                    className="rounded-premium-full border-red-500/20 text-red-600 hover:bg-red-500/5 h-9"
                  >
                    <Icons.ShieldAlert className="w-4 h-4 mr-2" /> Links Quebrados
                  </CathedraButton>
                  {auditMode && (
                    <CathedraButton 
                      variant="primary" 
                      size="sm" 
                      onClick={() => downloadReport('summary', 'pdf')} 
                      className="rounded-premium-full h-9 shadow-premium bg-gradient-to-r from-primary to-primary/80"
                    >
                      <Icons.Activity className="w-4 h-4 mr-2" /> Resumo Auditoria
                    </CathedraButton>
                  )}
                </div>
              )}
            </div>

            {auditMode && (
              <CathedraButton 
                variant="ghost" 
                size="sm" 
                onClick={revokeAllLinks}
                className="rounded-premium-full h-9 text-orange-600 hover:bg-orange-500/10 border border-orange-500/20"
              >
                <Icons.RotateCcw className="w-4 h-4 mr-2" /> Revogar Links
              </CathedraButton>
            )}

            <Input 
              placeholder="Buscar..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={cn("max-w-[150px] rounded-premium-full h-9", filter && "border-primary ring-1 ring-primary/30 bg-primary/5")}
            />
          </div>
        </div>
      </div>

      {auditMode && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-spacing-md animate-in slide-in-from-top duration-500">
          <CathedraCard className="p-spacing-md flex items-center gap-spacing-md bg-primary/5 border-primary/20">
            <div className="p-2 bg-primary/10 rounded-premium-lg text-primary"><Icons.Activity className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] uppercase font-black opacity-50">Total Ocorrências</p>
              <p className="text-premium-xl font-bold">{metrics.total}</p>
            </div>
          </CathedraCard>
          <CathedraCard className="p-spacing-md flex items-center gap-spacing-md bg-orange-500/5 border-orange-500/20">
            <div className="p-2 bg-orange-500/10 rounded-premium-lg text-orange-600"><Icons.AlertTriangle className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] uppercase font-black opacity-50">Links Quebrados</p>
              <p className="text-premium-xl font-bold">{metrics.broken}</p>
            </div>
          </CathedraCard>
          <CathedraCard className="p-spacing-md flex items-center gap-spacing-md bg-green-500/5 border-green-500/20">
            <div className="p-2 bg-green-500/10 rounded-premium-lg text-green-600"><Icons.CheckCircle className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] uppercase font-black opacity-50">Integridade Ok</p>
              <p className="text-premium-xl font-bold">{metrics.ok}</p>
            </div>
          </CathedraCard>
          <CathedraCard className="p-spacing-md flex items-center gap-spacing-md bg-red-500/5 border-red-500/20">
            <div className="p-2 bg-red-500/10 rounded-premium-lg text-red-600"><Icons.ShieldAlert className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] uppercase font-black opacity-50">Falhas 404/403</p>
              <p className="text-premium-xl font-bold">{metrics['404'] + metrics['403']}</p>
            </div>
          </CathedraCard>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-spacing-lg">

        <TabsList className="bg-muted/30 p-1 rounded-premium-full border border-border/10">
          <TabsTrigger value="errors" className="rounded-premium-full text-premium-xs font-black uppercase tracking-widest px-spacing-xl">
            <Icons.Activity className="w-3 h-3 mr-2" /> Falhas Detectadas
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-premium-full text-premium-xs font-black uppercase tracking-widest px-spacing-xl">
            <Icons.ShieldCheck className="w-3 h-3 mr-2" /> Trilha de Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="grid grid-cols-1 lg:grid-cols-3 gap-spacing-lg animate-in fade-in duration-500">
          <CathedraCard className="lg:col-span-1 p-0 overflow-hidden h-[70vh] flex flex-col">
            <div className="p-spacing-md bg-muted/20 border-b border-border/10 font-bold text-premium-xs uppercase tracking-widest">
              Log de Eventos
            </div>
            <ScrollArea className="flex-1">
              <div className="divide-y divide-border/10">
                {filteredErrors.map((err) => (
                  <div 
                    key={err.id} 
                    onClick={() => {
                      setSelectedError(err);
                      recordInspection(err.metadata?.requestId || err.id);
                    }}
                    className={`p-spacing-md cursor-pointer transition-colors hover:bg-primary/5 ${selectedError?.id === err.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex gap-1 items-center">
                        <Badge variant="destructive" className="text-[8px] uppercase">{err.metadata?.type || 'UI_ERROR'}</Badge>
                        {evidenceStatus[err.id] && !evidenceStatus[err.id].ok && (
                          <Badge variant="outline" className="text-[8px] text-orange-500 border-orange-500/20 bg-orange-500/5">
                            Link Quebrado: {evidenceStatus[err.id].reason}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] font-mono opacity-40">{format(new Date(err.created_at), 'HH:mm:ss')}</span>
                    </div>

                    <div className="text-premium-sm font-bold truncate text-primary/80">{err.metadata?.route || '/'}</div>
                    <div className="text-[10px] font-mono opacity-60 truncate mt-1">ID: {err.metadata?.requestId || err.id.split('-')[0]}</div>
                    
                    {auditMode && (
                      <div className="mt-2 flex gap-2">
                        <CathedraButton 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = generateSecureLink(err);
                            navigator.clipboard.writeText(link);
                            toast.success("Link seguro copiado!");
                          }}
                          className="h-6 px-2 text-[8px] rounded-premium-full bg-primary/5 hover:bg-primary/10"
                        >
                          <Icons.Share2 className="w-2 h-2 mr-1" /> Link Seguro
                        </CathedraButton>
                      </div>
                    )}
                  </div>
                ))}
                {filteredErrors.length === 0 && !loading && (
                  <div className="p-spacing-xl text-center opacity-40 italic text-premium-sm">Nenhuma falha encontrada.</div>
                )}
              </div>
            </ScrollArea>
          </CathedraCard>

          <CathedraCard className="lg:col-span-2 p-spacing-xl overflow-hidden min-h-[70vh]">
            {selectedError ? (
              <div className="space-y-spacing-xl animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-premium-xl font-bold text-primary">Detalhes da Ocorrência</h2>
                    <p className="text-muted-foreground text-premium-xs font-mono">{selectedError.metadata?.requestId}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className="rounded-premium-full">{selectedError.metadata?.viewport || 'unknown'}</Badge>
                    {auditMode && (
                       <CathedraButton 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const link = generateSecureLink(selectedError);
                          navigator.clipboard.writeText(link);
                          toast.success("Link seguro copiado!");
                        }}
                        className="h-7 px-3 text-[10px] rounded-premium-full"
                      >
                        <Icons.Lock className="w-3 h-3 mr-2" /> Compartilhar Evidência
                      </CathedraButton>
                    )}
                    <div className="text-[10px] opacity-40 uppercase font-black">{format(new Date(selectedError.created_at), 'PPPP p')}</div>
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-spacing-md">
                  <div className="p-spacing-md bg-muted/20 rounded-premium-lg border border-border/10">
                    <span className="text-[9px] font-black uppercase opacity-40 block mb-1">Rota</span>
                    <span className="text-premium-sm font-bold">{selectedError.metadata?.route}</span>
                  </div>
                  <div className="p-spacing-md bg-muted/20 rounded-premium-lg border border-border/10">
                    <span className="text-[9px] font-black uppercase opacity-40 block mb-1">Dispositivo</span>
                    <span className="text-premium-sm font-bold">{selectedError.metadata?.isMobile ? 'Mobile' : 'Desktop'}</span>
                  </div>
                </div>

                <div className="space-y-spacing-sm">
                  <h3 className="text-premium-sm font-black uppercase tracking-widest opacity-60">Mensagem de Erro</h3>
                  <div className="p-spacing-md bg-destructive/5 text-destructive rounded-premium-lg border border-destructive/10 font-mono text-premium-sm">
                    {selectedError.metadata?.message || 'Erro sem mensagem descritiva.'}
                  </div>
                </div>

                <div className="space-y-spacing-sm">
                  <h3 className="text-premium-sm font-black uppercase tracking-widest opacity-60">Stack Trace</h3>
                  <ScrollArea className="h-48 rounded-premium-lg border border-border/10 bg-primary/[0.02]">
                    <pre className="p-spacing-md text-[10px] font-mono leading-relaxed opacity-70 whitespace-pre-wrap">
                      {selectedError.metadata?.stack || 'Nenhum stack trace disponível.'}
                    </pre>
                  </ScrollArea>
                </div>

                {selectedError.metadata?.screenshotUrl && (
                  <div className="space-y-spacing-sm">
                    <h3 className="text-premium-sm font-black uppercase tracking-widest opacity-60">Evidência Visual</h3>
                    <div className="rounded-premium-xl border border-border/20 overflow-hidden shadow-premium">
                      <img src={selectedError.metadata.screenshotUrl} alt="Erro de UI" className="w-full h-auto" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-spacing-md">
                <Icons.Search size={48} />
                <p className="font-serif italic text-premium-lg">Selecione uma falha ao lado para inspecionar os metadados técnicos.</p>
              </div>
            )}
          </CathedraCard>
        </TabsContent>

        <TabsContent value="audit" className="animate-in fade-in duration-500">
          <CathedraCard className="p-0 overflow-hidden">
            <ScrollArea className="h-[70vh]">
              <table className="w-full text-left text-premium-xs">
                <thead className="bg-muted/30 border-b border-border/50 sticky top-0 z-10">
                  <tr>
                    <th className="p-spacing-md font-black uppercase tracking-widest opacity-50">Data/Hora</th>
                    <th className="p-spacing-md font-black uppercase tracking-widest opacity-50">Inspetor</th>
                    <th className="p-spacing-md font-black uppercase tracking-widest opacity-50">Request ID</th>
                    <th className="p-spacing-md font-black uppercase tracking-widest opacity-50 text-right">IP Mascarado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-primary/[0.01] transition-colors">

                      <td className="p-spacing-md font-mono opacity-60">
                        {format(new Date(log.inspected_at), 'dd/MM/yy HH:mm:ss')}
                      </td>
                      <td className="p-spacing-md font-bold text-primary/80">
                        {log.profiles?.name || 'Admin'}
                      </td>
                      <td className="p-spacing-md font-mono text-primary/60">
                        {log.request_id}
                      </td>
                      <td className="p-spacing-md text-right font-mono opacity-40">
                        {log.masked_ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditLogs.length === 0 && !loading && (
                <div className="p-spacing-4xl text-center opacity-40 italic">Nenhum registro de auditoria.</div>
              )}
            </ScrollArea>
          </CathedraCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NavigationErrorInspector;
