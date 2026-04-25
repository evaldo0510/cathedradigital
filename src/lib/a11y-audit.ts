/**
 * A11y Audit Utility
 * This utility scans the DOM for common accessibility issues related to IDs and ARIA references.
 * Can be called from the browser console or integrated into a test suite.
 */
export function runA11yAudit() {
  console.log('%c🔍 Starting A11y Audit...', 'color: blue; font-weight: bold;');
  const issues: string[] = [];
  const ids = new Set<string>();
  const idElements = document.querySelectorAll('[id]');

  // 1. Check for duplicate IDs
  idElements.forEach((el) => {
    if (ids.has(el.id)) {
      issues.push(`Duplicate ID found: "${el.id}" on element <${el.tagName.toLowerCase()}>`);
    }
    ids.add(el.id);
  });

  // 2. Check aria-labelledby references
  const labelledBy = document.querySelectorAll('[aria-labelledby]');
  labelledBy.forEach((el) => {
    const refId = el.getAttribute('aria-labelledby');
    if (refId && !document.getElementById(refId)) {
      issues.push(`Broken aria-labelledby reference: "${refId}" on <${el.tagName.toLowerCase()}>`);
    }
  });

  // 3. Check aria-controls references
  const controls = document.querySelectorAll('[aria-controls]');
  controls.forEach((el) => {
    const refId = el.getAttribute('aria-controls');
    if (refId && !document.getElementById(refId)) {
      issues.push(`Broken aria-controls reference: "${refId}" on <${el.tagName.toLowerCase()}>`);
    }
  });

  // 4. Check for focus traps or non-focusable roving items
  const rovingItems = document.querySelectorAll('[data-roving-item]');
  rovingItems.forEach((el, idx) => {
    const tabIndex = el.getAttribute('tabindex');
    if (tabIndex === null) {
      issues.push(`Roving item at index ${idx} missing tabindex attribute.`);
    }
  });

  if (issues.length === 0) {
    console.log('%c✅ A11y Audit Passed: No ID collisions or broken ARIA references found.', 'color: green; font-weight: bold;');
  } else {
    console.error('%c❌ A11y Audit Failed:', 'color: red; font-weight: bold;');
    issues.forEach(issue => console.warn(`- ${issue}`));
  }

  return {
    success: issues.length === 0,
    issues
  };
}
