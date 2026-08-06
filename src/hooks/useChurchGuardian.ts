import { useChurchContext } from './useChurchContext';

/**
 * Hook centralizado para monitorar se a plataforma está consumindo a Fonte Única de Verdade (SSoT).
 * Usado pelo Guardian para garantir que P0 não falhe.
 */
export function useChurchGuardian() {
  const context = useChurchContext();

  // Auditoria em tempo real para dev/logs
  if (context.isToday && !context.isLoading) {
    if (!context.currentPope) {
      console.error('[GUARDIAN] P0: Papa atual não identificado na Fonte Única!');
    }
    if (!context.todaySaint) {
      console.warn('[GUARDIAN] Santo do dia não identificado. Verificando fallback...');
    }
  }

  return context;
}
