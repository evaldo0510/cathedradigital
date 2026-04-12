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
    title: 'Bíblia',
    description: 'Antigo e Novo Testamento com busca e anotações',
    icon: <Icons.Bible className="w-5 h-5" />,
    route: AppRoute.BIBLE,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Temas',
    description: 'Navegação inteligente por conexões teológicas',
    icon: <Icons.Themes className="w-5 h-5" />,
    route: AppRoute.TEMAS,
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Liturgia',
    description: 'Liturgia do dia, Missal e Orações',
    icon: <Icons.Liturgy className="w-5 h-5" />,
    route: AppRoute.LITURGIA,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Catecismo',
    description: 'Doutrina católica organizada por parágrafos',
    icon: <Icons.Catechism className="w-5 h-5" />,
    route: AppRoute.CATECHISM,
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Magistério',
    description: 'Encíclicas, exortações e documentos pontifícios',
    icon: <Icons.Magisterium className="w-5 h-5" />,
    route: AppRoute.MAGISTERIUM,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Santos',
    description: 'Vidas, escritos e ensinamentos dos santos',
    icon: <Icons.Saints className="w-5 h-5" />,
    route: AppRoute.SAINTS,
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Aquinas',
    description: 'A obra-prima de Santo Tomás de Aquino',
    icon: <Icons.Aquinas className="w-5 h-5" />,
    route: AppRoute.AQUINAS_OPERA,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Glossário',
    description: 'Termos e conceitos da teologia católica',
    icon: <Icons.Glossary className="w-5 h-5" />,
    route: AppRoute.GLOSSARY,
    color: 'bg-accent/10 text-accent',
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
        <Icons.Compass className="w-8 h-8 mx-auto text-primary" />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-8">Nenhum módulo encontrado.</p>
        )}
        {filtered.map((section, i) => {
          const handleNavigate = () => navigate(section.route);
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="h-full"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={handleNavigate}
                onMouseEnter={() => prefetchRoute(section.route)}
                onTouchStart={() => prefetchRoute(section.route)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(); }}
                className="cursor-pointer h-full"
              >
                <Card className="hover:border-primary/40 transition-all group h-full overflow-hidden bg-white/5 border-white/10">
                  <CardContent className="p-5 flex flex-col items-center text-center space-y-3 h-full justify-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${section.color} transition-transform group-hover:scale-110 duration-300`}>
                      {section.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-foreground text-sm tracking-tight">{section.title}</h3>
                      <p className="text-[10px] leading-relaxed text-muted-foreground line-clamp-2 max-w-[140px] mx-auto">{section.description}</p>
                    </div>
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
