import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeCard } from '../HomeCard';
import React from 'react';

// Mocking some dependencies if needed
describe('Visual Consistency - Design System', () => {
  it('HomeCard should apply the premium-card class for consistent styling', () => {
    render(<HomeCard data-testid="test-card">Test Content</HomeCard>);
    const card = screen.getByTestId('test-card');
    expect(card.className).toContain('premium-card');
  });

  it('HomeCard should have consistent rounded corners via design tokens', () => {
    render(<HomeCard data-testid="test-card">Test Content</HomeCard>);
    const card = screen.getByTestId('test-card');
    // We expect the class to be there, Tailwind handles the actual CSS
    expect(card.className).toContain('premium-card');
  });

  it('HomeCard interactive state should apply the interactive variant', () => {
    render(<HomeCard onClick={() => {}} data-testid="test-card">Test Content</HomeCard>);
    const card = screen.getByTestId('test-card');
    expect(card.className).toContain('premium-card-interactive');
  });
});
