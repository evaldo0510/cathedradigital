import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Sparkles, X, VolumeX } from "lucide-react";
import { fadeUp } from "./animations";
import videoAsset from "../../assets/institutional-video.mp4.asset.json";

const InstitutionalVideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Lazy-load video only when section is near viewport
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

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleClose = () => {
    setIsPlaying(false);
    if (modalVideoRef.current) {
      modalVideoRef.current.pause();
    }
  };

  return (
    <section ref={sectionRef} className="relative w-full py-20 md:py-28 bg-gradient-to-b from-background via-card/30 to-background overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px] -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px] translate-y-1/2" />

      <div className="container px-6 mx-auto relative z-10">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-12 space-y-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <Sparkles className="w-3 h-3" />
            <span>Vídeo Institucional</span>
          </motion.div>
          
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground leading-tight"
          >
            Conheça o Propósito da <br />
            <span className="text-primary italic font-light">Cathedra Digital</span>
          </motion.h2>
          
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
            className="text-lg md:text-xl text-muted-foreground font-serif italic max-w-2xl mx-auto"
          >
            "Onde a tecnologia encontra a tradição, e a oração encontra o seu espaço no mundo digital."
          </motion.p>
        </div>

        {/* Video Player */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={3}
          className="relative max-w-5xl mx-auto group cursor-pointer"
          onClick={handlePlay}
        >
          {/* Glow ring behind the video */}
          <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-primary/5 to-primary/20 rounded-[28px] blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.25)] border border-border/80 bg-black group-hover:shadow-[0_25px_70px_-10px_hsl(var(--primary)/0.35)] transition-all duration-500">
            {/* Preview video — lazy loaded when visible */}
            {isVisible ? (
              <video
                ref={videoRef}
                src={videoAsset.url}
                muted
                loop
                autoPlay
                playsInline
                preload="metadata"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-muted animate-pulse" />
            )}
            
            {/* Subtle bottom gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            
            {/* Central play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 md:w-24 md:h-24 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-2xl shadow-primary/50 relative z-20 group-hover:bg-primary/90 transition-colors"
              >
                <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-1" />
                <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping -z-10" />
                <div className="absolute -inset-4 rounded-full border-2 border-primary/30 animate-pulse -z-10" />
              </motion.div>
            </div>

            {/* Bottom info bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Apresentação</p>
                <h3 className="text-white text-lg md:text-xl font-bold">A Nova Era da Fé Digital</h3>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm font-medium">
                <VolumeX className="w-4 h-4" />
                <span>Clique para assistir</span>
              </div>
            </div>
          </div>

          {/* Corner decorations */}
          <div className="absolute -top-3 -left-3 w-10 h-10 border-t-2 border-l-2 border-primary/50 rounded-tl-xl -z-10" />
          <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-2 border-r-2 border-primary/50 rounded-br-xl -z-10" />
        </motion.div>
        
        {/* Feature cards */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={4}
          className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {[
            { title: "Tradição Viva", desc: "O conteúdo milenar da Igreja Católica acessível de forma inteligente e organizada." },
            { title: "Comunidade Digital", desc: "Uma rede de oração e estudo que conecta fiéis ao redor do mundo em um só espírito." },
            { title: "Sua Fé com Companhia", desc: "Mergulhe nas Escrituras e no Magistério com um guia que ajuda a traduzir a teoria em vida interior." },
          ].map((card) => (
            <div key={card.title} className="p-6 rounded-2xl bg-card/40 border border-border/50 hover:border-primary/30 hover:bg-card/60 transition-all duration-300">
              <h4 className="text-primary font-bold mb-2">{card.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Fullscreen Video Modal */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={handleClose}
                className="absolute top-4 right-4 z-50 p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
              >
                <X className="w-6 h-6 text-white" />
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
