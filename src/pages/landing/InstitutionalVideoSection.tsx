import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Play, Sparkles, X, Volume2, Shield, Church, Globe, Users } from "lucide-react";
import { fadeUp } from "./animations";
import videoAsset from "../../assets/institutional-video.mp4.asset.json";

const InstitutionalVideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.8, 1]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handlePlay = () => setIsPlaying(true);
  const handleClose = () => {
    setIsPlaying(false);
    if (modalVideoRef.current) modalVideoRef.current.pause();
  };

  return (
    <section ref={sectionRef} className="relative w-full py-24 md:py-40 bg-background overflow-hidden">
      {/* Cinematic Background Layers */}
      <div className="absolute inset-0 z-0">
        <motion.div style={{ y: y1 }} className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <motion.div style={{ y: y2 }} className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_70%)] opacity-80" />
      </div>

      <div className="container px-6 mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Narrative */}
          <motion.div 
            style={{ opacity, scale }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.2em]"
              >
                <Sparkles className="w-3 h-3" />
                <span>Experiência Digital</span>
              </motion.div>
              
              <h2 className="text-5xl md:text-6xl font-display font-bold tracking-tight text-foreground leading-[1.1]">
                A Tradição que <br />
                <span className="text-primary italic font-light">Se Move com Você</span>
              </h2>
              
              <p className="text-xl text-muted-foreground font-serif italic max-w-xl leading-relaxed">
                "Não tenhas medo da tecnologia, mas coloca-a a serviço do Evangelho." — Um convite para mergulhar na profundidade da fé com a agilidade do agora.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              {[
                { icon: Church, title: "Liturgia Viva", desc: "Acompanhe o ritmo da Igreja em tempo real." },
                { icon: Shield, title: "Magistério Fiel", desc: "Conteúdo 100% alinhado à Doutrina Católica." },
                { icon: Globe, title: "Universalidade", desc: "Acesse tesouros da fé de qualquer lugar." },
                { icon: Users, title: "Comunhão", desc: "Sinta-se parte de uma rede global de oração." },
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-4 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-card border border-border/50 flex items-center justify-center group-hover:border-primary/30 transition-colors shadow-sm">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Video Showcase */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={3}
            className="relative group"
          >
            {/* Ambient Glow */}
            <div className="absolute -inset-4 bg-primary/10 rounded-[40px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div 
              className="relative aspect-[4/5] sm:aspect-video rounded-[32px] overflow-hidden border border-border/50 bg-black shadow-2xl cursor-pointer group-hover:scale-[1.02] transition-all duration-700"
              onClick={handlePlay}
            >
              {isVisible ? (
                <video
                  ref={videoRef}
                  src={videoAsset.url}
                  muted
                  loop
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
                />
              ) : (
                <div className="w-full h-full bg-muted/20 animate-pulse" />
              )}

              {/* Cinematic Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-24 h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-2xl group/btn overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-primary/20 scale-0 group-hover/btn:scale-100 transition-transform duration-500 rounded-full" />
                  <Play className="w-10 h-10 text-white fill-white relative z-10 ml-1" />
                  <div className="absolute inset-0 border-2 border-white/30 rounded-full animate-ping opacity-20" />
                </motion.div>
                
                <div className="text-center space-y-2 px-8">
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                    Assistir Apresentação
                  </h3>
                  <p className="text-white/60 text-sm font-medium tracking-wide uppercase">
                    Mergulhe na Proposta da Catedra
                  </p>
                </div>
              </div>

              {/* Progress Indicator Decorative */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="h-full bg-primary/60"
                />
              </div>
            </div>

            {/* Floating Badge */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -right-6 hidden md:flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-xl z-20"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-primary uppercase tracking-tighter">Som Ativado</p>
                <p className="text-xs font-bold text-foreground">Experiência Imersiva</p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>

      {/* Fullscreen Video Modal */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-6xl aspect-video bg-black rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={handleClose}
                className="absolute top-6 right-6 z-50 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all backdrop-blur-md group"
              >
                <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
              </button>

              <video
                ref={modalVideoRef}
                src={videoAsset.url}
                autoPlay
                loop
                controls
                playsInline
                className="w-full h-full object-cover"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default InstitutionalVideoSection;
