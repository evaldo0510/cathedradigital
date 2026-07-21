# CAT-SP4 — Harmonia Arquitetônica (Logos 2030)

Sprint de unificação. Zero telas novas, zero funcionalidades. Objetivo: fazer com que Bíblia, Rosário, Diário e Home pareçam partes do mesmo edifício.

Executada em 4 ondas curtas + Sprint 4.5 (Eixo da Catedral). Cada onda tem gate visual antes da próxima.

---

## Onda A — Fundações (tokens + escalas)

Base do resto. Nada visível para o usuário ainda.

- **Tipografia única** (`src/styles/typography.css`): escala `display / h1 / h2 / h3 / lead / body / caption / meta / rubrica`. Classes `.type-display`, `.type-h1`, etc. Substitui `text-*` arbitrários dos módulos.
- **Espaçamentos** (`--space-xs` … `--space-xxl`) em `index.css`. Padrões: seção = `xxl`, bloco = `xl`, item = `m`.
- **Ícones**: normalizar Lucide para `strokeWidth={1.75}`, tamanhos `16 / 20 / 24`, gap `gap-2` obrigatório com texto. Helper `<Icon>` fino.
- **Cores por ambiente** já em `data-space="*"` — apenas formalizar a regra: dourado discreto (library), dourado vivo (church), verde suave (cloister), creme claro (atrium). Nunca misturar entre ambientes.

Gate: rodar visual em 3 telas âncora (Bíblia, Rosário, Diário) — nada deve ter regressado.

---

## Onda B — Hero Universal + Gramática de Cards

O componente que aparece em toda entrada de módulo.

- **`<CathedraHero>`** (`src/components/system/CathedraHero.tsx`):
  ```
  eyebrow → título → subtítulo editorial → metadados → ações
  ```
  Props tipadas. Aceita `space` para tomar tokens corretos. Substitui heros customizados em: Bíblia, Catecismo, Glossário, Liturgia, Missal, Rosário, Santos, Jornadas, Trilhas, Biblioteca.
- **`<CathedraCard>`** (mesmo diretório): `kicker → título → descrição → metadados → CTA`. Variantes por ambiente (não por módulo). Substitui as ~7 variações atuais de card editorial.

Gate: cada módulo migrado passa por comparação lado a lado (antes × depois). Sem drift.

---

## Onda C — Botões, Animações, Ornamentos

Reduzir a superfície.

- **Botões**: consolidar em 5 variantes finais — `primary / secondary / ghost / pill / editorial`. Auditar `variant=` fora dessa lista e migrar. Remover variantes órfãs.
- **Animações**: reduzir para 4 — `fade / lift / reveal / page-transition`. Definir em `tailwind.config.ts` e remover `animate-*` customizados espalhados.
- **Ornamentos** por ambiente:
  - Library: filete dourado, capitular, textura pergaminho nas bordas.
  - Church: halo de luz, dourado vivo, hint de vitral no hero.
  - Cloister: praticamente nenhum ornamento.
  - Atrium: limpo.
  Regra: ornamento é decidido pelo `data-space`, nunca pelo componente.

Gate: buscar `animate-`, `variant=`, `border-` em componentes e confirmar zero exceções fora do design system.

---

## Onda D — Auditoria de Sensação

Verificação humana, não técnica.

- Abrir 12 rotas âncora em sequência (2 por ambiente + trocas).
- Critério: reconhecer o ambiente em menos de 1 segundo, sem ler o título.
- Registrar em `docs/audits/sp4-harmonia.md` com screenshots antes × depois.
- Corrigir apenas o que falhar no teste de reconhecimento.

---

## Sprint 4.5 — Eixo da Catedral

Executada só depois da SP4 fechada.

- Indicador permanente do ambiente atual no header (ou sidebar em desktop).
- Discreto: ícone + label pequeno (`Átrio · Biblioteca · Igreja · Claustro`).
- Muda com `data-space` já resolvido em `resolveSpaceForPath`.
- Não interfere em nenhuma funcionalidade; reforça a sensação de percurso.

---

## Fora de escopo (explicitamente)

- Novas telas, novos módulos, novos conteúdos editoriais.
- Refatoração de dados, RLS, edge functions.
- Otimização de performance (fica para sprint dedicada depois da SP4.5).
- Transições cinematográficas entre ambientes (isso é a Sprint 5 — "Catedral Viva" que você já esboçou).

---

## Ordem sugerida de execução

1. Onda A (tokens) — 1 passo curto, aprovar visual.
2. Onda B (Hero + Cards) — maior esforço, migração módulo a módulo.
3. Onda C (botões, animações, ornamentos) — limpeza.
4. Onda D (auditoria) — validação humana.
5. Sprint 4.5 (Eixo).

Cada onda termina com um gate visual seu antes de eu iniciar a próxima. Se aprovar, começo pela Onda A.
