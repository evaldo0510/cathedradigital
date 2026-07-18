import { Helmet } from "react-helmet-async";
import { CheckCircle2, XCircle, ExternalLink, Loader2, PlayCircle, History, RefreshCw, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Status = "connected" | "disconnected" | "partial";

interface Integration {
  id: string;
  name: string;
  category: string;
  status: Status;
  description: string;
  howTo: string;
  docsUrl?: string;
}

type TestResult = { ok: boolean; message: string; latencyMs?: number };

const integrations: Integration[] = [
  {
    id: "lovable-cloud",
    name: "Lovable Cloud",
    category: "Infraestrutura",
    status: "connected",
    description: "Banco de dados, autenticação, storage e edge functions.",
    howTo: "Ativo por padrão neste projeto. Acesse pelo botão 'View Backend'.",
  },
  {
    id: "lovable-ai",
    name: "Lovable AI Gateway",
    category: "IA",
    status: "connected",
    description: "Modelos de IA (chat, embeddings, imagens) via LOVABLE_API_KEY.",
    howTo: "Disponível automaticamente nas edge functions. Secret gerenciado.",
  },
  {
    id: "mercado-pago",
    name: "Mercado Pago",
    category: "Pagamentos",
    status: "connected",
    description: "Checkout Pro para assinaturas PRO e doações.",
    howTo: "Secret MERCADO_PAGO_ACCESS_TOKEN configurado. Verifique o webhook em Connectors.",
    docsUrl: "https://www.mercadopago.com.br/developers",
  },
  {
    id: "google-api-key",
    name: "Google API Key",
    category: "Google",
    status: "connected",
    description: "Chave genérica do Google (Maps/YouTube/APIs públicas).",
    howTo: "Secret GOOGLE_API_KEY configurado. Confirme quais APIs estão habilitadas no Google Cloud Console.",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
  },
  {
    id: "firecrawl",
    name: "Firecrawl",
    category: "Scraping",
    status: "partial",
    description: "Crawling e extração de páginas web.",
    howTo: "Existe no workspace mas NÃO vinculado a este projeto. Peça 'vincular Firecrawl' para ativar.",
  },
  {
    id: "google-search-console",
    name: "Google Search Console",
    category: "SEO",
    status: "disconnected",
    description: "Cliques, impressões, indexação e verificação de propriedade.",
    howTo: "Aprove a conexão OAuth em Connectors → Google Search Console.",
    docsUrl: "https://search.google.com/search-console",
  },
  {
    id: "semrush",
    name: "Semrush",
    category: "SEO",
    status: "disconnected",
    description: "Palavras-chave, backlinks e ranking competitivo.",
    howTo: "Conecte via Connectors → Semrush (requer conta paga).",
    docsUrl: "https://www.semrush.com",
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    category: "Analytics",
    status: "disconnected",
    description: "Tráfego, sessões e comportamento de usuários.",
    howTo: "Não configurado. Conecte via Connectors → Google Analytics.",
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Pagamentos",
    status: "disconnected",
    description: "Alternativa internacional para pagamentos recorrentes.",
    howTo: "Não configurado. Peça 'ativar Stripe' se necessário.",
  },
  {
    id: "github",
    name: "GitHub",
    category: "Dev",
    status: "disconnected",
    description: "Sincronização de código com repositório externo.",
    howTo: "Conecte via configurações do projeto Lovable → GitHub.",
  },
];

const statusMeta: Record<Status, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  connected: {
    label: "Conectado",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
  },
  disconnected: {
    label: "Desconectado",
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
    icon: XCircle,
  },
  partial: {
    label: "Parcial",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    icon: XCircle,
  },
};

type HistoryRow = {
  id: string;
  integration_id: string;
  ok: boolean;
  message: string;
  latency_ms: number | null;
  created_at: string;
};

