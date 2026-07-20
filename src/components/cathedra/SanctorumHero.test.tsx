import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SanctorumHero } from './SanctorumHero';

describe('SanctorumHero — variantes unificadas', () => {
  it('variant="page" usa kicker padrão "Sanctorum Pro"', () => {
    render(<SanctorumHero variant="page" title="Vidas dos Santos" />);
    expect(screen.getByText('Sanctorum Pro')).toBeInTheDocument();
    expect(screen.getByText('Vidas dos Santos')).toBeInTheDocument();
  });

  it('variant="category" + kind="pope" deriva "Sanctorum · Papas"', () => {
    render(<SanctorumHero variant="category" kind="pope" title="Os Papas" />);
    expect(screen.getByText('Sanctorum · Papas')).toBeInTheDocument();
  });

  it('variant="category" + kind="doctor" deriva "Sanctorum · Doutores"', () => {
    render(<SanctorumHero variant="category" kind="doctor" title="Doutores" />);
    expect(screen.getByText('Sanctorum · Doutores')).toBeInTheDocument();
  });

  it('variant="saintOfDay" inclui data formatada em pt-BR', () => {
    const date = new Date(2026, 0, 28); // 28 de janeiro
    render(<SanctorumHero variant="saintOfDay" date={date} title="Santo Tomás" />);
    expect(screen.getByText(/Sanctorum · Santo do Dia · 28 de janeiro/)).toBeInTheDocument();
  });

  it('variant="detail" + kind="martyr" deriva "Sanctorum · Mártires"', () => {
    render(<SanctorumHero variant="detail" kind="martyr" title="Santo Estêvão" />);
    expect(screen.getByText('Sanctorum · Mártires')).toBeInTheDocument();
  });

  it('kicker explícito sempre vence a inferência (backward compat)', () => {
    render(
      <SanctorumHero
        variant="category"
        kind="pope"
        kicker="Sanctorum · Vicarius Christi"
        title="Os Papas"
      />,
    );
    expect(screen.getByText('Sanctorum · Vicarius Christi')).toBeInTheDocument();
    expect(screen.queryByText('Sanctorum · Papas')).not.toBeInTheDocument();
  });
});
