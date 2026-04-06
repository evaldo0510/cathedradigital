import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { scaleIn } from "./animations";

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

const AnimatedStat = ({ value, label }: { value: string; label: string }) => {
  const numericMatch = value.match(/^(\d+)/);
  const suffix = numericMatch ? value.slice(numericMatch[0].length) : '';
  const numericValue = numericMatch ? parseInt(numericMatch[0], 10) : 0;
  const isNumeric = !!numericMatch && !value.includes('/');
  const { count, ref } = useCountUp(numericValue, 2000, true);

  return (
    <div ref={ref} className="text-center space-y-2">
      <p className="text-4xl md:text-5xl font-display font-bold text-primary">
        {isNumeric ? `${count.toLocaleString('pt-BR')}${suffix}` : value}
      </p>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
    </div>
  );
};

const stats = [
  { value: "73", label: "Livros da Bíblia" },
  { value: "2865", label: "Parágrafos do CIC" },
  { value: "365", label: "Santos catalogados" },
  { value: "24/7", label: "Acesso ilimitado" },
];

const StatsSection = () => (
  <section className="w-full py-16 px-6 border-y border-border/30 bg-muted/20">
    <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
      {stats.map((stat, i) => (
        <motion.div key={stat.label} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={i}>
          <AnimatedStat value={stat.value} label={stat.label} />
        </motion.div>
      ))}
    </div>
  </section>
);

export default StatsSection;
