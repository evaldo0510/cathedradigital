import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/constants";
import { Button } from "@/components/ui/button";
import { AppRoute, Language } from "@/types";
import { useNavigate } from "react-router-dom";
import { Menu, X, ChevronRight, Globe } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import GoogleSignInButton from "../auth/GoogleSignInButton";

const LandingHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const navigate = useNavigate();
  const { lang, setLang } = useLang();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'la', label: 'Latina', flag: '🇻🇦' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  ];
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Funcionalidades", href: "#features" },
    { name: "Como Funciona", href: "#how-it-works" },
    { name: "Depoimentos", href: "#testimonials" },
    { name: "Planos", href: "#pricing" },
    { name: "Sobre", href: AppRoute.ABOUT },
  ];

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(href);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        isScrolled
          ? "py-4 bg-background border-b border-border/5"
          : "py-8 bg-transparent"
      }`}
    >
      <div className="app-container flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate(AppRoute.HOME)}
        >
          <Icons.Logo className="w-10 h-10 transition-transform group-hover:scale-105" variant="gold" />
          <div className="hidden sm:block">
            <h1 className="text-sm font-display font-bold text-foreground tracking-[0.3em] uppercase">CATHEDRA</h1>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavClick(link.href)}
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </button>
          ))}
          
          <div className="relative">
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors focus-visible:ring-1 focus-visible:ring-primary rounded-sm p-1"
                aria-label="Mudar idioma"
                aria-haspopup="true"
                aria-expanded={showLangMenu}
              >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{lang}</span>
            </button>
            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-40 bg-background border border-border rounded-xl shadow-xl overflow-hidden"
                >
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center justify-between ${lang === l.code ? 'text-primary font-bold' : 'text-muted-foreground'}`}
                    >
                      <span>{l.label}</span>
                      <span>{l.flag}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(AppRoute.LOGIN)}
            className="hidden sm:block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
          >
            Entrar
          </button>
          
          <Button
            variant="ghost"
            className={`rounded-full px-6 text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] h-10 shadow-none transition-all ${isScrolled ? 'text-primary' : ''}`}
            onClick={() => navigate(AppRoute.LOGIN)}
          >
            Começar <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-foreground focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="app-container py-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="text-lg font-serif font-bold text-left text-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </button>
              ))}
              <hr className="border-border/10" />
              <Button
                className="w-full h-14 rounded-full font-bold uppercase tracking-widest bg-primary text-primary-foreground transition-all border-none"
                onClick={() => navigate(AppRoute.LOGIN)}
              >
                Iniciar Agora
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default LandingHeader;
