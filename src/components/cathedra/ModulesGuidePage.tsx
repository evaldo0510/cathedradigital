import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MODULES = [
  {
    title: 'Bíblia Sagrada',
    icon: <Icons.Bible className="w-spacing-xl h-spacing-xl" />,
    description: 'Acesso integral aos 73 livros das Escrituras.',
    details: [
      'Navegação intuitiva por testamentos, livros e capítulos.',
      'Referências cruzadas automáticas para o Catecismo e Magistério.',
      'Modo de estudo com inteligência artificial para aprofundamento.',
      'Sistema de busca avançado por palavras-chave e temas.'
    ],
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    title: 'Catecismo (CIC)',
    icon: <Icons.Catechism className="w-spacing-xl h-spacing-xl" />,
    description: 'O compêndio completo da doutrina católica.',
    details: [
      'Busca por número de parágrafo (§) ou tema.',
      'Interconexão com as fontes bíblicas citadas.',
      'Explicações detalhadas dos quatro pilares da fé.',
      'Histórico de leitura e marcações pessoais.'
    ],
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  {
    title: 'Liturgia Diária',
    icon: <Icons.Liturgy className="w-spacing-xl h-spacing-xl" />,
    description: 'Acompanhe a oração oficial da Igreja dia a dia.',
    details: [
      'Leituras da Missa, Salmo e Evangelho do dia.',
      'Santo do dia com biografia e oração.',
      'Calendário litúrgico completo com cores e tempos.',
      'Comentários espirituais para meditação das leituras.'
    ],
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  {
    title: 'Trilhas de Formação',
    icon: <Icons.Journeys className="w-spacing-xl h-spacing-xl" />,
    description: 'Caminhos estruturados de aprendizado progressivo.',
    details: [
      'Jornadas temáticas: Espiritualidade, Doutrina, Moral, etc.',
      'Progresso salvo automaticamente por etapa.',
      'Quizzes de fixação ao final de cada módulo.',
      'Certificados simbólicos de conclusão de trilha.'
    ],
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    title: 'Logos IA',
    icon: <Icons.Brain className="w-spacing-xl h-spacing-xl" />,
    description: 'Assistente teológico inteligente baseado na Tradição.',
    details: [
      'Respostas fundamentadas exclusivamente no Magistério.',
      'Capacidade de sintetizar temas complexos em linguagem simples.',
      'Geração de reflexões personalizadas a partir do seu perfil.',
      'Análise de conexões entre Bíblia, Tradição e Magistério.'
    ],
    color: 'text-secondary',
    bg: 'bg-secondary/10'
  },
  {
    title: 'Nexus Theologicus',
    icon: <Icons.Tag className="w-spacing-xl h-spacing-xl" />,
    description: 'Navegação por temas e conceitos sagrados.',
    details: [
      'Mapa de "bolhas" que conectam conceitos fundamentais.',
      'Agrupamento de conteúdos por categorias teológicas.',
      'Visualização rápida de como a fé responde a dores e buscas.',
      'Exploração multidimensional de um único tema.'
    ],
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  {
    title: 'Comunidade & Partilha',
    icon: <Icons.Community className="w-spacing-xl h-spacing-xl" />,
    description: 'Espaço para interação e crescimento mútuo.',
    details: [
      'Fórum de discussão moderado sobre temas de fé.',
      'Pedido de orações e intercessão comunitária.',
      'Partilha de insights e estudos realizados.',
      'Eventos e transmissões ao vivo para assinantes.'
    ],
    color: 'text-rose-500',
    bg: 'bg-rose-500/10'
  },
  {
    title: 'Obras de Aquino',
    icon: <Icons.Cross className="w-spacing-xl h-spacing-xl" />,
    description: 'Acesso à Suma Teológica e outras obras magnas.',
    details: [
      'Estrutura original de Artigos, Objeções e Respostas.',
      'Traduzido e anotado para facilitar a compreensão.',
      'Busca terminológica técnica do tomismo.',
      'Conexão com os dogmas e decretos conciliares.'
    ],
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  }
];

const ModulesGuidePage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-spacing-2xl pb-spacing-3xl">
      <header className="text-center space-y-spacing-md">
        <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 rounded-premium">
          <Icons.Feather className="w-spacing-md h-spacing-md text-primary" />
          <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">Guia do Peregrino</span>
        </div>
        <h1 className="text-premium-4xl md:text-6xl font-display font-black text-primary leading-tight tracking-tight">
          Entenda os Módulos
        </h1>
        <p className="text-muted-foreground text-premium-lg max-w-spacing-2xl mx-auto italic font-serif">
          "Conhecereis a verdade, e a verdade vos libertará." (Jo 8,32)
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg">
        {MODULES.map((module, idx) => (
          <motion.div
            key={module.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="h-full border-border/50 hover:border-primary/30 transition-all duration-300 bg-card  shadow-premium-md hover:shadow-premium-hover rounded-premium overflow-hidden group">
              <CardHeader className="pb-spacing-md">
                <div className="flex items-center gap-spacing-md">
                  <div className={`w-spacing-2xl h-spacing-2xl rounded-premium-full ${module.bg} flex items-center justify-center ${module.color} group-hover:scale-110 transition-transform`}>
                    {module.icon}
                  </div>
                  <div>
                    <CardTitle className="text-premium-xl font-bold">{module.title}</CardTitle>
                    <CardDescription className="text-premium-sm font-medium">{module.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-spacing-xs">
                  {module.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-spacing-sm text-premium-sm text-muted-foreground leading-relaxed">
                      <div className={`w-spacing-2xs h-spacing-2xs rounded-premium-full mt-spacing-2xs shrink-0 ${module.color.replace('text-', 'bg-')}`} />
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-spacing-xl md:p-spacing-2xl text-center space-y-spacing-lg relative overflow-hidden group">
        <div className="absolute top-spacing-0 right-0 w-spacing-4xl h-spacing-4xl bg-primary/10 rounded-premium  -mr-spacing-4xl -mt-spacing-4xl" />
        <div className="relative z-10 space-y-spacing-md">
          <h2 className="text-premium-2xl md:text-premium-3xl font-bold text-primary">Ainda tem dúvidas?</h2>
          <p className="text-muted-foreground max-w-spacing-2xl mx-auto">
            Nossa plataforma é viva e está em constante evolução. Se você não encontrou o que procurava ou tem uma sugestão, converse com nossa equipe de suporte ou partilhe na comunidade.
          </p>
          <div className="flex flex-wrap justify-center gap-spacing-md pt-spacing-md">
            <Badge variant="outline" className="rounded-premium-full px-spacing-md py-spacing-2xs border-primary/20 text-primary hover:bg-primary/5 transition-colors cursor-pointer">Suporte ao Peregrino</Badge>
            <Badge variant="outline" className="rounded-premium-full px-spacing-md py-spacing-2xs border-primary/20 text-primary hover:bg-primary/5 transition-colors cursor-pointer">Central de Ajuda</Badge>
            <Badge variant="outline" className="rounded-premium-full px-spacing-md py-spacing-2xs border-primary/20 text-primary hover:bg-primary/5 transition-colors cursor-pointer">Tutorial em Vídeo</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModulesGuidePage;
