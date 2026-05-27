import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { Language } from '@/types';
import { UI_TRANSLATIONS } from '@/services/translations';

export interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

export const LangContext = createContext<LanguageContextType>({
  lang: 'pt',
  setLang: () => {},
  t: (key) => key,
});

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('cathedra_lang');
      return (stored as Language) || 'pt';
    } catch {
      return 'pt';
    }
  });

  const t = useCallback((k: string) => UI_TRANSLATIONS[lang]?.[k] || k, [lang]);

  useEffect(() => {
    localStorage.setItem('cathedra_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LangContext.Provider value={value}>
      {children}
    </LangContext.Provider>
  );
};
