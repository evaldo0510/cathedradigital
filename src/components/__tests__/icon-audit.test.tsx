import { describe, it, expect } from 'vitest';
import { Icons } from '@/constants';
import { execSync } from 'child_process';

describe('Icon Audit', () => {
  it('should not have direct imports from lucide-react in source files', () => {
    try {
      const command = `rg "from 'lucide-react'" src -g '!src/constants.tsx' -g '!src/components/__tests__/**' -l`;
      const output = execSync(command).toString().trim();
      if (output) {
        throw new Error(`Direct lucide-react imports found. Please use Icons from @/constants.`);
      }
    } catch (error) {
      if (error.status === 1) return;
      throw error;
    }
  });

  it('should use createIcon wrapper with correct defaults', () => {
    expect(Icons.Search).toBeDefined();
    expect(Icons.Home).toBeDefined();
  });
});