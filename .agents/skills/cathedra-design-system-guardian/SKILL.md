---
name: cathedra-design-system-guardian
description: Enforce Logos 2030 design system — no duplicate components, reuse primitives, hooks order, tokens only. Use for every UI change or new screen.
---

# Design System Guardian

Reuso agressivo. Zero componente novo se já existe equivalente.

## Constituição — remissão

Ver `docs/CATHEDRA-CONSTITUTION.md`. Este skill executa os artigos:
"Existe apenas um Design System", "Nenhum componente pode ser duplicado",
"Todo módulo respeita seu data-space".

## Checklist obrigatório (bloqueante)

- [ ] **Hooks sempre antes de qualquer `return`.** Nenhum `useState`/`useEffect`/`useMemo`/`useCallback`/`useRef` depois de early-return. Violação = bug de render ("Rendered more hooks than…").
- [ ] **Não criar componente se já existir equivalente.** Grep primeiro.
- [ ] **Priorizar composição em vez de duplicação.** Estender via props/densidade/variant.
- [ ] **Respeitar `data-space`** (Átrio/Igreja/Biblioteca/Claustro) via `resolveSpace.ts`.
- [ ] **Usar primitivos oficiais** antes de criar variantes: `EditorialHero`, `EditorialCard`, `Button`, `ContentSkeleton`, `PrayerPortal`, `ReaderContinuation`.
- [ ] **Não introduzir novos tokens** de cor/espaço/tipografia sem justificativa documentada.
- [ ] Tipografia via `src/styles/typography.css`. Espaçamento via `--space-*`. Cor via tokens semânticos (`--primary`, `--secondary`, `--muted`, `--foreground`, `--background`).
- [ ] Ícones apenas de `lucide-react`.

## Primitivos oficiais

| Primitivo | Uso |
|---|---|
| `ReaderShell` | Esqueleto de TODA leitura (Bíblia, CIC, Glossário, Santos, Missal, LH, Orações, Jornadas, Coleções, Magistério) |
| `ReferencePopover` | ÚNICO popover de referência inline permitido |
| `NexusPanel` | ÚNICO painel de Nexus permitido |
| `EditorialHero` | Header de página âncora |
| `EditorialCard` (`dense`/`balanced`/`minimal`) | Todos os cards |
| `Button` (shadcn) | Todos os botões |
| `ContentSkeleton` | Todo estado de loading |
| `PrayerPortal` | Toda oração |
| `ReaderContinuation` | Todo rodapé editorial |
| Lucide (`lucide-react`) | Todos os ícones |

## Reader Architecture Rule (inegociável)

Estrutura única de leitura:

```
ReaderShell
  ├─ EditorialHero
  ├─ ReaderContent (children)
  │    └─ ReferencePopover (inline)
  ├─ NexusPanel
  └─ ReaderContinuation
```

- Se existir `ReaderShell` → proibido criar outro Reader/Shell.
- Se existir `NexusPanel` → proibido criar outro Nexus (`NexusBubbles`, `MysteryNexusPanel`, `AutoNexusList`, `NexusFullList` local, etc.).
- Se existir `ReferencePopover` → proibido criar outro Popover de referência (`BibleVersePopover`, `BibleDictionaryPopover`, `TagBubble` popover, etc.).
- Toda leitura importa exclusivamente de `@/components/reader`.
- Extensão via props / render props. Nunca via novo componente paralelo.

## Antes de criar componente novo, perguntar

1. Já existe equivalente? Grep primeiro.
2. Posso estender um primitivo com prop nova?
3. É variante de um existente (nova densidade, novo tema)?
4. Se sim, o novo deve ser genérico e reusável, não one-off.

Só criar de fato após passar pelas 4 perguntas.

## Proibições

- Botão custom quando cabe `Button` variant.
- Card custom quando cabe `EditorialCard` (adicionar densidade, não componente).
- Skeleton custom quando cabe `ContentSkeleton`.
- Hero paralelo em vez de estender `EditorialHero`.
- Portal de oração paralelo (usar `PrayerPortal` + tema em `portalTheme.ts`).
- Ícone de outra lib que não Lucide.
- Cor hardcoded (`text-white`, `bg-[#...]`).
- `font-*` inline.
- Hook após early-return.

Rejeitar qualquer PR que introduza duplicata ou quebre ordem de hooks.
