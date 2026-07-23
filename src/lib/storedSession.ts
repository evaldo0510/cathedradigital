/**
 * Detecta sinteticamente se há uma sessão do Supabase persistida no
 * localStorage antes do `useAuth` terminar de resolver.
 *
 * Uso: `RootGate` decide, no primeiro frame, entre renderizar a Landing
 * (visitante) ou um placeholder neutro (usuário provavelmente autenticado)
 * — eliminando o "flash" da Landing.
 */
export function hasStoredSupabaseSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (!key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const expiresAt =
          parsed?.expires_at ??
          parsed?.currentSession?.expires_at ??
          parsed?.session?.expires_at;
        if (typeof expiresAt === 'number' && expiresAt * 1000 > Date.now()) {
          return true;
        }
        // Se não temos expires_at legível, ainda assim assume sessão presente
        if (parsed?.access_token || parsed?.currentSession?.access_token) {
          return true;
        }
      } catch {
        /* chave malformada: ignora */
      }
    }
  } catch {
    /* storage bloqueado */
  }
  return false;
}
