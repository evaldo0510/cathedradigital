# Plano — Sprint Editorial (continuação)

Quatro pedidos empacotados em uma única mensagem. Vou executá-los na ordem que respeita a sequência que combinamos (tipografia primeiro, validação antes de novas features, Formação por último por ser a maior refatoração), e entrego cada etapa com validação antes de avançar para a próxima.

## Etapa 1 — Tipografia responsiva (Reader, /buscar, Formação)
Base para as demais etapas: sem isso, refatorar Formação em mobile viraria retrabalho.

- Criar utilitário `.editorial-column-responsive` em `src/index.css` derivado do `--reading-column` atual:
  - `max-width: min(68ch, 100%)` no desktop
  - `max-width: min(62ch, 100%)` no tablet (`md`)
  - `max-width: min(56ch, 100%)` + padding lateral `1.25rem` no mobile
- Ajustar escalas tipográficas:
  - Reader: `text-lg md:text-xl` no corpo, `leading-relaxed` → `leading-[1.75]` no mobile
  - `/buscar`: mesma escala do Reader nos títulos dos cards; subtítulos serifa itálica
  - Formação: aplicar o mesmo wrapper
- Touch targets: revisar botões e links do Reader, `/buscar` e nav do Átrio para garantir `min-h-[44px] min-w-[44px]` em `< md`.

Arquivos: `src/index.css`, `src/pages/Catechism.tsx`, `src/pages/Bible.tsx`, `src/pages/GlobalSearchPage.tsx`, `src/components/search/SearchResultCard.tsx`.

Validação: Playwright em 375×812 (mobile) e 768×1024 (tablet), screenshots do Reader (`/catechism?p=1`), `/buscar?q=Maria` e `/formacao`.

## Etapa 2 — Validar /buscar com termo real
Antes de plugar novas ações, confirmo que a Etapa 1 ficou correta.

- Abrir `/buscar?q=Maria` via Playwright, capturar mobile + desktop.
- Checklist: hierarquia (título display > subtítulo itálico > trecho), respiro entre cards, largura de leitura.
- Se algo estiver fora, ajusto antes de seguir.

## Etapa 3 — Ações compartilhadas no /buscar
Reaproveitar o mesmo componente já usado no Reader.

- Localizar o componente de ações do Reader (provavelmente `ReaderActions` ou similar dentro de `src/components/reader/`).
- Se hoje ele estiver acoplado ao contexto do Reader, extrair para `src/components/shared/PassageActions.tsx` com props:
  - `reference: string`
  - `text: string`
  - `sourceUrl: string`
  - Ações: copiar trecho, copiar referência, destacar, compartilhar (Web Share API com fallback).
- Substituir uso interno no Reader por esse componente.
- Adicionar em `SearchResultCard.tsx` no rodapé de cada card.
- Persistência de destaque: reutilizar `useReadingMarks` se aplicável ao contexto de busca; caso contrário, destaque local + toast.

Validação: teste manual via Playwright (copiar → checar clipboard, compartilhar → checar chamada da API, destacar → checar persistência).

## Etapa 4 — Formação como “Estudo Composto”
Refatoração da seção `/formacao` seguindo a hierarquia do Reader.

Estrutura por unidade de estudo:
```text
┌─────────────────────────────────────────┐
│ KICKER   (série · nº unidade)           │
│ TÍTULO   (display serif)                │
│ SUBTÍTULO (serifa itálica)              │
├─────────────────────────────────────────┤
│ Citação de abertura (blockquote)        │
│ Corpo editorial (coluna 62ch)           │
│ Fontes primárias vinculadas             │
│   → Cards de Bíblia / Catecismo / Mag.  │
│ Nexus lateral (referências cruzadas)    │
│ Ação: “Continuar leitura” (Reader)      │
└─────────────────────────────────────────┘
```

- Consumir dados via `KnowledgeEngine` (referências temáticas) e `ReaderService` (previews de trechos), sem duplicar fetch.
- Cards de fonte primária clicáveis abrindo o Reader correspondente na mesma aba, preservando `ref` de retorno.
- Nexus lateral usando o Popover existente.
- Remover cards antigos que não seguem essa hierarquia.

Arquivos previstos: `src/pages/Formacao.tsx` (ou equivalente), novos `src/components/formacao/StudyUnit.tsx`, `PrimarySourceCard.tsx`.

Validação: screenshots desktop + mobile, checar que "Continuar leitura" navega para Reader com `ref` e que Nexus abre ancorado.

## Ordem de entrega
1. Etapa 1 → screenshots antes/depois
2. Etapa 2 → screenshot `/buscar?q=Maria`
3. Etapa 3 → demo das 4 ações
4. Etapa 4 → screenshots da nova Formação

Confirma essa ordem para eu começar pela Etapa 1?
