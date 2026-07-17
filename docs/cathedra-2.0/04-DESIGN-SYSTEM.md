# Cathedra 2.0 — Design System v2

Fundação visual e de interação. Valores concretos.
Todos os tokens são semânticos e vivem em `index.css` + `tailwind.config.ts`.
**Regra dura:** nenhum componente usa cor crua (`text-white`, `bg-[#…]`). Sempre token.

---

## 1. Grid & Layout

- **Base:** 4pt (todo espaçamento é múltiplo de 4).
- **Container fluido**, largura máxima de leitura litúrgica: **68ch** (corpo de texto).
- **Breakpoints:**
  - `sm` 360 (mobile de referência)
  - `md` 768 (tablet)
  - `lg` 1024 (desktop)
  - `xl` 1440 (desktop amplo)
- **Colunas:** mobile 4 · tablet 8 · desktop 12. Gutter 16px mobile, 24px desktop.
- **Safe areas:** respeitar `env(safe-area-inset-*)` (iOS notch + bottom-nav).

---

## 2. Espaçamento (semântico)

Nunca valores arbitrários em componente.

| Token | rem | px | Uso |
|---|---|---|---|
| `spacing-xs` | 0.25 | 4 | ícone-texto |
| `spacing-sm` | 0.5 | 8 | dentro de chip/badge |
| `spacing-md` | 1 | 16 | padding padrão de card |
| `spacing-lg` | 1.5 | 24 | separação entre blocos |
| `spacing-xl` | 2 | 32 | separação entre seções |
| `spacing-2xl` | 3 | 48 | respiro entre experiências |
| `spacing-3xl` | 4.5 | 72 | topo/base de tela contemplativa |

---

## 3. Tipografia

**Par único.** Nunca Inter/Poppins. Nunca serif genérica.

- **Display / Leitura litúrgica:** `Cormorant Garamond` (serifada humanista, respiração longa).
- **UI / Corpo funcional:** `Work Sans` (sans-serif geométrica, legível em 12–14px).
- **Monospace (código/refs):** `IBM Plex Mono` (rara — só refs bíblicas em busca).

Escala modular 1.25 (Perfect Fourth).

| Token | Tamanho | Line | Uso |
|---|---|---|---|
| `text-xs` | 12 | 1.4 | metadados, badges |
| `text-sm` | 14 | 1.5 | UI, labels |
| `text-base` | 16 | 1.6 | corpo funcional |
| `text-lg` | 18 | 1.7 | corpo litúrgico (Bíblia, CIC) |
| `text-xl` | 20 | 1.5 | subtítulos |
| `text-2xl` | 24 | 1.4 | título de seção |
| `text-3xl` | 30 | 1.3 | título de tela |
| `text-4xl` | 40 | 1.2 | display Átrio |
| `text-5xl` | 56 | 1.1 | display raro (celebração) |

**Regras**
- Corpo litúrgico sempre em Cormorant, `text-lg`, `leading-relaxed`.
- Nunca texto justificado (river effect prejudica leitura).
- Números de versículo/parágrafo em Work Sans `text-xs`, cor `--muted-foreground`.

---

## 4. Cores (semânticas, HSL)

Base viva na memória do projeto: primário `#0B1F3A`, secundário `#C8A96A`. Convertidos para HSL e expandidos.

### Paleta core

```css
:root {
  /* Base */
  --background:         30 20% 98%;   /* pergaminho */
  --foreground:         218 65% 12%;  /* tinta */

  /* Superfícies */
  --surface:            30 20% 96%;
  --surface-reading:    36 30% 97%;   /* fundo de leitura litúrgica */
  --surface-elevated:   0 0% 100%;

  /* Marca */
  --primary:            218 65% 14%;  /* #0B1F3A */
  --primary-foreground: 30 20% 98%;
  --secondary:          38 42% 60%;   /* #C8A96A ouro */
  --secondary-foreground: 218 65% 12%;

  /* Estados */
  --muted:              30 10% 92%;
  --muted-foreground:   218 15% 40%;
  --accent:             38 42% 60%;
  --destructive:        0 60% 45%;
  --border:             30 15% 88%;
  --ring:               218 65% 30%;

  /* Litúrgico (ambient light) */
  --liturgical-verde:    140 30% 40%;
  --liturgical-roxo:     280 30% 40%;
  --liturgical-branco:   0 0% 95%;
  --liturgical-vermelho: 0 55% 45%;
  --liturgical-rosa:     340 40% 65%;
  --liturgical-preto:    0 0% 10%;
}

.dark {
  --background:         218 40% 8%;
  --foreground:         30 15% 92%;
  --surface:            218 35% 10%;
  --surface-reading:    218 30% 12%;
  --surface-elevated:   218 30% 14%;
  --primary:            38 42% 65%;    /* ouro protagoniza no dark */
  --primary-foreground: 218 65% 10%;
  --secondary:          218 40% 20%;
  --muted:              218 20% 18%;
  --muted-foreground:   30 10% 65%;
  --border:             218 25% 20%;
  --ring:               38 42% 65%;
}
```

### Cor litúrgica = ambient light, não fundo

