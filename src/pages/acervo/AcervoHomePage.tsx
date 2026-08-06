import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { EditorialHero, EditorialCard, EditorialDivider, EditorialKicker } from '@/components/editorial/harmony';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import { GraduationCap, Heart, Star, Shield, BookOpen, Church, Users, Library, Route, Search, Crown } from 'lucide-react';
import { MONASTERY_SHELVES } from '@/config/monasteryShelves';
import {
  countLibraryByKind,
  fetchLibraryFeatured,
} from '@/services/libraryService';
import type { LibraryItem, LibraryKind } from '@/types/library';
import AcervoContinueReadingPanel from './AcervoContinueReadingPanel';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useChurchContext } from '@/hooks/useChurchContext';
import SacredImage from '@/components/cathedra/SacredImage';

const AcervoHomePage: React.FC = () => {
  const { profile } = useAuth();
  const { currentPope, todaySaint, liturgy, isLoading: loadingChurch } = useChurchContext();
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
        <title>Acervo Cathedra — Ecossistema Espiritual Vivo</title>
        <meta
          name="description"
          content="O Ecossistema Espiritual Vivo: Bíblia, Catecismo, Magistério e vida dos santos organizados para sua caminhada."
        />
        <link rel="canonical" href="https://cathedradigital.com.br/acervo" />
      </Helmet>

      {/* HERO — Estilo Mosteiro Digital */}
      <EditorialHero align="center" density="expanded" className="bg-primary/[0.02] border-b border-primary/5">
        <EditorialHero.Meta>Ecossistema Vivo · Átrio do Conhecimento</EditorialHero.Meta>
        <EditorialHero.Eyebrow>{greeting}, {firstName}</EditorialHero.Eyebrow>
        <EditorialHero.Title>Biblioteca do Cathedra</EditorialHero.Title>
        <EditorialHero.Subtitle>Toda a riqueza da fé católica em um ambiente onde tudo se conecta.</EditorialHero.Subtitle>
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

        {/* Estantes do Conhecimento (Acervo Monástico 3.0) */}
        <section className="space-y-spacing-xl">
            <h2 className="text-premium-small font-black uppercase tracking-[0.2em] text-gold text-center">
               Estantes do Mosteiro
            </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-spacing-md">
              {MONASTERY_SHELVES.map((shelf) => (
                <div key={shelf.id} className="bg-card/40 border border-primary/5 p-spacing-lg rounded-premium space-y-spacing-md shadow-premium-sm flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">{shelf.title}</h3>
                    <shelf.icon className="w-4 h-4 text-gold/40" />
                  </div>
                  <div className="grid grid-cols-2 gap-spacing-sm flex-1">
                    {shelf.items.map(item => (
                      <Link key={item.label} to={item.to} className="group flex flex-col">
                        <div className="p-spacing-md rounded-premium border border-primary/5 bg-background/50 hover:bg-primary/[0.02] hover:border-gold/30 transition-all text-center space-y-2 h-full flex flex-col items-center justify-center relative">
                           {item.badge && (
                             <span className="absolute top-1 right-1 text-[6px] font-black bg-gold/10 text-gold px-1 rounded-full uppercase tracking-tighter">
                               {item.badge}
                             </span>
                           )}
                           <item.icon className="w-7 h-7 mx-auto text-primary/20 group-hover:text-gold transition-colors" />
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-gold-light line-clamp-1">{item.label}</h4>
                           <p className="text-[7px] text-muted-foreground/50 uppercase tracking-tighter">{item.desc} {item.count ? `· ${item.count}` : ''}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
           </div>
        </section>

        {/* Biblioteca Inteligente (Logos) — Amplo Desktop */}
        <section className="bg-primary/5 rounded-premium p-spacing-xl md:p-spacing-2xl border border-primary/10">
           <div className="max-w-3xl mx-auto text-center space-y-spacing-lg">
              <Icons.Sparkles className="w-12 h-12 mx-auto text-primary/40" />
              <h2 className="type-h2">O Logos</h2>
              <p className="type-lead opacity-80">Converse com o Logos e encontre conexões profundas entre a Bíblia, o Catecismo e a Tradição.</p>
              <Button size="lg" className="rounded-premium-full px-spacing-xl" onClick={() => window.location.href = '/biblioteca/inteligente'}>
                Iniciar Conversa com o Logos
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
