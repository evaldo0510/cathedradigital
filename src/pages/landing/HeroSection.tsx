import { useRef } from "react";
import { useScroll, useTransform } from "framer-motion";
import HeroBackground from "./hero/HeroBackground";
import HeroParticles from "./hero/HeroParticles";
import HeroContent from "./hero/HeroContent";
import HeroScrollIndicator from "./hero/HeroScrollIndicator";

interface HeroSectionProps {
  onStart: () => void;
  onAbout: () => void;
}

const HeroSection = ({ onStart, onAbout }: HeroSectionProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section ref={heroRef} className="relative w-full min-h-[100dvh] flex items-center justify-center px-6 overflow-hidden">
      <HeroBackground bgY={bgY} />
      <HeroParticles />
      <HeroContent heroOpacity={heroOpacity} heroScale={heroScale} heroY={heroY} onStart={onStart} onAbout={onAbout} />
      <HeroScrollIndicator />
    </section>
  );
};

export default HeroSection;
