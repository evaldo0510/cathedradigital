/**
 * ThemeAdapterMock — Fase 4A.
 * Origem única: ThemeRegistry (Core). O adapter apenas projeta o
 * ThemeDescriptor no formato ThemeEntry esperado pelo componente.
 */

import type { ThemeAdapter } from '../types';
import { ThemeRegistry } from '@/core/navigation';

export const ThemeAdapterMock: ThemeAdapter = {
  async getFeatured() {
    return ThemeRegistry.featured(6).map((t) => ({
      slug: t.slug,
      label: t.label,
      short: t.short,
    }));
  },
};
