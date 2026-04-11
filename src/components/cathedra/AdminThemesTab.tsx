import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Tag, Book, Bookmark, FileText, Loader2, Hash } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface ThemeContent {
  id: string;
  theme_id: string;
  content_type: string;
  reference: string;
  title: string | null;
  text_content: string | null;
}

const AdminThemesTab = () => {
  const queryClient = useQueryClient();
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [showNewTheme, setShowNewTheme] = useState(false);
  const [showNewContent, setShowNewContent] = useState(false);
  const [newTheme, setNewTheme] = useState({ name: '', slug: '', description: '' });
  const [newContent, setNewContent] = useState({ content_type: 'bible', reference: '', title: '', text_content: '' });
  const [editingContent, setEditingContent] = useState<ThemeContent | null>(null);

  const { data: themes, isLoading: loadingThemes } = useQuery({
    queryKey: ['admin-themes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('themes').select('*').order('name');
      if (error) throw error;
      return data as Theme[];
    },
  });

  const { data: contents, isLoading: loadingContents } = useQuery({
    queryKey: ['admin-theme-contents', selectedTheme?.id],
    queryFn: async () => {
      if (!selectedTheme) return [];
      const { data, error } = await supabase.from('theme_contents').select('*').eq('theme_id', selectedTheme.id).order('content_type');
      if (error) throw error;
      return data as ThemeContent[];
    },
    enabled: !!selectedTheme,
  });

  const createThemeMutation = useMutation({
    mutationFn: async (theme: { name: string; slug: string; description: string }) => {
      const { error } = await supabase.from('themes').insert([theme]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
      setShowNewTheme(false);
      setNewTheme({ name: '', slug: '', description: '' });
      toast.success('Tema criado com sucesso!');
    },
    onError: (e: any) => toast.error(`Erro: ${e.message}`),
  });

  const deleteThemeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('themes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
      setSelectedTheme(null);
      toast.success('Tema removido.');
    },
    onError: (e: any) => toast.error(`Erro: ${e.message}`),
  });

  const createContentMutation = useMutation({
    mutationFn: async (content: { theme_id: string; content_type: string; reference: string; title: string; text_content: string }) => {
      const { error } = await supabase.from('theme_contents').insert([content]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-theme-contents'] });
      setShowNewContent(false);
      setNewContent({ content_type: 'bible', reference: '', title: '', text_content: '' });
      toast.success('Conteúdo adicionado!');
    },
    onError: (e: any) => toast.error(`Erro: ${e.message}`),
  });

  const updateContentMutation = useMutation({
    mutationFn: async (content: ThemeContent) => {
      const { error } = await supabase.from('theme_contents').update({
        content_type: content.content_type,
        reference: content.reference,
        title: content.title,
        text_content: content.text_content,
      }).eq('id', content.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-theme-contents'] });
      setEditingContent(null);
      toast.success('Conteúdo atualizado!');
    },
    onError: (e: any) => toast.error(`Erro: ${e.message}`),
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('theme_contents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-theme-contents'] });
      toast.success('Conteúdo removido.');
    },
    onError: (e: any) => toast.error(`Erro: ${e.message}`),
  });

  const contentTypeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    bible: { icon: <Book className="w-4 h-4" />, label: 'Bíblia', color: 'bg-blue-500/10 text-blue-600' },
    catechism: { icon: <Bookmark className="w-4 h-4" />, label: 'Catecismo', color: 'bg-amber-500/10 text-amber-600' },
    magisterium: { icon: <FileText className="w-4 h-4" />, label: 'Magistério', color: 'bg-emerald-500/10 text-emerald-600' },
  };

  const contentsByType = {
    bible: contents?.filter(c => c.content_type === 'bible') || [],
    catechism: contents?.filter(c => c.content_type === 'catechism') || [],
    magisterium: contents?.filter(c => c.content_type === 'magisterium') || [],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Gestão de Temas</h2>
          <p className="text-sm text-muted-foreground">Gerencie os temas e conteúdos conectados do sistema de navegação por bolhas.</p>
        </div>
        <Dialog open={showNewTheme} onOpenChange={setShowNewTheme}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Novo Tema</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Novo Tema</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="Nome do tema (ex: Misericórdia)" value={newTheme.name} onChange={e => {
                const name = e.target.value;
                const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                setNewTheme(p => ({ ...p, name, slug }));
              }} />
              <Input placeholder="Slug (gerado automaticamente)" value={newTheme.slug} onChange={e => setNewTheme(p => ({ ...p, slug: e.target.value }))} />
              <Textarea placeholder="Descrição teológica do tema..." value={newTheme.description} onChange={e => setNewTheme(p => ({ ...p, description: e.target.value }))} />
              <Button className="w-full" onClick={() => createThemeMutation.mutate(newTheme)} disabled={!newTheme.name || !newTheme.slug || createThemeMutation.isPending}>
                {createThemeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Criar Tema
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Themes List */}
        <div className="lg:col-span-4 space-y-2">
          {loadingThemes ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            themes?.map(theme => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedTheme?.id === theme.id ? 'bg-primary/10 border-primary/30' : 'bg-card border-border hover:border-primary/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-2">
                    <Hash className="w-4 h-4 text-primary/60" /> {theme.name}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={e => {
                    e.stopPropagation();
                    if (confirm(`Deletar tema "${theme.name}" e todos os seus conteúdos?`)) deleteThemeMutation.mutate(theme.id);
                  }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{theme.description}</p>
              </button>
            ))
          )}
        </div>

        {/* Contents Area */}
        <div className="lg:col-span-8">
          {!selectedTheme ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Tag className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">Selecione um tema para gerenciar seus conteúdos conectados.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">{selectedTheme.name}</h3>
                <Dialog open={showNewContent} onOpenChange={setShowNewContent}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2"><Plus className="w-4 h-4" /> Adicionar Conteúdo</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Novo Conteúdo — {selectedTheme.name}</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Select value={newContent.content_type} onValueChange={v => setNewContent(p => ({ ...p, content_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bible">Bíblia</SelectItem>
                          <SelectItem value="catechism">Catecismo</SelectItem>
                          <SelectItem value="magisterium">Magistério</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Referência (ex: Jo 3,16 ou CIC §1822)" value={newContent.reference} onChange={e => setNewContent(p => ({ ...p, reference: e.target.value }))} />
                      <Input placeholder="Título (opcional)" value={newContent.title} onChange={e => setNewContent(p => ({ ...p, title: e.target.value }))} />
                      <Textarea placeholder="Texto do conteúdo..." value={newContent.text_content} onChange={e => setNewContent(p => ({ ...p, text_content: e.target.value }))} rows={4} />
                      <Button className="w-full" onClick={() => createContentMutation.mutate({ ...newContent, theme_id: selectedTheme.id })} disabled={!newContent.reference || createContentMutation.isPending}>
                        {createContentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Adicionar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {loadingContents ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                Object.entries(contentsByType).map(([type, items]) => {
                  const config = contentTypeConfig[type];
                  if (items.length === 0) return null;
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${config.color}`}>{config.icon}</div>
                        <span className="text-sm font-semibold text-foreground">{config.label}</span>
                        <Badge variant="outline" className="text-xs">{items.length}</Badge>
                      </div>
                      {items.map(item => (
                        <Card key={item.id} className="bg-card/50">
                          <CardContent className="p-4">
                            {editingContent?.id === item.id ? (
                              <div className="space-y-3">
                                <Select value={editingContent.content_type} onValueChange={v => setEditingContent(p => p ? { ...p, content_type: v } : null)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="bible">Bíblia</SelectItem>
                                    <SelectItem value="catechism">Catecismo</SelectItem>
                                    <SelectItem value="magisterium">Magistério</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input value={editingContent.reference} onChange={e => setEditingContent(p => p ? { ...p, reference: e.target.value } : null)} />
                                <Input value={editingContent.title || ''} onChange={e => setEditingContent(p => p ? { ...p, title: e.target.value } : null)} placeholder="Título" />
                                <Textarea value={editingContent.text_content || ''} onChange={e => setEditingContent(p => p ? { ...p, text_content: e.target.value } : null)} rows={3} />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => updateContentMutation.mutate(editingContent)} disabled={updateContentMutation.isPending}>Salvar</Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingContent(null)}>Cancelar</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-primary/70">{item.reference}</span>
                                    {item.title && <span className="text-xs text-muted-foreground">— {item.title}</span>}
                                  </div>
                                  <p className="text-sm text-foreground/80 italic line-clamp-2">{item.text_content}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingContent(item)}>
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => {
                                    if (confirm('Remover este conteúdo?')) deleteContentMutation.mutate(item.id);
                                  }}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  );
                })
              )}

              {!loadingContents && contents?.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground text-sm">Nenhum conteúdo vinculado. Clique em "Adicionar Conteúdo" para começar.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminThemesTab;
