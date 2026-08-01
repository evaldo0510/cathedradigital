import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LogosContextualSuggestions } from '@/components/cathedra/LogosContextualSuggestions';
import React from 'react';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';

// Mock the context and icons
vi.mock('@/contexts/ReadingSettingsContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/ReadingSettingsContext')>('@/contexts/ReadingSettingsContext');
  return {
    ...actual,

  useReadingSettings: vi.fn(),
};
});

vi.mock('@/constants', () => ({
  Icons: {
    Sparkles: () => null,
    Compass: () => null,
    Feather: () => null,
  },
}));

describe('LogosContextualSuggestions Rules', () => {
  const mockOnSelect = vi.fn();

  it('should return null when logosSuggestions is set to "never"', () => {
    (useReadingSettings as any).mockReturnValue({
      settings: {
        totalSilence: false,
        logosSuggestions: 'never',
      },
    });

    const { container } = render(
      <LogosContextualSuggestions 
        context="test" 
        type="bible" 
        onSelectSuggestion={mockOnSelect} 
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should return null when totalSilence is active', () => {
    (useReadingSettings as any).mockReturnValue({
      settings: {
        totalSilence: true,
        logosSuggestions: 'always',
      },
    });

    const { container } = render(
      <LogosContextualSuggestions 
        context="test" 
        type="bible" 
        onSelectSuggestion={mockOnSelect} 
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render suggestions when logosSuggestions is set to "always"', () => {
    (useReadingSettings as any).mockReturnValue({
      settings: {
        totalSilence: false,
        logosSuggestions: 'always',
      },
    });

    const { container } = render(
      <LogosContextualSuggestions 
        context="test" 
        type="bible" 
        onSelectSuggestion={mockOnSelect} 
      />
    );
    expect(screen.getByText('Aprofundar Mistério')).toBeDefined();
  });
});
