import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RelevanceBadge } from './RelevanceBadge';

describe('<RelevanceBadge />', () => {
  it('renders nothing when score is null', () => {
    const { container } = render(<RelevanceBadge score={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when score is undefined', () => {
    const { container } = render(<RelevanceBadge score={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when score is 0', () => {
    const { container } = render(<RelevanceBadge score={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('uses emerald tones at or above the 50% threshold', () => {
    render(<RelevanceBadge score={0.75} />);
    const badge = screen.getByText('75%');
    expect(badge.className).toContain('emerald');
    expect(badge.className).not.toContain('amber');
  });

  it('uses amber tones between 25% and 49%', () => {
    render(<RelevanceBadge score={0.3} />);
    const badge = screen.getByText('30%');
    expect(badge.className).toContain('amber');
    expect(badge.className).not.toContain('emerald');
  });

  it('uses muted tones below 25%', () => {
    render(<RelevanceBadge score={0.1} />);
    const badge = screen.getByText('10%');
    expect(badge.className).toContain('muted');
  });

  it('applies the "sm" size variant by default', () => {
    render(<RelevanceBadge score={0.5} />);
    const badge = screen.getByText('50%');
    expect(badge.className).toContain('text-premium-xs');
    expect(badge.className).toContain('px-spacing-xs');
  });

  it('applies the "xs" size variant when requested', () => {
    render(<RelevanceBadge score={0.5} size="xs" />);
    const badge = screen.getByText('50%');
    expect(badge.className).toContain('text-premium-xs');
    expect(badge.className).toContain('px-spacing-2xs');
  });

  it('exposes an accessible aria-label and tooltip with the percentage', () => {
    render(<RelevanceBadge score={0.42} />);
    const badge = screen.getByLabelText(/Relevância da busca: 42 por cento/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('title', 'Relevância: 42%');
  });

  it('forwards extra className for positioning', () => {
    render(<RelevanceBadge score={0.6} className="absolute top-spacing-0 right-0" />);
    const badge = screen.getByText('60%');
    expect(badge.className).toContain('absolute');
    expect(badge.className).toContain('top-spacing-0');
  });

  it('clamps percentages above 100%', () => {
    render(<RelevanceBadge score={1.7} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
