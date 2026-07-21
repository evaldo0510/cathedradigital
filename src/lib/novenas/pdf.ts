import jsPDF from 'jspdf';
import type { Novena } from '@/data/novenas';
import type { NovenaProgress } from './progress';

/**
 * Gera um PDF com o progresso da novena: dia atual, percentual, dias concluídos
 * e resumo (título + meditação) de cada dia.
 */
export function generateNovenaProgressPdf(novena: Novena, progress: NovenaProgress) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const completed = new Set(progress.completedDays);
  const total = novena.days.length;
  const percent = Math.round((completed.size / total) * 100);

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeParagraph = (text: string, opts: { size?: number; bold?: boolean; italic?: boolean; gap?: number } = {}) => {
    const size = opts.size ?? 11;
    doc.setFont('Times', opts.bold ? 'bold' : opts.italic ? 'italic' : 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    for (const line of lines) {
      ensureSpace(size + 4);
      doc.text(line, margin, y);
      y += size + 4;
    }
    y += opts.gap ?? 4;
  };

  // Cabeçalho
  writeParagraph('Cathedra Digital', { size: 9 });
  writeParagraph(novena.title, { size: 22, bold: true, gap: 2 });
  if (novena.latin) writeParagraph(novena.latin, { size: 11, italic: true, gap: 6 });

  // Resumo do progresso
  writeParagraph('Meu progresso', { size: 13, bold: true, gap: 2 });
  writeParagraph(
    `Dia atual: ${progress.currentDay} de ${total}   ·   Concluídos: ${completed.size}/${total}   ·   ${percent}%`,
    { size: 11 },
  );
  const startedAt = new Date(progress.startedAt).toLocaleDateString('pt-BR');
  const updatedAt = progress.updatedAt
    ? new Date(progress.updatedAt).toLocaleDateString('pt-BR')
    : startedAt;
  writeParagraph(`Iniciada em ${startedAt}   ·   Atualizada em ${updatedAt}`, {
    size: 10,
    gap: 12,
  });

  // Barra visual simples
  ensureSpace(20);
  const barW = contentWidth;
  const barH = 8;
  doc.setDrawColor(180, 180, 180);
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, y, barW, barH, 'F');
  doc.setFillColor(201, 168, 76);
  doc.rect(margin, y, (barW * percent) / 100, barH, 'F');
  y += barH + 16;

  // Resumo dos dias
  writeParagraph('Resumo das meditações', { size: 13, bold: true, gap: 6 });
  for (const d of novena.days) {
    const done = completed.has(d.day);
    const mark = done ? '✓' : d.day === progress.currentDay ? '»' : '·';
    writeParagraph(`${mark} Dia ${d.day} — ${d.title}`, { size: 12, bold: true, gap: 2 });
    if (d.scripture) writeParagraph(d.scripture, { size: 10, italic: true, gap: 2 });
    writeParagraph(d.meditation, { size: 11, gap: 4 });
    writeParagraph(`Intenção: ${d.intention}`, { size: 10, italic: true, gap: 12 });
  }

  const safeSlug = novena.slug.replace(/[^a-z0-9-]/gi, '-');
  doc.save(`cathedra-novena-${safeSlug}-progresso.pdf`);
}
