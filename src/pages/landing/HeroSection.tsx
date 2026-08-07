import { useRef } from "react";
import { useScroll, useTransform } from "framer-motion";
import { lazy, Suspense } from "react";
const HeroBackground = lazy(() => import("./hero/HeroBackground"));
const HeroContent = lazy(() => import("./hero/HeroContent"));
const HeroParticles = lazy(() => import("./hero/HeroParticles"));
const HeroScrollIndicator = lazy(() => import("./hero/HeroScrollIndicator"));

interface HeroSectionProps {
  onStart: () => void;
}

const HeroSection = ({ onStart }: HeroSectionProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ 
    target: heroRef, 
    offset: ["start start", "end start"] 
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  return (
    <section 
      ref={heroRef} 
      className="relative w-full min-h-screen flex items-center justify-center px-spacing-lg overflow-hidden bg-background"
      aria-label="Cathedra Digital - Introdução"
    >
      <h1 className="sr-only">Cathedra Digital — Biblioteca Espiritual e Mosteiro Digital</h1>
      <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
        <HeroBackground bgY={heroY} />
      </Suspense>
      <Suspense fallback={null}>
        <HeroParticles />
      </Suspense>
      <Suspense fallback={<div className="relative z-10 w-full h-full flex items-center justify-center" />}>
        <HeroContent 
          heroOpacity={heroOpacity} 
          heroScale={1} 
          heroY={heroY} 
          onStart={onStart} 
        />
      </Suspense>
      <div className="sr-only">Rolar para baixo para explorar o santuário digital</div>
      <Suspense fallback={null}>
        <HeroScrollIndicator />
      </Suspense>
    </section>
  );
};

export default HeroSection;