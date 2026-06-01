import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CathedraCard } from '../CathedraCard';
import React from 'react';

// Mocking useReadingSettings to avoid Provider issues in unit tests
vi.mock('@/contexts/ReadingSettingsContext', () => ({
  useReadingSettings: () => ({
    settings: { reduceAnimations: false },
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
  }),
  ReadingSettingsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mocking useAuth to avoid Provider issues
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
    isPremium: false,
  }),
}));

describe('Visual Consistency - Design System', () => {
  it('CathedraCard should apply the premium-card class for consistent styling', () => {
    render(<CathedraCard data-testid="test-card">Test Content</CathedraCard>);
    const card = screen.getByTestId('test-card');
    expect(card.className).toContain('premium-card');
  });

  it('CathedraCard should have consistent rounded corners via design tokens', () => {
    render(<CathedraCard data-testid="test-card">Test Content</CathedraCard>);
    const card = screen.getByTestId('test-card');
    expect(card.className).toContain('rounded-premium');
  });

  it('CathedraCard interactive state should apply interactive variant styles', () => {
    render(<CathedraCard variant="interactive" data-testid="test-card">Test Content</CathedraCard>);
    const card = screen.getByTestId('test-card');
    expect(card.className).toContain('cursor-pointer');
  });
});



