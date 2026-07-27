/**
 * /admin/collections/:id — Editor de uma coleção editorial.
 *
 * Metadados + drag-and-drop de itens + seletor universal (Knowledge Registry).
 * Publicação exige coleção com ≥1 item — sem bypass.
 */
import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, Loader2, Save, Send, Eye, EyeOff, Archive, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useAdminCollection,
  useUpdateCollection,
  useSetCollectionStatus,
  useAddCollectionItem,
  useRemoveCollectionItem,
  useReorderCollectionItems,
  type CollectionStatus,
} from '@/features/collections/adminHooks';
import CollectionItemsList from '@/features/collections/CollectionItemsList';
import ContentPicker from '@/features/collections/ContentPicker';

const SPACES = [
  { value: 'church', label: 'Igreja' },
  { value: 'library', label: 'Biblioteca' },
  { value: 'cloister', label: 'Claustro' },
  { value: 'atrium', label: 'Átrio' },
] as const;

export default function CollectionEditor() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useAdminCollection(id);
  const update = useUpdateCollection(id!);
  const setStatus = useSetCollectionStatus(id!);
  const addItem = useAddCollectionItem();
  const removeItem = useRemoveCollectionItem(id!);
  const reorder = useReorderCollectionItems(id!);

  const [form, setForm] = useState({
    slug: '',
    title: '',
    subtitle: '',
    description: '',
    cover: '',
    category: '',
    featured: false,
    space: 'church' as 'church' | 'library' | 'cloister' | 'atrium',
    eyebrow: '',
    estimated_reading_time_minutes: '' as string,
    difficulty_level: '' as '' | 'iniciante' | 'intermediario' | 'avancado',
    hero_quote: '',
    hero_quote_author: '',
    learning_objectives: '' as string, // uma linha por item
    prerequisites: '' as string,
    completion_message: '',
    certificate_eligible: false,
  });

  useEffect(() => {
    if (!data?.collection) return;
    const c = data.collection;
    setForm({
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle ?? '',
      description: c.description ?? '',
      cover: c.cover ?? '',
      category: c.category,
      featured: c.featured,
      space: ((c.metadata?.space as typeof form.space) ?? 'church'),
      eyebrow: (c.metadata?.eyebrow as string) ?? '',
      estimated_reading_time_minutes:
        c.estimated_reading_time_minutes != null ? String(c.estimated_reading_time_minutes) : '',
      difficulty_level: (c.difficulty_level as typeof form.difficulty_level) ?? '',
      hero_quote: c.hero_quote ?? '',
      hero_quote_author: c.hero_quote_author ?? '',
      learning_objectives: (c.learning_objectives ?? []).join('\n'),
      prerequisites: (c.prerequisites ?? []).join('\n'),
      completion_message: c.completion_message ?? '',
      certificate_eligible: Boolean(c.certificate_eligible),
    });
  }, [data]);

  const nexusMetrics = useMemo(() => {
    if (!data) return null;
    const items = data.items;
    const byType = items.reduce<Record<string, number>>((acc, i) => {
      acc[i.item_type] = (acc[i.item_type] ?? 0) + 1;
      return acc;
    }, {});
    const orphans = items.filter((i) => !i.item_slug?.trim()).length;
    return { total: items.length, byType, orphans };
  }, [data]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
      </div>
    );
  }
  if (!data?.collection) {
    return (
      <div className="container mx-auto py-16 text-sm text-muted-foreground">
        Coleção não encontrada.
      </div>
    );
  }

  const c = data.collection;

  const save = async () => {
    try {
      const minutes = form.estimated_reading_time_minutes.trim();
      const parsedMinutes = minutes ? Number(minutes) : null;
      if (minutes && (!Number.isFinite(parsedMinutes) || (parsedMinutes ?? 0) < 0)) {
        toast.error('Tempo estimado inválido.');
        return;
      }
      const splitLines = (s: string): string[] =>
        s.split('\n').map((l) => l.trim()).filter(Boolean);
      await update.mutateAsync({
        slug: form.slug,
        title: form.title,
        subtitle: form.subtitle || null,
        description: form.description || null,
        cover: form.cover || null,
        category: form.category,
        featured: form.featured,
        space: form.space,
        eyebrow: form.eyebrow || null,
        estimated_reading_time_minutes: parsedMinutes,
        difficulty_level: form.difficulty_level || null,
        hero_quote: form.hero_quote || null,
        hero_quote_author: form.hero_quote_author || null,
        learning_objectives: splitLines(form.learning_objectives),
        prerequisites: splitLines(form.prerequisites),
        completion_message: form.completion_message || null,
        certificate_eligible: form.certificate_eligible,
      });
      toast.success('Coleção salva.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao salvar.');
    }
  };

  const transition = async (next: CollectionStatus) => {
    if (next === 'published' && data.items.length === 0) {
      toast.error('Adicione pelo menos um item antes de publicar.');
      return;
    }
    try {
      await setStatus.mutateAsync(next);
      toast.success(`Status alterado para "${next}".`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha na transição.');
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Helmet>
        <title>Editor · {c.title} — Collections Studio</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/admin/collections"><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Link>
          </Button>
          <h1 className="text-2xl font-semibold truncate">{c.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{c.status}</Badge>
            <span className="text-xs text-muted-foreground font-mono">{c.slug}</span>
            {c.status === 'published' && (
              <Button asChild size="sm" variant="ghost">
                <Link to={`/colecoes/${c.slug}`} target="_blank" rel="noopener">
                  <ExternalLink className="h-3 w-3 mr-1" /> Ver pública
                </Link>
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
          {c.status === 'draft' && (
            <Button variant="secondary" onClick={() => transition('review')} disabled={setStatus.isPending}>
              <Send className="h-4 w-4 mr-2" /> Enviar para revisão
            </Button>
          )}
          {(c.status === 'draft' || c.status === 'review') && (
            <Button onClick={() => transition('published')} disabled={setStatus.isPending}>
              <Eye className="h-4 w-4 mr-2" /> Publicar
            </Button>
          )}
          {c.status === 'published' && (
            <Button variant="outline" onClick={() => transition('draft')} disabled={setStatus.isPending}>
              <EyeOff className="h-4 w-4 mr-2" /> Despublicar
            </Button>
          )}
          {c.status !== 'archived' && (
            <Button variant="destructive" onClick={() => transition('archived')} disabled={setStatus.isPending}>
              <Archive className="h-4 w-4 mr-2" /> Arquivar
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Dados principais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Título</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <div>
                <Label>Eyebrow (rótulo do hero)</Label>
                <Input value={form.eyebrow} onChange={(e) => setForm({ ...form, eyebrow: e.target.value })} placeholder="Ex.: Coleção fundamental" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div>
                  <Label>Ambiente</Label>
                  <Select value={form.space} onValueChange={(v) => setForm({ ...form, space: v as typeof form.space })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SPACES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Capa (URL)</Label>
                  <Input value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })} placeholder="/covers/..." />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.featured}
                  onCheckedChange={(v) => setForm({ ...form, featured: v })}
                  id="featured"
                />
                <Label htmlFor="featured">Destaque na home do ambiente</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadados editoriais</CardTitle>
              <p className="text-xs text-muted-foreground">
                Preencha e revise antes de publicar. Todos os campos aparecem na página pública da trilha.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Tempo estimado (minutos)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.estimated_reading_time_minutes}
                    onChange={(e) =>
                      setForm({ ...form, estimated_reading_time_minutes: e.target.value })
                    }
                    placeholder="Ex.: 45"
                  />
                </div>
                <div>
                  <Label>Nível</Label>
                  <Select
                    value={form.difficulty_level || 'none'}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        difficulty_level:
                          v === 'none' ? '' : (v as typeof form.difficulty_level),
                      })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não definido</SelectItem>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                <div>
                  <Label>Citação do herói</Label>
                  <Textarea
                    rows={2}
                    value={form.hero_quote}
                    onChange={(e) => setForm({ ...form, hero_quote: e.target.value })}
                    placeholder="Frase-âncora da trilha (sem aspas)"
                  />
                </div>
                <div className="md:w-64">
                  <Label>Autor da citação</Label>
                  <Input
                    value={form.hero_quote_author}
                    onChange={(e) => setForm({ ...form, hero_quote_author: e.target.value })}
                    placeholder="Ex.: São Tomás de Aquino"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Objetivos da trilha (um por linha)</Label>
                  <Textarea
                    rows={5}
                    value={form.learning_objectives}
                    onChange={(e) =>
                      setForm({ ...form, learning_objectives: e.target.value })
                    }
                    placeholder={'Compreender a doutrina da graça\nRelacionar Escritura e Tradição\n...'}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {form.learning_objectives
                      .split('\n')
                      .map((l) => l.trim())
                      .filter(Boolean).length} objetivo(s)
                  </p>
                </div>
                <div>
                  <Label>Pré-requisitos (um por linha)</Label>
                  <Textarea
                    rows={5}
                    value={form.prerequisites}
                    onChange={(e) => setForm({ ...form, prerequisites: e.target.value })}
                    placeholder={'Leitura básica do Credo\nFamiliaridade com o CIC §§1-100\n...'}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {form.prerequisites
                      .split('\n')
                      .map((l) => l.trim())
                      .filter(Boolean).length} pré-requisito(s)
                  </p>
                </div>
              </div>

              <div>
                <Label>Mensagem de conclusão</Label>
                <Textarea
                  rows={3}
                  value={form.completion_message}
                  onChange={(e) => setForm({ ...form, completion_message: e.target.value })}
                  placeholder="Aparece na tela final e no certificado"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Switch
                  checked={form.certificate_eligible}
                  onCheckedChange={(v) => setForm({ ...form, certificate_eligible: v })}
                  id="certificate_eligible"
                />
                <Label htmlFor="certificate_eligible" className="cursor-pointer">
                  Trilha certificável — libera <code className="text-xs">/colecoes/{form.slug || ':slug'}/certificado</code>
                </Label>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Itens da coleção ({data.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CollectionItemsList
                items={data.items}
                onReorder={(ids) => reorder.mutate(ids)}
                onRemove={(itemId) => removeItem.mutate(itemId)}
                disabled={reorder.isPending || removeItem.isPending}
              />
              <ContentPicker
                disabled={addItem.isPending}
                onPick={async (p) => {
                  try {
                    await addItem.mutateAsync({
                      collectionId: c.id,
                      itemType: p.itemType,
                      itemSlug: p.itemSlug,
                      titleOverride: p.titleOverride ?? null,
                    });
                    toast.success('Item adicionado.');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Falha ao adicionar.');
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Nexus da coleção</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total de itens</span>
                <Badge variant="outline">{nexusMetrics?.total ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Itens órfãos</span>
                <Badge variant={nexusMetrics?.orphans ? 'destructive' : 'outline'}>
                  {nexusMetrics?.orphans ?? 0}
                </Badge>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="text-xs uppercase text-muted-foreground mb-2">Distribuição</div>
                <ul className="space-y-1">
                  {Object.entries(nexusMetrics?.byType ?? {}).map(([k, n]) => (
                    <li key={k} className="flex items-center justify-between">
                      <span className="capitalize">{k}</span>
                      <span className="font-mono text-xs">{n}</span>
                    </li>
                  ))}
                  {(!nexusMetrics || nexusMetrics.total === 0) && (
                    <li className="text-xs text-muted-foreground">Nenhum item ainda.</li>
                  )}
                </ul>
              </div>
              <p className="pt-2 border-t border-border text-xs text-muted-foreground">
                Mesma linguagem de{' '}
                <Link to="/admin/nexus-audit" className="underline">/admin/nexus-audit</Link>.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
