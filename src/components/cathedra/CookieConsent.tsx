import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLang } from '@/hooks/useLang';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { lang } = useLang();

  useEffect(() => {
    const consent = localStorage.getItem('cathedra_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cathedra_cookie_consent', 'true');
    setIsVisible(false);
  };

  const texts = {
    pt: {
      message: "Utilizamos cookies para personalizar sua experiência e analisar nosso tráfego. Ao continuar, você concorda com nossa política.",
      accept: "Aceitar",
      policy: "Política de Privacidade"
    },
    en: {
      message: "We use cookies to personalize your experience and analyze our traffic. By continuing, you agree to our policy.",
      accept: "Accept",
      policy: "Privacy Policy"
    }
  };

  const t = texts[lang as keyof typeof texts] || texts.en;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-md left-md right-md md:left-auto md:right-xl md:w-[400px] z-[300] bg-background  border border-border p-lg rounded-full shadow-premium-hover"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.message}
            </p>
            <div className="flex items-center gap-md">
              <Button 
                onClick={handleAccept}
                className="flex-1 rounded-full font-black uppercase tracking-widest text-premium-tiny h-xl"
              >
                {t.accept}
              </Button>
              <Button className="text-premium-tiny font-black uppercase tracking-widest text-primary hover:underline">
                {t.policy}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;