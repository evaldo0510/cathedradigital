/**
 * Gera 1 PDF padronizado por linha do INCIDENTES-TEMPLATE.csv.
 * Inclui interpretação dos campos e resumo do caso de teste (CT-SIG-01/02/03 e bordas).
 *
 * Uso:  bun scripts/generate-incident-pdf.ts [caminho.csv] [pasta_saida]
 * Padrão: docs/evidencias/mp-sandbox/INCIDENTES-TEMPLATE.csv → docs/evidencias/mp-sandbox/pdf/
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';

const CSV_PATH = process.argv[2] ?? 'docs/evidencias/mp-sandbox/INCIDENTES-TEMPLATE.csv';
const OUT_DIR = process.argv[3] ?? 'docs/evidencias/mp-sandbox/pdf';

type Row = Record<string, string>;

const CASE_SUMMARY: Record<string, { title: string; expected: string; interpret: string }> = {
  'CT-SIG-01': {
    title: 'CT-SIG-01 — Assinatura válida (fluxo feliz)',
    expected: 'status_http ∈ {200,202}; assinatura_hmac_valida=sim; janela_timestamp_ok=sim.',
    interpret: 'Confirma que o handler aceita webhooks legítimos do sandbox MP. Falha aqui = regressão de verificação.',
  },
  'CT-SIG-02': {
    title: 'CT-SIG-02 — Assinatura inválida',
    expected: 'status_http=401; assinatura_hmac_valida=não; causa_provavel=signature_invalid.',
    interpret: 'Handler deve rejeitar payload adulterado. Sucesso (2xx) aqui = vulnerabilidade.',
  },
  'CT-SIG-03': {
    title: 'CT-SIG-03 — Timestamp fora da janela',
    expected: 'status_http=403; janela_timestamp_ok=não; delta_timestamp_s > janela_configurada_s.',
    interpret: 'Handler deve rejeitar replay antigo/futuro. Verificar drift de relógio antes de reportar bug.',
  },
  'CT-EDGE-HEADER': {
    title: 'Borda — header x-signature ausente',
    expected: 'status_http=400 ou 401; mensagem_erro_log referencia header ausente.',
    interpret: 'Requisição sem cabeçalho deve ser rejeitada antes da verificação HMAC.',
  },
  'CT-EDGE-FORMAT': {
    title: 'Borda — assinatura com formato inválido',
    expected: 'status_http=400; mensagem menciona parsing/format da assinatura.',
    interpret: 'Distingue entre "assinatura malformada" (400) e "assinatura inválida" (401).',
  },
  'CT-EDGE-SIZE': {
    title: 'Borda — payload com tamanho inesperado',
    expected: 'status_http=413 (payload gigante) ou processamento normal (payload minúsculo).',
    interpret: 'Confirma limites do handler; alteração de 1 byte deve invalidar assinatura (retornar a CT-SIG-02).',
  },
};

const FIELD_INTERPRET: Record<string, string> = {
  status_http: '2xx = aceito; 401 = HMAC inválida; 403 = janela de timestamp; 400 = requisição malformada; 413 = payload grande.',
  delta_timestamp_s: 'Diferença entre timestamp do evento e now(). |Δ| > janela_configurada_s deve resultar em 403.',
  assinatura_hmac_valida: 'sim = HMAC bateu com secret sandbox; não = adulteração ou secret errado; n-a = teste não avalia HMAC.',
  janela_timestamp_ok: 'sim = |Δ| ≤ janela; não = fora da janela (verificar drift antes de bug); n-a = teste não avalia janela.',
  hash_sha256: 'SHA-256 do payload mascarado em disco. Use scripts/verify-incident-hash.ts para reconferir.',
  arquivo_payload_mascarado: 'Caminho do JSON já mascarado (payer.email, cards, tokens removidos). Nunca commitar payload cru.',
  causa_provavel: 'Classificação operacional (não confundir com bug real): fluxo_normal_ok, signature_invalid, timestamp_out_of_window, etc.',
  linha_webhook_logs: 'Referência à linha em public.webhook_logs para correlação com telemetria do banco.',
};

function pdfFor(r: Row): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  let y = 48;

  doc.setFillColor(11, 31, 58); doc.rect(0, 0, W, 72, 'F');
  doc.setTextColor(200, 169, 106); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text('Relatorio de Incidente — Sandbox MP', 40, 40);
  doc.setTextColor(220); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('S0 congelada · Ferramenta de apoio a validacao HMAC', 40, 58);
  y = 96;

  doc.setTextColor(20); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text(`${r.incident_id || '(sem id)'} · ${r.caso_teste || '—'}`, 40, y); y += 18;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(80);
  doc.text(`Capturado: ${r.data_hora_captura_brt || '—'}   Executor: ${r.executor || '—'}   Ambiente: ${r.ambiente || '—'}`, 40, y); y += 20;

  const caso = CASE_SUMMARY[r.caso_teste];
  if (caso) {
    doc.setFillColor(245, 240, 225); doc.rect(32, y - 12, W - 64, 74, 'F');
    doc.setTextColor(11, 31, 58); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text(caso.title, 40, y + 4); y += 18;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(40);
    doc.text(doc.splitTextToSize(`Esperado: ${caso.expected}`, W - 80), 40, y); y += 20;
    doc.text(doc.splitTextToSize(`Interpretacao: ${caso.interpret}`, W - 80), 40, y); y += 28;
  }

  const rows: Array<[string, string]> = [
    ['status_http', r.status_http || '—'],
    ['delta_timestamp_s', `${r.delta_timestamp_s || '—'} (janela ${r.janela_configurada_s || '—'}s)`],
    ['assinatura_hmac_valida', r.assinatura_hmac_valida || '—'],
    ['janela_timestamp_ok', r.janela_timestamp_ok || '—'],
    ['edge_function_receptora', r.edge_function_receptora || '—'],
    ['tipo_evento', r.tipo_evento || '—'],
    ['external_reference', r.external_reference || '—'],
    ['payment_id', r.payment_id || '—'],
    ['causa_provavel', r.causa_provavel || '—'],
    ['mensagem_erro_log', r.mensagem_erro_log || '—'],
    ['idempotencia_respeitada', r.idempotencia_respeitada || '—'],
    ['latencia_ms', r.latencia_ms || '—'],
  ];
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(11, 31, 58);
  doc.text('Campos do incidente', 40, y); y += 14;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30);
  for (const [k, v] of rows) {
    if (y > 760) { doc.addPage(); y = 48; }
    doc.setFont('helvetica', 'bold'); doc.text(k, 40, y);
    doc.setFont('helvetica', 'normal');
    const wrapped = doc.splitTextToSize(String(v), W - 220);
    doc.text(wrapped, 200, y);
    y += Math.max(14, wrapped.length * 12);
    const hint = FIELD_INTERPRET[k];
    if (hint) {
      doc.setTextColor(110); doc.setFontSize(8);
      const h = doc.splitTextToSize(hint, W - 220);
      doc.text(h, 200, y); y += h.length * 10 + 4;
      doc.setTextColor(30); doc.setFontSize(9);
    }
  }

  if (y > 700) { doc.addPage(); y = 48; }
  y += 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(11, 31, 58);
  doc.text('Evidencias', 40, y); y += 14;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30);
  const ev: Array<[string, string]> = [
    ['arquivo_payload_mascarado', r.arquivo_payload_mascarado || '—'],
    ['hash_sha256', r.hash_sha256 || '—'],
    ['header_x_signature_mascarado', r.header_x_signature_mascarado || '—'],
    ['header_x_request_id', r.header_x_request_id || '—'],
    ['linha_webhook_logs', r.linha_webhook_logs || '—'],
    ['mascara_aplicada_em', r.mascara_aplicada_em || '—'],
    ['evidencias_relacionadas', r.evidencias_relacionadas || '—'],
    ['adr_acompanhamento', r.adr_acompanhamento || '—'],
  ];
  for (const [k, v] of ev) {
    if (y > 780) { doc.addPage(); y = 48; }
    doc.setFont('helvetica', 'bold'); doc.text(k, 40, y);
    doc.setFont('helvetica', 'normal');
    const wrapped = doc.splitTextToSize(String(v), W - 220);
    doc.text(wrapped, 200, y);
    y += Math.max(14, wrapped.length * 12);
  }

  if (r.observacoes) {
    if (y > 720) { doc.addPage(); y = 48; }
    y += 10;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(11, 31, 58);
    doc.text('Observacoes', 40, y); y += 14;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(60);
    const w = doc.splitTextToSize(r.observacoes, W - 80);
    doc.text(w, 40, y);
  }

  const pages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(150); doc.setFont('helvetica', 'normal');
    doc.text(`Documento de apoio S0 — sandbox MP · Pagina ${i}/${pages}`, 40, 820);
  }
  return doc;
}

const raw = readFileSync(resolve(CSV_PATH), 'utf-8');
const parsed = Papa.parse<Row>(raw, { header: true, skipEmptyLines: true });
mkdirSync(resolve(OUT_DIR), { recursive: true });

let n = 0;
for (const r of parsed.data) {
  const id = (r.incident_id || `row-${++n}`).replace(/[^A-Za-z0-9_-]/g, '_');
  const doc = pdfFor(r);
  const buf = Buffer.from(doc.output('arraybuffer'));
  const out = join(OUT_DIR, `${id}.pdf`);
  writeFileSync(out, buf);
  console.log(`✔ ${out}`);
  n++;
}
console.log(`Gerados ${parsed.data.length} PDF(s) em ${OUT_DIR}`);
