# Cathedra 2.0 — Backlog Executivo de Integração

Documento operacional, derivado de:
- `docs/CATHEDRA-INTEGRATION-AUDIT.md` (auditoria de coesão)
- `docs/CATHEDRA-FULL-AUDIT.md` (auditoria CAT-030, nota 46/100)

Regra: nenhuma implementação começa fora da ordem definida aqui. Cada onda termina com homologação antes da seguinte. Sem PRs isolados de "quick win" fora do plano.

---

## Backlog priorizado (fonte da verdade)

| # | Prioridade | Problema | Impacto | Tempo | Dependência | Onda |
|---|---|---|---|---|---|---|
| 1 | P0 | Slugs divergentes menu × rota (`/library`, `/via-crucis`, `/journeys`, `/saints`) | Alto — quebra analytics, cria redirects desnecessários | 20 min | nenhuma | 1 |
| 2 | P0 | Rotas órfãs listadas em `App.tsx` sem entrada em `APP_ROUTES` (`/aquinas`, `/temas`, `/encyclopedia`, `/az-faith`, `/guia-modulos`, `/papas`, `/aparicoes`, `/dogmas`, `/community`, `/spiritual-profile`, `/onboarding`, `/legacy-home`) | Alto — conteúdo inacessível pelo menu | 40 min | nenhuma | 1 |
| 3 | P0 | Rota de fixture `/__test/theological-text` exposta em produção | Médio — vazamento de superfície de teste | 10 min | nenhuma | 1 |
| 4 | P0 | Duas árvores de jornada paralelas (`journeys*` 40/578/18 × `itineraria*` 2/5/0) | Muito alto — bloqueia toda integração de progresso | 1 dia | migração SQL reversível + reapontamento de 16 arquivos | 2 |
| 5 | P0 | `bible_favorites` morta (0 linhas, 0 consumidores); `useFavorites` usa localStorage | Baixo funcional / Alto arquitetural — fonte de verdade falsa | 30 min | comentário + drop planejado | 2 |
| 6 | P1 | `nexus_relations` e `nexus_synonyms` com 0 linhas em produção | Muito alto — motor de conhecimento não existe de fato | 1 dia | decisão prévia (item 10) | 3 |
| 7 | P1 | Reader → Biblioteca/Jornada sem CTA de retorno e sem escrita em `journey_progress`/`itineraria_progress` | Alto — dead-end sistemático | 4h | Onda 2 concluída | 4 |
| 8 | P1 | `PassageActions` em 2 de 4 readers (falta Bible, Magisterium) | Médio — inconsistência de ação sobre passagem | 2h | nenhuma | 4 |
| 9 | P1 | 4 implementações de busca sem registry compartilhado (`GlobalSearchPage`, `CommandCenter`, `MagisteriumSearchBar`, roteador Biblioteca) | Alto — divergência de resultados possível | 1 dia | decisão sobre `SearchRegistry` (item 10) | 5 |
| 10 | P1 | Decisão formal sobre arquitetura fantasma: `core/navigation/*`, `core/knowledge/*`, `ReaderService`, `UniversalReader`, adapters — remover ou adotar? | Alto — bloqueia Ondas 3 e 5 | 2h de decisão + 4h de execução | precisa da decisão do arquiteto antes de qualquer execução | 3 |
| 11 | P1 | Abas placeholder da Biblioteca (Temas, Autores, Coleções) | Médio — becos sem saída | 4h | Onda 3 (dados via Knowledge) | 5 |
| 12 | P1 | 3 hooks de dashboard consultando `journey_progress` de forma independente | Médio — queries redundantes | 3h | Onda 2 (tabela única) | 4 |
| 13 | P2 | Rótulo "Coleções" duplicado dentro da Biblioteca (aba vazia + prateleira dim) | Baixo — confusão de rótulo | 15 min | Onda 5 | 5 |
| 14 | P2 | `/prototype-2.0/*` (9 telas) roteado em produção sem link de entrada | Baixo funcional / Médio segurança | 30 min | decidir promoção de `Formacao.tsx` antes de arquivar | 5 |
| 15 | P2 | Providers globais fixos aninhados aplicados a páginas estáticas | Baixo — overhead marginal | 1h | Onda 5 | 5 |
| 16 | P3 | Consistência visual entre abas da Biblioteca (PlaceholderView vs. layout próprio) | Baixo — resolvido junto do item 11 | incluso em 11 | Onda 5 | 5 |

Total estimado: **~4 dias de trabalho focado**, distribuídos em 5 ondas.

---

## Ondas de integração (ordem oficial, congelada)

Cada onda tem: escopo fechado, critério de pronto verificável, e o gate que a próxima aguarda.

### Onda 1 — Navegação (baixo risco, ganho imediato)
**Escopo:** itens 1, 2, 3.
- Reescrever `APP_ROUTES` para apontar diretamente à rota real (sem depender de redirects).
- Adicionar entradas de menu para as rotas órfãs que devem ser públicas; remover do `App.tsx` as que não devem existir.
- Proteger `/__test/theological-text` por flag ou remover do build de produção.

**Critério de pronto:**
- Zero redirect em `App.tsx` para itens listados em `APP_ROUTES`.
- Cada `<Route path=…>` de `App.tsx` ou tem entrada em `APP_ROUTES`, ou tem `showInMenu: false` justificado em comentário, ou é sub-rota de detalhe (`/x/:id`).
- Rota de teste inacessível em produção.

**Gate:** homologação de navegação em desktop e mobile. Só então Onda 2.

---

