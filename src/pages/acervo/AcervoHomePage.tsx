import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { EditorialHero, EditorialCard, EditorialDivider, EditorialKicker } from '@/components/editorial/harmony';
import { SpaceLayout, SpaceHeader, SpaceEntrance, SpaceSectionTitle, SpaceFooter } from '@/components/cathedra/space/SpaceLayout';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { MONASTERY_SHELVES } from '@/config/monasteryShelves';
import {
  countLibraryByKind,
  fetchLibraryFeatured,
} from '@/services/libraryService';
import type { LibraryItem } from '@/types/library';
import AcervoContinueReadingPanel from './AcervoContinueReadingPanel';
import { useAuth } from '@/hooks/useAuth';
import { useChurchContext, FALLBACK_POPE } from '@/hooks/useChurchContext';
import SacredImage from '@/components/cathedra/SacredImage';

const LibraryOfflineFallback: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="py-spacing-2xl px-spacing-md text-center space-y-spacing-md bg-destructive/5 rounded-premium border border-destructive/10 animate-fade-in">
    <ShieldAlert className="w-12 h-12 mx-auto text-destructive/60" />
    <div className="space-y-spacing-xs">
      <h3 className="type-h3 text-destructive">Biblioteca Temporariamente Indisponível</h3>
      <p className="type-body opacity-80 max-w-[50ch] mx-auto font-serif italic">
        Não conseguimos conectar ao mosteiro. Verifique sua conexão ou tente novamente em instantes.
      </p>
    </div>
    <Button 
      variant="outline" 
      onClick={onRetry}
      className="rounded-premium-full gap-spacing-xs"
    >
      <RefreshCw className="w-4 h-4" />
      Tentar Reconexão
    </Button>
  </div>
);

