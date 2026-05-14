import { useRef } from "react";
import { useScroll, useTransform } from "framer-motion";
import HeroBackground from "./hero/HeroBackground";
import HeroContent from "./hero/HeroContent";
import HeroScrollIndicator from "./hero/HeroScrollIndicator";

interface HeroSectionProps {
  onStart: () => void;
  onAbout: () => void;
}

const HeroSection = ({ onStart, onAbout }: HeroSectionProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ 
    target: heroRef, 
    offset: ["start start", "end start"] 
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  return (
    <section ref={heroRef} className="relative w-full min-h-[100dvh] flex items-center justify-center px-6 overflow-hidden">
      <HeroBackground bgY={heroY} />
      <HeroContent 
        heroOpacity={heroOpacity} 
        heroScale={1} 
        heroY={heroY} 
        onStart={onStart} 
        onAbout={onAbout} 
      />
      <HeroScrollIndicator />
    </section>
  );
};

export default HeroSection;