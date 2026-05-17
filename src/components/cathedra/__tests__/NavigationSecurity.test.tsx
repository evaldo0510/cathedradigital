import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthGuard from '../AuthGuard';
import AdminGuard from '../AdminGuard';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth');

const MockComponent = ({ title }: { title: string }) => <div>{title}</div>;

describe('Segurança de Navegação', () => {
  it('deve redirecionar para login se usuário não estiver autenticado em rota protegida', () => {
    (useAuth as any).mockReturnValue({
      user: null,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/hoje']}>
        <Routes>
          <Route path="/login" element={<MockComponent title="Login Page" />} />
          <Route path="/hoje" element={<AuthGuard><MockComponent title="Hoje" /></AuthGuard>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeDefined();
  });

  it('deve bloquear acesso à área administrativa para usuários comuns', () => {
    (useAuth as any).mockReturnValue({
      user: { id: '123' },
      profile: { role: 'user' },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminGuard><MockComponent title="Admin Dashboard" /></AdminGuard>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Acesso Restrito')).toBeDefined();
  });

  it('deve permitir acesso administrativo para administradores', () => {
    (useAuth as any).mockReturnValue({
      user: { id: '123' },
      profile: { role: 'admin' },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminGuard><MockComponent title="Admin Dashboard" /></AdminGuard>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Dashboard')).toBeDefined();
  });
});
