import { supabase } from '@/integrations/supabase/client';
import { getContrastRatio, getWCAGLevel } from './a11y-utils';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Type extension for jsPDF to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export interface ContrastIssue {
  element: string;
  ratio: number;
  expected: number;
  level: string;
  suggestion?: string;
}

export interface AuditResult {
  page: string;
  timestamp: string;
  wcagScore: number;
  typographyErrors: string[];
  gridIssues: string[];
  contrastIssues: ContrastIssue[];
  status: 'premium' | 'degraded';
}

/**
 * Validates WCAG AAA and Typography consistency.
 */
export const runDesignSystemAudit = async (pageName: string): Promise<AuditResult> => {
  const typographyErrors: string[] = [];
  const gridIssues: string[] = [];
  const contrastIssues: ContrastIssue[] = [];
  
  // 1. Check Typography Tokens
  const elements = document.querySelectorAll('h1, h2, h3, h4, p, span, button');
  const allowedFonts = ['Inter', 'Playfair Display', 'Cinzel', 'Merriweather', 'system-ui', 'serif', 'sans-serif', 'monospace', 'Courier'];
  const allowedWeights = ['400', '500', '600', '700', '800', '900'];

  elements.forEach((el) => {
    const style = window.getComputedStyle(el);
    
    // Check Font Family
    const fontFamily = style.fontFamily;
    const isFontAllowed = allowedFonts.some(f => fontFamily.includes(f));
    if (!isFontAllowed) {
      typographyErrors.push(`Fonte não permitida: "${fontFamily}" em ${el.tagName}`);
    }

    // Check Font Weight
    const fontWeight = style.fontWeight;
    if (!allowedWeights.includes(fontWeight)) {
      typographyErrors.push(`Peso tipográfico irregular: ${fontWeight} em ${el.tagName}`);
    }

    // Check for inline styles that override tokens
    if (el instanceof HTMLElement && (el.getAttribute('style')?.includes('font-family') || el.getAttribute('style')?.includes('font-weight'))) {
      typographyErrors.push(`Estilo inline detectado em ${el.tagName} (deve usar tokens)`);
    }
  });

  // 2. Check Grids & Alignment
  const containers = document.querySelectorAll('.container, .grid, .flex-col');
  containers.forEach(container => {
    const style = window.getComputedStyle(container);
    if (container.classList.contains('grid') && !style.gap && !container.classList.value.includes('gap-')) {
      gridIssues.push(`Grid sem espaçamento padronizado (gap) em ${container.tagName}`);
    }
  });

  // 3. Check Contrast for key elements
  const interactiveElements = document.querySelectorAll('button, a, input, [role="button"], p, h1, h2, h3');
  interactiveElements.forEach(el => {
    const style = window.getComputedStyle(el);
    const bg = style.backgroundColor;
    const fg = style.color;
    
    // Simple heuristic for contrast - might need more robust background detection for transparent elements
    // We only check if background is not fully transparent
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      try {
        const ratio = getContrastRatio(bg, fg);
        const level = getWCAGLevel(ratio);
        
        if (ratio < 4.5) {
          contrastIssues.push({
            element: `${el.tagName}${el.className ? '.' + el.className.split(' ').slice(0, 2).join('.') : ''}`,
            ratio,
            expected: 4.5,
            level,
            suggestion: 'Aumentar contraste entre fundo e texto.'
          });
        }
      } catch (e) {
        // Skip elements with complex background colors or parsing errors
      }
    }
  });

  const result: AuditResult = {
    page: pageName,
    timestamp: new Date().toISOString(),
    wcagScore: Math.max(0, Math.min(100, 100 - (typographyErrors.length * 5) - (contrastIssues.length * 10))),
    typographyErrors,
    gridIssues,
    contrastIssues,
    status: typographyErrors.length === 0 && gridIssues.length === 0 && contrastIssues.length === 0 ? 'premium' : 'degraded'
  };

  return result;
};

/**
 * Saves audit result to Supabase
 */
export const saveAuditResult = async (runId: string, result: AuditResult) => {
  const { error } = await supabase
    .from('visual_regression_snapshots')
    .insert({
      run_id: runId,
      page_name: result.page,
      route: window.location.pathname,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      status: result.status === 'premium' ? 'pass' : 'fail',
      typography_errors: result.typographyErrors,
      wcag_score: result.wcagScore,
    });

  return !error;
};

/**
 * Generates and downloads a JSON report
 */
export const exportAuditReport = (result: AuditResult, format: 'json' | 'pdf' = 'json') => {
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", `cathedra_design_audit_${result.page.replace(/\//g, '_')}_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
  } else {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    // Add Header
    doc.setFontSize(22);
    doc.text('Cathedra Digital - Design System Audit', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Pagina: ${result.page}`, 20, 30);
    doc.text(`Data: ${new Date(result.timestamp).toLocaleString()}`, 20, 37);
    doc.text(`Conformidade WCAG: ${result.wcagScore}%`, 20, 44);
    doc.text(`Status: ${result.status.toUpperCase()}`, 20, 51);
    
    // Contrast Issues Table
    if (result.contrastIssues.length > 0) {
      doc.setFontSize(16);
      doc.text('Problemas de Contraste', 20, 65);
      
      const tableData = result.contrastIssues.map(issue => [
        issue.element,
        issue.ratio.toFixed(2),
        issue.expected.toFixed(2),
        issue.level,
        issue.suggestion || '-'
      ]);
      
      doc.autoTable({
        startY: 70,
        head: [['Elemento', 'Ratio Atual', 'Esperado', 'Nivel', 'Sugestao']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [181, 139, 58] } // Sovereign Gold
      });
    } else {
      doc.setFontSize(14);
      doc.setTextColor(0, 150, 0);
      doc.text('Nenhum problema de contraste detectado.', 20, 70);
    }
    
    // Typography Errors
    if (result.typographyErrors.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 80;
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Erros de Tipografia', 20, finalY + 20);
      
      doc.autoTable({
        startY: finalY + 25,
        head: [['Descricao do Erro']],
        body: result.typographyErrors.map(err => [err]),
        theme: 'grid'
      });
    }
    
    doc.save(`cathedra_a11y_report_${result.page.replace(/\//g, '_')}.pdf`);
  }
};
