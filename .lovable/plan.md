# Sprint 4 · Onda C — Rosário Contemplativo Definitivo

Escopo grande. Proponho **quebrar em 3 entregas sequenciais** para permitir validação incremental. Antes delas, entrego os **2 ajustes imediatos** que você pediu no início da mensagem.

---

## Entrega 0 — Ajustes imediatos (esta sprint, agora)

**0.1 · Painel de Ritmo Contemplativo**
- Novo `ContemplativeSettingsDialog.tsx` acessível por ícone no header do Reader.
- Controles (sliders):
  - Duração da pausa entre blocos (0–5s, default 0.5s)
  - Timer de silêncio no bloco Contemple (0–60s, default 15s)
  - Velocidade de transição fade (150–1000ms, default 500ms)
- Persistência em `localStorage` (`cathedra.prayer.rhythm`).
- Hook `useContemplativeRhythm.ts` consumido por `PrayerEngineReader`, `ContemplationInvitation` e `MysteryClosingCard`.

**0.2 · Retomada de sessão do Rosário**
- Estender `prayer_sessions` com `last_section_id`, `last_block_index`, `last_mystery_slug` (colunas nullable; migration + GRANT).
- Salvar posição a cada mudança de bloco (debounce 2s).
- Ao reabrir `/oracao/rosario`: banner `ResumePrayerCard` com "Retomar do 3º Mistério Gozoso" ou "Reiniciar do começo".
- Hook `useResumePrayerSession.ts`.

---

## Entrega 1 — Banco editorial + Ilustrações (próxima sprint)

- Migration expandindo `prayer_mysteries` com 13 campos editoriais (`contemplation_invitation`, `spiritual_fruit`, `closing_prayer`, `concrete_action`, `related_saints[]`, `church_fathers[]`, `magisterium_refs[]`, `catechism_refs[]`, `primary_scripture`, `parallel_scriptures[]`, `iconography`, `bibliography[]`, `logos_meditation`).
- Seed editorial completo dos 20 mistérios (conteúdo escrito, sem placeholder).
- Remoção total dos fallbacks em `mysteryMeta.ts` → passa a ser apenas tipos.
- Auditoria `scripts/audit-mysteries-editorial.ts` no CI: falha se algum campo obrigatório vazio.
- **Ilustrações**: 20 imagens definitivas (reprocessamento com prompt unificado — estilo sacro clássico, paleta litúrgica por série). Loading progressivo (blur-up + AVIF/WebP).

## Entrega 2 — Áudio + Intenções + Estatísticas

- **TTS**: 3 modos (integral / só meditações / só orações) no header do Reader. Arquitetura `PrayerAudioSource` (interface) preparada para narração humana futura via bucket `prayer-audio`.
- **Intenções**: `PrayerIntentionPicker` antes de iniciar (6 predefinidas + livre). Persiste em `prayer_sessions.intention`. Reaparece no encerramento.
- **Estatísticas espirituais**: painel `SpiritualCompanionPanel` (dias consecutivos, mistérios concluídos, último Rosário, tempo total, intenção ativa). Linguagem contemplativa, sem streaks/badges.

## Entrega 3 — Encerramento + Homologação

- `RosaryClosingExperience.tsx`: resumo, fruto do dia, oração final, sugestão bíblica + Catecismo + santo + próxima oração via Nexus.
- Auditoria de homologação: WCAG AA (axe), Lighthouse mobile ≥90, E2E de retomada, TTS, contemplação, favoritos, histórico, Nexus.
- Relatório `docs/audits/rosario-homologacao.md` com selo "Módulo de Referência Cathedra".

---

## Detalhes técnicos (Entrega 0)

```text
src/
  components/cathedra/prayer/
    ContemplativeSettingsDialog.tsx   (novo)
    ResumePrayerCard.tsx              (novo)
  hooks/
    useContemplativeRhythm.ts         (novo)
    useResumePrayerSession.ts         (novo)
  pages/PrayerDetailPage.tsx          (integra ResumePrayerCard)
  components/cathedra/prayer/PrayerEngineReader.tsx  (consome rhythm + salva posição)

supabase/migrations/
  <ts>_prayer_sessions_resume.sql     (add colunas + GRANT já existente)
```

Sem novas dependências. Zero mudança em Business Logic fora do módulo Oração.

---

## Confirmação

Posso começar já pela **Entrega 0** (rápida, ~1 turno) e depois seguirmos Entrega 1 → 2 → 3, ou você prefere reordenar / cortar algo?
