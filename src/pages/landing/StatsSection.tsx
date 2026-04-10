import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

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
      className="text-center space-y-3 group"
    >
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 + index * 0.15 }}
        className="w-12 h-0.5 bg-primary/30 mx-auto mb-4 origin-left"
      />
      <motion.p
        className="text-5xl md:text-6xl font-display font-bold text-primary"
        whileInView={{
          textShadow: [
            "0 0 0px hsl(var(--secondary) / 0)",
            "0 0 20px hsl(var(--secondary) / 0.3)",
            "0 0 0px hsl(var(--secondary) / 0)",
          ],
        }}
        transition={{ duration: 2, delay: 0.5 + index * 0.15, repeat: 0 }}
        viewport={{ once: true }}
      >
        {isNumeric ? `${count.toLocaleString('pt-BR')}${suffix}` : value}
      </motion.p>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
    </motion.div>
  );
};

const stats = [
  { value: "73", label: "Livros da Bíblia" },
  { value: "2865", label: "Parágrafos do CIC" },
  { value: "365", label: "Santos catalogados" },
  { value: "24/7", label: "Acesso ilimitado" },
];

const StatsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  return (
    <section ref={sectionRef} className="w-full py-24 px-6 border-y border-border/30 bg-muted/20 relative overflow-hidden">
      {/* Parallax decorative elements */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
      </motion.div>

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Em números</span>
      </motion.div>

      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
        {stats.map((stat, i) => (
          <AnimatedStat key={stat.label} value={stat.value} label={stat.label} index={i} />
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
