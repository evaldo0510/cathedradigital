import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { prefetchRoute } from '@/lib/prefetch';
import { motion } from 'framer-motion';
import { ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
        icon: <Icons.Bible className="w-spacing-md h-spacing-md" />,
        route: AppRoute.BIBLE,
        color: 'text-primary bg-primary/5',
      },
      {
        title: 'Catecismo',
        description: 'Doutrina católica organizada por parágrafos',
        icon: <Icons.Catechism className="w-spacing-md h-spacing-md" />,
        route: AppRoute.CATECHISM,
        color: 'text-secondary bg-secondary/5',
      },
      {
        title: 'Magistério',
        description: 'Encíclicas e documentos pontifícios',
        icon: <Icons.ScrollText className="w-spacing-md h-spacing-md" />,
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
        icon: <Icons.Heart className="w-spacing-md h-spacing-md" />,
        route: AppRoute.ROSARY,
        color: 'text-secondary bg-secondary/5',
      },
      {
        title: 'Liturgia',
        description: 'Liturgia do dia, Missal e Calendário',
        icon: <Icons.Liturgy className="w-spacing-md h-spacing-md" />,
        route: AppRoute.LITURGIA,
        color: 'text-primary bg-primary/5',
      },
      {
        title: 'Orações',
        description: 'Tesouro das preces da tradição católica',
        icon: <Icons.Volume2 className="w-spacing-md h-spacing-md" />,
        route: AppRoute.ORACAO,
        color: 'text-secondary bg-secondary/5',
      },
      {
        title: 'Lectio Divina',
        description: 'Oração com a Sagrada Escritura',
        icon: <Icons.Lectio className="w-spacing-md h-spacing-md" />,
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
        icon: <Icons.Brain className="w-spacing-md h-spacing-md" />,
        route: AppRoute.STUDY_MODE,
        color: 'text-primary bg-primary/5',
      },
      {
        title: 'Aquinas',
        description: 'A obra-prima de Santo Tomás de Aquino',
        icon: <Icons.Aquinas className="w-spacing-md h-spacing-md" />,
        route: AppRoute.AQUINAS_OPERA,
        color: 'text-secondary bg-secondary/5',
      },
      {
        title: 'Dogmas',
        description: 'Verdades de fé definidas pela Igreja',
        icon: <Icons.ScrollText className="w-spacing-md h-spacing-md" />,
        route: AppRoute.DOGMAS,
        color: 'text-primary bg-primary/5',
      },
      {
        title: 'Enciclopédia',
        description: 'Enciclopédia de termos e conceitos católicos',
        icon: <Icons.Library className="w-spacing-md h-spacing-md" />,
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
      <div className="w-full space-y-spacing-3xl pb-spacing-4xl">
        <div className="relative group max-w-spacing-2xl mx-auto">
          <div className="absolute inset-0 bg-primary/[0.01] blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <Icons.Search className="absolute left-spacing-lg top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-primary/20 group-focus-within:text-primary transition-all duration-700" />
          <input
            placeholder="Buscar módulo..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="search-input-premium pl-spacing-3xl"
          />
        </div>

        <div className="space-y-spacing-4xl">
          {filtered.length === 0 && (
            <p className="text-center font-serif italic text-muted-foreground/40 py-spacing-3xl">Nenhum módulo encontrado no silêncio da busca.</p>
          )}
          
          {filtered.map((group, groupIdx) => (
            <div key={group.category} className="space-y-spacing-xl">
              <div className="flex items-center gap-spacing-lg">
                <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/40 whitespace-nowrap">
                  {group.category}
                </h2>
                <div className="h-[0.5px] flex-1 bg-gradient-to-r from-primary/[0.08] to-transparent" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-spacing-lg">
                {group.items.map((item, i) => (
                  <CathedraCard
                    key={item.title}
                    variant="interactive"
                    padding="lg"
                    onClick={() => navigate(item.route)}
                    className="flex flex-col gap-spacing-lg group"
                  >
                    <div className={cn("w-spacing-2xl h-spacing-2xl rounded-premium flex items-center justify-center transition-all duration-1000 group-hover:bg-primary group-hover:text-white", item.color, "bg-primary/[0.02] text-primary/40")}>
                      {item.icon}
                    </div>
                    <div className="space-y-spacing-xs flex-1">
                      <h3 className="font-bold text-foreground/80 group-hover:text-primary transition-colors text-base tracking-tight">{item.title}</h3>
                      <p className="text-xs leading-relaxed text-muted-foreground/40 line-clamp-2 italic">{item.description}</p>
                    </div>
                  </CathedraCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ContemplativeLayout>
  );
};

export default BibliotecaPage;