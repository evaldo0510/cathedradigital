# Reader Template Master — Arquitetura Única de Leitura

**Status:** Congelada em COS v1.1 (2026-07-23).
**Fonte de verdade:** `src/components/reader/index.ts`.

## 1. Esqueleto oficial

```
ReaderShell                         ← src/components/reader/ReaderShell.tsx
  ├─ EditorialHero                  ← src/components/editorial (primitivo)
  ├─ ReaderContent (children)
  │    └─ ReferencePopover          ← src/components/reader/ReferencePopover.tsx
  ├─ NexusPanel                     ← src/components/nexus/NexusPanel.tsx
  └─ ReaderContinuation             ← src/components/shared/ReaderContinuation.tsx
```

Import canônico:

```ts
import {
  ReaderShell,
  EditorialHero,
  ReferencePopover,
  NexusPanel,
  ReaderContinuation,
} from '@/components/reader';
```

## 2. Regra permanente (COS §10)

- Existe `ReaderShell` → proibido criar outro Reader/Shell.
- Existe `NexusPanel` → proibido criar outro Nexus.
- Existe `ReferencePopover` → proibido criar outro Popover de referência.
- Extensão via props / render props. Nunca via componente paralelo.

## 3. Componentes deprecados (a extinguir)

| Deprecado | Substituir por |
|---|---|
| `src/components/cathedra/NexusBubbles.tsx` | `NexusPanel` (passivo) e `ReferencePopover` (inline) |
| `src/components/prayer/rosary/MysteryNexusPanel.tsx` | `NexusPanel` com `output` do `prayerAutoNexus` |
| `AutoNexusList` inline em `GlossaryTermPage` | `NexusPanel` |
| `NexusFullList` inline em `GlossaryTermPage` | `NexusPanel` |
| `BibleVersePopover` | `ReferencePopover kind="bible"` |
| `BibleDictionaryPopover` | `ReferencePopover kind="glossary"` |
| `TagBubble` (popover) em `TemasPage`/`TemaDetailPage` | `ReferencePopover kind="theme"` |
| `NexusInlinePreview` fora do popover canônico | `ReferencePopover` com `renderContent` |

Cada deprecado emite `console.warn` em desenvolvimento até ser removido.

## 4. Score de aderência por módulo

Métrica: percentual dos slots do Template Mestre efetivamente cobertos pelos primitivos canônicos (Shell, Hero, ReferencePopover, NexusPanel, ReaderContinuation).

| Módulo | Shell | Hero | Popover | NexusPanel | Continuation | **Score** | Débito principal |
|---|:-:|:-:|:-:|:-:|:-:|:-:|---|
| Bíblia | — | ✅ | ⚠ `BibleVersePopover` + `BibleDictionaryPopover` | ⚠ usa `NexusBubbles` | ✅ | **60%** | migrar popovers → `ReferencePopover`; substituir `NexusBubbles` por `NexusPanel` |
| Catecismo | ⚠ estrutura própria | ✅ | — | ✅ `NexusPanel` (Fase A) | ✅ | **80%** | adotar `ReaderShell` |
| Glossário | ⚠ `EditorialShell` | ✅ | — | ⚠ `AutoNexusList` + `NexusFullList` locais | ✅ | **65%** | consolidar seções Nexus em `NexusPanel` único |
| Santos | — | ✅ | — | ⚠ `NexusBubbles` | ✅ | **60%** | `NexusPanel` + `ReaderShell` |
| Missal | ✅ `PrayerPortal` (equivalente) | ✅ | — | — | ✅ | **75%** | expor slot Nexus canônico |
| Liturgia das Horas | ✅ `PrayerPortal` | ✅ | — | — | ✅ | **75%** | expor slot Nexus canônico |
| Orações (Prayer Engine) | ✅ `PrayerPortal` | ✅ | — | ⚠ `MysteryNexusPanel` (Rosário) | ✅ | **70%** | `MysteryNexusPanel` → `NexusPanel` |
| Jornadas (`JornadaStepPage`) | — | ✅ | — | ⚠ `NexusBubbles` | ✅ | **60%** | `NexusPanel` + `ReaderShell` |
| Coleções | — | ✅ | — | — | ⚠ | **50%** | adotar todos os slots |
| Magistério | — | ✅ | — | ⚠ `NexusBubbles` | ✅ | **60%** | `NexusPanel` + `ReaderShell` |

**Meta:** 100% em todos os módulos até o fim da Sprint Nexus 2.0.

## 5. Roadmap de migração (ondas)

- **Fase A (feita)** — Catecismo consome `NexusPanel`. Primitivos canônicos publicados.
- **Fase B (esta)** — Regra oficializada no COS + `cathedra-design-system-guardian`. Shims de deprecação com `console.warn`. `ReaderShell` e `ReferencePopover` disponíveis.
- **Fase C** — Migrar Glossário: substituir `AutoNexusList` + `NexusFullList` locais por `NexusPanel`; envolver com `ReaderShell`.
- **Fase D** — Migrar Bíblia: `BibleVersePopover` + `BibleDictionaryPopover` → `ReferencePopover`; `NexusBubbles` → `NexusPanel`; `ReaderShell`.
- **Fase E** — Migrar Santos, Jornadas, Magistério (mesmo padrão).
- **Fase F** — Migrar Rosário (`MysteryNexusPanel` → `NexusPanel`) e demais orações.
- **Fase G** — Remover `NexusBubbles`, `MysteryNexusPanel`, `BibleVersePopover`, `BibleDictionaryPopover` e o script `NexusInlinePreview` do repositório. Auditoria automatizada bloqueia importações fora de `@/components/reader`.

## 6. Auditoria automatizada (a criar)

Guardrail no CI (`scripts/reader-architecture-guardrail.ts`) que falha se:

- qualquer arquivo em `src/` importa componentes deprecados listados em §3;
- qualquer módulo de leitura cria `*Nexus*`, `*Popover*`, `*Reader*` fora de `@/components/reader`;
- o score de qualquer módulo cai abaixo do baseline registrado neste doc.
