# Task: Monitorar advisory do @capacitor/cli (tar)

**Status:** aberto — aguardando release upstream
**Aberto em:** 2026-07-26
**Owner:** infra / segurança
**Prioridade:** média (mitigado por `overrides` para `tar ^7.5.15`)

## Contexto

O `@capacitor/cli` (devDependency) puxa uma versão vulnerável de `tar`.
Aplicamos mitigação temporária via `overrides` / `resolutions` no `package.json`.

## Critério de conclusão

Marcar esta task como resolvida assim que **ambas** as condições forem verdadeiras:

1. Nova versão de `@capacitor/cli` publicada com `tar >= 7.5.15` como dependência transitiva direta.
2. `bun audit --production=false` executado localmente sem findings high/critical após atualização.

## Passos ao resolver

```bash
bun update @capacitor/cli @capacitor/core @capacitor/ios @capacitor/android
# remover overrides/resolutions de tar em package.json se não forem mais necessárias
bun install
bun audit
```

Após o merge:
- Rodar `security--run_security_scan` e conferir o histórico em `public/security-rescan-history.json`.
- Fechar esta task movendo para `docs/tasks/_done/`.

## Monitoramento

- Upstream: https://github.com/ionic-team/capacitor/releases
- Advisory: https://github.com/advisories (buscar `tar`)
- CI: workflow `.github/workflows/dependency-audit.yml` reexecuta diariamente e bloqueia
  PRs se surgirem novas vulnerabilidades high/critical.
