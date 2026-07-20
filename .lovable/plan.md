# Sprint Editorial Geral (SEG) — Cathedra

Você tem razão: expandir o Nexus agora amplifica lacunas de conteúdo. A Onda 4 do Sanctorum (Nexus total) fica **pausada**. O foco passa a ser dignificar cada módulo até virar experiência editorial de livro. O Nexus volta ao fim, quando conectará conteúdo já denso.

## Princípio único

Nenhum módulo novo. Nenhum redesign visual (Logos 2030 já é a linguagem). Só **profundidade de conteúdo + estrutura editorial + continuidade + Nexus local por módulo**.

Cada sub-sprint entrega:
1. Schema/tipos expandidos (migração aditiva, `content_status: stub|partial|complete`).
2. Página como capítulo (blocos narrativos + skeletons + fallbacks graciosos).
3. Nexus **local** (referências dentro do próprio domínio + link para os já existentes).
4. Admin de curadoria mínima (`/admin/<modulo>`) + seed de 3 exemplares "complete" para validar.
5. E2E + Axe + relatório antes×depois (campos preenchidos, LCP, contraste).

## Ordem de execução (fixa, uma por vez)

```text
P0
 1. Orações        (Rosário, Via-Sacra, Liturgia das Horas, Missal — modo contemplativo, áudio, foco, progresso)
 2. Léxico         (verbete = enciclopédia: definição, origem, teologia, Bíblia, CIC, Magistério, Padres, Santos, aplicação, FAQ, termos relacionados)
 3. Jornadas       (livro: intro, objetivo, tempo, capítulos, meditação, oração final, continuidade)
 4. Trilhas        (formação: cap → CIC → Bíblia → Santo → Magistério → reflexão → oração → próximo)

P1
 5. Santos         (retomar Sanctorum 2.0 com blocos narrativos, timeline, iconografia, virtudes, milagres, escritos, patronatos, oração, meditação Logos)
 6. Papas          (biografia, timeline, brasão, lema, encíclicas, exortações, discursos, concílios, contexto, legado)
 7. Escritores     (biblioteca: biografia, obras, influência, pensamento, leituras, conexões)

P2
 8. Liturgia       (Portal: Liturgia do Dia, Missal, Horas, Calendário, Santos do Dia)
 9. Missal         (missal digital: índices, rubricas, gestos, respostas, comentários, referências, modo celebração)
10. Calendário     (data → tempo litúrgico, cor, leituras, salmo, evangelho, comentário, santos, orações, docs, CIC)

FINAL
11. Refinamento visual + Nexus total (agora com conteúdo denso para conectar)
```

## Sub-sprint 1 — Orações (próxima)

**Escopo mínimo entregável**:
- `prayers` schema recebe: `blocks jsonb` (introdução, mistério/estação/hora, meditação, fruto, oração final), `audio_url`, `duration_min`, `bible_refs jsonb`, `catechism_refs int[]`, `content_status`.
- `PrayerDetailPage.tsx` vira leitor contemplativo: modo foco (atalho `f`, reaproveita padrão do Nexus), progresso persistido (`ritual_progress` já existe), continuidade automática (retomar exatamente onde parou), player de áudio nativo com legenda opcional.
- **Rosário**: navegação por mistério (Gozosos/Dolorosos/Gloriosos/Luminosos), meditação por dezena, referência bíblica em cada mistério, oração final variável.
- **Via-Sacra**: 14 estações + 15ª opcional, meditação + oração + reflexão por estação.
- **Liturgia das Horas**: Laudes/Vésperas/Completas mínimo, salmos do dia via edge existente, hino, leitura breve, cântico.
- **Missal**: entra na Sub-sprint 9 (aqui apenas link "Ver no Missal").
- Nexus local: cada bloco cita Bíblia + CIC clicáveis via `openNexusRef`.
- Admin: `/admin/pray` lista orações por `content_status`, edição inline dos blocos, seed de 3 completas (Rosário Gozoso, Via-Sacra tradicional, Completas).
- Testes: E2E de continuidade (fechar/reabrir na estação 7), Axe em modo foco, snapshot dark.

**Relatório**: nº orações `complete`, tempo médio de sessão, tap-through Nexus local.

## Detalhes técnicos transversais

- **Schema**: sempre migração aditiva, `GRANT` completo + RLS, `content_status` com índice, defaults `'{}'::jsonb` e `ARRAY[]::text[]`.
- **Tipos**: superset em `src/types/<modulo>.ts`; nunca editar `supabase/types.ts`.
- **Adapters**: cada módulo ganha `ContentAdapter` em `src/core/content/adapters/` seguindo contratos já existentes (Bible/Catechism/Magisterium) — assim o `UniversalReader` renderiza tudo sem saber a origem.
- **Nexus local**: extensão de `openNexusRef()` só se surgir `NexusRef` novo (ex.: `{kind:'prayer', slug}`) — nunca criar navegação paralela.
- **Continuidade**: reaproveita `ReaderContinuation`, `useReadingMarks`, `ritual_progress`.
- **Fallback conteúdo**: `content_status='stub'` → renderiza o que existe + badge "Ficha em curadoria" (nunca vazio mudo).
- **Rollback**: `?legacy=1` mantém página anterior durante validação de cada sub-sprint.
- **CI**: cada módulo entra nos workflows já existentes (a11y, contrast, editorial-hero, playwright).

## Regras de execução

- **Uma sub-sprint por vez**. Não abrir a próxima sem seu OK explícito + relatório antes×depois.
- **Sem features paralelas**, sem deps novas sem aprovação.
- Sanctorum 2.0 **Onda 4 (Nexus total)** e **Onda 5 (pipeline)** entram fundidas no passo 11 final, quando todos os módulos tiverem conteúdo denso para o Nexus conectar.

## Confirmação necessária

1. Aprovo iniciar por **Sub-sprint 1 — Orações** com o escopo acima?
2. Dentro de Orações, começo pelo **Rosário** (maior uso) ou pela **Liturgia das Horas** (mais complexa, valida o padrão)?
