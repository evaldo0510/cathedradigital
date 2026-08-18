import React, { useState, useMemo, useEffect, useTransition, useDeferredValue } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import SEOHead from '@/components/SEOHead';
import SacredImage from './SacredImage';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SanctorumHero } from './SanctorumHero';
import { SanctorumDateNav } from './SanctorumDateNav';
import { SEO_CONFIG } from '@/config/seo';
import { trackEvent } from '@/lib/analytics';
import { useChurchContext } from '@/hooks/useChurchContext';

import { toISODateLocal, resolveSanctorumDateParam } from '@/lib/sanctorumDate';
import SanctorumClampNotice from './SanctorumClampNotice';



interface Pope {
  id: string;
  name: string;
  title: string;
  reign: string;
  bio: string;
  contributions: string[];
  image: string;
  isSaint: boolean;
  motto?: string;
}

const POPES_DATA: Pope[] = [
  {
    id: 'peter',
    name: 'São Pedro',
    title: 'O Primeiro Papa',
    reign: '30 d.C. – 64/67 d.C.',
    bio: 'Pescador da Galileia, escolhido por Jesus como a rocha sobre a qual a Igreja seria construída. O Príncipe dos Apóstolos.',
    contributions: [
      'Fundação da Igreja em Roma',
      'Primeiro líder da comunidade cristã',
      'Autor de duas epístolas no Novo Testamento'
    ],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/San_Pietro_di_Arnolfo_di_Cambio.jpg/440px-San_Pietro_di_Arnolfo_di_Cambio.jpg',
    isSaint: true,
    motto: 'Tu es Petrus'
  },
  {
    id: 'leo-great',
    name: 'São Leão Magno',
    title: 'O Grande Defensor',
    reign: '440 – 461',
    bio: 'Consolidou o primado romano e defendeu a fé contra as heresias. Conhecido por seu encontro histórico com Átila, o Huno.',
    contributions: [
      'Tome a Flaviano (definição da natureza de Cristo)',
      'Fortalecimento do primado papal',
      'Proteção de Roma contra invasores'
    ],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Leo_the_Great_by_Francisco_Herrera_the_Younger.jpg/440px-Leo_the_Great_by_Francisco_Herrera_the_Younger.jpg',
    isSaint: true
  },
  {
    id: 'gregory-great',
    name: 'São Gregório Magno',
    title: 'O Pai do Culto Cristão',
    reign: '590 – 604',
    bio: 'Monge beneditino que se tornou Papa. Organizou a liturgia, o canto e a administração da Igreja.',
    contributions: [
      'Canto Gregoriano',
      'Reforma da Liturgia Romana',
      'Missão de evangelização da Inglaterra'
    ],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Francisco_de_Zurbar%C3%A1n_044.jpg/440px-Francisco_de_Zurbar%C3%A1n_044.jpg',
    isSaint: true,
    motto: 'Servus servorum Dei'
  },
  {
    id: 'pius-x',
    name: 'São Pio X',
    title: 'O Papa da Eucaristia',
    reign: '1903 – 1914',
    bio: 'Conhecido por sua humildade e pelo combate ao modernismo. Incentivou a recepção frequente da Eucaristia por crianças.',
    contributions: [
      'Instauração do Catecismo Maior',
      'Reforma do Direito Canônico',
      'Incentivo à Primeira Comunhão precoce'
    ],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Pope_Pius_X.jpg/440px-Pope_Pius_X.jpg',
    isSaint: true,
    motto: 'Instaurare Omnia in Christo'
  },
  {
    id: 'john-xxiii',
    name: 'São João XXIII',
    title: 'O Papa Bom',
    reign: '1958 – 1963',
    bio: 'Convocou o Concílio Vaticano II com o objetivo de promover o "aggiornamento" (atualização) da Igreja.',
    contributions: [
      'Convocação do Vaticano II',
      'Encíclica Pacem in Terris',
      'Promoção do diálogo ecumênico'
    ],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/John_XXIII_with_Camauro_2.jpg/440px-John_XXIII_with_Camauro_2.jpg',
    isSaint: true,
    motto: 'Oboedientia et Pax'
  },
  {
    id: 'paul-vi',
    name: 'São Paulo VI',
    title: 'O Papa da Modernidade',
    reign: '1963 – 1978',
    bio: 'Concluiu o Vaticano II e iniciou as grandes viagens apostólicas internacionais.',
    contributions: [
      'Conclusão do Vaticano II',
      'Encíclica Humanae Vitae',
      'Primeiro Papa a visitar a Terra Santa'
    ],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Pope_Paul_VI_portrait_2.jpg/440px-Pope_Paul_VI_portrait_2.jpg',
    isSaint: true,
    motto: 'In Nomine Domini'
  },
  {
    id: 'john-paul-ii',
    name: 'São João Paulo II',
    title: 'O Grande Peregrino',
    reign: '1978 – 2005',
    bio: 'Segundo pontificado mais longo da história. Fundamental na queda do muro de Berlim e no diálogo com os jovens.',
    contributions: [
      'Teologia do Corpo',
      'Criação da Jornada Mundial da Juventude',
      'Novo Catecismo da Igreja Católica'
    ],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/John_Paul_II_Medal_of_Freedom_2004.jpg/440px-John_Paul_II_Medal_of_Freedom_2004.jpg',
    isSaint: true,
    motto: 'Totus Tuus'
  },
  {
    id: 'benedict-xvi',
    name: 'Bento XVI',
    title: 'O Papa da Razão e da Fé',
    reign: '2005 – 2013',
    bio: 'Um dos maiores teólogos do século XX. Suas encíclicas sobre o amor, a esperança e a caridade são tesouros da Igreja.',
    contributions: [
      'Encíclica Deus Caritas Est',
      'Série de livros Jesus de Nazaré',
      'Diálogo entre Fé e Razão'
    ],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Benedict_XVI_5_crop.jpg/440px-Benedict_XVI_5_crop.jpg',
    isSaint: false,
    motto: 'Cooperatores Veritatis'
  },
  {
    id: 'francis',
    name: 'Francisco',
    title: 'O Papa da Misericórdia',
    reign: '2013 – Presente',
    bio: 'Primeiro Papa das Américas e da Companhia de Jesus. Foca no cuidado com os pobres e com a "Casa Comum".',
    contributions: [
      'Encíclica Laudato Si\'',
      'Ano Santo da Misericórdia',
      'Reforma da Cúria Romana'
    ],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Pope_Francis_South_Korea_2014.jpg/440px-Pope_Francis_South_Korea_2014.jpg',
    isSaint: false,
    motto: 'Miserando atque eligendo'
  }
];

