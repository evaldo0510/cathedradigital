import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Tailwind Class Ambiguity Regression', () => {
  it('ThemeChip.tsx should not contain ambiguous ease classes in data-state', () => {
    const filePath = resolve('src/components/cathedra/ThemeChip.tsx');
    const content = readFileSync(filePath, 'utf-8');
    
    // Garantir que não voltamos a usar a sintaxe problemática que causava erro no build
    const ambiguousPattern = /data-\[state=open\]:ease-\[/;
    expect(content).not.toMatch(ambiguousPattern);
    
    // Verificar se estamos usando a correção recomendada (propriedade CSS direta)
    const fixedPattern = /\[transition-timing-function:/;
    expect(content).toMatch(fixedPattern);
  });
});
