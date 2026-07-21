---
name: cathedra-harmony-ui
description: Especialista em Logos 2030 — sistema visual do Cathedra. Use ao criar/editar telas, componentes, heros, cards, tipografia, espaçamentos, cores e ambientes (data-space). Garante consistência visual entre Átrio, Igreja, Biblioteca e Claustro.
---

# Harmony UI (Logos 2030)

Padrão visual do Cathedra. Toda tela deve parecer parte da mesma catedral, com ritmo, luz e textura próprios de cada ambiente.

## Ambientes (data-space)

Aplicado via `resolveSpace.ts` no `App.tsx`. Nunca aplicar manualmente em componente.

| Espaço | Rotas | Caráter visual |
|---|---|---|
| `atrio` | `/`, home, landing | Acolhida, ar, hierarquia clara |
| `igreja` | `/oracao/*`, `/missal`, `/liturgia-das-horas`, `/via-sacra`, `/rosario` | Recolhimento, sombras suaves, tipografia ampla, ritmo litúrgico |
| `biblioteca` | `/biblia`, `/catecismo`, `/glossario`, `/santos`, `/magisterio` | Estudo, densidade textual, filetes dourados, serifa |
| `claustro` | `/diario`, `/contemplatio`, `/exame`, `/confissao` | Intimidade, silêncio, tons quentes, mínimo de UI |

Cores/sombras/paddings ajustam automaticamente via tokens `--space-*` em `src/index.css`.

## Componentes canônicos

### `EditorialHero`
- Header de página âncora. Um único H1.
- Aceita `title`, `eyebrow`, `subtitle`, `actions`, `meta`.
- Não empilhar dois heros na mesma página.
- No `igreja/passion/dawn` muda tratamento via `PrayerPortal`.

### `EditorialCard`
- Três densidades:
  - `dense` — listas longas (Santos, Glossário).
  - `balanced` — coleções curadas (Novenas, Jornadas).
  - `minimal` — cards de contemplação (Mistérios, Estações).
- Nunca hardcodear padding/shadow — usar a densidade.

### `PrayerPortal`
- Container único para orações. Parametrizado por `portalTheme.ts`.
- Não criar Portais custom por oração. Se falta um tema, adicioná-lo em `portalTheme.ts`.

## Tipografia

- Escala definida em `src/styles/typography.css`.
- Serifa editorial (herança visual) para títulos de Biblioteca.
- Sans humanista para Átrio.
- Nunca aplicar `font-*` inline direto — usar classes utilitárias da escala.

## Cores

- Sempre tokens semânticos (`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`).
- Proibido: `text-white`, `bg-black`, `bg-[#...]`, `text-[#...]`.
- Filetes/detalhes dourados via `--secondary` (só na Biblioteca por padrão).

## Espaçamento

- Escala `--space-1` a `--space-12` em `src/index.css`.
- Ritmo vertical entre seções: mínimo `--space-8` em Igreja/Claustro; `--space-6` em Biblioteca.

## Ícones

- Lucide sólidos (`lucide-react`).
- Nunca emoji. Nunca ícone colorido.
- Tamanho via classes (`h-4 w-4`, `h-5 w-5`).

## Checklist rápido

Antes de mergear tela nova:
- [ ] Um único H1
- [ ] `EditorialHero` usado (se página âncora)
- [ ] `EditorialCard` com densidade correta
- [ ] Cores só via tokens
- [ ] Tipografia via escala
- [ ] `data-space` correto (herdado, não sobrescrito)
- [ ] Sem gradiente roxo/indigo genérico
- [ ] Ícones Lucide, sem emoji
- [ ] CLS zero (validar com Playwright em telas âncora)

## O que rejeitar

- Componente novo que replica algo já existente em `EditorialCard` ou `EditorialHero`.
- Cores hardcoded em qualquer forma.
- Tipografia inline sem passar pela escala.
- Sombras/shadows arbitrárias — só via tokens de espaço.
- Animações que quebram silêncio (spin infinito, pulse chamativo em tela de oração).
