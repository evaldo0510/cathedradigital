import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { prefetchRoute } from '@/lib/prefetch';
import { motion } from 'framer-motion';
import { BookOpen, Shield, ScrollText, Users, BookMarked, Crown, ChevronRight, Library, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AppRoute } from '@/types';

const sections = [
  {
    title: 'Bíblia Sagrada',
    description: 'Antigo e Novo Testamento com busca e anotações',
    icon: <Icons.Bible className="w-6 h-6" />,
    route: AppRoute.BIBLE,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Liturgia',
    description: 'Liturgia das Horas, Missal e Orações',
    icon: <Icons.Liturgy className="w-6 h-6" />,
    route: AppRoute.LITURGIA,
    color: 'bg-accent/10 text-accent',
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
    title: 'Aquinas (Suma)',
    description: 'A obra-prima de Santo Tomás de Aquino',
    icon: <Icons.Aquinas className="w-6 h-6" />,
    route: AppRoute.AQUINAS_OPERA,
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Glossário',
    description: 'Termos e conceitos da teologia católica',
    icon: <Icons.Glossary className="w-6 h-6" />,
    route: AppRoute.GLOSSARY,
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
        <Library className="w-10 h-10 mx-auto text-primary" />
        <h1 className="text-2xl font-bold font-serif text-foreground">Biblioteca</h1>
        <p className="text-sm text-muted-foreground">Todo o acervo da fé católica ao seu alcance.</p>
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
                      <h3 className="font-semibold text-foreground">{section.title}</h3>
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
