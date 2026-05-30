import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MODULES = [
  {
    title: 'Bíblia Sagrada',
    icon: <Icons.Bible className="w-xl h-xl" />,
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
    icon: <Icons.Catechism className="w-xl h-xl" />,
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
    icon: <Icons.Liturgy className="w-xl h-xl" />,
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
    icon: <Icons.Journeys className="w-xl h-xl" />,
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
    icon: <Icons.Brain className="w-xl h-xl" />,
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
    icon: <Icons.Tag className="w-xl h-xl" />,
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
    icon: <Icons.Community className="w-xl h-xl" />,
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
    icon: <Icons.Cross className="w-xl h-xl" />,
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
    <div className="max-w-5xl mx-auto space-y-2xl pb-3xl">
      <header className="text-center space-y-md">
        <div className="inline-flex items-center gap-xs px-sm py-2xs bg-primary/10 rounded-premium">
          <Icons.Feather className="w-md h-md text-primary" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Guia do Peregrino</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-black text-primary leading-tight tracking-tight">
          Entenda os Módulos
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto italic font-serif">
          "Conhecereis a verdade, e a verdade vos libertará." (Jo 8,32)
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {MODULES.map((module, idx) => (
          <motion.div
            key={module.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="h-full border-border/50 hover:border-primary/30 transition-all duration-300 bg-card  shadow-md hover:shadow-premium-hover rounded-premium overflow-hidden group">
              <CardHeader className="pb-md">
                <div className="flex items-center gap-md">
                  <div className={`w-2xl h-2xl rounded-full ${module.bg} flex items-center justify-center ${module.color} group-hover:scale-110 transition-transform`}>
                    {module.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">{module.title}</CardTitle>
                    <CardDescription className="text-sm font-medium">{module.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-xs">
                  {module.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-sm text-sm text-muted-foreground leading-relaxed">
                      <div className={`w-2xs h-2xs rounded-full mt-2xs shrink-0 ${module.color.replace('text-', 'bg-')}`} />
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-xl md:p-2xl text-center space-y-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-4xl h-4xl bg-primary/10 rounded-premium  -mr-4xl -mt-4xl" />
        <div className="relative z-10 space-y-md">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">Ainda tem dúvidas?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Nossa plataforma é viva e está em constante evolução. Se você não encontrou o que procurava ou tem uma sugestão, converse com nossa equipe de suporte ou partilhe na comunidade.
          </p>
          <div className="flex flex-wrap justify-center gap-md pt-md">
            <Badge variant="outline" className="rounded-full px-md py-2xs border-primary/20 text-primary hover:bg-primary/5 transition-colors cursor-pointer">Suporte ao Peregrino</Badge>
            <Badge variant="outline" className="rounded-full px-md py-2xs border-primary/20 text-primary hover:bg-primary/5 transition-colors cursor-pointer">Central de Ajuda</Badge>
            <Badge variant="outline" className="rounded-full px-md py-2xs border-primary/20 text-primary hover:bg-primary/5 transition-colors cursor-pointer">Tutorial em Vídeo</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModulesGuidePage;
