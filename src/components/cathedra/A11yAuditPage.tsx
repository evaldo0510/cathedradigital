import React, { useState, useEffect } from 'react';
import { runA11yAudit } from '@/lib/a11y-audit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck, Search, Tag, Key } from 'lucide-react';
import { Icons } from '@/constants';

const A11yAuditPage = () => {
  const [auditResults, setAuditResults] = useState<{ success: boolean; issues: string[] } | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const performAudit = () => {
    const results = runA11yAudit();
    setAuditResults(results);
  };

  const sections = [
    {
      title: "SearchResultCard & Teclado",
      items: [
        { id: 'src-role', label: "SearchResultCard tem role='button'?" },
        { id: 'src-keyboard', label: "SearchResultCard ativa com Enter e Espaço?" },
        { id: 'src-focus', label: "SearchResultCard tem anel de foco visível (ring)?" },
        { id: 'src-label', label: "Aria-label anuncia Título + Subtítulo + Ação?" },
        { id: 'src-empty', label: "Foco pula para o próximo item quando não há resultados?" }
      ]
    },
    {
      title: "Roving Tabindex (Tags/Bolhas)",
      items: [
        { id: 'tag-nav', label: "Navegação por setas (Dir/Esq) funciona entre tags?" },
        { id: 'tag-home-end', label: "Home/End levam ao início/fim da lista de tags?" },
        { id: 'tag-tabindex', label: "Apenas a tag ativa tem tabIndex=0?" },
        { id: 'tag-active-reset', label: "Foco reseta para a primeira tag ao trocar filtro/categoria?" },
        { id: 'tag-aria-pressed', label: "Estado de seleção é anunciado (aria-pressed)?" }
      ]
    },
    {
      title: "Abas & Estrutura ARIA",
      items: [
        { id: 'tab-aria', label: "Abas usam role='tablist', 'tab' e 'tabpanel'?" },
        { id: 'tab-controls', label: "aria-controls e aria-labelledby estão corretos?" },
        { id: 'tab-ids', label: "Não existem IDs duplicados em runtime?" }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-500">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary border border-primary/20">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quality Assurance</span>
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground">Auditoria de Acessibilidade</h1>
        <p className="text-muted-foreground italic font-serif">Validação manual e automatizada para NVDA e VoiceOver.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-xl rounded-[2rem] shadow-xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-border/50">
            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
              <Icons.ShieldCheck className="w-5 h-5 text-primary" />
              Checklist Manual
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {sections.map(section => (
              <div key={section.title} className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-border/40 pb-1">
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border/40 bg-background/50 hover:bg-muted/30 transition-all group"
                    >
                      <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">{item.label}</span>
                      {checklist[item.id] ? (
                        <CheckCircle className="w-5 h-5 text-green-500 fill-green-500/10" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-border/60" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-secondary/20 bg-card/50 backdrop-blur-xl rounded-[2rem] shadow-xl overflow-hidden">
          <CardHeader className="bg-secondary/5 border-b border-border/50">
            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-secondary" />
                Auditoria Técnica
              </div>
              <Button size="sm" onClick={performAudit} className="rounded-xl h-8 text-[10px] font-black uppercase tracking-widest bg-secondary hover:bg-secondary/80">
                Escanear DOM
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {!auditResults ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
                <Search className="w-12 h-12" />
                <p className="text-sm font-serif italic">Clique em Escanear para validar referências ARIA e IDs duplicados nesta página.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl flex items-center gap-3 ${auditResults.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  {auditResults.success ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <p className="text-sm font-bold text-green-600">Nenhum problema técnico detectado no DOM atual.</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-500" />
                      <p className="text-sm font-bold text-red-600">{auditResults.issues.length} problemas encontrados.</p>
                    </>
                  )}
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                  {auditResults.issues.map((issue, idx) => (
                    <div key={idx} className="flex gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground leading-relaxed">{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="text-center pt-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
          Cathedra Digital — Protocolo de Acessibilidade v2.0
        </p>
      </footer>
    </div>
  );
};

export default A11yAuditPage;
