import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Validation Report Ordering and Severity', () => {
  const reportPath = path.join(process.cwd(), 'catechism-validation-report.json');
  const mockDataPath = '../src/tests/mockCatechismData'; // Relative to scripts directory

  beforeAll(() => {
    // Ensure we don't have a stale report
    if (fs.existsSync(reportPath)) {
      fs.unlinkSync(reportPath);
    }
    
    try {
      // Run the script with mock data
      // We expect it to exit with 1 because there are errors and threshold is 0
      execSync(`CATECHISM_DATA_PATH=${mockDataPath} CATECHISM_VALIDATION_THRESHOLD=0 bun scripts/validate-catechism.ts`, {
        stdio: 'pipe'
      });
    } catch (error) {
      // Script exits with 1 on validation failure, which is expected here
    }
  });

  afterAll(() => {
    if (fs.existsSync(reportPath)) {
      fs.unlinkSync(reportPath);
    }
  });

  it('should generate the report file', () => {
    expect(fs.existsSync(reportPath)).toBe(true);
  });

  it('should order failingRecords by severity (High -> Medium -> Low) and group by category', () => {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const failingRecords = report.failingRecords;

    expect(failingRecords.length).toBe(3);

    // High Severity group (0)
    // 1. Tags vazias ou ausentes (alphabetical)
    // 2. Tipo inconsistente (tipo) (alphabetical)
    // Medium Severity group (1)
    // 3. ID ausente
    
    expect(failingRecords[0].errors[0].category).toBe('Tags vazias ou ausentes');
    expect(failingRecords[1].errors[0].category).toBe('Tipo inconsistente (tipo)');
    expect(failingRecords[2].errors[0].category).toBe('ID ausente');
  });


  it('should have consistent counts in the summary', () => {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const summary = report.summary;

    expect(summary['Tags vazias ou ausentes'].count).toBe(1);
    expect(summary['ID ausente'].count).toBe(1);
    expect(summary['Título ausente'].count).toBe(1);
    expect(summary['Tipo inconsistente (tipo)'].count).toBe(0);
  });
});
