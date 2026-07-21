---
name: cathedra-design-system-guardian
description: Guardião do Design System do Cathedra. Use antes de introduzir qualquer componente, botão, card, skeleton ou primitivo visual. Proíbe criação de componentes paralelos quando já existe equivalente e impõe uso exclusivo dos primitivos oficiais.
---

# Design System Guardian

Reuso agressivo. Zero componente novo se já existe equivalente.

## Primitivos oficiais (uso obrigatório)

| Primitivo | Uso |
|---|---|
| `EditorialHero` | Header de página âncora |
| `EditorialCard` (`dense`/`balanced`/`minimal`) | Todos os cards |
| `Button` (shadcn) | Todos os botões |
| `ContentSkeleton` | Todo estado de loading |
| Typography scale (`src/styles/typography.css`) | Toda tipografia |
| Spacing scale (`--space-1..12`) | Todo espaçamento |
| Tokens semânticos (`--primary`, `--secondary`, `--muted`, `--foreground`, `--background`) | Toda cor |
| `PrayerPortal` | Toda oração |
| `ReaderContinuation` | Todo rodapé editorial |
| Lucide (`lucide-react`) | Todos os ícones |

## Antes de criar componente novo

Perguntar:
1. Já existe equivalente? Grep primeiro.
2. Posso estender um primitivo com prop nova?
3. É variante de um existente (nova densidade, novo tema)?
4. Se não, o componente novo deve ser genérico e reusável, não one-off.

Só criar de fato após passar pelas 4 perguntas.

## Proibições

- Botão custom quando cabe `Button` variant.
- Card custom quando cabe `EditorialCard` com densidade nova (adicionar densidade, não componente).
- Skeleton custom quando cabe `ContentSkeleton`.
- Hero paralelo em vez de estender `EditorialHero`.
- Portal de oração paralelo (usar `PrayerPortal` + tema em `portalTheme.ts`).
- Ícone importado de outra lib (só Lucide).
- Cor hardcoded em qualquer forma.
- `font-*` inline.

## Checklist

- [ ] Todos os cards são `EditorialCard`
- [ ] Todos os botões são `Button`
- [ ] Todos os loadings são `ContentSkeleton`
- [ ] Toda tipografia via escala
- [ ] Todo espaçamento via `--space-*`
- [ ] Toda cor via token semântico
- [ ] Todo ícone via Lucide
- [ ] Nenhum componente duplicado criado nesta mudança

Rejeitar qualquer PR que introduza duplicata.
