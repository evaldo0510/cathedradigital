import React, { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, User } from '../../types';
import { Icons } from '../../constants';
import SacredImage from './SacredImage';
import { useHistory } from '../../hooks/useHistory';
import sectionBible from '../../assets/section-bible.webp';
import sectionCatechism from '../../assets/section-catechism.webp';
import sectionDocuments from '../../assets/section-documents.webp';
import sectionPrayer from '../../assets/section-prayer.webp';

interface DashboardProps {
  user: User | null;
}

/* ── Netflix-style horizontal scroll row ── */
const ContentRow: React.FC<{ title: string; children: React.ReactNode; onSeeAll?: () => void }> = ({ title, children, onSeeAll }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg md:text-xl font-serif font-bold text-foreground">{title}</h2>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-xs font-black uppercase tracking-widest text-primary hover:underline">
            Ver Tudo
          </button>
        )}
      </div>
      <div className="relative group">
        {/* Left arrow - Hidden on touch devices */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-background via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center"
          aria-label="Scroll left"
        >
          <svg className="w-8 h-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide pb-4 px-2 snap-x snap-mandatory scroll-smooth touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>

        {/* Right arrow - Hidden on touch devices */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-background via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center"
          aria-label="Scroll right"
        >
          <svg className="w-8 h-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
};

/* ── Card component for the rows ── */
interface RowCardProps {
  image: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
  wide?: boolean;
  icon?: React.ReactNode;
}

const RowCard: React.FC<RowCardProps> = ({ image, title, subtitle, onClick, wide, icon }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.05, y: -8 }}
    whileTap={{ scale: 0.97 }}
    className={`relative shrink-0 snap-start rounded-3xl overflow-hidden group cursor-pointer shadow-2xl hover:shadow-primary/20 transition-all duration-500 ring-1 ring-border/5 hover:ring-primary/40 ${
      wide ? 'w-[240px] md:w-[300px] h-36 md:h-40' : 'w-36 md:w-44 h-52 md:h-64'
    }`}
  >
    <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent group-hover:from-primary/80 transition-colors duration-500" />
    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 space-y-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
      {icon && <div className="text-primary-foreground/90 mb-1 scale-110">{icon}</div>}
      <h3 className="text-lg md:text-2xl font-serif font-black text-white leading-tight line-clamp-2">{title}</h3>
      {subtitle && <p className="text-xs md:text-sm font-black uppercase tracking-widest text-primary/80 group-hover:text-white/80 transition-colors">{subtitle}</p>}
    </div>
  </motion.button>
);

/* ── Route metadata for images ── */
const ROUTE_IMAGES: Record<string, string> = {
  [AppRoute.BIBLE]: sectionBible,
  [AppRoute.CATECHISM]: sectionCatechism,
  [AppRoute.MAGISTERIUM]: sectionDocuments,
  [AppRoute.ORACAO]: sectionPrayer,
  [AppRoute.ROSARY]: sectionPrayer,
  [AppRoute.VIA_CRUCIS]: sectionDocuments,
  [AppRoute.SAINTS]: sectionCatechism,
  [AppRoute.AQUINAS_OPERA]: sectionBible,
  [AppRoute.DAILY_LITURGY]: sectionDocuments,
  [AppRoute.MISSAL]: sectionPrayer,
  [AppRoute.STUDY_MODE]: sectionBible,
  [AppRoute.CERTAMEN]: sectionCatechism,
  [AppRoute.TRILHAS]: sectionDocuments,
  [AppRoute.FAVORITES]: sectionPrayer,
  [AppRoute.ABOUT]: sectionBible,
};

