import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, User } from '../../types';
import { Icons } from '../../constants';
import SacredImage from './SacredImage';
import { useParallax } from '../../hooks/useParallax';
import sectionBible from '../../assets/section-bible.jpg';
import sectionCatechism from '../../assets/section-catechism.jpg';
import sectionDocuments from '../../assets/section-documents.jpg';
import sectionPrayer from '../../assets/section-prayer.jpg';

interface DashboardProps {
  user: User | null;
}

const fade = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const Section: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <motion.section
    variants={fade}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: '-80px' }}
    className={className}
  >
    {children}
  </motion.section>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const pxBible = useParallax(0.12);
  const pxCatechism = useParallax(0.12);
  const pxDocuments = useParallax(0.12);
  const pxPrayer = useParallax(0.12);

  return (
    <div className="space-y-20 md:space-y-36 pb-24 md:pb-48">

      {/* ═══════ 1. HERO ═══════ */}
      <motion.section
        variants={fade}
        initial="hidden"
        animate="show"
        className="relative min-h-[55vh] md:min-h-[75vh] flex flex-col justify-center items-center text-center px-6 overflow-hidden rounded-3xl md:rounded-[4rem] bg-foreground/95 shadow-2xl"
      >
        <div className="absolute inset-0 opacity-10 grayscale mix-blend-overlay">
          <SacredImage src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=80&w=1600" alt="Interior de catedral" className="w-full h-full" priority />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/70 to-foreground" />

        <div className="relative z-10 space-y-6 md:space-y-10 max-w-3xl px-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-background/5 border border-background/10 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-background/60">Cathedra Digital</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-background tracking-tight leading-[1.1]">
            A fé não foi feita <br className="hidden sm:block" />
            <span className="text-primary italic font-normal">para confundir.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 0.5, duration: 0.6 }}
            className="text-base md:text-xl text-background/50 font-serif italic max-w-2xl mx-auto leading-relaxed">
            Foi feita para ser compreendida, vivida e transmitida.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4 md:pt-8 w-full max-w-xs sm:max-w-none mx-auto">
            <button onClick={() => navigate(AppRoute.BIBLE)} className="px-8 md:px-10 py-4 md:py-5 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-2xl hover:bg-background hover:text-foreground transition-all transform hover:-translate-y-1">
              Começar Agora
            </button>
            <button onClick={() => navigate(AppRoute.STUDY_MODE)} className="px-8 md:px-10 py-4 md:py-5 bg-background/5 backdrop-blur-md text-background border border-background/10 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-background/10 transition-all">
              Testar IA
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════ 2. POSICIONAMENTO ═══════ */}
      <Section className="max-w-3xl mx-auto px-6 text-center space-y-6">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Posicionamento</span>
        <h2 className="text-2xl md:text-4xl font-serif font-bold text-foreground leading-snug">
          Muitos leem… poucos compreendem.
        </h2>
        <p className="text-muted-foreground font-serif italic text-base md:text-lg leading-relaxed max-w-xl mx-auto">
          Aqui, você não acumula conteúdo — você entra em um caminho de formação.<br /><br />
          Cada texto foi organizado para conduzir você da leitura à compreensão,
          da compreensão à reflexão,
          e da reflexão à vivência.
        </p>
      </Section>

      {/* ═══════ 3. COMECE AQUI ═══════ */}
      <Section className="max-w-4xl mx-auto px-4 md:px-6 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Fundamentos</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Comece pelo essencial</h2>
          <p className="text-muted-foreground font-serif italic text-lg max-w-lg mx-auto">
            Se você quer compreender a fé católica de forma sólida, este é o ponto de partida.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {[
            { label: 'O que é a fé católica', route: AppRoute.CATECHISM, icon: <Icons.Cross className="w-6 h-6" /> },
            { label: 'Como ler a Bíblia', route: AppRoute.BIBLE, icon: <Icons.Book className="w-6 h-6" /> },
            { label: 'Entender o Catecismo', route: AppRoute.CATECHISM, icon: <Icons.Feather className="w-6 h-6" /> },
            { label: 'A Igreja e sua missão', route: AppRoute.MAGISTERIUM, icon: <Icons.History className="w-6 h-6" /> },
          ].map(item => (
            <button key={item.label} onClick={() => navigate(item.route)}
              className="flex items-center gap-4 p-5 md:p-6 rounded-2xl bg-card border border-border text-left hover:border-primary/50 hover:bg-primary/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                {item.icon}
              </div>
              <span className="font-bold text-sm md:text-base text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* ═══════ 4. BÍBLIA ═══════ */}
      <Section className="overflow-hidden rounded-3xl md:rounded-[4rem] border border-border mx-4 md:mx-6">
        <div className="grid lg:grid-cols-2">
          <div className="relative h-64 lg:h-auto overflow-hidden" ref={pxBible.ref}>
            <img src={sectionBible} alt="Bíblia Sagrada aberta à luz de velas" loading="lazy" width={1280} height={720} className="absolute inset-0 w-full h-full object-cover scale-110" style={pxBible.style} />
          </div>
          <div className="bg-secondary p-10 md:p-16 flex flex-col justify-center space-y-6">
            <Icons.Book className="w-10 h-10 text-primary" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">A Palavra que ilumina</h2>
            <p className="text-muted-foreground font-serif italic text-base md:text-lg leading-relaxed">
              A Sagrada Escritura não é apenas para leitura — é para encontro.<br /><br />
              Aqui, você acessa a Bíblia com apoio do Catecismo e da Tradição,
              para compreender não apenas o que está escrito, mas o que é ensinado.
            </p>
            <div>
              <button onClick={() => navigate(AppRoute.BIBLE)}
                className="px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all">
                Ler a Bíblia
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════ 5. CATECISMO ═══════ */}
      <Section className="overflow-hidden rounded-3xl md:rounded-[4rem] border border-border mx-4 md:mx-6">
        <div className="grid lg:grid-cols-2">
          <div className="bg-card p-10 md:p-16 flex flex-col justify-center space-y-6 order-2 lg:order-1">
            <Icons.Cross className="w-10 h-10 text-primary" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">A fé explicada com clareza</h2>
            <p className="text-muted-foreground font-serif italic text-base md:text-lg leading-relaxed">
              O Catecismo da Igreja Católica reúne, de forma ordenada,
              tudo o que a Igreja crê, celebra e vive.<br /><br />
              Aqui, você não lê parágrafos isolados — você entende a estrutura da fé.
            </p>
            <div>
              <button onClick={() => navigate(AppRoute.CATECHISM)}
                className="px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all">
                Estudar o Catecismo
              </button>
            </div>
          </div>
          <div className="relative h-64 lg:h-auto order-1 lg:order-2">
            <img src={sectionCatechism} alt="Catecismo aberto com crucifixo e rosário" loading="lazy" width={1280} height={720} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>
      </Section>

      {/* ═══════ 6. DOCUMENTOS ═══════ */}
      <Section className="overflow-hidden rounded-3xl md:rounded-[4rem] border border-border mx-4 md:mx-6">
        <div className="grid lg:grid-cols-2">
          <div className="relative h-64 lg:h-auto">
            <img src={sectionDocuments} alt="Documentos papais com selos sobre mesa de mármore" loading="lazy" width={1280} height={720} className="absolute inset-0 w-full h-full object-cover" />
          </div>
          <div className="bg-secondary p-10 md:p-16 flex flex-col justify-center space-y-6">
            <Icons.History className="w-10 h-10 text-primary" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">A voz viva da Igreja</h2>
            <p className="text-muted-foreground font-serif italic text-base md:text-lg leading-relaxed">
              Encíclicas, Concílios e ensinamentos do Magistério
              revelam como a Igreja interpreta e aplica a fé ao longo do tempo.<br /><br />
              Aqui, você acessa esses documentos de forma organizada, sem se perder.
            </p>
            <div>
              <button onClick={() => navigate(AppRoute.MAGISTERIUM)}
                className="px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all">
                Acessar Documentos
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════ 7. ORAÇÃO ═══════ */}
      <Section className="overflow-hidden rounded-3xl md:rounded-[4rem] border border-border mx-4 md:mx-6">
        <div className="grid lg:grid-cols-2">
          <div className="bg-card p-10 md:p-16 flex flex-col justify-center space-y-6 order-2 lg:order-1">
            <Icons.Heart className="w-10 h-10 text-primary" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Não apenas estudar. Rezar.</h2>
            <p className="text-muted-foreground font-serif italic text-base md:text-lg leading-relaxed">
              A fé não cresce apenas no entendimento,
              mas na intimidade com Deus.<br /><br />
              Reze o terço, medite e transforme o estudo em vida interior.
            </p>
            <div>
              <button onClick={() => navigate(AppRoute.ORACAO)}
                className="px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all">
                Ir para Oração
              </button>
            </div>
          </div>
          <div className="relative h-64 lg:h-auto order-1 lg:order-2">
            <img src={sectionPrayer} alt="Pessoa rezando em capela com vitrais" loading="lazy" width={1280} height={720} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>
      </Section>

      {/* ═══════ 8. DIFERENCIAL ═══════ */}
      <Section className="bg-secondary py-16 md:py-24 rounded-3xl md:rounded-[4rem] border border-border mx-4 md:mx-6">
        <div className="max-w-3xl mx-auto px-6 md:px-8 text-center space-y-8">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Diferencial</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Um caminho estruturado</h2>
          <p className="text-muted-foreground font-serif italic text-base md:text-lg max-w-xl mx-auto">
            Diferente de outros sites, aqui tudo foi organizado para formar você:
          </p>
          <ul className="space-y-4 text-left max-w-md mx-auto">
            {[
              'Bíblia conectada ao Catecismo',
              'Catecismo conectado ao Magistério',
              'Conteúdo integrado, não fragmentado',
              'Experiência simples, profunda e progressiva',
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-foreground font-bold text-sm md:text-base">
                <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ═══════ 9. FRASE DE IMPACTO ═══════ */}
      <Section className="max-w-4xl mx-auto px-6 text-center py-8">
        <blockquote className="text-2xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-snug italic">
          "A fé não foi feita para confundir.<br />
          Foi feita para ser compreendida, vivida e transmitida."
        </blockquote>
      </Section>

      {/* ═══════ 10. BLOCO FINAL ═══════ */}
      <Section className="max-w-3xl mx-auto px-6 text-center space-y-6">
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Continue seu caminho</h2>
        <p className="text-muted-foreground font-serif italic text-base md:text-lg max-w-lg mx-auto">
          A formação na fé não acontece em um dia. Mas começa com um passo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button onClick={() => navigate(AppRoute.STUDY_MODE)}
            className="px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all">
            Continuar meu estudo
          </button>
          <button onClick={() => navigate(AppRoute.BIBLE)}
            className="px-8 py-4 bg-card border border-border text-foreground rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-primary/50 hover:bg-primary/5 transition-all">
            Começar do início
          </button>
        </div>
      </Section>
    </div>
  );
};

export default Dashboard;
