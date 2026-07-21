/**
 * /admin/collections — Cathedra Collections Studio (Onda B).
 *
 * Lista e cria coleções editoriais. Toda coleção nasce em `draft`; publicação
 * é uma transição explícita feita no editor. RLS já restringe tudo a admin.
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAdminCollections, useCreateCollection } from '@/features/collections/adminHooks';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  review: 'secondary',
  published: 'default',
  archived: 'destructive',
};

const SPACES = [
  { value: 'church', label: 'Igreja' },
  { value: 'library', label: 'Biblioteca' },
  { value: 'cloister', label: 'Claustro' },
  { value: 'atrium', label: 'Átrio' },
] as const;

export default function CollectionsAdmin() {
  const { data: collections = [], isLoading } = useAdminCollections();
  const create = useCreateCollection();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    slug: '',
    title: '',
    category: 'sacramentos',
    space: 'church' as 'church' | 'library' | 'cloister' | 'atrium',
  });

  const submit = async () => {
    if (!form.slug.trim() || !form.title.trim()) {
      toast.error('Slug e título são obrigatórios.');
      return;
    }
    try {
      const c = await create.mutateAsync({
        slug: form.slug.trim(),
        title: form.title.trim(),
        category: form.category.trim() || 'geral',
        space: form.space,
      });
      toast.success(`Coleção "${c.title}" criada em rascunho.`);
      setOpen(false);
      setForm({ slug: '', title: '', category: 'sacramentos', space: 'church' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao criar coleção.';
      toast.error(msg);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Helmet>
        <title>Cathedra Collections Studio — Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cathedra Collections Studio</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            Coleções editoriais navegáveis. Toda coleção nasce em rascunho; publicação é feita no
            editor, item a item, seguindo a mesma governança do Glossário.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nova coleção</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova coleção editorial</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Os Sete Sacramentos"
                />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="sete-sacramentos"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Ambiente</Label>
                  <Select
                    value={form.space}
                    onValueChange={(v) => setForm({ ...form, space: v as typeof form.space })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SPACES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={create.isPending}>
                {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar rascunho
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coleções ({collections.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </div>
          ) : collections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma coleção ainda. Crie a primeira acima.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Ambiente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((c) => {
                  const space = (c.metadata?.space as string) ?? '—';
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell className="font-mono text-xs">{c.slug}</TableCell>
                      <TableCell>{c.category}</TableCell>
                      <TableCell className="capitalize">{space}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[c.status] ?? 'outline'}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {c.status === 'published' && (
                          <Button asChild size="sm" variant="ghost" title="Ver pública">
                            <Link to={`/colecoes/${c.slug}`} target="_blank" rel="noopener">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/admin/collections/${c.id}`}>Editar</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
