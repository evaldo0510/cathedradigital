# Sprint Zero — Auditoria 3: Dependências Externas

**Modo:** read-only.
**Data:** 2026-07-04
**Escopo:** APIs externas, IA, CDNs de fonte, chamadas HTTP em runtime crítico.

---

## Resumo em uma tela

| Categoria | Status | Risco |
|---|---|---|
| `bolls.life` (BollsLife) | 🔴 **Vivo em runtime** (`bible-text` prod) e em seed | Alto — bloqueia S1 |
| `bibliacatolica.com.br` | 🟡 Vivo como fallback deuterocanônico | Médio — bloqueia S1 |
| `bible-api.com` | ✅ Zero ocorrências | — |
| `esm.sh` | ✅ Zero ocorrências | — |
| Google Gemini direto | 🔴 **5 edge functions** com fetch direto (bypassa AI Gateway) | Alto |
| AI Gateway Lovable | 🟢 Presente em 4 funções (padrão correto) | — |
| `aiService.ts` (client) | 🟡 Neutralizado mas ainda importado | Baixo |
| Google Fonts CDN | 🟡 4 famílias via CDN no `index.html` | Médio (perf/soberania) |
| Outros CDNs (jsdelivr/unpkg) | ✅ Zero | — |

---

## 1. BollsLife — bloqueio principal da S1

| Arquivo | Linha | Uso | Ação | Risco |
|---|---|---|---|---|
| `supabase/functions/bible-text/index.ts` | 399 | `fetch('https://bolls.life/get-chapter/NAA/...')` em runtime — **caminho quente do leitor**. | **Substituir por leitura do banco local** (`bible_verses`) como fonte única. | 🔴 Alto — quebra leitor se banco local incompleto. |
| `supabase/functions/bible-text/index.test.ts` | 51, 104 | Testes batendo em bolls.life. | **Reescrever para mockar banco local.** | Baixo |
| `scripts/seed-bible.ts` | 80, 159 | Seed dos 66 protocanônicos (NAA) via bolls.life. | **Arquivar após S1** (banco já semeado). | Baixo |

**Bloqueio S1:** enquanto `bible-text` cair no fetch de bolls.life, a Bíblia **não é soberana**. Prioridade #1 da Sprint 1.

---

## 2. bibliacatolica.com.br — fallback deuterocanônico

| Arquivo | Linha | Uso | Ação | Risco |
|---|---|---|---|---|
| `supabase/functions/bible-text/index.ts` | 458 | Scrape HTML dos deuterocanônicos. | **Substituir por banco local** (garantir 73 livros semeados). | 🔴 Alto — Ave-Maria é a tradução dos 7 deuterocanônicos exigidos. |
| `supabase/functions/bible-import-deutero/index.ts` | 31 | Importador one-shot. | **Arquivar após S1**. | Baixo |

**Nota crítica S1:** os 7 livros deuterocanônicos exigem que `bible_verses` contenha Tobias, Judite, Sabedoria, Eclesiástico, Baruc, 1 e 2 Macabeus **em Ave-Maria** antes de qualquer remoção.

---

## 3. Google Gemini direto (bypassa AI Gateway)

| Função | Linha | Problema | Ação | Risco |
|---|---|---|---|---|
| `logos-spiritual-insight` | 110 | Fetch direto ao Gemini com `GOOGLE_API_KEY`. Tem também Gateway na linha 138. | **Remover branch Gemini direto** — usar só Gateway. | Médio |
| `colloquium` | 138 + 239 | Idem — dupla via. | **Remover branch Gemini direto.** | Médio |
| `logos-ai` | 136 + 171 | Idem — dupla via. | **Remover branch Gemini direto.** | Médio |
| `spiritual-continuity` | 84 | Só Gemini direto, sem fallback Gateway. | **Migrar para Gateway.** | Médio |
| `search-saint` | 75 + 100 | Dupla via. | **Remover branch Gemini direto.** | Médio |

**Por que consolidar:** o AI Gateway já cobre chat/embeddings/imagem sem chave própria, gera métricas centralizadas e evita vazamento de `GOOGLE_API_KEY` em múltiplos pontos. Manter Gemini direto quebra o princípio de "IA controlada pelo Gateway".

