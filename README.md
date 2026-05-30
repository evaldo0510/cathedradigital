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

#### Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run token-audit` | Executa o audit básico. Falha se exceder o limite (padrão 5). |
| `npm run token-audit:dry-run` | Lista todas as substituições sugeridas sem modificar os arquivos. |
| `npm run token-audit:fix` | Aplica automaticamente as correções sugeridas (codemod). |
| `npm run test:token-audit` | Executa os testes unitários do sistema de audit. |

#### O que esperar do Modo Dry-Run

Ao executar `npm run token-audit:dry-run`, você verá logs no seguinte formato:
- Confirmação do modo: `--- DRY RUN MODE: No files will be modified ---`
- Detalhes das mudanças: `[DRY RUN] Would replace "p-4" with "p-spacing-md" in src/components/MyComponent.tsx:12`
- Resumo final com o total de problemas identificados.

#### Relatórios e Logs

O audit gera relatórios detalhados na pasta `/reports`:
- `token-audit.html`: Dashboard visual para revisão de conformidade.
- `token-audit.json`: Dados estruturados da última execução.
- `compliance-history.json`: Histórico das últimas 30 execuções para acompanhamento de tendências.

**Importante:** No CI, o comando `token-audit:ci` é executado automaticamente e bloqueará o merge se houverem violações acima do limite configurado.
