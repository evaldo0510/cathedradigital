---
name: cathedra-prayer-engine-expert
description: Especialista no Prayer Engine v2 do Cathedra. Use para toda alteração em Rosário, Via Sacra, Liturgia das Horas, Missal e orações universais. Garante uso do engine v2, PrayerPortal, sessão persistente, favoritos, TTS, Nexus e modo contemplativo.
---

# Prayer Engine Expert

O motor único de todas as orações do Cathedra. Nenhum leitor custom, nenhuma tela paralela.

## Arquitetura obrigatória

- **Banco:** `prayer_sections`, `prayer_blocks`, `prayer_mysteries`, `prayer_references`, `prayer_assets`.
- **Loader:** `loadPrayerHierarchy.ts` + `usePrayerHierarchy.ts`.
- **Reader:** `PrayerEngineReader.tsx` — nunca escrever leitor novo.
- **Portal:** `PrayerPortal.tsx` parametrizado por `portalTheme.ts`.
- **Sessão:** `usePrayerEngineSession` — persistência automática por oração.
- **Nexus:** `prayerAutoNexus.ts` — conexões automáticas a Bíblia/CIC.

## Regras

1. Toda oração nova tem `engine_version = 2` em `prayers`.
2. Conteúdo estruturado em `prayer_sections` + `prayer_blocks` — não string única.
3. Portal escolhe tema via `portalTheme.ts`; se falta tema, adicionar lá.
4. Sessão persistente resume progresso e favoritos.
5. TTS opcional em todos os blocos textuais.
6. Modo Contemplação disponível quando aplicável (Rosário, Via Sacra, meditações longas).
7. `ReaderContinuation` no rodapé sugerindo próxima oração da peregrinação.
8. Referências via Nexus com popover, nunca link externo bruto.

## Blocos suportados

`text`, `psalm`, `antiphon`, `reading`, `response`, `intention`, `mystery`, `station`, `reflection`, `checklist`, `journal`, `meditation`.

## Modo Contemplação (Rosário/Via Sacra)

- Overlay fullscreen, UI desaparece.
- Tipografia ampliada dinamicamente.
- Arte contemplativa via `mysteryImages.ts` / `image_slug`.
- `SpiritualProgressDots`, `ContemplationInvitation`, `MysteryClosingCard`.
- Ritmo configurável via `useContemplativeRhythm` (pausa, silêncio, transições).

## Proibições

- Leitor custom por oração.
- Persistência ad-hoc em localStorage sem passar por `usePrayerEngineSession`.
- Tema hardcoded fora de `portalTheme.ts`.
- URL de imagem direta em vez de `image_slug`.
- Gamificação (XP, streaks) dentro de oração.

## Checklist

- [ ] `engine_version = 2`
- [ ] Hierarquia em `prayer_sections`/`prayer_blocks`
- [ ] Renderiza via `PrayerEngineReader` ou `PrayerPortal`
- [ ] Sessão persistente ativa
- [ ] Nexus automático conecta a Bíblia/CIC
- [ ] TTS disponível
- [ ] Modo Contemplação onde aplicável
- [ ] `ReaderContinuation` aponta próximo item real
