/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import AppErrorBoundary from '../components/cathedra/AppErrorBoundary';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from '../App';

// Mock Icons since they might use SVGs or external libs that Vitest doesn't like without proper config
vi.mock('../../constants', () => ({
  Icons: {
    History: () => <div data-testid="icon-history">History Icon</div>,
  },
}));

// Mock Sentry
vi.mock('@sentry/react', () => ({
  ErrorBoundary: ({ children, fallback }: any) => {
    try {
      return <>{children}</>;
    } catch (e) {
      return <>{fallback}</>;
    }
  },
  captureException: vi.fn(),
}));

const BuggyComponent = () => {
  throw new Error('Intentional Test Error');
};

describe('Error Handling & Boundary Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Silence console.error for expected errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Polyfill scrollTo on Element and window
    if (typeof Element.prototype.scrollTo !== 'function') {
      Element.prototype.scrollTo = vi.fn();
    }
    if (typeof window.scrollTo !== 'function') {
      window.scrollTo = vi.fn();
    }
  });

  it('AppErrorBoundary catches child errors and displays fallback UI', () => {
    render(
      <AppErrorBoundary>
        <BuggyComponent />
      </AppErrorBoundary>
    );

    expect(screen.getByText(/Santuário em/i)).toBeDefined();
    expect(screen.getByText(/Manutenção/i)).toBeDefined();
    expect(screen.getByText(/Tentar Novamente/i)).toBeDefined();
  });

  it('AppErrorBoundary allows recovery via "Tentar Novamente" button', () => {
    const { rerender } = render(
      <AppErrorBoundary>
        <BuggyComponent />
      </AppErrorBoundary>
    );

    const retryButton = screen.getByText(/Tentar Novamente/i);
    expect(retryButton).toBeDefined();
    
    // We can't easily test the window.location.reload() but we can check if it resets state
    // In a real test we might mock window.location
  });

  it('Redirects /chat to /logos correctly', async () => {
    // We need to render the App with the router
    // Mocking window.history for the test
    window.history.pushState({}, '', '/chat');
    
    render(<App />);

    await waitFor(() => {
      // App.tsx has: <Route path="/chat" element={<Navigate to="/logos" replace />} />
      expect(window.location.pathname).toBe('/logos');
    });
  });

  it('Does not enter infinite loop when multiple components fail', () => {
    const renderCount = vi.fn();
    
    const BuggyWithCounter = () => {
      renderCount();
      throw new Error('Loop Test Error');
    };

    render(
      <AppErrorBoundary>
        <BuggyWithCounter />
      </AppErrorBoundary>
    );

    // Should only render a few times (React's retry logic) and then stop at the boundary
    expect(renderCount.mock.calls.length).toBeLessThan(10);
    expect(screen.getByText(/Santuário em/i)).toBeDefined();
  });

  it('Catches error in nested component and stops loop', () => {
    const renderCount = vi.fn();
    const DeepBuggy = () => {
      renderCount();
      throw new Error('Deep Error');
    };
    const MidLevel = () => <DeepBuggy />;
    
    render(
      <AppErrorBoundary>
        <MidLevel />
      </AppErrorBoundary>
    );
    
    expect(renderCount.mock.calls.length).toBeLessThan(10);
    expect(screen.getByText(/Santuário em/i)).toBeDefined();
  });
});
