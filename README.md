# Cathedra Digital

[![Playwright Tests](https://github.com/lovable/cathedra-digital/actions/workflows/playwright.yml/badge.svg)](https://github.com/lovable/cathedra-digital/actions/workflows/playwright.yml)

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID
**Test Report**: [Última Execução no CI](https://github.com/lovable/cathedra-digital/actions/workflows/playwright.yml)


## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## 🧪 Guia de Testes

Este projeto possui uma suíte robusta de testes para garantir a estabilidade e acessibilidade premium.

### 1. Testes Unitários
Executados via Bun (rápido e leve).
```bash
bun test
```

### 2. Testes E2E (Playwright)
Validam fluxos completos, navegação por swipe e regressão visual.
```bash
# Instalar dependências do Playwright (executar uma vez)
npx playwright install

# Rodar todos os testes E2E (Chrome, Safari, Mobile)
npx playwright test

# Rodar em modo visual (UI Mode) para depuração
npx playwright test --ui

# Rodar apenas um arquivo específico
npx playwright test tests/e2e/bottom-nav-navigation.spec.ts
```

### 3. Testes de Acessibilidade (Axe-core)
Verificam conformidade com WCAG 2.1 AA automaticamente.
```bash
# Rodar o audit global de acessibilidade
npx playwright test tests/e2e/accessibility.spec.ts
```

### 4. Filtros e Comandos Úteis

Para reproduzir falhas de forma consistente ou focar em partes específicas da aplicação:

- **Filtrar por projeto (browser)**:
  ```bash
  # Rodar apenas no Mobile Safari
  npx playwright test --project="mobile-safari"
  ```
- **Filtrar por nome de teste (grep)**:
  ```bash
  # Rodar todos os testes que contém "swipe" no título
  npx playwright test -g "swipe"
  ```
- **Executar arquivo específico**:
  ```bash
  npx playwright test tests/e2e/bottom-nav-navigation.spec.ts
  ```
- **Debugar falhas**: `npx playwright show-report` (abre o relatório da última execução)
- **Atualizar Snapshots Visuais**: `npx playwright test --update-snapshots`

### 5. Scripts de Atalho (package.json)

Estes scripts emulam o ambiente de CI (`CI=true`) localmente para garantir consistência:

```bash
# Rodar unitários com CI env
npm run test:local:unit

# Rodar todos os E2E com CI env (retries ativos, 1 worker)
npm run test:local:e2e

# Rodar apenas Axe (acessibilidade) com CI env
npm run test:local:axe
```

### Variáveis de Ambiente
- `CI=true`: Ativa retries (2x), remove `test.only` e reduz workers para 1 para máxima estabilidade.
- `PLAYWRIGHT_TEST_BASE_URL`: Define a URL alvo (padrão: http://localhost:8080).

### 6. Token Audit & Governance

O sistema Cathedra utiliza um sistema de governança de tokens para garantir que classes Tailwind não-tokenizadas não sejam introduzidas no projeto.

#### Comandos e Opções (Flags)

O script `cathedra-audit.ts` suporta as seguintes flags:

| Flag | Descrição | Exemplo |
|------|-----------|---------|
| `--threshold=N` | Define o limite máximo de violações permitidas (default: 5). | `npm run token-audit -- --threshold=10` |
| `--fix` | Ativa o modo de correção automática (codemod). | `npm run token-audit:fix` |
| `--dry-run` | Mostra o que seria alterado sem modificar nenhum arquivo. | `npm run token-audit:dry-run` |
| `--soft` | Não retorna erro (exit 1) mesmo se ultrapassar o threshold. | `npm run token-audit -- --soft` |

#### Guia de Validação Local (Passo a Passo)

1. **Dry-Run (Seguro)**:
    ```bash
    npm run token-audit:dry-run
    ```
    *Validação*: Verifique os logs no console. Eles devem listar todas as substituições sugeridas (ex: `Would replace "p-4" with "p-spacing-md"`). Nenhum arquivo deve ser alterado.

2. **Gerar Relatório Detalhado (Report)**:
   ```bash
   npm run token-audit:report
   ```
   *Validação*: Este comando gera uma análise completa em `./reports` sem interromper a execução caso existam falhas. É ideal para inspeção visual antes de aplicar o fix.

3. **Audit (Check de Conformidade)**:
   ```bash
   npm run token-audit
   ```
   *Validação*: Se o número de problemas for > 5, o comando falhará (útil para testar o comportamento do CI).

4. **Fix (Aplicar Correções)**:
   ```bash
   npm run token-audit:fix
   ```
   *Validação*: Abra um arquivo modificado e verifique se as classes Tailwind foram substituídas pelos tokens premium.

#### Relatórios e Logs Esperados

Ao executar `npm run token-audit:dry-run` ou `npm run token-audit:report`, os seguintes arquivos são gerados em uma estrutura organizada dentro da pasta `./reports`:

```text
reports/
├── compliance-history.json    # Histórico das últimas 30 execuções (JSON)
├── token-audit.html           # Dashboard visual interativo (HTML)
└── token-audit.json           # Dados brutos da última auditoria (JSON)
```

| Caminho | Tipo | Descrição |
|---------|------|-----------|
| `./reports/token-audit.html` | Dashboard | Visualização rica (HTML) com gráficos de tendência, score de saúde e tabela detalhada de violações. |
| `./reports/token-audit.json` | JSON | Dados estruturados com resultados da última execução e detalhes de cada violação encontrada. |
| `./reports/compliance-history.json` | Histórico | Log histórico (JSON) que armazena o progresso de conformidade das últimas 30 execuções. |
| **Console Output** | Logs em Tempo Real | Resumo imediato no terminal com as mensagens de substituição sugeridas no modo dry-run. |



#### Troubleshooting (Resolução de Problemas)

| Problema | Causa Comum | Solução |
|----------|-------------|---------|
| `rg: command not found` | `ripgrep` não está instalado no sistema. | Instale o ripgrep (`brew install rg` no Mac ou `sudo apt install ripgrep` no Ubuntu). |
| Audit não detecta nada | Regex não bate com o formato das classes ou arquivos fora de `src/`. | Verifique as definições em `forbiddenPatterns` no script `cathedra-audit.ts`. |
| Erro de permissão ao salvar | Arquivos estão bloqueados ou sem permissão de escrita. | Verifique as permissões de arquivo no seu sistema operacional. |

#### Exemplos de Saída e Mensagens de Erro

**Erro: Threshold Ultrapassado**
```text
--- CATHEDRA DESIGN TOKEN COMPLIANCE AUDIT ---
❌ Direct Spacing: 12 issues found.
❌ Direct Typography: 3 issues found.

Audit finished. Reports generated in /reports
Error: Process completed with exit code 1.
```
*Ação*: Execute `npm run token-audit:fix` para corrigir automaticamente ou ajuste as classes manualmente conforme as sugestões nos logs.

**Dry-Run (Log de Substituição)**
```text
--- CATHEDRA DESIGN TOKEN COMPLIANCE AUDIT ---
--- DRY RUN MODE: No files will be modified ---
  [DRY RUN] Would replace "p-4" with "p-spacing-md" in src/components/Card.tsx:12
  [DRY RUN] Would replace "rounded-lg" with "rounded-premium-lg" in src/App.tsx:45

--- DRY RUN FINISHED: 2 potential issues identified ---
Audit finished. Reports generated in /reports
```

### 7. Suíte Completa de Verificação (Checklist de CI)

Para rodar localmente **exatamente todos os checks** que o pipeline de CI executa antes de permitir um merge, utilize o comando:

```bash
npm run check-all
```

> **Nota**: Este projeto utiliza `husky`. O comando acima é executado automaticamente em cada `git commit`. Se o check falhar, o commit será bloqueado até que os problemas sejam resolvidos.

Este comando executa em sequência:
1. `npm run lint` (Linting de código)
2. `npm run typecheck` (Checagem de tipos TS)
3. `npm run test:local:unit` (Testes unitários)
4. `npm run token-audit:ci` (Governança de tokens)
5. `npm run test:local:axe` (Acessibilidade)


