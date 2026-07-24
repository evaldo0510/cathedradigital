# Pipeline Editorial Cathedra

**Versão:** 1.0.0 · **Vigente com:** Constituição 1.0.0

Fluxo oficial de produção de qualquer peça de conteúdo Cathedra. Toda mudança de estado é auditada em `editorial_pipeline_events`.

---

## Fluxo

```
Pesquisa
   ↓
Primeiro rascunho          (editorial_status = 'draft')
   ↓
Curadoria Doutrinária      (editorial_status = 'doctrinal_review')
   ↓
Curadoria Editorial        (editorial_status = 'editorial_review')
   ↓
ICE (Índice de Confiança)  (editorial_status = 'ice_pending')
   ↓
Publicação                 (editorial_status = 'published')
   ↓
Nexus                      (registro de arestas em nexus_relations)
   ↓
Biblioteca                 (indexação em LibraryItem)
   ↓
Catequese                  (opcional — inclusão em jornada/coleção)
```

---

## 1. Pesquisa

- Fontes primárias obrigatórias: **Escritura, Catecismo, Padres, Magistério**.
- Fontes secundárias: teólogos católicos reconhecidos.
- Nenhuma fonte digital sem verificação de autoridade eclesial.
- Saída: dossiê interno com citações formatadas conforme Voice Guide § 7.

## 2. Primeiro rascunho (`draft`)

- Autor produz respeitando Voice Guide e estrutura **Contexto → Doutrina → Vida → Aplicação → Oração**.
- Preenche em banco:
  - `editorial_author` (uid do autor)
  - `editorial_version = 1`
  - `constitution_version = '1.0.0'`
  - `voice_version = '1.0.0'`
  - `editorial_status = 'draft'`

## 3. Curadoria Doutrinária (`doctrinal_review`)

- Revisor doutrinário (papel `reviewer` ou `admin`) confere:
  - Ortodoxia
  - Fidelidade a Escritura, Catecismo, Padres, Magistério
  - Ausência de erro dogmático ou teologia especulativa
- Se aprovado, promove `→ editorial_review`.
- Se reprovado, retorna para `draft` com `notes` em `editorial_pipeline_events`.

## 4. Curadoria Editorial (`editorial_review`)

- Revisor editorial confere:
  - Voice Guide (vocabulário, ritmo, abertura não-enciclopédica)
  - Style Guide (tipografia, títulos, citações)
  - Estrutura dos cinco tempos
- Se aprovado, promove `→ ice_pending`.

## 5. ICE — Índice de Confiança Editorial (`ice_pending`)

- Cálculo automático via `src/lib/editorial/ice.ts` (a implementar por módulo).
- Componentes (peso indicativo, ajustado por manifesto):
  - Base bíblica (20)
  - Catecismo (20)
  - Magistério (15)
  - Padres/Doutores (10)
  - Aplicação concreta (10)
  - Oração final (10)
  - Nexus 3–8 (10)
  - Conformidade Voice/Style (5)
- Regra: `ice_score >= 95` → habilita `published`; caso contrário, retorna para `editorial_review`.

## 6. Publicação (`published`)

- Somente `reviewer`/`admin` (ou trigger `enforce_glossary_publish` no Glossário) pode promover.
- Preenche `editorial_reviewer` e `editorial_reviewed_at`.
- Emite evento em `editorial_pipeline_events` com `from_status`, `to_status`, `ice_score`.

## 7. Nexus

- Autor/revisor registra 3 a 8 arestas em `nexus_relations`, priorizando:
  1. Bíblia
  2. Catecismo
  3. Magistério
  4. Santos
  5. Orações
  6. Jornadas
  7. Glossário
  8. Liturgia

## 8. Biblioteca

- Peça publicada aparece automaticamente em `BibliotecaAcervoPage` via adapter do módulo.
- Selo `ice = 'complete'` derivado de `editorial_status = 'published' AND ice_score >= 95`.

## 9. Catequese

- Opcional. Curador de jornada decide inclusão em `journeys` / `collections`.
- Uma peça pode participar de múltiplas jornadas.

---

## Arquivamento (`archived`)

- Peça publicada que deixa de ser recomendada (obsoleta, substituída) vai para `archived`.
- Permanece acessível por URL direta, some da Biblioteca e do Nexus ativo.
- Nunca deletar — memória editorial é preservada.

---

## CHANGELOG

- **1.0.0** — 2026-07-24 — Publicação inicial.
