import { motion } from "framer-motion";
import { Heart, Youtube, MessageSquare, BookOpen, Music, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppRoute } from "@/types";
import { buttonHover } from "./animations";

const Logo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

interface LandingFooterProps {
  onNavigate: (route: string) => void;
  onStart: () => void;
}

const LandingFooter = ({ onNavigate, onStart }: LandingFooterProps) => (
  <>
    {/* Social Proof */}
    <section className="w-full py-20 px-6 bg-card border-y border-border/20">
      <div className="max-w-5xl mx-auto text-center space-y-12">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Inspirado por e em sintonia com</p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          {[
            { icon: <Music className="w-8 h-8" />, name: "Som do Monte" },
            { icon: <BookOpen className="w-8 h-8" />, name: "Vatican News" },
            { icon: <Heart className="w-8 h-8" />, name: "Caritas" },
          ].map((p) => (
            <motion.div key={p.name} whileHover={{ scale: 1.1, opacity: 1 }} className="flex flex-col items-center gap-2">
              {p.icon}
              <span className="font-serif font-bold">{p.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="w-full bg-foreground text-background pt-20 pb-10 px-6 border-t border-background/5">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4 pb-16 border-b border-white/5">
          <Logo className="w-10 h-10 mx-auto text-primary opacity-70" />
          <p className="text-2xl md:text-4xl font-serif italic leading-relaxed opacity-80 max-w-2xl mx-auto">"A medida do amor é amar sem medida."</p>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Santo Agostinho</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2 md:col-span-1 space-y-5">
            <div className="flex items-center gap-3">
              <Logo className="w-8 h-8 text-primary" />
              <div>
                <h3 className="text-lg font-display font-bold tracking-tight">CATHEDRA</h3>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Digital Sanctuarium</p>
              </div>
            </div>
            <p className="text-sm opacity-40 leading-relaxed">Plataforma dedicada ao estudo, oração e vivência da fé católica, unindo tradição e tecnologia.</p>
            <div className="flex gap-3">
              {[
                { href: "https://instagram.com", icon: <Heart className="w-4 h-4" /> },
                { href: "https://youtube.com", icon: <Youtube className="w-4 h-4" /> },
                { href: "https://wa.me", icon: <MessageSquare className="w-4 h-4" /> },
              ].map((s) => (
                <motion.a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }} className="p-2.5 rounded-xl bg-white/5 border border-white/10 opacity-40 hover:opacity-100 hover:text-primary hover:border-primary/30 transition-colors">
                  {s.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {[
            { title: "Explorar", items: [{ label: "Bíblia Sagrada", route: AppRoute.BIBLE }, { label: "Catecismo", route: AppRoute.CATECHISM }, { label: "Vidas dos Santos", route: AppRoute.SAINTS }, { label: "Liturgia Diária", route: AppRoute.DAILY_LITURGY }, { label: "Rosário", route: AppRoute.ROSARY }] },
            { title: "🏛️ Santa Sé", items: [{ label: "Vatican.va", url: "https://www.vatican.va" }, { label: "Vatican News", url: "https://www.vaticannews.va/pt.html" }, { label: "Catecismo Oficial", url: "https://www.vatican.va/archive/ccc/index_po.htm" }, { label: "CNBB", url: "https://www.cnbb.org.br" }] },
            { title: "Institucional", items: [{ label: "Sobre o Projeto", route: AppRoute.ABOUT }, { label: "Criar Conta", route: AppRoute.LOGIN }, { label: "Termos de Uso", route: AppRoute.TERMS }, { label: "Privacidade", route: AppRoute.PRIVACY }] },
          ].map((col) => (
            <div key={col.title} className="space-y-5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{col.title}</h4>
              <ul className="space-y-3">
                {col.items.map((item: any) => (
                  <li key={item.label}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2 group">
                        <span className="w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                        {item.label}
                      </a>
                    ) : (
                      <button onClick={() => onNavigate(item.route)} className="text-sm opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2 group">
                        <span className="w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                        {item.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-20">© {new Date().getFullYear()} CATHEDRA • OMNIA AD MAIOREM DEI GLORIAM</p>
          <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
            <Button size="sm" variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10" onClick={onStart}>
              Entrar na Plataforma <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </motion.div>
        </div>
      </div>
    </footer>
  </>
);

export default LandingFooter;
