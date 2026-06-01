import { Icons } from '@/constants';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchResultCard } from './SearchResultCard';


describe('SearchResultCard', () => {
  it('renders title and subtitle', () => {
    render(<SearchResultCard title="São Tomás" subtitle="Doctor Angelicus" />);
    expect(screen.getByText('São Tomás')).toBeInTheDocument();
    expect(screen.getByText('Doctor Angelicus')).toBeInTheDocument();
  });

  it('does not render subtitle when null', () => {
    const { container } = render(<SearchResultCard title="Test" subtitle={null} />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(1); // only title
  });

  it('renders RelevanceBadge when score is provided', () => {
    render(<SearchResultCard title="Graça" score={0.85} />);
    expect(screen.getByText(/85%/)).toBeInTheDocument();
  });

  it('does not render RelevanceBadge when score is null', () => {
    const { container } = render(<SearchResultCard title="Test" score={null} />);
    expect(container.querySelector('[title^="Relevância"]')).toBeNull();
  });

  it('shows chevron arrow by default', () => {
    const { container } = render(<SearchResultCard title="Test" />);
    const svg = container.querySelector('svg.lucide-chevron-right');
    expect(svg).toBeInTheDocument();
  });

  it('hides arrow when showArrow=false', () => {
    const { container } = render(<SearchResultCard title="Test" showArrow={false} />);
    const svg = container.querySelector('svg.lucide-chevron-right');
    expect(svg).toBeNull();
  });

  it('renders icon when provided', () => {
    render(<SearchResultCard title="Test" icon={<Icons.Star data-testid="icon" />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handler = vi.fn();
    render(<SearchResultCard title="Clickable" onClick={handler} />);
    await userEvent.click(screen.getByText('Clickable'));
    expect(handler).toHaveBeenCalledOnce();
  });
});
