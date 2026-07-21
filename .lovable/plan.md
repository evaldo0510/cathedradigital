# Sprint 1 · Onda A — Liturgia do Dia

**Objetivo único desta onda:** entregar a base sólida da Liturgia do Dia — leituras, salmo, evangelho e navegação de data plena (ontem, hoje, amanhã, calendário). Sem comentários editoriais, sem Missal, sem Liturgia das Horas — isso vem nas ondas B e C.

**Marco de aceite:** o usuário consegue acompanhar a liturgia de qualquer dia (passado, presente ou futuro do ano litúrgico) com leituras, salmo, evangelho, tempo/cor litúrgica e santo do dia unificado, tudo com performance e cache consistentes.

## O que muda

### 1. Camada de provider (`LiturgyProvider`)
Introduzir uma interface fina que isola quem entrega os dados da liturgia. Hoje há acoplamento direto à edge function `liturgical-calendar` dentro da página. Vai virar um contrato:

```
LiturgyProvider {
  getDayLiturgy(date): Promise<DailyLiturgy>
  getMonth(year, month): Promise<LiturgicalDay[]>
}
```

Implementação atual (`liturgia.up.railway.app` + `calapi.inadiutorium.cz`) fica encapsulada em `RailwayInAdiutoriumProvider`. Nenhuma troca de fonte agora — só o contorno para que a Sprint futura de "nova fonte oficial" seja plug-and-play.

### 2. Hook único `useDailyLiturgy(date)`
Substitui o `useQuery` inline de `LiturgiaPage.tsx:152-184`. Centraliza:
- React Query + IndexedDB (mesmo padrão de `useLiturgicalMonth`).
- Prefetch dos ±3 dias adjacentes.
- Métricas de hit/miss em `localStorage` (padrão já usado no calendário).
- Modo offline com fallback ao cache local.

### 3. Navegação de data completa
Hoje `goToNextDay` bloqueia futuro (`LiturgiaPage.tsx:144`). A liturgia é planejada; navegar para amanhã, próximo domingo ou qualquer data do ano litúrgico é essencial.
- Remover o bloqueio de data futura.
- Adicionar botão de calendário (popover com shadcn Calendar) para saltar para qualquer dia.
- Atalhos: "Hoje", "Próximo domingo", "Próxima solenidade".
- URL passa a refletir a data: `/liturgia?d=YYYY-MM-DD` (deep link + histórico do browser).

### 4. Unificação do "Santo do dia"
Hoje há duas fontes desconectadas: `useSaintsToday` (LiturgiaPage) e `LiturgyAdapterMock` (Átrio). Consolidar num único hook `useSaintOfDay(date)` que:
- Consome `saint-of-the-day` edge function (fonte oficial).
- Fallback para `getSaintsByDate` (santoral local).
- Alimenta tanto `LiturgiaPage` quanto `DailyLiturgy` (Átrio) e `Header`.
- Remove o mock estático (`LiturgyAdapterMock.ts:4-9`).

### 5. Primitivas editoriais da Liturgia
Extrair o `ReadingCard` inline (`LiturgiaPage.tsx:83-116`) para `src/components/cathedra/primitives/liturgy/`:
- `LiturgyReadingCard` (primeira leitura, segunda leitura, evangelho — variantes)
- `LiturgyPsalmCard` (com refrão destacado)
- `LiturgyDayHeader` (tempo, cor, rank, data)
- `LiturgyDateNav` (nav ontem/hoje/amanhã + calendário)

Prepara o terreno para as Ondas B (comentários) e C (Nexus) reaproveitarem os mesmos componentes sem reescrever.

### 6. Nexus mínimo
Manter o `liturgyAutoNexus` como está (busca semântica). Passar `title` e `season` reais da leitura do dia. Sem novos buckets — enriquecimento vem na Onda C.

## Fora do escopo desta onda

- Comentários editoriais, Padres, Catecismo, Magistério, Meditação Logos → **Onda B**.
- Integração Nexus profunda, glossário embutido, jornadas relacionadas, favoritos, histórico, compartilhamento → **Onda C**.
- Missal completo → **Sprint 2**.
- Liturgia das Horas → **Sprint 3**.
- Nenhuma nova tabela no banco.
- Nenhuma nova dependência externa.

## Detalhes técnicos

**Arquivos novos**
- `src/core/liturgy/LiturgyProvider.ts` (interface + tipos)
- `src/core/liturgy/providers/RailwayInAdiutoriumProvider.ts` (implementação atual)
- `src/hooks/useDailyLiturgy.ts`
- `src/hooks/useSaintOfDay.ts`
- `src/components/cathedra/primitives/liturgy/` (4 componentes)

**Arquivos alterados**
- `src/components/cathedra/LiturgiaPage.tsx` — consome novo hook + navegação plena + deep link
- `src/modules/atrium/components/Liturgy/DailyLiturgy.tsx` — passa a usar `useSaintOfDay`
- `src/modules/atrium/adapters/mocks/LiturgyAdapterMock.ts` — removido
- `src/core/knowledge/adapters/liturgyAutoNexus.ts` — só ajuste de input (título/season reais)

**Sem migração de banco. Sem nova edge function.**

## Validação
- Playwright E2E: abrir `/liturgia?d=2026-12-25` (Natal) e `/liturgia?d=2026-04-05` (Páscoa) — verificar leituras corretas, cor litúrgica, salmo com refrão, evangelho.
- Testes unitários: `LiturgyProvider` contract, `useDailyLiturgy` cache/offline.
- Métricas de hit/miss expostas no NexusMetricsOverlay (adicionar linha "Liturgy Provider").

Confirma a Onda A? Assim que aprovar, executo end-to-end e entrego relatório antes×depois com métricas.