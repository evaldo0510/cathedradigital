import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/constants";
import { Button } from "@/components/ui/button";
import { AppRoute, Language } from "@/types";
import { useNavigate } from "react-router-dom";
import { Globe, ShieldCheck, Menu, ChevronRight } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { HomeButton } from "../cathedra/HomeButton";

const LandingHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const navigate = useNavigate();
  const { lang, setLang } = useLang();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'la', label: 'Latina', flag: 'Vaticano' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Bíblia", href: AppRoute.BIBLE },
    { name: "Catecismo", href: AppRoute.CATECHISM },
    { name: "Logos", href: AppRoute.LOGOS },
  ];

  const handleOpenSidebar = () => {
    window.dispatchEvent(new CustomEvent('open-sidebar'));
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-1000 ${
        isScrolled
          ? "py-4 bg-background/60 backdrop-blur-3xl border-b border-border/5"
          : "py-6 bg-transparent"
      }`}
    >
      <div className="app-container flex items-center justify-between">
        <Link 
          to={AppRoute.HOME}
          className="flex items-center gap-4 cursor-pointer group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full p-1 transition-shadow"
          aria-label="Cathedra - Página Inicial"
        >
          <Icons.Logo className="w-10 h-10 md:w-12 md:h-12 transition-all duration-1000 group-hover:scale-105" variant="gold" />
          <div className="hidden sm:flex flex-col">
            <h2 className="text-lg md:text-xl font-display font-medium text-primary tracking-[0.4em] uppercase leading-none">CATHEDRA</h2>
            <span className="text-[7px] font-black uppercase tracking-[0.5em] text-secondary/70 mt-1">Digital Sanctuarium</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Button
              key={link.name}
              variant="ghost"
              size="sm"
              onClick={() => navigate(link.href)}
              className="h-auto py-1 px-2 text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors relative group shadow-none"
              type="button"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Button>
          ))}
          
          <div className="relative">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors shadow-none"
              aria-label="Mudar idioma"
              aria-haspopup="true"
              aria-expanded={showLangMenu}
              type="button"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase">{lang}</span>
            </Button>
            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-40 bg-background/90 backdrop-blur-xl border border-border rounded-2xl shadow-premium-hover overflow-hidden p-1"
                >
                  {languages.map((l) => (
                    <Button
                      key={l.code}
                      variant="ghost"
                      size="sm"
                      onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                      className={`w-full px-4 py-2 justify-between text-[10px] font-medium tracking-normal shadow-none hover:bg-primary/5 rounded-xl ${lang === l.code ? 'text-primary bg-primary/5' : 'text-muted-foreground'}`}
                      type="button"
                    >
                      <span>{l.label}</span>
                    </Button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.dispatchEvent(new CustomEvent('open-a11y-settings'))}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full text-muted-foreground/40 hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Configurações de acessibilidade"
          >
            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoute.LOGIN)}
            className="hidden sm:flex text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 hover:text-primary transition-colors shadow-none"
            aria-label="Ir para página de login"
            type="button"
          >
            Entrar
          </Button>
          
          <HomeButton
            variant="ghost"
            size="sm"
            className={`hidden xs:flex rounded-full px-4 sm:px-6 shadow-none transition-all text-[9px] font-black uppercase tracking-widest ${isScrolled ? 'text-primary' : ''}`}
            onClick={() => navigate(AppRoute.LOGIN)}
          >
            Começar <ChevronRight className="w-3 h-3 ml-1" />
          </HomeButton>

          {/* Unified Menu Toggle for Tablet/Desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="md:flex hidden w-10 h-10 rounded-full hover:bg-primary/5"
            onClick={handleOpenSidebar}
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5 opacity-40" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;