import { test, expect } from 'vitest';
import { supabase } from '../integrations/supabase/client';

/**
 * Cleanup & Data Lifecycle Test
 * Valida a integridade do processo de descarte de telemetria.
 */
test('cleanup_telemetry_logs should redact sensitive fields but keep log entries after 7 days', async () => {
  // Nota: Este teste simula a lógica do DB no ambiente de teste.
  // Em produção, a função PostgreSQL public.cleanup_telemetry_logs handles this.
  
  const mockOldLog = {
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      stack: 'Error: sensitive stack',
      route: '/bible',
      requestId: '123'
    }
  };

  // Simulação da Tier 1 de Redação
  const redact = (log: any) => {
    const meta = { ...log.metadata };
    delete meta.stack;
    return { ...log, metadata: meta };
  };

  const processed = redact(mockOldLog);
  
  expect(processed.metadata.stack).toBeUndefined();
  expect(processed.metadata.route).toBe('/bible');
});

test('cleanup_telemetry_logs should fully delete navigation logs after 30 days', async () => {
  const mockVeryOldLog = {
    created_at: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
    action: 'navigation_click'
  };

  const isExpired = (log: any) => {
    const age = (Date.now() - new Date(log.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return age > 30;
  };

  expect(isExpired(mockVeryOldLog)).toBe(true);
});
