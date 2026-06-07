import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LanguageAdmin: React.FC = () => {
  const [allowlist, setAllowlist] = useState<any[]>([]);
  const [newTerm, setNewTerm] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllowlist();
  }, []);

  const fetchAllowlist = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('language_allowlist')
      .select('*')
      .order('term');
    if (!error) setAllowlist(data || []);
    setIsLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm) return;

    const { error } = await supabase
      .from('language_allowlist')
      .insert([{ term: newTerm, description: newDesc }]);

    if (error) {
      toast.error('Erro ao adicionar termo');
    } else {
      toast.success('Termo adicionado à allowlist');
      setNewTerm('');
      setNewDesc('');
      fetchAllowlist();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('language_allowlist')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao remover termo');
    } else {
      toast.success('Termo removido');
      fetchAllowlist();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary uppercase tracking-widest">Gestão de Linguagem</h1>
          <p className="text-sm text-muted-foreground italic">Gerencie exceções para a auditoria de vernáculo português.</p>
        </div>
        <Icons.ShieldCheck className="w-8 h-8 text-secondary" />
      </header>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">Novo Termo Permitido</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            placeholder="Termo (ex: Cathedra)"
            className="bg-muted/50 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-secondary/20"
          />
          <input 
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Descrição / Motivo"
            className="bg-muted/50 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-secondary/20"
          />
          <Button type="submit" className="h-full rounded-xl uppercase font-black tracking-widest text-[10px]">
            Adicionar à Allowlist
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Termos Ativos</h2>
          <span className="text-[10px] font-bold text-primary/20">{allowlist.length} registros</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            [1,2,3,4].map(i => <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-2xl" />)
          ) : allowlist.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group p-4 bg-background border border-border rounded-2xl flex items-center justify-between hover:border-secondary/20 transition-all"
            >
              <div className="flex flex-col">
                <span className="text-sm font-bold text-primary">{item.term}</span>
                <span className="text-[10px] text-muted-foreground italic">{item.description || 'Sem descrição'}</span>
              </div>
              <button 
                onClick={() => handleDelete(item.id)}
                className="p-2 text-primary/10 hover:text-red-500 transition-colors"
              >
                <Icons.Trash className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageAdmin;
