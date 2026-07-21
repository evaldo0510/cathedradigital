/**
 * LiturgyProvider — contrato único da camada de dados da Liturgia.
 *
 * Isola quem entrega leituras/calendário de quem consome (hooks, páginas,
 * módulos). Trocar a fonte oficial (Vaticano, CNBB, in adiutorium, etc.)
 * significa registrar outra implementação — sem tocar em UI.
 */

export type LiturgicalColorToken =
  | 'liturgical-green'
  | 'liturgical-white'
  | 'liturgical-red'
  | 'liturgical-violet'
  | 'liturgical-rose'
  | 'liturgical-black';

export interface Reading {
  referencia: string;
  titulo: string;
  texto: string;
}

export interface Psalm {
  referencia: string;
  refrao: string;
  texto: string;
}

export interface DailyLiturgy {
  /** Data ISO YYYY-MM-DD (chave estável independente de timezone da UI). */
  isoDate: string;
  /** Data crua vinda do provedor (pode ser localizada). */
  data: string;
  /** Nome/celebração do dia (ex.: "22ª Semana do Tempo Comum"). */
  liturgia: string;
  /** Cor litúrgica em português (verde, branco, vermelho, roxo, rosa, preto). */
  cor: string;
  /** Token de cor mapeado para o design system. */
  colorToken: LiturgicalColorToken;
  /** Descrição do dia (ex.: "Sexta-feira da 22ª semana"). */
  dia: string;
  /** Tempo litúrgico (Advento, Natal, Quaresma, Tempo Comum, etc.), quando disponível. */
  season?: string | null;
  primeiraLeitura?: Reading | null;
  salmo?: Psalm | null;
  segundaLeitura?: Reading | null;
  evangelho?: Reading | null;
}

export interface LiturgyProvider {
  /** Identificador estável — usado para logs, métricas e debug. */
  readonly id: string;
  /** Rótulo humano do provedor (ex.: "In Adiutorium (railway)"). */
  readonly label: string;
  /** Retorna a liturgia completa de um dia. */
  getDayLiturgy(date: Date): Promise<DailyLiturgy>;
}

// ──────────────────────────────────────────────────────────────────────────
// Registro global (singleton simples, sem DI framework)
// ──────────────────────────────────────────────────────────────────────────

let current: LiturgyProvider | null = null;

export function registerLiturgyProvider(provider: LiturgyProvider): void {
  current = provider;
}

export function getLiturgyProvider(): LiturgyProvider {
  if (!current) {
    throw new Error(
      '[LiturgyProvider] Nenhum provider registrado. Chame registerLiturgyProvider() em src/main.tsx.',
    );
  }
  return current;
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers de normalização
// ──────────────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, LiturgicalColorToken> = {
  verde: 'liturgical-green',
  green: 'liturgical-green',
  branco: 'liturgical-white',
  branca: 'liturgical-white',
  white: 'liturgical-white',
  vermelho: 'liturgical-red',
  vermelha: 'liturgical-red',
  red: 'liturgical-red',
  roxo: 'liturgical-violet',
  roxa: 'liturgical-violet',
  violeta: 'liturgical-violet',
  violet: 'liturgical-violet',
  purple: 'liturgical-violet',
  rosa: 'liturgical-rose',
  rose: 'liturgical-rose',
  pink: 'liturgical-rose',
  preto: 'liturgical-black',
  preta: 'liturgical-black',
  black: 'liturgical-black',
};

export function normalizeColorToken(cor: string | null | undefined): LiturgicalColorToken {
  if (!cor) return 'liturgical-green';
  const key = cor.trim().toLowerCase();
  return COLOR_MAP[key] ?? 'liturgical-green';
}

/**
 * Deriva o tempo litúrgico a partir do texto do dia quando o provedor não
 * o expõe explicitamente. Heurística leve — precisa apenas de uma pista.
 */
export function inferSeason(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = input.toLowerCase();
  if (s.includes('advento')) return 'Advento';
  if (s.includes('natal')) return 'Natal';
  if (s.includes('quaresma')) return 'Quaresma';
  if (s.includes('tríduo') || s.includes('triduo')) return 'Tríduo Pascal';
  if (s.includes('páscoa') || s.includes('pascoa')) return 'Tempo Pascal';
  if (s.includes('tempo comum')) return 'Tempo Comum';
  return null;
}

/** Chave ISO YYYY-MM-DD em timezone local (evita divergência de UTC). */
export function toIsoDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
