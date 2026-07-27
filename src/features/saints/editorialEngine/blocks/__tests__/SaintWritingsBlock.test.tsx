import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SaintWritingsBlock } from '../SaintWritingsBlock';
import type { SaintWritingRef } from '../../types';

const writings: SaintWritingRef[] = [
  {
    id: 'w1',
    title: 'Confissões',
    slug: 'confissoes',
    summary: 'Obra autobiográfica.',
    attribution: 'Tradução: J. Oliveira Santos',
    license: 'CC BY 4.0',
    canonicalUrl: 'https://cathedradigital.com.br/biblioteca/escritos/confissoes',
  },
  {
    id: 'w2',
    title: 'Cidade de Deus',
    externalUrl: 'https://www.vatican.va/city-of-god',
    externalSourceLabel: 'Vatican.va',
    attribution: 'Bibliotheca Augustana',
    license: 'Domínio público',
    isPublicDomain: true,
    publicDomainNote: 'Autor falecido em 430 d.C. — obra em domínio público mundial.',
    canonicalUrl: 'https://www.vatican.va/city-of-god',
  },
  {
    id: 'w3',
    title: 'Ancoradouro Espiritual',
    externalUrl: 'https://example.org/ancoradouro',
    externalSourceLabel: 'Documenta Catholica',
    license: 'CC BY-NC 4.0',
  },
];

const renderBlock = () =>
  render(
    <MemoryRouter>
      <SaintWritingsBlock writings={writings} />
    </MemoryRouter>,
  );

describe('SaintWritingsBlock — filtros e ordenação', () => {
  it('exibe contagem correta em cada filtro', () => {
    renderBlock();
    const tablist = screen.getByRole('tablist', { name: /origem/i });
    const tabs = within(tablist).getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveTextContent(/Todos.*3/);
    expect(tabs[1]).toHaveTextContent(/Hospedado no Cathedra.*1/);
    expect(tabs[2]).toHaveTextContent(/Conteúdo linkado.*2/);
  });

  it('filtra somente hospedados quando "Hospedado no Cathedra" é selecionado', () => {
    renderBlock();
    fireEvent.click(screen.getByRole('tab', { name: /Hospedado no Cathedra/ }));
    expect(screen.getByText('Confissões')).toBeInTheDocument();
    expect(screen.queryByText('Cidade de Deus')).not.toBeInTheDocument();
    expect(screen.queryByText('Ancoradouro Espiritual')).not.toBeInTheDocument();
  });

  it('filtra somente linkados quando "Conteúdo linkado" é selecionado', () => {
    renderBlock();
    fireEvent.click(screen.getByRole('tab', { name: /Conteúdo linkado/ }));
    expect(screen.queryByText('Confissões')).not.toBeInTheDocument();
    expect(screen.getByText('Cidade de Deus')).toBeInTheDocument();
    expect(screen.getByText('Ancoradouro Espiritual')).toBeInTheDocument();
  });

  it('ordena por título A–Z quando selecionado', () => {
    renderBlock();
    fireEvent.change(screen.getByLabelText(/Ordenar escritos/), {
      target: { value: 'title-asc' },
    });
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Ancoradouro Espiritual');
    expect(items[1]).toHaveTextContent('Cidade de Deus');
    expect(items[2]).toHaveTextContent('Confissões');
  });

  it('ordena por origem colocando hospedados primeiro (padrão)', () => {
    renderBlock();
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Confissões');
  });
});

describe('SaintWritingsBlock — modal de proveniência', () => {
  it('abre o modal ao clicar no gatilho de proveniência', () => {
    renderBlock();
    const trigger = screen.getByRole('button', { name: /Ver proveniência de Cidade de Deus/i });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Cidade de Deus')).toBeInTheDocument();
  });

  it('exibe atribuição, licença, URL canônica e nota de domínio público', () => {
    renderBlock();
    fireEvent.click(
      screen.getByRole('button', { name: /Ver proveniência de Cidade de Deus/i }),
    );
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Bibliotheca Augustana')).toBeInTheDocument();
    expect(within(dialog).getByText(/Domínio público/)).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Autor falecido em 430 d\.C\./),
    ).toBeInTheDocument();
    const link = within(dialog).getByRole('link', { name: /vatican\.va/ });
    expect(link).toHaveAttribute('href', 'https://www.vatican.va/city-of-god');
  });

  it('exibe escopo de uso completo para domínio público', () => {
    renderBlock();
    fireEvent.click(
      screen.getByRole('button', { name: /Ver proveniência de Cidade de Deus/i }),
    );
    const scope = screen.getByRole('list', { name: /Escopo de uso/i });
    expect(within(scope).getByText('Uso comercial')).toBeInTheDocument();
    expect(within(scope).getByText('Redistribuição')).toBeInTheDocument();
    expect(within(scope).getByText('Obras derivadas')).toBeInTheDocument();
  });

  it('marca uso comercial como não permitido para CC BY-NC', () => {
    renderBlock();
    fireEvent.click(
      screen.getByRole('button', { name: /Ver proveniência de Ancoradouro Espiritual/i }),
    );
    const scope = screen.getByRole('list', { name: /Escopo de uso/i });
    const commercialRow = within(scope).getByText('Uso comercial').closest('li');
    expect(commercialRow).not.toBeNull();
    expect(within(commercialRow!).getByLabelText('Não permitido')).toBeInTheDocument();
  });

  it('fecha o modal ao pressionar Escape', () => {
    renderBlock();
    fireEvent.click(
      screen.getByRole('button', { name: /Ver proveniência de Confissões/i }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'Escape',
      code: 'Escape',
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
