# Testes E2E — Jornadas

Cobre validação de CTAs, autosave de reflexão e preview do certificado em `/jornadas/:id/step` e `/jornadas/:id/conclusao`.

Arquivo: `tests/e2e/jornadas-step-validation.spec.ts`

## Descoberta automática de IDs

Não é preciso definir `E2E_JOURNEY_ID` e `E2E_JOURNEY_STEP_ID` manualmente. O script abaixo consulta o banco (via anon key) e escolhe a primeira jornada ativa com uma etapa que tenha `final_question`/`journal_prompt`/`question`, gravando o resultado em `.e2e-ids.json` (git-ignorado):

```bash
bun run test:jornadas:discover
```

Saída típica:

```json
{ "E2E_JOURNEY_ID": "...", "E2E_JOURNEY_STEP_ID": "..." }
```

O spec lê env vars primeiro e cai para `.e2e-ids.json` se não existirem — nenhum export manual necessário.

## Rodar localmente

```bash
# dev server precisa estar em http://localhost:8080
bun run test:jornadas
```

Isso executa descoberta + Playwright (`chromium`) num único comando.

## Rodar no CI

```bash
bun run test:jornadas:ci
```

Modo `HEADLESS=true CI=true` com reporter `list,html`. O passo de descoberta usa a `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` do `.env` — não requer service role nem secret extra.

## Autenticação

Os testes requerem sessão Supabase injetada pelo runner (`LOVABLE_BROWSER_AUTH_STATUS=injected`). Sem ela, o `describe` é pulado automaticamente para evitar falso-vermelho.

Para rodar localmente contra um usuário próprio, exporte:

```bash
export LOVABLE_BROWSER_AUTH_STATUS=injected
export LOVABLE_BROWSER_SUPABASE_STORAGE_KEY="sb-gpwrpmoniglarqwfyryp-auth-token"
export LOVABLE_BROWSER_SUPABASE_SESSION_JSON='<JSON completo da sessão>'
```

## Overrides

Env vars sempre vencem o cache `.e2e-ids.json`:

```bash
E2E_JOURNEY_ID=... E2E_JOURNEY_STEP_ID=... bun run test:jornadas
```

## Troubleshooting

- **"Nenhuma jornada ativa possui etapa com final_question…"** — insira uma etapa com pergunta final ou ajuste o filtro em `scripts/discover-journey-ids.ts`.
- **Testes pulados no CI** — verifique se a sessão Supabase está sendo injetada pelo runner do Lovable.
- **`.e2e-ids.json` desatualizado** — rode `bun run test:jornadas:discover` novamente; ele sobrescreve o arquivo.
