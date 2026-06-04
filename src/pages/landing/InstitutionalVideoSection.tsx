import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";

import { fadeUp } from "./animations";
import { supabase } from "@/integrations/supabase/client";
import videoAsset from "../../assets/institutional-video.mp4.asset.json";

// Standardizing track structure
const SUBTITLES = [
  { label: "Português", src: "/subtitles/pt.vtt", lang: "pt" },
  { label: "English", src: "/subtitles/en.vtt", lang: "en" },
  { label: "Español", src: "/subtitles/es.vtt", lang: "es" },
];

const InstitutionalVideoSection = () => {
  const shouldReduceMotion = useReducedMotion();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cathedra_video_muted') === 'true';
    }
    return true;
  });
  const [currentLang, setCurrentLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cathedra_video_lang') || "pt";
    }
    return "pt";
  });
  const [videoError, setVideoError] = useState(false);
  
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.8, 1]);

  // Analytics helper
  const trackEvent = useCallback(async (eventName: string, props: Record<string, any> = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('analytics_events').insert({
        event_name: eventName,
        properties: { 
          lang: currentLang,
          ...props 
        },
        user_id: user?.id,
        url: window.location.href
      });
    } catch (err) {
      console.error('Analytics error:', err);
    }
  }, [currentLang]);

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
    trackEvent('video_modal_open');
  };

  const handleClose = () => {
    setIsPlaying(false);
    if (modalVideoRef.current) modalVideoRef.current.pause();
    trackEvent('video_modal_close');
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('cathedra_video_muted', String(newMuted));
    trackEvent('video_mute_toggle', { muted: newMuted });
  };

  // Scroll lock management
  useEffect(() => {
    if (isPlaying) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isPlaying]);

  // Restore playback position once when modal opens
  useEffect(() => {
    if (isPlaying && modalVideoRef.current) {
      const video = modalVideoRef.current;
      const savedPosStr = localStorage.getItem('cathedra_video_pos');
      if (savedPosStr) {
        const savedPos = parseFloat(savedPosStr);
        // Use a small delay to ensure video is ready to seek
        const timer = setTimeout(() => {
          if (video && !isNaN(savedPos)) {
            video.currentTime = savedPos;
            trackEvent('video_resume_position', { position: savedPos });
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [isPlaying, trackEvent]);

  // Subtitle synchronization - updates immediately when language changes
  useEffect(() => {
    if (isPlaying && modalVideoRef.current) {
      const video = modalVideoRef.current;
      
      const updateTracks = () => {
        const tracks = Array.from(video.textTracks);
        tracks.forEach(track => {
          // Force immediate update by setting to disabled then showing
          if (track.language === currentLang) {
            track.mode = 'showing';
          } else {
            track.mode = 'disabled';
          }
        });
      };

      // Try immediate update
      updateTracks();

      // Also listen for track changes to ensure synchronization
      video.textTracks.onaddtrack = updateTracks;
      
      return () => {
        if (video.textTracks) {
          video.textTracks.onaddtrack = null;
        }
      };
    }
  }, [currentLang, isPlaying]);

  // Focus trap and keyboard navigation
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 100);
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") handleClose();
        
        if (e.key === "Tab") {
          const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), video';
          const focusableElements = modalContainerRef.current?.querySelectorAll(focusableSelector);
          
          if (!focusableElements || focusableElements.length === 0) return;
          
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (e.shiftKey) {
            if (document.activeElement === firstElement || !modalContainerRef.current?.contains(document.activeElement)) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement || !modalContainerRef.current?.contains(document.activeElement)) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };
      
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        clearTimeout(timer);
      };
    }
  }, [isPlaying]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    localStorage.setItem('cathedra_video_pos', String(e.currentTarget.currentTime));
  };

  return (
    <section ref={sectionRef} className="relative w-full py-spacing-4xl md:py-spacing-4xl bg-background overflow-hidden" aria-labelledby="video-section-title">
      {/* Cinematic Background Layers */}
      <div className="absolute inset-0 z-0 bg-background/50" aria-hidden="true">
        <motion.div style={{ y: shouldReduceMotion ? 0 : y1 }} className="absolute top-spacing-0 right-0 w-[600px] h-[600px] bg-primary/2 rounded-premium" />
        <motion.div style={{ y: shouldReduceMotion ? 0 : y2 }} className="absolute bottom-spacing-0 left-0 w-[500px] h-[500px] bg-secondary/2 rounded-premium" />
      </div>

      <div className="container px-spacing-lg mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-3xl items-center">
          
          <motion.div 
            style={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity, scale }}
            className="space-y-spacing-xl"
          >
            <div className="space-y-spacing-md">
              <span className="text-premium-xs font-bold uppercase tracking-[0.4em] text-primary/40 block italic">Apresentação</span>
              <h2 id="video-section-title" className="font-display font-bold leading-tight">
                A Tradição em <span className="text-primary italic font-serif">Movimento</span>
              </h2>
              <p className="text-muted-foreground font-serif max-w-spacing-md">
                Coloca a tecnologia a serviço do Evangelho.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-spacing-lg pt-spacing-md">
              {[
                { title: "Liturgia Viva", desc: "Igreja em tempo real." },
                { title: "Magistério Fiel", desc: "100% Doutrina Católica." },
                { title: "Universalidade", desc: "Tesouros de qualquer lugar." },
                { title: "Comunhão", desc: "Rede global de oração." },
              ].map((item) => (
                <div key={item.title} className="space-y-spacing-2xs">
                  <h4 className="font-bold text-foreground text-premium-small">{item.title}</h4>
                  <p className="text-premium-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
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
            <Button 
              className="relative w-full aspect-[4/5] sm:aspect-video rounded-[32px] overflow-hidden border border-border bg-black shadow-premium cursor-pointer group-hover:scale-[1.01] transition-all duration-700 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
              onClick={handlePlay}
              aria-label="Abrir vídeo de apresentação da Catedra Digital"
            >
              {isVisible && !videoError ? (
                <video
                  ref={videoRef}
                  src={videoAsset.url}
                  poster="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=80&w=1200"
                  aria-label="Vídeo de apresentação da Catedra Digital"
                  muted
                  loop
                  autoPlay
                  playsInline
                  preload="metadata"
                  onError={() => setVideoError(true)}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
                />
              ) : (
                <div className="w-full h-full relative">
                  <img 
                    src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=80&w=1200" 
                    alt="Interior de uma catedral majestosa" 
                    className="w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 bg-muted/20 animate-pulse" />
                </div>
              )}

              {/* Cinematic Overlays */}
              <div className="absolute inset-0 bg-black/40" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-spacing-lg">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-spacing-4xl h-spacing-4xl bg-white/20 border border-white/30 rounded-premium-full flex items-center justify-center shadow-premium group/btn overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-primary/20 scale-0 group-hover/btn:scale-100 transition-transform duration-500 rounded-premium" />
                  <Icons.Play className="w-spacing-xl h-spacing-xl text-white fill-white relative z-10 ml-spacing-2xs" />
                </motion.div>
                
                <div className="text-center space-y-spacing-xs px-spacing-xl">
                  <h3 className="font-display font-bold text-white tracking-tight">
                    Assistir Apresentação
                  </h3>
                  <p className="text-white/60 text-premium-small font-medium tracking-wide uppercase">
                    Mergulhe na Proposta da Catedra
                  </p>
                </div>
              </div>

              {/* Progress Indicator Decorative */}
              <div className="absolute bottom-spacing-0 left-0 right-0 h-spacing-2xs bg-white/10">
                <motion.div 
                  initial={shouldReduceMotion ? { width: "100%" } : { width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="h-full bg-primary/60"
                />
              </div>
            </Button>

            {/* Floating Badge / Sound Control */}
            <motion.div
              animate={shouldReduceMotion ? { y: 0 } : { y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-spacing-lg -right-spacing-lg hidden md:flex items-center gap-spacing-sm p-spacing-md bg-card border border-border rounded-premium-full shadow-premium-hover z-20 cursor-pointer select-none"
              onClick={toggleMute}
              role="button"
              aria-label={isMuted ? "Ativar som" : "Desativar som"}
            >
              <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/10 flex items-center justify-center">
                {isMuted ? <Icons.VolumeX className="w-spacing-md h-spacing-md text-primary" /> : <Icons.Volume2 className="w-spacing-md h-spacing-md text-primary" />}
              </div>
              <div className="space-y-spacing-3xs">
                <p className="text-premium-xs font-black text-primary uppercase tracking-tighter">
                  {isMuted ? "Mudo" : "Som Ativado"}
                </p>
                <p className="text-premium-xs font-bold text-foreground">Experiência Imersiva</p>
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
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-spacing-md md:p-spacing-2xl"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-label="Vídeo Institucional Catedra Digital"
          >
            <motion.div
              ref={modalContainerRef}
              initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-6xl aspect-video bg-black rounded-[32px] overflow-hidden shadow-premium-hover border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              {/* Top Controls Overlay */}
              <div className="absolute top-spacing-0 left-0 right-0 p-spacing-lg flex justify-between items-center z-50 bg-black/60">
                <div className="flex items-center gap-spacing-md">
                  <div className="flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-white/10 rounded-premium border border-white/20">
                    <Icons.Languages className="w-spacing-md h-spacing-md text-white/70" />
                    <select 
                      value={currentLang}
                      onChange={(e) => {
                        const newLang = e.target.value;
                        const previousLang = currentLang;
                        setCurrentLang(newLang);
                        localStorage.setItem('cathedra_video_lang', newLang);
                        trackEvent('video_lang_change', { 
                          from_lang: previousLang,
                          to_lang: newLang 
                        });
                      }}
                      className="bg-transparent text-white text-premium-xs font-bold focus:outline-none cursor-pointer"
                      aria-label="Selecionar idioma das legendas"
                    >
                      {SUBTITLES.map(s => <option key={s.lang} value={s.lang} className="bg-black">{s.label}</option>)}
                    </select>
                  </div>
                  
                  <Button 
                    onClick={toggleMute}
                    className="p-spacing-xs bg-white/10 hover:bg-white/20 rounded-premium-full transition-all border border-white/20"
                    aria-label={isMuted ? "Ativar som" : "Desativar som"}
                  >
                    {isMuted ? <Icons.VolumeX className="w-spacing-md h-spacing-md text-white" /> : <Icons.Volume2 className="w-spacing-md h-spacing-md text-white" />}
                  </Button>
                </div>

                <Button 
                  ref={closeBtnRef}
                  onClick={handleClose}
                  className="p-spacing-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-premium-full transition-all group focus:outline-none focus-visible:ring-4 focus-visible:ring-primary shadow-premium"
                  aria-label="Fechar vídeo de apresentação (Esc)"
                >
                  <Icons.X className="w-spacing-lg h-spacing-lg text-white group-hover:rotate-90 transition-transform duration-300" />
                </Button>
              </div>

              <video
                ref={modalVideoRef}
                src={videoAsset.url}
                autoPlay
                loop
                controls
                playsInline
                tabIndex={0}
                muted={isMuted}
                onPlay={() => trackEvent('video_play')}
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-cover"
              >
                {SUBTITLES.map(s => (
                  <track 
                    key={s.lang}
                    kind="subtitles"
                    src={s.src}
                    srcLang={s.lang}
                    label={s.label}
                    default={currentLang === s.lang}
                  />
                ))}
                Desculpe, seu navegador não suporta vídeos incorporados.
              </video>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default InstitutionalVideoSection;
