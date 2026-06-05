# Mobile E2E Suite - CI & Local Sync

## CI Pipeline (GitHub Actions)

O workflow `mobile-ci.yml` gerencia execuções em matriz mobile e gera manifestos de evidências detalhados.

### Variáveis de Ambiente (CI)
Você pode configurar os seguintes `vars` ou `secrets` no GitHub:
- `RETENTION_DAYS_HTML`: Dias para manter o relatório HTML (Default: 7)
- `RETENTION_DAYS_SCREENSHOTS`: Dias para screenshots (Default: 3)
- `RETENTION_DAYS_VIDEOS`: Dias para vídeos (Default: 3)
- `RETENTION_DAYS_TRACES`: Dias para traces (Default: 3)
- `VITE_SWIPE_THRESHOLD`: Sensibilidade de swipe (Default: 80)
- `VITE_SWIPE_RATIO`: Proporção de swipe (Default: 2.5)

## Sincronização Local de Falhas

### 1. Sincronizar Artefatos
Baixa e valida os artefatos do CI para replicar erros localmente.
```bash
# Baixar via Run ID (requer GitHub CLI)
npm run test:e2e:sync-artifacts -- --run-id=12345

# Filtrar por dispositivo
npm run test:e2e:sync-artifacts -- --device=mobile-chrome

# Filtrar por nome do teste
npm run test:e2e:sync-artifacts -- --test="precision"
```

### 2. Validação Pós-Sync
O comando de sincronização valida automaticamente se todos os arquivos (HTML, Trace, Screenshots e Vídeos) listados no manifesto existem na pasta `playwright-report`. Caso falte algo, ele reportará o erro antes de sugerir o comando de execução.

### 3. Réplica Exata
Após o sync, o script gera um comando `npx playwright test` formatado com as specs e projetos específicos que falharam, garantindo que você rode apenas o necessário com as mesmas variáveis de ambiente do CI.

## Scripts Úteis

- `npm run test:e2e:headless`: Roda a suite mobile completa localmente em modo headless.
- `npm run test:e2e:ci-replica-failed`: Roda apenas os testes que falharam na última execução local.
- `npm run test:e2e:sync-artifacts`: Sincroniza e valida o manifesto gerado pelo CI.
