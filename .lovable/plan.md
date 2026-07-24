## Sprint Coleções Temáticas

Objetivo: transformar `collections` em **jornadas de formação guiadas**, misturando módulos (Bíblia, Catecismo, Santos, Escritos, Magistério, Orações), com progresso agregado e integração ao "Continue lendo".

### Aproveitamento da infra existente

Auditei o schema — **nada a migrar em SQL**:
- `collections`: já tem `cover`, `subtitle`, `description`, `category`, `metadata` (jsonb), `featured`, `editorial_status`, `ice_score`.
- `collection_items`: já tem `order_index`, `item_type` (glossary/prayer/saint/bible/liturgy/catechism/journey), `title_override`, `metadata`.
- `collection_progress`: já tem status por item (`not_started` → `reading` → `completed`).
- Hook `useCollectionProgress` já entrega mapa de status + mutations otimistas.

Extensões vão em `metadata` (sem nova coluna):
```
metadata: {
  eyebrow, space,
  estimated_minutes: 150,
  level: 'iniciante' | 'intermediario' | 'avancado',
  editorial_goal: 'Descrição da trilha…'
}
```
Adiciono `item_type` `'magisterium'` e `'saint_work'` ao union TS (o DB é text livre).

### Ondas

**Onda 1 — Estrutura editorial + progresso agregado (esta entrega)**
- Estender `Collection.metadata` (TS) com `estimated_minutes`, `level`, `editorial_goal`.
- Refatorar `CollectionPage.tsx`: hero editorial com capa, badges (nível, tempo, nº conteúdos), botão "Começar coleção" / "Continuar coleção", barra de progresso agregada (`X/N concluídos — NN%`).
- Refatorar `CollectionItemsList.tsx`: ordem numerada, ícone por tipo (Bíblia / Catecismo / Santo / Escrito / Magistério / Oração), estado (não iniciado / lendo / concluído), CTA "Marcar como lido".
- Estender `item_type` para `'magisterium' | 'saint_work'`; ajustar `resolveNexusHref` para cada tipo.
- Novo componente `CollectionProgressBar.tsx` reutilizável.
- Integração com Acervo: `AcervoContinueReadingPanel` passa a exibir coleção em andamento quando houver.

**Onda 2 — Seed das 6 primeiras coleções oficiais** (próximo turno)
Priorizadas pelo impacto de lançamento:
1. Primeiros Passos na Fé Católica (Iniciante · 3h)
2. Introdução ao Catecismo (Iniciante · 4h)
3. Eucaristia (Intermediário · 5h) — piloto multi-corpus (Bíblia → Catecismo → Crisóstomo → Aquino → Magistério → Oração → Reflexão)
4. Doutores da Igreja (Intermediário · 8h)
5. Caminho da Quaresma (Iniciante · 6h)
6. Vida Interior (Avançado · 10h)

Cada uma nasce como `published` já com ficha editorial + itens ordenados + `nexus_refs`.

**Onda 3 — Descoberta via Nexus ao concluir** (depois)
- `CollectionCompletionCTA`: ao marcar último item como `completed`, sugere 2-3 coleções relacionadas via `nexus_relations` + link para tema no Acervo.
- Hub `/colecoes` (grid filtrado por categoria/nível).

**Onda 4 — Coleções restantes** (backlog)
Como estudar a Bíblia, Pais da Igreja, Místicos Carmelitas, Santos da Misericórdia, Santos Missionários, Tempo Pascal, Advento e Natal, A Santa Missa passo a passo, Oração, Virtudes Cristãs, Confissão.

### Fora de escopo desta sprint

- Novo admin visual (o `/admin/collections` atual já cobre CRUD; seeds via SQL insert).
- Editor drag-and-drop de itens (já existe em `CollectionEditor.tsx`).
- Dashboard admin consolidado (adiado conforme sua orientação).

### Detalhes técnicos

- Nenhuma migração SQL nesta sprint — só `INSERT` na Onda 2.
- Componentes seguem `ReaderShell`/`EditorialHero`? **Não** — `CollectionPage` é hub de trilha, não leitor; usa `EditorialCard` e tokens semânticos.
- Progresso agregado calculado no cliente a partir de `useCollectionProgress` (já otimizado).

Aprovo executar a **Onda 1** agora?
