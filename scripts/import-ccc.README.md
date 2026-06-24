# Importação completa do CCC (2865 parágrafos)

Script: `scripts/import-ccc.ts`

## 1. Preparar o JSON

Formato aceito (qualquer um dos dois):

```jsonc
// Array
[
  { "paragraph": 1, "content": "A vida do homem...", "explicacao": "..." },
  { "paragraph": 2, "content": "..." }
]

// Mapa por número
{
  "1": { "content": "A vida do homem...", "explicacao": "..." },
  "2": { "content": "..." }
}
```

Campos opcionais reconhecidos: `texto_base`, `explicacao`, `interpretacao_profunda`,
`aplicacao_pratica`, `reflexao_final`, `exercicio`.

## 2. Validar antes de gravar

```bash
SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  \
bunx tsx scripts/import-ccc.ts ./data/ccc.json --dry-run
```

Saída esperada: `válidos=2865 inválidos=0 únicos=2865`.

## 3. Importar em lote

```bash
SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  \
bunx tsx scripts/import-ccc.ts ./data/ccc.json --batch=200
```

O script faz **upsert idempotente** por `paragraph` (PK), então pode ser
re-executado com segurança — só sobrescreve as linhas afetadas.

## 4. Segurança

- A tabela `catechism_official` tem RLS com leitura pública. O script usa a
  **service role key** para inserir em massa — execute apenas em ambiente
  confiável (terminal local, CI privado). Nunca exponha a chave no front-end.
- Cada item é validado com Zod (faixa 1..2865, `content` não vazio). Itens
  fora do padrão são reportados e ignorados; o script retorna exit code `2`
  quando houver entradas inválidas e `1` em falha de gravação.
