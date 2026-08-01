import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SellerDashboard from '../SellerDashboard';
import { AppRoute } from '@/types';
import '@testing-library/jest-dom';
import { TestContexts } from '@/test/providers';

// Mock useAuth hook
vi.mock('@/hooks/useAuth', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useAuth')>('@/hooks/useAuth');
  return {
    ...actual,

  useAuth: vi.fn(() => ({
    user: { id: '123', email: 'test@vendedor.com' },
    profile: { role: 'user' },
    loading: false,
  })),
};
});

describe('SellerDashboard Component', () => {
  it('deve renderizar a rota do vendedor e validar a presença dos componentes Histórico da Carteira e Solicitações de Saque', () => {
    render(
      <MemoryRouter initialEntries={[AppRoute.SELLER]}>
        <TestContexts><Routes>
          <Route path={AppRoute.SELLER} element={<SellerDashboard />} />
        </Routes></TestContexts>
      </MemoryRouter>
    );

    // Valida o título principal
    expect(screen.getByText('Painel do Vendedor')).toBeInTheDocument();

    // Valida o componente Histórico da Carteira
    expect(screen.getByText('Histórico da Carteira')).toBeInTheDocument();
    expect(screen.getByText('Visualize todas as suas movimentações financeiras.')).toBeInTheDocument();

    // Valida o componente Solicitações de Saque
    expect(screen.getByText('Solicitações de Saque')).toBeInTheDocument();
    expect(screen.getByText('Acompanhe o status dos seus pedidos de resgate.')).toBeInTheDocument();
    
    // Valida elementos das tabelas (mock data)
    expect(screen.getByText('Venda')).toBeInTheDocument();
    expect(screen.getByText('R$ 150,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 500,00')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });
});
