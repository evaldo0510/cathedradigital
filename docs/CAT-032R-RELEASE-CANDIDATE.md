# CAT-032R — Formação: Release Candidate

**Status:** Auditoria read-only concluída.
**Escopo:** `/jornadas` em 4 breakpoints (iPhone SE 375, iPhone 14 390, Tablet 820, Desktop 1440).
**Método:** Playwright headless, screenshot da primeira dobra + métricas DOM (posição H1, overflow-x, tap targets <44px, scrollHeight).

Screenshots: `/tmp/browser/cat032r/screenshots/{iphone-se,iphone-14,tablet,desktop}-fold.png`.

---

## Nota geral: **72 / 100**

Melhoria clara sobre o baseline anterior (58/100). A primeira dobra agora comunica intenção, o CTA é legível em todos os viewports, não há overflow horizontal e o divisor editorial ficou proporcional. Ainda há **2 P0** que impedem homologar como RC.

---

## RC-1 — Primeira dobra (5 segundos)

| Viewport | H1 top | Fold ocupado | Veredito |
|---|---|---|---|
| iPhone SE 375×667 | 152px | Eyebrow + H1 + subtítulo + parágrafo + CTA cabem inteiros | ✅ |
| iPhone 14 390×844 | 152px | Sobra respiro; blockquote começa a aparecer | ✅ |
| Tablet 820×1180 | 200px | Muito ar; H1 grande domina | ✅ |
| Desktop 1440×900 | 200px | H1 protagoniza; CTA claramente visível | ✅ |

**Score parcial: 18/20.** Usuário entende **onde está** (Cathedra), **o que pode fazer** (Entrar e começar) e **por quê** (subtítulo + descrição do caminho). Único ruído: eyebrow diz `COMECE UMA CAMINHADA` — decisão congelada exige `ITINERARIUM MENTIS`.

## RC-2 — Um único protagonista

Hierarquia observada, do topo:

```
CATHEDRA (logo header, 14px — não compete)
COMECE UMA CAMINHADA (eyebrow, 10px, tracking 0.25em)
PRISÃO INTERIOR (H1 Cormorant, clamp 32→60px)
Libertação das correntes invisíveis (subtítulo itálico)
Descrição funcional (Karla, 16px)
[ENTRAR E COMEÇAR] (CTA sólido)
```

Nenhum outro elemento compete com o H1 na primeira dobra. **Score: 20/20.**

## RC-3 — Ritmo editorial

- Divisor `editorial-rule--hair` renderiza curto (160px, centralizado) sob o blockquote. ✅
- Gap Hero→Timeline reduzido (correção anterior consolidada). ✅
- Espaçamentos seguem tokens `spacing-*`; nenhum gap arbitrário observado no fold.

**Score: 14/15.** −1 porque no tablet o respiro entre H1 e subtítulo fica excessivo comparado ao desktop (proporcional ao clamp).

## RC-4 — Acessibilidade & tap targets

Todos os botões da UI Formação medem ≥ 44×44px no fold (CTA "Entrar e começar" tem altura confortável, foco visível preservado via `focus-visible:ring-2`).

Alvos <44px detectados na varredura:
- `PULAR PARA O CONTEÚDO` (1×1) — skip link intencional, `sr-only`. **Ignorar.**
- `◎ Contrast · AA`, `⚙`, `⚠ Audit`, `🔍 Inspect`, `⬇ NDJSON` — **Dev Inspector overlay**. Ver P0-1.

Overflow horizontal: **nenhum** nos 4 viewports. ✅

**Score parcial: 12/15.** Perde pontos pelo overlay dev (item externo à Formação, mas visualmente presente e pequeno demais).

## RC-5 — Consistência com Logos 2030

- Cormorant Garamond no H1 e blockquote. ✅
- Karla no corpo e eyebrow (uppercase, tracking amplo). ✅
- Paleta noir/gold/papel respeitada; sem cor crua. ✅
- Blockquote com aspas curvas em serifada — coerente com Reader. ✅

**Score: 8/10.** −2 porque o eyebrow atual (`COMECE UMA CAMINHADA`) contradiz a decisão congelada nesta sessão (`ITINERARIUM MENTIS`).

---

## Gaps para virar RC → GA

### P0 (bloqueadores)

1. **Dev Inspector visível em preview.** Overlay com botões `Contrast · AA / Audit / Inspect / NDJSON` + FAB estrela (`/tmp/browser/cat032r/screenshots/iphone-se-fold.png`) aparece sobre a primeira dobra em todos os viewports. Regressão da correção anterior (`devInspector` deveria estar oculto fora de dev). Impacto: quebra o silêncio editorial e polui tap targets. **Fix:** re-verificar guard de ambiente que controla montagem do inspector.
2. **Eyebrow desalinhado da decisão congelada.** Renderiza `COMECE UMA CAMINHADA`; decisão desta sessão é `ITINERARIUM MENTIS`. **Fix:** trocar string única em `FormacaoHero.tsx` (state logged-out) e no equivalente logged-in, se distinto.

### P1 (recomendados antes de replicar padrão para Biblioteca/Reader)

3. **Hero logged-out ≠ hero logged-in.** A auditoria capturou o fallback anônimo. É preciso rodar RC-1..RC-5 novamente com sessão autenticada para validar `progresso 1px`, `tempo restante`, `Continuar/Reiniciar` — o RC-032 original foi feito nesse estado. **Fix:** rodar segunda passada com sessão injetada.
4. **Tablet 820 — respiro Hero→subtítulo levemente inflado.** Ajuste fino no clamp de `margin-top` do subtítulo (ou usar `line-height` em vez de margem).

### P2 (polimento)

5. Blockquote está muito próximo do CTA no iPhone SE (~60px). Confortável para leitura, mas poderia ganhar +8px de `margin-top`.
6. `CATHEDRA` no header aparece com bullet decorativo à esquerda (`•`) que, no desktop, forma um "vazio" visual assimétrico com o botão `ENTRAR` à direita. Não é bug, é decisão — mas vale documentar.

---

## Recomendação

**Não homologar como RC ainda.** Corrigir P0-1 (Dev Inspector) e P0-2 (eyebrow) — ambos são mudanças pontuais, ~15 min. Depois rodar segunda passada autenticada (P1-3) e, se limpar, homologar Formação como **padrão visual de referência** e congelar a tela.

Aguardando seu OK para aplicar P0-1 + P0-2.
