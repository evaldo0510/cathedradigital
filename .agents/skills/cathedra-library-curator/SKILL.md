---
name: cathedra-library-curator
description: Curates the Biblioteca space — Fathers, Doctors, Magisterium, Councils, Canons. Ensures unified reading experience, bibliography, and Nexus. Use for library content, documents, or reader work.
---

# Library Curator

Fecha o ecossistema de estudo. Biblioteca = Padres, Doutores, Magistério, Concílios, Cânones.

## Constituição

Artigos 2, 3, 4, 5, 6, 7, 8, 9 de `docs/CATHEDRA-CONSTITUTION.md`.

## Escopo

| Fonte | Tabela / rota | Nota |
|---|---|---|
| Padres | `saints` (`category='father'`) → `/santos/:slug` | Reaproveita Saints Expert |
| Doutores | `saints` (`category='doctor'`) → `/santos/:slug` | Idem |
| Magistério | `magisterium_documents` → `/magisterium/:doc` | Encíclicas, exortações, cartas |
| Concílios | `councils` → `/concilios/:slug` | Vaticano I/II, Trento, etc. |
| Cânones | `canons` → `/canones/:num` | CIC 1983 |

Bíblia e Catecismo têm leitores próprios; Biblioteca cita, não duplica.

## Leitor unificado

- **Reader único:** `EditorialReaderChrome` + `ReaderContinuation`.
- Tipografia editorial via `useReaderTypography`.
- `data-space="biblioteca"`.
- `EditorialHero` com autor + obra + ano + tempo de leitura.

## Bibliografia

Toda citação: **autor + obra + seção + edição** (quando aplicável). Fontes primárias: Vatican.va, DH (Denzinger), edições Paulus/Vozes.

## Nexus obrigatório

Todo documento tem ≥ 3 arestas:
1. Bíblia (versículo fundante).
2. Catecismo (parágrafo correspondente).
3. Autor/santo (se aplicável) ou outro doc que cita/é citado.

Documentos magisteriais frequentemente têm dezenas de citações — curar até ≤ 8 principais no Nexus visível; restante fica em nota de rodapé.

## Coleções

Usar `KnowledgeCollectionRegistry`: `collection:enciclicas`, `collection:concilio-vaticano-ii`, `collection:doutores-igreja`, etc. Novos documentos entram na coleção certa.

## SEO

`routeMeta.ts` cobre cada rota da biblioteca. JSON-LD `Article` com `author`, `datePublished`, `publisher`.

## Proibições

- Reader novo para documento magisterial.
- Tabela separada para Padres/Doutores (vivem em `saints`).
- Citação sem fonte precisa.
- URL Vatican.va inline em vez de nó Magistério interno.
- Doc "ilha" fora de coleção.

## Checklist

- [ ] Fonte na tabela correta
- [ ] Rota via `RouteRegistry`
- [ ] Renderiza via `EditorialReaderChrome`
- [ ] `data-space="biblioteca"`
- [ ] Bibliografia com autor + obra + seção + edição
- [ ] ≥ 3 arestas no Nexus, prioridade respeitada
- [ ] Entra em `KnowledgeCollectionRegistry`
- [ ] `routeMeta.ts` preenchido
- [ ] `ReaderContinuation` sugere doc/santo/tema irmão
