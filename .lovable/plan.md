
# Sprint 3 · Liturgia das Horas (Prayer Engine v2)

## Estado atual
- Existe **1 oração agregada** `liturgia-das-horas` (engine v2) com 7 seções (`oficio`, `laudes`, `tercia`, `sexta`, `noa`, `vesperas`, `completas`) e 31 blocos do Ordinário.
- O Próprio (antífonas/salmodia/leituras/preces) vem em runtime da Edge Function `useLiturgyHoursOffice`.
- `BreviaryContinuousReader` já injeta Ordinário + Próprio, com persistência de cursor, TTS por bloco e Nexus.
- **Falta**: cada Hora como entidade autônoma no engine, hero editorial dedicado, favoritos por hora, notificações e integração com calendário litúrgico.

## Onda A — Migração para orações independentes

Criar 5 orações v2 autônomas mantendo a agregada como índice:

| Slug | Título | Categoria | Momento |
|---|---|---|---|
| `breviario-oficio-leituras` | Ofício das Leituras | `momentos_do_dia` | qualquer |
| `breviario-laudes` | Laudes (Manhã) | `momentos_do_dia` | 06h–09h |
| `breviario-hora-media` | Hora Média | `momentos_do_dia` | 12h–15h |
| `breviario-vesperas` | Vésperas (Tarde) | `momentos_do_dia` | 17h–19h |
| `breviario-completas` | Completas (Noite) | `momentos_do_dia` | 20h–23h |

Cada oração recebe seções: `abertura`, `hino`, `salmodia`, `leitura`, `responsorio`, `cantico`, `preces`, `conclusao` — blocos do Ordinário migrados da agregada. `meta.hour_slug` e `meta.recommended_time` em cada oração para o motor de recomendação.

Migration idempotente que:
1. Insere as 5 novas orações + suas seções/blocos copiando o Ordinário existente.
2. Mantém `liturgia-das-horas` como agregada (índice do módulo).
3. Preserva favoritos existentes.

## Onda B — Leitor unificado por Hora

- `BreviaryHourPage.tsx`: usa `PrayerEngineReader` com Hero Logos 2030 (kicker "Liturgia das Horas · <Hora>", tempo litúrgico, cor, saltério, santo do dia via `LiturgyRichHeader`).
- Injeta o Próprio do dia inline (mantendo `BreviaryContinuousReader` como estratégia interna).
- **Favoritos por Hora** via `PrayerFavoriteButton` existente (usa `prayers.slug`).
- **ReaderContinuation** já plugado via Nexus automático.
- **Persistência** por Hora+data via `prayer_sessions` (contexto `breviary:<hour>:<isoDate>`).
- Rotas: `/oracao/breviario-<hour>` (Hora única) + `/liturgia-das-horas?d=&mode=day` continua para dia inteiro.

## Onda C — Motor de recomendação e calendário

- `useRecommendedHour.ts`: retorna a Hora sugerida conforme horário local + janela canônica (respeita fuso do dispositivo).
- `HourRecommendationCard.tsx`: destaque na `BreviaryPage` — "Agora é hora de Vésperas".
- **Notificações** (opt-in, base): `useHourNotifications.ts` com `Notification.requestPermission()` + agendamento via `setTimeout` na sessão (persistência de preferência em `localStorage`). Push real fica para sprint futura.
- **Calendário Litúrgico** enriquecido: `LiturgyRichHeader` já exibe tempo/cor/santo — na Onda C adiciono seletor de data com badge de solenidade/festa vindo de `useDailyLiturgy`.

## Detalhes técnicos

- Migration SQL: `supabase/migrations/<ts>_sprint3_lh_hours.sql` com blocks/GRANTs padrão (leitura pública já herdada de `prayers`).
- Sem novas dependências.
- Sem alterações no `PrayerEngineReader` além de um adapter que injeta blocos do Próprio quando `prayer.slug` começa com `breviario-`.
- Testes E2E: `tests/e2e/liturgia-horas.spec.ts` verifica metatags, presença de blocos do Próprio e favoritos por hora.

## Entregas por Onda

- **Onda A** — migration + seed dos 5 breviários independentes + verificação no banco.
- **Onda B** — `BreviaryHourPage`, adapter de injeção do Próprio, favoritos, rotas.
- **Onda C** — `useRecommendedHour`, `HourRecommendationCard`, notificações opt-in, calendário enriquecido.

Começarei pela **Onda A** (migration + seed) e reporto antes×depois com número de orações/seções/blocos migrados.
