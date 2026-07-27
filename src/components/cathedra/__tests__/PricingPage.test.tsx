import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import PricingPage, { PRICING_GROUPS, FeatureList } from '@/components/cathedra/PricingPage';

// useAuth mock
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isPremium: false }),
}));

// Card usa ReadingSettingsContext (irrelevante para esta suíte). Mock para elementos simples.
vi.mock('@/components/ui/card', () => {
  const mk = (tag: string) =>
    ({ children, ...props }: any) => {
      const El: any = tag;
      return <El {...props}>{children}</El>;
    };
  return {
    Card: mk('div'),
    CardHeader: mk('div'),
    CardContent: mk('div'),
    CardTitle: mk('h3'),
    CardDescription: mk('p'),
    CardFooter: mk('div'),
  };
});

const renderPage = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <PricingPage />
      </MemoryRouter>
    </HelmetProvider>,
  );

describe('PricingPage — estrutura e integridade', () => {
  it('renderiza os dois planos com preços consistentes', () => {
    renderPage();
    expect(screen.getByTestId('plan-card-free')).toBeInTheDocument();
    expect(screen.getByTestId('plan-card-pro')).toBeInTheDocument();
    expect(screen.getByText('Peregrino')).toBeInTheDocument();
    expect(screen.getByText('Cathedra PRO')).toBeInTheDocument();
    // Preço mensal deve refletir 15,92
    expect(screen.getByText('R$ 15')).toBeInTheDocument();
    expect(screen.getByText(',92')).toBeInTheDocument();
    expect(screen.getByText(/R\$ 191,04\/ano/)).toBeInTheDocument();
  });

  it('cada card mostra ambos os grupos como cabeçalhos visuais (não como itens)', () => {
    renderPage();
    const groupTitles = PRICING_GROUPS.map((g) => g.title);

    for (const variant of ['free', 'pro'] as const) {
      const card = screen.getByTestId(`plan-card-${variant}`);
      const headers = within(card).getAllByTestId(`group-header-${variant}`);
      expect(headers).toHaveLength(groupTitles.length);
      groupTitles.forEach((title, i) => {
        expect(headers[i]).toHaveTextContent(title);
        // O título do grupo NÃO deve aparecer também como <li> dentro do card
        const items = within(card).queryAllByRole('listitem');
        const asItem = items.find((li) => li.textContent?.trim() === title);
        expect(asItem, `"${title}" apareceu como feature no card ${variant}`).toBeUndefined();
      });
    }
  });

  it('não duplica labels de feature dentro de um mesmo card', () => {
    renderPage();
    for (const variant of ['free', 'pro'] as const) {
      const card = screen.getByTestId(`plan-card-${variant}`);
      const labels = PRICING_GROUPS.flatMap((g) => g.items.map((i) => i.label));
      for (const label of labels) {
        const matches = within(card).getAllByText(label);
        expect(matches, `label "${label}" duplicada em ${variant}`).toHaveLength(1);
      }
    }
  });

  it('plano free marca features exclusivas do PRO com ícone de exclusão (não com check)', () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <FeatureList variant="free" />
        </MemoryRouter>
      </HelmetProvider>,
    );
    const proOnly = PRICING_GROUPS.flatMap((g) => g.items).filter((i) => !i.free);
    for (const item of proOnly) {
      const li = screen.getByText(item.label).closest('li');
      expect(li).not.toBeNull();
      // ícone svg dentro do <li>: garantimos que a label do PRO-only está com estilo muted
      const span = within(li as HTMLElement).getByText(item.label);
      expect(span.className).toMatch(/muted-foreground/);
    }
  });

  it('não existe seção "Comparativo Detalhado" duplicando a lista das features', () => {
    renderPage();
    expect(screen.queryByText(/Comparativo Detalhado/i)).toBeNull();
  });

  it('injeta JSON-LD com Product/Offers e BreadcrumbList apontando para /pricing', async () => {
    renderPage();
    // Helmet grava no document.head de forma assíncrona
    await new Promise((r) => setTimeout(r, 0));
    const scripts = Array.from(
      document.head.querySelectorAll('script[type="application/ld+json"]'),
    ) as HTMLScriptElement[];
    const jsonBlocks = scripts.map((s) => {
      try { return JSON.parse(s.textContent || ''); } catch { return null; }
    }).filter(Boolean);

    const product = jsonBlocks.find((b) => b['@type'] === 'Product');
    expect(product, 'JSON-LD Product ausente').toBeTruthy();
    expect(product.name).toBe('Cathedra PRO');
    const prices = (product.offers ?? []).map((o: any) => o.price);
    expect(prices).toContain('15.92');
    expect(prices).toContain('191.04');

    const crumbs = jsonBlocks.find((b) => b['@type'] === 'BreadcrumbList');
    expect(crumbs, 'JSON-LD BreadcrumbList ausente').toBeTruthy();
    expect(JSON.stringify(crumbs)).toContain('/pricing');
    expect(JSON.stringify(crumbs)).not.toContain('/planos');
  });

  it('define canonical e og:url em /pricing (não /planos)', async () => {
    renderPage();
    await new Promise((r) => setTimeout(r, 0));
    const canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    expect(canonical?.href).toContain('/pricing');
    expect(canonical?.href).not.toContain('/planos');
    const ogUrl = document.head.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
    expect(ogUrl?.content).toContain('/pricing');
  });
});
