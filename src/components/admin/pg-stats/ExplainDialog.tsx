import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Play, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery: string;
}

export function ExplainDialog({ open, onOpenChange, initialQuery }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [analyze, setAnalyze] = useState(false);
  const [running, setRunning] = useState(false);
  const [plan, setPlan] = useState<string>('');

  // Reset when the initial query changes (i.e., different row selected)
  if (open && initialQuery !== query && plan === '') {
    // no-op: seed on first open handled below
  }

  const run = async () => {
    setRunning(true);
    setPlan('');
    try {
      const { data, error } = await supabase.rpc('admin_explain_query' as never, {
        p_query: query,
        p_analyze: analyze,
      } as never);
      if (error) throw error;
      setPlan((data as string) || '');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Falha no EXPLAIN: ${msg}`);
      setPlan(`-- ERRO --\n${msg}`);
    } finally {
      setRunning(false);
    }
  };

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(plan);
      toast.success('Plano copiado');
    } catch {
      toast.error('Falha ao copiar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (v) { setQuery(initialQuery); setPlan(''); setAnalyze(false); }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>EXPLAIN da query</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="explain-query">Query (substitua placeholders $1, $2 por valores literais)</Label>
            <Textarea
              id="explain-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="font-mono text-xs min-h-[140px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Apenas SELECT/WITH. DDL e escrita bloqueados no servidor.
              Placeholders <code>$1</code> devem ser substituídos por valores reais.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="analyze"
              checked={analyze}
              onCheckedChange={(v) => setAnalyze(v === true)}
            />
            <Label htmlFor="analyze" className="cursor-pointer text-sm">
              ANALYZE + BUFFERS <span className="text-muted-foreground">(executa a query de verdade)</span>
            </Label>
            <Button onClick={run} disabled={running} size="sm" className="ml-auto">
              <Play className="h-3.5 w-3.5 mr-1" />
              {running ? 'Executando...' : 'Executar EXPLAIN'}
            </Button>
          </div>

          {plan && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Plano de execução</Label>
                <Button size="sm" variant="ghost" onClick={copyPlan}>
                  <Copy className="h-3 w-3 mr-1" /> Copiar
                </Button>
              </div>
              <pre className="text-xs bg-muted p-3 rounded border overflow-x-auto whitespace-pre">
                {plan}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
