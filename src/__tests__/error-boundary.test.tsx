import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import AppErrorBoundary from '../components/cathedra/AppErrorBoundary';

const CrashingComponent = () => {
  throw new Error('Test crash');
};

describe('AppErrorBoundary', () => {
  it('renders fallback UI on error', () => {
    // Suppress console.error for the expected crash
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <AppErrorBoundary>
        <CrashingComponent />
      </AppErrorBoundary>
    );

    expect(screen.getByText(/Santuário em/i)).toBeInTheDocument();
    expect(screen.getByText(/Manutenção/i)).toBeInTheDocument();
    expect(screen.getByText(/Tentar Novamente/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});
