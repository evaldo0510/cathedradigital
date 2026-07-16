/**
 * Token registry — regras de substituição para utilities causais de contraste.
 *
 * Fonte única de verdade compartilhada por:
 *   - scripts/axe-contrast-heatmap.ts (sugestões no relatório)
 *   - scripts/axe-contrast-run.ts     (--autofix)
 *
 * confidence:
 *   'safe'    → substituição segura; pode ser aplicada por --autofix --apply.
 *   'review'  → precisa revisão manual; heatmap sugere, autofix ignora.
 *
 * replacement:
 *   string    → substituir a classe pelo valor.
 *   null      → remover a classe (sem substituto).
 *   undefined → sem sugestão (só listar como suspeita).
 *
 * Cada regra tem `reason` para aparecer no diff/comment.
 */

export type TokenRule = {
  category: 'color' | 'opacity';
  replacement?: string | null;
  reason: string;
  confidence: 'safe' | 'review';
};

export const TOKEN_REGISTRY: Record<string, TokenRule> = {
  // ---------- text-primary com opacidade ----------
  'text-primary/30': {
    category: 'opacity',
    replacement: 'text-primary',
    reason: '1.91:1 < 4.5:1 sobre bg-background; opacidade 30% suprime contraste',
    confidence: 'safe',
  },
  'text-primary/40': {
    category: 'opacity',
    replacement: 'text-primary',
    reason: 'ratio ~2.5:1 < 4.5:1; opacidade 40% suprime contraste',
    confidence: 'safe',
  },
  'text-primary/50': {
    category: 'opacity',
    replacement: 'text-primary/70',
    reason: 'ratio ~3.1:1 < 4.5:1; subir para /70 costuma bastar',
    confidence: 'review',
  },
  'text-primary/60': {
    category: 'opacity',
    replacement: 'text-primary/80',
    reason: 'ratio ~3.7:1 < 4.5:1; /80 costuma passar',
    confidence: 'review',
  },

  // ---------- text-muted-foreground ----------
  'text-muted-foreground/60': {
    category: 'opacity',
    replacement: 'text-muted-foreground',
    reason: '1.53:1 < 4.5:1; opacidade sobre muted-foreground quebra AA',
    confidence: 'safe',
  },
  'text-muted-foreground/70': {
    category: 'opacity',
    replacement: 'text-muted-foreground',
    reason: 'ratio abaixo de 4.5:1; remover opacidade',
    confidence: 'safe',
  },
  'text-muted-foreground/80': {
    category: 'opacity',
    replacement: 'text-muted-foreground',
    reason: 'levemente abaixo de AA em alguns temas; padronizar sem opacidade',
    confidence: 'review',
  },

  // ---------- text-secondary com opacidade ----------
  'text-secondary/60': {
    category: 'opacity',
    replacement: 'text-secondary',
    reason: 'ratio < AA; remover opacidade',
    confidence: 'safe',
  },
  'text-secondary/70': {
    category: 'opacity',
    replacement: 'text-secondary',
    reason: 'ratio < AA em bg claro; remover opacidade',
    confidence: 'safe',
  },

  // ---------- opacity-* em blocos com texto ----------
  // OBS: só é seguro remover quando axe apontou o elemento como falho
  // (autofix confirma isso pelo mapeamento heatmap→src). Em <img>/ícones
  // deve permanecer, por isso 'review'.
  'opacity-60': {
    category: 'opacity',
    replacement: null,
    reason: 'opacity-60 sobre texto derruba contraste; remover se afetar texto',
    confidence: 'review',
  },
  'opacity-70': {
    category: 'opacity',
    replacement: null,
    reason: 'opacity-70 sobre texto pode derrubar contraste; validar antes',
    confidence: 'review',
  },
  'opacity-40': {
    category: 'opacity',
    replacement: null,
    reason: 'opacity-40 herdada afeta filhos com texto; revisar caso a caso',
    confidence: 'review',
  },
  'opacity-50': {
    category: 'opacity',
    replacement: null,
    reason: 'opacity-50 herdada afeta filhos com texto; revisar',
    confidence: 'review',
  },

  // ---------- pares cor+bg fixos problemáticos ----------
  'text-amber-800': {
    category: 'color',
    replacement: 'text-amber-900',
    reason: 'sobre bg-secondary falha AA; amber-900 costuma passar',
    confidence: 'review',
  },

  // ---------- text-muted-foreground bare em bg específico ----------
  // Aqui não substituímos a classe (é o token correto); requer inspecionar
  // o bg do parent. Marcado apenas para diagnóstico.
  'text-muted-foreground': {
    category: 'color',
    reason: 'muted-foreground pode falhar sobre bg-muted ou gradientes; checar bg do container',
    confidence: 'review',
  },
};

export function ruleFor(cls: string): TokenRule | undefined {
  return TOKEN_REGISTRY[cls];
}

export function isSafeAutofix(cls: string): boolean {
  const r = TOKEN_REGISTRY[cls];
  return !!r && r.confidence === 'safe' && r.replacement !== undefined;
}