### Onda 2 — Dados (mudança estrutural, requer migração)
**Escopo:** itens 4, 5.
- Migrar `journeys` → `itineraria`, `journey_steps` → `itineraria_steps`, `journey_progress` → `itineraria_progress` (migration SQL reversível, com backup e verificação de contagem antes/depois).
- Atualizar os 16 arquivos consumidores de `journey_*` para `itineraria_*` em um único PR atômico.
- Marcar `bible_favorites` como deprecada (comentário na migration + issue de drop futuro); manter `useFavorites` em localStorage documentado.

**Critério de pronto:**
- `SELECT count(*) FROM journeys` = `SELECT count(*) FROM itineraria` (40) após migração.
- Zero import de `journey_progress`/`journey_steps`/`journeys` em `src/` fora de arquivos de migração/teste histórico.
- Homologação: usuário existente com progresso em `journey_progress` continua vendo o mesmo progresso após deploy.

**Gate:** verificação em produção com usuário real (os 18 registros de progresso preservados). Só então Onda 3.

---

### Onda 3 — Knowledge (decisão + população)
**Escopo:** itens 6, 10.
- **Antes de qualquer código**: decisão registrada do arquiteto entre:
  - (A) Remover `core/knowledge/*`, `core/navigation/*`, `ReaderService`, `UniversalReader`, adapters — reduzir superfície.
  - (B) Adotar essas camadas como padrão e migrar `nexusContent.ts` para dentro delas.
- Se (A): remover arquivos, deixar `nexusContent.ts` como fonte única.
- Se (B): popular `nexus_relations` a partir das relações já existentes em `nexusContent.ts` (script de seed); migrar consumidores gradualmente.

**Critério de pronto:**
- Escolha (A) ou (B) documentada em ADR (`docs/adr/002-knowledge-architecture.md`).
- Se (A): `rg -l "KnowledgeRegistry|ReaderService|UniversalReader" src` retorna vazio.
- Se (B): `SELECT count(*) FROM nexus_relations` > 0, com pelo menos 1 consumidor de tela usando a tabela.

**Gate:** ADR aprovada + execução completa. Só então Onda 4.

---

### Onda 4 — Readers (fechar o loop)
**Escopo:** itens 7, 8, 12.
- Adicionar `PassageActions` em `Bible.tsx` e `Magisterium.tsx` (uniformizar padrão dos 4 readers).
- Ao fim de seção/capítulo em Bible/Catechism/Magisterium: escrever em `itineraria_progress` (a tabela unificada da Onda 2) + exibir CTA "Continuar em [próxima jornada]" alimentado por essa mesma tabela.
- Consolidar `useDashboardData`, `useEnhancedRecommendations`, `useAdminDashboardData` em uma única query com `select` compartilhado via React Query (mesmo `queryKey`).

**Critério de pronto:**
- 4 readers usam `PassageActions`.
- Leitura de qualquer capítulo/parágrafo gera 1 registro em `itineraria_progress` verificável no admin.
- DevTools mostra 1 query por sessão para `itineraria_progress` em vez de 3.

**Gate:** teste manual do fluxo Reader → CTA → próxima trilha. Só então Onda 5.

---

### Onda 5 — Experiência (Biblioteca, Pesquisa, prototype, providers)
**Escopo:** itens 9, 11, 13, 14, 15, 16.
- Substituir arrays hardcoded de `BibliotecaPage.tsx` (`escritos`, `colecoes`, `descubra`) por dados vindos do resultado da Onda 3 (Knowledge ou `nexusContent`).
- Preencher ou remover as 3 abas placeholder (Temas, Autores, Coleções) com dado real ou remover a aba.
- Unificar as 4 buscas em uma implementação única (usar `SearchRegistry` se sobreviveu à Onda 3, ou consolidar em 1 hook compartilhado).
- Arquivar `/prototype-2.0/*` fora do build de produção (após decidir promoção de `Formacao.tsx`).
- Remover rótulo duplicado "Coleções".
- Reduzir providers para páginas estáticas (`/terms`, `/privacy`, `/about`).

**Critério de pronto:**
- Zero array de conteúdo hardcoded em `BibliotecaPage.tsx`.
- 1 implementação de busca (não 4).
- `/prototype-2.0/*` inacessível em produção.
- Nota geral ≥ 75/100 em nova rodada da auditoria CAT-030.

**Gate final:** rodar novamente `docs/CATHEDRA-FULL-AUDIT.md` e comparar. Nota alvo: 75+.

---

## Regras da execução

1. **Uma onda por vez.** Não abrir Onda N+1 antes de homologar Onda N.
2. **Nada fora do backlog.** Novos achados durante execução vão para a próxima rodada de auditoria, não para o PR em andamento.
3. **Toda migração de dados exige backup + script reversível.**
4. **Cada onda termina com relatório antes×depois** (métricas objetivas: contagens SQL, número de arquivos consumidores, número de rotas órfãs).
5. **ADR obrigatória para Onda 3** — a decisão A vs. B não pode ser tomada dentro do PR.

---

## Sprints explicitamente rejeitadas

Confirmadas do CAT-030 §Roadmap, não deve gastar tempo com:
- Unificar Readers em `ReaderService`/`UniversalReader` **antes da Onda 2** — construir camada sobre dados duplicados dobra o retrabalho.
- Promover `/prototype-2.0/*` inteiro antes de decidir Formação.
- Popular `nexus_relations` **antes da decisão A vs. B da Onda 3**.

---

## Estado deste documento

Congelado. Alterações requerem nova rodada de auditoria ou aprovação explícita do arquiteto de produto.
