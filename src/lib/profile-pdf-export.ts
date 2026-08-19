import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


export interface DonationRow {
  created_at: string | null;
  amount: number;
  status: string | null;
  description: string | null;
  payment_id: string | null;
  is_donation: boolean | null;
}

export interface AuditRow {
  created_at: string | null;
  event_type: string;
  path: string | null;
  metadata: any;
}

interface ExportInput {
  userName: string;
  userEmail: string;
  donations: DonationRow[];
  audit: AuditRow[];
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR') : '—';

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100);

export async function exportProfilePdf({ userName, userEmail, donations, audit }: ExportInput) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const now = new Date().toLocaleString('pt-BR');

  // Cabeçalho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Cathedra — Relatório Pessoal', 40, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Usuário: ${userName || '—'}  ·  ${userEmail}`, 40, 68);
  doc.text(`Gerado em: ${now}`, 40, 82);


  // Doações
  const donationsStartY = 120;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Histórico de Doações & Apoio', 40, donationsStartY - 8);

  autoTable(doc, {
    startY: donationsStartY,
    head: [['Data', 'Descrição', 'Valor', 'Status', 'Tipo', 'ID Pagamento']],
    body: donations.length
      ? donations.map(d => [
          fmtDate(d.created_at),
          d.description || '—',
          fmtBRL(d.amount || 0),
          d.status || '—',
          d.is_donation ? 'Doação' : 'Assinatura',
          d.payment_id || '—',
        ])
      : [['—', 'Nenhuma doação registrada', '—', '—', '—', '—']],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [11, 31, 58], textColor: 255 },
    theme: 'striped',
  });

  // Auditoria
  const afterDonations = (doc as any).lastAutoTable.finalY + 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Trilha de Auditoria (Premium)', 40, afterDonations);

  autoTable(doc, {
    startY: afterDonations + 8,
    head: [['Data', 'Evento', 'Rota', 'Metadata']],
    body: audit.length
      ? audit.map(a => [
          fmtDate(a.created_at),
          a.event_type,
          a.path || '—',
          a.metadata ? JSON.stringify(a.metadata).slice(0, 80) : '—',
        ])
      : [['—', 'Nenhum evento registrado', '—', '—']],
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [11, 31, 58], textColor: 255 },
    theme: 'striped',
  });

  // Rodapé
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Cathedra Digital · pág. ${i}/${pageCount} · Documento gerado localmente`,
      40,
      doc.internal.pageSize.getHeight() - 24,
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`cathedra-relatorio-${stamp}.pdf`);
}
