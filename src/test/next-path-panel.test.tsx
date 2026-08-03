/**
 * NextPathPanel — render das recomendações do Nexus Intelligence.
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/providers';
import NextPathPanel from '@/components/cathedra/NextPathPanel';
import type { NextPathRecommendation } from '@/core/knowledge/intelligence/nextPathEngine';

const recs: NextPathRecommendation[] = [
  {
    journey: { id: 'j1', slug: 'vida-eucaristica', title: 'Vida Eucarística', category: 'oracao' },
    score: 12,
    reason: 'Compartilha CIC §1324, Via-Sacra com a jornada que você concluiu.',
    sharedNodes: [
      { key: 'catechism_paragraph#1324', kind: 'catechism_paragraph', label: 'CIC §1324', degree: 1 },
    ],
    signal: 'nexus',
  },
];

describe('NextPathPanel', () => {
  it('renderiza título, motivo e link da recomendação', () => {
    renderWithProviders(<NextPathPanel recommendations={recs} />);
    expect(screen.getByTestId('next-path-panel')).toBeInTheDocument();
    expect(screen.getByText('Vida Eucarística')).toBeInTheDocument();
    expect(screen.getByText(/Compartilha CIC §1324/)).toBeInTheDocument();
    expect(screen.getByText('CIC §1324')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/jornadas/vida-eucaristica');
  });

  it('não renderiza nada sem recomendações', () => {
    const { container } = renderWithProviders(<NextPathPanel recommendations={[]} />);
    expect(container.querySelector('[data-testid="next-path-panel"]')).toBeNull();
  });
});
