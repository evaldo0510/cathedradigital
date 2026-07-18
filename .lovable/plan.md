
# STAB-NEXUS-P0 — Ativação completa do Nexus

## Status atual (o que já está feito)

**Etapa 1 já foi entregue** na mensagem anterior: `<NexusBubbles />` foi montado nos 5 Readers (Bíblia, Catecismo, Magistério, Santos, Jornada), logo antes do `ReaderContinuation`. Sem props, sem novo componente, sem mudança de layout.

Restam as etapas 2 a 6 deste comando.

---

## Alertas antes de executar (importantes)

1. **"O componente deve aparecer automaticamente quando existirem conexões"** — hoje o `NexusBubbles` **sempre renderiza** o painel/gatilho independentemente de haver conexões (ele consulta `nexusContent` internamente). Implementar "aparecer só quando houver" exige refatorar o componente para expor um `hasContent` ou similar. Isso é **novo comportamento**, não "só conectar". Proposta: manter o comportamento atual (renderiza sempre; se não há tags, mostra estado vazio). Se você quer ocultar automaticamente, isso vira uma sub-tarefa STAB-NEXUS-P0.1 explícita.

2. **"100% dos bubbles navegando / zero spans mortos"** — o critério é atingível para `bible`, `catechism`, `magisterium`, `saint`, `theme` (todas as rotas existem). Para `father`, `council`, `canon` **não há rota nem página**. As duas opções aceitas pelo próprio comando são: (a) ocultar o bubble ou (b) marcar como "indisponível". Vou por **(a) ocultar** — é a única opção que zera dead-end sem inventar UI nova. Se preferir (b), diga.

3. **"Zero console.error"** — objetivo saudável, mas o app já tem `console.error` legado de outras áreas (realtime, auth, etc.). Vou garantir zero erros **originados pelo Nexus ou pela navegação disparada por ele**. Console geral fica fora do escopo desta sprint.

4. **Telemetria (`nexus.shown/click/destination/failed`)** — hoje já existe telemetria parcial no Nexus (visitas de seção, deep link inválido). Vou **estender** o módulo existente em vez de criar um paralelo. Sem nova tabela, sem novo endpoint — usa o mesmo pipeline já em uso.

5. **Testes E2E** — o projeto tem Playwright configurado. Vou adicionar 1 spec novo (`nexus-p0-integration.spec.ts`) com os 4 fluxos pedidos. **Risco:** os fluxos dependem de dados reais no `KnowledgeGraph` — se o seed (~46 nós) não cobrir o par exato "Bíblia X → Catecismo Y", o teste vai falhar não por bug, mas por falta de dado. Vou usar exemplos que **existem no seed** e reportar cobertura real.

6. **Relatório de auditoria do grafo (etapa 3)** — vou gerar um script Node que percorre todos os nós do `KnowledgeGraph` e valida `resolveLink → rota → existe no App.tsx`. Saída em `docs/CAT-030-NEXUS-COVERAGE.md`. Sem UI nova.

---

## Plano de execução (etapas 2 a 6)

### Etapa 2 — Completar `resolveLink` em `NexusBubbles.tsx`

Arquivo único: `src/components/cathedra/NexusBubbles.tsx`, função `resolveLink` (linhas ~220-229).

Mapeamento a implementar (usando rotas **que já existem** no `App.tsx`):

| Tipo | Rota destino | Fonte |
|---|---|---|
| `bible` | `/bible?book={abbr}&chapter={n}&verse={v}` | já existe |
| `catechism` | `/catechism?p={paragraph}` | já existe |
| `magisterium` | `/magisterium/{id}` | já existe (App.tsx:465) |
| `saint` | `/santos/{slug\|id}` | já existe (App.tsx:501) |
| `theme` | `/temas/{slug}` | já existe (App.tsx:492) |
| `journey` | `/jornadas/{id}` | já existe (mantido) |
| `father`, `council`, `canon` | **sem rota** → retornar `null` | oculta bubble |

No render (linhas ~786-790), a alteração é: se `resolveLink` retornar `null`, **não renderizar o elemento** (nem `<span>`, nem `<button>`) e registrar `nexus.failed` com motivo `no-route:{type}`.

