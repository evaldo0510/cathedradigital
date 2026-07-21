# Sprint 1 · Onda B — Centro de Meditação Litúrgica

Transforma a página `/liturgia` de leitor de textos em um roteiro editorial completo: cada dia passa a ter tema, chave de leitura, Tradição (Padres/Catecismo/Magistério), Meditação Logos (Observe/Reflita/Reze/Viva), oração final, "Na História da Igreja", ação do dia e continuação Nexus — tudo gerado uma vez por dia e reutilizado por todos os usuários.

---

## 1. Backend — geração idempotente e cacheada

### Nova tabela `liturgy_meditations`
Chave por `iso_date`. Um único registro atende todos os leitores daquele dia.

```
iso_date            date primary key
readings_hash       text        -- SHA-1 das leituras normalizadas
theme               text
reading_key         text
fathers             jsonb       -- [{ author, work, reference, quote }]
catechism           jsonb       -- [{ paragraph, quote }]
magisterium         jsonb       -- [{ document, pope, section, quote }]
logos               jsonb       -- { observe, reflect, pray, live }
final_prayer        text
church_history      jsonb       -- { saint?, council?, pope?, document? }
action_of_day       text
model               text        -- ex.: 'google/gemini-2.5-flash'
generated_at        timestamptz
```

- RLS: `SELECT` público (`anon` + `authenticated`); `INSERT/UPDATE` apenas `service_role`.
- GRANTs completos para `anon`, `authenticated`, `service_role`.

### Edge Function `liturgy-meditation`
Contrato mínimo: recebe as leituras já resolvidas + a data ISO; devolve o registro.

Fluxo:
1. `SELECT` em `liturgy_meditations` por `iso_date`; se existir e o `readings_hash` bater, devolve direto.
2. Chama Lovable AI (`google/gemini-2.5-flash`) via `@ai-sdk/openai-compatible` com `generateText` + `Output.object` (schema Zod) — provider helper `_shared/ai-gateway.ts`.
3. `UPSERT` do resultado com `service_role`; devolve payload.

Regras editoriais no `system prompt`:
- Sempre citar Padres com autor + obra + referência real (nada inventado quando não conhecer — devolve lista vazia).
- Catecismo: apenas parágrafos numerados existentes.
- Magistério: apenas documentos oficiais reais.
- Português (pt-BR), tom contemplativo, sem "IA falando".
- Meditação Logos: exatamente 4 campos (Observe/Reflita/Reze/Viva), 2–3 frases cada.

### Custo/limites
- Uma geração/dia global (não por usuário).
- Retries: 1 tentativa; se `402/429` → devolve `503` e a UI degrada silenciosa (esconde o bloco).

---

## 2. Frontend — hook + primitivas + integração

### `useLiturgyMeditation(date, readings)`
- React Query, `queryKey: ['liturgy-meditation', isoDate]`.
- Dispara apenas depois que `useDailyLiturgy` retornou (dependência: `enabled: !!readings?.evangelho`).
- `staleTime`: 24h. Cache offline no mesmo IndexedDB (`cacheLiturgy(`meditation:${iso}`)`).

### Novas primitivas em `src/components/cathedra/primitives/liturgy/`
Todas seguindo o padrão `premium-card` já usado nos Reading Cards:

- `LiturgyThemeCard` — Tema do Dia (headline + kicker).
- `LiturgyReadingKeyCard` — Chave de leitura (fio condutor das 3 leituras).
- `LiturgyTraditionBlock` — Padres · Catecismo · Magistério em 3 subseções com links (`/catecismo?p=NNN`, `/magisterium/{slug}`).
- `LogosMeditationCard` — Observe / Reflita / Reze / Viva em 4 sub-blocos com ícones.
- `FinalPrayerCard` — Oração final destacada, com botão "Rezar agora" (abre `/oracoes` ou lê em `PrayerEngineReader` futuramente).
- `ChurchHistoryCard` — Santo/Concílio/Papa/Documento (bloco extra pedido pelo usuário).
- `ActionOfDayCard` — Prática concreta, tom direto.

### Integração em `LiturgiaPage.tsx`
Ordem final da aba Liturgia:

1. `LiturgyDateNav` + `LiturgyDayHeader` *(Onda A)*
2. Leituras + Salmo + Evangelho *(Onda A)*
3. **`LiturgyThemeCard`**
4. **`LiturgyReadingKeyCard`**
5. **`LiturgyTraditionBlock`**
6. **`LogosMeditationCard`**
7. **`FinalPrayerCard`**
8. **`ChurchHistoryCard`**
9. **`ActionOfDayCard`**
10. **`ReaderContinuation`** — plugado no `liturgyAutoNexus` já existente (Bíblia, Catecismo, Glossário, Santo, Jornada, Magistério).
11. Reflexão PADH atual → removida (substituída pela Meditação Logos).
12. "Santo do Dia" + "Oração do dia" atuais → mantidos como cards secundários abaixo da continuação.

`ReaderAutoNexus`: registrar um `input` de `liturgy` com `{ date, gospelRef, firstRef, secondRef, psalmRef }` — o `liturgyAutoNexus` já usa `KnowledgeResolver`, então zero URL hardcoded.

---

## 3. Skeletons, erros e acessibilidade

- `MeditationSkeleton` — 6 blocos shimmer (usa `EditorialSkeleton` existente).
- Se o edge devolver `503`/erro: esconder toda a seção editorial silenciosamente, manter leituras. Log em `analytics_events` (`event: liturgy_meditation_failed`).
- Todos os blocos são `<section aria-labelledby>` semânticos, headings hierárquicos abaixo do H1 da página.

---

## 4. Critérios de aceite (validáveis manualmente)

Para qualquer data (`?d=2026-07-21`):

- Aparece Tema do Dia.
- Aparece Chave de Leitura.
- Aparece bloco Padres / Catecismo / Magistério (cada referência clicável ou marcada como "referência oral" se não houver rota).
- Aparece Meditação Logos com Observe / Reflita / Reze / Viva.
- Aparece Oração Final.
- Aparece "Na História da Igreja" quando houver dado (opcional por dia).
- Aparece Ação do Dia.
- Aparece `ReaderContinuation` com pelo menos Bíblia + Catecismo + Glossário.
- Recarregar a página não gera nova chamada à IA (cache do banco).
- Modo offline: se o dia foi visitado antes, o bloco editorial é exibido do cache.

---

## Fora do escopo desta onda

- Missal completo, Liturgia das Horas, editor humano das meditações, seleção manual de citações → Sprints seguintes.
- Curadoria humana em cima da geração da IA: fica como Onda C (revisão editorial).
