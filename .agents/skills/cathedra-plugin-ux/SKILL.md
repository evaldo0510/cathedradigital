---
name: cathedra-plugin-ux
description: Plugin UX do Cathedra OS. Ativar quando a tarefa envolver Design System Harmony, Logos 2030, EditorialHero, EditorialCard, ContentSkeleton, PrayerPortal (visual), data-space, resolveSpace, Átrio/Igreja/Biblioteca/Claustro, typography.css, tokens semânticos, mobile, acessibilidade, sidebar, layout shell, área do usuário /conta/*, ou qualquer alteração visual do Cathedra.
---

# Plugin UX

Responsabilidades:
- **Design System Harmony (Logos 2030)** — identidade visual oficial.
- **Primitivos** — `EditorialHero`, `EditorialCard` (densidades: dense/balanced/minimal), `ContentSkeleton`, `Button` shadcn.
- **Spaces** — Átrio, Igreja, Biblioteca, Claustro (via `resolveSpace.ts` + `data-space`).
- **Typography** — `src/styles/typography.css` (nunca hardcoded).
- **Tokens semânticos** — `--primary`, `--secondary`, `--muted`, `--foreground`, `--background`.
- **Spacing scale** — `--space-1..12`.
- **Ícones** — Lucide sólidos, sem emojis.
- **Mobile-first** — safe-areas, targets ≥ 48px, mobile ≤ 640px sempre testado.
- **A11y** — contraste AA, foco visível, `aria-label` em ícones, alt significativo.

Proibições:
- Cores hardcoded (`text-white`, `bg-[#...]`).
- Gradientes roxos/indigo genéricos de IA.
- Fontes fora da escala (Inter/Poppins default).
- Componente novo quando existe primitivo equivalente.
- `<font-*>` inline.

Antes de agir:
1. Grep por componente equivalente antes de criar novo.
2. Se novo componente é inevitável → justificar por que não coube em primitivo existente.
3. Aplicar `data-space` correto via `resolveSpace`.
4. Testar mentalmente em 375×667 antes de declarar pronto.
