import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { CIC_SECTIONS, CATECHISM_LOCAL_DATA } from '@/data/catechism';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cacheCatechismParagraph } from '@/lib/offlineCache';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VerificationResult {
  paragraph: number;
  section: string;
  status: 'ok' | 'missing' | 'divergent';
  details?: string;
}

const CatechismVerification: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, ok: 0, missing: 0, divergent: 0 });
  const [filter, setFilter] = useState<'all' | 'missing' | 'divergent'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [officialDataMap, setOfficialDataMap] = useState<Map<number, any>>(new Map());

  const isAdmin = profile?.role === 'admin';

  const runVerification = async () => {
    setLoading(true);
    try {
      // 1. Fetch all paragraphs from official table
      const { data: officialData, error } = await supabase
        .from('catechism_official')
        .select('paragraph, content');
      
      if (error) throw error;

      const officialMap = new Map(officialData.map(d => [d.paragraph, d.content]));
      const newResults: VerificationResult[] = [];
      
      // 2. Iterate through sections defined in the site
      CIC_SECTIONS.forEach(part => {
        part.sections.forEach(section => {
          const [start, end] = section.paragraphs;
          for (let p = start; p <= end; p++) {
            const officialContent = officialMap.get(p);
            const localData = CATECHISM_LOCAL_DATA[p];

            if (!officialContent) {
              newResults.push({
                paragraph: p,
                section: section.title,
                status: 'missing',
                details: 'Ausente na tabela catechism_official'
              });
            } else if (localData && localData.conteudo !== officialContent) {
              // Only check divergence if we have local data to compare with
              // Divergence means local static data differs from DB official data
              newResults.push({
                paragraph: p,
                section: section.title,
                status: 'divergent',
                details: 'Conteúdo local difere do banco oficial'
              });
            } else {
              // It's in the DB and matches (or no local data to compare)
              // Note: If no local data, we assume DB is the truth and it's OK
              newResults.push({
                paragraph: p,
                section: section.title,
                status: 'ok'
              });
            }
          }
        });
      });

      setResults(newResults);
      
      const ok = newResults.filter(r => r.status === 'ok').length;
      const missing = newResults.filter(r => r.status === 'missing').length;
      const divergent = newResults.filter(r => r.status === 'divergent').length;
      
      setStats({
        total: newResults.length,
        ok,
        missing,
        divergent
      });

      toast.success('Verificação concluída!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao verificar integridade: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) runVerification();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <Icons.Lock className="w-16 h-16 text-destructive mb-4 opacity-20" />
        <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground">Esta página é para administradores.</p>
      </div>
    );
  }

  const filteredResults = results.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Verificação de Conteúdo</h1>
          <p className="text-sm text-muted-foreground">Comparação entre seções do site e banco de dados oficial</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={runVerification} 
            disabled={loading}
            variant="outline"
            size="sm"
            className="rounded-xl"
          >
            <Icons.RotateCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-muted/30 border-border/50">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Mapeado</span>
          <div className="text-2xl font-serif font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4 bg-emerald-500/5 border-emerald-500/20">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Sincronizados</span>
          <div className="text-2xl font-serif font-bold text-emerald-600">{stats.ok}</div>
        </Card>
        <Card className="p-4 bg-destructive/5 border-destructive/20">
          <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Ausentes</span>
          <div className="text-2xl font-serif font-bold text-destructive">{stats.missing}</div>
        </Card>
        <Card className="p-4 bg-amber-500/5 border-amber-500/20">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Divergentes</span>
          <div className="text-2xl font-serif font-bold text-amber-600">{stats.divergent}</div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border">
            <button 
              onClick={() => setFilter('all')} 
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilter('missing')} 
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === 'missing' ? 'bg-destructive text-destructive-foreground shadow-sm' : 'text-muted-foreground hover:text-destructive'}`}
            >
              Ausentes
            </button>
            <button 
              onClick={() => setFilter('divergent')} 
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === 'divergent' ? 'bg-amber-500 text-white shadow-sm' : 'text-muted-foreground hover:text-amber-600'}`}
            >
              Divergentes
            </button>
          </div>
          <span className="text-[10px] font-black uppercase text-muted-foreground">
            {filteredResults.length} parágrafos exibidos
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-4">§ Parágrafo</th>
                <th className="px-6 py-4">Seção</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Icons.Loader className="w-8 h-8 animate-spin text-primary/40" />
                      <span className="text-muted-foreground animate-pulse">Analisando base de dados...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                    Nenhum item encontrado com este filtro.
                  </td>
                </tr>
              ) : (
                filteredResults.map((res, i) => (
                  <tr key={`${res.paragraph}-${i}`} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-bold font-serif text-primary">§{res.paragraph}</td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{res.section}</td>
                    <td className="px-6 py-4">
                      {res.status === 'ok' ? (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0 uppercase text-[9px] font-black">OK</Badge>
                      ) : res.status === 'missing' ? (
                        <Badge variant="destructive" className="uppercase text-[9px] font-black">Ausente</Badge>
                      ) : (
                        <Badge className="bg-amber-500 text-white border-0 uppercase text-[9px] font-black">Divergente</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-muted-foreground italic">
                      {res.details || 'Conteúdo sincronizado'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CatechismVerification;
