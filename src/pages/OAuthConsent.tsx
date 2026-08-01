import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";

// Rota /.lovable/oauth/consent — tela de consentimento OAuth 2.1 para clientes MCP
// externos (ChatGPT, Claude, Cursor, etc.) autorizarem acesso à conta Cathedra.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

function oauth(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Requisição inválida: authorization_id ausente.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message ?? "Não foi possível carregar esta autorização.");
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        if (active) setError(e?.message ?? String(e));
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { data, error } = approve
        ? await oauth().approveAuthorization(authorizationId)
        : await oauth().denyAuthorization(authorizationId);
      if (error) {
        setBusy(false);
        setError(error.message ?? "Falha ao registrar decisão.");
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        setError("Servidor de autorização não retornou URL de redirecionamento.");
        return;
      }
      window.location.href = target;
    } catch (e: any) {
      setBusy(false);
      setError(e?.message ?? String(e));
    }
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "um aplicativo";
  const scopes: string[] = details?.requested_scopes ?? details?.scopes ?? [];

  return (
    <section className="cathedra-noir min-h-screen w-full flex items-center justify-center px-6 py-16">
      <Helmet>
        <title>Autorizar acesso · Cathedra</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="w-full max-w-md rounded-2xl border border-[var(--noir-line)] bg-black/30 backdrop-blur p-8">
        <h1 className="text-2xl font-serif text-[var(--noir-text)] mb-2">
          Conectar {clientName} à sua conta
        </h1>
        <p className="text-sm text-[var(--noir-text-muted)] mb-6">
          Este cliente poderá usar as ferramentas da Cathedra como você enquanto estiver conectado.
          As permissões e políticas do backend continuam válidas.
        </p>

        {error && (
          <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 mb-4">
            {error}
          </div>
        )}

        {!details && !error && (
          <p className="text-sm text-[var(--noir-text-muted)]">Carregando autorização…</p>
        )}

        {details && (
          <>
            {details.client?.redirect_uri && (
              <div className="text-xs text-[var(--noir-text-muted)] mb-4 break-all">
                Redirect: <code>{details.client.redirect_uri}</code>
              </div>
            )}
            {scopes.length > 0 && (
              <ul className="text-sm text-[var(--noir-text)] mb-6 space-y-1">
                {scopes.map((s) => (
                  <li key={s}>• {s}</li>
                ))}
              </ul>
            )}
            <div className="flex gap-3">
              <button
                disabled={busy}
                onClick={() => decide(true)}
                className="flex-1 rounded bg-[var(--gold)] text-black py-2 font-medium disabled:opacity-50"
              >
                Aprovar
              </button>
              <button
                disabled={busy}
                onClick={() => decide(false)}
                className="flex-1 rounded border border-[var(--noir-line-strong)] text-[var(--noir-text)] py-2 disabled:opacity-50"
              >
                Recusar
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
