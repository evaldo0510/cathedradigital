/**
 * A11y — LiturgyMeditationFallbackNotice: role=status, aria-live,
 * botão de retry navegável, link "Planos & créditos" acessível.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LiturgyMeditationFallbackNotice } from '@/components/cathedra/primitives/liturgy/LiturgyMeditationBlocks';

describe('LiturgyMeditationFallbackNotice a11y', () => {
  it('expõe role status + aria-live polite', () => {
    render(<LiturgyMeditationFallbackNotice message="teste" code="ai_unavailable" source="local-builder" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('data-fallback-code', 'ai_unavailable');
  });

  it('botão de retry é focável e dispara handler via teclado (Enter)', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <LiturgyMeditationFallbackNotice
        message="msg"
        code="ai_unavailable"
        source="local-cache"
        onRetry={onRetry}
      />,
    );
    const btn = screen.getByRole('button', { name: /tentar gerar novamente/i });
    btn.focus();
    expect(btn).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('exibe link "Planos & créditos" com rel seguro apenas em ai_credits_exhausted', () => {
    const { rerender } = render(
      <LiturgyMeditationFallbackNotice message="m" code="ai_unavailable" source="local-cache" />,
    );
    expect(screen.queryByRole('link', { name: /planos e créditos/i })).toBeNull();

    rerender(
      <LiturgyMeditationFallbackNotice message="m" code="ai_credits_exhausted" source="local-cache" />,
    );
    const link = screen.getByRole('link', { name: /planos e créditos/i });
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('href', expect.stringMatching(/^https?:\/\//));
  });

  it('botão desabilitado quando isRetrying=true', () => {
    render(
      <LiturgyMeditationFallbackNotice
        message="m" code="ai_unavailable" source="local-builder"
        onRetry={() => {}} isRetrying
      />,
    );
    expect(screen.getByRole('button', { name: /tentar gerar novamente/i })).toBeDisabled();
  });
});
