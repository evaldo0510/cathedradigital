# FRONTEND.md — Camada Frontend

Escopo: ARC-100.

## Estado atual

### Stack

- **React 18** + **Vite 5** + **TypeScript 5**
- **Tailwind CSS v3** + **shadcn/ui** (`src/components/ui/**`, `components.json`)
- **@tanstack/react-query** para estado de servidor
- **React Router** (configuração em `src/App.tsx`, `src/config/routes.ts`, `src/navigation.config.ts`)
- **react-hook-form** + **zod** para formulários
- **Capacitor** para empacotamento mobile

### Estrutura de `src/` (snapshot atual)

Referência completa e sempre atualizada: [`../ARCHITECTURE-CODES.md#estrutura-de-diretórios--src`](../ARCHITECTURE-CODES.md#estrutura-de-diretórios--src).

Resumo dos códigos ARC por diretório:

| Diretório                        | Código ARC                        |
| -------------------------------- | --------------------------------- |
| `src/components/ui/`             | ARC-102, ARC-107, ARC-108         |
| `src/components/cathedra/`       | ARC-102 + CAT-001…CAT-010         |
| `src/components/admin/`          | ARC-102 + CAT-010, CAT-012        |
| `src/hooks/`                     | ARC-103                           |
| `src/contexts/`                  | ARC-104                           |
| `src/pages/`                     | ARC-106                           |
| `src/lib/`, `src/shared/`        | ARC-202 (compartilhado)           |
| `src/services/`                  | ARC-208                           |
| `src/integrations/supabase/`     | ARC-201, ARC-301, ARC-901         |

### Contextos ativos (ARC-104)

- `LangContext` — idioma corrente
- `ReadingSettingsContext` — tipografia, contraste, modo de leitura
- `CatechismPendingContext` — estado pendente do catecismo

### Design System (ARC-107 / ARC-108)

- Tokens em `src/index.css` + `tailwind.config.ts`
- Componentes primitivos em `src/components/ui/**`
- Todo valor de cor/espaçamento é token semântico; hardcoded (`text-white`, `bg-[#…]`) é proibido por convenção.

### Performance frontend (ARC-110)

- Lazy loading e code splitting em `src/pages/**`
- Hook `useRenderPerf` (`src/hooks/useRenderPerf.ts`)
- Prefetch controlado em `src/lib/prefetch.ts` e `src/lib/litcalPrefetchGuard.ts`
- Service worker em `src/sw.js`
- Baseline: [`../PERFORMANCE-BASELINE-v2.md`](../PERFORMANCE-BASELINE-v2.md)

### Debug em produção

- `DebugRequestPanel` (`src/components/cathedra/DebugRequestPanel.tsx`) — ativado via `?debug=requests` ou `localStorage.debug:requests=1`, com redaction automática de tokens/PII.

## Estado homologado

- shadcn/ui como base do design system.
- `@tanstack/react-query` como padrão de estado de servidor.
- Tokens semânticos em `index.css` são a fonte da verdade de cor/tipografia.
- Redaction de PII no `DebugRequestPanel` é obrigatória antes de qualquer novo painel de debug.

## Dívida técnica

- **Componentes agrupados por tipo, não por domínio** — `src/components/cathedra/` mistura Bíblia, Catecismo, Magistério, Admin. Base para a Proposta A pós-evento.
- **Testes de componente pontuais** — cobertura irregular entre `__tests__/`.
- **Sem inventário de tokens de design** — nenhum arquivo dedicado lista tokens em uso.

## Propostas pós-evento

- **Proposta A (backlog)** — Modularização por domínio em `src/modules/**`. Requer ADR próprio.
- **Proposta D (backlog)** — Refactor de componentes após estabilização.
- Inventário automático de tokens de design (gerado a partir de `index.css`).
