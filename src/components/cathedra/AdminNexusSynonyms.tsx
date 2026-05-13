import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Search, Info } from 'lucide-react';
import { toast } from 'sonner';

export const AdminNexusSynonyms = () => {
  const queryClient = useQueryClient();
  const [newTerm, setNewTerm] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredSynonyms = synonyms?.filter(s => 
    s.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.canonical_slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-primary/10 bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-serif font-bold">Gerenciador de Sinônimos Nexus</CardTitle>
          <CardDescription className="text-xs font-serif italic">
            Cadastre termos que não estão retornando resultados e vincule-os a um tema canônico.
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
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tema Alvo (Slug)</label>
              <select 
                value={newSlug} 
                onChange={(e) => setNewSlug(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Selecione um tema...</option>
                {themes?.map(t => (
                  <option key={t.slug} value={t.slug}>{t.name} ({t.slug})</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => addMutation.mutate({ term: newTerm, canonical_slug: newSlug })}
                disabled={!newTerm || !newSlug || addMutation.isPending}
                className="w-full rounded-xl font-black uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-primary/10"
              >
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Cadastrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input 
            placeholder="Filtrar sinônimos..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSynonyms?.map((syn) => (
              <Card key={syn.id} className="rounded-2xl border-border/40 hover:border-primary/20 transition-all group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-foreground">{syn.term}</p>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">→ {syn.canonical_slug}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteMutation.mutate(syn.id)}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredSynonyms?.length === 0 && !isLoading && (
          <div className="text-center py-10 space-y-2 opacity-50">
            <Info className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm italic font-serif">Nenhum sinônimo encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};
