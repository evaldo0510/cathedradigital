import { type Config } from "tailwindcss";

/**
 * Checks if a class list contains non-standard visual tokens (shadows, borders, radius, padding)
 * that should be handled by CathedraCard/CathedraButton components.
 */
export function checkVisualStandard(className: string): string[] {
  const violations: string[] = [];
  
  // Forbidden standalone visual tokens in components outside design system
  const legacyShadows = ['shadow-sm', 'shadow-md-forbidden', 'shadow-lg', 'shadow-xl-forbidden', 'shadow-2xl-forbidden'];
  const legacyRadius = ['rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl-forbidden', 'rounded-3xl-forbidden'];
  const forbiddenBorders = ['border-2', 'border-4', 'border-8'];
  
  const tokens = className.split(' ');
  
  tokens.forEach(token => {
    if (legacyShadows.includes(token)) violations.push(`Legacy Shadow: ${token}`);
    if (legacyRadius.includes(token)) violations.push(`Legacy Radius: ${token}`);
    if (forbiddenBorders.includes(token)) violations.push(`Non-standard Border: ${token}`);
  });
  
  return violations;
}
