import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateSecurityScanPDF = (scan: any, securityLogs: any[]) => {
  const doc = new jsPDF();
  const title = `Security Scan Report - ${new Date(scan.started_at).toLocaleDateString()}`;
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(12);
  doc.text(`Status: ${scan.status.toUpperCase()}`, 14, 32);
  doc.text(`Compliance Score: ${scan.compliance_score}%`, 14, 40);
  doc.text(`Run ID: ${scan.id}`, 14, 48);
  
  doc.setFontSize(14);
  doc.text('Issues Found:', 14, 60);
  
  const issues = scan.issues_found || [];
  if (issues.length === 0) {
    doc.setFontSize(11);
    doc.text('No high-severity issues found.', 14, 70);
  } else {
    (doc as any).autoTable({
      startY: 65,
      head: [['Severity', 'Description', 'Category']],
      body: issues.map((i: any) => [i.level || 'Unknown', i.message || i.description, i.category || 'Security']),
    });
  }
  
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 80;
  
  doc.setFontSize(14);
  doc.text('Related Security Policy Changes:', 14, finalY);
  
  const relatedLogs = securityLogs.filter(log => log.scan_id === scan.id);
  if (relatedLogs.length === 0) {
    doc.setFontSize(11);
    doc.text('No policy changes recorded for this scan.', 14, finalY + 10);
  } else {
    (doc as any).autoTable({
      startY: finalY + 5,
      head: [['Action', 'Summary', 'Created At']],
      body: relatedLogs.map((l: any) => [l.action, l.summary || '-', new Date(l.created_at).toLocaleString()]),
    });
  }
  
  doc.save(`security-scan-${scan.id}.pdf`);
};
