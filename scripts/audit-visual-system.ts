import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Script to verify if pages are using Cathedra components instead of raw Shadcn/HTML
 */

const projectRoot = process.cwd();
const srcPath = join(projectRoot, 'src');

const IGNORED_DIRS = ['node_modules', '.git', 'dist', 'public'];

function getFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = entries.flatMap((entry) => {
    const res = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.includes(entry.name)) return [];
      return getFiles(res);
    } else {
      return res.match(/\.(tsx|ts|jsx|js)$/) ? res : [];
    }
  });
  return files;
}

const allFiles = getFiles(srcPath);

const violations: { file: string; line: number; text: string; type: string }[] = [];

allFiles.forEach(file => {
  // Skip the components themselves and documentation
  if (file.includes('CathedraCard.tsx') || file.includes('CathedraButton.tsx') || file.includes('DesignSystemGuide.tsx') || file.includes('src/components/ui/')) return;
  
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check for raw Card from @/components/ui/card without being wrapped by HomeCard or CathedraCard
    // This is a simplified check for CI
    if (line.includes('from "@/components/ui/card"') && !content.includes('CathedraCard') && !content.includes('HomeCard')) {
      violations.push({
        file: file.replace(projectRoot, ''),
        line: index + 1,
        text: line.trim(),
        type: 'Legacy Card Import'
      });
    }

    // Check for raw Button from @/components/ui/button
    if (line.includes('from "@/components/ui/button"') && !content.includes('CathedraButton') && !content.includes('HomeButton')) {
       // Allow use inside HomeButton/CathedraButton wrappers which we already filtered
       violations.push({
        file: file.replace(projectRoot, ''),
        line: index + 1,
        text: line.trim(),
        type: 'Legacy Button Import'
      });
    }
  });
});

if (violations.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Visual System Audit Failed!');
  console.error('The following files are using legacy components instead of Cathedra equivalents:\n');
  
  violations.forEach(v => {
    console.error(`- ${v.file}:${v.line} [${v.type}]: ${v.text}`);
  });
  
  console.error('\nAction required: Replace imports from "@/components/ui/card" and "@/components/ui/button" with "CathedraCard" and "CathedraButton" (or "HomeCard"/"HomeButton").');
  process.exit(1);
} else {
  console.log('\x1b[32m%s\x1b[0m', '✅ Visual System Audit Passed! All pages are compliant with Cathedra Design System.');
}
