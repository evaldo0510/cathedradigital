---
name: cathedra-logos-2030-ui
description: Sistema visual Logos 2030 do Cathedra. Use ao criar/editar qualquer tela, hero, card, layout, tipografia ou espaçamento. Impõe EditorialHero, EditorialCard, typography tokens, data-space, mobile-first e proíbe componentes paralelos.
---

# Logos 2030 UI

Padrão visual do Cathedra. Toda tela pertence à mesma catedral.

## Ambientes (data-space)

Aplicado via `resolveSpace.ts` em `App.tsx`. Nunca sobrescrever manualmente.

| `atrio` | Home, landing | Acolhida, hierarquia clara |
| `igreja` | Orações, Missal, LH, Via Sacra, Rosário | Recolhimento, ritmo litúrgico |
| `biblioteca` | Bíblia, CIC, Glossário, Santos, Magistério | Estudo, filetes dourados |
| `claustro` | Diário, Contemplatio, Exame, Confissão | Silêncio, tons quentes |

## Componentes canônicos (obrigatórios)

- **`EditorialHero`** — todo header de página âncora. Um único H1.
- **`EditorialCard`** — densidades `dense` | `balanced` | `minimal`.
- **`PrayerPortal`** — container único para orações, parametrizado por `portalTheme.ts`.
- **`ReaderContinuation`** — rodapé de toda página editorial.

## Regras

- Cores só via tokens semânticos (`--primary`, `--secondary`, `--muted`, `--foreground`, `--background`).
- **Proibido:** `text-white`, `bg-black`, `bg-[#...]`, `text-[#...]`, gradiente roxo/indigo genérico.
- Tipografia via `src/styles/typography.css` — nunca `font-*` inline.
- Espaçamento via escala `--space-1..12`.
- Ícones Lucide sólidos. Nunca emoji.
- Sem animação chamativa em telas contemplativas (spin, pulse infinito).
- Mobile-first. `h-dvh` em vez de `h-screen`.
- WCAG AAA em contraste onde possível; AA mínimo obrigatório.

## Proibições

- Criar componente novo quando já existe equivalente.
- Duplicar Hero, Card, Portal ou Reader.
- Hardcodear cor, tipografia, sombra ou padding.

## Checklist

- [ ] Um único H1 (EditorialHero)
- [ ] Cards via EditorialCard com densidade correta
- [ ] Tokens semânticos em toda cor
- [ ] Tipografia via escala
- [ ] `data-space` herdado corretamente
- [ ] Mobile validado (viewport 375px)
- [ ] Contraste AA+
- [ ] Sem emoji, sem gradiente genérico

Rejeitar tela que ignore qualquer item.
