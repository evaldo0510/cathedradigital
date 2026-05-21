import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { SpiritualContinuity } from './SpiritualContinuity';
import { BrowserRouter } from 'react-router-dom';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('SpiritualContinuity Regression', () => {
  it('renders nothing when data is null', () => {
    const { container } = render(<SpiritualContinuity data={null} />, { wrapper });
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly with partial data', () => {
    const mockData = {
      nextBible: { label: 'Gênesis 1', subtitle: 'Bíblia', route: '/bible/1/1', type: 'bible' },
      history: []
    };
    render(<SpiritualContinuity data={mockData} />, { wrapper });
    expect(screen.getByText(/Gênesis 1/i)).toBeDefined();
    expect(screen.getByText(/Caminho de Maturidade/i)).toBeDefined();
  });
});