Aparece **apenas** como linha superior 2px na tela do dia:
```css
.liturgical-ambient { border-top: 2px solid hsl(var(--liturgical-verde)); }
```
Muda automaticamente com o tempo litúrgico. Nunca invade conteúdo.

### Sem "acento por experiência"

Decisão da Revisão Arquitetônica: **não** introduzir tokens de temperatura por cômodo até validar com uso real. Todas as experiências compartilham a mesma paleta.

---

## 5. Elevação & Sombra

Duas sombras. Nada mais.

```css
--shadow-sm: 0 1px 2px hsl(var(--foreground) / 0.05);
--shadow-md: 0 4px 12px hsl(var(--foreground) / 0.08);
```

Modo Prece: sombra **zero**.

---

## 6. Raio

- `--radius-sm` 6px (botão, chip)
- `--radius-md` 12px (card)
- `--radius-lg` 20px (bottom-sheet, modal)
- `--radius-full` 9999px (avatar, pill)

---

## 7. Cartões (dois tipos, apenas)

### Cartão de Leitura
Foco no texto. Sem sombra. Fundo `--surface-reading`. Padding `spacing-lg`. Sem hover.
Uso: versículo bíblico, parágrafo CIC, verbete.

### Cartão de Ação
Foco no toque. `--shadow-sm` no repouso, `--shadow-md` no hover. Fundo `--surface-elevated`. Padding `spacing-md`. `--radius-md`.
Uso: entrada de jornada, sugestão do Átrio, item de catálogo.

Proibido: terceira variante sem ADR.

---

## 8. Ícones

- Biblioteca única: **Lucide Icons**, peso **1.5**, tamanhos 16 / 20 / 24 / 32.
- Toque mínimo **44×44px** (área clicável, não o ícone).
- Ícone decorativo tem `aria-hidden="true"`; ícone-botão tem `aria-label`.

Regra: nunca dois ícones para o mesmo conceito no app.

---

## 9. Navegação (padrões)

### Mobile — Bottom Nav
5 itens fixos, altura 56px + safe-area. Ícone + label `text-xs`. Item ativo: cor `--primary`, indicador de 3px acima.

Ordem: **Átrio · Estudar · Rezar · Formar · Jornada**.
Pesquisar não fica no bottom-nav (é ⌘K/header).

### Desktop — Sidebar
Colapsável (rail 64px / expandido 240px). Mesmos 5 itens. Sub-navegação contextual abre dentro da tela, não na sidebar.

### Header universal
Altura 56px mobile / 64px desktop.
`[Logo · breadcrumb curto] ················ [⌘K · Nexus toggle · Perfil]`

### Modo Prece
Bottom-nav some (translate-y-full + fade). Header colapsa para só o "sair". Popovers desligados. Notificações pausadas.

---

## 10. Motion

- **Duração:** `120ms` (micro), `240ms` (transições de tela), `480ms` (entrada contemplativa).
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (padrão), `ease-linear` só em progresso.
- **Respeitar `prefers-reduced-motion`**: reduzir a fade-only.
- Nunca animar durante Modo Prece.

---

## 11. Formulários

- Altura mínima 44px.
- Label sempre visível (nunca só placeholder).
- Erro com ícone + texto + `aria-describedby`.
- Contraste do foco AA mínimo, foco visível **sempre** (nunca `outline: none` sem replacement).

---

## 12. Acessibilidade (inegociável)

- Contraste **AAA** em corpo litúrgico (`text-lg`).
- Contraste **AA** em UI (`text-sm/base`).
- Ordem de tab lógica; skip link "pular para conteúdo".
- Screen reader: cada experiência anuncia landmark (`<main aria-label="Átrio">`).
- Toque mínimo 44×44.
- Legendas para todo áudio (`public/subtitles/*.vtt` já existe).

---

## 13. Tokens — convenção de nome

Sempre semântico, nunca físico.

| ✅ | ❌ |
|---|---|
| `--surface-reading` | `--cream-100` |
| `--liturgical-verde` | `--green-600` |
| `--shadow-md` | `--shadow-elegant` |
| `spacing-lg` | `p-6` cru em componente |

---

## 14. O que fica proibido

- Cor hex ou nome literal (`text-white`, `bg-black`) em componente.
- Sombra customizada inline.
- Terceira família tipográfica sem ADR.
- Nova variante de cartão sem ADR.
- Font awesome, heroicons ou qualquer segunda biblioteca de ícones.
- Modal fullscreen no mobile para busca (usar overlay).
- Popup/banner em Modo Prece.

---

## 15. Entregáveis técnicos (próxima fase, não agora)

1. Atualizar `src/index.css` com as variáveis desta especificação.
2. Atualizar `tailwind.config.ts` com tokens semânticos.
3. Adicionar Cormorant Garamond + Work Sans (self-hosted, sem Google Fonts em runtime).
4. Auditar componentes existentes: remover cores cruas, migrar para tokens (ferramenta já existe: `scripts/audit-visual-system.ts`).
5. ADR-012 "Design System v2 — pareamento tipográfico e paleta AAA".
