
# Sprint SW-1.3 — Escritos dos Santos com Ficha Editorial Mínima

## Preflight
- Skills ativos: `cathedra-guardian`, `cathedra-saints-expert`, `cathedra-knowledge-graph-expert`, `cathedra-design-system-guardian`.
- Base já pronta: `saint_works` com `access_type`, `external_url`, `external_source_label`; `SaintWorksSection.tsx` com badges e roteamento; `EditorialClosure` operante via `resolveClosure.ts`.
- Classificação: Editorial + Conteúdo + UX (leitor patrístico).
- Risco: **médio** — mudanças de schema aditivas + inserção de ~14 obras curadas.

## Matriz de Impacto
- Banco: sim (aditivo, reversível).
- Rotas: reuso de `/biblioteca/patristica/*`.
- UI: enriquecimento da ficha (novos campos exibidos).
- Regressões esperadas: nenhuma; obras existentes continuam válidas (campos opcionais).

---

## Objetivo

Cada obra dos Doutores nasce com **ficha editorial mínima** que entrega valor imediato ao usuário — mesmo quando o texto integral está em fonte externa. Semeadura priorizada pelas obras fundamentais.

---

## Fase 1 — Schema Editorial da Ficha (migração aditiva)

Estender `saint_works` com campos editoriais estruturados:

- `synopsis` (TEXT, 150–300 palavras) — descrição introdutória
- `historical_context` (TEXT) — quando/por que foi escrita
- `why_it_matters` (TEXT) — importância teológica/espiritual
- `main_themes` (TEXT[]) — temas centrais (tags curtas)
- `recommended_audience` (TEXT) — para quem é indicada
- `reading_level` (ENUM: `beginner` | `intermediate` | `advanced`)
- `editorial_closure` (JSONB) — reuso do schema Zod já existente
- `ficha_completeness` (ENUM: `stub` | `minimal` | `complete`) — trigger auto-calcula

**Trigger de qualidade**: recalcula `ficha_completeness` no INSERT/UPDATE.
- `stub` = só título
- `minimal` = tem synopsis + historical_context + why_it_matters + main_themes + reading_level
- `complete` = minimal + editorial_closure preenchido

Gate de publicação: `status='published'` exige `ficha_completeness >= minimal`.

---

## Fase 2 — Semeadura Priorizada (obras fundamentais)

Não popular todas. Começar por essas 14 obras-âncora:

| Santo | Obra | Fonte prioritária |
|---|---|---|
| Agostinho | Confissões | Vatican.va / DCO |
| Agostinho | Cidade de Deus | DCO |
| Agostinho | De Trinitate | DCO |
| Bento | Regra de São Bento | Vatican.va |
| Teresa de Ávila | Castelo Interior | CCEL |
| Teresa de Ávila | Caminho de Perfeição | CCEL |
| Teresa de Ávila | Livro da Vida | CCEL |
| Teresinha | História de uma Alma | Interno (já existe cap. 1) |
| João Crisóstomo | Homilias sobre Mateus | DCO |
| João Crisóstomo | Homilias sobre João | DCO |
| Tomás de Aquino | Suma Teológica | Interno (já existe Q.1) |
| Tomás de Kempis | Imitação de Cristo | Interno (já existe Livro I) |
| Agostinho | Solilóquios | Interno (já existe Livro I) |
| Ambrósio | De Officiis Ministrorum | DCO |

**Ordem de fonte oficial** para `external_url`:
1. Vatican.va
2. Documenta Catholica Omnia
3. CCEL
4. Outras bibliotecas reconhecidas

Cada obra entra com ficha `minimal` mínima (redigida editorialmente, sem lorem ipsum).

---

## Fase 3 — UI da Ficha Editorial

Refatorar `SaintWorksSection.tsx` + criar `SaintWorkCard.tsx` para mostrar:

- Header: título + autor + badge de acesso (interno/oficial/domínio público)
- Badge de nível de leitura (com ícone)
- Chips dos temas principais
- Synopsis (colapsável em mobile)
- Bloco "Contexto histórico" (accordion)
- Bloco "Por que importa" (destaque visual)
- Bloco "Público recomendado"
- CTA: "Ler no Cathedra" | "Ler na fonte oficial" (nova aba com aria-label)
- Rodapé com `EditorialClosure` reduzido (síntese + aplicação + oração + Nexus)

Reuso: `EditorialCard`, tokens semânticos, `data-space="biblioteca"`.

---

## Fase 4 — EditorialClosure em Obras Externas

Injetar `EditorialClosure` na página-índice da obra externa (`/biblioteca/patristica/:saint/:work`), mesmo quando `access_type != 'internal'`:

- Síntese espiritual (curada)
- Aplicação prática
- Oração associada
- Nexus (Bíblia, Catecismo, santos irmãos, verbetes do Glossário)

Assim o usuário recebe formação dentro do Cathedra antes de sair para a fonte externa.

---

## Fase 5 — Painel Admin

Estender `/admin/biblioteca-patristica`:
- Coluna `ficha_completeness` com badge colorido
- Filtro por completeness (`stub` / `minimal` / `complete`)
- Editor rico para os novos campos
- Preview lado-a-lado da ficha renderizada

---

## Fase 6 — Preparar "Biblioteca Católica" (próxima frente, não nesta sprint)

Registrar como próximo grande objetivo (sem executar agora):

Guarda-chuva único **Biblioteca Católica** reunindo:
- Escritos dos Santos
- Padres da Igreja
- Doutores da Igreja
- Documentos do Magistério
- Clássicos da espiritualidade

Toda ela reusa: `ReaderShell`, progresso, favoritos, anotações, `EditorialClosure`, Nexus. Zero infraestrutura nova.

---

## Entregáveis desta sprint

1. Migração aditiva em `saint_works` + trigger de completeness + gate de publicação.
2. Semeadura das 14 obras-âncora com ficha `minimal` curada.
3. `SaintWorkCard.tsx` renderizando a ficha completa.
4. `EditorialClosure` presente também em obras externas.
5. Painel admin com edição da ficha e filtros por completeness.
6. Nota no roadmap sobre **Biblioteca Católica** como próxima frente.

## Fora de escopo

- Internalizar textos integrais (fica para ondas seguintes por obra).
- Refatoração de outros módulos.
- Criação da Biblioteca Católica em si (só planejamento).

## Ordem de execução

1. Migração schema + trigger (aguarda aprovação).
2. UI da ficha em paralelo (não bloqueia).
3. Semeadura das 14 obras via `supabase--insert` após migração aprovada.
4. Painel admin.
5. Engineering Log final.
