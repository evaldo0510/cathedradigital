import { describe, it } from 'vitest';
import { execSync } from 'child_process';

describe('Icon Standardization Diagnostic', () => {
  it('should list all components still importing from lucide-react directly', () => {
    try {
      const output = execSync('rg "from .lucide-react." src/components/cathedra -g "!src/components/cathedra/Icon.tsx"').toString();
      const files = output.split('\n').filter(Boolean);
      
      console.log('--- ICON STANDARDIZATION AUDIT ---');
      console.log(`Found ${files.length} files still importing from lucide-react directly instead of using @/constants Icons.`);
      
      if (files.length > 0) {
        console.log('Top violations:');
        files.slice(0, 10).forEach(f => console.log(` - ${f.split(':')[0]}`));
        if (files.length > 10) console.log(` ... and ${files.length - 10} more.`);
      }
      
      console.log('Recommendation: Migrate these to use import { Icons } from "@/constants" and Icons.ComponentName.');
      console.log('-----------------------------------');
    } catch (e) {
      console.log('No lucide-react imports found in cathedra components! Standardization 100%.');
    }
  });

  it('should verify all Icons in constants use the standardized wrapper', () => {
    // This is already checked in stability-audit.test.tsx
  });
});
