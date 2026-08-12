import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { Language } from '@/types';
import { UI_TRANSLATIONS } from '@/services/translations';
import {
  DEFAULT_LOCALE,
  detectLocaleFromPath,
  getLocaleDefinition,
  isSupportedLocale,
  withLocalePath,
} from '@/lib/i18n/locales';

export interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

export const LangContext = createContext<LanguageContextType>({
  lang: DEFAULT_LOCALE,
  setLang: () => {},
  t: (key) => key,
});

/**
 * O idioma é derivado da URL (`/en/...`), que é a fonte de verdade para SEO.
 * O localStorage guarda apenas a preferência para redirecionar o usuário
 * na próxima visita à raiz.
 */
export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Expondo a função t globalmente para testes E2E
    (window as any).cathedra_t = (key: string) => {
      // Esta é uma implementação simplificada para o teste conseguir acessar o contexto
      // No mundo real, poderíamos usar um CustomEvent ou similar se necessário
      return key; 
    };
  }, []);
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const fromPath = detectLocaleFromPath(window.location.pathname);
      if (fromPath !== DEFAULT_LOCALE) return fromPath;
      const stored = localStorage.getItem('cathedra_lang');
      return isSupportedLocale(stored) ? stored : DEFAULT_LOCALE;
    } catch {
      return DEFAULT_LOCALE;
    }
  });

  const t = useCallback((k: string) => {
    const val = UI_TRANSLATIONS[lang]?.[k];
    if (val === undefined) {
      // Fallback para Português se a tradução faltar no idioma atual
      const fallback = UI_TRANSLATIONS[DEFAULT_LOCALE]?.[k];
      if (fallback !== undefined) return fallback;
      
      // Fallback final: Log e retornar a chave formatada para evitar strings vazias
      console.warn(`[i18n] Chave ausente: "${k}" para o idioma "${lang}"`);
      return k;
    }
    return val;
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem('cathedra_lang', lang);
    } catch {
      /* storage indisponível */
    }
    document.documentElement.lang = getLocaleDefinition(lang).hreflang;
  }, [lang]);

  /**
   * Trocar de idioma muda o prefixo da URL. Como o prefixo é o `basename` do
   * router (definido no boot), a navegação é feita com recarga completa —
   * garante estado limpo e URL canônica correta.
   */
  const setLang = useCallback((next: Language) => {
    if (!isSupportedLocale(next)) return;
    setLangState(next);
    try {
      localStorage.setItem('cathedra_lang', next);
      const target =
        withLocalePath(window.location.pathname, next) +
        window.location.search +
        window.location.hash;
      if (target !== window.location.pathname + window.location.search + window.location.hash) {
        window.location.assign(target);
      }
    } catch {
      /* noop */
    }
  }, []);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};
