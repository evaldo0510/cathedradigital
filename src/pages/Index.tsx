import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { AppRoute } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import HeroSection from "./landing/HeroSection";
import LandingHeader from "@/components/landing/LandingHeader";
import { HeroSkeleton, SectionSkeleton } from "@/components/cathedra/HomeSkeletons";

// Lazy-load below-the-fold sections
const FeaturesSection = lazy(() => import("./landing/FeaturesSection"));
const DailyRoutineSection = lazy(() => import("./landing/DailyRoutineSection"));
const TestimonialsSection = lazy(() => import("./landing/TestimonialsSection"));
const PricingSection = lazy(() => import("./landing/PricingSection"));
const FaqSection = lazy(() => import("./landing/FaqSection"));
const CtaBannerSection = lazy(() => import("./landing/CtaBannerSection"));
const FeedbackWidget = lazy(() => import("@/components/landing/FeedbackWidget"));
const CookieConsent = lazy(() => import("@/components/cathedra/CookieConsent"));
const WhatsAppButton = lazy(() => import("@/components/cathedra/WhatsAppButton"));
const LogosChat = lazy(() => import("@/components/cathedra/LogosChat"));
const GuidedJourney = lazy(() => import("@/components/cathedra/GuidedJourney"));

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [isJourneyOpen, setIsJourneyOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (profile?.role === 'admin') {
        navigate(AppRoute.ADMIN, { replace: true });
      } else {
        const onboardingDone = localStorage.getItem("cathedra_onboarding_done");
        if (onboardingDone) {
          navigate(AppRoute.HOJE, { replace: true });
        }
      }
    }
  }, [user, profile, loading, navigate]);

  const handleStart = () => {
    setIsJourneyOpen(true);
  };

  const handleNavigate = (route: string) => navigate(route);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-foreground overflow-x-hidden selection:bg-primary/10">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-full focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Pular para o conteúdo principal
      </a>
      <LandingHeader />
      <SEOHead
        title="Bíblia, Catecismo e Tradição Católica"
        description="Aprofunde sua fé católica com o Logos IA, Bíblia Sagrada, Catecismo da Igreja, vidas dos santos e liturgia diária. Tudo gratuito."
        path="/"
        keywords="logos ia, liturgia diária online, bíblia digital, catecismo online, santos do dia, enciclopédia católica, app católico gratuito, oração diária, jornada espiritual"
        faqs={[
          { question: "O Cathedra é gratuito?", answer: "Sim! O acesso à Bíblia, Catecismo, Santos, Liturgia e Orações é totalmente gratuito. Recursos avançados como o Logos IA e análises aprofundadas estão disponíveis no plano Premium." },
          { question: "Preciso ser católico para usar?", answer: "Não. Embora o conteúdo seja baseado na tradição católica, qualquer pessoa interessada em estudar a Bíblia, a história dos santos ou a teologia cristã é bem-vinda." },
          { question: "Posso usar offline?", answer: "Sim! O Cathedra é um Progressive Web App (PWA). Após o primeiro acesso, grande parte do conteúdo fica disponível mesmo sem conexão à internet." },
          { question: "Como funciona o Logos IA?", answer: "É um assistente de inteligência artificial contemplativo treinado com documentos do Magistério da Igreja. Ele responde perguntas teológicas com citações das fontes oficiais, auxiliando seus estudos e vida de oração." },
          { question: "Meus dados estão seguros?", answer: "Absolutamente. Utilizamos criptografia de ponta e seguimos as melhores práticas de segurança. Seus dados de oração e estudo são privados e nunca compartilhados." },
          { question: "Posso instalar no celular?", answer: "Sim! O Cathedra pode ser instalado como um app no seu dispositivo Android ou iOS diretamente pelo navegador, sem precisar de loja de aplicativos." },
          { question: "Como dou feedback ou peço ajuda?", answer: "Você pode usar o botão de feedback no canto inferior da tela a qualquer momento! Adoramos ouvir nossos usuários para tornar o Cathedra cada vez melhor." },
        ]}
      />
      <HeroSection onStart={handleStart} onAbout={() => navigate(AppRoute.ABOUT)} />
      <main id="main-content" className="w-full flex flex-col items-center outline-none" tabIndex={-1}>
        <Suspense fallback={<SectionSkeleton />}>
          <div id="features" className="w-full"><FeaturesSection onNavigate={handleNavigate} /></div>
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <div className="w-full"><DailyRoutineSection /></div>
          <div id="testimonials" className="w-full"><TestimonialsSection /></div>
          <div id="pricing" className="w-full"><PricingSection /></div>
          <div id="faq" className="w-full"><FaqSection /></div>
          <div className="w-full"><CtaBannerSection onStart={handleStart} /></div>
        </Suspense>

        <Suspense fallback={null}>
          <FeedbackWidget />
          <LogosChat />
          <WhatsAppButton />
          <CookieConsent />
          <GuidedJourney isOpen={isJourneyOpen} onClose={() => setIsJourneyOpen(false)} />
        </Suspense>
      </main>
    </div>
  );
};

export default Index;