/* ── Main Dashboard ── */
const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const { history, trackVisit } = useHistory();

  const goTo = useCallback((route: string, title: string, imageUrl?: string) => {
    trackVisit(route, title, imageUrl || ROUTE_IMAGES[route]);
    navigate(route);
  }, [navigate, trackVisit]);

  const fundamentos = [
    { image: sectionBible, title: 'O que é a fé católica', route: AppRoute.CATECHISM, icon: <Icons.Cross className="w-3.5 h-3.5" /> },
    { image: sectionCatechism, title: 'Como ler a Bíblia', route: AppRoute.BIBLE, icon: <Icons.Book className="w-3.5 h-3.5" /> },
    { image: sectionDocuments, title: 'Entender o Catecismo', route: AppRoute.CATECHISM, icon: <Icons.Feather className="w-3.5 h-3.5" /> },
    { image: sectionPrayer, title: 'A Igreja e sua missão', route: AppRoute.MAGISTERIUM, icon: <Icons.History className="w-3.5 h-3.5" /> },
  ];

  const estudo = [
    { image: sectionBible, title: 'Sagrada Escritura', subtitle: 'Bíblia completa com referências cruzadas', route: AppRoute.BIBLE },
    { image: sectionCatechism, title: 'Catecismo da Igreja', subtitle: 'Doutrina oficial da fé católica', route: AppRoute.CATECHISM },
    { image: sectionDocuments, title: 'Magistério', subtitle: 'Encíclicas e documentos papais', route: AppRoute.MAGISTERIUM },
    { image: 'https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=80&w=600', title: 'Suma Teológica', subtitle: 'Obra-prima de São Tomás de Aquino', route: AppRoute.AQUINAS_OPERA },
    { image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600', title: 'Santos e Doutores', subtitle: 'Vidas e ensinamentos dos santos', route: AppRoute.SAINTS },
  ];

  const oracao = [
    { image: sectionPrayer, title: 'Oração', subtitle: 'Orações da tradição católica', route: AppRoute.ORACAO },
    { image: 'https://images.unsplash.com/photo-1445445290350-18a3b86e0b5a?auto=format&fit=crop&q=80&w=600', title: 'Santo Rosário', subtitle: 'Meditação dos mistérios', route: AppRoute.ROSARY },
    { image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=600', title: 'Via Crucis', subtitle: 'As 14 estações da cruz', route: AppRoute.VIA_CRUCIS },
    { image: 'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?auto=format&fit=crop&q=80&w=600', title: 'Ordo Missae', subtitle: 'Acompanhe a Santa Missa', route: AppRoute.ORDO_MISSAE },
    { image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600', title: 'Confissão', subtitle: 'Exame de consciência e guia', route: AppRoute.POENITENTIA },
    { image: 'https://images.unsplash.com/photo-1574104174498-e05a3dbfea8f?auto=format&fit=crop&q=80&w=600', title: 'Liturgia do Dia', subtitle: 'Leituras e evangelho diário', route: AppRoute.DAILY_LITURGY },
    { image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600', title: 'Litanias', subtitle: 'Orações e súplicas litânicas', route: AppRoute.LITANIES },
    { image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=600', title: 'Breviário', subtitle: 'Liturgia das Horas', route: AppRoute.BREVIARY },
  ];

  const ferramentas = [
    { image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600', title: 'Colloquium IA', subtitle: 'Assistente de estudo inteligente', route: AppRoute.STUDY_MODE },
    { image: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&q=80&w=600', title: 'Certamen', subtitle: 'Quiz de conhecimento católico', route: AppRoute.CERTAMEN },
    { image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=600', title: 'Sobre a Plataforma', subtitle: 'Conheça nossa missão e visão', route: AppRoute.ABOUT, icon: <Icons.Zap className="w-3.5 h-3.5" /> },
    { image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600', title: 'Trilhas de Formação', subtitle: 'Percursos estruturados de estudo', route: AppRoute.TRILHAS },
    { image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=600', title: 'Favoritos', subtitle: 'Seus conteúdos salvos', route: AppRoute.FAVORITES },
  ];


  return (
    <div className="space-y-8 md:space-y-12 pb-16 -mx-4 md:-mx-8 lg:-mx-10">

      {/* ═══ HERO BANNER ═══ */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="relative min-h-[60vh] md:h-[70vh] flex items-center overflow-hidden touch-pan-y"
      >
        <SacredImage
          src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=80&w=1920"
          alt="Interior de catedral"
          className="absolute inset-0 w-full h-full"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/40 to-transparent hidden md:block" />
        <div className="absolute inset-0 bg-background/80 md:hidden" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20 flex flex-col md:flex-row items-center justify-between gap-12">
          
          <div className="flex-1 space-y-6 md:space-y-8 max-w-2xl text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-primary/15 border border-primary/25 rounded-full backdrop-blur-md shadow-sm"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] text-primary">Cathedra Digital v2</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-foreground leading-[0.95] tracking-tight"
            >
              A beleza da fé <br />
              <span className="text-primary italic font-light drop-shadow-2xl">em cada detalhe.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg md:text-xl text-muted-foreground font-serif italic max-w-xl leading-relaxed opacity-90 mx-auto md:mx-0 border-l-2 border-primary/30 pl-6"
            >
              "Onde está o teu tesouro, aí estará também o teu coração." <br className="hidden md:block" />
              Um santuário digital para elevar sua alma.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start"
            >
              <button
                onClick={() => goTo(AppRoute.BIBLE, 'Sagrada Escritura', sectionBible)}
                className="group relative px-8 py-4 bg-primary text-primary-foreground rounded-xl font-black uppercase text-xs tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative">Começar Agora</span>
              </button>
              <button
                onClick={() => goTo(AppRoute.STUDY_MODE, 'Colloquium IA')}
                className="px-8 py-4 bg-foreground/5 backdrop-blur-xl text-foreground border border-foreground/10 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-foreground/10 transition-all hover:border-primary/30"
              >
                Testar IA
              </button>
            </motion.div>
          </div>

          {/* Right side floating card: Hodie / Liturgy */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="w-full max-w-sm hidden lg:block"
          >
            <div className="bg-background/40 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors duration-700" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Hodie • Hoje</span>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">Tempo Comum</span>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60">Liturgia do Dia</h3>
                <p className="text-2xl font-serif font-bold text-foreground leading-tight">Sexta-feira da III Semana do Tempo Comum</p>
                <div className="flex items-center gap-3 py-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Icons.Book className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Evangelho</p>
                    <p className="text-xs font-bold text-foreground">Marcos 4, 26-34</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60">Santo do Dia</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/30">
                    <img src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=80&w=200" alt="Saint" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-lg font-serif font-bold text-foreground">São João Bosco</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pai e Mestre da Juventude</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => navigate(AppRoute.DAILY_LITURGY)}
                className="w-full py-4 bg-foreground text-background rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all shadow-lg"
              >
                Acessar Liturgia
              </button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ═══ DAILY INSPIRATION ═══ */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="px-4 md:px-12"
      >
        <div className="relative group bg-[#1a1a1a] dark:bg-primary/10 rounded-[3rem] p-8 md:p-12 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -ml-32 -mb-32" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="flex-1 space-y-4 text-center md:text-left">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">Versículo do Dia</span>
              <p className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight italic">
                "O Senhor é o meu pastor, nada me faltará. Em verdes pastagens me faz repousar."
              </p>
              <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                <span className="text-sm font-black uppercase tracking-widest text-primary/80">Salmo 23, 1</span>
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <Icons.Heart className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            
            <div className="flex-shrink-0 flex items-center gap-4">
              <button 
                onClick={() => navigate(AppRoute.BIBLE)}
                className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20"
              >
                Ler na Bíblia
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══ CONTENT ROWS ═══ */}
      <div className="space-y-12 md:space-y-20 px-4 md:px-8 lg:px-10">


        {/* Row: Fundamentos */}
        <ContentRow title="Os Pilares da Fé" onSeeAll={() => navigate(AppRoute.TRILHAS)}>
          {fundamentos.map(item => (
            <RowCard
              key={item.title}
              image={item.image}
              title={item.title}
              onClick={() => goTo(item.route, item.title, item.image)}
              icon={item.icon}
            />
          ))}
        </ContentRow>

        {/* ═══ GRID: THEOLOGICAL SPOTLIGHT ═══ */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
              <h2 className="text-3xl md:text-5xl font-serif font-black text-foreground tracking-tight">O Magistério Sagrado</h2>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/60">Conhecimento que Transforma</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Suma Teológica', subtitle: 'A obra de São Tomás de Aquino', image: 'https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=80&w=800', route: AppRoute.AQUINAS_OPERA },
              { title: 'Dogmas de Fé', subtitle: 'Verdades imutáveis reveladas', image: 'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?auto=format&fit=crop&q=80&w=800', route: AppRoute.DOGMAS },
              { title: 'Vidas dos Santos', subtitle: 'Modelos de perfeição cristã', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800', route: AppRoute.SAINTS },
            ].map(item => (
              <motion.button
                key={item.title}
                onClick={() => navigate(item.route)}
                whileHover={{ scale: 1.05, y: -12 }}
                whileTap={{ scale: 0.98 }}
                className="relative h-80 rounded-[3rem] overflow-hidden group shadow-2xl transition-all duration-500 ring-1 ring-border/5 hover:ring-primary/40"
              >
                <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent group-hover:from-primary/80 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 p-8 space-y-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-3xl font-serif font-black text-white leading-tight">{item.title}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 group-hover:text-white transition-colors">{item.subtitle}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Row: Estudo */}
        <ContentRow title="Estudo e Formação" onSeeAll={() => navigate(AppRoute.MAGISTERIUM)}>
          {estudo.map(item => (
            <RowCard
              key={item.title}
              image={item.image}
              title={item.title}
              subtitle={item.subtitle}
              onClick={() => goTo(item.route, item.title, item.image)}
              wide
            />
          ))}
        </ContentRow>

        {/* Row: Oração e Liturgia */}
        <ContentRow title="Oração e Liturgia" onSeeAll={() => navigate(AppRoute.ORACAO)}>
          {oracao.map(item => (
            <RowCard
              key={item.title}
              image={item.image}
              title={item.title}
              subtitle={item.subtitle}
              onClick={() => goTo(item.route, item.title, item.image)}
              wide
            />
          ))}
        </ContentRow>

        {/* Row: Ferramentas */}
        <ContentRow title="Ferramentas e Recursos" onSeeAll={() => navigate(AppRoute.DASHBOARD)}>
          {ferramentas.map(item => (
            <RowCard
              key={item.title}
              image={item.image}
              title={item.title}
              subtitle={item.subtitle}
              onClick={() => goTo(item.route, item.title, item.image)}
              icon={(item as any).icon}
            />
          ))}
        </ContentRow>

        {/* ═══ LINKS ÚTEIS (Moved from Footer) ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12 border-t border-foreground/5">
          <div className="bg-foreground/[0.02] border border-foreground/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏛️</span>
              <h4 className="text-xs font-black text-foreground uppercase tracking-widest">Santa Sé</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <a href="https://www.vatican.va" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">Santa Sé (Vatican)</a>
              <a href="https://www.vatican.va/archive/ccc/index_po.htm" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">Catecismo Oficial</a>
              <a href="https://www.vaticannews.va/pt.html" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">Vatican News</a>
            </div>
          </div>

          <div className="bg-foreground/[0.02] border border-foreground/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇧🇷</span>
              <h4 className="text-xs font-black text-foreground uppercase tracking-widest">CNBB</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <a href="https://www.cnbb.org.br" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">CNBB Oficial</a>
              <a href="https://www.cnbb.org.br/liturgia" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">Liturgia Diária CNBB</a>
              <a href="https://www.cnbb.org.br/category/publicacoes" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">Documentos e Publicações</a>
            </div>
          </div>

          <div className="bg-foreground/[0.03] border border-primary/20 rounded-2xl p-8 space-y-6 flex flex-col justify-center text-center">
             <h4 className="text-sm font-serif font-bold text-foreground">Boletim Informativo</h4>
             <p className="text-[11px] text-muted-foreground">Receba reflexões teológicas e atualizações da plataforma em seu e-mail.</p>
             <div className="flex gap-2">
                <input type="email" placeholder="Seu melhor e-mail" className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-foreground/10 text-xs focus:outline-none focus:border-primary/50" />
                <button className="px-4 py-2.5 bg-primary text-black font-black uppercase text-[9px] tracking-widest rounded-xl hover:opacity-90 transition-all">OK</button>
             </div>
          </div>
        </div>

        {/* ═══ QUOTE ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="py-12 md:py-20 text-center max-w-3xl mx-auto"
        >
          <blockquote className="text-2xl md:text-4xl font-serif font-bold text-foreground leading-snug italic opacity-80">
            "A fé não foi feita para confundir.<br />
            Foi feita para ser compreendida, vivida e transmitida."
          </blockquote>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
