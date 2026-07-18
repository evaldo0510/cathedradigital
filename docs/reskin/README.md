# Reskin Stitch → Cathedra

Plano aprovado em `.lovable/plan.md`. Este diretório documenta a **migração puramente visual** das rotas do Cathedra usando os 12 HTMLs do Google Stitch como referência.

## Princípio único

Os HTMLs Stitch são **referência visual**. Zero mudança em: rotas, hooks, adapters, services, edge functions, schema, RLS, Knowledge Engine, Nexus resolver, Continuation Engine, RouteRegistry, ReaderService, ContentAdapters, EnvironmentRegistry, JourneyService.

O que muda: tokens CSS, tipografia, layout, composição, espaçamento, motion — sempre via tokens semânticos.

## Fundação (Sprint R0 — concluída)

- **Tokens Stitch** (paleta M3, raios, espaçamentos, tipografia) adicionados em `src/index.css` no namespace `--stitch-*`, com pares light/dark.
- **Tailwind** expõe o namespace `stitch.*` em `tailwind.config.ts`: `bg-stitch-primary`, `text-stitch-on-surface`, `border-stitch-outline-variant`, `font-stitch-display`, `text-stitch-headline-md`, etc.
- Tokens legados **permanecem intactos** — nenhuma rota muda em R0. Cada sprint R1..R7 opta por consumir `stitch-*` na sua rota-alvo.

## Mapa Stitch → Cathedra

| # | HTML Stitch | Alvo Cathedra |
|---|---|---|
| 1 | Saints & Spiritual Friendships | Módulo Santos (dentro de Biblioteca) |
| 2 | Catechism | `/catechism` — CatechismReader |
| 3 | Magisterium | `/magisterio` — MagisteriumReader |
| 4 | Padres da Igreja | Padres (dentro de Biblioteca) |
| 5 | Nexus | `NexusInlinePreview` + painel lateral (Sheet) |
| 6 | Bíblia Sagrada | `/bible` — Bible/BibleReader |
| 7 | Oração & Lectio Divina | `/rezar` — módulo Rezar |
| 8 | Pesquisa Universal | `/buscar` — SearchPage |
| 9 | Formação | `/formar-se` — JornadasPage |
| 10 | Biblioteca | `/biblioteca` — BibliotecaPage |
| 11 | Átrio | `/` — AtriumPage (composition.ts intacto) |
| 12 | Leitor Universal | Shell de Reader compartilhado (PA-2) |

## Ordem de migração

R1 Biblioteca → R2 Leitor Universal → R3 Pesquisa → R4 Formação → R5 Átrio → R6 Nexus → R7 Módulos de conteúdo (Bíblia, Catecismo, Magistério, Padres, Rezar, Santos).

## Contrato por tela (obrigatório em cada PR de reskin)

Cada PR de reskin cria `docs/reskin/<slug>.md` seguindo o template abaixo.

```md
# Reskin — <Nome da tela> (Rxx)

## Estado atual
Screenshot da rota hoje (`/tmp/reskin/<slug>-before.png`).

## Estado proposto
HTML Stitch de referência (número + link/screenshot).

## Componentes reutilizados
- `src/...` — permanece; nenhuma mudança de props/estado.

## Componentes só redesenhados
- `src/...` — apenas layout/CSS/composição.

## Componentes proibidos de alterar
Knowledge Engine, RouteRegistry, Continuation Engine, Nexus resolver,
Supabase, ReaderService, ContentAdapters, EnvironmentRegistry, JourneyService.

## Diff de tokens
Lista de tokens `stitch-*` consumidos e ajustes pontuais (se algum).

## Checklist de regressão
- [ ] Rotas inalteradas
- [ ] Hooks/adapters/services inalterados
- [ ] Telemetria inalterada
- [ ] E2E da rota verde sem alterar seletor semântico
- [ ] Design-system audit verde (sem cor hardcoded nova)
- [ ] axe (contraste AA) verde em light e dark
- [ ] Lighthouse/perf-pr-guard sem regressão
- [ ] Snapshot visual atualizado apenas da rota migrada
```

## Regras de uso dos tokens Stitch

- **Sempre** usar classes `bg-stitch-*` / `text-stitch-*` / `border-stitch-*` — nunca hex hardcoded.
- **Ícones**: manter Lucide sólido (memória inegociável). NÃO importar Material Symbols nem Tailwind CDN dos HTMLs. Traduzir cada símbolo Stitch para o Lucide equivalente.
- **Tipografia**: preferir `font-stitch-display` (EB Garamond) + `font-stitch-label` (Karla) nas rotas migradas. Cormorant/Karla do Logos 2030 permanece como fallback.
- **Dark mode**: cada componente migrado deve ser revisado em light e dark antes do merge.

## Fora de escopo

- `src/pages/prototype-2.0/*` — sandbox, será descomissionado à parte.
- Copy espiritual — não alterar sem pedido específico.
- Novas rotas / novas páginas.
- Runtime Stitch (Material Symbols, Tailwind CDN, transparenttextures.com).
