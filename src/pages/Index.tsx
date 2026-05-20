import { useEffect, useState, lazy, Suspense, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { AppRoute } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import HeroSection from "./landing/HeroSection";
import LandingHeader from "@/components/landing/LandingHeader";
import { HeroSkeleton, SectionSkeleton } from "@/components/cathedra/HomeSkeletons";
import { LangContext } from "@/contexts/LangContext";
import HomeMainContent from "@/components/cathedra/HomeMainContent";

// Lazy-load secondary components
const LogosChat = lazy(() => import("@/components/cathedra/LogosChat"));
const CookieConsent = lazy(() => import("@/components/cathedra/CookieConsent"));


const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { t } = useContext(LangContext);
  const [isJourneyOpen, setIsJourneyOpen] = useState(false);

  const websiteSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Cathedra Digital",
    "url": "https://www.cathedradigital.com.br",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.cathedradigital.com.br/buscar?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }), []);


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
    const el = document.getElementById('main-content');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
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
        title="Cathedra Digital | Portal de Espiritualidade Minimalista"
        description="Aprofunde sua fé com a Sagrada Escritura, Catecismo e Magistério. Use a Logos IA para resumos teológicos e siga sua Leitura Diária com progresso persistente no portal espiritual inteligente."
        path="/"
        keywords="bíblia católica, catecismo online, magistério da igreja, leitura diária, logos ia, espiritualidade minimalista, portal católico premium"
        image="https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-home.png"
        breadcrumbs={[
          { name: "Home", path: "/" }
        ]}
      />
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>

      <HeroSection onStart={handleStart} onAbout={() => navigate(AppRoute.ABOUT)} />

      <main id="main-content" className="w-full flex flex-col items-center outline-none pt-24 md:pt-32 pb-32 md:pb-48" tabIndex={-1}>
        <Suspense fallback={<SectionSkeleton />}>
          <HomeMainContent 
            user={user} 
            profile={profile} 
            onNavigate={handleNavigate} 
            t={t} 
          />
        </Suspense>

        <Suspense fallback={null}>
          <LogosChat />
          <CookieConsent />
        </Suspense>

      </main>
    </div>
  );
};

export default Index;