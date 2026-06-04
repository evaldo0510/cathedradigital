import { runA11yAudit } from './a11y-audit';

/**
 * Mobile A11y Audit Specialist
 * Estende a auditoria básica para focar em áreas de toque e contrastes mobile.
 */
export function runMobileA11yAudit() {
  const baseResult = runA11yAudit();
  const mobileIssues: Array<{ message: string; type: 'error' | 'warning' | 'info'; selector?: string }> = [];

  // 1. Verificação de área de toque (Touch Targets)
  const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
  interactiveElements.forEach((el, idx) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 44 || rect.height < 44) {
      const label = el.getAttribute('aria-label') || el.textContent?.substring(0, 20) || `index ${idx}`;
      mobileIssues.push({
        type: 'warning',
        message: `[Touch Target] Elemento "${label}" é muito pequeno (${Math.round(rect.width)}x${Math.round(rect.height)}px). Recomendado min 44x44px.`,
        selector: el.className
      });
    }
  });

  // 2. Verificação de contraste de texto
  const lowOpacityTexts = document.querySelectorAll('.text-foreground\\/40, .text-primary\\/30, .opacity-30');
  lowOpacityTexts.forEach((el) => {
    mobileIssues.push({
      type: 'error',
      message: `[Contraste] Possível problema de legibilidade no elemento: "${el.textContent?.substring(0, 20)}..."`,
      selector: el.className
    });
  });

  const allIssues = [
    ...baseResult.issues.map(msg => ({ message: msg, type: 'error' as const })),
    ...mobileIssues
  ];
  
  console.log('%c📱 Mobile A11y Audit Complete', 'color: purple; font-weight: bold;');
  
  return {
    success: allIssues.length === 0,
    issues: allIssues,
    baseIssuesCount: baseResult.issues.length,
    mobileSpecificCount: mobileIssues.length
  };
}
