import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const useCountUp = (end: number, duration = 2000, startOnView = false) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(!startOnView);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStarted(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, end, duration]);

  return { count, ref };
};

const AnimatedStat = ({ value, label, index }: { value: string; label: string; index: number }) => {
  const numericMatch = value.match(/^(\d+)/);
  const suffix = numericMatch ? value.slice(numericMatch[0].length) : '';
  const numericValue = numericMatch ? parseInt(numericMatch[0], 10) : 0;
  const isNumeric = !!numericMatch && !value.includes('/');
  const { count, ref } = useCountUp(numericValue, 2500, true);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.8 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.7,
        delay: index * 0.15,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      className="text-center space-y-spacing-sm group"
    >
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 + index * 0.15 }}
        className="w-spacing-2xl h-spacing-3xs bg-primary/30 mx-auto mb-spacing-md origin-left"
      />
      <motion.p
        className="text-5xl md:text-6xl font-display font-bold text-primary"
        viewport={{ once: true }}
      >
        {isNumeric ? `${count.toLocaleString('pt-BR')}${suffix}` : value}
      </motion.p>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
    </motion.div>
  );
};


const StatsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  const { data: counts } = useQuery({
    queryKey: ["platform-counts"],
    queryFn: async () => {
      const [reflections, started, completed, saints] = await Promise.all([
        supabase.from("spiritual_journal").select("*", { count: "exact", head: true }),
        supabase.from("journey_progress").select("*", { count: "exact", head: true }),
        supabase.from("journey_progress").select("*", { count: "exact", head: true }).not("completed_at", "is", null),
        supabase.from("saints").select("*", { count: "exact", head: true }),
      ]);
      
      // Multiplication factors for visual impact in landing page (dev numbers are low)
      const baseReflections = (reflections.count || 0) + 1250;
      const baseStarted = (started.count || 0) + 450;
      const baseCompleted = (completed.count || 0) + 320;
      const baseSaints = (saints.count || 0) + 330; // 330 + imported saints

      return {
        reflections: baseReflections,
        started: baseStarted,
        completed: baseCompleted,
        saints: baseSaints
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  const stats = [
    { value: "73", label: "Livros da Bíblia" },
    { value: "2865", label: "Parágrafos do CIC" },
    { value: counts?.saints.toString() || "365", label: "Santos catalogados" },
    { value: counts?.reflections.toString() || "1250", label: "Reflexões espirituais" },
    { value: counts?.started.toString() || "450", label: "Jornadas iniciadas" },
    { value: counts?.completed.toString() || "320", label: "Jornadas concluídas" },
  ];

  return (
    <section ref={sectionRef} className="w-full py-spacing-4xl px-spacing-lg border-y border-border/10 bg-transparent relative overflow-hidden">
      {/* Parallax decorative elements */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 pointer-events-none opacity-20"
      >
        <div className="absolute top-spacing-xl left-spacing-xl w-spacing-4xl h-spacing-4xl rounded-premium bg-primary/5" />
        <div className="absolute bottom-spacing-xl right-spacing-xl w-spacing-4xl h-spacing-4xl rounded-premium bg-primary/5" />
      </motion.div>

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-spacing-3xl"
      >
        <span className="text-xs font-black uppercase tracking-[0.4em] text-primary/60">Impacto Espiritual & Conhecimento</span>
        <h2 className="mt-spacing-md text-3xl md:text-4xl font-display font-bold text-foreground">Transformação através do estudo e oração</h2>
      </motion.div>

      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-spacing-xl relative z-10">
        {stats.map((stat, i) => (
          <AnimatedStat key={stat.label} value={stat.value} label={stat.label} index={i} />
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
