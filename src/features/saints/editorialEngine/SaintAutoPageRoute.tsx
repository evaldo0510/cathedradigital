/**
 * SaintAutoPageRoute — rota canônica `/santos/:id`.
 *
 * Fluxo único de renderização:
 *   1. Carrega o santo via `getSaintById`.
 *   2. Adapta para `SaintEditorialData` (`saintToEditorialData`).
 *   3. Produz o descriptor com `buildSaintPage` (skip-if-empty).
 *   4. Renderiza `SaintAutoPage` (ReaderShell + EditorialHero + blocos).
 *
 * Sem modais. Sem renderer legado. A leitura de escritos internos
 * roteia dentro do próprio Cathedra pelo `SaintWritingsBlock`.
 */
import React, { useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSaintById } from '@/services/saintsService';
import SEOHead from '@/components/SEOHead';
import { ReaderShell, EditorialHero } from '@/components/reader';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { SaintAutoPage } from './SaintAutoPage';
import { buildSaintPage } from './buildSaintPage';
import { saintToEditorialData } from './saintToEditorialData';

const SaintAutoPageRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: saint, isLoading, isError } = useQuery({
    queryKey: ['saint-auto', id],
    queryFn: () => (id ? getSaintById(id) : Promise.resolve(null)),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 60 * 24, // 24h
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 dias
  });

  useEffect(() => {
    if (id) {
      try { localStorage.setItem('cathedra:saints:last-id', id); } catch { /* ignore */ }
    }
  }, [id]);

  if (!id) return <Navigate to="/santos" replace />;

  if (isLoading) {
    return (
      <ReaderShell
        contentMaxWidth="max-w-3xl"
        ariaLabel="Carregando santo"
        hero={<EditorialHero kicker="Sanctorum" title="Carregando…" />}
      >
        <div className="animate-pulse space-y-spacing-md" aria-hidden>
          <div className="h-4 w-2/3 bg-muted/60 rounded" />
          <div className="h-4 w-full bg-muted/40 rounded" />
          <div className="h-4 w-11/12 bg-muted/40 rounded" />
        </div>
      </ReaderShell>
    );
  }

  if (isError || !saint) {
    return (
      <>
        <SEOHead
          title="Santo não encontrado"
          description="Este verbete do Sanctorum não foi encontrado no Cathedra."
          path={`/santos/${id}`}
        />
        <ReaderShell
          contentMaxWidth="max-w-2xl"
          ariaLabel="Santo não encontrado"
          hero={<EditorialHero kicker="Sanctorum" title="Santo não encontrado" />}
        >
          <div className="text-center space-y-spacing-lg py-spacing-2xl">
            <Icons.Cross className="w-spacing-2xl h-spacing-2xl text-secondary/60 mx-auto" aria-hidden />
            <p className="font-serif italic text-muted-foreground">
              Não localizamos este verbete no Sanctorum. Ele pode ter sido movido ou ainda não foi publicado.
            </p>
            <div className="flex flex-wrap justify-center gap-spacing-sm">
              <Button onClick={() => navigate('/santos')}>Voltar ao Sanctorum</Button>
              <Button variant="outline" onClick={() => navigate(-1)}>Página anterior</Button>
            </div>
          </div>
        </ReaderShell>
      </>
    );
  }

  const descriptor = buildSaintPage(saintToEditorialData(saint));

  return (
    <>
      <SEOHead
        title={`${saint.name} — Sanctorum`}
        description={saint.bio?.slice(0, 155) || `${saint.name}: vida, virtudes e escritos no Sanctorum do Cathedra.`}
        path={`/santos/${saint.id}`}
        image={saint.image}
        breadcrumbs={[
          { name: 'Início', path: '/' },
          { name: 'Santos', path: '/santos' },
          { name: saint.name, path: `/santos/${saint.id}` },
        ]}
      />
      <SaintAutoPage descriptor={descriptor} />
    </>
  );
};

export default SaintAutoPageRoute;
