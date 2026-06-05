import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateSecurityScanPDF = (scan: any, securityLogs: any[]) => {
  const doc = new jsPDF();
  const title = `Relatório de Segurança - ${new Date(scan.started_at).toLocaleDateString()}`;
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(26, 26, 46);
  doc.text('Auditoria de Governança Bíblica', 14, 22);
  
  doc.setFontSize(16);
  doc.text(title, 14, 32);
  
  // Stats
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`ID da Verificação: ${scan.id}`, 14, 42);
  doc.text(`Status: ${scan.status === 'passed' ? 'APROVADO' : 'PENDENTE'}`, 14, 48);
  doc.text(`Pontuação de Conformidade: ${scan.compliance_score}%`, 14, 54);
  doc.text(`Iniciado em: ${new Date(scan.started_at).toLocaleString()}`, 14, 60);

  // Issues Section
  doc.setFontSize(14);
  doc.setTextColor(233, 69, 96);
  doc.text('Inconformidades Detectadas:', 14, 75);
  
  const issues = scan.issues_found || [];
  if (issues.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(46, 204, 113);
    doc.text('Nenhuma inconformidade crítica encontrada.', 14, 85);
  } else {
    (doc as any).autoTable({
      startY: 80,
      head: [['Severidade', 'Categoria', 'Descrição']],
      body: issues.map((i: any) => [
        { content: (i.level === 'high' ? 'ALTA' : (i.level === 'warn' ? 'AVISO' : 'INFO')), styles: { textColor: i.level === 'high' ? [233, 69, 96] : [100] } },
        i.category || 'Segurança',
        i.message || i.description
      ]),
      theme: 'striped',
      headStyles: { fillStyle: [26, 26, 46] }
    });
  }
  
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 95;
  
  // Logs Section
  doc.setFontSize(14);
  doc.setTextColor(26, 26, 46);
  doc.text('Registro de Alterações de Segurança:', 14, finalY);
  
  const relatedLogs = securityLogs.filter(log => log.scan_id === scan.id || (new Date(log.created_at) >= new Date(scan.started_at) && new Date(log.created_at) <= new Date(scan.completed_at || scan.started_at)));
  
  if (relatedLogs.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text('Nenhuma alteração de política registrada neste período.', 14, finalY + 10);
  } else {
    (doc as any).autoTable({
      startY: finalY + 5,
      head: [['Data', 'Ação', 'Resumo']],
      body: relatedLogs.map((l: any) => [
        new Date(l.created_at).toLocaleString(),
        l.action === 'POLICY_CHANGE' ? 'Mudança de Política RLS' : l.action,
        l.summary || 'Alteração técnica detectada'
      ]),
      theme: 'grid',
      headStyles: { fillStyle: [100] }
    });
  }
  
  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Documento institucional gerado para fins de auditoria e controle - Página ${i} de ${pageCount}`, 14, 285);
  }
  
  doc.save(`auditoria-seguranca-${scan.id}.pdf`);
};


