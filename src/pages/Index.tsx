import { useEffect, lazy, Suspense, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoute } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import HeroSection from "./landing/HeroSection";
import LandingHeader from "@/components/landing/LandingHeader";
import { SectionSkeleton } from "@/components/cathedra/HomeSkeletons";
import { LangContext } from "@/contexts/LangContext";
import ContemplativeLayout from "@/components/cathedra/ContemplativeLayout";
import { Icons } from "@/constants";
const HomeMainContent = lazy(() => import("@/components/cathedra/HomeMainContent"));

// Lazy-load secondary components
const CookieConsent = lazy(() => import("@/components/cathedra/CookieConsent"));
const SEOHead = lazy(() => import("@/components/SEOHead"));


const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading, authenticated } = useAuth();
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


  // Removed automatic admin redirect to ensure everyone starts at the contemplative home experience
  // Admin interface is now exclusively accessible via the /admin route manually or via sidebar


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
      
      {!authenticated && <LandingHeader />}
      
      <SEOHead
        title="Portal Premium de Espiritualidade & Teologia"
        description="Aprofunde sua fé com uma experiência cinematográfica e contemplativa. Bíblia Sagrada, Catecismo, Magistério e IA Teológica em uma plataforma sofisticada e minimalista para a vida espiritual moderna."
        path="/"
        keywords="bíblia católica premium, catecismo online, magistério da igreja, leitura bíblica diária, logos ia, espiritualidade minimalista, portal teológico sofisticado, cathedra digital"
        image="https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-premium-home.png"
        breadcrumbs={[
          { name: "Home", path: "/" }
        ]}
      />
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>

      {!authenticated && <HeroSection onStart={handleStart} />}
      
      {authenticated && (
        <ContemplativeLayout
          title="Ecclesia"
          subtitle="Domus Dei"
          icon={Icons.Cross}
          className="pb-32"
        >
          <HomeMainContent 
            user={user} 
            profile={profile} 
            onNavigate={handleNavigate} 
            t={t} 
          />
          
          <Suspense fallback={null}>
            <CookieConsent />
          </Suspense>
        </ContemplativeLayout>
      )}
    </div>
  );
};

export default Index;