import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SKILL_DIR = '.agents/skills/task-master';
const INBOX_DIR = path.join(SKILL_DIR, 'inbox');

describe('TASK MASTER CLI', () => {
  // Ensure we have a clean state for testing pendencies
  beforeEach(() => {
    if (!fs.existsSync(INBOX_DIR)) {
      fs.mkdirSync(INBOX_DIR, { recursive: true });
    }
    // Clean inboxes
    ['agent-a', 'agent-b', 'agent-c'].forEach(agent => {
      fs.writeFileSync(
        path.join(INBOX_DIR, `${agent}.md`),
        `# Inbox: ${agent.toUpperCase()}\n\nStatus: Ready\n\n## Pending Requests\n\n- None\n`
      );
    });
    // Remove state if exists
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

  it('deve falhar (exit code 1) se houver pendências no inbox', () => {
    // Inject a pendency
    fs.writeFileSync(
      path.join(INBOX_DIR, 'agent-a.md'),
      `# Inbox: AGENT-A\n\n## Pending Requests\n\n- [ ] Corrigir bug de layout\n`
    );

    try {
      execSync('bun run scripts/task-master.ts run');
      // If it doesn't throw, it failed the test
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.status).toBe(1);
      const output = error.stdout.toString();
      expect(output).toContain('Falha: Existem 1 pendências nos Inboxes');
    }
  });

  it('deve retomar a execução com --resume', () => {
    // 1. Run until wave 1 and fail it manually or just verify state
    // For this test, we can mock the state file directly
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
});
