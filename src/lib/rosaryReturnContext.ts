/**
 * Contexto de retorno ao Rosário.
 *
 * Quando o usuário está numa sessão ativa e navega para outra área (ex.: Glossário),
 * marcamos um "breadcrumb" em sessionStorage. Telas de saída (Glossário) leem esse
 * contexto para oferecer um botão "Voltar ao Rosário" que restaura exatamente
 * mistério, dezena e tempo — a restauração em si é feita pelo próprio /rosary
 * via useDevotionalProgress; aqui só carregamos o rótulo humano e o intent.
 *
 * TTL curto (4h) para não poluir sessões futuras.
 */

const KEY = "cathedra:rosary:return";
const TTL_MS = 4 * 60 * 60 * 1000;

export interface RosaryReturnContext {
  setName: string;           // ex.: "Mistérios Gozosos"
  mysteryLabel: string;      // ex.: "3º mistério"
  mysteryIndex: number;      // 0..4
  stepIndex: number;         // passo dentro da sessão
  elapsedMs: number;         // tempo já rezado
  startedAt: string;         // ISO
  updatedAt: string;         // ISO — usado para TTL
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function markRosaryReturn(ctx: Omit<RosaryReturnContext, "updatedAt">): void {
  if (!isBrowser()) return;
  try {
    const payload: RosaryReturnContext = { ...ctx, updatedAt: new Date().toISOString() };
    window.sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch { /* storage indisponível */ }
}

export function getRosaryReturn(): RosaryReturnContext | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RosaryReturnContext;
    if (!parsed?.updatedAt) return null;
    const age = Date.now() - new Date(parsed.updatedAt).getTime();
    if (!Number.isFinite(age) || age > TTL_MS) {
      window.sessionStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearRosaryReturn(): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch { /* noop */ }
}

export function formatElapsedShort(ms: number): string {
  if (!ms || ms < 1000) return "0min";
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin}min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
