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
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState({ total: 0, ok: 0, missing: 0, divergent: 0 });
  const [filter, setFilter] = useState<'all' | 'missing' | 'divergent'>('all');
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
      setOfficialDataMap(new Map(officialData.map(d => [d.paragraph, d])));
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
              newResults.push({
                paragraph: p,
                section: section.title,
                status: 'divergent',
                details: 'Conteúdo local difere do banco oficial'
              });
            } else {
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

  const handleSync = async () => {
    setIsSyncing(true);
    let syncedCount = 0;
    
    try {
      const divergentOrMissing = results.filter(r => r.status === 'missing' || r.status === 'divergent');
      
      for (const res of divergentOrMissing) {
        const official = officialDataMap.get(res.paragraph);
        if (official) {
          await cacheCatechismParagraph(res.paragraph, {
            paragraph: res.paragraph,
            content: official.content,
            language: 'pt',
            status: 'official'
          });
          syncedCount++;
        }
      }
      
      toast.success(`${syncedCount} parágrafos sincronizados com o cache local.`);
      runVerification();
    } catch (err: any) {
      toast.error('Erro na sincronização: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) runVerification();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-spacing-xl">
        <Icons.Lock className="w-spacing-3xl h-spacing-3xl text-destructive mb-spacing-md opacity-20" />
        <h2 className="text-premium-xl font-bold mb-spacing-xs">Acesso Restrito</h2>
        <p className="text-muted-foreground">Esta página é para administradores.</p>
      </div>
    );
  }

  const filteredResults = results.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="w-full p-spacing-lg space-y-spacing-xl animate-in fade-in duration-500 pb-spacing-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-spacing-md">
        <div>
          <h1 className="text-premium-2xl font-serif font-bold text-foreground">Verificação de Conteúdo</h1>
          <p className="text-premium-sm text-muted-foreground">Comparação entre seções do site e banco de dados oficial</p>
        </div>
        
        <div className="flex items-center gap-spacing-sm">
          {(stats.missing > 0 || stats.divergent > 0) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" className="rounded-premium-full bg-emerald-600 hover:bg-emerald-700">
                  <Icons.CheckCircle className="w-spacing-md h-spacing-md mr-spacing-xs" />
                  Sincronizar {stats.missing + stats.divergent} Divergências
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-premium-full border-border bg-card">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-serif">Sincronizar com o Banco?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá atualizar o cache local dos parágrafos ausentes ou divergentes com o conteúdo oficial do banco de dados. 
                    Isso garante que o usuário veja a versão mais recente mesmo offline.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-premium-full">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSync} className="rounded-premium-full bg-emerald-600 hover:bg-emerald-700">
                    Sincronizar Agora
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button 
            onClick={runVerification} 
            disabled={loading}
            variant="outline"
            size="sm"
            className="rounded-premium-full"
          >
            <Icons.RotateCcw className={`w-spacing-md h-spacing-md mr-spacing-xs ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-spacing-md">
        <Card className="p-spacing-md bg-muted/30 border-border/50">
          <span className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Total Mapeado</span>
          <div className="text-premium-2xl font-serif font-bold">{stats.total}</div>
        </Card>
        <Card className="p-spacing-md bg-emerald-500/5 border-emerald-500/20">
          <span className="text-premium-xs font-black uppercase tracking-widest text-emerald-600">Sincronizados</span>
          <div className="text-premium-2xl font-serif font-bold text-emerald-600">{stats.ok}</div>
        </Card>
        <Card className="p-spacing-md bg-destructive/5 border-destructive/20">
          <span className="text-premium-xs font-black uppercase tracking-widest text-destructive">Ausentes</span>
          <div className="text-premium-2xl font-serif font-bold text-destructive">{stats.missing}</div>
        </Card>
        <Card className="p-spacing-md bg-amber-500/5 border-amber-500/20">
          <span className="text-premium-xs font-black uppercase tracking-widest text-amber-600">Divergentes</span>
          <div className="text-premium-2xl font-serif font-bold text-amber-600">{stats.divergent}</div>
        </Card>
      </div>

      <div className="space-y-spacing-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-spacing-xs bg-muted/50 p-spacing-2xs rounded-premium border border-border">
            <Button 
              onClick={() => setFilter('all')} 
              className={`px-spacing-md py-spacing-2xs text-premium-xs font-black uppercase tracking-widest rounded-premium-full transition-all ${filter === 'all' ? 'bg-primary text-primary-foreground shadow-premium-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Todos
            </Button>
            <Button 
              onClick={() => setFilter('missing')} 
              className={`px-spacing-md py-spacing-2xs text-premium-xs font-black uppercase tracking-widest rounded-premium-full transition-all ${filter === 'missing' ? 'bg-destructive text-destructive-foreground shadow-premium-md' : 'text-muted-foreground hover:text-destructive'}`}
            >
              Ausentes
            </Button>
            <Button 
              onClick={() => setFilter('divergent')} 
              className={`px-spacing-md py-spacing-2xs text-premium-xs font-black uppercase tracking-widest rounded-premium-full transition-all ${filter === 'divergent' ? 'bg-amber-500 text-white shadow-premium-md' : 'text-muted-foreground hover:text-amber-600'}`}
            >
              Divergentes
            </Button>
          </div>
          <span className="text-premium-xs font-black uppercase text-muted-foreground">
            {filteredResults.length} parágrafos exibidos
          </span>
        </div>

        <div className="bg-card border border-border rounded-premium overflow-hidden shadow-premium-md">
          <table className="w-full text-left text-premium-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-premium-xs font-black uppercase tracking-widest text-muted-foreground">
                <th className="px-spacing-lg py-spacing-md">§ Parágrafo</th>
                <th className="px-spacing-lg py-spacing-md">Seção</th>
                <th className="px-spacing-lg py-spacing-md">Status</th>
                <th className="px-spacing-lg py-spacing-md">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-spacing-lg py-spacing-2xl text-center">
                    <div className="flex flex-col items-center gap-spacing-md">
                      <Icons.Loader className="w-spacing-xl h-spacing-xl animate-spin text-primary/40" />
                      <span className="text-muted-foreground animate-pulse">Analisando base de dados...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-spacing-lg py-spacing-2xl text-center text-muted-foreground italic">
                    Nenhum item encontrado com este filtro.
                  </td>
                </tr>
              ) : (
                filteredResults.map((res, i) => (
                  <tr key={`${res.paragraph}-${i}`} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-spacing-lg py-spacing-md font-bold font-serif text-primary">§{res.paragraph}</td>
                    <td className="px-spacing-lg py-spacing-md text-premium-xs font-medium text-muted-foreground">{res.section}</td>
                    <td className="px-spacing-lg py-spacing-md">
                      {res.status === 'ok' ? (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0 uppercase text-premium-xs font-black">OK</Badge>
                      ) : res.status === 'missing' ? (
                        <Badge variant="destructive" className="uppercase text-premium-xs font-black">Ausente</Badge>
                      ) : (
                        <Badge className="bg-amber-500 text-white border-0 uppercase text-premium-xs font-black">Divergente</Badge>
                      )}
                    </td>
                    <td className="px-spacing-lg py-spacing-md text-premium-small text-muted-foreground italic">
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
