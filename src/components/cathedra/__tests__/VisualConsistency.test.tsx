import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CathedraCard } from '../CathedraCard';
import { ReadingSettingsProvider } from '@/contexts/ReadingSettingsContext';
import React from 'react';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <ReadingSettingsProvider>
      {ui}
    </ReadingSettingsProvider>
  );
};

describe('Visual Consistency - Design System', () => {
  it('CathedraCard should apply the premium-card class for consistent styling', () => {
    renderWithProvider(<CathedraCard data-testid="test-card">Test Content</CathedraCard>);
    const card = screen.getByTestId('test-card');
    expect(card.className).toContain('premium-card');
  });

  it('CathedraCard should have consistent rounded corners via design tokens', () => {
    renderWithProvider(<CathedraCard data-testid="test-card">Test Content</CathedraCard>);
    const card = screen.getByTestId('test-card');
    expect(card.className).toContain('rounded-premium');
  });

  it('CathedraCard interactive state should apply interactive variant styles', () => {
    renderWithProvider(<CathedraCard variant="interactive" data-testid="test-card">Test Content</CathedraCard>);
    const card = screen.getByTestId('test-card');
    // Variant 'interactive' in src/components/ui/card.tsx includes specific hover/active classes
    expect(card.className).toContain('cursor-pointer');
  });
});

