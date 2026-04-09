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
        navigate(onboardingDone ? AppRoute.DASHBOARD : AppRoute.ONBOARDING, { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  const handleStart = () => {
    if (user) navigate(AppRoute.DASHBOARD);
    else navigate(AppRoute.LOGIN);
  };

  const handleNavigate = (route: string) => navigate(route);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-foreground overflow-x-hidden">
      <Helmet>
        <title>Cathedra Digital — Bíblia, Catecismo e Tradição Católica</title>
        <meta name="description" content="Aprofunde sua fé católica com Bíblia Sagrada, Catecismo da Igreja, vidas dos santos, liturgia diária e IA teológica." />
        <link rel="canonical" href="https://cathedradigital.lovable.app/" />
      </Helmet>
      <HeroSection onStart={handleStart} onAbout={() => navigate(AppRoute.ABOUT)} />
      <Suspense fallback={null}>
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
      </Suspense>
    </div>
  );
};

export default Index;
