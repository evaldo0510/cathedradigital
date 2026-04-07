import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Shield, ScrollText, Users, BookMarked, Crown, ChevronRight, Library } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AppRoute } from '@/types';

const sections = [
  {
    title: 'Bíblia Sagrada',
    description: 'Antigo e Novo Testamento com busca e anotações',
    icon: <BookOpen className="w-6 h-6" />,
    route: AppRoute.BIBLE,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Catecismo da Igreja',
    description: 'Doutrina católica organizada por parágrafos',
    icon: <Shield className="w-6 h-6" />,
    route: AppRoute.CATECHISM,
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Magistério',
    description: 'Encíclicas, exortações e documentos pontifícios',
    icon: <ScrollText className="w-6 h-6" />,
    route: AppRoute.MAGISTERIUM,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Santos',
    description: 'Vidas, escritos e ensinamentos dos santos',
    icon: <Users className="w-6 h-6" />,
    route: AppRoute.SAINTS,
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Dogmas',
    description: 'Verdades de fé definidas pela Igreja',
    icon: <Crown className="w-6 h-6" />,
    route: AppRoute.DOGMAS,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Glossário Teológico',
    description: 'Termos e conceitos da teologia católica',
    icon: <BookMarked className="w-6 h-6" />,
    route: AppRoute.GLOSSARY,
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Suma Teológica',
    description: 'A obra-prima de Santo Tomás de Aquino',
    icon: <Library className="w-6 h-6" />,
    route: AppRoute.AQUINAS_OPERA,
    color: 'bg-primary/10 text-primary',
  },
];

const BibliotecaPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24">
      <div className="text-center space-y-2">
        <Library className="w-10 h-10 mx-auto text-primary" />
        <h1 className="text-2xl font-bold font-serif text-foreground">Biblioteca</h1>
        <p className="text-sm text-muted-foreground">Todo o acervo da fé católica ao seu alcance.</p>
      </div>

      <div className="space-y-3">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            role="button"
            tabIndex={0}
            onClick={() => navigate(section.route)}
            onTap={() => navigate(section.route)}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(section.route); }}
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
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BibliotecaPage;
