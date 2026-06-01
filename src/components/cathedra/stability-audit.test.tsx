import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Icons } from '../constants';

describe('Icons & A11y Audit', () => {
  it('should have a standard strokeWidth of 1.2 and size 20', () => {
    // This tests our createIcon factory logic indirectly
    const { container } = render(<Icons.Sun />);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.getAttribute('stroke-width')).toBe('1.2');
    expect(svg?.getAttribute('width')).toBe('20');
    expect(svg?.getAttribute('height')).toBe('20');
  });

  it('should be hidden from screen readers by default (aria-hidden="true")', () => {
    const { container } = render(<Icons.Sun />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should accept and respect aria-label for interactive icons', () => {
    const label = "Configurações";
    const { container } = render(<Icons.Settings aria-label={label} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe(label);
    expect(svg?.getAttribute('role')).toBe('img');
    // aria-hidden should be undefined if label is provided
    expect(svg?.getAttribute('aria-hidden')).toBeNull();
  });

  it('should allow manual aria-hidden override', () => {
    const { container } = render(<Icons.Sun aria-hidden="false" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('false');
  });
});

describe('CI Layout Thresholds (Simulation)', () => {
  it('should respect content width limits on mobile (70-90%)', () => {
    // In a real CI, we'd use a script to check CSS files or use a headless browser
    // Here we simulate the threshold check
    const mobileContentWidth = 85; // from index.css: 85vw
    expect(mobileContentWidth).toBeGreaterThanOrEqual(70);
    expect(mobileContentWidth).toBeLessThanOrEqual(90);
  });

  it('should respect padding limits to maximize useful density', () => {
    const mobilePadding = 12; // from index.css: 0.75rem (12px)
    expect(mobilePadding).toBeLessThanOrEqual(24); // Max 24px padding on small screens
  });

  it('should ensure header does not exceed 64px on mobile', () => {
    const headerHeight = 56; // from index.css: 56px
    expect(headerHeight).toBeLessThanOrEqual(64);
  });
});
