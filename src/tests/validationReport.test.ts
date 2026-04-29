import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Relatório de Validação do Catecismo', () => {
  const reportPath = path.join(process.cwd(), 'catechism-validation-report.json');
  const tempDataPath = path.join(process.cwd(), 'scripts/temp-test-data.ts');

  beforeAll(() => {
    // Cleanup any existing report
    if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath);
  });

  afterAll(() => {
    // Cleanup temp files
    if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath);
    if (fs.existsSync(tempDataPath)) fs.unlinkSync(tempDataPath);
  });

  it('deve gerar um relatório JSON válido após a execução do script', () => {
    try {
      execSync('bun run scripts/validate-catechism.ts', { stdio: 'pipe' });
    } catch (e) {
      // It's okay if it fails for validation reasons, we just want the report
    }

    expect(fs.existsSync(reportPath)).toBe(true);
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    
    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('totalRecords');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('failingRecords');
  });

  it('deve conter contagens e porcentagens consistentes em caso de erros simulados', () => {
    // 1. Create a "dirty" data file
    const dirtyData = `
      export const CATECHISM_LOCAL_DATA = {
        9999: {
          id: "", // Error: ID ausente
          paragraph: 9999,
          tipo: "errado", // Error: Tipo inconsistente
          type: "errado", // Error: Tipo inconsistente
          titulo: "Teste",
          conteudo: "Conteúdo",
          tags: [] // Error: Tags vazias
        }
      };
    `;
    fs.writeFileSync(tempDataPath, dirtyData);

    // 2. Run the script pointing to the dirty data
    try {
      execSync('bun run scripts/validate-catechism.ts', { 
        env: { ...process.env, CATECHISM_DATA_PATH: './temp-test-data.ts' },
        stdio: 'pipe' 
      });
    } catch (e) {
      // Expect failure
    }

    // 3. Verify the report
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    
    expect(report.totalRecords).toBe(1);
    expect(report.failingRecords.length).toBe(1);
    
    const summary = report.summary;
    // We expect 4 errors for this single record
    expect(summary['ID ausente'].count).toBe(1);
    expect(summary['Tipo inconsistente (tipo)'].count).toBe(1);
    expect(summary['Tipo inconsistente (type)'].count).toBe(1);
    expect(summary['Tags vazias ou ausentes'].count).toBe(1);
    
    // Check percentages (1 error in 1 record = 100%)
    expect(parseFloat(summary['ID ausente'].percentage)).toBe(100);
    expect(summary['ID ausente'].status).toBe('fail');
  });
});
