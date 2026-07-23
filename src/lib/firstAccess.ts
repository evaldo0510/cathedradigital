/**
 * Controle de primeiro acesso.
 * Marca por usuário para nunca reexibir a tela de boas-vindas.
 */
const PREFIX = 'cathedra_first_access_seen:';

export function hasSeenFirstAccess(userId: string | null | undefined): boolean {
  if (!userId) return true;
  try {
    return localStorage.getItem(PREFIX + userId) === '1';
  } catch {
    return true;
  }
}

export function markFirstAccessSeen(userId: string | null | undefined): void {
  if (!userId) return;
  try {
    localStorage.setItem(PREFIX + userId, '1');
  } catch {
    /* noop */
  }
}