**Bloqueio:** essas funções pertencem ao roadmap S5 (Logos AI). Sugiro **congelar as 5 funções agora** (retornar 503 ou desabilitar rota) e reescrever só quando S5 abrir. Assim removemos o risco de vazamento sem tocar em produto ativo.

---

## 4. Client-side `aiService.ts`

| Arquivo | Uso | Ação | Risco |
|---|---|---|---|
| `src/services/aiService.ts` | Já neutralizado (retorna vazio/mock). | **Manter até S5** (não remover ainda — ver abaixo). | — |
| `src/components/cathedra/NexusBubbles.tsx` | Importa `getSpiritualInsight`. | Se `aiService` for removido, precisa remover call site. | Baixo |
| `src/components/cathedra/StudyMode.tsx` | Importa `callColloquium`. | Idem. | Baixo |
| `NexusBubbles.test.tsx` + `NexusBubbles.interaction.test.tsx` | Mockam `aiService`. | Atualizar mocks quando remover. | Baixo |

**Recomendação:** manter `aiService.ts` neutralizado. Remoção física só quando S5 redesenhar a integração — remover agora obriga refatorar `NexusBubbles` e `StudyMode` sem ganho imediato.

---

## 5. Google Fonts CDN (`index.html`)

| Local | Uso | Ação | Risco |
|---|---|---|---|
| `index.html:9-11` | Preconnect + CSS carregando **4 famílias** (Cinzel, Inter, Merriweather, Playfair Display) com múltiplos pesos. | **Self-host** via `@fontsource/*` ou copiar `.woff2` para `public/fonts/`. | 🟡 Médio — dependência de rede externa + LCP + privacidade (Google trackeia IPs). |

**Impacto:** cada visita disparara 2 requisições cross-origin bloqueantes. Self-host melhora LCP, elimina rastreio Google e alinha com "soberania de dados".

**Escopo:** fora da Sprint Zero (é otimização, não limpeza). Registrar como candidato para S2 (Leitura Premium — perf).

---

## 6. Fetches externos legítimos (manter)

| Função | URL | Justificativa |
|---|---|---|
| `elevenlabs-tts` | `api.elevenlabs.io` | TTS por design. |
| `mercadopago-*` (3) | `api.mercadopago.com` | Pagamento por design. |
| `vatican-document` | `vatican.va` (com allowlist de hostname) | Fonte oficial do Magisterium. |
| Funções AI que usam **só** `ai.gateway.lovable.dev` | Gateway | Padrão correto. |

---

## Matriz de decisão — prioridade

| Prioridade | Item | Motivo | Sprint |
|---|---|---|---|
| P0 | `bible-text` → banco local (remover bolls.life + bibliacatolica) | Desbloqueia S1 | **S1** |
| P0 | Congelar 5 funções AI que chamam Gemini direto | Vazamento de chave, fora do roadmap ativo | **Zero** |
| P1 | Arquivar seeds one-shot (`seed-bible`, `bible-import-deutero`) | Reduz superfície após S1 | **S1** |
| P2 | Self-host Google Fonts | Perf + soberania | **S2** |
| P3 | Remover `aiService.ts` e call sites | Só quando S5 redesenhar IA | **S5** |

---

## Ações imediatas propostas (Sprint Zero)

Nenhuma remoção física ainda — proponho **1 ação cirúrgica de segurança agora**:

**Congelar** as 5 edge functions que chamam Gemini direto: adicionar early-return `503 { error: "AI temporarily disabled" }` no início de cada handler. Isso:
- Elimina risco de vazamento de `GOOGLE_API_KEY` (bypass do Gateway).
- Não remove código (S5 vai reescrever mesmo).
- Não afeta client — o `aiService` já está neutralizado.

**Não proponho tocar em `bible-text` nesta sprint** — é trabalho de S1, exige garantir os 73 livros no banco antes.

---

## Aguardando aprovação

1. Aprovar **congelamento das 5 funções AI** agora (Sprint Zero)?
2. Confirmar que **`bible-text` fica intocado** até início oficial da S1?
3. Google Fonts self-host — mover para backlog de S2 ou tratar agora?
