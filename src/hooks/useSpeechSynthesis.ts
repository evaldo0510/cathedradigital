import { useState, useCallback, useEffect, useRef } from 'react';
import { Language } from '@/types';

export const useSpeechSynthesis = (lang: Language) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Pre-load voices for better voice selection
  useEffect(() => {
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (window.speechSynthesis.speaking) {
      stop();
      return;
    }

    if (!text) return;

    const textToRead = text.substring(0, 8000); 
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utteranceRef.current = utterance;
    
    const langMap: Record<string, string> = {
      'pt': 'pt-BR',
      'en': 'en-US',
      'es': 'es-ES',
      'la': 'it-IT',
      'it': 'it-IT',
      'fr': 'fr-FR',
      'de': 'de-DE'
    };
    
    const targetLang = langMap[lang] || lang;
    utterance.lang = targetLang;
    
    // Try to find a higher quality voice on the system
    const voices = window.speechSynthesis.getVoices();
    const betterVoice = voices.filter(v => v.lang.startsWith(targetLang.split('-')[0]))
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aScore = (aName.includes('google') ? 10 : 0) + (aName.includes('premium') ? 20 : 0) + (aName.includes('natural') ? 30 : 0) + (aName.includes('enhanced') ? 15 : 0);
        const bScore = (bName.includes('google') ? 10 : 0) + (bName.includes('premium') ? 20 : 0) + (bName.includes('natural') ? 30 : 0) + (bName.includes('enhanced') ? 15 : 0);
        return bScore - aScore;
      })[0];
      
    if (betterVoice) {
      utterance.voice = betterVoice;
    }
    
    utterance.rate = 1.0; 
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, [lang, stop]);

  const toggleSpeakFromElement = useCallback((elementId: string = 'main-content') => {
    const content = document.getElementById(elementId)?.innerText || '';
    speak(content);
  }, [speak]);

  // Sync state with actual synthesis engine
  useEffect(() => {
    const timer = setInterval(() => {
      const isActuallySpeaking = window.speechSynthesis.speaking;
      if (isActuallySpeaking !== isSpeaking) {
        setIsSpeaking(isActuallySpeaking);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [isSpeaking]);

  return { isSpeaking, speak, stop, toggleSpeakFromElement };
};
