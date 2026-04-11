import { useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { AppRoute } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import HeroSection from "./landing/HeroSection";

// Lazy-load below-the-fold sections
const InstitutionalVideoSection = lazy(() => import("./landing/InstitutionalVideoSection"));
const StatsSection = lazy(() => import("./landing/StatsSection"));
const FeaturesSection = lazy(() => import("./landing/FeaturesSection"));
const HowItWorksSection = lazy(() => import("./landing/HowItWorksSection"));
const AcolhimentoSection = lazy(() => import("./landing/AcolhimentoSection"));
const BenefitsSection = lazy(() => import("./landing/BenefitsSection"));
const TestimonialsSection = lazy(() => import("./landing/TestimonialsSection"));
const FaqSection = lazy(() => import("./landing/FaqSection"));
const CtaBannerSection = lazy(() => import("./landing/CtaBannerSection"));
const FeedbackWidget = lazy(() => import("@/components/landing/FeedbackWidget"));

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (profile?.role === 'admin') {
        navigate(AppRoute.ADMIN, { replace: true });
      } else {
        const onboardingDone = localStorage.getItem("cathedra_onboarding_done");
        navigate(onboardingDone ? AppRoute.HOJE : AppRoute.ONBOARDING, { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  const handleStart = () => {
    if (user) navigate(AppRoute.HOJE);
    else navigate(AppRoute.LOGIN);
  };

  const handleNavigate = (route: string) => navigate(route);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-foreground overflow-x-hidden">
      <SEOHead
        title="Bíblia, Catecismo e Tradição Católica"
        description="Aprofunde sua fé católica com Bíblia Sagrada, Catecismo da Igreja, vidas dos santos, liturgia diária e IA teológica. Tudo gratuito."
        path="/"
        keywords="liturgia diária online, bíblia digital, catecismo online, santos do dia, app católico gratuito, oração diária, jornada espiritual"
        faqs={[
          { question: "O Cathedra é gratuito?", answer: "Sim! O acesso à Bíblia, Catecismo, Santos, Liturgia e Orações é totalmente gratuito. Recursos avançados como o Colloquium IA e análises aprofundadas estão disponíveis no plano Premium." },
          { question: "Preciso ser católico para usar?", answer: "Não. Embora o conteúdo seja baseado na tradição católica, qualquer pessoa interessada em estudar a Bíblia, a história dos santos ou a teologia cristã é bem-vinda." },
          { question: "Posso usar offline?", answer: "Sim! O Cathedra é um Progressive Web App (PWA). Após o primeiro acesso, grande parte do conteúdo fica disponível mesmo sem conexão à internet." },
          { question: "Como funciona o Colloquium IA?", answer: "É um assistente de inteligência artificial treinado com documentos do Magistério da Igreja. Ele responde perguntas teológicas com citações das fontes oficiais, auxiliando seus estudos." },
          { question: "Meus dados estão seguros?", answer: "Absolutamente. Utilizamos criptografia de ponta e seguimos as melhores práticas de segurança. Seus dados de oração e estudo são privados e nunca compartilhados." },
          { question: "Posso instalar no celular?", answer: "Sim! O Cathedra pode ser instalado como um app no seu dispositivo Android ou iOS diretamente pelo navegador, sem precisar de loja de aplicativos." },
          { question: "Como dou feedback ou peço ajuda?", answer: "Você pode usar o botão de feedback no canto inferior da tela a qualquer momento! Adoramos ouvir nossos usuários para tornar o Cathedra cada vez melhor." },
        ]}
      />
      <HeroSection onStart={handleStart} onAbout={() => navigate(AppRoute.ABOUT)} />
      <Suspense fallback={null}>
        <div className="w-full" style={{ contentVisibility: 'auto' }}>
          <InstitutionalVideoSection />
          <StatsSection />
          <FeaturesSection onNavigate={handleNavigate} />
          <HowItWorksSection />
          <AcolhimentoSection />
          <BenefitsSection onLogin={() => navigate(AppRoute.LOGIN)} />
          <TestimonialsSection />
          <FaqSection />
          <CtaBannerSection onStart={handleStart} />
          <FeedbackWidget />
        </div>
      </Suspense>
    </div>
  );
};

export default Index;
