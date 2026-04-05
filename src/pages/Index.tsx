import { useEffect } from "react";
import { Youtube, Heart, Music, Clock, Handshake, ChevronRight, Sparkles, BookOpen, ShieldCheck, Zap, Globe, Users, Trophy, Bookmark, Search, MessageSquare, Star, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { AppRoute } from "@/types";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // If user is already logged in, redirect appropriately
  useEffect(() => {
    if (!loading && user) {
      const onboardingDone = localStorage.getItem('cathedra_onboarding_done');
      if (onboardingDone) {
        navigate(AppRoute.DASHBOARD, { replace: true });
      } else {
        navigate(AppRoute.ONBOARDING, { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const handleStart = () => {
    if (user) {
      navigate(AppRoute.DASHBOARD);
    } else {
      navigate(AppRoute.LOGIN);
    }
  };

  const features = [
    {
      title: "Bíblia Sagrada",
      description: "Acesso completo às Escrituras com ferramentas de estudo, anotações e busca avançada.",
      benefit: "Fortaleça seu conhecimento bíblico e guarde suas passagens favoritas.",
      icon: <BookOpen className="h-7 w-7" />,
      route: AppRoute.BIBLE
    },
    {
      title: "Catechismus",
      description: "O Catecismo da Igreja Católica organizado por parágrafos para consulta rápida e segura.",
      benefit: "Tenha a doutrina sempre à mão para tirar dúvidas e aprofundar a fé.",
      icon: <Library className="h-7 w-7" />,
      route: AppRoute.CATECHISM
    },
    {
      title: "Vidas dos Santos",
      description: "Histórias inspiradoras e ensinamentos dos grandes santos da tradição católica.",
      benefit: "Encontre exemplos práticos de santidade para o seu dia a dia.",
      icon: <Star className="h-7 w-7" />,
      route: AppRoute.SAINTS
    },
    {
      title: "Colloquium IA",
      description: "Inteligência Artificial treinada no Magistério para auxiliar seus estudos teológicos.",
      benefit: "Respostas rápidas baseadas na sã doutrina para suas pesquisas complexas.",
      icon: <Zap className="h-7 w-7" />,
      route: AppRoute.STUDY_MODE,
      premium: true
    },
    {
      title: "Liturgia Diária",
      description: "Acompanhe as leituras da Santa Missa, o santo do dia e meditações diárias.",
      benefit: "Viva o tempo litúrgico em comunhão com toda a Igreja no mundo.",
      icon: <Clock className="h-7 w-7" />,
      route: AppRoute.DAILY_LITURGY
    },
    {
      title: "Comunidade",
      description: "Conecte-se com outros fiéis, compartilhe orações e participe de grupos de estudo.",
      benefit: "Nunca caminhe sozinho; encontre apoio e partilha na sua jornada cristã.",
      icon: <Users className="h-7 w-7" />,
      route: AppRoute.COMMUNITY
    }
  ];

  const registerBenefits = [
    {
      title: "Progresso Salvo",
      description: "Sincronize sua leitura da Bíblia e do Catecismo entre todos os seus dispositivos.",
      icon: <Bookmark className="h-5 w-5 text-primary" />
    },
    {
      title: "Favoritos e Notas",
      description: "Crie sua biblioteca pessoal de versículos, parágrafos e orações prediletas.",
      icon: <Star className="h-5 w-5 text-primary" />
    },
    {
      title: "Gamificação",
      description: "Ganhe XP, insígnias e mantenha sua 'streak' de oração e estudo ativa.",
      icon: <Trophy className="h-5 w-5 text-primary" />
    },
    {
      title: "Acesso Completo",
      description: "Desbloqueie ferramentas exclusivas de análise e o assistente de estudo inteligente.",
      icon: <ShieldCheck className="h-5 w-5 text-primary" />
    }
  ];

  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative w-full h-[85vh] md:h-[90vh] flex items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=40&w=800" 
            alt="Cathedral" 
            className="w-full h-full object-cover opacity-10 scale-110 blur-[1px]"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background" />
        </div>

        <div className="relative z-10 max-w-5xl text-center space-y-10">
          <motion.div
            initial={{ opacity: 0.5, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">O Santuário Digital da Fé</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0.6, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight text-foreground leading-[1.05]"
          >
            Aprofunde sua <br /> 
            <span className="text-primary italic font-light drop-shadow-sm">Vida Interior.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-2xl mx-auto text-xl md:text-2xl text-muted-foreground font-serif italic"
          >
            "A oração é a elevação da alma a Deus." <br />
            Explore a Bíblia, o Catecismo e a tradição católica em uma plataforma unificada.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6"
          >
            <Button 
              size="lg" 
              className="h-16 px-12 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-primary/20 text-base"
              onClick={handleStart}
            >
              Começar Jornada <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-16 px-12 rounded-2xl border-primary/20 bg-white/50 backdrop-blur-md font-black uppercase tracking-widest hover:bg-white transition-all text-base"
              onClick={() => navigate(AppRoute.ABOUT)}
            >
              Conhecer o Projeto
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-7xl px-6 py-24 space-y-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-serif font-bold">Ferramentas para sua Edificação</h2>
          <p className="text-lg text-muted-foreground italic">"Conhecereis a verdade, e a verdade vos libertará" (Jo 8,32)</p>
          <div className="w-24 h-1.5 bg-primary mx-auto rounded-full" />
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="group h-full border-none bg-white shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col">
                <CardHeader className="space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 transform group-hover:rotate-6">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl font-serif flex items-center justify-between">
                    {feature.title}
                    {feature.premium && (
                      <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-full uppercase tracking-widest font-black">Premium</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 flex flex-col">
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="p-4 bg-muted/30 rounded-2xl border border-primary/5 italic text-sm text-primary/80">
                    <strong>Ganho:</strong> {feature.benefit}
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full mt-auto justify-between group/btn text-xs font-black uppercase tracking-[0.2em]"
                    onClick={() => navigate(feature.route)}
                  >
                    Acessar Agora <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Registration Benefits Section */}
      <section className="w-full bg-[#1a1a1a] text-[#fdfcf8] py-24 px-6 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #c4a24d 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-10">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-serif font-bold leading-tight">Por que criar sua conta no <span className="text-primary italic">Cathedra?</span></h2>
              <p className="text-lg text-white/70 leading-relaxed max-w-xl">
                O acesso completo permite uma experiência personalizada e contínua, guardando sua história com a Palavra de Deus e a Tradição.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              {registerBenefits.map((benefit) => (
                <div key={benefit.title} className="space-y-3 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                    {benefit.icon}
                  </div>
                  <h3 className="font-bold text-lg">{benefit.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>

            <Button 
              size="lg" 
              className="h-16 px-12 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest hover:scale-105 transition-all w-full sm:w-auto"
              onClick={() => navigate(AppRoute.LOGIN)}
            >
              Criar Conta Gratuitamente
            </Button>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-10 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
            <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl rotate-3">
              <img 
                src="https://images.unsplash.com/photo-1544427928-201cd49e6657?auto=format&fit=crop&q=40&w=600" 
                alt="Devotion" 
                className="w-full h-full object-cover grayscale opacity-60"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10 right-10 p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10">
                <p className="text-xl font-serif italic mb-4">"Onde está o teu tesouro, aí estará também o teu coração."</p>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Mateus 6,21</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Partners (Simplified) */}
      <section className="w-full py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Inspirado por e em sintonia com</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all">
            <div className="flex flex-col items-center gap-2">
              <Music className="w-8 h-8" />
              <span className="font-serif font-bold">Som do Monte</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <BookOpen className="w-8 h-8" />
              <span className="font-serif font-bold">Vatican News</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Heart className="w-8 h-8" />
              <span className="font-serif font-bold">Caritas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#0f0f0f] text-[#fdfcf8] pt-20 pb-10 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Quote Banner */}
          <div className="text-center space-y-4 pb-16 border-b border-white/5">
            <Logo className="w-10 h-10 mx-auto text-primary opacity-70" />
            <p className="text-2xl md:text-4xl font-serif italic leading-relaxed opacity-80 max-w-2xl mx-auto">
              "A medida do amor é amar sem medida."
            </p>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Santo Agostinho</p>
          </div>

          {/* Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1 space-y-5">
              <div className="flex items-center gap-3">
                <Logo className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="text-lg font-serif font-bold tracking-tight">CATHEDRA</h3>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Digital Sanctuarium</p>
                </div>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">
                Plataforma dedicada ao estudo, oração e vivência da fé católica, unindo tradição e tecnologia.
              </p>
              <div className="flex gap-3">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-primary hover:border-primary/30 transition-all">
                  <Heart className="w-4 h-4" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-primary hover:border-primary/30 transition-all">
                  <Youtube className="w-4 h-4" />
                </a>
                <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-primary hover:border-primary/30 transition-all">
                  <MessageSquare className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Explorar */}
            <div className="space-y-5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Explorar</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Bíblia Sagrada', route: AppRoute.BIBLE },
                  { label: 'Catecismo', route: AppRoute.CATECHISM },
                  { label: 'Vidas dos Santos', route: AppRoute.SAINTS },
                  { label: 'Liturgia Diária', route: AppRoute.DAILY_LITURGY },
                  { label: 'Rosário', route: AppRoute.ROSARY },
                ].map(item => (
                  <li key={item.label}>
                    <button onClick={() => navigate(item.route)} className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Santa Sé */}
            <div className="space-y-5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">🏛️ Santa Sé</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Vatican.va', url: 'https://www.vatican.va' },
                  { label: 'Vatican News', url: 'https://www.vaticannews.va/pt.html' },
                  { label: 'Catecismo Oficial', url: 'https://www.vatican.va/archive/ccc/index_po.htm' },
                  { label: 'CNBB', url: 'https://www.cnbb.org.br' },
                ].map(item => (
                  <li key={item.label}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Institucional */}
            <div className="space-y-5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Institucional</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Sobre o Projeto', route: AppRoute.ABOUT },
                  { label: 'Criar Conta', route: AppRoute.LOGIN },
                  { label: 'Termos de Uso', route: AppRoute.ABOUT },
                  { label: 'Privacidade', route: AppRoute.ABOUT },
                ].map(item => (
                  <li key={item.label}>
                    <button onClick={() => navigate(item.route)} className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
              © {new Date().getFullYear()} CATHEDRA • OMNIA AD MAIOREM DEI GLORIAM
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
              onClick={handleStart}
            >
              Entrar na Plataforma <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
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