export default function IntegrationsStatus() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Filtros e paginação do histórico
  const [filterIntegration, setFilterIntegration] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "ok" | "fail">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("integration_test_runs")
      .select("id, integration_id, ok, message, latency_ms, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    setHistoryLoading(false);
    if (error) {
      // 403 => usuário não é admin. Silenciar para não poluir.
      if (!/permission|denied|403/i.test(error.message)) {
        toast.error(`Histórico: ${error.message}`);
      }
      return;
    }
    setHistory((data ?? []) as HistoryRow[]);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const runTest = async (id: string) => {
    setLoading((s) => ({ ...s, [id]: true }));
    let result: TestResult;
    try {
      const { data, error } = await supabase.functions.invoke("integrations-test", { body: { id } });
      if (error) throw error;
      result = data as TestResult;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha no teste";
      result = { ok: false, message: msg };
    }
    setResults((s) => ({ ...s, [id]: result }));
    result.ok ? toast.success(`${id}: ${result.message}`) : toast.error(`${id}: ${result.message}`);

    // Persistir no histórico (best-effort; ignora se não for admin)
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (uid) {
        const { error: insErr } = await supabase.from("integration_test_runs").insert({
          integration_id: id,
          ok: result.ok,
          message: result.message.slice(0, 500),
          latency_ms: result.latencyMs ?? null,
          tested_by: uid,
        });
        if (!insErr) {
          loadHistory();
        }
      }
    } catch {
      /* silencioso */
    }

    setLoading((s) => ({ ...s, [id]: false }));
  };

  const grouped = integrations.reduce<Record<string, Integration[]>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  const integrationName = useMemo(
    () => Object.fromEntries(integrations.map((i) => [i.id, i.name])),
    [],
  );

  const filteredHistory = useMemo(() => {
    const fromTs = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : null;
    const toTs = dateTo ? new Date(dateTo + "T23:59:59.999").getTime() : null;
    return history.filter((row) => {
      if (filterIntegration !== "all" && row.integration_id !== filterIntegration) return false;
      if (filterStatus === "ok" && !row.ok) return false;
      if (filterStatus === "fail" && row.ok) return false;
      const ts = new Date(row.created_at).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      return true;
    });
  }, [history, filterIntegration, filterStatus, dateFrom, dateTo]);

  const pageCount = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedHistory = filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filterIntegration, filterStatus, dateFrom, dateTo]);

  const hasFilters = filterIntegration !== "all" || filterStatus !== "all" || dateFrom !== "" || dateTo !== "";
  const clearFilters = () => {
    setFilterIntegration("all");
    setFilterStatus("all");
    setDateFrom("");
    setDateTo("");
  };

  const total = integrations.length;
  const connected = integrations.filter((i) => i.status === "connected").length;
  const disconnected = integrations.filter((i) => i.status === "disconnected").length;
  const partial = integrations.filter((i) => i.status === "partial").length;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Helmet>
        <title>Status das Integrações — Admin</title>
        <meta name="description" content="Visão geral do que está conectado, desconectado e como configurar cada integração do projeto." />
      </Helmet>

      <header className="mb-8">
        <h1 className="text-3xl font-serif font-semibold tracking-tight">Status das Integrações</h1>
        <p className="mt-2 text-muted-foreground">
          Visão geral de todos os conectores, chaves e serviços do projeto.
        </p>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total" value={total} />
        <StatCard label="Conectados" value={connected} tone="emerald" />
        <StatCard label="Desconectados" value={disconnected} tone="red" />
        <StatCard label="Parciais" value={partial} tone="amber" />
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-3 text-lg font-semibold text-muted-foreground uppercase tracking-wide text-sm">
              {category}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((item) => {
                const meta = statusMeta[item.status];
                const Icon = meta.icon;
                return (
                  <Card key={item.name} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <Badge variant="outline" className={meta.className}>
                          <Icon className="mr-1 h-3 w-3" />
                          {meta.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-3">
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <div className="rounded-md bg-muted/50 p-3 text-sm">
                        <p className="font-medium mb-1">Como configurar</p>
                        <p className="text-muted-foreground">{item.howTo}</p>
                      </div>
                      {results[item.id] && (
                        <div
                          className={`rounded-md p-3 text-sm border ${
                            results[item.id].ok
                              ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                              : "bg-red-500/5 border-red-500/30 text-red-700 dark:text-red-400"
                          }`}
                          role="status"
                          aria-live="polite"
                        >
                          <p className="font-medium mb-0.5">
                            {results[item.id].ok ? "✓ Teste OK" : "✗ Falha no teste"}
                            {results[item.id].latencyMs != null && (
                              <span className="ml-2 text-xs opacity-70">{results[item.id].latencyMs}ms</span>
                            )}
                          </p>
                          <p className="opacity-90">{results[item.id].message}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => runTest(item.id)}
                          disabled={loading[item.id]}
                        >
                          {loading[item.id] ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <PlayCircle className="mr-1 h-3 w-3" />
                          )}
                          Testar conexão
                        </Button>
                        {item.docsUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={item.docsUrl} target="_blank" rel="noreferrer">
                              Documentação <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-10" aria-labelledby="history-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="history-heading" className="text-lg font-semibold flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de testes
            <span className="text-xs text-muted-foreground font-normal">
              ({filteredHistory.length}
              {hasFilters ? ` de ${history.length}` : ""})
            </span>
          </h2>
          <Button variant="ghost" size="sm" onClick={loadHistory} disabled={historyLoading}>
            {historyLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
            Atualizar
          </Button>
        </div>

        <Card className="mb-3">
          <CardContent className="p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <Label htmlFor="flt-integration" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Integração
                </Label>
                <Select value={filterIntegration} onValueChange={setFilterIntegration}>
                  <SelectTrigger id="flt-integration" className="mt-1">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {integrations.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="flt-status" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Status
                </Label>
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as "all" | "ok" | "fail")}>
                  <SelectTrigger id="flt-status" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ok">OK</SelectItem>
                    <SelectItem value="fail">Falha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="flt-from" className="text-xs uppercase tracking-wide text-muted-foreground">
                  De
                </Label>
                <Input
                  id="flt-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="flt-to" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Até
                </Label>
                <Input
                  id="flt-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            {hasFilters && (
              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-3 w-3" /> Limpar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {history.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">
                {historyLoading ? "Carregando…" : "Nenhum teste registrado ainda. Clique em \"Testar conexão\" acima."}
              </p>
            ) : filteredHistory.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">
                Nenhum registro para os filtros aplicados.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Data / hora</th>
                      <th className="px-4 py-2 font-medium">Integração</th>
                      <th className="px-4 py-2 font-medium">Resultado</th>
                      <th className="px-4 py-2 font-medium">Latência</th>
                      <th className="px-4 py-2 font-medium">Mensagem / Erro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedHistory.map((row) => (
                      <tr key={row.id} className="border-t border-border/60 align-top">
                        <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                          {new Date(row.created_at).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "medium",
                          })}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap font-medium">
                          {integrationName[row.integration_id] ?? row.integration_id}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant="outline"
                            className={
                              row.ok
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"
                            }
                          >
                            {row.ok ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                            {row.ok ? "OK" : "Falha"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                          {row.latency_ms != null ? `${row.latency_ms}ms` : "—"}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground max-w-md break-words">
                          {row.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {filteredHistory.length > pageSize && (
              <div className="flex items-center justify-between border-t border-border/60 px-4 py-2 text-sm">
                <span className="text-muted-foreground">
                  Página {currentPage} de {pageCount}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-3 w-3" /> Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={currentPage >= pageCount}
                  >
                    Próxima <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

        </Card>
      </section>


      <footer className="mt-10 border-t pt-6 text-sm text-muted-foreground">
        <p>
          Painel relacionado:{" "}
          <Link to="/admin/seo" className="underline underline-offset-4 hover:text-foreground">
            Admin SEO
          </Link>
        </p>
      </footer>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "emerald" | "red" | "amber" }) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "red"
      ? "text-red-600 dark:text-red-400"
      : tone === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
