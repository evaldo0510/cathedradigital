import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, User } from '../../types';
import { Icons } from '../../constants';
import SacredImage from './SacredImage';
import ContentCard from './ContentCard';
import StaggeredList from './StaggeredList';

interface DashboardProps {
  user: User | null;
}

const sectionFade = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-20 md:space-y-36 pb-24 md:pb-48">
      {/* HERO SECTION */}
      <motion.section
        variants={sectionFade}
        initial="hidden"
        animate="show"
        className="relative min-h-[55vh] md:min-h-[75vh] flex flex-col justify-center items-center text-center px-6 overflow-hidden rounded-3xl md:rounded-[4rem] bg-foreground/95 shadow-2xl group"
      >
        <div className="absolute inset-0 opacity-10 grayscale mix-blend-overlay">
          <SacredImage src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=80&w=1600" alt="Product Background" className="w-full h-full" priority />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/70 to-foreground" />

        <div className="relative z-10 space-y-6 md:space-y-10 max-w-3xl px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-background/5 border border-background/10 rounded-full"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-background/60">Versão 4.5 PRO Disponível</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-background tracking-tight leading-[1.1]"
          >
            A Inteligência <br className="hidden sm:block" />
            <span className="text-primary italic font-normal">da Fé Católica.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-base md:text-xl text-background/50 font-serif italic max-w-2xl mx-auto leading-relaxed"
          >
            Escritura, Tradição e Magistério unificados em uma plataforma de alta performance com IA Exegética.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4 md:pt-8 w-full max-w-xs sm:max-w-none mx-auto"
          >
            <button onClick={() => navigate(AppRoute.BIBLE)} className="px-8 md:px-10 py-4 md:py-5 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-2xl hover:bg-background hover:text-foreground transition-all transform hover:-translate-y-1">
              Começar Agora
            </button>
            <button onClick={() => navigate(AppRoute.STUDY_MODE)} className="px-8 md:px-10 py-4 md:py-5 bg-background/5 backdrop-blur-md text-background border border-background/10 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-background/10 transition-all">
              Testar IA
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* CORE FEATURES GRID */}
      <motion.section
        variants={sectionFade}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="max-w-7xl mx-auto px-4 md:px-6 space-y-12 md:space-y-16"
      >
        <div className="text-center space-y-3">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Ecossistema</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">O Ecossistema da Verdade</h2>
          <p className="text-muted-foreground font-serif italic text-lg max-w-lg mx-auto">Tudo o que você precisa para uma formação sólida.</p>
        </div>

        <StaggeredList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" staggerDelay={0.12}>
          <ContentCard icon={<Icons.Book className="w-8 md:w-10 h-8 md:h-10" />} title="Scriptuarium" description="Bíblia Sagrada com comentários patrísticos e análise linguística." action="Abrir" onClick={() => navigate(AppRoute.BIBLE)} />
          <ContentCard icon={<Icons.Cross className="w-8 md:w-10 h-8 md:h-10" />} title="Codex Fidei" description="O Catecismo da Igreja Católica organizado por nexos teológicos." action="Estudar" onClick={() => navigate(AppRoute.CATECHISM)} />
          <ContentCard icon={<Icons.History className="w-8 md:w-10 h-8 md:h-10" />} title="Magisterium" description="Acesso total a Encíclicas, Concílios e Documentos da Santa Sé." action="Explorar" onClick={() => navigate(AppRoute.MAGISTERIUM)} />
        </StaggeredList>
      </motion.section>

      {/* IA SHOWCASE */}
      <motion.section
        variants={sectionFade}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="bg-secondary py-16 md:py-24 rounded-3xl md:rounded-[4rem] border border-border mx-4 md:mx-6 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary">Inteligência Artificial</span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight">Conecte séculos de <br className="hidden lg:block" /> sabedoria em segundos.</h2>
            <p className="text-base md:text-lg text-muted-foreground font-serif leading-relaxed italic">
              Nossa IA não apenas responde, ela correlaciona. Encontre o nexo exato entre um versículo bíblico e a definição dogmática de um Concílio.
            </p>
            <ul className="space-y-3 text-left inline-block lg:block">
              {['Investigação Exegética Profunda', 'Síntese Escolástica (Estilo Tomista)', 'Nexus Theologicus Automático'].map(f => (
                <li key={f} className="flex items-center gap-3 text-foreground font-bold text-sm">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="pt-4">
              <button onClick={() => navigate(AppRoute.STUDY_MODE)} className="px-8 py-4 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-primary-foreground transition-all shadow-xl w-full sm:w-auto">
                Abrir Scriptorium IA
              </button>
            </div>
          </div>
          <div className="relative group hidden sm:block">
            <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-2xl group-hover:bg-primary/20 transition-all" />
            <div className="relative bg-card p-8 md:p-10 rounded-3xl shadow-2xl border border-border">
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <Icons.Feather className="w-5 h-5 text-primary" />
                  <span className="text-xs font-black uppercase opacity-40 text-foreground">Simulação de Nexus</span>
                </div>
                <p className="text-muted-foreground italic text-sm md:text-base">"Como a Eucaristia é prefigurada no Antigo Testamento?"</p>
                <div className="p-5 md:p-6 bg-secondary rounded-2xl border border-border">
                  <p className="text-xs md:text-sm font-serif leading-relaxed text-foreground/80">
                    O Maná no deserto (Êxodo 16) e o sacrifício de Melquisedeque (Gênesis 14) convergem para a instituição da Ceia...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Dashboard;
