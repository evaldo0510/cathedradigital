# C0.3 — Homologação Real do Prayer Engine

## Situação atual (auditoria de código, não declaração)

| Item | Estado |
|---|---|
| `MysteryNexusPanel` eliminado | ✅ zero imports |
| `mysteryAutoNexus` + teste | ✅ existe em `src/core/knowledge/adapters/` |
| `PrayerDetailPage` usa `ReaderShell` | ❌ ainda usa `EditorialReaderChrome` |
| `PrayerPortal` usa `ReaderShell` | ❌ nenhuma referência |
| `PrayerEngineReader` usa `ReaderShell` | ❌ nenhuma referência |
| `ViaCrucis`, `MissalPage`, `BreviaryPage` migrados | ⚠️ a verificar |
| `NexusBubbles` eliminado do projeto | ❌ 7 arquivos ainda importam — **fora do escopo Prayer Engine** |

**Conclusão:** a C0.3 foi declarada CERTIFIED prematuramente. Precisa ser refeita com verificação real.

## Escopo estrito (o que a C0.3 cobre)

Apenas o **Prayer Engine**: PrayerPortal, PrayerEngineReader, PrayerDetailPage, ViaCrucis, MissalPage, BreviaryPage, RosarioPage (se existir).

**Fora do escopo** (irão para ondas próprias, não misturar):
- `NexusBubbles` em Bible/Saints/Magisterium/Journey/Dashboard → C0.4
- `EditorialReaderChrome` em Glossary/Magisterium/AtriumBible/SaintDetail → C0.5

## Divisão em sub-ondas

### C0.3.a — Núcleo (PrayerPortal + PrayerEngineReader + PrayerDetailPage)
1. Refatorar `PrayerPortal.tsx` para envolver `PrayerEngineReader` em `ReaderShell` com slots corretos (EditorialHero, HeaderContext="prayer", NexusPanel, ReaderContinuation).
2. Refatorar `PrayerDetailPage.tsx`: remover `EditorialReaderChrome`, usar `ReaderShell`.
3. Garantir que `PrayerEngineReader` renderiza como filho de `ReaderShell` e não replica chrome.

### C0.3.b — Rituais estruturados
4. `ViaCrucis.tsx` → `ReaderShell` + `PrayerEngineReader` (não leitor custom).
5. `MissalPage.tsx` + `BreviaryPage.tsx` → verificar se já estão em `ReaderShell` (foi declarado antes); se não, migrar.
6. Rosário: já é `PrayerPortal` — validar que a cadeia funciona depois da C0.3.a.

### C0.3.c — Auditoria bloqueante + certificação
7. Criar `scripts/prayer-engine-audit.ts`: falha se qualquer arquivo em `src/**/*(Prayer|Rosario|ViaCrucis|Missa|Breviary|Ladainha|Novena)*` importar `EditorialReaderChrome`, `MysteryNexusPanel`, ou não passar por `ReaderShell`.
8. Rodar Vitest + Playwright (desktop/tablet/mobile) para as 4 rotas: Rosário, Via Sacra, Missal, LH.
9. Certificar somente se auditoria = 0 e testes verdes.

## Riscos

- **Risco alto** de regressão visual no PrayerPortal (Modo Contemplação, portalTheme). Snapshots Playwright antes de tocar.
- Nenhuma alteração de banco. Nenhuma rota nova. Nenhum componente novo — só reuso.

## Detalhes técnicos

- `ReaderShell` slots já suportam variantes (HeaderContext.prayer existe? verificar antes; se não, adicionar variante `prayer` — extensão, não novo componente).
- `NexusPanel` recebe `autoNexus` do `mysteryAutoNexus` para orações contemplativas.
- `ReaderContinuation` sugere próxima oração via `usePrayerEngineSession`.

## Decisão pedida

Aprovar essa quebra em 3 sub-ondas (a → b → c) e começar por **C0.3.a**? Ou você prefere que eu tente as 3 na mesma rodada (maior risco, sem checkpoint entre elas)?