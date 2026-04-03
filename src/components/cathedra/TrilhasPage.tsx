import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../constants';
import { AppRoute } from '../../types';

interface TrailStep {
  label: string;
  route: AppRoute;
  description: string;
}

interface Trail {
  id: string;
  title: string;
  description: string;
  level: string;
  icon: string;
  steps: TrailStep[];
}

const TRAILS: Trail[] = [
  {
    id: 'basics', title: 'Fundamentos da Fé', description: 'O caminho essencial para quem está começando a compreender a fé católica.',
    level: 'Iniciante', icon: '🌱',
    steps: [
      { label: 'O que é a fé?', route: AppRoute.CATECHISM, description: 'Catecismo §§ 1-25: O desejo de Deus e a revelação.' },
      { label: 'A Sagrada Escritura', route: AppRoute.BIBLE, description: 'Introdução à Bíblia: como ler e entender.' },
      { label: 'O Credo', route: AppRoute.CATECHISM, description: 'Catecismo §§ 185-278: A profissão de fé.' },
      { label: 'Os Sacramentos', route: AppRoute.CATECHISM, description: 'Catecismo §§ 1210-1419: Os sete sacramentos.' },
      { label: 'A Oração', route: AppRoute.ORACAO, description: 'Aprenda a rezar: Pai Nosso, Ave Maria, Rosário.' },
    ]
  },
  {
    id: 'moral', title: 'Vida Moral Cristã', description: 'Entenda os princípios morais que orientam a vida do cristão.',
    level: 'Intermediário', icon: '⚖️',
    steps: [
      { label: 'A dignidade da pessoa', route: AppRoute.CATECHISM, description: 'Catecismo §§ 1700-1761: O homem à imagem de Deus.' },
      { label: 'As virtudes', route: AppRoute.CATECHISM, description: 'As 4 virtudes cardeais e as 3 teologais.' },
      { label: 'Os Dez Mandamentos', route: AppRoute.CATECHISM, description: 'Catecismo §§ 2052-2557: A lei de Deus.' },
      { label: 'As Bem-Aventuranças', route: AppRoute.BIBLE, description: 'Mateus 5,3-12: O programa da vida cristã.' },
      { label: 'Quiz: Moral Cristã', route: AppRoute.CERTAMEN, description: 'Teste seus conhecimentos sobre a moral.' },
    ]
  },
  {
    id: 'prayer-life', title: 'Vida de Oração', description: 'Aprofunde sua intimidade com Deus através das diversas formas de oração.',
    level: 'Iniciante', icon: '🙏',
    steps: [
      { label: 'O que é oração?', route: AppRoute.CATECHISM, description: 'Catecismo §§ 2558-2565: A oração na vida cristã.' },
      { label: 'O Santo Rosário', route: AppRoute.ROSARY, description: 'Aprenda e reze os quatro mistérios do Rosário.' },
      { label: 'A Via Sacra', route: AppRoute.VIA_CRUCIS, description: 'Medite as 14 estações da Paixão de Cristo.' },
      { label: 'Orações tradicionais', route: AppRoute.ORACAO, description: 'Pai Nosso, Ave Maria, Salve Rainha e mais.' },
      { label: 'A Santa Missa', route: AppRoute.MISSAL, description: 'Entenda e acompanhe o Ordinário da Missa.' },
    ]
  },
  {
    id: 'christology', title: 'Quem é Jesus Cristo?', description: 'Estudo aprofundado sobre a pessoa de Cristo na Escritura e na Tradição.',
    level: 'Intermediário', icon: '✝️',
    steps: [
      { label: 'O Verbo se fez carne', route: AppRoute.BIBLE, description: 'João 1,1-18: O Prólogo do Evangelho.' },
      { label: 'A Encarnação', route: AppRoute.CATECHISM, description: 'Catecismo §§ 456-483: Por que o Verbo se fez carne.' },
      { label: 'Mistério Pascal', route: AppRoute.CATECHISM, description: 'Catecismo §§ 571-655: Paixão, Morte e Ressurreição.' },
      { label: 'Cristo na Suma Teológica', route: AppRoute.AQUINAS_OPERA, description: 'IIIa Pars: A conveniência da Encarnação.' },
      { label: 'Os Santos e Cristo', route: AppRoute.SAINTS, description: 'Como os santos viveram o seguimento de Cristo.' },
    ]
  },
  {
    id: 'magisterium-intro', title: 'Introdução ao Magistério', description: 'Conheça os principais documentos e ensinamentos da Igreja.',
    level: 'Avançado', icon: '📜',
    steps: [
      { label: 'O que é o Magistério?', route: AppRoute.CATECHISM, description: 'Catecismo §§ 85-100: O papel do Magistério.' },
      { label: 'Os Concílios', route: AppRoute.MAGISTERIUM, description: 'De Niceia ao Vaticano II: os grandes Concílios.' },
      { label: 'Encíclicas papais', route: AppRoute.MAGISTERIUM, description: 'Documentos fundamentais dos Papas.' },
      { label: 'Doutrina Social', route: AppRoute.MAGISTERIUM, description: 'Rerum Novarum e a tradição social da Igreja.' },
      { label: 'São Tomás de Aquino', route: AppRoute.AQUINAS_OPERA, description: 'A Suma Teológica e seu impacto na teologia.' },
    ]
  },
];

const LEVEL_COLORS: Record<string, string> = {
  'Iniciante': 'bg-green-500/10 text-green-700 dark:text-green-300',
  'Intermediário': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'Avançado': 'bg-red-500/10 text-red-700 dark:text-red-300',
};

const TrilhasPage: React.FC = () => {
  const navigate = useNavigate();
  const [expandedTrail, setExpandedTrail] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Feather className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Itinerarium</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Trilhas de Estudo</h1>
        <p className="text-muted-foreground font-serif italic max-w-lg mx-auto">Percursos formativos organizados para guiar sua formação na fé.</p>
      </div>

      <div className="space-y-4">
        {TRAILS.map(trail => (
          <div key={trail.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all">
            <button
              onClick={() => setExpandedTrail(expandedTrail === trail.id ? null : trail.id)}
              className="w-full p-6 flex items-start gap-4 text-left hover:bg-primary/5 transition-all"
            >
              <span className="text-3xl">{trail.icon}</span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-serif font-bold text-foreground">{trail.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${LEVEL_COLORS[trail.level]}`}>{trail.level}</span>
                </div>
                <p className="text-sm text-muted-foreground font-serif">{trail.description}</p>
                <p className="text-[10px] text-muted-foreground font-bold">{trail.steps.length} etapas</p>
              </div>
              <Icons.ArrowDown className={`w-5 h-5 text-muted-foreground transition-transform mt-1 ${expandedTrail === trail.id ? 'rotate-180' : ''}`} />
            </button>

            {expandedTrail === trail.id && (
              <div className="border-t border-border px-6 pb-6 pt-2">
                <div className="space-y-2">
                  {trail.steps.map((step, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(step.route)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl text-left hover:bg-primary/5 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center text-sm font-black shrink-0">{i + 1}</div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{step.label}</p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                      <Icons.ArrowDown className="w-4 h-4 -rotate-90 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrilhasPage;
