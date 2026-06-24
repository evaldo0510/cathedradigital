# Edge Function — `bible-text`

Retorna o texto bíblico de um capítulo a partir de uma abreviação (`abbrev`) e número de capítulo (`chapter`).

Base URL: `${SUPABASE_URL}/functions/v1/bible-text` (POST).

Headers recomendados:

```
Authorization: Bearer <SUPABASE_ANON_KEY>
apikey: <SUPABASE_ANON_KEY>
Content-Type: application/json
x-correlation-id: <id rastreável; ecoado em toda resposta>
```

---

## Contrato

Todos os schemas são definidos em `src/shared/bibleTextSchema.factory.ts`
(fonte única, sincronizada com `supabase/functions/_shared/bibleTextSchema.factory.ts`).

### Request — `BibleTextInputSchema`

| Campo                  | Tipo                | Obrigatório | Observação                                |
| ---------------------- | ------------------- | ----------- | ----------------------------------------- |
| `abbrev`               | `string` (1..16)    | sim         | Case-insensitive, trim aplicado           |
| `chapter`              | `int > 0`           | sim         |                                           |
| `client_cache_version` | `string \| number`  | não         | Usado para invalidar cache L1 do cliente  |

`.strict()` — campos extras são rejeitados com 400.

### Sucesso (200) — `BibleTextSuccessSchema`

```json
{
  "book": "1 Timóteo",
  "chapter": 3,
  "verses": [
    { "number": 1, "text": "Fiel é a palavra...", "comment": null }
  ],
  "metadata": {
    "source": "bolls.life",
    "correlationId": "abc-123",
    "received_abbrev": "1tm",
    "canonical_abbr": "1Tm",
    "bollsId": 54
  }
}
```

### Erro de payload (400) — `BibleTextInvalidPayloadSchema`

Campos obrigatórios: `error`, `correlationId`.

```json
{ "error": "Parâmetros inválidos: abbrev é obrigatório", "correlationId": "abc-123" }
```

### Erro de domínio (404) — `BibleTextErrorSchema`

Todos os 8 campos são **obrigatórios** e validados via `BibleTextErrorSchema.parse(...)`
antes do `JSON.stringify` — uma resposta sem qualquer campo causa 500 com `correlationId`.

| Campo             | Tipo                          | Notas                                                       |
| ----------------- | ----------------------------- | ----------------------------------------------------------- |
| `error`           | `string` não-vazio            | Mensagem curta de topo (ex.: `"Texto não encontrado"`)      |
| `reason`          | `string` não-vazio            | Causa descritiva (classificada pelo CI — ver tabela abaixo) |
| `received_abbrev` | `string`                      | Exatamente o que o cliente enviou                           |
| `canonical_abbr`  | `string \| null`              | `null` quando abbrev é desconhecida                         |
| `book_name`       | `string \| null`              | `null` quando abbrev é desconhecida                         |
| `bollsId`         | `int > 0 \| null`             | `null` quando abbrev é desconhecida                         |
| `chapter`         | `int > 0`                     | Eco do `chapter` recebido                                   |
| `correlationId`   | `string` não-vazio            | Eco do `x-correlation-id` recebido                          |

#### Exemplo — abreviação desconhecida (`unknown_abbrev`)

```json
{
  "error": "Texto não encontrado",
  "reason": "Abreviação não reconhecida: \"xx\"",
  "received_abbrev": "xx",
  "canonical_abbr": null,
  "book_name": null,
  "bollsId": null,
  "chapter": 1,
  "correlationId": "e2e-xx-1"
}
```

#### Exemplo — capítulo indisponível (`chapter_unavailable`)

```json
{
  "error": "Texto não encontrado",
  "reason": "Capítulo 999 de Gênesis não foi encontrado em nenhuma fonte",
  "received_abbrev": "gn",
  "canonical_abbr": "Gn",
  "book_name": "Gênesis",
  "bollsId": 1,
  "chapter": 999,
  "correlationId": "e2e-gn-999"
}
```

#### Exemplo — livro reconhecido, capítulo válido mas fonte indisponível (com `correlationId` do cliente)

```json
{
  "error": "Texto não encontrado",
  "reason": "Capítulo 1 de Apocalipse não foi encontrado em nenhuma fonte",
  "received_abbrev": "ap",
  "canonical_abbr": "Ap",
  "book_name": "Apocalipse",
  "bollsId": 66,
  "chapter": 1,
  "correlationId": "client-req-20260624-7f3a"
}
```

#### Exemplo mínimo (apenas os 8 campos obrigatórios, sem extras)

A resposta 404 NUNCA contém `verses`, `book` ou `metadata` — esses pertencem ao schema de sucesso.
Qualquer cliente pode validar via `BibleTextErrorSchema.parse(json)` (exportado em
`src/shared/bibleTextSchema.ts`):

```ts
import { BibleTextErrorSchema } from "@/shared/bibleTextSchema";
const err = BibleTextErrorSchema.parse(json); // lança ZodError se faltar campo
// err.correlationId === request headers["x-correlation-id"]
```

---



## Classificação de erros no CI

| `reason` casa com…                                  | Categoria             | Limite default (workflow) |
| --------------------------------------------------- | --------------------- | ------------------------- |
| `/Abreviação não reconhecida/i`                     | `unknown_abbrev`      | `BIBLE_TEXT_MAX_UNKNOWN_ABBREV`      |
| `/não foi encontrado em nenhuma fonte/i`            | `chapter_unavailable` | `BIBLE_TEXT_MAX_CHAPTER_UNAVAILABLE` |
| `/Parâmetros inválidos/i`                           | `invalid_payload`     | `BIBLE_TEXT_MAX_INVALID_PAYLOAD`     |
| (demais)                                            | `other`               | `BIBLE_TEXT_MAX_OTHER`               |

`scripts/edge-bible-text-summary.ts` consome esses thresholds e falha o job (`exit 2`)
quando qualquer categoria ultrapassa o limite.

## Correlation ID

A edge **sempre** ecoa o `x-correlation-id` recebido (ou gera um se ausente) em:
- `metadata.correlationId` (sucesso)
- `correlationId` (erros 400 e 404)

Garantia coberta por testes E2E em `tests/e2e/bible-text-edge.spec.ts`.
