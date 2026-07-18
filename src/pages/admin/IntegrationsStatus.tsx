import { Helmet } from "react-helmet-async";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type Status = "connected" | "disconnected" | "partial";

interface Integration {
  name: string;
  category: string;
  status: Status;
  description: string;
  howTo: string;
  docsUrl?: string;
}

const integrations: Integration[] = [
  {
    name: "Lovable Cloud",
    category: "Infraestrutura",
    status: "connected",
    description: "Banco de dados, autenticação, storage e edge functions.",
    howTo: "Ativo por padrão neste projeto. Acesse pelo botão 'View Backend'.",
  },
  {
    name: "Lovable AI Gateway",
    category: "IA",
    status: "connected",
    description: "Modelos de IA (chat, embeddings, imagens) via LOVABLE_API_KEY.",
    howTo: "Disponível automaticamente nas edge functions. Secret gerenciado.",
  },
  {
    name: "Mercado Pago",
    category: "Pagamentos",
    status: "connected",
    description: "Checkout Pro para assinaturas PRO e doações.",
    howTo: "Secret MERCADO_PAGO_ACCESS_TOKEN configurado. Verifique o webhook em Connectors.",
    docsUrl: "https://www.mercadopago.com.br/developers",
  },
  {
    name: "Google API Key",
    category: "Google",
    status: "connected",
    description: "Chave genérica do Google (Maps/YouTube/APIs públicas).",
    howTo: "Secret GOOGLE_API_KEY configurado. Confirme quais APIs estão habilitadas no Google Cloud Console.",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
  },
  {
    name: "Firecrawl",
    category: "Scraping",
    status: "partial",
    description: "Crawling e extração de páginas web.",
    howTo: "Existe no workspace mas NÃO vinculado a este projeto. Peça 'vincular Firecrawl' para ativar.",
  },
  {
    name: "Google Search Console",
    category: "SEO",
    status: "disconnected",
    description: "Cliques, impressões, indexação e verificação de propriedade.",
    howTo: "Aprove a conexão OAuth em Connectors → Google Search Console.",
    docsUrl: "https://search.google.com/search-console",
  },
  {
    name: "Semrush",
    category: "SEO",
    status: "disconnected",
    description: "Palavras-chave, backlinks e ranking competitivo.",
    howTo: "Conecte via Connectors → Semrush (requer conta paga).",
    docsUrl: "https://www.semrush.com",
  },
  {
    name: "Google Analytics",
    category: "Analytics",
    status: "disconnected",
    description: "Tráfego, sessões e comportamento de usuários.",
    howTo: "Não configurado. Conecte via Connectors → Google Analytics.",
  },
  {
    name: "Stripe",
    category: "Pagamentos",
    status: "disconnected",
    description: "Alternativa internacional para pagamentos recorrentes.",
    howTo: "Não configurado. Peça 'ativar Stripe' se necessário.",
  },
  {
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

export default function IntegrationsStatus() {
  const grouped = integrations.reduce<Record<string, Integration[]>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

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
                      {item.docsUrl && (
                        <Button variant="outline" size="sm" asChild className="self-start">
                          <a href={item.docsUrl} target="_blank" rel="noreferrer">
                            Documentação <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>

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
