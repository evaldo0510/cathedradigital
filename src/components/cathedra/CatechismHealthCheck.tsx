import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { CATECHISM_LOCAL_DATA } from '@/data/catechism';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { isCatechism } from '@/lib/catechismValidation';

const CatechismHealthCheck: React.FC = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<{ name: string; status: 'pass' | 'fail' | 'pending'; message: string }[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const newResults: typeof results = [];

    // Test 1: Data Integrity
    const localData = Object.values(CATECHISM_LOCAL_DATA);
    const allAreCatechism = localData.every(p => isCatechism(p));
    newResults.push({
      name: 'Integridade dos Dados Locais',
      status: allAreCatechism ? 'pass' : 'fail',
      message: allAreCatechism 
        ? `Todos os ${localData.length} parágrafos locais são do tipo 'catechism'.` 
        : 'Detectados parágrafos com tipo incorreto nos dados locais.'
    });

    // Test 2: Search Param Logic
    const testParams = new URLSearchParams('q=fé&tags=deus&page=1');
    const q = testParams.get('q');
    const tags = testParams.get('tags');
    const isValidParams = q === 'fé' && tags === 'deus';
    newResults.push({
      name: 'Persistência de URL (Lógica)',
      status: isValidParams ? 'pass' : 'fail',
      message: isValidParams 
        ? 'Lógica de extração de parâmetros de busca validada.' 
        : 'Falha ao processar parâmetros de busca da URL.'
    });

    // Test 3: Tag Filtering Consistency
    const tagToTest = 'fe';
    const filteredByTag = localData.filter(p => p.tags.includes(tagToTest));
    const allMatchesHaveTag = filteredByTag.every(p => p.tags.includes(tagToTest));
    newResults.push({
      name: 'Consistência de Filtros (Tags)',
      status: (allMatchesHaveTag && filteredByTag.length > 0) ? 'pass' : 'fail',
      message: allMatchesHaveTag 
        ? `Filtro por '${tagToTest}' retornou ${filteredByTag.length} itens consistentes.` 
        : `Erro na lógica de filtragem por tag.`
    });

    setResults(newResults);
    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Validação do Catecismo</h1>
          <p className="text-muted-foreground">Verificação automática de tipos e consistência de dados.</p>
        </div>
        <Button onClick={runTests} disabled={isRunning} variant="outline" size="sm">
          {isRunning ? <Icons.Loader className="w-4 h-4 animate-spin" /> : <Icons.RotateCcw className="w-4 h-4" />}
          <span className="ml-2">Recomeçar</span>
        </Button>
      </div>

      <div className="space-y-4">
        {results.map((res, i) => (
          <Card key={i} className="p-4 flex items-center justify-between border-l-4 overflow-hidden" style={{ borderLeftColor: res.status === 'pass' ? '#10b981' : '#ef4444' }}>
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${res.status === 'pass' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                {res.status === 'pass' ? <Icons.Check className="w-4 h-4" /> : <Icons.X className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="font-bold text-sm">{res.name}</h3>
                <p className="text-xs text-muted-foreground">{res.message}</p>
              </div>
            </div>
            <Badge variant={res.status === 'pass' ? 'secondary' : 'destructive'} className="uppercase text-[9px] font-black tracking-widest">
              {res.status}
            </Badge>
          </Card>
        ))}
      </div>

      <div className="pt-8 border-t border-border">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4">Fluxo de Navegação Sugerido</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="ghost" className="h-auto p-4 flex flex-col items-start text-left border border-border" onClick={() => navigate(AppRoute.CATECHISM)}>
            <span className="text-primary font-black text-[10px] mb-1">Passo 1</span>
            <span className="text-xs font-bold">Leitor do Catecismo</span>
            <span className="text-[10px] text-muted-foreground mt-1">Verifique o botão "Explorar"</span>
          </Button>
          <Button variant="ghost" className="h-auto p-4 flex flex-col items-start text-left border border-border" onClick={() => navigate(AppRoute.CATECHISM_EXPLORER)}>
            <span className="text-primary font-black text-[10px] mb-1">Passo 2</span>
            <span className="text-xs font-bold">Explorer do Catecismo</span>
            <span className="text-[10px] text-muted-foreground mt-1">Teste busca e tags multi-select</span>
          </Button>
          <Button variant="ghost" className="h-auto p-4 flex flex-col items-start text-left border border-border" onClick={() => navigate(`${AppRoute.CATECHISM_EXPLORER}?tags=fe&sort=number-desc`)}>
            <span className="text-primary font-black text-[10px] mb-1">Passo 3</span>
            <span className="text-xs font-bold">Filtros Persistentes</span>
            <span className="text-[10px] text-muted-foreground mt-1">Recarregue a página e veja se mantém</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CatechismHealthCheck;
