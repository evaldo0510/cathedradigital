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
    // Use a file OUTSIDE the reports directory for the summary
    const summaryPath = 'github_step_summary_test.md';
    const githubEnv = { 
      ...process.env, 
      ...env,
      REPORTS_DIR_OVERRIDE: TEST_DIR,
      README_PATH_OVERRIDE: TEST_README,
    };
    
    if (env.GITHUB_ACTIONS) {
      githubEnv.GITHUB_STEP_SUMMARY = summaryPath;
      writeFileSync(summaryPath, ''); // Reset summary
    }

    try {
      const command = `bun run ${SCRIPT_PATH} ${args.join(' ')}`;
      const output = execSync(command, { 
        env: githubEnv,
        encoding: 'utf8' 
      });
      const summary = env.GITHUB_ACTIONS && existsSync(summaryPath) ? readFileSync(summaryPath, 'utf8') : '';
      if (existsSync(summaryPath)) rmSync(summaryPath);
      return { status: 0, output, summary };
    } catch (error: any) {
      const summary = env.GITHUB_ACTIONS && existsSync(summaryPath) ? readFileSync(summaryPath, 'utf8') : '';
      if (existsSync(summaryPath)) rmSync(summaryPath);
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
    it('should NOT show override information when environment variables are missing', () => {
      // Create a specific sandbox for this test to avoid using project defaults
      const sandboxDir = 'sandbox-no-overrides-test';
      const summaryPath = join(process.cwd(), 'summary-no-overrides.md');
      
      if (existsSync(sandboxDir)) rmSync(sandboxDir, { recursive: true, force: true });
      mkdirSync(sandboxDir);
      mkdirSync(join(sandboxDir, 'reports'));
      // Create the expected files to ensure no divergence
      writeFileSync(join(sandboxDir, 'reports', 'compliance-history.json'), JSON.stringify([]));
      writeFileSync(join(sandboxDir, 'reports', 'token-audit.json'), JSON.stringify({ timestamp: '2026-05-30T10:00:00Z', totalIssues: 0 }));
      
      writeFileSync(join(sandboxDir, 'README.md'), readFileSync(TEST_README, 'utf8'));
      
      const absoluteScriptPath = join(process.cwd(), SCRIPT_PATH);
      
      try {
        // Run without the override variables in the environment
        const env = { ...process.env };
        delete env.REPORTS_DIR_OVERRIDE;
        delete env.README_PATH_OVERRIDE;
        env.GITHUB_ACTIONS = 'true';
        env.GITHUB_STEP_SUMMARY = summaryPath;

        execSync(`bun run ${absoluteScriptPath}`, {
          cwd: sandboxDir,
          env,
          encoding: 'utf8'
        });
        
        const summary = readFileSync(summaryPath, 'utf8');
        expect(summary).not.toContain('#### ⚙️ Configuração Customizada (Overrides)');
        expect(summary).toContain('📝 **Motivo do Exit Code:** Nenhuma divergência detectada.');
      } finally {
        if (existsSync(sandboxDir)) rmSync(sandboxDir, { recursive: true, force: true });
        if (existsSync(summaryPath)) rmSync(summaryPath);
      }
    });
  });

  describe('Isolamento com REPORTS_DIR_OVERRIDE e README_PATH_OVERRIDE', () => {
    const CUSTOM_DIR = 'custom-reports-isolated';
    const CUSTOM_README = 'CUSTOM-README-isolated.md';
    const REAL_README_BEFORE = existsSync('README.md') ? readFileSync('README.md', 'utf8') : null;

    beforeEach(() => {
      if (existsSync(CUSTOM_DIR)) rmSync(CUSTOM_DIR, { recursive: true, force: true });
      mkdirSync(CUSTOM_DIR);
      writeFileSync(CUSTOM_README, `
#### Estrutura de Relatórios e Logs (Exemplo Real)

Ao executar \`npm run token-audit:dry-run\` ou \`npm run token-audit:report\`, a pasta \`./reports\` é populada com a seguinte estrutura:

\`\`\`text
reports/
└── placeholder.json
\`\`\`
`);
    });

    afterEach(() => {
      if (existsSync(CUSTOM_DIR)) rmSync(CUSTOM_DIR, { recursive: true, force: true });
      if (existsSync(CUSTOM_README)) rmSync(CUSTOM_README);
      // Verify real README was not touched
      if (REAL_README_BEFORE !== null) {
        const after = readFileSync('README.md', 'utf8');
        expect(after).toBe(REAL_README_BEFORE);
      }
    });

    const runIsolated = (args: string[] = [], env: any = {}) => {
      const summaryPath = 'github_step_summary_isolated_test.md';
      const githubEnv = {
        ...process.env,
        ...env,
        REPORTS_DIR_OVERRIDE: CUSTOM_DIR,
        README_PATH_OVERRIDE: CUSTOM_README,
      };

      if (env.GITHUB_ACTIONS) {
        githubEnv.GITHUB_STEP_SUMMARY = summaryPath;
        writeFileSync(summaryPath, '');
      }

      try {
        const output = execSync(`bun run ${SCRIPT_PATH} ${args.join(' ')}`, {
          env: githubEnv,
          encoding: 'utf8',
        });
        const summary = env.GITHUB_ACTIONS && existsSync(summaryPath) ? readFileSync(summaryPath, 'utf8') : '';
        if (existsSync(summaryPath)) rmSync(summaryPath);
        return { status: 0, output, summary };
      } catch (error: any) {
        const summary = env.GITHUB_ACTIONS && existsSync(summaryPath) ? readFileSync(summaryPath, 'utf8') : '';
        if (existsSync(summaryPath)) rmSync(summaryPath);
        return { status: error.status, output: error.stdout, summary };
      }
    };

    it('should write updated content ONLY to the custom README via overrides', () => {
      const filename = 'token-audit-dry-run-2026-05-30T10-00-00.json';
      writeFileSync(join(CUSTOM_DIR, filename), JSON.stringify({ timestamp: '2026-05-30T10-00-00', totalIssues: 0 }));

      const result = runIsolated(['--update']);
      expect(result.status).toBe(0);

      const customReadmeContent = readFileSync(CUSTOM_README, 'utf8');
      expect(customReadmeContent).toMatchSnapshot('custom-readme-updated');
      expect(customReadmeContent).toContain(filename);
      expect(customReadmeContent).not.toContain('placeholder.json');
    });

    it('should detect divergence ONLY in the custom directory via overrides', () => {
      writeFileSync(join(CUSTOM_DIR, 'isolated-extra.json'), JSON.stringify({ timestamp: '2026-05-30T10-00-00', totalIssues: 0 }));

      const result = runIsolated(['--fail-on-divergence']);
      expect(result.status).toBe(1);
      expect(result.output).toContain('isolated-extra.json');
      expect(result.output).toContain(CUSTOM_DIR);
      expect(result.output).not.toContain('Encontrado em ./reports:');
    });

    it('should NOT modify the custom README in --dry-run mode with overrides', () => {
      const before = readFileSync(CUSTOM_README, 'utf8');
      writeFileSync(join(CUSTOM_DIR, 'isolated-extra.json'), JSON.stringify({ timestamp: '2026-05-30T10-00-00', totalIssues: 0 }));

      const result = runIsolated(['--update', '--dry-run']);
      expect(result.status).toBe(0);

      const after = readFileSync(CUSTOM_README, 'utf8');
      expect(after).toBe(before);
      expect(after).toMatchSnapshot('custom-readme-unchanged-dry-run');
    });

    it('should include override information in GitHub Step Summary', () => {
      const result = runIsolated([], { GITHUB_ACTIONS: 'true' });
      expect(result.status).toBe(0); // Divergence exists but fail-on-divergence is off by default
      expect(result.summary).toContain('#### ⚙️ Configuração Customizada (Overrides)');
      expect(result.summary).toContain(`- 📁 **Diretório de Relatórios:** \`${CUSTOM_DIR}\` (via \`REPORTS_DIR_OVERRIDE\`)`);
      expect(result.summary).toContain(`- 📖 **Caminho do README:** \`${CUSTOM_README}\` (via \`README_PATH_OVERRIDE\`)`);
      expect(result.summary).toMatchSnapshot('summary-with-overrides');
    });
  });
});
