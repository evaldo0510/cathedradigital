---
name: cathedra-plugin-prayer
description: Plugin Prayer do Cathedra OS. Ativar quando a tarefa envolver Prayer Engine, PrayerPortal, PrayerEngineReader, Rosário, Via Sacra, Novenas, Ladainhas, Lectio Divina, Missal, Liturgia das Horas, Breviário, prayer_sections/blocks/mysteries, engine_version=2, portalTheme, ou qualquer rota /oracao/*, /liturgia*, /lectio*.
---

# Plugin Prayer

Responsabilidades:
- **Prayer Engine v2** — `prayer_sections`, `prayer_blocks`, `prayer_mysteries`.
- **PrayerPortal** — parametrizado por `portalTheme.ts`. Um portal, muitos temas.
- **PrayerEngineReader** — leitor unificado; nunca criar leitor custom.
- **Rosário Premium** — 3 modos (Guiado, Contemplativo, Automático).
- **Via Sacra Premium** — persistência de progresso.
- **Missal** — `MissaContinuousReader`, Modo Celebração, TTS, Orações Eucarísticas.
- **Liturgia das Horas** — `BreviaryContinuousReader`, Ordinário (banco) + Próprio (API) inline.
- **LiturgyProvider** — fonte única de leituras do dia; cache IndexedDB.
- **useRecommendedHour** — resolução automática de horário/cor litúrgica.

Regras invioláveis:
- Toda oração nova = `engine_version = 2` no banco.
- Consumir hierarquia via `usePrayerHierarchy` / `loadPrayerHierarchy`.
- Sessão persistente via `usePrayerEngineSession`.
- Modo Contemplação: overlay fullscreen, tipografia dinâmica, sem controles distrativos.
- Prefetch adaptativo de imagens de mistérios.

Antes de agir:
1. Verificar se a oração já está no engine (query `prayer_sections`).
2. Reutilizar `PrayerPortal` + tema; nunca criar portal paralelo.
3. Registrar novos temas em `portalTheme.ts`.
4. Missal/LH: consultar `Liturgy Expert` para correção doutrinal.
