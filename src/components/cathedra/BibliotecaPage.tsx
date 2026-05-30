import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { prefetchRoute } from '@/lib/prefetch';
import { motion } from 'framer-motion';
import { ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import ContemplativeLayout from './ContemplativeLayout';
import { CathedraCard } from './CathedraCard';
import { cn } from '@/lib/utils';

const sections = [
  {
    category: 'Palavra e Doutrina',
    items: [
      {
        title: 'Bíblia',
        description: 'Antigo e Novo Testamento com busca e anotações',
        icon: <Icons.Bible className="w-5 h-5" />,
        route: AppRoute.BIBLE,
        color: 'text-primary bg-primary/5',
      },
      {
        title: 'Catecismo',
        description: 'Doutrina católica organizada por parágrafos',
        icon: <Icons.Catechism className="w-5 h-5" />,
        route: AppRoute.CATECHISM,
        color: 'text-secondary bg-secondary/5',
      },
      {
        title: 'Magistério',
        description: 'Encíclicas e documentos pontifícios',
        icon: <Icons.ScrollText className="w-5 h-5" />,
        route: AppRoute.MAGISTERIUM,
        color: 'text-primary bg-primary/5',
      },
    ]
  },
  {
    category: 'Vida de Oração',
    items: [
      {
        title: 'Rosário',
        description: 'Meditação dos mistérios da vida de Cristo',
        icon: <Icons.Heart className="w-5 h-5" />,
        route: AppRoute.ROSARY,
        color: 'text-secondary bg-secondary/5',
      },
      {
        title: 'Liturgia',
        description: 'Liturgia do dia, Missal e Calendário',
        icon: <Icons.Liturgy className="w-5 h-5" />,
        route: AppRoute.LITURGIA,
        color: 'text-primary bg-primary/5',
      },
      {
        title: 'Orações',
        description: 'Tesouro das preces da tradição católica',
        icon: <Icons.Volume2 className="w-5 h-5" />,
        route: AppRoute.ORACAO,
        color: 'text-secondary bg-secondary/5',
      },
      {
        title: 'Lectio Divina',
        description: 'Oração com a Sagrada Escritura',
        icon: <Icons.Lectio className="w-5 h-5" />,
        route: AppRoute.LECTIO_DIVINA,
        color: 'text-primary bg-primary/5',
      },
    ]
  },
  {
    category: 'Formação Intelectual',
    items: [
      {
        title: 'Logos IA',
        description: 'Tire suas dúvidas iluminadas pela fé',
        icon: <Icons.Brain className="w-5 h-5" />,
        route: AppRoute.STUDY_MODE,
        color: 'text-primary bg-primary/5',
      },
      {
        title: 'Aquinas',
        description: 'A obra-prima de Santo Tomás de Aquino',
        icon: <Icons.Aquinas className="w-5 h-5" />,
        route: AppRoute.AQUINAS_OPERA,
        color: 'text-secondary bg-secondary/5',
      },
      {
        title: 'Dogmas',
        description: 'Verdades de fé definidas pela Igreja',
        icon: <Icons.ScrollText className="w-5 h-5" />,
        route: AppRoute.DOGMAS,
        color: 'text-primary bg-primary/5',
      },
      {
        title: 'Enciclopédia',
        description: 'Enciclopédia de termos e conceitos católicos',
        icon: <Icons.Library className="w-5 h-5" />,
        route: AppRoute.ENCYCLOPEDIA,
        color: 'text-secondary bg-secondary/5',
      },
    ]
  }
];

const BibliotecaPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  
  const filtered = useMemo(() => {
    if (!query.trim()) return sections;
    const q = query.toLowerCase();
    return sections.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q)
      )
    })).filter(section => section.items.length > 0);
  }, [query]);

  return (
    <ContemplativeLayout
      title="Explorar"
      subtitle="Sacrum Archivum"
      icon={Icons.Compass}
    >
      <div className="max-w-5xl mx-auto space-y-16 pb-32">
        <div className="relative group max-w-2xl mx-auto">
          <div className="absolute inset-0 bg-primary/[0.01] blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/20 group-focus-within:text-primary transition-all duration-700" />
          <input
            placeholder="Buscar módulo..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="search-input-premium pl-16"
          />
        </div>

        <div className="space-y-24">
          {filtered.length === 0 && (
            <p className="text-center font-serif italic text-muted-foreground/40 py-20">Nenhum módulo encontrado no silêncio da busca.</p>
          )}
          
          {filtered.map((group, groupIdx) => (
            <div key={group.category} className="space-y-10">
              <div className="flex items-center gap-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/40 whitespace-nowrap">
                  {group.category}
                </h2>
                <div className="h-[0.5px] flex-1 bg-gradient-to-r from-primary/[0.08] to-transparent" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((item, i) => (
                  <CathedraCard
                    key={item.title}
                    variant="interactive"
                    padding="none"
                    onClick={() => navigate(item.route)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (groupIdx * 3 + i) * 0.05 }}
                    className="group h-full"
                  >
                    <div className="p-8 flex flex-col gap-6 h-full text-left">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-700 group-hover:scale-110", item.color)}>
                        {item.icon}
                      </div>
                      <div className="space-y-2 flex-1">
                        <h3 className="font-bold text-foreground/80 group-hover:text-primary transition-colors text-base tracking-tight">{item.title}</h3>
                        <p className="text-[11px] leading-relaxed text-muted-foreground/60 line-clamp-2 italic">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-primary/20 group-hover:text-primary transition-colors">Acessar Módulo</span>
                        <Icons.ChevronRight className="w-4 h-4 text-primary/10 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </CathedraCard> section-rhythm stack-rhythm max-w-2xl mx-auto pb-24
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ContemplativeLayout> section-rhythm stack-rhythm max-w-2xl mx-auto pb-24
  );
};

export default BibliotecaPage;