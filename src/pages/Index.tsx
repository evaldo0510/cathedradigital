import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { AppRoute } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import HeroSection from "./landing/HeroSection";
import StatsSection from "./landing/StatsSection";
import FeaturesSection from "./landing/FeaturesSection";
import HowItWorksSection from "./landing/HowItWorksSection";
import BenefitsSection from "./landing/BenefitsSection";
import TestimonialsSection from "./landing/TestimonialsSection";
import FaqSection from "./landing/FaqSection";
import CtaBannerSection from "./landing/CtaBannerSection";
import LandingFooter from "./landing/LandingFooter";

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
      <StatsSection />
      <FeaturesSection onNavigate={handleNavigate} />
      <HowItWorksSection />
      <BenefitsSection onLogin={() => navigate(AppRoute.LOGIN)} />
      <TestimonialsSection />
      <FaqSection />
      <CtaBannerSection onStart={handleStart} />
      {/* Landing footer removed in favor of global navigation */}
    </div>
  );
};

export default Index;
