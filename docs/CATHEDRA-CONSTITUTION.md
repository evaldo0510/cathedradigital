# Cathedra Architecture Constitution — v1

Regras imutáveis do Cathedra. Toda skill, todo agente, todo PR cita este documento como fonte de verdade. Alterar aqui exige revisão explícita do usuário.

## Artigos

1. **Existe apenas um Prayer Engine.** `PrayerEngineReader` + `PrayerPortal` + Engine v2 no banco. Nenhum leitor paralelo.
2. **Existe apenas um Knowledge Engine.** `KnowledgeGraph` é a fachada única. Registry/Navigator/Resolver/Index são internos.
3. **Existe apenas um Design System.** Logos 2030: `EditorialHero`, `EditorialCard`, `Button`, `ContentSkeleton`, `PrayerPortal`, `ReaderContinuation`, tokens semânticos.
4. **Todo conteúdo é editorial.** Copy espiritual, sem jargão tech, sem dopamina. Solidez e silêncio.
5. **Todo conteúdo participa do Nexus.** Mínimo 3, máximo 8 relações, com prioridade Bíblia > CIC > Magistério > Santos > Orações > Jornadas > Glossário > Liturgia.
6. **Nenhum componente pode ser duplicado.** Estender primitivo com prop/variant/densidade antes de criar novo.
7. **Toda rota passa pelo RouteRegistry.** Zero URL hardcoded. Navegação interna via `resolveNexusHref` / `KnowledgeResolver` / `RouteRegistry.resolve`.
8. **Todo leitor termina em `ReaderContinuation`.** A peregrinação nunca acaba em beco sem saída.
9. **Todo módulo respeita seu `data-space`** (Átrio / Igreja / Biblioteca / Claustro) via `resolveSpace.ts`.
10. **Nenhuma URL hardcoded.** Nem em componente, nem em teste, nem em dado.
11. **Engine v2 é o padrão oficial.** Toda oração nova nasce v2. Migrations de conteúdo restrito entram como `draft` e são publicadas via UI com o papel correto.
12. **Hooks sempre antes de qualquer `return`.** Ordem estável é lei de React; violação = bug de render.
13. **Segurança inegociável.** RLS ativa, `GRANT` explícito para toda tabela pública, segredos via `secrets--add_secret`, nunca `VITE_*` sensível.

## Como citar

Nas skills e em decisões arquiteturais: "Ver `docs/CATHEDRA-CONSTITUTION.md`, artigo N."

## Versionamento

- v1 — 2026-07-21. Fase 1 (Fundação) validada com Oração pela Sabedoria + Esperança Cristã.
