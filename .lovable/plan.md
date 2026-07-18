# Sprint 2 (Revisada) — Continuation Engine

Aprovadas as duas mudanças estratégicas. Reorganizo a Sprint 2 em torno de um **Continuation Engine** próprio, em pipeline, separado do Knowledge Engine.

---

## Princípios arquiteturais

1. **Knowledge Engine** = fonte da verdade sobre relações. Devolve apenas `ResolvedNode[]`. Não conhece UX, não conhece CTA, não conhece intent.
2. **Continuation Engine** = decide o próximo passo e como apresentá-lo. Transforma nós em `ContinuationSuggestion[]`.
3. **ReaderContinuation** = componente puramente visual. Recebe sugestões prontas e renderiza.

---

## Fase 0 — Continuation Engine (novo módulo)

Criar `src/core/continuation/` isolado do Knowledge Engine:

```text
src/core/continuation/
  types.ts               → ContinuationContext, ContinuationCandidate, ContinuationSuggestion, Intent
  ContinuationEngine.ts  → orquestra o pipeline
  resolveContext.ts      → normaliza entrada do Reader (kind, ids, temas, litúrgico, usuário)
  findCandidates.ts      → chama KnowledgeGraph e devolve ResolvedNode[]
  scoreCandidates.ts     → aplica pesos e devolve { score, confidence, reasons[] }
  chooseSuggestions.ts   → diversifica por intent, aplica presets, limita N
  presets.ts             → ícones, títulos, copy editorial por kind + intent
  fallback.ts            → sugestões estáticas da Sprint 1 (segurança)
  telemetry.ts           → shown / clicked / dismissed
  index.ts               → barrel export
```

Pipeline:

```text
Reader
  ↓
ContinuationEngine.run(context)
  ↓
resolveContext()      → ContinuationContext normalizado
  ↓
findCandidates()      → ResolvedNode[]  (via KnowledgeGraph)
  ↓
scoreCandidates()     → ScoredCandidate[] { score, confidence, reasons[] }
  ↓
chooseSuggestions()   → ContinuationSuggestion[] (diversificado por intent)
  ↓
ReaderContinuation    (render puro)
```

Cada etapa é uma função pura, pequena e testável isoladamente.

---

## Ajustes ao contrato

### Substituir `weight` por objeto explicativo

```ts
type ScoredCandidate = {
  node: ResolvedNode;
  score: number;              // 0–100
  confidence: 'low' | 'medium' | 'high';
  reasons: string[];          // ex: ["mesmo tema", "mesma passagem", "mesma jornada"]
};
```

Habilita debug, tooltips futuros ("por que esta sugestão?") e auditoria de qualidade.

### Intents (adicionar `celebrate`)

```text
study → deepen → meet → pray → apply → celebrate
```

`celebrate` cobre Natal, Páscoa, Pentecostes, Corpus Christi, santos do dia, festas litúrgicas. Ativado quando `resolveContext` detectar tempo/festa litúrgica relevante.

### Telemetria (adicionar `dismissed`)

Eventos:

- `continuation_shown`   → source (graph/fallback), intents, position, count
- `continuation_click`   → intent, node id, score, confidence, position
- `continuation_dismissed` → sinaliza rejeição implícita (scroll além, next passagem sem clicar)

Permite responder: "o usuário ignorou todas as sugestões?" — insumo para evolução do scorer.

---

## Ordem de execução

```text
0  — Continuation Engine (esqueleto + types + fallback plugado)
1  — resolveContext (kind, ids, temas, litúrgico, usuário)
2  — findCandidates + scoreCandidates + chooseSuggestions
3  — Presets editoriais (ícones, títulos, copy por kind × intent)
4  — Integração no Catecismo
5  — Integração na Bíblia
6  — Integração no Magistério
7  — Integração em Santos
8  — Integração na Jornada
9  — Telemetria (shown / click / dismissed)
10 — Testes unitários (pipeline puro) + E2E (fluxos-chave)
```

Zero regressão em cada etapa: fallback da Sprint 1 permanece ativo até o pipeline devolver ≥1 sugestão com `confidence ≥ medium`.

---

## O que muda vs. plano anterior

| Antes | Agora |
|---|---|
| `resolveContinuation()` monolítica em `src/core/knowledge/continuation/` | Pipeline em `src/core/continuation/` (módulo próprio) |
| Knowledge Engine devolvia `ContinuationSuggestion` | Devolve apenas `ResolvedNode[]` |
| Campo `weight: number` | `{ score, confidence, reasons[] }` |
| 5 intents | 6 intents (+ `celebrate`) |
| Telemetria: shown, click | + `dismissed` |

---

## O que **não** muda

- `ReaderContinuation.tsx` continua puramente visual (já está assim desde a Sprint 1).
- Fallback estático da Sprint 1 permanece como rede de segurança.
- Presets editoriais (ícones, títulos) continuam centralizados.
- Pontos de integração são os mesmos 5 leitores.

---

## Critérios de aceite

- `src/core/knowledge/` não importa nada de `src/core/continuation/` (dependência unidirecional).
- `ReaderContinuation` não importa nada de `src/core/knowledge/` (fala só com Continuation Engine).
- Cada etapa do pipeline tem teste unitário isolado.
- Telemetria emite os 3 eventos com payload completo.
- Fallback ativa quando o grafo devolve 0 candidatos ou todos com `confidence = low`.

Confirma para eu iniciar pela Fase 0?
