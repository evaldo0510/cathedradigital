import React, { useState, useEffect } from 'react';
import { runA11yAudit } from '@/lib/a11y-audit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="max-w-spacing-4xl mx-auto py-spacing-xl px-spacing-md space-y-spacing-xl animate-in fade-in duration-500">
      <header className="text-center space-y-spacing-md">
        <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 rounded-premium text-primary border border-primary/20">
          <Icons.ShieldCheck className="w-spacing-md h-spacing-md" />
          <span className="text-premium-xs font-black uppercase tracking-[0.2em]">Quality Assurance</span>
        </div>
        <h1 className="text-premium-4xl font-serif font-bold text-foreground">Auditoria de Acessibilidade</h1>
        <p className="text-muted-foreground italic font-serif">Validação manual e automatizada para NVDA e VoiceOver.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg">
        <Card className="border-primary/20 bg-card  rounded-[2rem] shadow-premium-hover overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-border/50">
            <CardTitle className="text-premium-lg font-black uppercase tracking-widest flex items-center gap-spacing-xs">
              <Icons.ShieldCheck className="w-spacing-md h-spacing-md text-primary" />
              Checklist Manual
            </CardTitle>
          </CardHeader>
          <CardContent className="p-spacing-lg space-y-spacing-lg">
            {sections.map(section => (
              <div key={section.title} className="space-y-spacing-sm">
                <h3 className="text-premium-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-border/40 pb-spacing-2xs">
                  {section.title}
                </h3>
                <div className="space-y-spacing-xs">
                  {section.items.map(item => (
                    <Button
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      className="w-full flex items-center justify-between p-spacing-sm rounded-premium-full border border-border/40 bg-background/50 hover:bg-muted/30 transition-all group"
                    >
                      <span className="text-premium-sm font-medium text-foreground/80 group-hover:text-foreground">{item.label}</span>
                      {checklist[item.id] ? (
                        <Icons.CheckCircle className="w-spacing-md h-spacing-md text-green-500 fill-green-500/10" />
                      ) : (
                        <div className="w-spacing-md h-spacing-md rounded-premium border-2 border-border/60" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-secondary/20 bg-card  rounded-[2rem] shadow-premium-hover overflow-hidden">
          <CardHeader className="bg-secondary/5 border-b border-border/50">
            <CardTitle className="text-premium-lg font-black uppercase tracking-widest flex items-center justify-between">
              <div className="flex items-center gap-spacing-xs">
                <Icons.Key className="w-spacing-md h-spacing-md text-secondary" />
                Auditoria Técnica
              </div>
              <Button size="sm" onClick={performAudit} className="rounded-premium-full h-spacing-xl text-premium-xs font-black uppercase tracking-widest bg-secondary hover:bg-secondary/80">
                Escanear DOM
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-spacing-lg space-y-spacing-md">
            {!auditResults ? (
              <div className="flex flex-col items-center justify-center py-spacing-3xl text-center space-y-spacing-md opacity-40">
                <Icons.Search className="w-spacing-2xl h-spacing-2xl" />
                <p className="text-premium-sm font-serif italic">Clique em Escanear para validar referências ARIA e IDs duplicados nesta página.</p>
              </div>
            ) : (
              <div className="space-y-spacing-md">
                <div className={`p-spacing-md rounded-premium-full flex items-center gap-spacing-sm ${auditResults.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  {auditResults.success ? (
                    <>
                      <Icons.CheckCircle className="w-spacing-lg h-spacing-lg text-green-500" />
                      <p className="text-premium-sm font-bold text-green-600">Nenhum problema técnico detectado no DOM atual.</p>
                    </>
                  ) : (
                    <>
                      <Icons.XCircle className="w-spacing-lg h-spacing-lg text-red-500" />
                      <p className="text-premium-sm font-bold text-red-600">{auditResults.issues.length} problemas encontrados.</p>
                    </>
                  )}
                </div>

                <div className="space-y-spacing-xs max-h-[400px] overflow-y-auto pr-spacing-xs scrollbar-thin">
                  {auditResults.issues.map((issue, idx) => (
                    <div key={idx} className="flex gap-spacing-sm p-spacing-sm rounded-premium bg-muted/20 border border-border/40">
                      <Icons.AlertTriangle className="w-spacing-md h-spacing-md text-amber-500 shrink-0 mt-spacing-3xs" />
                      <span className="text-premium-xs text-muted-foreground leading-relaxed">{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="text-center pt-spacing-xl">
        <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground opacity-50">
          Cathedra Digital — Protocolo de Acessibilidade v2.0
        </p>
      </footer>
    </div>
  );
};

export default A11yAuditPage;
