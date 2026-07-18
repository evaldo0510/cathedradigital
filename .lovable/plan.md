# Integração do design Stitch ao Cathedra — plano de reskin

## Princípio único

Os 12 HTMLs do Google Stitch são **referência visual apenas**. Nada de domínio, rota, hook, adapter, edge function, Supabase, Knowledge Engine, Nexus, Reader, Continuation, RouteRegistry ou schema é tocado. O que muda é a camada de apresentação (tokens CSS, tipografia, layout, composição, espaçamento, motion).

## Mapa Stitch → Cathedra

| # | HTML Stitch | Alvo Cathedra (rota / componente) |
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
| 11 | Átrio | `/` — AtriumPage (não muda composition.ts, só a apresentação dos blocos) |
| 12 | Leitor Universal | Shell de Reader compartilhado (PA-2) |

## Camada de design (fonte da verdade única)

Extrair do HTML 1 (já inspecionado) e aplicar em `src/index.css` + `tailwind.config.ts` como tokens semânticos HSL:

- **Paleta Stitch (M3)**: `primary #00113a`, `secondary #735c00`, `background #fbf9f8`, `surface-container #eae8e7`, `on-surface #1b1c1c`, `outline #757682`, containers e inverses correspondentes. Dark mode com os pares equivalentes já presentes nos HTMLs.
- **Tipografia**: manter Cormorant/EB Garamond como display serif (Logos 2030 continua) e Karla como sans (o Stitch já usa EB Garamond + Karla — alinhado à memória do projeto).
- **Iconografia**: manter Lucide sólido do Cathedra (memória inegociável). NÃO importar Material Symbols do Stitch — traduzir cada símbolo Stitch para o Lucide equivalente.
- **Motion, raio, sombra, densidade**: derivar dos HTMLs e expor como tokens (`--radius`, `--shadow-*`, `--motion-*`).

Nenhum componente pode usar cor hardcoded (`text-white`, `bg-[#...]`). Tudo via token semântico — pré-requisito para não quebrar dark mode nem o design-system audit já no CI.

## Ordem de migração (respeita a pedida)

Cada etapa segue o mesmo ritual: ler HTML → produzir diff visual (antes×depois) → reskin apenas de layout/CSS → rodar E2E existente da rota → publicar.

1. **Biblioteca** (HTML 10) — hero, capas 3D, grid assimétrico já iniciados na Sprint 3.1; alinhar ao Stitch.
2. **Leitor Universal** (HTML 12) — Shell compartilhado; consumido por Bíblia, Catecismo, Magistério, Padres, Santos. Reskin do chrome, não do `ReaderService`.
3. **Pesquisa Universal** (HTML 8) — `/buscar`.
4. **Formação** (HTML 9) — `/formar-se` (Timeline vertical Logos 2030 permanece).
5. **Átrio** (HTML 11) — apresentação dos blocos P0–P6; `composition.ts` intacto.
6. **Nexus** (HTML 5) — visual do `NexusInlinePreview` e do painel lateral; lógica de resolveLink/telemetria intacta.
7. **Módulos de conteúdo** (HTMLs 2, 3, 4, 6, 7, 1) — cada Reader/lista recebe reskin usando o Shell da etapa 2.

## Contrato por tela (formato entregue no PR de cada etapa)

Para cada HTML, o PR de reskin inclui um bloco `docs/reskin/<slug>.md` com:

- **Estado atual** — screenshot da rota hoje.
- **Estado proposto** — screenshot do HTML Stitch.
- **Componentes reutilizados** — lista dos componentes existentes que permanecem (nome + caminho).
- **Componentes só redesenhados** — só CSS/layout muda.
- **Componentes proibidos de alterar** — Knowledge Engine, RouteRegistry, Continuation Engine, Nexus resolver, Supabase, ReaderService, ContentAdapters, EnvironmentRegistry, JourneyService.
- **Diff de tokens** — tokens novos/ajustados usados.
- **Checklist de regressão** — rotas, hooks, contratos, telemetria, testes E2E da área.

## Critérios de aceite (aplicados a cada etapa e ao fim)

- Zero mudança em: rotas, hooks, adapters, services, edge functions, schema, RLS.
- Zero cor hardcoded nova; design-system audit verde.
- Suítes E2E da rota afetada continuam verdes sem alteração de seletor semântico.
- Snapshots visuais atualizados apenas nas rotas migradas.
- Lighthouse/perf-pr-guard sem regressão.
- Acessibilidade: contraste AA, foco visível, ARIA preservados; axe verde.
- Dark mode revisado em cada tela migrada.

## Fora de escopo (explícito)

- Não migrar `prototype-2.0/*` (sandbox, será descomissionado à parte).
- Não introduzir Material Symbols, Tailwind CDN nem qualquer runtime do Stitch.
- Não criar novas páginas nem novas rotas.
- Não alterar copy espiritual sem pedido específico.

## Entregável imediato após aprovação

Sprint R0 (fundação, ~1 iteração): tokens Stitch aplicados em `index.css`/`tailwind.config.ts` + `docs/reskin/README.md` com o mapa acima e o template do contrato por tela. Nenhuma rota migrada ainda — só a base para as sprints R1..R7 rodarem sem retrabalho de token.

Confirma esse plano para eu abrir a Sprint R0?
