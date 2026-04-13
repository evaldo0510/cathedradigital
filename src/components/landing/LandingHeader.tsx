import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/constants";
import { Button } from "@/components/ui/button";
import { AppRoute } from "@/types";
import { useNavigate } from "react-router-dom";
import { Menu, X, ChevronRight } from "lucide-react";

const LandingHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

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
    { name: "Planos", href: AppRoute.PRICING },
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
          ? "py-3 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
          : "py-6 bg-transparent"
      }`}
    >
      <div className="container px-6 mx-auto flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate(AppRoute.HOME)}
        >
          <Icons.Logo className="w-10 h-10 transition-transform group-hover:scale-110" variant="blue" />
          <div className="hidden sm:block">
            <h1 className="text-xl font-serif font-bold text-foreground tracking-tight">CATHEDRA</h1>
            <p className="text-[8px] font-black uppercase text-primary tracking-[0.2em]">Digital Sanctuarium</p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavClick(link.href)}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="hidden sm:flex text-sm font-bold uppercase tracking-widest px-6"
            onClick={() => navigate(AppRoute.LOGIN)}
          >
            Entrar
          </Button>
          <Button
            className="rounded-full px-6 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] h-11 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            onClick={() => navigate(AppRoute.LOGIN)}
          >
            Começar <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
            <div className="container px-6 py-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="text-lg font-serif font-bold text-left text-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </button>
              ))}
              <hr className="border-border" />
              <Button
                variant="outline"
                className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest"
                onClick={() => navigate(AppRoute.LOGIN)}
              >
                Fazer Login
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default LandingHeader;
