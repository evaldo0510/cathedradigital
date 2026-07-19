/**
 * Integration test: garantia de que a bolha Nexus, em RTL (light e dark),
 * NUNCA gera links incorretos quando book/chapter/verse vierem undefined.
 *
 * Simula o pipeline: formatNexusContent → filtro resolveLink → render de <a>.
 * Não depende de Supabase nem do componente NexusBubbles inteiro (que carrega
 * dezenas de dependências); reproduz a lógica canônica de resolveLink usada
 * em src/components/cathedra/NexusBubbles.tsx.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { formatNexusContent, type TagContent } from './nexusContent';

function resolveLink(c: TagContent): string | null {
  const meta = c.metadata ?? {};
  if (c.type === 'bible') {
    if (meta.book && meta.chapter) {
      const verse = meta.verse ? `&verse=${meta.verse}` : '';
      return `/bible?book=${meta.book}&ch=${meta.chapter}${verse}`;
    }
    return null;
  }
  return null;
}

function NexusBubbleSim({ items }: { items: TagContent[] }) {
  return (
    <ul data-testid="bubbles">
      {items.map((c) => {
        const href = resolveLink(c);
        if (!href) return null;
        return (
          <li key={c.id}>
            <a href={href}>{c.title}</a>
          </li>
        );
      })}
    </ul>
  );
}

const badInputs = [
  { id: 'b1', type: 'bible', reference_id: null, metadata: {}, content_text: '' },
  { id: 'b2', type: 'bible', reference_id: '', metadata: null, content_text: '' },
  { id: 'b3', type: 'bible', reference_id: 'Livro Inexistente 5', metadata: {}, content_text: '' },
  { id: 'b4', type: 'bible', reference_id: 'Mt', metadata: {}, content_text: '' }, // sem capítulo
  { id: 'b5', type: 'bible', reference_id: undefined, metadata: undefined, content_text: '' },
];

for (const mode of ['light', 'dark'] as const) {
  describe(`Bolha Nexus RTL (${mode}) — book/chapter/verse undefined`, () => {
    it('não renderiza nenhum <a> com "undefined" ou "NaN" no href', () => {
      const items = badInputs.map((d) => formatNexusContent(d, d.type));

      const container = document.createElement('div');
      container.setAttribute('dir', 'rtl');
      if (mode === 'dark') container.classList.add('dark');
      document.body.appendChild(container);

      const { getByTestId, unmount } = render(<NexusBubbleSim items={items} />, { container });

      const list = getByTestId('bubbles');
      const anchors = list.querySelectorAll('a');

      // Nenhum item malformado deve virar link — todos foram filtrados.
      expect(anchors.length).toBe(0);

      const html = list.innerHTML;
      expect(html).not.toMatch(/undefined/i);
      expect(html).not.toMatch(/NaN/);
      expect(html).not.toMatch(/book=&/);
      expect(html).not.toMatch(/ch=(&|$)/);

      unmount();
      document.body.removeChild(container);
    });

    it('renderiza link válido para entrada boa mesmo com metadata vazia (via reference_id)', () => {
      const good = formatNexusContent(
        { id: 'g1', type: 'bible', reference_id: 'Jo 14, 6', metadata: {}, content_text: 'x' },
        'bible'
      );
      const container = document.createElement('div');
      container.setAttribute('dir', 'rtl');
      if (mode === 'dark') container.classList.add('dark');
      document.body.appendChild(container);

      const { getByRole, unmount } = render(<NexusBubbleSim items={[good]} />, { container });
      const link = getByRole('link') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('/bible?book=Jo&ch=14&verse=6');
      expect(link.getAttribute('href')).not.toContain('undefined');

      unmount();
      document.body.removeChild(container);
    });

    it('normaliza query string book/chapter/verse para múltiplos formatos válidos', () => {
      const cases: Array<{ ref: string; href: string }> = [
        { ref: 'Mt 11, 29', href: '/bible?book=Mt&ch=11&verse=29' },
        { ref: '1Co 13:4', href: '/bible?book=1Co&ch=13&verse=4' },
        { ref: 'I Co 13, 4', href: '/bible?book=1Co&ch=13&verse=4' },
        { ref: 'Jo 1-14', href: '/bible?book=Jo&ch=1&verse=14' },
        { ref: 'Sl 23', href: '/bible?book=Sl&ch=23' }, // capítulo sem versículo
      ];
      for (const { ref, href } of cases) {
        const item = formatNexusContent(
          { id: `k-${ref}`, type: 'bible', reference_id: ref, metadata: {}, content_text: '' },
          'bible'
        );
        const container = document.createElement('div');
        container.setAttribute('dir', 'rtl');
        if (mode === 'dark') container.classList.add('dark');
        document.body.appendChild(container);
        const { getByRole, unmount } = render(<NexusBubbleSim items={[item]} />, { container });
        const link = getByRole('link') as HTMLAnchorElement;
        expect(link.getAttribute('href')).toBe(href);
        expect(link.getAttribute('href')).not.toMatch(/undefined|NaN|null/i);
        unmount();
        document.body.removeChild(container);
      }
    });

    it('sanitiza títulos com tokens "undefined"/"NaN" (fallback UI seguro)', () => {
      const dirty = formatNexusContent(
        { id: 'd1', type: 'bible', reference_id: 'undefined', metadata: {}, content_text: '' },
        'bible'
      );
      expect(dirty.title).toBe('Escritura');
      expect(dirty.title).not.toMatch(/undefined|NaN|null/i);

      const middle = formatNexusContent(
        { id: 'd2', type: 'catechism', reference_id: 'CIC undefined §NaN', metadata: { paragraph: 1 }, content_text: '' },
        'catechism'
      );
      expect(middle.title).not.toMatch(/undefined|NaN/);
    });
  });
}

