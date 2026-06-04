import React, { useState, useEffect } from 'react';
import { runMobileA11yAudit } from '@/lib/mobile-a11y-audit';
import { CathedraCard } from './CathedraCard';
import { CathedraButton } from './CathedraButton';
import { Icons } from '@/constants';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const A11yAuditPage: React.FC = () => {
  const [issues, setIssues] = useState<Array<{ message: string; type: 'error' | 'warning' | 'info'; selector?: string }>>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const navigate = useNavigate();

  const downloadResults = (format: 'json' | 'csv') => {
    const data = format === 'json' 
      ? JSON.stringify(issues, null, 2)
      : "Tipo,Mensagem,Seletor\n" + issues.map(i => `${i.type},"${i.message}","${i.selector || ''}"`).join("\n");
    
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-a11y-${new Date().toISOString()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Relatório ${format.toUpperCase()} exportado com sucesso.`);
  };

  const performAudit = () => {

    setIsAuditing(true);
    setTimeout(() => {
      const result = runMobileA11yAudit();
      setIssues(result.issues);
      setIsAuditing(false);
      
      if (result.success) {
        toast.success("Auditoria completa: Nenhum problema crítico encontrado!");
      } else {
        const errors = result.issues.filter(i => i.type === 'error').length;
        toast.warning(`Encontrados ${result.issues.length} pontos de atenção (${errors} erros).`);
      }
    }, 500);
  };

  useEffect(() => {
    performAudit();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-spacing-lg space-y-spacing-xl pb-spacing-4xl">
      <div className="flex flex-col gap-spacing-md">
        <CathedraButton 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="w-fit"
        >
          <Icons.ArrowLeft className="w-spacing-md h-spacing-md mr-spacing-xs" /> Voltar
        </CathedraButton>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-premium-2xl font-black tracking-tight flex items-center gap-spacing-sm">
              <Icons.Activity className="text-primary" /> Auditoria A11y Mobile
            </h1>
            <p className="text-muted-foreground text-premium-sm">Verificação automática de WCAG AA e áreas de toque.</p>
          </div>
          <CathedraButton 
            onClick={performAudit} 
            disabled={isAuditing}
            className="rounded-premium-full"
          >
            {isAuditing ? "Auditando..." : "Nova Varredura"}
          </CathedraButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-spacing-lg">
        <CathedraCard className="p-spacing-lg">
          <div className="flex items-center justify-between mb-spacing-lg">
            <h3 className="text-premium-xs font-black uppercase tracking-widest opacity-50">Findings ({issues.length})</h3>
            <div className="flex gap-spacing-xs">
              <Badge variant="outline">{issues.filter(i => i.type === 'warning').length} Warnings</Badge>
              <Badge variant="destructive">{issues.filter(i => i.type === 'error').length} Errors</Badge>
            </div>
          </div>

          <ScrollArea className="h-[60vh]">
            {issues.length > 0 ? (
              <div className="space-y-spacing-md">
                {issues.map((issue, i) => (
                  <div key={i} className="flex flex-col gap-spacing-xs p-spacing-md bg-muted/20 rounded-premium-md border border-border/10 group">
                    <div className="flex items-start gap-spacing-md">
                      {issue.type === 'error' ? (
                        <Icons.AlertCircle className="text-red-500 shrink-0 mt-1" />
                      ) : (
                        <Icons.AlertTriangle className="text-orange-500 shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <span className="text-premium-sm font-bold">{issue.message}</span>
                        {issue.selector && (
                          <div className="mt-spacing-xs">
                            <code className="text-[10px] bg-primary/5 text-primary/60 px-spacing-xs py-spacing-3xs rounded block font-mono break-all">
                              Classes: {issue.selector}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-spacing-4xl opacity-50 italic">
                <Icons.CheckCircle className="w-spacing-2xl h-spacing-2xl text-green-500 mb-spacing-md" />
                <p>Nenhum problema de acessibilidade detectado nesta página.</p>
              </div>
            )}
          </ScrollArea>
        </CathedraCard>
      </div>
    </div>
  );
};

export default A11yAuditPage;
