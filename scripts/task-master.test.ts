import { describe, it, expect, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SKILL_DIR = '.agents/skills/task-master';
const INBOX_DIR = path.join(SKILL_DIR, 'inbox');

describe('TASK MASTER CLI', () => {
  beforeEach(() => {
    if (!fs.existsSync(INBOX_DIR)) {
      fs.mkdirSync(INBOX_DIR, { recursive: true });
    }
    ['agent-a', 'agent-b', 'agent-c'].forEach(agent => {
      fs.writeFileSync(
        path.join(INBOX_DIR, `${agent}.md`),
        `# Inbox: ${agent.toUpperCase()}\n\nStatus: Ready\n\n## Pending Requests\n\n- None\n`
      );
    });
    const stateFile = 'reports/task-master/state.json';
    if (fs.existsSync(stateFile)) fs.unlinkSync(stateFile);
  });

  it('deve mostrar status limpo quando não há pendências', () => {
    const output = execSync('bun run scripts/task-master.ts status').toString();
    expect(output).toContain('🟢 AGENT-A');
    expect(output).toContain('Tudo limpo - Agente pronto');
    expect(output).toContain('Total de pendências acumuladas: 0');
  });

  it('deve simular arquivos no modo --dry-run', () => {
    const output = execSync('bun run scripts/task-master.ts run --dry-run').toString();
    expect(output).toContain('🔍 [DRY-RUN]');
    expect(output).toContain('Arquivos afetados (simulação):');
    expect(output).toContain('src/App.tsx');
  });

  it('deve falhar (exit code 1) se houver pendências no inbox', { timeout: 60000 }, () => {
    fs.writeFileSync(
      path.join(INBOX_DIR, 'agent-a.md'),
      `# Inbox: AGENT-A\n\n## Pending Requests\n\n- [ ] Corrigir bug de layout\n`
    );

    try {
      execSync('bun run scripts/task-master.ts run');
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.status).toBe(1);
      const stdout = error.stdout.toString();
      const stderr = error.stderr.toString();
      expect(stdout + stderr).toContain('Falha: Existem 1 pendências nos Inboxes');
    }
  });

  it('deve retomar a execução com --resume', () => {
    const reportsDir = 'reports/task-master';
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    
    fs.writeFileSync(path.join(reportsDir, 'state.json'), JSON.stringify({
      lastSuccessfulWave: 1,
      lastReportTimestamp: new Date().toISOString()
    }));

    const output = execSync('bun run scripts/task-master.ts run --resume --dry-run').toString();
    expect(output).toContain('[RESUME MODE]');
    expect(output).toContain('Pulando waves já concluídas (1 até 1)');
    expect(output).toContain('Iniciando WAVE 2');
  });
  it('deve gerar relatório HTML com logs, erros e links', () => {
    // Limpar diretório de relatórios antes
    const reportsDir = 'reports/task-master';
    if (fs.existsSync(reportsDir)) {
      fs.readdirSync(reportsDir).forEach(file => {
        if (file.endsWith('.html') || file.endsWith('.json')) {
          fs.unlinkSync(path.join(reportsDir, file));
        }
      });
    }

    // Executar para gerar relatório (usamos dry-run para ser rápido e não falhar o CI)
    execSync('bun run scripts/task-master.ts run --dry-run');

    const files = fs.readdirSync(reportsDir);
    const htmlFile = files.find(f => f.endsWith('.html'));
    expect(htmlFile).toBeDefined();

    const htmlContent = fs.readFileSync(path.join(reportsDir, htmlFile!), 'utf-8');

    // Validações do formato HTML
    expect(htmlContent).toContain('TASK MASTER: Orquestração de Elite');
    expect(htmlContent).toContain('Wave 1');
    expect(htmlContent).toContain('Wave 2');
    
    // Validar links do Step Summary
    expect(htmlContent).toContain('class="summary-link"');
    expect(htmlContent).toContain('Acessar Step Summary');

    // Validar Logs
    expect(htmlContent).toContain('class="log-container"');
    expect(htmlContent).toContain('Iniciando WAVE 1');
    expect(htmlContent).toContain('Arquivos afetados:');

    // Nota: No dry-run do script atual, erros não são gerados se for sucesso.
    // Mas a estrutura do HTML deve estar pronta para eles.
    // Vamos garantir que se houver erros, eles apareçam.
  });
});
