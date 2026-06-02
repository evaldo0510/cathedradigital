import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const lucideImportMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/);
  
  if (lucideImportMatch) {
    const icons = lucideImportMatch[1].split(',').map(i => i.trim()).filter(Boolean);
    console.log(`Fixing ${filePath}: Found lucide icons: ${icons.join(', ')}`);

    content = content.replace(lucideImportMatch[0], "");

    if (!content.includes("import { Icons } from '@/constants'")) {
      content = "import { Icons } from '@/constants';\n" + content;
    }

    icons.forEach(icon => {
      // Only replace JSX tags: <IconName... />
      const regex = new RegExp(`<${icon}(\\s|/|>)`, 'g');
      content = content.replace(regex, `<Icons.${icon}$1`);
    });
    
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

try {
  const output = execSync(`rg -l "lucide-react" src -g "!src/constants.tsx" -g "!src/components/cathedra/Icon.tsx" -g "!src/components/ui/icons/index.tsx" -g "!src/components/cathedra/icon-audit.test.tsx" -g "!src/components/cathedra/stability-audit.test.tsx"`).toString();
  const files = output.split('\n').filter(Boolean);

  let fixedCount = 0;
  files.forEach(file => {
    if (fixFile(file)) fixedCount++;
  });

  console.log(`Standardized ${fixedCount} files.`);
} catch (e) {
  console.log("No files to fix.");
}
