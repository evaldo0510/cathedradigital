import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const TEST_DIR = 'reports-test-temp';
const TEST_README = 'README-test.md';
const SCRIPT_PATH = 'scripts/verify-reports.ts';

describe('reports:verify integration tests', () => {
  beforeEach(() => {
    // Setup temporary test environment
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR);
    
    // Create a mock README with the expected structure
    const initialReadme = `
#### Estrutura de Relatórios e Logs (Exemplo Real)

Ao executar \`npm run token-audit:dry-run\` ou \`npm run token-audit:report\`, a pasta \`./reports\` é populada com a seguinte estrutura:

\`\`\`text
reports/
├── compliance-history.json    # Histórico de progresso
└── token-audit.json           # Logs técnicos brutos (mais recente)
\`\`\`
`;
    writeFileSync(TEST_README, initialReadme);

    // Create the files documented in the README to ensure alignment by default
    writeFileSync(join(TEST_DIR, 'compliance-history.json'), JSON.stringify([]));
    writeFileSync(join(TEST_DIR, 'token-audit.json'), JSON.stringify({ timestamp: '2026-05-30T10:00:00Z', totalIssues: 0 }));
    
    // Set environment variables for the script to use our test paths
    process.env.REPORTS_DIR_OVERRIDE = TEST_DIR;
    process.env.README_PATH_OVERRIDE = TEST_README;
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    if (existsSync(TEST_README)) rmSync(TEST_README);
    if (existsSync('divergences.md')) rmSync('divergences.md');
    delete process.env.REPORTS_DIR_OVERRIDE;
    delete process.env.README_PATH_OVERRIDE;
    delete process.env.REPORTS_FAIL_ON_DIVERGENCES;
  });

  const runVerify = (args: string[] = [], env: any = {}) => {
    // Create a temporary file for GitHub Summary if requested
    const summaryPath = join(TEST_DIR, 'summary.md');
    const githubEnv = { 
      ...process.env, 
      ...env,
      REPORTS_DIR_OVERRIDE: TEST_DIR,
      README_PATH_OVERRIDE: TEST_README,
    };
    
    if (env.GITHUB_ACTIONS) {
      githubEnv.GITHUB_STEP_SUMMARY = summaryPath;
      if (!existsSync(summaryPath)) writeFileSync(summaryPath, '');
    }

    try {
      const command = `bun run ${SCRIPT_PATH} ${args.join(' ')}`;
      const output = execSync(command, { 
        env: githubEnv,
        encoding: 'utf8' 
      });
      const summary = env.GITHUB_ACTIONS && existsSync(summaryPath) ? readFileSync(summaryPath, 'utf8') : '';
      return { status: 0, output, summary };
    } catch (error: any) {
      const summary = env.GITHUB_ACTIONS && existsSync(summaryPath) ? readFileSync(summaryPath, 'utf8') : '';
      return { status: error.status, output: error.stdout, summary };
    }
  };

  it('should fail when there is a divergence and --fail-on-divergence is set', () => {
    // Create a file that is not in the README
    writeFileSync(join(TEST_DIR, 'unexpected-file.json'), JSON.stringify({ timestamp: '2026-05-30T10-00-00', totalIssues: 0 }));
    
    const result = runVerify(['--fail-on-divergence']);
    expect(result.status).toBe(1);
    expect(result.output).toContain('Arquivos inesperados');
  });

  it('should pass when there is a divergence but --fail-on-divergence is not set', () => {
    writeFileSync(join(TEST_DIR, 'unexpected-file.json'), JSON.stringify({ timestamp: '2026-05-30T10-00-00', totalIssues: 0 }));
    
    const result = runVerify([]);
    expect(result.status).toBe(0);
    expect(result.output).toContain('Divergências encontradas, mas o modo de falha está desativado');
  });

  it('should update README and generate divergences.md in --update mode', () => {
    const filename = 'token-audit-dry-run-2026-05-30T10-00-00.json';
    writeFileSync(join(TEST_DIR, filename), JSON.stringify({ timestamp: '2026-05-30T10-00-00', totalIssues: 0 }));
    
    const result = runVerify(['--update']);
    expect(result.status).toBe(0);
    expect(existsSync('divergences.md')).toBe(true);
    
    const updatedReadme = readFileSync(TEST_README, 'utf8');
    expect(updatedReadme).toMatchSnapshot();
    
    const divergenceContent = readFileSync('divergences.md', 'utf8');
    // Normalize date for snapshot
    const normalizedDivergence = divergenceContent.replace(/Data: .*/, 'Data: [NORMALIZED]');
    expect(normalizedDivergence).toMatchSnapshot();
  });

  it('should NOT update README in --update --dry-run mode', () => {
    const filename = 'token-audit-dry-run-2026-05-30T10-00-00.json';
    writeFileSync(join(TEST_DIR, filename), JSON.stringify({ timestamp: '2026-05-30T10-00-00', totalIssues: 0 }));
    
    const initialReadme = readFileSync(TEST_README, 'utf8');
    const result = runVerify(['--update', '--dry-run']);
    expect(result.status).toBe(0);
    expect(result.output).toContain('Modo DRY RUN: Nenhuma alteração será feita');
    expect(existsSync('divergences.md')).toBe(false);
    
    const currentReadme = readFileSync(TEST_README, 'utf8');
    expect(currentReadme).toBe(initialReadme);
  });

  it('should detect corrupted JSON files', () => {
    writeFileSync(join(TEST_DIR, 'corrupted.json'), 'invalid json {');
    
    const result = runVerify(['--fail-on-divergence']);
    expect(result.status).toBe(1);
    expect(result.output).toContain('Relatórios JSON corrompidos detectados');
  });

  describe('GitHub Step Summary - Motivo do Exit Code', () => {
    it('should show "Nenhuma divergência detectada" on success', () => {
      // Structure already aligned in beforeEach
      const result = runVerify([], { GITHUB_ACTIONS: 'true' });
      expect(result.status).toBe(0);
      expect(result.summary).toContain('📝 **Motivo do Exit Code:** Nenhuma divergência detectada.');
    });

    it('should show "Divergências encontradas com `--fail-on-divergence` ativo" on failure', () => {
      writeFileSync(join(TEST_DIR, 'extra.json'), JSON.stringify({ timestamp: '2026-05-30T10-00-00', totalIssues: 0 }));
      const result = runVerify(['--fail-on-divergence'], { GITHUB_ACTIONS: 'true' });
      expect(result.status).toBe(1);
      expect(result.summary).toContain('📝 **Motivo do Exit Code:** Divergências encontradas com `--fail-on-divergence` ativo.');
    });

    it('should show "Modo Dry Run ativo" in dry-run mode', () => {
      writeFileSync(join(TEST_DIR, 'extra.json'), JSON.stringify({ timestamp: '2026-05-30T10-00-00', totalIssues: 0 }));
      const result = runVerify(['--update', '--dry-run'], { GITHUB_ACTIONS: 'true' });
      expect(result.status).toBe(0);
      expect(result.summary).toContain('📝 **Motivo do Exit Code:** Modo Dry Run ativo; nenhuma alteração persistida.');
    });

    it('should show "README atualizado automaticamente" in update mode', () => {
      writeFileSync(join(TEST_DIR, 'extra.json'), JSON.stringify({ timestamp: '2026-05-30T10-00-00', totalIssues: 0 }));
      const result = runVerify(['--update'], { GITHUB_ACTIONS: 'true' });
      expect(result.status).toBe(0);
      expect(result.summary).toContain('📝 **Motivo do Exit Code:** README atualizado automaticamente.');
    });

    it('should show "modo de falha está desativado" when divergence exists but fail is off', () => {
      writeFileSync(join(TEST_DIR, 'extra.json'), JSON.stringify({ timestamp: '2026-05-30T10-00-00', totalIssues: 0 }));
      const result = runVerify([], { GITHUB_ACTIONS: 'true' });
      expect(result.status).toBe(0);
      expect(result.summary).toContain('📝 **Motivo do Exit Code:** Divergências encontradas, mas o modo de falha está desativado.');
    });
  });
});
