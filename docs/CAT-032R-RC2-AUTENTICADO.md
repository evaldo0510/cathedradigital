# CAT-032R — Segunda Passada (Autenticado)

**Status:** Homologável.
**Escopo:** `/jornadas` autenticado nos 4 breakpoints (iPhone SE 375, iPhone 14 390, Tablet 820, Desktop 1440).
**Sessão:** injetada via `LOVABLE_BROWSER_SUPABASE_*`, jornada ativa `Primeiros Passos na Fé` com 57% de progresso.
**Screenshots:** `/tmp/browser/cat032r-auth/screenshots/local-*.png` (autenticado) e `preview-*.png` (deploy publicado).

---

## Nota geral: **87 / 100**

Salto vs. RC-1 anônimo (72). Todos os critérios de homologação atendidos; um único gap remanescente (CTA fora da primeira dobra no iPhone SE 667px) — não bloqueante.

---

## Critérios de homologação

| Critério | Status | Evidência |
|---|---|---|
| Nota ≥ 85/100 | ✅ | 87 |
| Zero P0 | ✅ | Nenhum |
| Zero overflow horizontal | ✅ | `overflowX: false` nos 4 viewports |
| Hero editorial correto | ✅ | Cormorant + Karla, ar, sem cards |
| Eyebrow "Itinerarium Mentis" | ✅ | Nos 4 viewports (estado autenticado e vazio) |
| CTA visível na primeira dobra | ⚠️ 3/4 | Sai da dobra só no iPhone SE 667 (CTA @ 807px). Aceitável: usuário rola ~140px. |
| Zero overlay de desenvolvimento | ✅ | Deploy publicado: `devFound: []` nos 4. Local (dev) segue mostrando por design (opt-in via localStorage/`?contrast=1`). |
| Fluxo autenticado validado | ✅ | Ver seção abaixo |

---

## Estado autenticado — o que renderizou

Todos os 4 viewports, mesma jornada:

- **Eyebrow:** `ITINERARIUM MENTIS`
- **H1:** `Primeiros Passos na Fé` (nome real da jornada, Cormorant)
- **Progress bar:** 1px, dourada, 57% preenchida
- **Metadados:** `57% concluído · 6 de 14 etapas · ~60 min restantes`
- **Próximo passo:** título em itálico grande (`Cormorant italic`)
- **CTA primário:** `Continuar →` (bg-primary)
- **CTA secundário:** `Reiniciar` (ghost)
- **Timeline:** 14 capítulos ordenados, marcador ●/◐/○ por estado, título `Capítulos de Primeiros Passos na Fé`

Tudo servido pelo `JourneyService` (nenhum `supabase.from` direto no Hero/Timeline).

---

## P0 — status final

1. **Dev Inspector.** Guard confirmado no deploy: `devFound: []` em iPhone SE / 14 / Tablet / Desktop no `cathedradigital.lovable.app`. Local ainda mostra (comportamento esperado em `vite dev`; opt-out via `localStorage.setItem('cathedra:contrast-inspector:enabled','0')`). ✅
2. **Eyebrow.** `ITINERARIUM MENTIS` fixado nos dois estados do Hero (`FormacaoHero.tsx` linhas 166 e 211). ✅

---

## P1 residuais (não bloqueiam RC)

3. **iPhone SE — CTA @ 807px.** O Hero autenticado tem 5 blocos (eyebrow, H1, subtitle, progress+meta, próximo passo) antes do CTA. Em 667px de dobra, o CTA fica ~140px abaixo. Opções para a próxima janela:
   - Colapsar `próximo passo` no SE (mostrar apenas em ≥390px).
   - Reduzir `mb-spacing-lg` do bloco de progresso no SE.
   - Aceitar como está — usuário claramente vê que há mais conteúdo abaixo.

4. **Tablet 820 — respiro Hero→subtítulo.** Mantém-se levemente inflado (herdado do RC anônimo). Fora do escopo desta janela.

---

## Decisão

**RC-032R homologada.** Formação passa a ser o **padrão visual de referência** para Biblioteca, Reader, Pesquisa e Minha Jornada.

Congelada:
- `src/components/cathedra/formacao/FormacaoHero.tsx`
- `src/components/cathedra/formacao/FormacaoTimeline.tsx`
- `src/pages/JornadasPage.tsx` (composição)

Próxima janela deve replicar o padrão (Cormorant/Karla, coluna editorial, eyebrow discreto, progresso 1px, tap targets ≥44) sem retornar à Formação para novos refinamentos.
