import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { SOCIAL_LINKS } from '@/config/site-config';
import { trackEvent } from '@/lib/analytics';

const WhatsAppButton = () => {
  const message = encodeURIComponent('Olá! Gostaria de saber mais sobre o Cathedra.');
  const url = `${SOCIAL_LINKS.WHATSAPP}?text=${message}`;

  return (
    <motion.a
      href={url}
      onClick={() => trackEvent('social_link_click', { platform: 'WhatsApp', url })}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-lg left-lg z-[200] w-2xl h-2xl bg-background border border-border text-foreground rounded-full flex items-center justify-center shadow-premium-hover group"
    >
      <MessageCircle className="w-lg h-lg" />
      <span className="absolute left-3xl bg-background border border-border px-sm py-2xs rounded-full text-xs font-black uppercase tracking-widest text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-premium-hover pointer-events-none">
        Fale conosco
      </span>
    </motion.a>
  );
};

export default WhatsAppButton;