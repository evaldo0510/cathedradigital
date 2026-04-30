import { describe, it, expect, afterEach } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Dry Run Validation in Catechism', () => {
  const reportPath = path.join(process.cwd(), 'catechism-validation-report.json');
  const mockDataFile = path.join(process.cwd(), 'src/tests/mockDryRunData.ts');
  const mockDataPath = '../src/tests/mockDryRunData';

  afterEach(() => {
    if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath);
    if (fs.existsSync(mockDataFile)) fs.unlinkSync(mockDataFile);
  });

  const createMockData = (hasAIField: boolean) => {
    const content = `
export const CATECHISM_LOCAL_DATA = {
  "1": {
    "id": "cat_1",
    "paragraph": 1,
    "tipo": "catecismo",
    "type": "catechism",
    "tags": ["tag"],
    "titulo": "Teste",
    "conteudo": "Conteudo" ${hasAIField ? ',"explicacao": "IA Generated Content"' : ''}
  }
};
`;
    fs.writeFileSync(mockDataFile, content);
  };

  it('should report errors but NOT fail build when CATECHISM_DRY_RUN is true', () => {
    createMockData(true); // AI fields should cause failure normally
    let errorOccurred = false;
    try {
      execSync(`CATECHISM_DATA_PATH=${mockDataPath} CATECHISM_DRY_RUN=true bun scripts/validate-catechism.ts`, { stdio: 'pipe' });
    } catch (e) {
      errorOccurred = true;
    }
    expect(errorOccurred).toBe(false);

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    expect(report.summary['Campos de IA detectados'].count).toBe(1);
    expect(report.summary['Campos de IA detectados'].status).toBe('fail'); // Status remains fail in report
  });

  it('should NOT clean fields even if CATECHISM_AUTO_CLEAN_AI is true when CATECHISM_DRY_RUN is true', () => {
    // Note: The validation script imports the data. 
    // In the script, we delete from the local 'item' reference.
    // However, the test checks the report's failingRecords.
    // Let's verify our script logic: 
    // it deletes from 'item' which is the object in 'items' array.
    // The report's failingRecords are created from the original item.
    
    createMockData(true);
    const output = execSync(`CATECHISM_DATA_PATH=${mockDataPath} CATECHISM_DRY_RUN=true CATECHISM_AUTO_CLEAN_AI=true bun scripts/validate-catechism.ts`, { stdio: 'pipe' }).toString();
    
    expect(output).toContain('🧪 Modo DRY RUN ativado');
    expect(output).not.toContain('🧹 Modo Auto-Clean ativado');
    
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    expect(report.summary['Campos de IA detectados'].count).toBe(1);
  });
});
