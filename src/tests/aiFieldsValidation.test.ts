import { describe, it, expect, afterEach } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('AI Fields Validation in Catechism', () => {
  const reportPath = path.join(process.cwd(), 'catechism-validation-report.json');
  const mockDataFile = path.join(process.cwd(), 'src/tests/mockAICatechismData.ts');
  const mockDataPath = '../src/tests/mockAICatechismData';

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

  it('should detect AI fields and fail build by default', () => {
    createMockData(true);
    let errorOccurred = false;
    try {
      execSync(`CATECHISM_DATA_PATH=${mockDataPath} bun scripts/validate-catechism.ts`, { stdio: 'pipe' });
    } catch (e) {
      errorOccurred = true;
    }
    expect(errorOccurred).toBe(true);

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    expect(report.summary['Campos de IA detectados'].count).toBe(1);
  });

  it('should NOT fail build if CATECHISM_FAIL_ON_AI_FIELDS is false', () => {
    createMockData(true);
    let errorOccurred = false;
    try {
      execSync(`CATECHISM_DATA_PATH=${mockDataPath} CATECHISM_FAIL_ON_AI_FIELDS=false bun scripts/validate-catechism.ts`, { stdio: 'pipe' });
    } catch (e) {
      errorOccurred = true;
      console.error('Unexpected failure:', e.stdout?.toString());
    }
    expect(errorOccurred).toBe(false);

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    expect(report.summary['Campos de IA detectados'].count).toBe(1);
    expect(report.summary['Campos de IA detectados'].status).toBe('warning');
  });

  it('should automatically remove forbidden fields when autoCleanAI is true', () => {
    createMockData(true);
    execSync(`CATECHISM_DATA_PATH=${mockDataPath} CATECHISM_AUTO_CLEAN_AI=true CATECHISM_FAIL_ON_AI_FIELDS=false bun scripts/validate-catechism.ts`, { stdio: 'pipe' });
    
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    // The report should show it was detected
    expect(report.summary['Campos de IA detectados'].count).toBe(1);
    // But the record in the report should NOT have the forbidden field
    const record = report.failingRecords[0];
    expect(record.explicacao).toBeUndefined();
  });
});
