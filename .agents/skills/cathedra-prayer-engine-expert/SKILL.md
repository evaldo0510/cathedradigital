---
name: cathedra-prayer-engine-expert
description: Enforce single Prayer Engine v2 — no new readers, PrayerPortal only, sessions, ReaderContinuation, auto-Nexus. Use for any prayer, novena, litany, lectio, breviary, or missal work.
---

# Prayer Engine Expert

Motor único de todas as orações do Cathedra. Nenhum leitor custom, nenhuma tela paralela.

## Constituição — remissão

Ver `docs/CATHEDRA-CONSTITUTION.md`. Executa os artigos:
"Existe apenas um Prayer Engine", "Engine v2 é o padrão oficial",
"Todo leitor termina em ReaderContinuation", "Todo conteúdo participa do Nexus".

## Leis inegociáveis

1. **Nunca criar Reader novo.** Sempre reutilizar `PrayerEngineReader`.
2. **Toda oração nova nasce em `engine_version = 2`.**
3. **Toda oração possui `PrayerPortal`** parametrizado via `portalTheme.ts`.
4. **Toda oração registra sessão** via `usePrayerEngineSession`.
5. **Toda oração expõe `ReaderContinuation`** apontando próximo passo real da peregrinação.
6. **Toda oração entra automaticamente no Nexus** via `prayerAutoNexus.ts` + relações em `nexus_relations`.

Notas operacionais:
- Publicação de conteúdo com trigger de permissões (ex.: glossário) → migrations diretas entram como `draft`; publicar via UI com papel adequado.

## Arquitetura obrigatória

- **Banco:** `prayers` (`engine_version=2`), `prayer_sections`, `prayer_blocks`, `prayer_mysteries`, `prayer_references`, `prayer_assets`.
- **Loader:** `loadPrayerHierarchy.ts` + `usePrayerHierarchy.ts`.
- **Reader:** `PrayerEngineReader.tsx` — **único**. Nunca escrever leitor novo, mesmo para casos "especiais".
- **Portal:** `PrayerPortal.tsx` parametrizado por `portalTheme.ts`; falta tema → adicionar lá, não criar portal paralelo.
- **Sessão:** `usePrayerEngineSession`.
- **Nexus:** `prayerAutoNexus.ts` — conexões automáticas a Bíblia/CIC.
- **Continuação:** `ReaderContinuation` no rodapé.

## Blocos suportados

`text`, `psalm`, `antiphon`, `reading`, `response`, `intention`, `mystery`, `station`, `reflection`, `checklist`, `journal`, `meditation`.

Precisa de bloco novo? Adicionar ao Engine, nunca renderizar fora dele.

## Modo Contemplação

- Overlay fullscreen; UI desaparece.
- Tipografia ampliada.
- Arte via `mysteryImages.ts` / `image_slug` (nunca URL direta).
- `SpiritualProgressDots`, `ContemplationInvitation`, `MysteryClosingCard`.
- Ritmo via `useContemplativeRhythm`.

## Proibições

- Reader custom por oração.
- "Mini engine" paralela para caso especial.
- Persistência ad-hoc em `localStorage` sem `usePrayerEngineSession`.
- Tema hardcoded fora de `portalTheme.ts`.
- URL de imagem direta em vez de `image_slug`.
- Oração sem `ReaderContinuation`.
- Oração sem entrada no Nexus.
- Gamificação (XP, streaks) dentro de oração.

## Checklist

- [ ] `engine_version = 2`
- [ ] Hierarquia em `prayer_sections`/`prayer_blocks`
- [ ] Renderiza via `PrayerEngineReader` + `PrayerPortal`
- [ ] Tema registrado em `portalTheme.ts`
- [ ] `usePrayerEngineSession` ativa
- [ ] `ReaderContinuation` aponta próximo item real
- [ ] Auto-Nexus conecta a Bíblia/CIC (≥ 3 relações)
- [ ] TTS disponível
- [ ] Modo Contemplação onde aplicável
