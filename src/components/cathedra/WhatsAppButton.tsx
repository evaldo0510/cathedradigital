import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const whatsappNumber = '5511999999999'; // Exemplo
  const message = encodeURIComponent('Olá! Gostaria de saber mais sobre o Cathedra.');
  const url = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 left-6 z-[200] w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#25D366]/30 group"
    >
      <MessageCircle className="w-7 h-7" />
      <span className="absolute left-16 bg-background border border-border px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none">
        Fale conosco
      </span>
    </motion.a>
  );
};

export default WhatsAppButton;