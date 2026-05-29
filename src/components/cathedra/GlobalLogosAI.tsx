import React, { useState, useEffect } from 'react';
import LogosAI from './LogosAI';

export const GlobalLogosAI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [type, setType] = useState<'bible' | 'catechism' | 'magisterium'>('bible');

  useEffect(() => {
    const handleOpen = (e: any) => {
      if (e.detail) {
        setPrompt(e.detail.prompt || '');
        setContext(e.detail.context || '');
        if (e.detail.type) setType(e.detail.type);
      }
      setIsOpen(true);
    };

    window.addEventListener('open-logos-ai' as any, handleOpen);
    return () => window.removeEventListener('open-logos-ai' as any, handleOpen);
  }, []);

  return (
    <LogosAI 
      variant="drawer"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      initialQuery={prompt}
      context={context}
      type={type}
    />
  );
};
