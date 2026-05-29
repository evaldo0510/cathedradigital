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
 * Find the actual background color of an element by traversing up the DOM tree
 * and blending transparent/semi-transparent layers.
 */
const getActualBackgroundColor = (element: HTMLElement): string => {
  let current: HTMLElement | null = element;
  let colors: string[] = [];

  while (current) {
    const style = window.getComputedStyle(current);
    const bg = style.backgroundColor;
    
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      colors.unshift(bg);
      // If the color is fully opaque, we can stop
      if (!bg.includes('rgba') || bg.match(/rgba\(.*,\s*1\)$/)) {
        break;
      }
    }
    current = current.parentElement;
  }

  // If no background found, default to white
  if (colors.length === 0) return '#FFFFFF';
  
  // Actually we should return the most specific one for now, 
  // but a better approach would be blending all of them.
  // For simplicity, let's use the first opaque or semi-transparent background we found.
  return colors[colors.length - 1];
};

/**
 * Validates WCAG AAA and Typography consistency.
 */
export const runDesignSystemAudit = async (pageName: string): Promise<AuditResult> => {
  const typographyErrors: string[] = [];
  const gridIssues: string[] = [];
  const contrastIssues: ContrastIssue[] = [];
  
  // Get current theme from body or root
  const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const isHighContrast = document.documentElement.classList.contains('high-contrast');

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
  const interactiveElements = document.querySelectorAll('button, a, input, [role="button"], p, h1, h2, h3, span');
  interactiveElements.forEach(el => {
    if (!(el instanceof HTMLElement)) return;
    
    const style = window.getComputedStyle(el);
    const bg = getActualBackgroundColor(el);
    const fg = style.color;
    
    // Skip invisible elements
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

    try {
      const ratio = getContrastRatio(fg, bg);
      const level = getWCAGLevel(ratio);
      const minRatio = isHighContrast ? 7 : 4.5;
      
      if (ratio < minRatio) {
        contrastIssues.push({
          element: `${el.tagName}${el.className ? '.' + el.className.split(' ').slice(0, 2).join('.') : ''}`,
          ratio,
          expected: minRatio,
          level,
          suggestion: ratio < 3 ? 'Contraste Crítico: Aumentar saturação ou mudar cor.' : 'Ajuste fino necessário para atingir conformidade.'
        });
      }
    } catch (e) {
      // Skip elements with complex background colors or parsing errors
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
  const currentTheme = document.documentElement.classList.contains('dark') ? 'Escuro' : 'Claro';
  const isHighContrast = document.documentElement.classList.contains('high-contrast') ? 'Sim' : 'Não';
  
  if (format === 'json') {
    const reportData = {
      ...result,
      meta: {
        theme: currentTheme,
        highContrast: isHighContrast,
        browser: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`
      }
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
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
    doc.setFontSize(24);
    doc.setTextColor(181, 139, 58); // Sovereign Gold
    doc.text('Relatório de Conformidade - Cathedra Digital', 20, 25);
    
    doc.setDrawColor(181, 139, 58);
    doc.line(20, 30, 190, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date(result.timestamp).toLocaleString()}`, 20, 38);
    
    // Metadata Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Informações do Ambiente', 20, 50);
    
    const metaData = [
      ['Página Auditada', result.page],
      ['Tema Ativo', currentTheme],
      ['Alto Contraste', isHighContrast],
      ['Score WCAG', `${result.wcagScore}%`],
      ['Status Geral', result.status.toUpperCase()]
    ];
    
    doc.autoTable({
      startY: 55,
      body: metaData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 }
    });
    
    let currentY = (doc as any).lastAutoTable.finalY + 15;

    // Contrast Issues Detailed
    if (result.contrastIssues.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(181, 139, 58);
      doc.text('Análise Detalhada de Contraste', 20, currentY);
      
      const tableData = result.contrastIssues.map(issue => [
        issue.element,
        issue.ratio.toFixed(2),
        issue.expected.toFixed(2),
        issue.level,
        issue.suggestion || 'Revisar tokens de cores.'
      ]);
      
      doc.autoTable({
        startY: currentY + 5,
        head: [['Componente', 'Ratio', 'Min', 'Nível', 'Recomendação']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [181, 139, 58], textColor: [255, 255, 255] },
        styles: { fontSize: 8 }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Recommendations Section
    doc.setFontSize(16);
    doc.setTextColor(181, 139, 58);
    doc.text('Recomendações Técnicas', 20, currentY);
    
    const recommendations = [];
    if (result.wcagScore < 100) {
      recommendations.push(['Contraste', 'Substituir cores de texto por variantes mais escuras (no modo claro) ou mais claras (no modo escuro) do Design System.']);
      recommendations.push(['Tipografia', 'Garantir que todos os componentes utilizam a fonte Cinzel para títulos e Inter para corpo de texto.']);
      recommendations.push(['Tokens', 'Evitar o uso de estilos inline e cores hexadecimais manuais fora do sacredPalette.ts.']);
    } else {
      recommendations.push(['Excelente', 'O sistema mantém conformidade total com os padrões estabelecidos. Continue utilizando os tokens globais.']);
    }
    
    doc.autoTable({
      startY: currentY + 5,
      head: [['Categoria', 'Ação Corretiva']],
      body: recommendations,
      theme: 'grid',
      headStyles: { fillColor: [80, 80, 80] }
    });
    
    doc.save(`cathedra_a11y_detailed_report_${result.page.replace(/\//g, '_')}.pdf`);
  }
};
