import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaintsFetchError } from '../SaintsFetchError';

describe('SaintsFetchError', () => {
  it('renderiza com role="alert" e aria-live="assertive"', () => {
    render(<SaintsFetchError onRetry={() => {}} />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveAttribute('aria-atomic', 'true');
  });

  it('exibe mensagem padrão quando message não é fornecida', () => {
    render(<SaintsFetchError onRetry={() => {}} />);
    expect(
      screen.getByText(/verifique sua conexão e tente novamente/i),
    ).toBeInTheDocument();
  });

  it('exibe mensagem customizada quando fornecida', () => {
    render(<SaintsFetchError message="Erro 500 no banco" onRetry={() => {}} />);
    expect(screen.getByText('Erro 500 no banco')).toBeInTheDocument();
  });

  it('chama onRetry ao clicar em "Tentar novamente"', () => {
    const refetch = vi.fn();
    render(<SaintsFetchError onRetry={refetch} />);
    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('desabilita o botão e marca aria-busy quando isRetrying=true', () => {
    const refetch = vi.fn();
    render(<SaintsFetchError onRetry={refetch} isRetrying />);
    const button = screen.getByRole('button', { name: /tentando/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(refetch).not.toHaveBeenCalled();
  });
});