/**
 * Extrai [anoInício, anoFim] do texto de "reign".
 * "Presente" resolve para o ano corrente.
 */
function parseReignYears(reign: string): [number, number] {
  const currentYear = new Date().getFullYear();
  const matches = reign.match(/\d{1,4}/g) ?? [];
  const start = matches[0] ? parseInt(matches[0], 10) : 0;
  const end = matches[1]
    ? parseInt(matches[1], 10)
    : /presente/i.test(reign)
      ? currentYear
      : start;
  return [start, end];
}

const PopesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawDateParam = searchParams.get('date');
  const { date: initialDate, wasClamped: dateWasClamped } =
    resolveSanctorumDateParam(rawDateParam);
  const initialSearch = searchParams.get('q') ?? '';
  const [search, setSearch] = useState(initialSearch);
  const [date, setDate] = useState<Date>(initialDate);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);
  const isFiltering = isPending || deferredSearch !== search;

  useEffect(() => {
    if (dateWasClamped) {
      try {
        trackEvent('sanctorum_date_clamped', {
          page: 'popes',
          received: rawDateParam,
          replaced_with: toISODateLocal(initialDate),
        });
      } catch { /* noop */ }
    }
    // Só emite uma vez na montagem quando a URL veio bugada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Persistir data + busca na URL (?date=YYYY-MM-DD&q=...)
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set('date', toISODateLocal(date));
    if (search.trim()) next.set('q', search.trim());
    else next.delete('q');
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, search]);

  const handleDateChange = (d: Date) => {
    startTransition(() => setDate(d));
  };

  const year = date.getFullYear();

  const { currentPope } = useChurchContext(date);

  const reigningPope = useMemo(() => {
    // Se a data for hoje, usamos a SSoT
    if (toISODateLocal(date) === toISODateLocal(new Date()) && currentPope) {
      // Tentar encontrar nos dados estáticos para manter a consistência visual (lemas, contributions)
      const match = POPES_DATA.find(p => p.name.toLowerCase().includes(currentPope.name.toLowerCase()));
      if (match) return match;
    }

    return POPES_DATA.find((p) => {
      const [start, end] = parseReignYears(p.reign);
      return year >= start && year <= end;
    });
  }, [year, date, currentPope]);


  const filteredPopes = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return POPES_DATA;
    return POPES_DATA.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q),
    );
  }, [deferredSearch]);

  const reigningKicker = reigningPope
    ? `Sanctorum · Papa reinante em ${year}`
    : `Sanctorum · Papas · ${year}`;
  const reigningTitle = reigningPope
    ? `${reigningPope.name} — ${reigningPope.title} · Os Papas · Cathedra Digital`
    : `Os Papas · ${year} · Cathedra Digital`;
  const reigningDescription = reigningPope
    ? `${reigningPope.name} (${reigningPope.reign}) — ${reigningPope.bio}`.slice(0, 160)
    : `Sucessores de Pedro em ${year}. Conheça vida, lema e legado dos principais papas.`;
  const popeCanonical = `${SEO_CONFIG.BASE_URL}/papas`;
  const popePersonLd = reigningPope
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: reigningPope.name,
        alternateName: reigningPope.title,
        description: reigningPope.bio,
        image: reigningPope.image,
        jobTitle: 'Papa da Igreja Católica',
        knowsAbout: reigningPope.contributions,
        url: popeCanonical,
        subjectOf: reigningPope.motto
          ? { '@type': 'Quotation', text: reigningPope.motto }
          : undefined,
      }
    : null;

  // JSON-LD ItemList: cada papa filtrado como Person com período de reinado.
  const popesItemListLd = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Papas da Igreja Católica',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: filteredPopes.length,
      itemListElement: filteredPopes.map((p, idx) => {
        const [start, end] = parseReignYears(p.reign);
        const person: Record<string, unknown> = {
          '@type': 'Person',
          '@id': `${popeCanonical}#${p.id}`,
          name: p.name,
          alternateName: p.title,
          description: p.bio,
          image: p.image,
          jobTitle: 'Papa da Igreja Católica',
          knowsAbout: p.contributions,
          hasOccupation: {
            '@type': 'Role',
            roleName: 'Papa',
            startDate: String(start),
            endDate: /presente/i.test(p.reign) ? undefined : String(end),
          },
          citation: [
            `Enciclopédia Católica — verbete "${p.name}"`,
            `Annuario Pontificio (Santa Sé) — pontificado ${p.reign}`,
          ],
        };
        if (p.motto) {
          person.subjectOf = { '@type': 'Quotation', text: p.motto };
        }
        return {
          '@type': 'ListItem',
          position: idx + 1,
          item: person,
        };
      }),
    };
  }, [filteredPopes, popeCanonical]);

  return (
    <div className="w-full space-y-spacing-xl pb-spacing-3xl px-spacing-md">
      <SEOHead
        title="Os Papas - Sucessores de Pedro"
        description="Conheça a história e as contribuições dos principais Papas da Igreja Católica, de São Pedro aos dias atuais."
        path="/papas"
      />

      <Helmet key={reigningPope?.id ?? `no-pope-${year}`}>
        <title>{reigningTitle}</title>
        <meta name="description" content={reigningDescription} />
        <meta property="og:type" content="profile" />
        <meta property="og:site_name" content="Cathedra Digital" />
        <meta property="og:title" content={reigningTitle} />
        <meta property="og:description" content={reigningDescription} />
        <meta property="og:url" content={popeCanonical} />
        {reigningPope && (
          <>
            <meta property="og:image" content={reigningPope.image} />
            <meta property="og:image:secure_url" content={reigningPope.image} />
            <meta property="og:image:alt" content={`${reigningKicker} · ${reigningPope.name}`} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={reigningPope.name} />
            <meta name="twitter:description" content={reigningDescription} />
            <meta name="twitter:image" content={reigningPope.image} />
          </>
        )}
        {popePersonLd && (
          <script type="application/ld+json" data-testid="pope-jsonld">
            {JSON.stringify(popePersonLd)}
          </script>
        )}
        <script type="application/ld+json" data-testid="popes-itemlist-jsonld">
          {JSON.stringify(popesItemListLd)}
        </script>
      </Helmet>

      <SanctorumHero
        variant="category"
        kind="pope"
        title="Os Papas"
        subtitle={'"Tu és Pedro, e sobre esta pedra edificarei a minha Igreja." — Mateus 16,18'}
      />

      <SanctorumDateNav value={date} onChange={handleDateChange} analyticsPage="popes" />

      {dateWasClamped && (
        <SanctorumClampNotice
          received={rawDateParam}
          replacedWith={toISODateLocal(initialDate)}
        />
      )}




      <AnimatePresence mode="wait">
        {reigningPope ? (
          <motion.div
            key={reigningPope.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto"
            aria-live="polite"
            data-testid="reigning-pope-panel"
            data-pope-id={reigningPope.id}
          >
            <Card className="overflow-hidden border-primary/40 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-spacing-lg flex flex-col md:flex-row gap-spacing-lg items-center">
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-premium-full overflow-hidden border-2 border-primary/40 shrink-0">
                  <SacredImage
                    src={reigningPope.image}
                    alt={reigningPope.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 text-center md:text-left space-y-spacing-xs">
                  <p className="text-premium-xs font-black uppercase tracking-widest text-primary">
                    Papa reinante em {year}
                  </p>
                  <h3 className="text-premium-2xl font-serif font-bold text-foreground">
                    {reigningPope.name}
                  </h3>
                  <p className="text-premium-sm font-serif italic text-muted-foreground">
                    {reigningPope.title} · {reigningPope.reign}
                  </p>
                  {reigningPope.motto && (
                    <p className="text-premium-xs font-serif italic text-primary">
                      "{reigningPope.motto}"
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="no-pope"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-premium-sm text-muted-foreground font-serif italic"
            aria-live="polite"
          >
            Nenhum papa deste acervo estava reinando em {year}.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full mx-auto">
        <Icons.Search className="absolute left-spacing-sm top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-muted-foreground" />
        <Input
          placeholder="Buscar Papa..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-spacing-xl bg-muted/50 border-border/50 rounded-premium-full"
        />
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg"
        aria-busy={isFiltering}
        aria-live="polite"
        data-testid="popes-grid"
      >
        {isFiltering ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              data-testid="pope-skeleton"
              className="rounded-premium-lg overflow-hidden border border-border/50"
            >
              <Skeleton className="h-spacing-4xl w-full" />
              <div className="p-spacing-md space-y-spacing-sm">
                <Skeleton className="h-spacing-md w-1/3" />
                <Skeleton className="h-spacing-sm w-full" />
                <Skeleton className="h-spacing-sm w-5/6" />
                <Skeleton className="h-spacing-sm w-2/3" />
              </div>
            </div>
          ))
        ) : filteredPopes.length === 0 ? (
          <div
            className="md:col-span-2 text-center text-premium-sm text-muted-foreground font-serif italic py-spacing-xl"
            role="status"
            data-testid="popes-empty"
          >
            Nenhum papa encontrado para "{deferredSearch}".
          </div>
        ) : (
          filteredPopes.map((pope, idx) => (
          <motion.div
            key={pope.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link to={`/papas/${pope.id}`} className="block h-full focus-visible:outline-none">
            <Card className="overflow-hidden bg-card border-border hover:border-primary/30 transition-all h-full group cursor-pointer focus-within:ring-2 focus-within:ring-primary/20">
              <div className="flex flex-col h-full">
                <div className="relative h-spacing-4xl overflow-hidden">
                  <SacredImage 
                    src={pope.image} 
                    alt={pope.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-spacing-md left-spacing-md right-spacing-md">
                    <div className="flex items-center justify-between mb-spacing-2xs">
                      <h3 className="text-premium-xl font-serif font-bold text-white">{pope.name}</h3>
                      {pope.isSaint && (
                        <Badge variant="outline" className="text-premium-xs bg-primary/20 text-white border-primary/40 uppercase">Santo</Badge>
                      )}
                    </div>
                    <p className="text-white/80 text-premium-xs font-serif italic">{pope.title}</p>
                  </div>
                </div>

                <CardContent className="p-spacing-md flex-1 flex flex-col space-y-spacing-md">
                  <div className="flex items-center gap-spacing-xs text-premium-xs font-black uppercase tracking-widest text-primary">
                    <Icons.Calendar className="w-spacing-sm h-spacing-sm" /> {pope.reign}
                  </div>

                  <p className="text-premium-sm text-muted-foreground leading-relaxed font-serif">
                    {pope.bio}
                  </p>

                  <div className="space-y-spacing-xs flex-1">
                    <div className="flex items-center gap-spacing-xs text-premium-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                      <Icons.Scroll className="w-spacing-sm h-spacing-sm" /> Legado Principal
                    </div>
                    <ul className="space-y-spacing-2xs">
                      {pope.contributions.map((item, i) => (
                        <li key={i} className="flex items-start gap-spacing-xs text-premium-small text-foreground font-bold">
                          <Icons.ChevronRight className="w-spacing-sm h-spacing-sm text-primary mt-spacing-3xs shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {pope.motto && (
                    <div className="pt-spacing-md border-t border-border/50 text-center">
                      <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground mb-spacing-2xs">Lema</p>
                      <p className="text-premium-xs font-serif font-bold text-primary italic">"{pope.motto}"</p>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
            </Link>
          </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default PopesPage;
