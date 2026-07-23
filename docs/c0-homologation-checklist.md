# C0 · Homologation Checklist

> Referência oficial da Sprint C0 (Homologação Geral Cathedra).
> Uma linha por primitivo canônico. Onda só fecha com **todas** as caixas
> marcadas e `bunx tsgo --noEmit` limpo no escopo.
>
> Governança: Regra 12 do COS (Homologação Sequencial) — nenhuma onda
> avança enquanto a anterior não estiver 100%.

## Legenda

- ✅ conforme
- ⚠️ parcial (fase 1 ok, fase 2 pendente — documentar em "notas")
- ❌ ausente / paralelo
- ➖ não se aplica ao módulo
- ⏳ pendente (onda ainda não iniciada)

## Primitivos obrigatórios

| Sigla | Primitivo                              | Fonte canônica                          |
|-------|----------------------------------------|-----------------------------------------|
| RS    | `ReaderShell`                          | `@/components/reader`                   |
| EH    | `EditorialHero`                        | `@/components/reader`                   |
| HC    | `HeaderContext` (variante do domínio)  | `@/components/reader`                   |
| RP    | `ReferencePopover`                     | `@/components/reader`                   |
| NP    | `NexusPanel`                           | `@/components/reader`                   |
| RC    | `ReaderContinuation`                   | `@/components/reader`                   |
| BR    | Barrel `@/components/reader`           | (nenhum import por caminho profundo)    |
| AN    | `ReaderAutoNexusOutput` completo       | inclui `labels`                         |
| DU    | Zero componentes duplicados            | sem primitivos paralelos                |
| TS    | `bunx tsgo --noEmit` limpo no escopo   | —                                       |

---

## C0.1 · Missal Romano — CERTIFIED

`src/components/cathedra/MissaContinuousReader.tsx`

| RS | EH | HC          | RP | NP | RC | BR | AN | DU | TS |
|----|----|-------------|----|----|----|----|----|----|----|
| ✅ | ✅ | ✅ Liturgical | ➖ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## C0.2 · Liturgia das Horas — CERTIFIED

`src/components/cathedra/BreviaryContinuousReader.tsx`

| RS | EH | HC          | RP | NP | RC | BR | AN | DU | TS |
|----|----|-------------|----|----|----|----|----|----|----|
| ✅ | ✅ | ✅ Liturgical | ➖ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Débitos de identidade: `docs/identidade-cathedra-backlog.md` §8.

---

## C0.3 · Prayer Engine — CERTIFIED ✅

Motor único de Rosário/Via Sacra/Novenas/Ladainhas.
`src/components/cathedra/PrayerEngineReader.tsx`

| RS | EH | HC        | RP  | NP  | RC | BR | AN | DU | TS |
|----|----|-----------|-----|-----|----|----|----|----|----|
| ✅ | ✅ | ✅ Prayer | ✅  | ✅  | ✅ | ✅ | ✅ | ✅ | ✅ |

**Fase 1 — feito:**
- `EditorialReaderChrome` substituído por `ReaderShell + EditorialHero`.
- `PrayerContext` (variante canônica de `HeaderContext`) exibindo
  categoria da oração, mistério/estação corrente e posição.
- `ReaderContinuation` servido pelo slot `continuation` do Shell.
- `NexusPanel` da oração instalado no slot `nexus`.
- `PrayerPortal` preservado como portal de entrada (não é Reader).

**Fase 2 — feito (esta onda):**
- Adapter `mysteryAutoNexus` projeta `DBMystery` em
  `ReaderAutoNexusOutput` (buckets bible/catechism/saint/father/magisterium).
- `MysteryNexusPanel` **removido fisicamente**; per-mistério agora usa
  `NexusPanel` canônico.
- Resume Card migrado para `ReaderShell + EditorialHero`.
- Referências inline (bloco) migradas para chips `ReferencePopover`.
- `EditorialReaderChrome` **erradicado** do fluxo do Prayer Engine.
- Guardrail `FORBIDDEN_IMPORTS` mantém `MysteryNexusPanel` bloqueado;
  allowlist do arquivo removida.
- Testes: `mysteryAutoNexus.test.ts` (Vitest) + cobertura automática
  via `reader-template-chain.static.test.ts` e `reader-template-chain.spec.ts`
  (o módulo entra no loop de módulos `certified`).

**Sub-ondas (validação de superfícies) — todas cobertas pelo mesmo motor:**
- C0.3.1 Rosário  — `MysteryHero`, décadas, Modo Contemplação.
- C0.3.2 Via Sacra — `StationContemplation`, 14 estações.
- C0.3.3 Novenas  — `NovenaDetailPage` e ciclo de 9 dias.
- C0.3.4 Ladainhas — ritmo de repetição responsorial.

**Auditoria final:** `rg` em `src/components/prayer/` e `src/prayer-engine/`
por `EditorialReaderChrome|MysteryNexusPanel|NexusBubbles` retorna **0**
resultados. C0.3 pode ser certificada.

---

## C0.4 · Santos

`src/pages/SaintDetailPage.tsx` (a mapear).

| RS | EH | HC | RP | NP | RC | BR | AN | DU | TS |
|----|----|----|----|----|----|----|----|----|----|
| ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

Escopo editorial: Hero · Biografia · Virtudes · Festa litúrgica · Padroados
· Oração · Referências (Bíblia/CIC/Patrística/Magistério) · Santos/Jornadas/
Orações relacionadas.

---

## C0.5 · Bíblia

Popover já é adapter fino sobre `ReferencePopover` canônico. Falta validar
`ReaderShell` e continuação.

| RS | EH | HC | RP        | NP | RC | BR | AN | DU | TS |
|----|----|----|-----------|----|----|----|----|----|----|
| ⏳ | ⏳ | ⏳ | ✅ adapter | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

---

## C0.6 · Catecismo

`src/components/cathedra/Catechism.tsx`

| RS | EH | HC | RP | NP | RC | BR | AN | DU | TS |
|----|----|----|----|----|----|----|----|----|----|
| ✅ | ⏳ | ⏳ | ✅ | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ✅ |

Falta Hero + HeaderContext + Continuation via barrel.

---

## C0.7 · Jornadas · C0.8 · Coleções · C0.9 · ICE Universal

⏳ pendentes — abrir quando a onda anterior fechar.

---

## Sumário

| Onda   | Status                            |
|--------|-----------------------------------|
| C0.1   | CERTIFIED                         |
| C0.2   | CERTIFIED                         |
| C0.3   | CERTIFIED ✅                     |
| C0.4   | pendente                          |
| C0.5   | parcial                           |
| C0.6   | parcial                           |
| C0.7   | pendente                          |
| C0.8   | pendente                          |
| C0.9   | pendente                          |
