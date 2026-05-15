import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { describe, it, expect } from 'vitest';

describe('Card Component Suite', () => {
  it('renders standard card structure correctly', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
        <CardContent>Test Content</CardContent>
      </Card>
    );
    
    expect(screen.getByText('Test Title')).toBeDefined();
    expect(screen.getByText('Test Content')).toBeDefined();
  });

  it('applies variant styles', () => {
    const { container } = render(<Card variant="interactive">Interactive</Card>);
    const element = container.firstChild as HTMLElement;
    expect(element.className).toContain('premium-card-interactive');
  });

  it('applies padding maps', () => {
    const { container } = render(<Card padding="lg">Spacious</Card>);
    const element = container.firstChild as HTMLElement;
    expect(element.className).toContain('p-8 md:p-12 lg:p-16');
  });
});
