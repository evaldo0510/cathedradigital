import { Youtube, Heart, Music, Clock, Handshake, ChevronRight, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { AppRoute } from "@/types";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#fdfcf8] text-[#1a1a1a] overflow-hidden">
      {/* Hero Section */}
      <section className="relative w-full h-[70vh] md:h-[80vh] flex items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=80&w=1920" 
            alt="Cathedral" 
            className="w-full h-full object-cover opacity-20 scale-110 blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#fdfcf8]/0 via-[#fdfcf8]/80 to-[#fdfcf8]" />
        </div>

        <div className="relative z-10 max-w-5xl text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">O Santuário Digital da Fé</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-[#1a1a1a] leading-[1.1]"
          >
            Aprofunde sua <br /> 
            <span className="text-primary italic font-light drop-shadow-sm">Vida Interior.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground font-serif italic"
          >
            "A oração é a elevação da alma a Deus." <br />
            Explore a Bíblia, o Catecismo e a tradição dos santos em uma experiência única.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button size="lg" className="h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20" onClick={() => navigate(AppRoute.DASHBOARD)}>
              Começar Jornada <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-10 rounded-2xl border-primary/20 bg-white/50 backdrop-blur-md font-black uppercase tracking-widest hover:bg-white transition-all" onClick={() => navigate(AppRoute.ABOUT)}>
              Saiba Mais
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Highlights */}
      <section className="w-full max-w-7xl px-6 py-24 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-serif font-bold">Destaques Devocionais</h2>
          <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card className="group border-none bg-white shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden">
            <CardHeader className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                <Music className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl font-serif">Frei Gilson</CardTitle>
              <CardDescription className="text-xs font-medium uppercase tracking-widest text-primary/60">Frei Gilson • Som do Monte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Mensagens do Evangelho através da música e oração profunda, como o Rosário da Madrugada.
              </p>
              <Button className="w-full gap-2 rounded-xl bg-[#ff0000] hover:bg-[#cc0000] text-white font-bold" asChild>
                <a href="https://www.youtube.com/@FreiGilsonSomdoMonte" target="_blank" rel="noopener noreferrer">
                  <Youtube className="h-4 w-4" /> YouTube Oficial
                </a>
              </Button>
              <div className="flex items-center justify-between py-2 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> 4:00 AM
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Heart className="h-3.5 w-3.5 fill-current" /> Evangelização
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group border-none bg-white shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden md:scale-110 z-10 border-t-4 border-primary">
            <CardHeader className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                <BookOpen className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl font-serif">Estudo da Fé</CardTitle>
              <CardDescription className="text-xs font-medium uppercase tracking-widest text-primary/60">Magistério e Tradição</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Acesse a Bíblia Completa, o Catecismo e documentos do Magistério em um só lugar.
              </p>
              <Button className="w-full gap-2 rounded-xl font-bold" onClick={() => navigate(AppRoute.BIBLE)}>
                Explorar Biblioteca
              </Button>
              <p className="text-center italic text-sm text-muted-foreground">
                "Fides quaerens intellectum"
              </p>
            </CardContent>
          </Card>

          <Card className="group border-none bg-white shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden">
            <CardHeader className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                <Handshake className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl font-serif">Comunidade</CardTitle>
              <CardDescription className="text-xs font-medium uppercase tracking-widest text-primary/60">Novas Parcerias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Estamos preparando novidades e parcerias especiais para fortalecer sua caminhada cristã.
              </p>
              <div className="p-4 bg-muted/50 rounded-2xl border border-dashed border-primary/30 text-center">
                <span className="text-sm font-black uppercase tracking-widest text-primary">Em Breve</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer-like Quote */}
      <footer className="w-full py-20 bg-[#1a1a1a] text-[#fdfcf8] text-center px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <p className="text-2xl md:text-3xl font-serif italic leading-relaxed opacity-90">
            "A medida do amor é amar sem medida."
          </p>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">Santo Agostinho</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;