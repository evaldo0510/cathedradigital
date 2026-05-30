import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FuzzySearchInput } from './FuzzySearchInput';

describe('FuzzySearchInput', () => {
  it('renders controlled value', () => {
    render(<FuzzySearchInput value="hello" onChange={() => {}} />);
    expect(screen.getByDisplayValue('hello')).toBeTruthy();
  });

  it('calls onChange on input', () => {
    const onChange = vi.fn();
    render(<FuzzySearchInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('shows clear button only when value is non-empty', () => {
    const { rerender } = render(<FuzzySearchInput value="" onChange={() => {}} />);
    expect(screen.queryByLabelText('Limpar busca')).toBeNull();
    rerender(<FuzzySearchInput value="abc" onChange={() => {}} />);
    expect(screen.getByLabelText('Limpar busca')).toBeTruthy();
  });

  it('clicking clear calls onChange with empty string', () => {
    const onChange = vi.fn();
    render(<FuzzySearchInput value="abc" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Limpar busca'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('shows "Buscando…" only when isSearching=true and value >= minLength', () => {
    const { rerender } = render(<FuzzySearchInput value="ab" onChange={() => {}} isSearching={true} minLength={2} />);
    expect(screen.getByText('Buscando…')).toBeTruthy();

    rerender(<FuzzySearchInput value="a" onChange={() => {}} isSearching={true} minLength={2} />);
    expect(screen.queryByText('Buscando…')).toBeNull();

    rerender(<FuzzySearchInput value="ab" onChange={() => {}} isSearching={false} minLength={2} />);
    expect(screen.queryByText('Buscando…')).toBeNull();
  });

  it('applies md size classes by default', () => {
    render(<FuzzySearchInput value="" onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('rounded-premium-full');
  });

  it('applies lg size classes', () => {
    render(<FuzzySearchInput value="" onChange={() => {}} size="lg" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('rounded-premium-full');
  });
});
