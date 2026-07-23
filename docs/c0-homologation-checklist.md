# C0 · Homologation Checklist

> Referência oficial da Sprint C0 (Homologação Geral Cathedra).
> Uma linha por primitivo canônico. Onda só fecha com **todas** as caixas
> marcadas e `bunx tsgo --noEmit` limpo no escopo.
>
> Governança: Regra 12 do COS (Homologação Sequencial) — nenhuma onda
> avança enquanto a anterior não estiver 100%.

## Legenda

- ✅ conforme
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

## C0.1 · Missal Romano

Arquivo: `src/components/cathedra/MissaContinuousReader.tsx`

| RS | EH | HC          | RP | NP | RC | BR | AN | DU | TS |
|----|----|-------------|----|----|----|----|----|----|----|
| ✅ | ✅ | ✅ Liturgical | ➖ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Status:** CERTIFIED

---

## C0.2 · Liturgia das Horas

Arquivo: `src/components/cathedra/BreviaryContinuousReader.tsx`

| RS | EH | HC          | RP | NP | RC | BR | AN | DU | TS |
|----|----|-------------|----|----|----|----|----|----|----|
| ✅ | ✅ | ✅ Liturgical | ➖ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Status:** CERTIFIED
**Débitos de identidade capturados:** ver `docs/identidade-cathedra-backlog.md` §8.

---

## C0.3 · Santos

Arquivos previstos: `src/pages/SaintDetailPage.tsx` (a mapear).

| RS | EH | HC | RP | NP | RC | BR | AN | DU | TS |
|----|----|----|----|----|----|----|----|----|----|
| ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

**Escopo editorial obrigatório:** Hero · Biografia · Virtudes · Festa
litúrgica · Padroados · Oração · Referências (Bíblia/CIC/Patrística/Magistério)
· Santos relacionados · Jornadas relacionadas · Orações relacionadas.

---

## C0.4 · Rosário

Arquivos: `src/components/cathedra/PrayerEngineReader.tsx`,
`src/components/prayer/PrayerPortal.tsx`,
`src/components/prayer/rosary/MysteryNexusPanel.tsx`.

| RS | EH | HC | RP | NP | RC             | BR | AN | DU | TS |
|----|----|----|----|----|----------------|----|----|----|----|
| ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ shared path | ❌ | ❌ | ❌ | ✅ |

**Ausente:** `ReaderShell`, `EditorialHero`, `HeaderContext`,
`NexusPanel`. **Paralelo:** `MysteryNexusPanel` (deprecado §10),
`PrayerPortal` fora do Shell. `ReaderContinuation` importado de
`@/components/shared/ReaderContinuation` em vez do barrel do Reader.

---

## C0.5 · Via Sacra

Componentes: `src/components/prayer/viasacra/*`, mesma stack Prayer Engine
do Rosário.

| RS | EH | HC | RP | NP | RC             | BR | AN | DU | TS |
|----|----|----|----|----|----------------|----|----|----|----|
| ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ shared path | ❌ | ❌ | ❌ | ✅ |

**Herda a mesma dívida da C0.4.**

---

## C0.6 · Bíblia

| RS | EH | HC | RP        | NP | RC | BR | AN | DU | TS |
|----|----|----|-----------|----|----|----|----|----|----|
| ⏳ | ⏳ | ⏳ | ✅ adapter | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

Popover já é adapter fino sobre `ReferencePopover` canônico.

---

## C0.7 · Catecismo

Arquivo: `src/components/cathedra/Catechism.tsx`

| RS | EH | HC | RP | NP | RC | BR | AN | DU | TS |
|----|----|----|----|----|----|----|----|----|----|
| ✅ | ⏳ | ⏳ | ✅ | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ✅ |

Precisa revalidar Hero + HeaderContext + Continuation.

---

## C0.8 · Jornadas · C0.9 · Coleções · C0.10 · ICE Universal

⏳ pendentes — abrir quando a onda anterior fechar.

---

## Sumário

| Onda   | Status       |
|--------|--------------|
| C0.1   | CERTIFIED    |
| C0.2   | CERTIFIED    |
| C0.3   | pendente     |
| C0.4   | **BLOQUEADO** (arquitetura paralela) |
| C0.5   | **BLOQUEADO** (arquitetura paralela) |
| C0.6   | parcial      |
| C0.7   | parcial      |
| C0.8   | pendente     |
| C0.9   | pendente     |
| C0.10  | pendente     |
