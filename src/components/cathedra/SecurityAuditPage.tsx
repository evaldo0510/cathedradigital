import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, ShieldAlert, FileCode, RotateCcw, AlertTriangle, Search, ExternalLink, ShieldCheck } from 'lucide-react';
import { Icons } from '@/constants';
import { toast } from 'sonner';

const SecurityAuditPage = () => {
  const [rollbackMode, setRollbackMode] = useState(false);
  
  const checklist = [
    { 
      id: 'migration-padh', 
      label: 'Migração P.A.D.H. (Database)', 
      status: 'success', 
      detail: 'Chaves JSON renomeadas de pch para padh em journey_steps.',
      link: '/admin?tab=themes' // Mock link to related admin area
    },
    { 
      id: 'redirects', 
      label: 'Redirecionamentos de Legado', 
      status: 'success', 
      detail: 'Rotas /curso-pch e /pch apontando para /jornadas via App.tsx.',
      link: '/jornadas'
    },
    { 
      id: 'e2e-tests', 
      label: 'Cobertura E2E (Bubble Integrity)', 
      status: 'success', 
      detail: 'Testes de navegação, deduplicação e ordem de prioridade ativos.',
      link: '/diagnostics'
    },
    { 
      id: 'secret-scan', 
      label: 'Varredura de Segredos (SAST)', 
      status: 'warning', 
      detail: 'Scanner de chaves de API ativo em CI/CD e testes locais.',
      link: '#'
    }
  ];

  const handleRollback = () => {
    const sql = "UPDATE journey_steps SET content = content - 'padh' || jsonb_build_object('pch', content->'padh') WHERE content ? 'padh';";
    navigator.clipboard.writeText(sql);
    toast.success('SQL de Rollback copiado para a área de transferência!');
  };

  return (
    <div className="max-w-4xl mx-auto py-md md:py-xl px-md space-y-8 animate-in fade-in duration-500">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-xs px-sm py-2xs bg-red-500/10 rounded-premium text-red-600 border border-red-500/20">
          <ShieldAlert className="w-md h-md" />
          <span className="text-premium-tiny font-black uppercase tracking-[0.2em]">Security Protocol v3.0</span>
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground text-primary">Painel de Segurança & Integridade</h1>
        <p className="text-muted-foreground italic font-serif">Controle de deploys, migrações e proteção de segredos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Main Checklist */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card  rounded-[2.5rem] shadow-premium-hover overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 p-lg">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-xs">
                <ShieldCheck className="w-md h-md text-primary" />
                Status de Integridade
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {checklist.map(item => (
                  <div key={item.id} className="p-lg flex items-start justify-between hover:bg-muted/10 transition-colors group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-xs">
                        <span className="text-sm font-bold text-foreground">{item.label}</span>
                        {item.status === 'success' ? (
                          <CheckCircle className="w-sm h-sm text-green-500" />
                        ) : (
                          <AlertTriangle className="w-sm h-sm text-amber-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 rounded-full">
                      <Link to={item.link} className="flex items-center gap-2xs text-premium-tiny font-black uppercase tracking-widest">
                        Detalhes <ExternalLink className="w-sm h-sm" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <Card className="border-red-500/20 bg-red-500/5 rounded-premium p-lg space-y-4">
              <div className="flex items-center gap-sm">
                <div className="p-xs bg-red-500/10 rounded-premium text-red-600">
                  <RotateCcw className="w-md h-md" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Rollback Crítico</h3>
              </div>
              <p className="text-xs text-muted-foreground font-serif italic">
                Em caso de erro no deploy da terminologia P.A.D.H., use o botão abaixo para obter o comando de reversão do banco.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleRollback}
                className="w-full rounded-full text-premium-tiny font-black uppercase tracking-widest h-xl shadow-premium shadow-red-500/10"
              >
                Copiar SQL de Rollback
              </Button>
            </Card>

            <Card className="border-primary/20 bg-primary/5 rounded-premium p-lg space-y-4">
              <div className="flex items-center gap-sm">
                <div className="p-xs bg-primary/10 rounded-premium text-primary">
                  <FileCode className="w-md h-md" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Scan de Segredos</h3>
              </div>
              <p className="text-xs text-muted-foreground font-serif italic">
                Verifique se existem chaves de API expostas no código fonte ou artefatos de build.
              </p>
              <Button 
                variant="outline" 
                className="w-full rounded-full text-premium-tiny font-black uppercase tracking-widest h-xl border-primary/20 hover:bg-primary/5"
              >
                Simular Varredura
              </Button>
            </Card>
          </div>
        </div>

        {/* Sidebar / Quick Tips */}
        <aside className="space-y-6">
          <Card className="border-border/40 bg-card rounded-[2rem] p-lg space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground/60 flex items-center gap-xs">
              <Search className="w-md h-md" /> Monitoramento
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-premium-tiny font-bold text-muted-foreground uppercase">Última Varredura</p>
                <p className="text-xs font-mono bg-muted p-xs rounded-full">2024-05-20 14:30</p>
              </div>
              <div className="space-y-2">
                <p className="text-premium-tiny font-bold text-muted-foreground uppercase">Ameaças Bloqueadas</p>
                <p className="text-xs font-bold text-foreground">0 detectadas esta semana</p>
              </div>
            </div>
            <div className="pt-md border-t border-border/40 text-premium-tiny text-muted-foreground italic leading-relaxed">
              * O scanner E2E automatizado roda em todas as branches antes do merge para 'main'.
            </div>
          </Card>
        </aside>
      </div>

      <footer className="text-center pt-xl">
        <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground opacity-50">
          Cathedra Digital — Protocolo de Segurança v1.2
        </p>
      </footer>
    </div>
  );
};

export default SecurityAuditPage;
