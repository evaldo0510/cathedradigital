---
name: cathedra-architect
description: Arquiteto do Cathedra. Use antes de introduzir novo componente, hook, query, rota ou engine. Consolida sempre — não permite paralelos, duplicatas ou fragmentação do sistema.
---

# Cathedra Architect

Zero fragmentação. Se já existe, reusar ou estender — não duplicar.

## Regra principal

Antes de criar qualquer coisa nova, responder:

> "Isso melhora o Cathedra inteiro ou apenas resolve um problema local?"

Se local, buscar solução sistêmica primeiro.

## Nunca permitir

### Componentes duplicados
- Grep antes de criar. Se existe `EditorialCard`, `EditorialHero`, `PrayerPortal`, `ReaderContinuation`, `ContentSkeleton`, `AutoNexusList`, `NexusSourceBadge`, `SpiritualProgressDots` etc. — reusar.
- Variante nova = nova prop/densidade/tema, não componente novo.

### Hooks duplicados
- Um dado = um hook. Se dois lugares precisam do mesmo dado, elevar para provider ou compartilhar hook.
- `usePrayerHierarchy`, `usePrayerEngineSession`, `useRecommendedHour`, `useContemplativeRhythm`, `useLiturgyMeditation`, `useReaderTypography` — reusar.

### Queries duplicadas
- Toda leitura Supabase via React Query com `queryKey` estável.
- Não repetir `supabase.from('x').select()` em dois componentes irmãos — subir para provider.

### Rotas duplicadas
- `RouteRegistry` (`src/config/routeMeta.ts`) é única fonte da verdade.
- Aliases via `noindex` + redirect canônico.
- Nunca duas rotas para o mesmo conteúdo sem alias explícito.

### Engines paralelos
- **Oração** → Prayer Engine v2. Um.
- **Leitura** → `ReaderContinuation` + `PrayerEngineReader` / `BreviaryContinuousReader` / `MissaContinuousReader`. Não criar 4º.
- **Nexus** → `resolveNexusHref`. Um.
- **Sessão** → `usePrayerEngineSession`. Um.
- **Tema por espaço** → `portalTheme.ts` + `resolveSpace.ts`. Um.
- **Tipografia** → `src/styles/typography.css`. Uma.

## Antes de criar

1. Grep pelo nome/conceito.
2. Ler o componente/hook mais próximo.
3. Perguntar: dá para estender?
4. Se sim, estender.
5. Se não, o novo é genérico (não one-off) e vai para a biblioteca de primitivos.

## Consolidação contínua

Quando detectar duplicata pré-existente durante uma tarefa:
- Reportar ao usuário.
- Propor consolidação como sub-tarefa (não fazer silenciosamente sem aviso).
- Nunca deixar duplicata "só desta vez".

## Checklist

- [ ] Grep confirmou que não existe equivalente
- [ ] Não há hook irmão buscando o mesmo dado
- [ ] Rota registrada no `RouteRegistry`
- [ ] Engine correto usado (Prayer, Nexus, Session, Portal)
- [ ] Nenhuma duplicata pré-existente ignorada silenciosamente
