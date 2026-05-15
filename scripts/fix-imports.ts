import fs from 'fs';
import path from 'path';

const REPLACEMENTS: Record<string, string> = {
  // Imports
  'from "@/components/ui/button"': 'from "@/components/cathedra/CathedraButton"',
  'from "@/components/ui/card"': 'from "@/components/cathedra/CathedraCard"',
  'from \'@/components/ui/button\'': 'from "@/components/cathedra/CathedraButton"',
  'from \'@/components/ui/card\'': 'from "@/components/cathedra/CathedraCard"',
  'import { Button } from "@/components/ui/button"': 'import { CathedraButton as Button } from "@/components/cathedra/CathedraButton"',
  'import { Card } from "@/components/ui/card"': 'import { CathedraCard as Card } from "@/components/cathedra/CathedraCard"',
};

// For lucide-react, we usually want to use Icons.Name from constants, 
// but it's harder to automate without knowing the specific icon names.
// For now, I'll focus on Button and Card as requested.

const TARGET_DIRS = ['src/components', 'src/pages'];
const ALLOWED_FILES = [
  'src/components/cathedra/CathedraCard.tsx',
  'src/components/cathedra/CathedraButton.tsx',
  'src/components/ui/button.tsx',
  'src/components/ui/card.tsx',
];

function processFiles(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processFiles(fullPath);
      continue;
    }

    if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
    if (ALLOWED_FILES.some(allowed => fullPath.includes(allowed))) continue;

    let content = fs.readFileSync(fullPath, 'utf-8');
    let changed = false;

    for (const [legacy, replacement] of Object.entries(REPLACEMENTS)) {
      if (content.includes(legacy)) {
        content = content.replace(new RegExp(legacy, 'g'), replacement);
        changed = true;
      }
    }

    // Also replace <Button and <Card usage if they are standard imports
    if (changed) {
        // Simple heuristic to change component names in JSX if we changed imports
        if (content.includes('from "@/components/cathedra/CathedraButton"')) {
            content = content.replace(/<Button\b/g, '<CathedraButton');
            content = content.replace(/<\/Button>/g, '</CathedraButton>');
        }
        if (content.includes('from "@/components/cathedra/CathedraCard"')) {
            content = content.replace(/<Card\b/g, '<CathedraCard');
            content = content.replace(/<\/Card>/g, '</CathedraCard>');
        }
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Fixed imports and components in: ${fullPath}`);
    }
  }
}

TARGET_DIRS.forEach(dir => processFiles(dir));
console.log('✨ Import fix completed!');
