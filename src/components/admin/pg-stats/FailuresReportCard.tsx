import { useCallback, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Download, FileText, Play } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ChannelFilter = 'all' | 'webhook' | 'slack';
type StatusFilter = 'all' | 'pending' | 'in_flight' | 'succeeded' | 'failed';

interface ReportRow {
  channel: 'webhook' | 'slack';
  status: 'pending' | 'in_flight' | 'succeeded' | 'failed';
  count: number;
  avg_attempts: number | null;
  max_attempts_seen: number | null;
  first_seen: string | null;
  last_seen: string | null;
}
interface FailRateRow {
  channel: 'webhook' | 'slack';
  failed: number;
  succeeded: number;
  total: number;
  fail_rate: number | null;
}
interface Report {
  generated_at: string;
  filters: { from: string; to: string; channel: string | null; status: string | null };
  totals: { total: number; failed: number; succeeded: number; pending: number; in_flight: number };
  fail_rate_by_channel: FailRateRow[];
  rows: ReportRow[];
}

const STATUS_LABEL: Record<ReportRow['status'], string> = {
  pending: 'Pendente',
  in_flight: 'Em voo',
  succeeded: 'Sucesso',
  failed: 'Falhou',
};

function toIsoStart(d: string): string {
  // d is yyyy-mm-dd (date input)
  return new Date(`${d}T00:00:00`).toISOString();
}
function toIsoEnd(d: string): string {
  return new Date(`${d}T23:59:59.999`).toISOString();
}
function todayIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
function fmtDt(dt: string | null): string {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleString('pt-BR'); } catch { return dt; }
}
function downloadBlob(name: string, data: string, mime: string) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function FailuresReportCard() {
  const [from, setFrom] = useState<string>(todayIso(-7));
  const [to, setTo] = useState<string>(todayIso(0));
  const [channel, setChannel] = useState<ChannelFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('failed');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  const canRun = useMemo(() => {
    if (!from || !to) return false;
    return new Date(from) <= new Date(to);
  }, [from, to]);

  const run = useCallback(async () => {
    if (!canRun) {
      toast.error('Faixa de datas inválida');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc(
        'admin_notif_failures_report' as never,
        {
          p_from: toIsoStart(from),
          p_to: toIsoEnd(to),
          p_channel: channel === 'all' ? null : channel,
          p_status: status === 'all' ? null : status,
        } as never,
      );
      if (error) throw error;
      setReport(data as unknown as Report);
    } catch (e) {
      toast.error('Falha ao gerar relatório', { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, [canRun, from, to, channel, status]);

  const downloadJson = useCallback(() => {
    if (!report) return;
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    downloadBlob(
      `pg-stat-notif-report-${ts}.json`,
      JSON.stringify(report, null, 2),
      'application/json',
    );
  }, [report]);

  const downloadCsv = useCallback(() => {
    if (!report) return;
    const esc = (v: unknown): string => {
      if (v == null) return '';
      const s = String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines: string[] = [];
    const f = report.filters;
    // metadados como comentários (BOM + linhas iniciadas por #)
    lines.push(`# generated_at,${esc(report.generated_at)}`);
    lines.push(`# from,${esc(f.from)}`);
    lines.push(`# to,${esc(f.to)}`);
    lines.push(`# channel,${esc(f.channel ?? 'all')}`);
    lines.push(`# status,${esc(f.status ?? 'all')}`);
    lines.push(`# totals,failed=${report.totals.failed};pending=${report.totals.pending};in_flight=${report.totals.in_flight};succeeded=${report.totals.succeeded};total=${report.totals.total}`);
    lines.push('');
    // seção 1: taxa de falha por canal
    lines.push('section,channel,failed,succeeded,total,fail_rate_pct');
    for (const r of report.fail_rate_by_channel) {
      lines.push([
        'fail_rate_by_channel',
        esc(r.channel), esc(r.failed), esc(r.succeeded), esc(r.total),
        r.fail_rate == null ? '' : esc(r.fail_rate.toFixed(2)),
      ].join(','));
    }
    lines.push('');
    // seção 2: agregado por canal e status
    lines.push('section,channel,status,count,avg_attempts,max_attempts_seen,first_seen,last_seen');
    for (const r of report.rows) {
      lines.push([
        'aggregate',
        esc(r.channel), esc(r.status), esc(r.count),
        r.avg_attempts == null ? '' : esc(r.avg_attempts),
        r.max_attempts_seen == null ? '' : esc(r.max_attempts_seen),
        esc(r.first_seen), esc(r.last_seen),
      ].join(','));
    }
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    downloadBlob(
      `pg-stat-notif-report-${ts}.csv`,
      '\uFEFF' + lines.join('\r\n'),
      'text/csv;charset=utf-8',
    );
  }, [report]);


  const downloadPdf = useCallback(() => {
    if (!report) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text('Relatório de falhas de notificações', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100);
    const f = report.filters;
    doc.text(
      `Período: ${new Date(f.from).toLocaleString('pt-BR')} → ${new Date(f.to).toLocaleString('pt-BR')}`,
      14, 26,
    );
    doc.text(`Canal: ${f.channel ?? 'todos'}   Status: ${f.status ?? 'todos'}`, 14, 32);
    doc.text(`Gerado em: ${new Date(report.generated_at).toLocaleString('pt-BR')}`, 14, 38);

    // Totals block
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text('Totais', 14, 50);
    autoTable(doc, {
      startY: 53,
      head: [['Falhou', 'Pendente', 'Em voo', 'Sucesso', 'Total']],
      body: [[
        String(report.totals.failed),
        String(report.totals.pending),
        String(report.totals.in_flight),
        String(report.totals.succeeded),
        String(report.totals.total),
      ]],
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [11, 31, 58] },
    });

    let y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 70;

    // Fail rate per channel
    doc.setFontSize(11);
    doc.text('Taxa de falha por canal', 14, y + 10);
    autoTable(doc, {
      startY: y + 13,
      head: [['Canal', 'Falhou', 'Sucesso', 'Total', 'Taxa de falha (%)']],
      body: report.fail_rate_by_channel.map(r => [
        r.channel,
        String(r.failed),
        String(r.succeeded),
        String(r.total),
        r.fail_rate == null ? '—' : r.fail_rate.toFixed(2),
      ]),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [11, 31, 58] },
    });

    y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 40;

    // Aggregated rows
    doc.setFontSize(11);
    doc.text('Agregado por canal e status', 14, y + 10);
    autoTable(doc, {
      startY: y + 13,
      head: [['Canal', 'Status', 'Contagem', 'Média tent.', 'Máx tent.', 'Primeira', 'Última']],
      body: report.rows.map(r => [
        r.channel,
        STATUS_LABEL[r.status],
        String(r.count),
        r.avg_attempts == null ? '—' : String(r.avg_attempts),
        r.max_attempts_seen == null ? '—' : String(r.max_attempts_seen),
        fmtDt(r.first_seen),
        fmtDt(r.last_seen),
      ]),
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [11, 31, 58] },
    });

    // Footer
    const pages = (doc as unknown as { internal: { getNumberOfPages: () => number } })
      .internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Cathedra Digital · pg_stat_pending_notifications · página ${i}/${pages}`,
        pageW / 2, 290, { align: 'center' },
      );
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    doc.save(`pg-stat-notif-report-${ts}.pdf`);
  }, [report]);

  const setPreset = (days: number) => {
    setFrom(todayIso(-days));
    setTo(todayIso(0));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Relatório de falhas — JSON / CSV / PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label htmlFor="rep-from" className="text-xs">De</Label>
            <Input
              id="rep-from"
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <Label htmlFor="rep-to" className="text-xs">Até</Label>
            <Input
              id="rep-to"
              type="date"
              value={to}
              min={from}
              max={todayIso(0)}
              onChange={(e) => setTo(e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Canal</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as ChannelFilter)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="slack">Slack</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_flight">Em voo</SelectItem>
                <SelectItem value="succeeded">Sucesso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Atalhos:</span>
          <Button variant="ghost" size="sm" className="h-7" onClick={() => setPreset(1)}>24 h</Button>
          <Button variant="ghost" size="sm" className="h-7" onClick={() => setPreset(7)}>7 d</Button>
          <Button variant="ghost" size="sm" className="h-7" onClick={() => setPreset(30)}>30 d</Button>
          <Button variant="ghost" size="sm" className="h-7" onClick={() => setPreset(90)}>90 d</Button>

          <div className="ml-auto flex gap-2">
            <Button size="sm" onClick={run} disabled={!canRun || loading}>
              <Play className={`h-4 w-4 mr-1 ${loading ? 'animate-pulse' : ''}`} />
              Gerar
            </Button>
            <Button size="sm" variant="secondary" onClick={downloadJson} disabled={!report}>
              <Download className="h-4 w-4 mr-1" /> JSON
            </Button>
            <Button size="sm" variant="secondary" onClick={downloadPdf} disabled={!report}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
          </div>
        </div>

        {report && (
          <>
            <div className="flex flex-wrap gap-3 text-xs pt-2 border-t border-border">
              <Badge variant="destructive">Falhou: {report.totals.failed}</Badge>
              <Badge variant="outline">Pendente: {report.totals.pending}</Badge>
              <Badge variant="default">Em voo: {report.totals.in_flight}</Badge>
              <Badge variant="secondary">Sucesso: {report.totals.succeeded}</Badge>
              <Badge variant="outline">Total: {report.totals.total}</Badge>
            </div>

            {report.fail_rate_by_channel.length > 0 && (
              <div className="overflow-x-auto">
                <p className="text-xs font-medium text-muted-foreground mb-1">Taxa de falha por canal</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canal</TableHead>
                      <TableHead className="text-right">Falhou</TableHead>
                      <TableHead className="text-right">Sucesso</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Taxa (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.fail_rate_by_channel.map((r) => (
                      <TableRow key={r.channel}>
                        <TableCell className="capitalize">{r.channel}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.failed}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.succeeded}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.total}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.fail_rate == null ? '—' : r.fail_rate.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="overflow-x-auto">
              <p className="text-xs font-medium text-muted-foreground mb-1">Agregado por canal e status</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Contagem</TableHead>
                    <TableHead className="text-right">Média tent.</TableHead>
                    <TableHead className="text-right">Máx tent.</TableHead>
                    <TableHead>Primeira</TableHead>
                    <TableHead>Última</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        Nenhum registro no período selecionado.
                      </TableCell>
                    </TableRow>
                  )}
                  {report.rows.map((r, i) => (
                    <TableRow key={`${r.channel}-${r.status}-${i}`}>
                      <TableCell className="capitalize">{r.channel}</TableCell>
                      <TableCell>{STATUS_LABEL[r.status]}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.avg_attempts == null ? '—' : r.avg_attempts}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.max_attempts_seen == null ? '—' : r.max_attempts_seen}
                      </TableCell>
                      <TableCell className="text-xs">{fmtDt(r.first_seen)}</TableCell>
                      <TableCell className="text-xs">{fmtDt(r.last_seen)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {!report && (
          <p className="text-xs text-muted-foreground">
            Selecione a faixa de datas e clique em <strong>Gerar</strong> para produzir o relatório.
            O download em JSON e PDF fica disponível após a geração.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
