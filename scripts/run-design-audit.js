import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const VIOLATION_PATTERNS = [
  { name: 'Non-standard Radius', pattern: 'rounded-(xl|2xl|3xl)', suggestion: 'rounded-premium' },
  { name: 'Non-standard Shadow', pattern: 'shadow-(md|lg|xl|2xl)', suggestion: 'shadow-premium' },
  { name: 'Hardcoded Card BG', pattern: 'bg-white/5|bg-card/50', suggestion: 'premium-card' }
];

function runAudit() {
  const violations: any[] = [];
  
  VIOLATION_PATTERNS.forEach(({ name, pattern, suggestion }) => {
    try {
      const output = execSync(`rg -n "${pattern}" src/components src/pages -g "!src/components/ui/**"`, { encoding: 'utf8' });
      const lines = output.trim().split('\n');
      
      lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 3) {
          violations.push({
            file: parts[0],
            line: parseInt(parts[1]),
            pattern: name,
            match: parts.slice(2).join(':').trim(),
            suggestion
          });
        }
      });
    } catch (e) {
      // rg returns exit code 1 if no matches found
    }
  });

  const report = {
    timestamp: new Date().toISOString(),
    total_violations: violations.length,
    violations,
    status: violations.length === 0 ? 'conforme' : 'pendente'
  };

  fs.writeFileSync('public/visual-audit-report.json', JSON.stringify(report, null, 2));
  console.log(`Audit complete. Found ${violations.length} violations.`);
}

runAudit();
