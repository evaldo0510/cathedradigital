import { useEffect, useRef, lazy, Suspense, memo } from "react";
import {
  Youtube,
  Heart,
  Music,
  Clock,
  ChevronRight,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Zap,
  Users,
  Trophy,
  Bookmark,
  MessageSquare,
  Star,
  Library,
  ArrowDown,
  Quote,
  Cross,
  Church,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { AppRoute } from "@/types";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

/* ─── Shared animation helpers ─── */
const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.08, ease },
  }),
};

const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.03, y: -6, transition: { duration: 0.3, ease: "easeOut" as const } },
  tap: { scale: 0.98 },
};

const buttonHover = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2, ease: "easeOut" as const } },
  tap: { scale: 0.95, transition: { duration: 0.1 } },
};

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  useEffect(() => {
    if (!loading && user) {
      if (profile?.role === 'admin') {
        navigate(AppRoute.ADMIN, { replace: true });
      } else {
        const onboardingDone = localStorage.getItem("cathedra_onboarding_done");
        navigate(onboardingDone ? AppRoute.DASHBOARD : AppRoute.ONBOARDING, { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  const handleStart = () => {
    if (user) navigate(AppRoute.DASHBOARD);
    else navigate(AppRoute.LOGIN);
  };

  const features = [
    { title: "Bíblia Sagrada", description: "Acesso completo às Escrituras com ferramentas de estudo, anotações e busca avançada.", benefit: "Fortaleça seu conhecimento bíblico e guarde suas passagens favoritas.", icon: <BookOpen className="h-7 w-7" />, route: AppRoute.BIBLE },
    { title: "Catechismus", description: "O Catecismo da Igreja Católica organizado por parágrafos para consulta rápida e segura.", benefit: "Tenha a doutrina sempre à mão para tirar dúvidas e aprofundar a fé.", icon: <Library className="h-7 w-7" />, route: AppRoute.CATECHISM },
    { title: "Vidas dos Santos", description: "Histórias inspiradoras e ensinamentos dos grandes santos da tradição católica.", benefit: "Encontre exemplos práticos de santidade para o seu dia a dia.", icon: <Star className="h-7 w-7" />, route: AppRoute.SAINTS },
    { title: "Colloquium IA", description: "Inteligência Artificial treinada no Magistério para auxiliar seus estudos teológicos.", benefit: "Respostas rápidas baseadas na sã doutrina para suas pesquisas complexas.", icon: <Zap className="h-7 w-7" />, route: AppRoute.STUDY_MODE, premium: true },
    { title: "Liturgia Diária", description: "Acompanhe as leituras da Santa Missa, o santo do dia e meditações diárias.", benefit: "Viva o tempo litúrgico em comunhão com toda a Igreja no mundo.", icon: <Clock className="h-7 w-7" />, route: AppRoute.DAILY_LITURGY },
    { title: "Comunidade", description: "Conecte-se com outros fiéis, compartilhe orações e participe de grupos de estudo.", benefit: "Nunca caminhe sozinho; encontre apoio e partilha na sua jornada cristã.", icon: <Users className="h-7 w-7" />, route: AppRoute.COMMUNITY },
  ];

  const registerBenefits = [
    { title: "Progresso Salvo", description: "Sincronize sua leitura da Bíblia e do Catecismo entre todos os seus dispositivos.", icon: <Bookmark className="h-5 w-5 text-primary" /> },
    { title: "Favoritos e Notas", description: "Crie sua biblioteca pessoal de versículos, parágrafos e orações prediletas.", icon: <Star className="h-5 w-5 text-primary" /> },
    { title: "Gamificação", description: "Ganhe XP, insígnias e mantenha sua 'streak' de oração e estudo ativa.", icon: <Trophy className="h-5 w-5 text-primary" /> },
    { title: "Acesso Completo", description: "Desbloqueie ferramentas exclusivas de análise e o assistente de estudo inteligente.", icon: <ShieldCheck className="h-5 w-5 text-primary" /> },
  ];

  const stats = [
    { value: "73", label: "Livros da Bíblia" },
    { value: "2865", label: "Parágrafos do CIC" },
    { value: "365", label: "Santos catalogados" },
    { value: "24/7", label: "Acesso ilimitado" },
  ];

  const steps = [
    { num: "01", title: "Crie sua conta", desc: "Registro rápido e gratuito para começar sua jornada espiritual.", icon: <Sparkles className="h-6 w-6" /> },
    { num: "02", title: "Escolha seu caminho", desc: "Bíblia, Catecismo, Santos ou orações — comece por onde o coração pedir.", icon: <Cross className="h-6 w-6" /> },
    { num: "03", title: "Aprofunde-se diariamente", desc: "Mantenha sua streak, ganhe badges e cresça na fé com constância.", icon: <Flame className="h-6 w-6" /> },
  ];

  const testimonials = [
    { name: "Maria Fernanda", role: "Catequista", text: "O Cathedra transformou minha preparação para as aulas de catequese. Ter tudo num só lugar é uma bênção.", avatar: "MF" },
    { name: "Pe. Ricardo", role: "Pároco", text: "Recomendo aos meus paroquianos. A ferramenta de Lectio Divina e o Colloquium são excepcionais.", avatar: "PR" },
    { name: "João Paulo", role: "Seminarista", text: "Uso diariamente para estudar os documentos do Magistério. A busca inteligente economiza muito tempo.", avatar: "JP" },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-foreground overflow-x-hidden">
      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative w-full h-[90vh] md:h-[95vh] flex items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=40&w=800"
            alt="Catedral interior com vitrais"
            className="w-full h-full object-cover opacity-10 dark:opacity-[0.06] scale-110 blur-[1px]"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background" />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 max-w-5xl text-center space-y-10"
        >
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="inline-flex items-center gap-2 px-5 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">O Santuário Digital da Fé</span>
          </motion.div>

          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1} className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-foreground leading-[1.05]">
            Aprofunde sua <br />
            <span className="text-primary italic font-light drop-shadow-sm">Vida Interior.</span>
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2} className="max-w-2xl mx-auto text-xl md:text-2xl text-muted-foreground font-serif italic">
            "A oração é a elevação da alma a Deus." <br />
            Explore a Bíblia, o Catecismo e a tradição católica em uma plataforma unificada.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
            <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
              <Button size="lg" className="h-16 px-12 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-2xl shadow-primary/20 text-base" onClick={handleStart}>
                Começar Jornada <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
            <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
              <Button size="lg" variant="outline" className="h-16 px-12 rounded-2xl border-primary/20 bg-card/50 backdrop-blur-md font-black uppercase tracking-widest text-base" onClick={() => navigate(AppRoute.ABOUT)}>
                Conhecer o Projeto
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-muted-foreground/40"
        >
          <ArrowDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* ═══ STATS COUNTER ═══ */}
      <section className="w-full py-16 px-6 border-y border-border/30 bg-muted/20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={i}
              className="text-center space-y-2"
            >
              <p className="text-4xl md:text-5xl font-display font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES GRID ═══ */}
      <section className="w-full max-w-7xl px-6 py-24 space-y-20">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center space-y-6 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-display font-bold">Ferramentas para sua Edificação</h2>
          <p className="text-lg text-muted-foreground italic">"Conhecereis a verdade, e a verdade vos libertará" (Jo 8,32)</p>
          <div className="w-24 h-1.5 bg-primary mx-auto rounded-full" />
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              variants={cardHover}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
            >
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                custom={idx}
              >
                <Card className="group h-full border-none bg-card shadow-xl hover:shadow-2xl transition-shadow duration-500 rounded-[2.5rem] overflow-hidden flex flex-col cursor-pointer" onClick={() => navigate(feature.route)}>
                  <CardHeader className="space-y-4">
                    <motion.div
                      whileHover={{ rotate: 12, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500"
                    >
                      {feature.icon}
                    </motion.div>
                    <CardTitle className="text-2xl font-serif flex items-center justify-between">
                      {feature.title}
                      {feature.premium && (
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-full uppercase tracking-widest font-black">Premium</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 flex-1 flex flex-col">
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    <div className="p-4 bg-muted/30 rounded-2xl border border-primary/5 italic text-sm text-primary/80">
                      <strong>Ganho:</strong> {feature.benefit}
                    </div>
                    <Button variant="ghost" className="w-full mt-auto justify-between group/btn text-xs font-black uppercase tracking-[0.2em]">
                      Acessar Agora <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="w-full py-24 px-6 bg-muted/30 border-y border-border/20">
        <div className="max-w-5xl mx-auto space-y-16">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-display font-bold">Como Funciona</h2>
            <p className="text-lg text-muted-foreground italic max-w-xl mx-auto">Três passos simples para iniciar sua transformação espiritual</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                custom={i}
                className="relative text-center space-y-6"
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-24 h-24 mx-auto rounded-[2rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary"
                >
                  {step.icon}
                </motion.div>
                <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">{step.num}</span>
                <h3 className="text-xl font-serif font-bold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ REGISTRATION BENEFITS ═══ */}
      <section className="w-full bg-foreground text-background py-24 px-6 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-10">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight">
                Por que criar sua conta no <span className="text-primary italic font-serif">Cathedra?</span>
              </h2>
              <p className="text-lg opacity-70 leading-relaxed max-w-xl">
                O acesso completo permite uma experiência personalizada e contínua, guardando sua história com a Palavra de Deus e a Tradição.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-6">
              {registerBenefits.map((benefit, i) => (
                <motion.div
                  key={benefit.title}
                  variants={cardHover}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={i}
                    className="space-y-3 p-6 rounded-3xl bg-white/5 border border-white/10 cursor-pointer h-full"
                  >
                    <motion.div whileHover={{ rotate: 15, scale: 1.15 }} transition={{ type: "spring", stiffness: 400 }} className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                      {benefit.icon}
                    </motion.div>
                    <h3 className="font-bold text-lg">{benefit.title}</h3>
                    <p className="text-sm opacity-50 leading-relaxed">{benefit.description}</p>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
              <Button size="lg" className="h-16 px-12 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest w-full sm:w-auto" onClick={() => navigate(AppRoute.LOGIN)}>
                Criar Conta Gratuitamente
              </Button>
            </motion.div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-10 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
            <motion.div
              initial={{ rotate: 3 }}
              whileHover={{ rotate: 0, scale: 1.02 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-square rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl"
            >
              <img src="https://images.unsplash.com/photo-1544427928-201cd49e6657?auto=format&fit=crop&q=40&w=600" alt="Devoção católica" className="w-full h-full object-cover grayscale opacity-60" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10 right-10 p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10">
                <p className="text-xl font-serif italic mb-4">"Onde está o teu tesouro, aí estará também o teu coração."</p>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Mateus 6,21</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="w-full py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-display font-bold">Vozes da Comunidade</h2>
            <p className="text-lg text-muted-foreground italic">O que dizem aqueles que caminham conosco</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={cardHover}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-30px" }}
                  custom={i}
                >
                  <Card className="h-full border-none bg-card shadow-lg rounded-[2rem] overflow-hidden cursor-default">
                    <CardContent className="p-8 space-y-6">
                      <Quote className="w-8 h-8 text-primary/30" />
                      <p className="text-muted-foreground leading-relaxed font-serif italic">"{t.text}"</p>
                      <div className="flex items-center gap-4 pt-4 border-t border-border/30">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{t.avatar}</div>
                        <div>
                          <p className="font-bold text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ */}
      <section className="w-full py-20 px-6">
        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-8 p-12 md:p-16 rounded-[3rem] bg-primary/5 border border-primary/10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
          <div className="relative z-10 space-y-8">
            <Church className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight">
              Pronto para aprofundar sua <span className="text-primary italic">fé?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Junte-se a milhares de fiéis que usam o Cathedra para crescer espiritualmente todos os dias.
            </p>
            <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap" className="inline-block">
              <Button size="lg" className="h-16 px-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-2xl shadow-primary/20 text-base" onClick={handleStart}>
                Começar Agora <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <section className="w-full py-20 px-6 bg-card border-y border-border/20">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Inspirado por e em sintonia com</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {[
              { icon: <Music className="w-8 h-8" />, name: "Som do Monte" },
              { icon: <BookOpen className="w-8 h-8" />, name: "Vatican News" },
              { icon: <Heart className="w-8 h-8" />, name: "Caritas" },
            ].map((p) => (
              <motion.div key={p.name} whileHover={{ scale: 1.1, opacity: 1 }} className="flex flex-col items-center gap-2">
                {p.icon}
                <span className="font-serif font-bold">{p.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="w-full bg-foreground text-background pt-20 pb-10 px-6 border-t border-background/5">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 pb-16 border-b border-white/5">
            <Logo className="w-10 h-10 mx-auto text-primary opacity-70" />
            <p className="text-2xl md:text-4xl font-serif italic leading-relaxed opacity-80 max-w-2xl mx-auto">"A medida do amor é amar sem medida."</p>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Santo Agostinho</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="col-span-2 md:col-span-1 space-y-5">
              <div className="flex items-center gap-3">
                <Logo className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="text-lg font-display font-bold tracking-tight">CATHEDRA</h3>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Digital Sanctuarium</p>
                </div>
              </div>
              <p className="text-sm opacity-40 leading-relaxed">Plataforma dedicada ao estudo, oração e vivência da fé católica, unindo tradição e tecnologia.</p>
              <div className="flex gap-3">
                {[
                  { href: "https://instagram.com", icon: <Heart className="w-4 h-4" /> },
                  { href: "https://youtube.com", icon: <Youtube className="w-4 h-4" /> },
                  { href: "https://wa.me", icon: <MessageSquare className="w-4 h-4" /> },
                ].map((s) => (
                  <motion.a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }} className="p-2.5 rounded-xl bg-white/5 border border-white/10 opacity-40 hover:opacity-100 hover:text-primary hover:border-primary/30 transition-colors">
                    {s.icon}
                  </motion.a>
                ))}
              </div>
            </div>

            {[
              { title: "Explorar", items: [{ label: "Bíblia Sagrada", route: AppRoute.BIBLE }, { label: "Catecismo", route: AppRoute.CATECHISM }, { label: "Vidas dos Santos", route: AppRoute.SAINTS }, { label: "Liturgia Diária", route: AppRoute.DAILY_LITURGY }, { label: "Rosário", route: AppRoute.ROSARY }] },
              { title: "🏛️ Santa Sé", items: [{ label: "Vatican.va", url: "https://www.vatican.va" }, { label: "Vatican News", url: "https://www.vaticannews.va/pt.html" }, { label: "Catecismo Oficial", url: "https://www.vatican.va/archive/ccc/index_po.htm" }, { label: "CNBB", url: "https://www.cnbb.org.br" }] },
              { title: "Institucional", items: [{ label: "Sobre o Projeto", route: AppRoute.ABOUT }, { label: "Criar Conta", route: AppRoute.LOGIN }, { label: "Termos de Uso", route: AppRoute.TERMS }, { label: "Privacidade", route: AppRoute.PRIVACY }] },
            ].map((col) => (
              <div key={col.title} className="space-y-5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{col.title}</h4>
                <ul className="space-y-3">
                  {col.items.map((item: any) => (
                    <li key={item.label}>
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2 group">
                          <span className="w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                          {item.label}
                        </a>
                      ) : (
                        <button onClick={() => navigate(item.route)} className="text-sm opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2 group">
                          <span className="w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                          {item.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-20">© {new Date().getFullYear()} CATHEDRA • OMNIA AD MAIOREM DEI GLORIAM</p>
            <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
              <Button size="sm" variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10" onClick={handleStart}>
                Entrar na Plataforma <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Logo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

export default Index;
