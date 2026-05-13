import React, { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Loader2, Plus, Trash2, Search, Info, FlaskConical, 
  CheckCircle2, AlertCircle, RefreshCw, Pencil, X, Save 
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchNexusTagContent } from '@/lib/nexusContent';

export const AdminNexusSynonyms = () => {
  const queryClient = useQueryClient();
  const [newTerm, setNewTerm] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [testingTerm, setTestingTerm] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ count: number; logs: any[] } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState('');
  const [editSlug, setEditSlug] = useState('');

  const { data: themes } = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('themes').select('slug, name').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: synonyms, isLoading } = useQuery({
    queryKey: ['nexus_synonyms'],
    queryFn: async () => {
      const { data, error } = await supabase.from('nexus_synonyms').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const addMutation = useMutation({
    mutationFn: async (payload: { term: string, canonical_slug: string }) => {
      const { data, error } = await supabase.from('nexus_synonyms').insert(payload).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Sinônimo cadastrado com sucesso');
      setNewTerm('');
      setNewSlug('');
      queryClient.invalidateQueries({ queryKey: ['nexus_synonyms'] });
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string, term: string, canonical_slug: string }) => {
      const { data, error } = await supabase
        .from('nexus_synonyms')
        .update({ term: payload.term, canonical_slug: payload.canonical_slug })
        .eq('id', payload.id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Sinônimo atualizado');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['nexus_synonyms'] });
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nexus_synonyms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Sinônimo removido');
      queryClient.invalidateQueries({ queryKey: ['nexus_synonyms'] });
    }
  });

  const testConnection = async (term: string, slug: string) => {
    setTestingTerm(term);
    setIsTesting(true);
    setTestResults(null);
    try {
      const { content, logs } = await fetchNexusTagContent({ label: term, slug: slug } as any);
      setTestResults({ count: content.length, logs });
    } catch (err) {
      console.error('Test connection error:', err);
      toast.error('Falha ao testar conexão');
    } finally {
      setIsTesting(false);
    }
  };

  const startEditing = (syn: any) => {
    setEditingId(syn.id);
    setEditTerm(syn.term);
    setEditSlug(syn.canonical_slug);
  };

  const filteredSynonyms = useMemo(() => {
    return synonyms?.filter(s => 
      s.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.canonical_slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [synonyms, searchTerm]);

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-primary/10 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-serif font-bold flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" /> Gerenciador de Sinônimos Nexus
          </CardTitle>
          <CardDescription className="text-xs font-serif italic">
            Cadastre variações linguísticas ou termos comuns que devem apontar para temas teológicos específicos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sinônimo / Variação</label>
              <Input 
                placeholder="Ex: Virgem Maria" 
                value={newTerm} 
                onChange={(e) => setNewTerm(e.target.value)}
                className="rounded-xl border-border/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tema Alvo (Slug)</label>
              <select 
                value={newSlug} 
                onChange={(e) => setNewSlug(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-border/50"
              >
                <option value="">Selecione um tema...</option>
                {themes?.map(t => (
                  <option key={t.slug} value={t.slug}>{t.name} ({t.slug})</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button 
                onClick={() => addMutation.mutate({ term: newTerm, canonical_slug: newSlug })}
                disabled={!newTerm || !newSlug || addMutation.isPending}
                className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-primary/10"
              >
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Cadastrar
              </Button>
              <Button 
                variant="outline"
                onClick={() => testConnection(newTerm, newSlug)}
                disabled={!newTerm || !newSlug || isTesting}
                className="rounded-xl w-10 h-10 p-0 shadow-sm border-border/50"
              >
                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {testingTerm === newTerm && testResults && (
            <div className={`p-4 rounded-2xl flex items-center justify-between border ${testResults.count > 0 ? 'bg-green-500/5 border-green-500/20 text-green-700' : 'bg-red-500/5 border-red-500/20 text-red-700'}`}>
              <div className="flex items-center gap-3">
                {testResults.count > 0 ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <div>
                  <p className="text-xs font-bold">Resultado do Teste para "{testingTerm}"</p>
                  <p className="text-[10px] opacity-80">{testResults.count} conexões encontradas no Nexus.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setTestResults(null)} className="h-6 w-6 p-0 rounded-full">
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input 
              placeholder="Filtrar sinônimos ativos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-border/50"
            />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4">
            Total: {filteredSynonyms?.length || 0}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {filteredSynonyms?.map((syn) => (
              <Card key={syn.id} className="rounded-2xl border-border/40 hover:border-primary/20 transition-all group overflow-hidden bg-card shadow-sm">
                <CardContent className="p-4 space-y-3">
                  {editingId === syn.id ? (
                    <div className="space-y-3">
                      <Input 
                        value={editTerm} 
                        onChange={(e) => setEditTerm(e.target.value)}
                        className="h-8 text-sm rounded-lg"
                        placeholder="Sinônimo"
                      />
                      <select 
                        value={editSlug} 
                        onChange={(e) => setEditSlug(e.target.value)}
                        className="w-full h-8 px-2 py-1 bg-background border border-input rounded-lg text-xs focus:outline-none"
                      >
                        {themes?.map(t => (
                          <option key={t.slug} value={t.slug}>{t.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 h-7 text-[10px] font-black uppercase tracking-widest rounded-lg"
                          onClick={() => updateMutation.mutate({ id: syn.id, term: editTerm, canonical_slug: editSlug })}
                          disabled={updateMutation.isPending}
                        >
                          <Save className="w-3 h-3 mr-1" /> Salvar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-[10px] font-black uppercase tracking-widest rounded-lg"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-foreground">{syn.term}</p>
                          <p className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                            <RefreshCw className="w-2.5 h-2.5" /> {syn.canonical_slug}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => startEditing(syn)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteMutation.mutate(syn.id)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-border/20">
                        <p className="text-[9px] text-muted-foreground font-serif italic">
                          Cadastrado em {new Date(syn.created_at).toLocaleDateString()}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => testConnection(syn.term, syn.canonical_slug)}
                          className="h-6 px-2 text-[8px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary rounded-md"
                        >
                          {testingTerm === syn.term && isTesting ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <>Validar Conexão</>
                          )}
                        </Button>
                      </div>
                    </>
                  )}

                  {testingTerm === syn.term && testResults && !editingId && (
                    <div className={`mt-2 p-2 rounded-lg text-[10px] border ${testResults.count > 0 ? 'bg-green-500/5 border-green-500/20 text-green-700' : 'bg-red-500/5 border-red-500/20 text-red-700'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{testResults.count} resultados encontrados.</span>
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setTestResults(null)} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredSynonyms?.length === 0 && !isLoading && (
          <div className="text-center py-20 space-y-2 opacity-30">
            <Info className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-sm italic font-serif">Nenhum sinônimo encontrado para sua busca.</p>
          </div>
        )}
      </div>
    </div>
  );
};
