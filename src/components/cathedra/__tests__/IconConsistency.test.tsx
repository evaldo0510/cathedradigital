import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CathedraIcon, IconSizePreset } from '../CathedraIcon';
import { Icons } from '@/constants';

describe('Consistência de Ícones', () => {
  const sizes: ('xs' | 'sm' | 'md' | 'lg' | 'xl')[] = ['xs', 'sm', 'md', 'lg', 'xl'];

  sizes.forEach(size => {
    it(`deve manter as classes de tamanho padrão para o tamanho "${size}"`, () => {
      const { container } = render(<CathedraIcon icon={Icons.Cross} size={size} />);
      const iconContainer = container.firstChild as HTMLElement;
      const svg = iconContainer.querySelector('svg');

      // Verificar classes do container
      const expectedContainerClasses = {
        xs: 'w-6 h-6',
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24'
      };
      expect(iconContainer.className).toContain(expectedContainerClasses[size]);

      // Verificar classes do SVG (tamanho responsivo)
      const expectedSvgClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12'
      };
      expect(svg?.getAttribute('class')).toContain(expectedSvgClasses[size]);
    });
  });

  it('deve usar presets recomendados para áreas específicas', () => {
    expect(IconSizePreset.NAV).toBe('sm');
    expect(IconSizePreset.CARD_HEADER).toBe('md');
    expect(IconSizePreset.HERO).toBe('lg');
  });
});
