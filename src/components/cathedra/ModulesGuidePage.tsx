import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MODULES = [
  {
    title: 'Bíblia Sagrada',
    icon: <Icons.Bible className="w-8 h-8" />,
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
    icon: <Icons.Catechism className="w-8 h-8" />,
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
    icon: <Icons.Liturgy className="w-8 h-8" />,
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
    icon: <Icons.Journeys className="w-8 h-8" />,
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
    icon: <Icons.Brain className="w-8 h-8" />,
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
    icon: <Icons.Hash className="w-8 h-8" />,
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
    icon: <Icons.Community className="w-8 h-8" />,
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
    icon: <Icons.Cross className="w-8 h-8" />,
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
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Feather className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Guia do Peregrino</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-black text-primary leading-tight tracking-tight">
          Entenda os Módulos
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto italic font-serif">
          "Conhecereis a verdade, e a verdade vos libertará." (Jo 8,32)
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MODULES.map((module, idx) => (
          <motion.div
            key={module.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="h-full border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-xl rounded-3xl overflow-hidden group">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${module.bg} flex items-center justify-center ${module.color} group-hover:scale-110 transition-transform`}>
                    {module.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">{module.title}</CardTitle>
                    <CardDescription className="text-sm font-medium">{module.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {module.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${module.color.replace('text-', 'bg-')}`} />
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 md:p-12 text-center space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">Ainda tem dúvidas?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Nossa plataforma é viva e está em constante evolução. Se você não encontrou o que procurava ou tem uma sugestão, converse com nossa equipe de suporte ou partilhe na comunidade.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Badge variant="outline" className="rounded-full px-4 py-1.5 border-primary/20 text-primary hover:bg-primary/5 transition-colors cursor-pointer">Suporte ao Peregrino</Badge>
            <Badge variant="outline" className="rounded-full px-4 py-1.5 border-primary/20 text-primary hover:bg-primary/5 transition-colors cursor-pointer">Central de Ajuda</Badge>
            <Badge variant="outline" className="rounded-full px-4 py-1.5 border-primary/20 text-primary hover:bg-primary/5 transition-colors cursor-pointer">Tutorial em Vídeo</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModulesGuidePage;
