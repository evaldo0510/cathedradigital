import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { prefetchRoute } from '@/lib/prefetch';
import { motion } from 'framer-motion';
import { ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AppRoute } from '@/types';
import { Icons } from '@/constants';

const sections = [
  {
    title: 'Bíblia Sagrada',
    description: 'Antigo e Novo Testamento com busca e anotações',
    icon: <Icons.Bible className="w-6 h-6" />,
    route: AppRoute.BIBLE,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Orações',
    description: 'Orações e Devoções para todos os momentos',
    icon: <Icons.PrayingHands className="w-6 h-6" />,
    route: AppRoute.ORACAO,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Liturgia',
    description: 'Liturgia do dia, Missal e Orações',
    icon: <Icons.Liturgy className="w-6 h-6" />,
    route: AppRoute.LITURGIA,
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Santo Rosário',
    description: 'Reze o terço com áudio e meditações',
    icon: <Icons.Rosary className="w-6 h-6" />,
    route: AppRoute.ROSARY,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Catecismo',
    description: 'Doutrina católica organizada por parágrafos',
    icon: <Icons.Catechism className="w-6 h-6" />,
    route: AppRoute.CATECHISM,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Magistério',
    description: 'Encíclicas, exortações e documentos pontifícios',
    icon: <Icons.Magisterium className="w-6 h-6" />,
    route: AppRoute.MAGISTERIUM,
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Santos',
    description: 'Vidas, escritos e ensinamentos dos santos',
    icon: <Icons.Saints className="w-6 h-6" />,
    route: AppRoute.SAINTS,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Colloquium IA',
    description: 'Estudo inteligente com auxílio de Inteligência Artificial',
    icon: <Icons.Dove className="w-6 h-6" />,
    route: AppRoute.STUDY_MODE,
    color: 'bg-accent/10 text-accent',
    pro: true,
  },
  {
    title: 'Suma Teológica',
    description: 'A obra-prima de Santo Tomás de Aquino',
    icon: <Icons.Aquinas className="w-6 h-6" />,
    route: AppRoute.AQUINAS_OPERA,
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Via Crucis',
    description: 'Meditações da Paixão de Cristo',
    icon: <Icons.ViaCrucis className="w-6 h-6" />,
    route: AppRoute.VIA_CRUCIS,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Breviário',
    description: 'Liturgia das Horas para o clero e leigos',
    icon: <Icons.HolyBible className="w-6 h-6" />,
    route: AppRoute.BREVIARY,
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Confissão',
    description: 'Exame de consciência e preparação',
    icon: <Icons.Check className="w-6 h-6" />,
    route: AppRoute.POENITENTIA,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Lectio Divina',
    description: 'Leitura espiritual e meditação das Escrituras',
    icon: <Icons.Feather className="w-6 h-6" />,
    route: AppRoute.LECTIO_DIVINA,
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Litanias',
    description: 'Ladainhas e orações responsivas',
    icon: <Icons.Scroll className="w-6 h-6" />,
    route: AppRoute.LITANIES,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Aparições',
    description: 'Estudo sobre as aparições marianas',
    icon: <Icons.SaintHalo className="w-6 h-6" />,
    route: AppRoute.APARICOES,
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Certamen',
    description: 'Quiz de conhecimentos católicos',
    icon: <Icons.Trophy className="w-6 h-6" />,
    route: AppRoute.CERTAMEN,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Glossário',
    description: 'Termos e conceitos da teologia católica',
    icon: <Icons.Glossary className="w-6 h-6" />,
    route: AppRoute.GLOSSARY,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Favoritos',
    description: 'Seus itens e orações salvas',
    icon: <Icons.Bookmark className="w-6 h-6" />,
    route: AppRoute.FAVORITES,
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Diagnóstico',
    description: 'Avaliação da sua saúde espiritual',
    icon: <Icons.Stethoscope className="w-6 h-6" />,
    route: AppRoute.DIAGNOSTICO,
    color: 'bg-primary/10 text-primary',
  },
];

const BibliotecaPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query.trim()) return sections;
    const q = query.toLowerCase();
    return sections.filter(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24">
      <div className="text-center space-y-2">
        <Icons.Compass className="w-10 h-10 mx-auto text-primary" />
        <h1 className="text-2xl font-bold font-serif text-foreground">Explorar</h1>
        <p className="text-sm text-muted-foreground">Mergulhe na profundidade da tradição católica.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar módulo..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhum módulo encontrado.</p>
        )}
        {filtered.map((section, i) => {
          const handleNavigate = () => navigate(section.route);
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={handleNavigate}
                onMouseEnter={() => prefetchRoute(section.route)}
                onTouchStart={() => prefetchRoute(section.route)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(); }}
                className="cursor-pointer"
              >
                <Card className="hover:border-primary/40 transition-all group">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${section.color}`}>
                      {section.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{section.title}</h3>
                        {(section as any).pro && <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">PRO</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BibliotecaPage;
