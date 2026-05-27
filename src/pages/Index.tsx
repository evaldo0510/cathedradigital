import { useEffect, lazy, Suspense, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoute } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import HeroSection from "./landing/HeroSection";
import LandingHeader from "@/components/landing/LandingHeader";
import { SectionSkeleton } from "@/components/cathedra/HomeSkeletons";
import { LangContext } from "@/contexts/LangContext";
const HomeMainContent = lazy(() => import("@/components/cathedra/HomeMainContent"));

// Lazy-load secondary components
const CookieConsent = lazy(() => import("@/components/cathedra/CookieConsent"));
const SEOHead = lazy(() => import("@/components/SEOHead"));


const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { t } = useContext(LangContext);

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
        className="sr-only focus:not-sr-only focus:fixed focus:top-6 focus:left-6 focus:z-[200] focus:px-6 focus:py-3 focus:bg-primary focus:text-primary-foreground focus:rounded-full focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background transition-all duration-300 font-bold uppercase tracking-[0.2em] text-[10px]"
      >
        {t('skip_to_content') || 'Pular para o conteúdo'}
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

      <HeroSection onStart={handleStart} />

      <div className="w-full flex flex-col items-center outline-none">
        <Suspense fallback={<div className="w-full py-12"><SectionSkeleton /></div>}>
          <HomeMainContent 
            user={user} 
            profile={profile} 
            onNavigate={handleNavigate} 
            t={t} 
          />
        </Suspense>

        <Suspense fallback={null}>
          <CookieConsent />
        </Suspense>
      </div>
    </div>
  );
};

export default Index;