### Etapa 3 — Auditoria automática do grafo

Novo script (não é código de produção, é ferramenta): `scripts/audit-nexus-graph.ts`.

- Importa `KnowledgeGraph`, itera todos os nós.
- Para cada nó: chama `resolveLink({ type, id, ... })`, verifica se a rota resultante bate com algum `path` declarado no `App.tsx` (leitura estática do arquivo).
- Saída em `docs/CAT-030-NEXUS-COVERAGE.md`:
  - Total de nós por tipo
  - % com destino válido
  - Lista de nós órfãos (tipo + id + motivo)

Rodar 1 vez no fim da sprint e commitar o relatório.

### Etapa 4 — E2E Playwright

Novo spec: `tests/e2e/nexus-p0-integration.spec.ts`.

Cenários (usando dados que existem no seed):

1. `/bible?book=jo&chapter=6` → aguarda `<NexusBubbles>` visível → clica primeiro bubble tipo `catechism` → asserta URL contém `/catechism?p=`.
2. `/catechism?p=1324` → aguarda Nexus → clica bubble `magisterium` → asserta URL `/magisterium/`.
3. `/magisterium/{id-do-seed}` → aguarda Nexus → clica bubble `saint` → asserta URL `/santos/`.
4. `/jornadas/{id-do-seed}/step` (com step completo) → aguarda Nexus → clica bubble `bible` → asserta URL `/bible?`.

Assertions transversais em cada cenário:
- `expect(page.locator('span[data-nexus-dead-end]')).toHaveCount(0)` — nenhum span morto.
- Coleta `page.on('pageerror')` e `page.on('console', msg => msg.type()==='error')` filtrando por stack contendo `Nexus`/`resolveLink` — deve ser zero.

Se algum cenário não tiver dado no seed, o teste é marcado `test.skip()` com motivo explícito, **não** silenciado.

### Etapa 5 — Telemetria

Estender o módulo existente `src/lib/nexusState.ts` (ou onde já vive o `trackNexus*`) com 4 eventos:

- `nexus.shown` — disparado 1x por montagem quando o painel tem ≥1 bubble.
- `nexus.click` — disparado no `onClick` do bubble, com `{ type, id, from }`.
- `nexus.destination` — disparado após `navigate()` bem-sucedido, com URL final.
- `nexus.failed` — disparado quando `resolveLink` retorna `null` durante render, com `{ type, id, reason }`.

Backend: usa o mesmo endpoint/tabela de telemetria já em uso (nenhuma nova tabela, nenhuma nova edge function).

### Etapa 6 — Critério de aceite

Vou entregar, ao final:

1. Diff das etapas 2 e 5 (arquivo `NexusBubbles.tsx` + módulo de telemetria).
2. Relatório de cobertura (`docs/CAT-030-NEXUS-COVERAGE.md`) com números reais.
3. Log da execução do E2E (`tests/e2e/nexus-p0-integration.spec.ts`) — pass/skip/fail por cenário, sem "todos verdes" fabricado.
4. Nota explícita se `father`/`council`/`canon` foram encontrados no grafo e ocultados (com contagem).

Se qualquer critério falhar, reporto **antes** de dizer "pronto".

---

## O que NÃO vou fazer (respeitando as regras do comando)

- Não criar página nova para Padres/Concílios/Cânones.
- Não criar rota nova.
- Não criar componente novo (nem wrapper, nem versão "Reader" do Nexus).
- Não mexer no layout dos Readers além do que já foi feito na etapa 1.
- Não popular o `KnowledgeGraph` com novos nós — se o seed é pobre, isso vira outra sprint.
- Não deletar o `core/continuation/*` morto identificado na auditoria (sai do escopo).

---

## Decisões que preciso de você antes de começar

1. **Bubble sem rota (`father`/`council`/`canon`)**: opção (a) **ocultar** ou (b) mostrar como "em breve" desabilitado? Recomendo (a).
2. **Alerta #1 acima**: "aparecer só quando houver conexões" — trata-se de comportamento novo. Fica fora desta sprint (mantém render atual) ou vira STAB-NEXUS-P0.1?

Respondendo essas duas, executo direto etapas 2 → 5 → 3 → 4 → aceite.
