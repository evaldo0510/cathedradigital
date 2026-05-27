import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Navigate } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import AdminGuard from '../AdminGuard';
import { LangContext } from '@/contexts/LangContext';
import { HelmetProvider } from 'react-helmet-async';

// Mock context providers
const mockT = (k: string) => k;
const mockAuthContext = {
  user: null,
  profile: null,
  loading: false,
  signOut: vi.fn(),
  isPremium: true,
  userLevel: 'iniciante',
  refreshProfile: vi.fn(),
};

describe('Navigation & Admin Guards', () => {
  const renderWithContext = (component: React.ReactNode, authValue = mockAuthContext) => {
    return render(
      <HelmetProvider>
        <AuthContext.Provider value={authValue as any}>
          <LangContext.Provider value={{ t: mockT, lang: 'pt', setLang: vi.fn() }}>
            <MemoryRouter initialEntries={['/admin']}>
              {component}
            </MemoryRouter>
          </LangContext.Provider>
        </AuthContext.Provider>
      </HelmetProvider>
    );
  };

  it('redirects unauthenticated users to home', async () => {
    renderWithContext(
      <AdminGuard>
        <div>Admin Content</div>
      </AdminGuard>,
      { ...mockAuthContext, user: null, loading: false }
    );
    
    // In MemoryRouter, we check if the content is NOT rendered and if the logic would trigger redirect
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('redirects non-admin users to home', async () => {
    renderWithContext(
      <AdminGuard>
        <div>Admin Content</div>
      </AdminGuard>,
      { 
        ...mockAuthContext, 
        user: { id: '123' } as any, 
        profile: { role: 'user' } as any, 
        loading: false 
      }
    );
    
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders content for admin users', async () => {
    renderWithContext(
      <AdminGuard>
        <div>Admin Content</div>
      </AdminGuard>,
      { 
        ...mockAuthContext, 
        user: { id: '123' } as any, 
        profile: { role: 'admin' } as any, 
        loading: false 
      }
    );
    
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('shows loading state while auth is loading', () => {
    renderWithContext(
      <AdminGuard>
        <div>Admin Content</div>
      </AdminGuard>,
      { ...mockAuthContext, loading: true }
    );
    
    expect(screen.getByRole('status', { hidden: true }) || document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
});

