import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Icons } from '@/constants';
import SourceAttribution from '@/components/cathedra/SourceAttribution';
import SaintsAuditPanel from '@/components/admin/SaintsAuditPanel';

interface SaintRow {
  id: string;
  name: string;
  title: string | null;
  feast_day: string | null;
  feast_month: number | null;
  feast_day_num: number | null;
  bio: string | null;
  full_bio: string | null;
  category: string | null;
  prayer: string | null;
  source_name: string | null;
  source_url: string | null;
  bio_source_url: string | null;
  prayer_source_url: string | null;
  last_scraped_at: string | null;
}

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const emptyForm = (): SaintRow => ({
  id: '',
  name: '',
  title: '',
  feast_day: '',
  feast_month: null,
  feast_day_num: null,
  bio: '',
  full_bio: '',
  category: '',
  prayer: '',
  source_name: '',
  source_url: '',
  bio_source_url: '',
  prayer_source_url: '',
  last_scraped_at: null,
});

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const isValidUrl = (v: string | null | undefined) => {
  if (!v) return true;
  try { new URL(v); return true; } catch { return false; }
};

const SELECT_COLS =
  'id,name,title,feast_day,feast_month,feast_day_num,bio,full_bio,category,prayer,source_name,source_url,bio_source_url,prayer_source_url,last_scraped_at';

