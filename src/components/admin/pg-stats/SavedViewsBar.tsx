import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Save, Bookmark, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export interface PgStatViewConfig {
  orderBy: string;
  limit: number;
  minCalls: number;
  opFilter: string;
  tableFilter: string;
}

interface SavedView {
  id: string;
  name: string;
  config: PgStatViewConfig;
}

interface Props {
  current: PgStatViewConfig;
  onApply: (cfg: PgStatViewConfig) => void;
}

export function SavedViewsBar({ current, onApply }: Props) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await (supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          order: (col: string, opts: { ascending: boolean }) => Promise<{ data: SavedView[] | null; error: unknown }>;
        };
      };
    })
      .from('pg_stats_admin_views')
      .select('id,name,config')
      .order('name', { ascending: true });
    if (error) return;
    setViews((data as SavedView[]) || []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('Sem sessão');
      const { error } = await (supabase as unknown as {
        from: (t: string) => {
          upsert: (row: unknown, opts: { onConflict: string }) => Promise<{ error: unknown }>;
        };
      })
        .from('pg_stats_admin_views')
        .upsert(
          { user_id: uid, name: name.trim(), config: current as unknown as Record<string, unknown> },
          { onConflict: 'user_id,name' },
        );
      if (error) throw error;
      toast.success(`Visão "${name}" salva`);
      setSaveOpen(false);
      setName('');
      await load();
    } catch (e) {
      toast.error(`Falha ao salvar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        delete: () => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
      };
    }).from('pg_stats_admin_views').delete().eq('id', id);
    if (error) {
      toast.error('Falha ao remover');
      return;
    }
    toast.success('Visão removida');
    await load();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Bookmark className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground mr-1">Visões:</span>
      </div>
      {views.length === 0 && (
        <span className="text-xs text-muted-foreground italic">nenhuma salva</span>
      )}
      {views.map((v) => (
        <div key={v.id} className="flex items-center gap-0.5">
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-primary/20"
            onClick={() => { onApply(v.config); toast.success(`Visão "${v.name}" aplicada`); }}
          >
            {v.name}
          </Badge>
          <Button
            size="icon" variant="ghost" className="h-5 w-5"
            onClick={() => remove(v.id)}
            aria-label={`Remover ${v.name}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 ml-auto">
            <Save className="h-3.5 w-3.5 mr-1" /> Salvar visão atual
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar visão</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="view-name">Nome</Label>
            <Input
              id="view-name" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Top INSERT app_metrics"
            />
            <p className="text-xs text-muted-foreground">
              Armazena: ordenação, top N, mín. chamadas, operação e filtro de tabela.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={loading || !name.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
