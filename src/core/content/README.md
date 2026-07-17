# src/core/content — Content Core (Sprint 2.0.4B-1)

Vocabulário universal de conteúdo do Cathedra 2.0.

## Por quê

Bíblia, Catecismo, Magistério, Padres, Santos, Concílios e Cânones são
conteúdos com **estrutura muito semelhante** (título, autor, corpo em
seções, referências cruzadas, navegação anterior/próximo). Historicamente
cada módulo modelou tudo do zero — o que fragmentou o produto.

O Content Core fornece:

- **Contratos universais** (`ReaderContent`, `SearchResult`, `NavigationTarget`).
- **Adapters por fonte** (`BibleAdapter`, `CatechismAdapter`, `MagisteriumAdapter`).
- **Serviço único** (`ReaderService`) que o `UniversalReader` consumirá
  na Sprint 2.0.4B-3.

## API pública

```ts
import {
  ReaderService,
  type ReaderContent,
  type SearchResult,
} from '@/core/content';

// Ler um documento
const doc: ReaderContent | null = await ReaderService.get('catechism', {
  paragraph: 1817,
});

// Busca universal
const hits: SearchResult[] = await ReaderService.search('esperança');

// Busca restrita a um domínio
const inCic = await ReaderService.searchIn('catechism', 'graça');
```

## Regra de ouro

Não pode:

- importar de `src/modules/*`
- importar Supabase, fetch, React Query, Edge Functions ou dados legados
- conhecer UI, React ou componentes

Pode:

- consumir `src/core/knowledge` (para IDs canônicos)
- consumir `src/core/navigation` (RouteRegistry via NavigationTarget)

## Estrutura

```
src/core/content/
  contracts/
    ReaderContent.ts
    SearchResult.ts
    NavigationTarget.ts
    index.ts
  adapters/
    types.ts
    BibleAdapter.ts
    CatechismAdapter.ts
    MagisteriumAdapter.ts
    index.ts
  services/
    ReaderService.ts
  __tests__/
    adapters.test.ts
    ReaderService.test.ts
  index.ts
```

## Roadmap dos adapters

| Sub-sprint | Adapters adicionados                      |
| ---------- | ----------------------------------------- |
| 2.0.4B-1   | Bible, Catechism, Magisterium (mock)      |
| 2.0.4B-2   | Fathers, Saints (mock)                    |
| 2.0.4B-3   | Councils, Canon (mock)                    |
| 2.0.5+     | Substituir mocks pelas fontes reais       |

A assinatura pública (`ReaderService`, `ContentAdapter`) permanece
estável em todas as etapas.

## Referência arquitetural

[ADR-019 — Content Core e Reader Service](../../../docs/adrs/ADR-019-content-core.md)
