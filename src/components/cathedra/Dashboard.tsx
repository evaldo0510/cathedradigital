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
const ContentRow: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg md:text-xl font-serif font-bold text-foreground px-2">{title}</h2>
      <div className="relative group">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 w-10 z-10 bg-gradient-to-r from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          aria-label="Scroll left"
        >
          <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 px-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 w-10 z-10 bg-gradient-to-l from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          aria-label="Scroll right"
        >
          <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
    whileHover={{ scale: 1.05, zIndex: 20 }}
    whileTap={{ scale: 0.97 }}
    className={`relative shrink-0 snap-start rounded-xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-shadow ${
      wide ? 'w-72 md:w-80 h-44 md:h-48' : 'w-40 md:w-48 h-56 md:h-64'
    }`}
  >
    <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 space-y-1">
      {icon && <div className="text-primary mb-1">{icon}</div>}
      <h3 className="text-sm md:text-base font-bold text-white leading-tight line-clamp-2">{title}</h3>
      {subtitle && <p className="text-[10px] md:text-xs text-white/60 line-clamp-1">{subtitle}</p>}
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
    { image: sectionBible, title: 'O que é a fé católica', route: AppRoute.CATECHISM, icon: <Icons.Cross className="w-5 h-5" /> },
    { image: sectionCatechism, title: 'Como ler a Bíblia', route: AppRoute.BIBLE, icon: <Icons.Book className="w-5 h-5" /> },
    { image: sectionDocuments, title: 'Entender o Catecismo', route: AppRoute.CATECHISM, icon: <Icons.Feather className="w-5 h-5" /> },
    { image: sectionPrayer, title: 'A Igreja e sua missão', route: AppRoute.MAGISTERIUM, icon: <Icons.History className="w-5 h-5" /> },
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
    { image: 'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?auto=format&fit=crop&q=80&w=600', title: 'Missal', subtitle: 'Ordo Missae e liturgia', route: AppRoute.MISSAL },
    { image: 'https://images.unsplash.com/photo-1574104174498-e05a3dbfea8f?auto=format&fit=crop&q=80&w=600', title: 'Liturgia do Dia', subtitle: 'Leituras e evangelho diário', route: AppRoute.DAILY_LITURGY },
  ];

  const ferramentas = [
    { image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600', title: 'Colloquium IA', subtitle: 'Assistente de estudo inteligente', route: AppRoute.STUDY_MODE },
    { image: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&q=80&w=600', title: 'Certamen', subtitle: 'Quiz de conhecimento católico', route: AppRoute.CERTAMEN },
    { image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600', title: 'Trilhas de Formação', subtitle: 'Percursos estruturados de estudo', route: AppRoute.TRILHAS },
    { image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=600', title: 'Favoritos', subtitle: 'Seus conteúdos salvos', route: AppRoute.FAVORITES },
  ];

  return (
    <div className="space-y-8 md:space-y-12 pb-16 -mx-4 md:-mx-12">

      {/* ═══ HERO BANNER ═══ */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[60vh] md:h-[70vh] flex items-end overflow-hidden"
      >
        <SacredImage
          src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=80&w=1920"
          alt="Interior de catedral"
          className="absolute inset-0 w-full h-full"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        <div className="relative z-10 max-w-2xl space-y-4 md:space-y-6 px-6 md:px-12 pb-12 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-md"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Cathedra Digital</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold text-foreground leading-[1.1]"
          >
            A fé não foi feita <br />
            <span className="text-primary italic font-normal">para confundir.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm md:text-lg text-muted-foreground font-serif italic max-w-lg"
          >
            Foi feita para ser compreendida, vivida e transmitida.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3 pt-2"
          >
            <button
              onClick={() => goTo(AppRoute.BIBLE, 'Sagrada Escritura', sectionBible)}
              className="px-6 md:px-8 py-3 md:py-4 bg-primary text-primary-foreground rounded-lg font-black uppercase text-[10px] md:text-xs tracking-widest shadow-xl hover:opacity-90 transition-all"
            >
              Começar Agora
            </button>
            <button
              onClick={() => goTo(AppRoute.STUDY_MODE, 'Colloquium IA')}
              className="px-6 md:px-8 py-3 md:py-4 bg-foreground/10 backdrop-blur-md text-foreground border border-foreground/20 rounded-lg font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-foreground/20 transition-all"
            >
              Testar IA
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* ═══ CONTENT ROWS ═══ */}
      <div className="space-y-8 md:space-y-10 px-4 md:px-12">

        {/* Row: Continue assistindo (only if logged in and has history) */}
        {user && history.length > 0 && (
          <ContentRow title="Continue de onde parou">
            {history.map(entry => (
              <RowCard
                key={entry.id}
                image={entry.image_url || sectionBible}
                title={entry.title}
                subtitle={new Date(entry.visited_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                onClick={() => navigate(entry.route)}
                wide
              />
            ))}
          </ContentRow>
        )}

        {/* Row: Fundamentos */}
        <ContentRow title="Comece pelo essencial">
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
        
        {/* Row: Parceria em Destaque */}
        <section className="relative overflow-hidden rounded-2xl bg-primary/5 border border-primary/10 p-6 md:p-10">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
              <div className="relative z-10 w-full h-full flex items-center justify-center bg-primary/10 rounded-full border-2 border-primary shadow-xl">
                <Icons.Handshake className="w-12 h-12 text-primary opacity-50" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
                <Icons.Handshake className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-primary/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary">
                Novidades em Breve
              </div>
              <h2 className="text-xl md:text-3xl font-serif font-bold text-foreground">Nova Parceria</h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-xl">
                Estamos preparando algo especial. Em breve traremos novidades exclusivas sobre nossas parcerias oficiais.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                <button 
                  disabled
                  className="px-5 py-2 bg-primary/50 text-primary-foreground/50 cursor-not-allowed rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                >
                  <Icons.History className="w-3.5 h-3.5" />
                  Em Breve
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Row: Estudo */}
        <ContentRow title="Estudo e Formação">
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
        <ContentRow title="Oração e Liturgia">
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
        <ContentRow title="Ferramentas e Recursos">
          {ferramentas.map(item => (
            <RowCard
              key={item.title}
              image={item.image}
              title={item.title}
              subtitle={item.subtitle}
              onClick={() => goTo(item.route, item.title, item.image)}
            />
          ))}
        </ContentRow>

        {/* ═══ SPEED HIGHLIGHT ═══ */}
        <section className="relative overflow-hidden rounded-2xl bg-yellow-500/5 border border-yellow-500/10 p-6 md:p-10">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0">
              <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-pulse" />
              <div className="relative z-10 w-full h-full flex items-center justify-center bg-yellow-500/10 rounded-full border-2 border-yellow-500 shadow-xl">
                <Icons.Zap className="w-12 h-12 text-yellow-600 opacity-50" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-yellow-500/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-yellow-700">
                Performance
              </div>
              <h2 className="text-xl md:text-3xl font-serif font-bold text-foreground">CARREGAMENTO RÁPIDO</h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-xl">
                O acesso aos conteúdos foi otimizado para ser instantâneo, permitindo que sua oração e estudo não sofram interrupções.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ QUOTE ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="py-8 md:py-12 text-center max-w-3xl mx-auto"
        >
          <blockquote className="text-xl md:text-3xl font-serif font-bold text-foreground leading-snug italic">
            "A fé não foi feita para confundir.<br />
            Foi feita para ser compreendida, vivida e transmitida."
          </blockquote>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