const AcervoHomePage: React.FC = () => {
  const { profile } = useAuth();
  const { currentPope, todaySaint, liturgy } = useChurchContext();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [featured, setFeatured] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setIsOffline(false);

    Promise.all([countLibraryByKind(), fetchLibraryFeatured(6)])
      .then(([c, f]) => {
        if (!alive) return;
        setCounts(c);
        setFeatured(f);
      })
      .catch((e) => {
        console.error('[Acervo] load error', e);
        if (alive) setIsOffline(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [retryCount]);

  const handleRetry = () => setRetryCount(prev => prev + 1);


  const firstName = profile?.name?.split(' ')[0] || 'Peregrino';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';


  return (
    <div className="min-h-screen bg-background" data-space="atrium">
      <Helmet>
        <title>Acervo Cathedra — Ecossistema Espiritual Vivo</title>
        <meta
          name="description"
          content="O Ecossistema Espiritual Vivo: Bíblia, Catecismo, Magistério e vida dos santos organizados para sua caminhada."
        />
        <link rel="canonical" href="https://cathedradigital.com.br/acervo" />
      </Helmet>

      <SpaceLayout>
        <EditorialHero 
          density="expanded"
          align="center"
        >
          <EditorialHero.Eyebrow>Ecossistema Vivo · Átrio do Conhecimento</EditorialHero.Eyebrow>
          <EditorialHero.Title>Biblioteca do Cathedra</EditorialHero.Title>
          <EditorialHero.Subtitle>Toda a riqueza da fé católica em um ambiente onde tudo se conecta.</EditorialHero.Subtitle>
        </EditorialHero>



        <SpaceEntrance>
          <div className="w-full max-w-2xl mx-auto">
            <div className="rounded-premium-full p-spacing-xs border border-primary/15 bg-card/60 backdrop-blur-md shadow-premium-sm flex items-center group/search focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Icons.Search className="ml-spacing-md w-5 h-5 text-primary/30 group-focus-within/search:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="Pesquisar qualquer tema (Bíblia, Santos, Doutrina...)"
                className="flex-1 bg-transparent border-none focus:ring-0 font-reader italic px-spacing-md py-spacing-sm placeholder:text-muted-foreground/40"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value.trim();
                    if (query) window.location.href = `/buscar?q=${encodeURIComponent(query)}`;
                  }
                }}
              />
            </div>
          </div>
        </SpaceEntrance>

      <div className="py-spacing-xl space-y-spacing-3xl">
        {/* Seção Principal — Grid de Duas Colunas no Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-spacing-xl">
          
          {/* Coluna Esquerda: Sua Caminhada (Progressiva) */}
          <aside className="lg:col-span-4 space-y-spacing-xl order-2 lg:order-1">
             <div className="space-y-spacing-md">
                <EditorialKicker>Sua caminhada</EditorialKicker>
                <div className="bg-card/40 rounded-premium border border-primary/5 p-spacing-md">
                   <AcervoContinueReadingPanel />
                </div>
             </div>

             <div className="space-y-spacing-md">
                <EditorialKicker>Quero crescer em...</EditorialKicker>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Fé', emoji: '❤️' },
                    { label: 'Oração', emoji: '🙏' },
                    { label: 'Família', emoji: '👨‍👩‍👧' },
                    { label: 'Vida dos Santos', emoji: '✝' },
                    { label: 'Bíblia', emoji: '📖' },
                    { label: 'Maria', emoji: '🌹' },
                  ].map((trilha) => (
                    <Button 
                      key={trilha.label} 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full bg-card/40 border-primary/10 hover:border-primary/30 transition-all px-spacing-lg h-auto py-2 text-xs"
                      onClick={() => window.location.href = `/buscar?q=${encodeURIComponent(trilha.label)}`}
                    >
                      <span className="mr-2" aria-hidden="true">{trilha.emoji}</span>
                      {trilha.label}
                    </Button>
                  ))}
                </div>
             </div>
          </aside>

          {/* Coluna Direita: Hoje no Cathedra (Biblioteca Viva) */}
          <section className="lg:col-span-8 space-y-spacing-md order-1 lg:order-2">
            <h2 className="text-premium-small font-black uppercase tracking-[0.2em] text-primary">
              Hoje no Cathedra
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-md">
              {/* SSoT: Papa Atual */}
              <Link to="/papas" className="group">
                <EditorialCard density="dense" className="h-full bg-primary/[0.01] hover:bg-primary/[0.03] border-primary/10">
                  <div className="flex items-center gap-spacing-md">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-primary/20 shrink-0">
                      <SacredImage 
                        src={currentPope?.image || FALLBACK_POPE.image} 
                        alt={currentPope?.name || 'Papa'} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <EditorialCard.Eyebrow>🇻🇦 Magistério Vivo</EditorialCard.Eyebrow>
                      <EditorialCard.Title>{currentPope?.name || 'Papa Francisco'}</EditorialCard.Title>
                      <EditorialCard.Description>O sucessor de Pedro nos guia na fé.</EditorialCard.Description>
                    </div>
                  </div>
                </EditorialCard>
              </Link>

              {/* SSoT: Santo do Dia */}
              <Link to="/santos" className="group">
                <EditorialCard density="dense" className="h-full bg-primary/[0.01] hover:bg-primary/[0.03] border-primary/10">
                   <div className="flex items-center gap-spacing-md">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-primary/20 shrink-0">
                      <SacredImage 
                        src={todaySaint?.image || ''} 
                        alt={todaySaint?.name || 'Santo'} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <EditorialCard.Eyebrow>👤 Santo do Dia</EditorialCard.Eyebrow>
                      <EditorialCard.Title>{todaySaint?.name || 'Vidas Exemplares'}</EditorialCard.Title>
                      <EditorialCard.Description>O modelo de santidade para hoje.</EditorialCard.Description>
                    </div>
                  </div>
                </EditorialCard>
              </Link>

              <Link to="/liturgia" className="group">
                <EditorialCard density="dense" className="h-full bg-primary/[0.01] hover:bg-primary/[0.03]">
                  <EditorialCard.Eyebrow>☀ Evangelho do Dia</EditorialCard.Eyebrow>
                  <EditorialCard.Title>{liturgy?.liturgia || 'A Palavra Viva'}</EditorialCard.Title>
                  <EditorialCard.Description>Reflexão e leitura litúrgica para hoje.</EditorialCard.Description>
                </EditorialCard>
              </Link>
              <Link to="/catechism" className="group">
                <EditorialCard density="dense" className="h-full bg-primary/[0.01] hover:bg-primary/[0.03]">
                  <EditorialCard.Eyebrow>🏛 Catecismo da Igreja</EditorialCard.Eyebrow>
                  <EditorialCard.Title>Doutrina Viva</EditorialCard.Title>
                  <EditorialCard.Description>Aprofunde-se no depósito da fé.</EditorialCard.Description>
                </EditorialCard>
              </Link>
            </div>
          </section>

        </div>

        <EditorialDivider variant="gold-fade" className="max-w-2xl mx-auto opacity-30" />

        {/* Estantes do Conhecimento (Acervo Monástico 3.0) — Mobile: Estante Visual App-like */}
        <section className="space-y-spacing-xl">
            <h2 className="text-premium-small font-black uppercase tracking-[0.2em] text-gold text-center">
               Estantes do Mosteiro
            </h2>
           
           <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-spacing-md">
              {[
                { label: 'BÍBLIA', to: '/bible', icon: Icons.Book, desc: 'Sagrada Escritura' },
                { label: 'CATECISMO', to: '/catechism', icon: Icons.Church, desc: 'Doutrina da Fé' },
                { label: 'SANTOS', to: '/santos', icon: Icons.Sparkles, desc: 'Vidas exemplares' },
                { label: 'ORAÇÕES', to: '/oracao', icon: Icons.Flame, desc: 'Livro de Preces' },
                { label: 'PATRÍSTICA', to: '/biblioteca/acervo/padres', icon: Icons.Library, desc: 'Santos Padres' },
                { label: 'MAGISTÉRIO', to: '/papas', icon: Icons.Scroll, desc: 'Voz da Igreja' },
                { label: 'APARIÇÕES', to: '/aparicoes', icon: Icons.Sun, desc: 'Relatos Marianos' },
                { label: 'LITURGIA', to: '/liturgia', icon: Icons.Calendar, desc: 'Tempo Sagrado' },
              ].map((item) => (
                <Link key={item.label} to={item.to} className="group flex flex-col">
                  <div className="p-spacing-lg rounded-premium border border-primary/10 bg-card/40 hover:bg-primary/[0.02] hover:border-gold/30 transition-all text-center space-y-3 h-full flex flex-col items-center justify-center relative shadow-sm">
                     <item.icon className="w-8 h-8 mx-auto text-secondary/60 group-hover:text-gold transition-colors" />
                     <h3 className="text-[12px] font-black uppercase tracking-widest text-primary group-hover:text-secondary">{item.label}</h3>
                     <p className="text-[9px] text-muted-foreground/60 uppercase tracking-tighter">{item.desc}</p>
                  </div>
                </Link>
              ))}
           </div>
        </section>

        {/* Biblioteca Inteligente (Logos) — Amplo Desktop */}
        <section className="bg-primary/5 rounded-premium p-spacing-xl md:p-spacing-2xl border border-primary/10">
           <div className="max-w-3xl mx-auto text-center space-y-spacing-lg">
              <Icons.Sparkles className="w-12 h-12 mx-auto text-primary/40" />
              <h2 className="type-h2">O Logos</h2>
              <p className="type-lead opacity-80">Converse com o Logos e encontre conexões profundas entre a Bíblia, o Catecismo e a Tradição.</p>
              <Button size="lg" className="rounded-premium-full px-spacing-xl" onClick={() => window.location.href = '/buscar'}>
                Iniciar Conversa com o Logos
              </Button>
           </div>
        </section>

        {/* Recomendações do Nexus */}
        <section className="space-y-spacing-md">
          <h2 className="text-premium-small font-black uppercase tracking-[0.2em] text-primary">
            Sugerido pelo Nexus
          </h2>
          {isOffline ? (
            <LibraryOfflineFallback onRetry={handleRetry} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-md">
              {!loading && featured.slice(0, 3).map(item => (
                <Link key={item.id} to={item.href} className="group">
                  <EditorialCard density="dense" className="h-full">
                    <EditorialCard.Eyebrow>Destaque Editorial</EditorialCard.Eyebrow>
                    <EditorialCard.Title>{item.title}</EditorialCard.Title>
                    <EditorialCard.Description>{item.author_label || 'Obra fundamental'}</EditorialCard.Description>
                  </EditorialCard>
                </Link>
              ))}
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 rounded-premium bg-primary/5 animate-pulse" />
              ))}
            </div>
          )}
        </section>

        <SpaceFooter 
          note="A busca pela Verdade termina no encontro com o Logos."
          links={[
            { label: 'Átrio', to: '/', hint: 'Voltar ao início' },
            { label: 'Rezar', to: '/rezar', hint: 'Transformar estudo em oração' },
            { label: 'Comunidade', to: '/community', hint: 'Partilhar o conhecimento' },
          ]}
        />
      </div>
      </SpaceLayout>
    </div>
  );
};

export default AcervoHomePage;
