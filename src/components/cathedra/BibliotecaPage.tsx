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

const sections = [
  {
    category: 'Palavra e Doutrina',
    items: [
      {
        title: 'Bíblia',
        description: 'Antigo e Novo Testamento com busca e anotações',
        icon: <Icons.Bible className="w-5 h-5" />,
        route: AppRoute.BIBLE,
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
        description: 'Encíclicas e documentos pontifícios',
        icon: <Icons.ScrollText className="w-5 h-5" />,
        route: AppRoute.MAGISTERIUM,
        color: 'bg-primary/10 text-primary',
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
        color: 'bg-accent/10 text-accent',
      },
      {
        title: 'Liturgia',
        description: 'Liturgia do dia, Missal e Calendário',
        icon: <Icons.Liturgy className="w-5 h-5" />,
        route: AppRoute.LITURGIA,
        color: 'bg-primary/10 text-primary',
      },
      {
        title: 'Orações',
        description: 'Tesouro das preces da tradição católica',
        icon: <Icons.Volume2 className="w-5 h-5" />,
        route: AppRoute.ORACAO,
        color: 'bg-accent/10 text-accent',
      },
      {
        title: 'Lectio Divina',
        description: 'Oração com a Sagrada Escritura',
        icon: <Icons.Lectio className="w-5 h-5" />,
        route: AppRoute.LECTIO_DIVINA,
        color: 'bg-primary/10 text-primary',
      },
      {
        title: 'Breviário',
        description: 'Liturgia das Horas para santificar o dia',
        icon: <Icons.Clock className="w-5 h-5" />,
        route: AppRoute.BREVIARY,
        color: 'bg-accent/10 text-accent',
      },
      {
        title: 'Confissão',
        description: 'Guia para o Sacramento da Reconciliação',
        icon: <Icons.Flame className="w-5 h-5" />,
        route: AppRoute.POENITENTIA,
        color: 'bg-primary/10 text-primary',
      },
      {
        title: 'Via Sacra',
        description: 'Meditação dos passos da Paixão do Senhor',
        icon: <Icons.Cross className="w-5 h-5" />,
        route: AppRoute.VIA_CRUCIS,
        color: 'bg-accent/10 text-accent',
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
        color: 'bg-primary/10 text-primary',
      },
      {
        title: 'Aquinas',
        description: 'A obra-prima de Santo Tomás de Aquino',
        icon: <Icons.Aquinas className="w-5 h-5" />,
        route: AppRoute.AQUINAS_OPERA,
        color: 'bg-accent/10 text-accent',
      },
      {
        title: 'Dogmas',
        description: 'Verdades de fé definidas pela Igreja',
        icon: <Icons.ScrollText className="w-5 h-5" />,
        route: AppRoute.DOGMAS,
        color: 'bg-primary/10 text-primary',
      },
      {
        title: 'Enciclopédia',
        description: 'Enciclopédia de termos e conceitos católicos',
        icon: <Icons.Library className="w-5 h-5" />,
        route: AppRoute.ENCYCLOPEDIA,
        color: 'bg-accent/10 text-accent',
      },
      {
        title: 'Os Papas',
        description: 'História dos sucessores de Pedro',
        icon: <Icons.ShieldCheck className="w-5 h-5" />,
        route: AppRoute.POPES,
        color: 'bg-primary/10 text-primary',
      },
    ]
  },
  {
    category: 'Caminho e Partilha',
    items: [
      {
        title: 'Jornadas',
        description: 'Trilhas de formação e crescimento espiritual',
        icon: <Icons.Journeys className="w-5 h-5" />,
        route: AppRoute.JORNADAS,
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
        title: 'Comunidade',
        description: 'Espaço para partilha e crescimento',
        icon: <Icons.Users className="w-5 h-5" />,
        route: AppRoute.COMMUNITY,
        color: 'bg-primary/10 text-primary',
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
      <div className="section-rhythm stack-rhythm max-w-2xl mx-auto pb-24">


      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar módulo..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-12">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhum módulo encontrado.</p>
        )}
        {filtered.map((group, groupIdx) => (
          <div key={group.category} className="space-y-4">
            <h2 className="text-premium-small font-black uppercase tracking-[0.3em] text-primary/60 flex items-center gap-3">
              <div className="h-px w-6 bg-primary/20" /> {group.category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.items.map((item, i) => {
                const handleNavigate = () => navigate(item.route);
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (groupIdx * 3 + i) * 0.05 }}
                    className="h-full"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={`Explorar ${item.title}`}
                      onClick={handleNavigate}
                      onMouseEnter={() => prefetchRoute(item.route)}
                      onTouchStart={() => prefetchRoute(item.route)}
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleNavigate(); 
                        }
                      }}
                      className="group cursor-pointer h-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-premium"
                    >
                      <Card className="premium-card-interactive h-full overflow-hidden">
                        <CardContent className="p-5 flex items-center gap-5 h-full">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${item.color} transition-transform group-hover:scale-110 duration-300`}>
                            {item.icon}
                          </div>
                          <div className="space-y-1 text-left flex-1">
                            <h3 className="font-bold text-foreground text-sm tracking-tight">{item.title}</h3>
                            <p className="text-premium-tiny leading-relaxed text-muted-foreground line-clamp-2">{item.description}</p>
                          </div>
                          <Icons.ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
        </div>
      </div>
    </ContemplativeLayout>
  );
};

export default BibliotecaPage;
