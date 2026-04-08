import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Sparkles, X } from "lucide-react";
import { fadeUp } from "./animations";
import videoAsset from "../../../public/institutional-video.mp4.asset.json";

const InstitutionalVideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

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
    <section className="relative w-full py-24 md:py-32 bg-background overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] translate-y-1/2" />

      <div className="container px-6 mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
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

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={3}
          className="relative max-w-5xl mx-auto group"
        >
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-border bg-card/50 group-hover:shadow-primary/20 transition-all duration-500">
            {/* Preview video (muted, looping) */}
            <video
              ref={videoRef}
              src={videoAsset.url}
              muted
              loop
              autoPlay
              playsInline
              className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlay}
                className="w-20 h-20 md:w-24 md:h-24 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 relative z-20 group-hover:bg-primary/90 transition-colors"
              >
                <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-1" />
                <div className="absolute inset-0 rounded-full bg-primary/40 animate-ping -z-10" />
                <div className="absolute -inset-4 rounded-full border border-primary/20 animate-pulse -z-10" />
              </motion.button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-end bg-gradient-to-t from-black/60 to-transparent">
              <div className="space-y-1">
                <p className="text-white/70 text-xs font-black uppercase tracking-widest">Apresentação</p>
                <h3 className="text-white text-xl font-bold">A Nova Era da Fé Digital</h3>
              </div>
              <div className="text-white/60 text-sm font-medium">
                0:05
              </div>
            </div>
          </div>

          <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-primary/40 rounded-tl-2xl -z-10" />
          <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-2 border-r-2 border-primary/40 rounded-br-2xl -z-10" />
        </motion.div>
        
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={4}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          <div className="p-6 rounded-2xl bg-card/30 border border-border/50 hover:border-primary/20 transition-colors">
            <h4 className="text-primary font-bold mb-2">Tradição Viva</h4>
            <p className="text-sm text-muted-foreground">O conteúdo milenar da Igreja Católica acessível de forma inteligente e organizada.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card/30 border border-border/50 hover:border-primary/20 transition-colors">
            <h4 className="text-primary font-bold mb-2">Comunidade Digital</h4>
            <p className="text-sm text-muted-foreground">Uma rede de oração e estudo que conecta fiéis ao redor do mundo em um só espírito.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card/30 border border-border/50 hover:border-primary/20 transition-colors">
            <h4 className="text-primary font-bold mb-2">Fé Aumentada</h4>
            <p className="text-sm text-muted-foreground">Use a inteligência teológica para aprofundar seu conhecimento nas Escrituras Sagradas.</p>
          </div>
        </motion.div>
      </div>

      {/* Video Modal */}
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
                className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
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
