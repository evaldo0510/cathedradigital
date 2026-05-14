import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/constants";
import { Button } from "@/components/ui/button";
import { AppRoute, Language } from "@/types";
import { useNavigate } from "react-router-dom";
import { Menu, X, ChevronRight, Globe } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { HomeButton } from "../cathedra/HomeButton";

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
          className="flex items-center gap-3 cursor-pointer group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full p-1 transition-shadow"
          onClick={() => navigate(AppRoute.HOME)}
          onKeyDown={(e) => e.key === 'Enter' && navigate(AppRoute.HOME)}
          tabIndex={0}
          role="button"
          aria-label="Cathedra - Página Inicial"
        >
          <Icons.Logo className="w-10 h-10 md:w-12 md:h-12 transition-transform group-hover:scale-105" variant="gold" />
          <div className="hidden sm:block">
            <h1 className="text-sm font-display font-bold text-foreground tracking-[0.3em] uppercase">CATHEDRA</h1>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Button
              key={link.name}
              variant="ghost"
              size="sm"
              onClick={() => handleNavClick(link.href)}
              className="h-auto py-1 px-2 text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors relative group shadow-none"
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
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors shadow-none"
              aria-label="Mudar idioma"
              aria-haspopup="true"
              aria-expanded={showLangMenu}
              type="button"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{lang}</span>
            </Button>
            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-40 bg-background border border-border rounded-full shadow-xl overflow-hidden"
                >
                  {languages.map((l) => (
                    <Button
                      key={l.code}
                      variant="ghost"
                      size="sm"
                      onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                      className={`w-full px-4 py-2.5 justify-between font-normal tracking-normal shadow-none ${lang === l.code ? 'text-primary font-bold' : 'text-muted-foreground'}`}
                      type="button"
                    >
                      <span>{l.label}</span>
                      <span>{l.flag}</span>
                    </Button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(AppRoute.LOGIN)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(AppRoute.LOGIN);
              }
            }}
            className="hidden sm:flex text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none rounded-sm p-1"
            aria-label="Ir para página de login"
            type="button"
          >
            Entrar
          </button>
          
          <HomeButton
            variant="ghost"
            size="sm"
            className={`hidden xs:flex rounded-full px-4 sm:px-6 shadow-none transition-all ${isScrolled ? 'text-primary' : ''}`}
            onClick={() => navigate(AppRoute.LOGIN)}
          >
            Começar <ChevronRight className="w-4 h-4 ml-1" />
          </HomeButton>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-foreground focus-visible:ring-2 focus-visible:ring-primary rounded-full"
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNavClick(link.href);
                    }
                  }}
                  className="text-lg font-serif font-bold text-left text-foreground hover:text-primary transition-colors outline-none focus:text-primary"
                  type="button"
                >
                  {link.name}
                </button>
              ))}
              <hr className="border-border/10" />
              <HomeButton
                className="w-full"
                onClick={() => navigate(AppRoute.LOGIN)}
              >
                Iniciar Agora
              </HomeButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default LandingHeader;
