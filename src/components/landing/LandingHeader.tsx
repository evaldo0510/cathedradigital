import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/constants";
import { Button } from "@/components/ui/button";
import { AppRoute, Language } from "@/types";
import { useNavigate } from "react-router-dom";
import { Menu, X, ChevronRight, Globe, ShieldCheck } from "lucide-react";
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
    { name: "Bíblia", href: AppRoute.BIBLE },
    { name: "Catecismo", href: AppRoute.CATECHISM },
    { name: "Magistério", href: AppRoute.MAGISTERIUM },
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
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-1000 ${
        isScrolled
          ? "py-spacing-lg bg-background/80 backdrop-blur-3xl border-b border-border/5"
          : "py-spacing-xl bg-transparent"
      }`}
    >
      <div className="app-container flex items-center justify-between">
        <Link 
          to={AppRoute.HOME}
          className="flex items-center gap-spacing-md cursor-pointer group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full p-spacing-2xs transition-shadow"
          aria-label="Cathedra - Página Inicial"
        >
          <Icons.Logo className="w-spacing-2xl h-spacing-2xl transition-all duration-1000 group-hover:scale-105" variant="gold" />
          <div className="hidden sm:flex flex-col">
            <h2 className="text-xl font-display font-medium text-primary tracking-[0.4em] uppercase leading-none">CATHEDRA</h2>
            <span className="text-[8px] font-black uppercase tracking-[0.6em] text-secondary/70 mt-spacing-2xs">Digital Sanctuarium</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-spacing-lg">
          {navLinks.map((link) => (
            <Button
              key={link.name}
              variant="ghost"
              size="sm"
              onClick={() => handleNavClick(link.href)}
              className="h-auto py-spacing-2xs px-spacing-xs text-premium-small font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors relative group shadow-none"
              type="button"
            >
              {link.name}
              <span className="absolute -bottom-spacing-2xs left-0 w-0 h-spacing-3xs bg-primary transition-all group-hover:w-full" />
            </Button>
          ))}
          
          <div className="relative">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-spacing-xs text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors shadow-none"
              aria-label="Mudar idioma"
              aria-haspopup="true"
              aria-expanded={showLangMenu}
              type="button"
            >
              <Globe className="w-spacing-md h-spacing-md" />
              <span className="uppercase">{lang}</span>
            </Button>
            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-spacing-xs w-spacing-4xl bg-background border border-border rounded-full shadow-premium-hover overflow-hidden"
                >
                  {languages.map((l) => (
                    <Button
                      key={l.code}
                      variant="ghost"
                      size="sm"
                      onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                      className={`w-full px-spacing-md py-spacing-xs justify-between font-normal tracking-normal shadow-none ${lang === l.code ? 'text-primary font-bold' : 'text-muted-foreground'}`}
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

        <div className="flex items-center gap-spacing-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.dispatchEvent(new CustomEvent('open-a11y-settings'))}
            className="w-spacing-xl h-spacing-xl rounded-full text-muted-foreground hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Configurações de acessibilidade"
          >
            <ShieldCheck className="w-spacing-md h-spacing-md" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoute.LOGIN)}
            className="hidden sm:flex text-premium-small font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors shadow-none"
            aria-label="Ir para página de login"
            type="button"
          >
            Entrar
          </Button>
          
          <HomeButton
            variant="ghost"
            size="sm"
            className={`hidden xs:flex rounded-full px-spacing-md sm:px-spacing-lg shadow-none transition-all ${isScrolled ? 'text-primary' : ''}`}
            onClick={() => navigate(AppRoute.LOGIN)}
          >
            Começar <ChevronRight className="w-spacing-md h-spacing-md ml-spacing-2xs" />
          </HomeButton>

          {/* Mobile Menu Toggle - Hidden when BottomNav is likely present */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hidden md:flex" // Show on tablet, hide on small mobile where BottomNav exists
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
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
            <div className="app-container py-spacing-xl flex flex-col gap-spacing-lg">
              {navLinks.map((link) => (
                <Button
                  key={link.name}
                  variant="ghost"
                  onClick={() => handleNavClick(link.href)}
                  className="text-lg font-serif font-bold text-left text-foreground hover:text-primary transition-colors outline-none focus:text-primary justify-start h-auto px-0"
                >
                  {link.name}
                </Button>
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