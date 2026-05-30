import React, { useState } from 'react';
import { normalizeText } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Tag, Book, Bookmark, FileText, Loader2, Hash, Search, Sparkles, Heart, Cross, Compass, History } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  emoji: string | null;
  category: string | null;
  image_url: string | null;
  order_index: number;
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
  const [showEditTheme, setShowEditTheme] = useState(false);
  const [showNewContent, setShowNewContent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newTheme, setNewTheme] = useState({ 
    name: '', 
    slug: '', 
    description: '', 
    emoji: '⛪', 
    category: 'Espiritualidade',
    order_index: 0 
  });
  
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  
  const [newContent, setNewContent] = useState({ 
    content_type: 'bible', 
    reference: '', 
    title: '', 
    text_content: '' 
  });
  
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
    mutationFn: async (theme: { name: string; slug: string; description: string; emoji?: string; category?: string; order_index?: number }) => {
      const { error } = await supabase.from('themes').insert([theme]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
      setShowNewTheme(false);
      setNewTheme({ name: '', slug: '', description: '', emoji: '⛪', category: 'Espiritualidade', order_index: 0 });
      toast.success('Tema criado com sucesso!');
    },
    onError: (e: any) => toast.error(`Erro: ${e.message}`),
  });

  const updateThemeMutation = useMutation({
    mutationFn: async (theme: Theme) => {
      const { error } = await supabase.from('themes').update({
        name: theme.name,
        slug: theme.slug,
        description: theme.description,
        emoji: theme.emoji,
        category: theme.category,
        image_url: theme.image_url,
        order_index: theme.order_index
      }).eq('id', theme.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
      setShowEditTheme(false);
      setEditingTheme(null);
      toast.success('Tema atualizado com sucesso!');
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
    bible: { icon: <Book className="w-spacing-md h-spacing-md" />, label: 'Bíblia', color: 'bg-blue-500/10 text-blue-600' },
    catechism: { icon: <Bookmark className="w-spacing-md h-spacing-md" />, label: 'Catecismo', color: 'bg-amber-500/10 text-amber-600' },
    magisterium: { icon: <FileText className="w-spacing-md h-spacing-md" />, label: 'Magistério', color: 'bg-emerald-500/10 text-emerald-600' },
    saints: { icon: <Sparkles className="w-spacing-md h-spacing-md" />, label: 'Santos', color: 'bg-purple-500/10 text-purple-600' },
    prayers: { icon: <Heart className="w-spacing-md h-spacing-md" />, label: 'Orações', color: 'bg-rose-500/10 text-rose-600' },
    journey: { icon: <Compass className="w-spacing-md h-spacing-md" />, label: 'Jornadas', color: 'bg-indigo-500/10 text-indigo-600' },
    history: { icon: <History className="w-spacing-md h-spacing-md" />, label: 'História', color: 'bg-orange-500/10 text-orange-600' },
  };

  const filteredThemes = themes?.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const contentsByType = contents ? Object.keys(contentTypeConfig).reduce((acc, type) => {
    acc[type] = contents.filter(c => c.content_type === type);
    return acc;
  }, {} as Record<string, ThemeContent[]>) : {};

  return (
    <div className="space-y-spacing-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-spacing-md">
        <div>
          <h2 className="text-premium-xl font-bold text-foreground">Gestão de Temas</h2>
          <p className="text-premium-sm text-muted-foreground">Gerencie os temas e conteúdos conectados do sistema de navegação por bolhas.</p>
        </div>
        <div className="flex items-center gap-spacing-sm">
          <div className="relative">
            <Search className="absolute left-spacing-xs top-spacing-xs h-spacing-md w-spacing-md text-muted-foreground" />
            <Input 
              placeholder="Buscar tema..." 
              className="pl-spacing-xl w-full md:w-spacing-4xl h-spacing-xl"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={showNewTheme} onOpenChange={setShowNewTheme}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-spacing-xs shrink-0"><Plus className="w-spacing-md h-spacing-md" /> Novo Tema</Button>
            </DialogTrigger>
            <DialogContent className="max-w-spacing-md">
              <DialogHeader><DialogTitle>Criar Novo Tema</DialogTitle></DialogHeader>
              <div className="space-y-spacing-md pt-spacing-md">
                <div className="grid grid-cols-2 gap-spacing-md">
                  <div className="space-y-spacing-xs">
                    <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Nome</label>
                    <Input placeholder="Ex: Misericórdia" value={newTheme.name} onChange={e => {
                      const name = e.target.value;
                      const slug = normalizeText(name).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                      setNewTheme(p => ({ ...p, name, slug }));
                    }} />
                  </div>
                  <div className="space-y-spacing-xs">
                    <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Slug</label>
                    <Input placeholder="slug-do-tema" value={newTheme.slug} onChange={e => setNewTheme(p => ({ ...p, slug: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-spacing-md">
                  <div className="space-y-spacing-xs">
                    <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Emoji</label>
                    <Input placeholder="Ex: ⛪" value={newTheme.emoji || ''} onChange={e => setNewTheme(p => ({ ...p, emoji: e.target.value }))} />
                  </div>
                  <div className="space-y-spacing-xs">
                    <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Categoria</label>
                    <Input placeholder="Ex: Dogmas" value={newTheme.category || ''} onChange={e => setNewTheme(p => ({ ...p, category: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-spacing-xs">
                  <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Descrição</label>
                  <Textarea placeholder="Descrição teológica do tema..." value={newTheme.description} onChange={e => setNewTheme(p => ({ ...p, description: e.target.value }))} rows={3} />
                </div>
                <Button className="w-full" onClick={() => createThemeMutation.mutate(newTheme)} disabled={!newTheme.name || !newTheme.slug || createThemeMutation.isPending}>
                  {createThemeMutation.isPending ? <Loader2 className="w-spacing-md h-spacing-md animate-spin mr-spacing-xs" /> : null}
                  Criar Tema
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-spacing-lg">
        {/* Themes List */}
        <div className="lg:col-span-4 space-y-spacing-xs overflow-y-auto max-h-[70vh] pr-spacing-2xs">
          {loadingThemes ? (
            <div className="flex items-center justify-center py-spacing-xl"><Loader2 className="w-spacing-lg h-spacing-lg animate-spin text-primary" /></div>
          ) : filteredThemes?.length === 0 ? (
            <div className="text-center py-spacing-2xl bg-muted/20 rounded-premium border border-dashed">
              <p className="text-premium-sm text-muted-foreground">Nenhum tema encontrado.</p>
            </div>
          ) : (
            filteredThemes?.map(theme => (
              <div
                key={theme.id}
                onClick={() => setSelectedTheme(theme)}
                className={`w-full group text-left p-spacing-md rounded-premium-full border transition-all cursor-pointer relative ${
                  selectedTheme?.id === theme.id ? 'bg-primary/5 border-primary/30 shadow-premium-md' : 'bg-card border-border hover:border-primary/20'
                }`}
              >
                <div className="flex items-center justify-between gap-spacing-xs">
                  <div className="flex items-center gap-spacing-sm">
                    <span className="text-premium-xl">{theme.emoji || '⛪'}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{theme.name}</span>
                      <span className="text-premium-xs uppercase font-black tracking-widest text-primary/60">{theme.category || 'Geral'}</span>
                    </div>
                  </div>
                  <div className="flex gap-spacing-2xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-spacing-xl w-spacing-xl p-spacing-0" onClick={e => {
                      e.stopPropagation();
                      setEditingTheme(theme);
                      setShowEditTheme(true);
                    }}>
                      <Edit2 className="w-spacing-sm h-spacing-sm" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-spacing-xl w-spacing-xl p-spacing-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={e => {
                      e.stopPropagation();
                      if (confirm(`Deletar tema "${theme.name}" e todos os seus conteúdos?`)) deleteThemeMutation.mutate(theme.id);
                    }}>
                      <Trash2 className="w-spacing-sm h-spacing-sm" />
                    </Button>
                  </div>
                </div>
                {theme.description && (
                  <p className="text-premium-xs text-muted-foreground mt-spacing-xs line-clamp-spacing-2xs italic">{theme.description}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contents Area */}
        <div className="lg:col-span-8">
          {!selectedTheme ? (
            <Card className="border-dashed h-[400px] flex items-center justify-center">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="w-spacing-3xl h-spacing-3xl rounded-premium bg-muted/30 flex items-center justify-center mb-spacing-md">
                  <Tag className="w-spacing-xl h-spacing-xl text-muted-foreground/60" />
                </div>
                <h3 className="font-bold text-premium-lg mb-spacing-2xs">Nenhum tema selecionado</h3>
                <p className="text-muted-foreground text-premium-sm max-w-[250px]">Selecione um tema à esquerda para gerenciar seus conteúdos conectados.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-spacing-md animate-in fade-in duration-300">
              <div className="flex items-center justify-between bg-card p-spacing-md rounded-premium border border-border/50">
                <div className="flex items-center gap-spacing-sm">
                  <span className="text-premium-3xl">{selectedTheme.emoji || '⛪'}</span>
                  <div>
                    <h3 className="text-premium-xl font-bold text-foreground leading-none mb-spacing-2xs">{selectedTheme.name}</h3>
                    <Badge variant="secondary" className="text-premium-xs uppercase tracking-widest font-black">{selectedTheme.category || 'Geral'}</Badge>
                  </div>
                </div>
                <div className="flex gap-spacing-xs">
                  <Button size="sm" variant="ghost" onClick={() => {
                    setEditingTheme(selectedTheme);
                    setShowEditTheme(true);
                  }}>
                    <Edit2 className="w-spacing-md h-spacing-md mr-spacing-xs" /> Editar Tema
                  </Button>
                  <Dialog open={showNewContent} onOpenChange={setShowNewContent}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-spacing-xs"><Plus className="w-spacing-md h-spacing-md" /> Adicionar Conteúdo</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Novo Conteúdo — {selectedTheme.name}</DialogTitle></DialogHeader>
                      <div className="space-y-spacing-md pt-spacing-md">
                        <div className="space-y-spacing-xs">
                          <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Tipo de Conteúdo</label>
                          <Select value={newContent.content_type} onValueChange={v => setNewContent(p => ({ ...p, content_type: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(contentTypeConfig).map(([val, config]) => (
                                <SelectItem key={val} value={val}>{config.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-spacing-xs">
                          <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Referência</label>
                          <Input placeholder="Ex: Jo 3,16 ou CIC §1822" value={newContent.reference} onChange={e => setNewContent(p => ({ ...p, reference: e.target.value }))} />
                        </div>
                        <div className="space-y-spacing-xs">
                          <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Título (Opcional)</label>
                          <Input placeholder="Título do trecho" value={newContent.title} onChange={e => setNewContent(p => ({ ...p, title: e.target.value }))} />
                        </div>
                        <div className="space-y-spacing-xs">
                          <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Texto</label>
                          <Textarea placeholder="Texto do conteúdo sagrado..." value={newContent.text_content} onChange={e => setNewContent(p => ({ ...p, text_content: e.target.value }))} rows={4} />
                        </div>
                        <Button className="w-full" onClick={() => createContentMutation.mutate({ ...newContent, theme_id: selectedTheme.id })} disabled={!newContent.reference || createContentMutation.isPending}>
                          {createContentMutation.isPending ? <Loader2 className="w-spacing-md h-spacing-md animate-spin mr-spacing-xs" /> : null}
                          Salvar Conteúdo
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {loadingContents ? (
                <div className="flex items-center justify-center py-spacing-3xl"><Loader2 className="w-spacing-xl h-spacing-xl animate-spin text-primary/60" /></div>
              ) : (
                <div className="space-y-spacing-lg">
                  {Object.entries(contentsByType).map(([type, items]) => {
                    const config = contentTypeConfig[type];
                    if (items.length === 0) return null;
                    return (
                      <div key={type} className="space-y-spacing-sm">
                        <div className="flex items-center gap-spacing-xs border-b border-border/50 pb-spacing-xs">
                          <div className={`p-spacing-2xs rounded-premium-full ${config.color}`}>{config.icon}</div>
                          <span className="text-premium-sm font-bold text-foreground uppercase tracking-widest">{config.label}</span>
                          <Badge variant="outline" className="text-premium-xs ml-auto">{items.length}</Badge>
                        </div>
                        <div className="grid gap-spacing-sm">
                          {items.map(item => (
                            <Card key={item.id} className="bg-card hover:bg-card transition-colors border-border/40 shadow-premium-none">
                              <CardContent className="p-spacing-md">
                                {editingContent?.id === item.id ? (
                                  <div className="space-y-spacing-md">
                                    <div className="grid grid-cols-2 gap-spacing-md">
                                      <Select value={editingContent.content_type} onValueChange={v => setEditingContent(p => p ? { ...p, content_type: v } : null)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          {Object.entries(contentTypeConfig).map(([val, config]) => (
                                            <SelectItem key={val} value={val}>{config.label}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Input value={editingContent.reference} onChange={e => setEditingContent(p => p ? { ...p, reference: e.target.value } : null)} />
                                    </div>
                                    <Input value={editingContent.title || ''} onChange={e => setEditingContent(p => p ? { ...p, title: e.target.value } : null)} placeholder="Título" />
                                    <Textarea value={editingContent.text_content || ''} onChange={e => setEditingContent(p => p ? { ...p, text_content: e.target.value } : null)} rows={3} />
                                    <div className="flex gap-spacing-xs justify-end">
                                      <Button size="sm" variant="outline" onClick={() => setEditingContent(null)}>Cancelar</Button>
                                      <Button size="sm" onClick={() => updateContentMutation.mutate(editingContent)} disabled={updateContentMutation.isPending}>
                                        {updateContentMutation.isPending && <Loader2 className="w-spacing-sm h-spacing-sm animate-spin mr-spacing-xs" />}
                                        Salvar Alterações
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start justify-between gap-spacing-md">
                                    <div className="flex-1 min-w-spacing-0">
                                      <div className="flex items-center gap-spacing-xs mb-spacing-xs">
                                        <Badge variant="outline" className="text-premium-xs font-bold uppercase border-primary/20 text-primary/70">{item.reference}</Badge>
                                        {item.title && <span className="text-premium-xs font-bold text-foreground/80">— {item.title}</span>}
                                      </div>
                                      <p className="text-premium-sm text-muted-foreground italic leading-relaxed line-clamp-spacing-sm">"{item.text_content}"</p>
                                    </div>
                                    <div className="flex gap-spacing-2xs shrink-0">
                                      <Button variant="ghost" size="sm" className="h-spacing-xl w-spacing-xl p-spacing-0" onClick={() => setEditingContent(item)}>
                                        <Edit2 className="w-spacing-sm h-spacing-sm" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-spacing-xl w-spacing-xl p-spacing-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                                        if (confirm('Remover este conteúdo?')) deleteContentMutation.mutate(item.id);
                                      }}>
                                        <Trash2 className="w-spacing-sm h-spacing-sm" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loadingContents && contents?.length === 0 && (
                <Card className="border-dashed py-spacing-2xl">
                  <CardContent className="flex flex-col items-center justify-center text-center opacity-50">
                    <FileText className="w-spacing-xl h-spacing-xl mb-spacing-xs" />
                    <p className="text-premium-sm font-medium">Nenhum conteúdo vinculado a este tema.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Theme Dialog */}
      <Dialog open={showEditTheme} onOpenChange={setShowEditTheme}>
        <DialogContent className="max-w-spacing-md">
          <DialogHeader><DialogTitle>Editar Tema</DialogTitle></DialogHeader>
          {editingTheme && (
            <div className="space-y-spacing-md pt-spacing-md">
              <div className="grid grid-cols-2 gap-spacing-md">
                <div className="space-y-spacing-xs">
                  <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Nome</label>
                  <Input value={editingTheme.name} onChange={e => setEditingTheme(p => p ? { ...p, name: e.target.value } : null)} />
                </div>
                <div className="space-y-spacing-xs">
                  <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Slug</label>
                  <Input value={editingTheme.slug} onChange={e => setEditingTheme(p => p ? { ...p, slug: e.target.value } : null)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-spacing-md">
                <div className="space-y-spacing-xs">
                  <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Emoji</label>
                  <Input value={editingTheme.emoji || ''} onChange={e => setEditingTheme(p => p ? { ...p, emoji: e.target.value } : null)} />
                </div>
                <div className="space-y-spacing-xs">
                  <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Categoria</label>
                  <Input value={editingTheme.category || ''} onChange={e => setEditingTheme(p => p ? { ...p, category: e.target.value } : null)} />
                </div>
              </div>
              <div className="space-y-spacing-xs">
                <label className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground">Descrição</label>
                <Textarea value={editingTheme.description || ''} onChange={e => setEditingTheme(p => p ? { ...p, description: e.target.value } : null)} rows={4} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditTheme(false)}>Cancelar</Button>
                <Button onClick={() => updateThemeMutation.mutate(editingTheme)} disabled={updateThemeMutation.isPending}>
                  {updateThemeMutation.isPending && <Loader2 className="w-spacing-md h-spacing-md animate-spin mr-spacing-xs" />}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminThemesTab;