import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Icons } from '@/constants';
import ContemplativeLayout from '@/components/cathedra/ContemplativeLayout';
import { CathedraCard } from '@/components/cathedra/CathedraCard';
import { SOCIAL_LINKS } from '@/config/site-config';
import { trackEvent } from '@/lib/analytics';

interface Servico {
  titulo: string;
  descricao: string;
  icon: React.ElementType;
  destaques: string[];
}

interface EtapaProcesso {
  numero: string;
  titulo: string;
  descricao: string;
}

const SERVICOS: Servico[] = [
  {
    titulo: 'Direção Espiritual Digital',
    descricao:
      'Acompanhamento pessoal para leigos e consagrados que desejam ordenar a vida interior com método e regularidade.',
    icon: Icons.Compass,
    destaques: ['Encontros quinzenais', 'Regra de vida', 'Discernimento vocacional'],
  },
  {
    titulo: 'Formação Teológica',
    descricao:
      'Percursos estruturados em Sagrada Escritura, Patrística, Escolástica e Magistério — sob medida para grupos e paróquias.',
    icon: Icons.BookOpen,
    destaques: ['Tomismo aplicado', 'Leitura orante', 'Módulos de 8 a 12 semanas'],
  },
  {
    titulo: 'Projetos Católicos',
    descricao:
      'Consultoria estratégica para iniciativas de evangelização digital: conteúdo, arquitetura, monetização e governança editorial.',
    icon: Icons.Sparkles,
    destaques: ['Diagnóstico editorial', 'Arquitetura de conteúdo', 'Métricas espirituais'],
  },
  {
    titulo: 'Acompanhamento Contínuo',
    descricao:
      'Presença próxima ao longo do ano litúrgico, com retiros, correspondência e revisões trimestrais do caminho percorrido.',
    icon: Icons.Heart,
    destaques: ['Retiros dirigidos', 'Correspondência', 'Revisão trimestral'],
  },
];

const PROCESSO: EtapaProcesso[] = [
  {
    numero: 'I',
    titulo: 'Escuta',
    descricao: 'Uma conversa inicial, sem custo, para ouvir a sua história e a inquietação que a move.',
  },
  {
    numero: 'II',
    titulo: 'Discernimento',
    descricao: 'Traçamos juntos um caminho fiel à sua vocação, ancorado na tradição e na sua realidade concreta.',
  },
  {
    numero: 'III',
    titulo: 'Caminhada',
    descricao: 'Encontros regulares, leituras dirigidas e prática — a formação acontece na duração, não no evento.',
  },
  {
    numero: 'IV',
    titulo: 'Fruto',
    descricao: 'Revisão do percurso, consolidação do que foi vivido e envio para a próxima etapa.',
  },
];

const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className,
}) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const SectionRule: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-spacing-md opacity-30 px-spacing-md">
    <div className="h-px flex-1 bg-primary/20" />
    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/60">{label}</span>
    <div className="h-px flex-1 bg-primary/20" />
  </div>
);

const ConsultoriaPage: React.FC = () => {
  const whatsappUrl = useMemo(() => {
    const msg = encodeURIComponent(
      'Pax et bonum. Gostaria de conversar sobre consultoria e acompanhamento espiritual no Cathedra.',
    );
    return `${SOCIAL_LINKS.WHATSAPP}?text=${msg}`;
  }, []);

  const handleCta = (origem: 'hero' | 'footer') => {
    trackEvent('consultoria_cta_click', { origem });
  };

  return (
    <>
      <Helmet>
        <title>Consultoria — Cathedra Digital</title>
        <meta
          name="description"
          content="Direção espiritual, formação teológica e consultoria de projetos católicos com método, tradição e presença contínua."
        />
        <meta property="og:title" content="Consultoria — Cathedra Digital" />
        <meta
          property="og:description"
          content="Um caminho de discernimento, formação e acompanhamento para quem deseja ordenar a vida interior."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://cathedradigital.com.br/consultoria" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Consultoria Cathedra Digital',
            provider: { '@type': 'Organization', name: 'Cathedra Digital' },
            areaServed: 'BR',
            description:
              'Direção espiritual, formação teológica e consultoria para projetos católicos.',
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Serviços de consultoria',
              itemListElement: SERVICOS.map((s) => ({
                '@type': 'Offer',
                itemOffered: { '@type': 'Service', name: s.titulo, description: s.descricao },
              })),
            },
          })}
        </script>
      </Helmet>

      <ContemplativeLayout>
        <div className="stack-spacing-lg w-full max-w-4xl mx-auto">
          {/* HERO */}
          <FadeUp>
            <header className="text-center space-y-spacing-md mb-spacing-2xl md:mb-spacing-4xl pt-spacing-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary">
                Etapa X · Cathedra Digital
              </p>
              <h1 className="text-premium-3xl md:text-premium-6xl font-display font-light text-primary tracking-tight leading-[1.1]">
                Consultoria &<br className="hidden md:block" />{' '}
                <em className="font-serif italic text-primary/70">acompanhamento</em>
              </h1>
              <p className="max-w-xl mx-auto text-premium-base md:text-premium-lg font-serif italic text-foreground/70 leading-relaxed pt-spacing-md">
                Um caminho pessoal de discernimento, formação e presença — para quem deseja ordenar a
                vida interior com método e fidelidade à tradição.
              </p>

              <div className="flex flex-col sm:flex-row gap-spacing-sm justify-center pt-spacing-xl">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleCta('hero')}
                  className="inline-flex items-center justify-center gap-spacing-sm px-spacing-2xl h-spacing-2xl rounded-premium-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-[0.2em] shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.5)] hover:shadow-[0_14px_36px_-8px_hsl(var(--primary)/0.65)] transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Icons.MessageCircle size={16} strokeWidth={1.8} aria-hidden="true" />
                  Iniciar conversa
                </a>
                <a
                  href="#servicos"
                  className="inline-flex items-center justify-center gap-spacing-sm px-spacing-2xl h-spacing-2xl rounded-premium-full border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  Ver serviços
                </a>
              </div>
            </header>
          </FadeUp>

          {/* SERVIÇOS */}
          <section id="servicos" aria-labelledby="servicos-title" className="space-y-spacing-xl scroll-mt-spacing-4xl">
            <FadeUp>
              <SectionRule label="Serviços" />
            </FadeUp>
            <FadeUp delay={0.05}>
              <h2 id="servicos-title" className="sr-only">
                Serviços oferecidos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-md md:gap-spacing-lg">
                {SERVICOS.map((s, i) => (
                  <FadeUp key={s.titulo} delay={0.05 * i}>
                    <CathedraCard className="h-full p-spacing-xl md:p-spacing-2xl bg-primary/[0.015] border-primary/10 hover:border-secondary/40 transition-colors group">
                      <div className="flex items-start gap-spacing-md">
                        <span className="flex-shrink-0 flex items-center justify-center w-spacing-2xl h-spacing-2xl rounded-premium-full bg-secondary/10 text-secondary group-hover:bg-secondary/20 transition-colors">
                          <s.icon size={20} strokeWidth={1.4} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 space-y-spacing-sm">
                          <h3 className="font-display text-premium-lg md:text-premium-xl font-light text-primary tracking-tight">
                            {s.titulo}
                          </h3>
                          <p className="text-premium-sm text-foreground/70 leading-relaxed">
                            {s.descricao}
                          </p>
                          <ul className="pt-spacing-sm space-y-spacing-2xs">
                            {s.destaques.map((d) => (
                              <li
                                key={d}
                                className="flex items-center gap-spacing-sm text-[10px] font-medium uppercase tracking-widest text-primary/50"
                              >
                                <span className="inline-block w-1 h-1 rounded-full bg-secondary" aria-hidden="true" />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CathedraCard>
                  </FadeUp>
                ))}
              </div>
            </FadeUp>
          </section>

          {/* PROCESSO */}
          <section aria-labelledby="processo-title" className="space-y-spacing-xl pt-spacing-3xl">
            <FadeUp>
              <SectionRule label="Processo" />
            </FadeUp>
            <FadeUp delay={0.05}>
              <h2 id="processo-title" className="sr-only">
                Como se dá o acompanhamento
              </h2>
              <ol className="relative border-l border-primary/15 ml-spacing-md md:ml-spacing-xl space-y-spacing-xl md:space-y-spacing-2xl pl-spacing-xl md:pl-spacing-2xl">
                {PROCESSO.map((etapa, i) => (
                  <FadeUp key={etapa.numero} delay={0.05 * i}>
                    <li className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute -left-[calc(var(--spacing-xl)+18px)] md:-left-[calc(var(--spacing-2xl)+20px)] top-0 flex items-center justify-center w-9 h-9 rounded-premium-full bg-background border border-secondary/40 font-display text-premium-sm text-secondary"
                      >
                        {etapa.numero}
                      </span>
                      <h3 className="font-display text-premium-xl md:text-premium-2xl font-light text-primary tracking-tight">
                        {etapa.titulo}
                      </h3>
                      <p className="mt-spacing-sm text-premium-sm md:text-premium-base text-foreground/70 leading-relaxed max-w-xl">
                        {etapa.descricao}
                      </p>
                    </li>
                  </FadeUp>
                ))}
              </ol>
            </FadeUp>
          </section>

          {/* CTA FINAL */}
          <section aria-labelledby="cta-title" className="pt-spacing-3xl md:pt-spacing-4xl">
            <FadeUp>
              <CathedraCard className="relative overflow-hidden p-spacing-2xl md:p-spacing-4xl text-center bg-gradient-to-b from-primary/[0.03] to-primary/[0.08] border-primary/15">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.05] pointer-events-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 50% 0%, hsl(var(--secondary)) 0%, transparent 60%)',
                  }}
                />
                <div className="relative space-y-spacing-md">
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary">
                    Pax et bonum
                  </p>
                  <h2
                    id="cta-title"
                    className="font-display text-premium-2xl md:text-premium-4xl font-light text-primary tracking-tight leading-tight"
                  >
                    A primeira conversa <em className="font-serif italic">é gratuita</em>.
                  </h2>
                  <p className="max-w-md mx-auto text-premium-sm md:text-premium-base text-foreground/70 leading-relaxed">
                    Escreva contando um pouco da sua situação. Respondemos pessoalmente, sem
                    automações, dentro de dois dias úteis.
                  </p>
                  <div className="pt-spacing-lg">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleCta('footer')}
                      className="inline-flex items-center justify-center gap-spacing-sm px-spacing-3xl h-spacing-3xl rounded-premium-full bg-primary text-primary-foreground text-[11px] md:text-[12px] font-bold uppercase tracking-[0.25em] shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.5)] hover:shadow-[0_14px_36px_-8px_hsl(var(--primary)/0.65)] transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <Icons.MessageCircle size={18} strokeWidth={1.8} aria-hidden="true" />
                      Falar no WhatsApp
                    </a>
                  </div>
                  <p className="pt-spacing-md text-[10px] uppercase tracking-widest text-primary/40">
                    Ou escreva para{' '}
                    <a
                      href="mailto:contato@cathedradigital.com.br"
                      className="text-secondary hover:underline"
                    >
                      contato@cathedradigital.com.br
                    </a>
                  </p>
                </div>
              </CathedraCard>
            </FadeUp>
          </section>
        </div>
      </ContemplativeLayout>
    </>
  );
};

export default ConsultoriaPage;
