import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { EditorialHero, EditorialCard, EditorialDivider, EditorialKicker } from '@/components/editorial/harmony';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import {
  countLibraryByKind,
  fetchLibraryFeatured,
} from '@/services/libraryService';
import type { LibraryItem, LibraryKind } from '@/types/library';
import AcervoContinueReadingPanel from './AcervoContinueReadingPanel';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const AcervoHomePage: React.FC = () => {
  const { profile } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [featured, setFeatured] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([countLibraryByKind(), fetchLibraryFeatured(6)])
      .then(([c, f]) => {
        if (!alive) return;
        setCounts(c);
        setFeatured(f);
      })
      .catch((e) => console.error('[Acervo] load', e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const firstName = profile?.name?.split(' ')[0] || 'Peregrino';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="min-h-screen bg-background" data-space="atrium">
      <Helmet>
        <title>Acervo Cathedra — Mosteiro do Conhecimento</title>
        <meta
          name="description"
          content="O Mosteiro do Conhecimento: Bíblia, Catecismo, Magistério e vida dos santos organizados para sua caminhada espiritual."
        />
        <link rel="canonical" href="https://cathedradigital.com.br/acervo" />
      </Helmet>

      {/* HERO — Estilo Mosteiro Digital */}
      <EditorialHero align="center" density="expanded" className="bg-primary/[0.02] border-b border-primary/5">
        <EditorialHero.Meta>Mosteiro Digital · Átrio do Conhecimento</EditorialHero.Meta>
        <EditorialHero.Eyebrow>{greeting}, {firstName}</EditorialHero.Eyebrow>
        <EditorialHero.Title>Biblioteca do Cathedra</EditorialHero.Title>
        <EditorialHero.Subtitle>Toda a riqueza da fé católica organizada para a sua caminhada espiritual.</EditorialHero.Subtitle>
        <EditorialHero.Actions>
           <div className="w-full max-w-2xl mx-auto mt-spacing-md">
            <div className="rounded-premium-full p-spacing-xs border border-primary/15 bg-card/60 backdrop-blur-md shadow-premium-sm flex items-center group/search focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Icons.Search className="ml-spacing-md w-5 h-5 text-primary/30 group-focus-within/search:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="Pesquisar qualquer tema (Bíblia, Santos, Doutrina...)"
                className="flex-1 bg-transparent border-none focus:ring-0 text-premium-md font-serif italic px-spacing-md py-spacing-sm placeholder:text-muted-foreground/40"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value.trim();
                    if (query) window.location.href = `/biblioteca/inteligente?q=${encodeURIComponent(query)}`;
                  }
                }}
              />
            </div>
          </div>
        </EditorialHero.Actions>
      </EditorialHero>

      <main className="max-w-[1400px] mx-auto px-spacing-md py-spacing-xl space-y-spacing-3xl">
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
                      onClick={() => window.location.href = `/biblioteca/inteligente?q=${encodeURIComponent(trilha.label)}`}
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
              <Link to="/liturgia" className="group">
                <EditorialCard density="dense" className="h-full bg-primary/[0.01] hover:bg-primary/[0.03]">
                  <EditorialCard.Eyebrow>☀ Evangelho do Dia</EditorialCard.Eyebrow>
                  <EditorialCard.Title>A Palavra Viva</EditorialCard.Title>
                  <EditorialCard.Description>Reflexão e leitura litúrgica para alimentar sua alma hoje.</EditorialCard.Description>
                </EditorialCard>
              </Link>
              <Link to="/santos" className="group">
                <EditorialCard density="dense" className="h-full bg-primary/[0.01] hover:bg-primary/[0.03]">
                  <EditorialCard.Eyebrow>👤 Santo do Dia</EditorialCard.Eyebrow>
                  <EditorialCard.Title>Vidas exemplares</EditorialCard.Title>
                  <EditorialCard.Description>Conheça o modelo de santidade que a Igreja celebra nesta data.</EditorialCard.Description>
                </EditorialCard>
              </Link>
              <Link to="/aparicoes" className="group">
                <EditorialCard density="dense" className="h-full bg-primary/[0.01] hover:bg-primary/[0.03]">
                  <EditorialCard.Eyebrow>🌟 Visita Celeste</EditorialCard.Eyebrow>
                  <EditorialCard.Title>Aparições Marianas</EditorialCard.Title>
                  <EditorialCard.Description>Mensagens de Nossa Senhora reconhecidas pela Igreja.</EditorialCard.Description>
                </EditorialCard>
              </Link>
              <Link to="/catechism" className="group">
                <EditorialCard density="dense" className="h-full bg-primary/[0.01] hover:bg-primary/[0.03]">
                  <EditorialCard.Eyebrow>🏛 Catecismo da Igreja</EditorialCard.Eyebrow>
                  <EditorialCard.Title>Doutrina Viva</EditorialCard.Title>
                  <EditorialCard.Description>Aprofunde-se no depósito da fé de forma estruturada.</EditorialCard.Description>
                </EditorialCard>
              </Link>
            </div>
          </section>
        </div>

        <EditorialDivider variant="gold-fade" className="max-w-2xl mx-auto opacity-30" />

        {/* Estantes do Conhecimento (Etapa 6) */}
        <section className="space-y-spacing-xl">
           <h2 className="text-premium-small font-black uppercase tracking-[0.2em] text-primary text-center">
              Estantes do Mosteiro
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-md">
              {/* Formação */}
              <div className="bg-card/40 border border-primary/5 p-spacing-lg rounded-premium space-y-spacing-md shadow-premium-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">I. Formação</h3>
                <div className="grid grid-cols-2 gap-spacing-sm">
                  {[
                    { label: 'Bíblia', to: '/bible', icon: Icons.Bible, count: '73 Livros' },
                    { label: 'Catecismo', to: '/catechism', icon: Icons.BookOpen, count: '2865 Artigos' },
                    { label: 'Magistério', to: '/magisterium', icon: Icons.ScrollText, count: 'Documentos' },
                    { label: 'Patrística', to: '/biblioteca', icon: Icons.Church, count: 'Obras' },
                  ].map(pilar => (
                    <Link key={pilar.label} to={pilar.to} className="group">
                      <div className="p-spacing-md rounded-premium border border-primary/5 bg-background/50 hover:bg-primary/[0.02] hover:border-primary/20 transition-all text-center space-y-2 h-full flex flex-col items-center justify-center">
                         <pilar.icon className="w-8 h-8 mx-auto text-primary/20 group-hover:text-primary transition-colors" />
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">{pilar.label}</h4>
                         <p className="text-[8px] text-muted-foreground/70 uppercase tracking-tight">{pilar.count}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Espiritualidade */}
              <div className="bg-card/40 border border-primary/5 p-spacing-lg rounded-premium space-y-spacing-md shadow-premium-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">II. Espiritualidade</h3>
                <div className="grid grid-cols-2 gap-spacing-sm">
                  {[
                    { label: 'Orações', to: '/oracao', icon: Icons.Heart, count: 'Livro' },
                    { label: 'Liturgia', to: '/liturgia', icon: Icons.Sun, count: 'Diário' },
                    { label: 'Rosário', to: '/oracao/rosario', icon: Icons.Disc, count: 'Contemplar' },
                    { label: 'Novenas', to: '/novenas', icon: Icons.Clock, count: 'Preces' },
                  ].map(pilar => (
                    <Link key={pilar.label} to={pilar.to} className="group">
                      <div className="p-spacing-md rounded-premium border border-primary/5 bg-background/50 hover:bg-primary/[0.02] hover:border-primary/20 transition-all text-center space-y-2 h-full flex flex-col items-center justify-center">
                         <pilar.icon className="w-8 h-8 mx-auto text-primary/20 group-hover:text-primary transition-colors" />
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">{pilar.label}</h4>
                         <p className="text-[8px] text-muted-foreground/70 uppercase tracking-tight">{pilar.count}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Igreja & Temas */}
              <div className="bg-card/40 border border-primary/5 p-spacing-lg rounded-premium space-y-spacing-md shadow-premium-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">III. A Igreja</h3>
                <div className="grid grid-cols-2 gap-spacing-sm">
                  {[
                    { label: 'Santos', to: '/saints', icon: Icons.User, count: 'Hagiografia' },
                    { label: 'Maria', to: '/aparicoes', icon: Icons.Star, count: 'Aparições' },
                    { label: 'Papas', to: '/papas', icon: Icons.Crown, count: 'Pedro' },
                    { label: 'Glossário', to: '/glossario', icon: Icons.Search, count: 'Léxico' },
                  ].map(pilar => (
                    <Link key={pilar.label} to={pilar.to} className="group">
                      <div className="p-spacing-md rounded-premium border border-primary/5 bg-background/50 hover:bg-primary/[0.02] hover:border-primary/20 transition-all text-center space-y-2 h-full flex flex-col items-center justify-center">
                         <pilar.icon className="w-8 h-8 mx-auto text-primary/20 group-hover:text-primary transition-colors" />
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">{pilar.label}</h4>
                         <p className="text-[8px] text-muted-foreground/70 uppercase tracking-tight">{pilar.count}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
           </div>
        </section>

        {/* Biblioteca Inteligente (Logos) — Amplo Desktop */}
        <section className="bg-primary/5 rounded-premium p-spacing-xl md:p-spacing-2xl border border-primary/10">
           <div className="max-w-3xl mx-auto text-center space-y-spacing-lg">
              <Icons.Sparkles className="w-12 h-12 mx-auto text-primary/40" />
              <h2 className="type-h2">Biblioteca Inteligente</h2>
              <p className="type-lead opacity-80">Encontre conexões profundas entre a Bíblia, o Catecismo e a Tradição usando Logos, o motor de inteligência teológica da Cathedra.</p>
              <Button size="lg" className="rounded-premium-full px-spacing-xl" onClick={() => window.location.href = '/biblioteca/inteligente'}>
                Explorar Conexões Nexus
              </Button>
           </div>
        </section>

        {/* Recomendações do Nexus */}
        <section className="space-y-spacing-md">
          <h2 className="text-premium-small font-black uppercase tracking-[0.2em] text-primary">
            Sugerido pelo Nexus
          </h2>
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
          </div>
        </section>
      </main>
    </div>
  );
};

export default AcervoHomePage;
