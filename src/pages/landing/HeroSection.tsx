import { useRef } from "react";
import { useScroll, useTransform } from "framer-motion";
import HeroBackground from "./hero/HeroBackground";
import HeroContent from "./hero/HeroContent";
import HeroParticles from "./hero/HeroParticles";
import HeroScrollIndicator from "./hero/HeroScrollIndicator";

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
      <HeroBackground bgY={heroY} />
      <HeroParticles />
      <HeroContent 
        heroOpacity={heroOpacity} 
        heroScale={1} 
        heroY={heroY} 
        onStart={onStart} 
      />
      <div className="sr-only">Rolar para baixo para explorar o santuário digital</div>
      <HeroScrollIndicator />
    </section>
  );
};

export default HeroSection;