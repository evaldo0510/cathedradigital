const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Detect direct lucide-react imports
  const lucideImportMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/);
  
  if (lucideImportMatch) {
    const icons = lucideImportMatch[1].split(',').map(i => i.trim()).filter(Boolean);
    console.log(`Fixing ${filePath}: Found lucide icons: ${icons.join(', ')}`);

    // Remove direct import
    content = content.replace(lucideImportMatch[0], "");

    // Add Icons import from @/constants if not present
    if (!content.includes("import { Icons } from '@/constants'")) {
      content = "import { Icons } from '@/constants';\n" + content;
    }

    // Replace usage: <IconName ... /> with <Icons.IconName ... />
    icons.forEach(icon => {
      // Look for <IconName followed by space, slash, or close bracket
      const regex = new RegExp(`<${icon}(\\s|/|>)`, 'g');
      content = content.replace(regex, `<Icons.${icon}$1`);
    });
    
    changed = true;
  }

  // 2. Ensure size 20 and stroke 1.2 (though createIcon handles defaults, sometimes they are overridden)
  // We'll leave overrides for now unless they are explicitly large/small

  if (changed) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

// Get all files with lucide-react imports
try {
  const output = execSync(`rg -l "lucide-react" src -g "!src/constants.tsx" -g "!src/components/cathedra/Icon.tsx" -g "!src/components/ui/icons/index.tsx" -g "!src/components/cathedra/icon-audit.test.tsx"`).toString();
  const files = output.split('\n').filter(Boolean);

  let fixedCount = 0;
  files.forEach(file => {
    if (fixFile(file)) fixedCount++;
  });

  console.log(`Standardized ${fixedCount} files.`);
} catch (e) {
  console.log("No files to fix or error running rg.");
}
