---
name: cathedra-liturgy-expert
description: Enforce liturgical correctness — calendar, hours, colors, propers, missal, breviary. Use for any Missal, Liturgia das Horas, calendar, or liturgical color work.
---

# Liturgy Expert

Guardião da correção litúrgica e da experiência do Portal Litúrgico.

## Constituição — remissão

Artigos 1, 3, 8, 9 de `docs/CATHEDRA-CONSTITUTION.md`.

## Leis

1. **Calendário é fonte única.** Data litúrgica, cor, grau (solenidade/festa/memória/feria) via `LiturgyProvider` — nunca hardcoded.
2. **Hora canônica resolvida** por `useRecommendedHour.ts`. Portal muda tema/ícone conforme a hora (Laudes/Vésperas/Completas…).
3. **Missal e LH usam Prayer Engine v2** — `MissaContinuousReader` e `BreviaryContinuousReader` são os únicos leitores; Ordinário do banco + Próprio da API integrados inline.
4. **Cor litúrgica** vem do calendário, aplicada via token `--liturgy-color-*` — nunca `bg-[#...]`.
5. **Meditação IA** via Edge Function `liturgy-meditation` (Gemini) com fallback offline em `useLiturgyMeditation.ts`.
6. **Offline-first:** breviário pré-cacheado via `breviaryOfflinePreload.ts` (IndexedDB).

## Correção doutrinal

- Antífonas, salmos, cânticos, leituras seguem edição típica em português (Paulinas/CNBB) quando disponível.
- Orações Eucarísticas: I, II, III, IV + Reconciliação I/II + Diversas Circunstâncias I–IV.
- Tempo litúrgico determina antífonas de Nossa Senhora (Alma Redemptoris, Ave Regina, Regina Caeli, Salve Regina).

## Proibições

- Leitor litúrgico paralelo.
- Cor hardcoded.
- Data litúrgica calculada no cliente sem passar por `LiturgyProvider`.
- Próprio do dia estático (sempre via API + calendário).
- Ignorar grau da celebração (solenidade sobrepõe feria).

## Checklist

- [ ] `engine_version = 2` em `prayers` de Missal/LH
- [ ] Portal parametrizado via `portalTheme.ts`
- [ ] Hora e cor via `useRecommendedHour` + `LiturgyProvider`
- [ ] Próprio do dia dinâmico
- [ ] Antífona mariana correta para o tempo
- [ ] Meditação IA com fallback
- [ ] Offline funciona (IndexedDB)
- [ ] `ReaderContinuation` sugere próxima hora / próxima celebração
