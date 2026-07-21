# B.2.5.d — Universalização do Portal para novos módulos

## Diagnóstico

Cinco módulos foram pedidos de uma vez. Cada um tem particularidades editoriais e de fluxo:

- **Orações comuns**: já existem 9 orações em Engine v2 (Pai Nosso, Ave Maria, etc). Falta apenas o Portal padronizado.
- **Novenas**: fluxo de 9 dias com progresso persistido — precisa de schema no banco (dias, intenções, meditações).
- **Ladainhas**: fluxo de invocação/resposta iterativa — precisa de mecânica de repetição no Reader.
- **Lectio Divina**: 5 etapas (Lectio, Meditatio, Oratio, Contemplatio, Actio) — precisa de tema próprio e temporizadores.
- **Missal**: já existe (`MissaContinuousReader`) e está em uso. Só precisa do Portal como antessala.

Fazer tudo em uma sprint gera 5 esqueletos sem conteúdo real e polui o banco. Melhor entregar em ondas com gates.

## Proposta: 3 ondas sequenciais

### Onda 1 — Fundação universal (esta sprint)

Objetivo: ativar o Portal em tudo que já está pronto na base, sem novas tabelas.

1. **Orações comuns via Portal** — `PrayerPortalStandalone` plugado nas 9 orações v2 existentes, com tema derivado do tipo:
   - Pai Nosso, Ave Maria, Glória, Salve Rainha → `church` (dourado)
   - Angelus → `noon`, Regina Caeli → `dawn`, Magnificat → `sunset`
   - Credo, Te Deum → `church` com quote própria
2. **Missal via Portal** — antessala contemplativa antes do `MissaContinuousReader`, tema `church`, com Escritura do dia como quote e "Entrar na Missa" como CTA.
3. **Contrato universal**: expor `resolvePortalTheme(prayer)` em `src/lib/prayer/portalTheme.ts` centralizando o mapeamento (Rosário/Via Sacra/Breviário passam a consumir também).

Gate: screenshots dos 5 pontos de entrada, typecheck limpo, E2E do Portal universal.

### Onda 2 — Lectio Divina como Portal contemplativo

Objetivo: novo módulo, mas sem depender de conteúdo de terceiros — usa Evangelho do dia via `LiturgyProvider` (já existente).

- Rota `/lectio` com Portal (tema `dawn`, ícone `BookOpen`, quote fixa "Fala, Senhor, teu servo escuta").
- Reader com as 5 etapas em stepper, cada uma com temporizador contemplativo configurável (reaproveita `useContemplativeRhythm`).
- Persistência local por dia (`localStorage` indexado por data litúrgica).
- Sem novas tabelas — conteúdo bíblico já vem do Provider.

Gate: fluxo E2E completo (portal → 5 etapas → conclusão), acessibilidade axe.

### Onda 3 — Novenas e Ladainhas (requer conteúdo)

Objetivo: módulos com conteúdo editorial próprio. Requerem decisões antes de codar.

- **Novenas**: schema `prayer_novena_days` (id, prayer_id, day_number, intention, meditation, prayer_block_ids). Portal mostra "Dia X de 9" com progresso, sessão salva no banco.
- **Ladainhas**: reaproveita `prayer_blocks` com `kind='invocation'` + `response`. Reader com modo iteração (avanço automático opcional a cada invocação).

Bloqueio para começar: preciso de decisão editorial sobre **quais** novenas e ladainhas entrar primeiro (Novena do Sagrado Coração? Nossa Senhora? São José? Ladainha de Todos os Santos? de Nossa Senhora?).

## Detalhes técnicos (para referência)

- `resolvePortalTheme(prayer)`: função pura em `src/lib/prayer/portalTheme.ts` retornando `{ theme, accentIcon, quote }` a partir de `prayer.slug`/`prayer.kind`.
- Reutiliza `PrayerPortal` já parametrizado (props `theme`, `accentIcon`, `quote`).
- Missal: gate `?enter=1` em `/missa/hoje` antes de renderizar `MissaContinuousReader`.
- Lectio: novo componente `LectioDivinaReader` seguindo padrão de `PrayerEngineReader`, sem tocar em `prayer_blocks`.
- Ondas 2 e 3 abrem depois do gate da Onda 1.

## Pergunta antes de começar

Aprovo executar **apenas a Onda 1** agora (Orações comuns + Missal via Portal + helper universal)?

Se sim, sigo. Se quiser inverter prioridade (ex.: Lectio primeiro, ou já definir quais novenas), me diga antes.
