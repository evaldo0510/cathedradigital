/**
 * Bible Recovery Mode — teste automatizado.
 *
 * Abre o capítulo 1 de cada livro do cânone e valida:
 *  - idioma (zero inglês)
 *  - capítulos não vazios
 *  - tempo de abertura abaixo do limite
 *
 * Em ambiente de teste a Edge Function não é chamada de verdade:
 * usamos um mock do supabase client. O objetivo é garantir que o
 * runner e os validadores funcionam de ponta a ponta antes de
 * permitir navegação em produção.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(async (_name: string, { body }: any) => {
        return {
          data: {
            book: body.abbrev,
            chapter: body.chapter,
            verses: [
              { number: 1, text: 'No princípio, criou Deus os céus e a terra.' },
              { number: 2, text: 'A terra, porém, estava sem forma e vazia.' },
            ],
          },
          error: null,
        };
      }),
    },
  },
}));

import { runRecoveryCheck, summarize, getAllBooks, checkBookChapter } from '@/lib/bibleRecoveryRunner';

describe('Bible Recovery Mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('cobre todos os livros do cânone', async () => {
    const rows = await runRecoveryCheck();
    expect(rows.length).toBe(getAllBooks().length);
  });

  it('nenhum capítulo vazio, sem inglês e dentro do tempo limite', async () => {
    const rows = await runRecoveryCheck();
    const sum = summarize(rows);
    expect(sum.empty).toBe(0);
    expect(sum.english).toBe(0);
    expect(sum.error).toBe(0);
    // Todos abaixo de 1500ms (mock é instantâneo)
    rows.forEach((r) => expect(r.openMs).toBeLessThan(1500));
  });

  it('detecta texto em inglês', async () => {
    const mod = await import('@/integrations/supabase/client');
    (mod.supabase.functions.invoke as any).mockResolvedValueOnce({
      data: { verses: [{ number: 1, text: 'In the beginning God created the heaven and the earth.' }] },
      error: null,
    });
    const row = await checkBookChapter(getAllBooks()[0], 1);
    expect(row.result).toBe('INGLÊS');
    expect(row.language).toBe('Inglês');
  });

  it('detecta capítulo vazio', async () => {
    const mod = await import('@/integrations/supabase/client');
    (mod.supabase.functions.invoke as any).mockResolvedValueOnce({
      data: { verses: [] },
      error: null,
    });
    const row = await checkBookChapter(getAllBooks()[0], 1);
    expect(row.result).toBe('VAZIO');
  });
});
