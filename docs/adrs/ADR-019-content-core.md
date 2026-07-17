# ADR-019: Content Core e ReaderService

- **Status:** Aceita
- **Data:** 2026-07-17
- **Autores:** Arquitetura Cathedra 2.0
- **Códigos relacionados:** Sprint 2.0.4B-1

---

## Contexto

Cathedra 1.x cresceu por módulos (`bible`, `catechism`, `magisterium`,
`fathers`, `saints`, `councils`, `canon`). Cada um modelou dados,
navegação e busca à sua maneira. O resultado:

- Componentes de leitura duplicados (Bible viewer ≠ CIC viewer ≠
  Magistério viewer) com regras próprias.
- Buscas incompatíveis, cada uma com sua shape de resultado.
- Referências cruzadas quebradas quando o formato de destino diverge.
- Impossibilidade de reusar sidebar, notas, highlights e IA sem custo
  linear por módulo.

A Sprint 2.0.4 consolidou o núcleo semântico (Knowledge Engine) e o
núcleo de navegação (Registries). Falta a **camada de conteúdo**:
onde Bíblia, CIC e Magistério param de ser silos e passam a expor um
contrato único.

## Decisão

Criar `src/core/content/` como camada de domínio puramente aditiva,
organizada em três blocos:

```
                 ReaderService  (única API consumida por UI)
                       │
        ┌──────────────┼───────────────┐
        ▼              ▼               ▼
   BibleAdapter  CatechismAdapter  MagisteriumAdapter
        │              │               │
        └──────────────┴───────────────┘
                       ▼
              ContentAdapter (contrato)
                       ▼
     ReaderContent · SearchResult · NavigationTarget
```

Regras invioláveis:

1. **ReaderService é o único ponto de entrada.** UI e módulos consomem
   apenas `ReaderService` (e os tipos de contrato). Adapters concretos
   são detalhes de implementação — podem ser trocados por reais na
   Sprint 2.0.5+ sem mudar consumidores.
2. **`ReaderContent` é a shape universal.** Bíblia, CIC e Magistério
   produzem exatamente o mesmo formato: `id + kind + title + sections +
   metadata + navigation`. O `UniversalReader` (2.0.4B-3) saberá
   renderizar qualquer `ReaderContent` sem `if (kind === …)`.
3. **`SearchResult` é a shape universal de hit.** `UniversalSearch`
   (2.0.4B-3) recebe hits heterogêneos numa única lista.
4. **IDs canônicos.** `ReaderContent.id` e `SearchResult.nodeId` usam
   o formato do Knowledge Engine (`<kind>:<slug>[:<sub>...]`).
5. **Independência.** Nenhuma importação de `src/modules/*`, UI,
   Supabase, `fetch`, React Query ou Edge Functions. A única
   dependência externa autorizada é `@/core/knowledge` (para IDs) e
   `@/core/navigation` (via `NavigationTarget`).
6. **Substituição transparente.** Nesta sprint os adapters usam seeds
   estáticos. Na Sprint 2.0.5 as implementações reais substituem os
   mocks sem alterar a assinatura pública.

## Consequências

Positivas

- `UniversalReader`, `UniversalSearch`, `KnowledgeSidebar` e futuras
  features (bookmarks, notas, highlights, IA, offline) implementam
  contra **um único contrato** — custo constante para adicionar novos
  tipos de conteúdo (Padres, Santos, Concílios, Cânones).
- Legado 1.x continua funcionando enquanto a migração é feita em
  sub-sprints (`Fathers/Saints` em 2.0.4B-2, `Councils/Canon` em
  2.0.4B-3, migração de telas em 2.0.4B-3, real data em 2.0.5).
- Testes unitários por adapter e no serviço isolam regressões de
  fonte de dados.

Negativas / trade-offs aceitos

- Adapters mock duplicam dados que já existem em `src/data/*` e nas
  edge functions. Aceito porque a duplicação é temporária (uma sprint)
  e evita acoplamento do Core ao legado.
- Consumidores precisam adotar `ReaderService` gradualmente. Enquanto
  isso, `MagisteriumViewer`, `CatechismExplorer` etc. seguem no padrão
  antigo. Sub-sprint 2.0.4B-3 fará a migração.

## Alternativas consideradas

- **`UniversalReader` acoplado a cada módulo.** Rejeitado: mantém
  duplicação, apenas move para dentro do componente.
- **Migrar tudo direto para Supabase views + tipos gerados.** Rejeitado:
  acopla o domínio de UI ao schema de banco, exatamente o problema que
  o Content Core resolve.
- **Adapter único que decide pelo `kind` internamente.** Rejeitado:
  reintroduz o `switch (kind)` que queremos eliminar.

## Referências

- `src/core/content/README.md`
- `src/core/content/services/ReaderService.ts`
- `src/core/content/contracts/ReaderContent.ts`
- ADR-018 — Knowledge Engine
- `docs/cathedra-2.0/MARCO-A-ATRIO.md`
