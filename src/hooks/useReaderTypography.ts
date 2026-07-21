/**
 * useReaderTypography — preferências de conforto de leitura persistidas.
 * Três presets (compact | normal | large) combinando fator de zoom + line-height.
 * Persistência: localStorage (funciona offline, cross-session).
 */
import { useCallback, useEffect, useState } from 'react';

export type ReaderDensity = 'compact' | 'normal' | 'large';

const STORAGE_KEY = 'cathedra:reader-density';

const PRESETS: Record<ReaderDensity, { zoom: number; lineHeight: number; label: string }> = {
  compact: { zoom: 0.92, lineHeight: 1.45, label: 'Compacto' },
  normal:  { zoom: 1.0,  lineHeight: 1.65, label: 'Normal'   },
  large:   { zoom: 1.15, lineHeight: 1.85, label: 'Amplo'    },
};

function readStored(): ReaderDensity {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'compact' || v === 'normal' || v === 'large') return v;
  } catch { /* silent */ }
  return 'normal';
}

export function useReaderTypography() {
  const [density, setDensityState] = useState<ReaderDensity>(readStored);

  const setDensity = useCallback((d: ReaderDensity) => {
    setDensityState(d);
    try { localStorage.setItem(STORAGE_KEY, d); } catch { /* silent */ }
  }, []);

  // Sincroniza entre abas.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) setDensityState(readStored());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const preset = PRESETS[density];
  const wrapperStyle: React.CSSProperties = {
    // `zoom` escala fonte e espaçamento proporcionalmente — cobrindo padding,
    // gaps e imagens. Suportado em todos os navegadores modernos.
    zoom: preset.zoom,
    // Custom property consumida por seletores escopados dentro do wrapper.
    ['--reader-line-height' as any]: String(preset.lineHeight),
  };

  return { density, setDensity, wrapperStyle, presets: PRESETS };
}