const SaintsAdmin: React.FC = () => {
  const [rows, setRows] = useState<SaintRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<SaintRow>(emptyForm());
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reimporting, setReimporting] = useState(false);
  const [dryRunPreview, setDryRunPreview] = useState<any[] | null>(null);
  const [dryRunSummary, setDryRunSummary] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('saints')
      .select(SELECT_COLS)
      .order('feast_month', { ascending: true, nullsFirst: false })
      .order('feast_day_num', { ascending: true, nullsFirst: false });
    setLoading(false);
    if (error) return toast.error('Falha ao carregar santos', { description: error.message });
    setRows((data || []) as SaintRow[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const gaps = useMemo(() => {
    const covered = new Set(rows.filter((r) => r.feast_month && r.feast_day_num).map((r) => `${r.feast_month}-${r.feast_day_num}`));
    const list: { m: number; d: number }[] = [];
    for (let m = 1; m <= 12; m++) for (let d = 1; d <= DAYS_IN_MONTH[m - 1]; d++) if (!covered.has(`${m}-${d}`)) list.push({ m, d });
    return list;
  }, [rows]);

  const filtered = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => r.feast_month === filter)),
    [rows, filter]
  );

  const validate = (f: SaintRow): string | null => {
    if (!f.name.trim()) return 'Nome é obrigatório.';
    if (!f.feast_month || f.feast_month < 1 || f.feast_month > 12) return 'Mês inválido (1..12).';
    if (!f.feast_day_num || f.feast_day_num < 1 || f.feast_day_num > DAYS_IN_MONTH[f.feast_month - 1]) return `Dia inválido para ${MONTHS_PT[f.feast_month - 1]}.`;
    if (!f.bio?.trim()) return 'Bio curta é obrigatória.';
    if (!isValidUrl(f.source_url)) return 'URL da fonte inválida.';
    if (!isValidUrl(f.bio_source_url)) return 'URL da fonte da biografia inválida.';
    if (!isValidUrl(f.prayer_source_url)) return 'URL da fonte da oração inválida.';
    return null;
  };

  const save = async () => {
    const err = validate(form);
    if (err) return toast.error(err);
    const id = form.id || slugify(form.name);
    const payload = {
      ...form,
      id,
      feast_day: form.feast_day || `${form.feast_day_num} de ${MONTHS_PT[form.feast_month! - 1]}`,
      source_name: form.source_name?.trim() || null,
      source_url: form.source_url?.trim() || null,
      bio_source_url: form.bio_source_url?.trim() || null,
      prayer_source_url: form.prayer_source_url?.trim() || null,
    };
    const { error } = await supabase.from('saints').upsert(payload as any, { onConflict: 'id' });
    if (error) return toast.error('Falha ao salvar', { description: error.message });
    toast.success(editing ? 'Santo atualizado' : 'Santo cadastrado');
    setForm(emptyForm());
    setEditing(false);
    load();
  };

  const edit = (row: SaintRow) => {
    setForm(row);
    setEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id: string) => {
    if (!confirm(`Remover ${id}?`)) return;
    const { error } = await supabase.from('saints').delete().eq('id', id);
    if (error) return toast.error('Falha ao remover', { description: error.message });
    toast.success('Removido');
    load();
  };

  const importJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as any[];
      const rows = parsed.filter((r) => r && !r._comment && !r._schema && r.id && r.name && r.feast_month && r.feast_day_num);
      if (rows.length === 0) return toast.warning('Nenhum registro válido no arquivo.');
      const { error } = await supabase.from('saints').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
      toast.success(`${rows.length} santo(s) importado(s).`);
      load();
    } catch (e: any) {
      toast.error('Falha ao importar', { description: e?.message ?? String(e) });
    }
  };

  const fillFromGap = (m: number, d: number) => {
    setForm({ ...emptyForm(), feast_month: m, feast_day_num: d, feast_day: `${d} de ${MONTHS_PT[m - 1]}` });
    setEditing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const runIncrementalReimport = async (dryRun: boolean) => {
    if (!dryRun && !confirm('Rodar reimport incremental? Só atualiza santos com conteúdo alterado ou scrape > 30 dias.')) return;
    setReimporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-incremental-reimport-saints', {
        body: { ttl_days: 30, dry_run: dryRun },
      });
      if (error) throw error;
      if (dryRun) {
        setDryRunPreview(data?.preview ?? []);
        setDryRunSummary({
          considered: data?.considered ?? 0,
          would_update: data?.updated ?? 0,
          unchanged: data?.unchanged ?? 0,
          failed: data?.failed ?? 0,
        });
        toast.info('Dry-run concluído', {
          description: `Seriam atualizados ${data?.updated ?? 0} de ${data?.considered ?? 0}.`,
        });
      } else {
        toast.success('Reimport concluído', {
          description: `Atualizados: ${data?.updated ?? 0} · Sem mudança: ${data?.unchanged ?? 0} · Falhas: ${data?.failed ?? 0}`,
        });
        setDryRunPreview(null);
        setDryRunSummary(null);
        load();
      }
    } catch (e: any) {
      toast.error('Falha no reimport', { description: e?.message ?? String(e) });
    } finally {
      setReimporting(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Administração de Santos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastro, edição e importação em massa. Cobertura atual:{' '}
            <Badge variant={gaps.length === 0 ? 'default' : 'destructive'}>
              {366 - gaps.length}/366 dias
            </Badge>
            {gaps.length > 0 && <span className="ml-2">({gaps.length} sem santo)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => runIncrementalReimport(true)} disabled={reimporting} variant="outline" size="sm">
            <Icons.Eye className="w-4 h-4 mr-2" /> Dry-run
          </Button>
          <Button onClick={() => runIncrementalReimport(false)} disabled={reimporting} variant="secondary" size="sm">
            <Icons.RefreshCw className={`w-4 h-4 mr-2 ${reimporting ? 'animate-spin' : ''}`} />
            {reimporting ? 'Processando…' : 'Reimport incremental'}
          </Button>
        </div>
      </header>

      {dryRunPreview && dryRunSummary && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Icons.Eye className="w-4 h-4" /> Prévia do reimport (dry-run)
              <Badge variant="outline" className="ml-2 text-[10px]">
                {dryRunSummary.would_update} de {dryRunSummary.considered} seriam atualizados
              </Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => { setDryRunPreview(null); setDryRunSummary(null); }}>
              Fechar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground mb-3">
              Sem mudança: {dryRunSummary.unchanged} · Falhas: {dryRunSummary.failed}
            </div>
            <div className="divide-y max-h-[360px] overflow-y-auto">
              {dryRunPreview.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum candidato dentro do TTL.</p>
              )}
              {dryRunPreview.map((p) => (
                <div key={p.id} className="py-2 flex items-center gap-3 text-sm">
                  <Badge
                    variant="outline"
                    className={
                      p.reason === 'would_fill_full_bio' ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300' :
                      p.reason === 'would_update' ? 'border-blue-500/40 text-blue-700 dark:text-blue-300' :
                      p.reason === 'fetch_failed' ? 'border-red-500/40 text-red-700 dark:text-red-300' :
                      'border-border text-muted-foreground'
                    }
                  >
                    {p.reason === 'would_fill_full_bio' ? 'preenche full_bio' :
                     p.reason === 'would_update' ? 'hash mudou' :
                     p.reason === 'fetch_failed' ? 'fetch falhou' : 'sem mudança'}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{p.name || p.id}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{p.source_url}</p>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                    {(p.old_hash || '—').slice(0, 8)} → {(p.new_hash || '—').slice(0, 8)}
                  </span>
                </div>
              ))}
            </div>
            {dryRunSummary.would_update > 0 && (
              <div className="flex justify-end mt-4">
                <Button onClick={() => runIncrementalReimport(false)} disabled={reimporting}>
                  Aplicar {dryRunSummary.would_update} alteraç{dryRunSummary.would_update === 1 ? 'ão' : 'ões'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{editing ? 'Editar santo' : 'Novo santo'}</CardTitle>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Icons.Upload className="w-4 h-4 mr-2" /> Importar JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)} disabled={!form.name}>
              <Icons.Eye className="w-4 h-4 mr-2" /> Preview
            </Button>
            {editing && (
              <Button variant="ghost" size="sm" onClick={() => { setForm(emptyForm()); setEditing(false); }}>
                Cancelar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="month">Mês * (1..12)</Label>
            <Input id="month" type="number" min={1} max={12} value={form.feast_month ?? ''} onChange={(e) => setForm({ ...form, feast_month: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <Label htmlFor="day">Dia * (1..31)</Label>
            <Input id="day" type="number" min={1} max={31} value={form.feast_day_num ?? ''} onChange={(e) => setForm({ ...form, feast_day_num: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="bio">Bio curta *</Label>
            <Textarea id="bio" rows={2} value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="fullBio">Biografia completa (full_bio)</Label>
            <Textarea id="fullBio" rows={6} value={form.full_bio || ''} onChange={(e) => setForm({ ...form, full_bio: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="prayer">Oração</Label>
            <Textarea id="prayer" rows={4} value={form.prayer || ''} onChange={(e) => setForm({ ...form, prayer: e.target.value })} />
          </div>

          <div className="md:col-span-2 pt-2 border-t border-border/40">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Atribuição de fonte</p>
          </div>
          <div>
            <Label htmlFor="source_name">Nome da fonte</Label>
            <Input id="source_name" placeholder="Ex.: Vatican News · CNBB · Santopedia" value={form.source_name || ''} onChange={(e) => setForm({ ...form, source_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="source_url">URL da fonte principal</Label>
            <Input id="source_url" placeholder="https://…" value={form.source_url || ''} onChange={(e) => setForm({ ...form, source_url: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="bio_source_url">URL da fonte da biografia</Label>
            <Input id="bio_source_url" placeholder="https://…" value={form.bio_source_url || ''} onChange={(e) => setForm({ ...form, bio_source_url: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="prayer_source_url">URL da fonte da oração</Label>
            <Input id="prayer_source_url" placeholder="https://…" value={form.prayer_source_url || ''} onChange={(e) => setForm({ ...form, prayer_source_url: e.target.value })} />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button onClick={save}>{editing ? 'Salvar alterações' : 'Cadastrar'}</Button>
          </div>
        </CardContent>
      </Card>

      {gaps.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Datas sem santo ({gaps.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {gaps.slice(0, 60).map((g) => (
                <Button key={`${g.m}-${g.d}`} variant="outline" size="sm" onClick={() => fillFromGap(g.m, g.d)}>
                  {String(g.d).padStart(2, '0')}/{String(g.m).padStart(2, '0')}
                </Button>
              ))}
              {gaps.length > 60 && <span className="text-xs text-muted-foreground self-center">+ {gaps.length - 60} datas…</span>}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Cadastrados ({filtered.length})</CardTitle>
          <select className="border rounded px-2 py-1 text-sm bg-background" value={filter} onChange={(e) => setFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
            <option value="all">Todos os meses</option>
            {MONTHS_PT.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <div className="divide-y">
              {filtered.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {r.name}
                      {!r.full_bio && <Badge variant="outline" className="ml-2 text-[10px]">sem full_bio</Badge>}
                      {!r.prayer && <Badge variant="outline" className="ml-2 text-[10px]">sem oração</Badge>}
                      {!r.source_url && <Badge variant="outline" className="ml-2 text-[10px]">sem fonte</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.feast_month && r.feast_day_num ? `${String(r.feast_day_num).padStart(2, '0')}/${String(r.feast_month).padStart(2, '0')}` : '— sem data —'}
                      {r.title ? ` · ${r.title}` : ''}
                      {r.source_name ? ` · ${r.source_name}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => edit(r)}>Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>Remover</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SaintsAuditPanel />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {form.name || 'Sem nome'}</DialogTitle>
          </DialogHeader>
          <article className="space-y-4 py-2">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-primary">
                {form.title || 'Santo do Dia'}
              </p>
              <h2 className="text-2xl font-serif font-bold text-foreground">{form.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {form.feast_day || (form.feast_month && form.feast_day_num
                  ? `${form.feast_day_num} de ${MONTHS_PT[form.feast_month - 1]}`
                  : '—')}
              </p>
            </div>
            {form.bio && (
              <p className="text-base font-serif italic text-foreground/90 border-l-4 border-primary/20 pl-4">
                {form.bio}
              </p>
            )}
            {form.full_bio && (
              <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                {form.full_bio.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
            {form.prayer && (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Oração</p>
                <p className="text-sm italic text-foreground/90 whitespace-pre-line">{form.prayer}</p>
              </div>
            )}
            <SourceAttribution
              source={form.source_name}
              sourceUrl={form.source_url}
              bioSourceUrl={form.bio_source_url}
              prayerSourceUrl={form.prayer_source_url}
              lastScrapedAt={form.last_scraped_at}
            />
          </article>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SaintsAdmin;
