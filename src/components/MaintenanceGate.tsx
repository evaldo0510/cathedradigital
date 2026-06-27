import React from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";

/**
 * Gate de manutenção SEO-safe.
 *
 * Ativação (qualquer um basta):
 *  1. Build-time:  VITE_MAINTENANCE_MODE=1  (preferido para janelas planejadas)
 *  2. Runtime:     localStorage["cathedra:maintenance"] = "1"   (admin pode alternar
 *                  sem novo deploy via console; útil para incidentes)
 *  3. Query flag:  ?maintenance=1   (apenas para testar a tela)
 *
 * Bypass para admins inspecionarem o app durante manutenção:
 *   localStorage["cathedra:maintenance:bypass"] = "1"
 *
 * Limitação conhecida: a hospedagem estática do Lovable não permite emitir
 * um HTTP 503 nem header Retry-After reais. Para crawlers que executam JS
 * (Googlebot moderno), injetamos `<meta name="robots" content="noindex,
 * nofollow">` e `<meta http-equiv="Retry-After">` — Google respeita ambos.
 * Para crawlers que NÃO executam JS, mantenha o `public/503.html` como
 * página estática para a qual você pode apontar a raiz manualmente em
 * janelas longas de manutenção.
 */
function readFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem("cathedra:maintenance:bypass") === "1") return false;
  } catch {}
  if (import.meta.env.VITE_MAINTENANCE_MODE === "1" || import.meta.env.VITE_MAINTENANCE_MODE === "true") {
    return true;
  }
  try {
    if (window.localStorage.getItem("cathedra:maintenance") === "1") return true;
  } catch {}
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("maintenance") === "1") return true;
  } catch {}
  return false;
}

/** Retry-After em segundos (1 hora padrão). */
const RETRY_AFTER_SECONDS = 3600;

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const active = readFlag();
  if (!active) return <>{children}</>;

  return (
    <HelmetProvider>
      <Helmet>
        <title>Em manutenção — Cathedra Digital</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <meta httpEquiv="Retry-After" content={String(RETRY_AFTER_SECONDS)} />
        <meta
          name="description"
          content="A Cathedra Digital está em manutenção programada. Volte em instantes."
        />
        <link rel="canonical" href="https://www.cathedradigital.com.br/" />
      </Helmet>
      <main
        role="main"
        aria-labelledby="maintenance-title"
        className="min-h-screen flex items-center justify-center bg-background text-foreground px-6"
      >
        <div className="max-w-md text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Status 503</p>
          <h1 id="maintenance-title" className="text-2xl font-serif text-primary">
            Cathedra em manutenção
          </h1>
          <p className="text-sm text-muted-foreground">
            Estamos realizando uma manutenção breve. Em instantes, o silêncio dará lugar
            à leitura. Obrigado pela paciência.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Tente novamente em alguns minutos.
          </p>
        </div>
      </main>
    </HelmetProvider>
  );
}

export default MaintenanceGate;
