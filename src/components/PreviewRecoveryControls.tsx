import React from "react";

/**
 * Controles de recuperação do preview.
 *
 * Aparecem no modo de visualização (iframe/preview do Lovable) ou em qualquer
 * ambiente com `?recover=1` na URL.
 *
 *  - Restaurar preview: remove service workers e limpa todos os caches antes
 *    de recarregar. Resolve tela branca causada por assets antigos em cache.
 *  - Forçar recarregamento: recarrega ignorando o cache HTTP.
 */

function isPreviewContext(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).has("recover")) return true;
  } catch {}
  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host.includes("lovable.app");
  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }
  return isPreviewHost || inIframe;
}

export async function hardRestorePreview() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
  } catch {}
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {}
  const url = new URL(window.location.href);
  url.searchParams.set("_r", String(Date.now()));
  window.location.replace(url.toString());
}

export const PreviewRecoveryControls: React.FC = () => {
  const [visible] = React.useState(isPreviewContext);
  const [busy, setBusy] = React.useState(false);

  if (!visible) return null;

  return (
    <div
      role="group"
      aria-label="Recuperação do preview"
      className="fixed bottom-3 left-3 z-[300] flex gap-2"
    >
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void hardRestorePreview();
        }}
        className="min-h-[40px] rounded-full border border-border bg-background/90 px-3 text-xs font-medium text-foreground shadow-md backdrop-blur transition-colors hover:bg-muted disabled:opacity-60"
      >
        {busy ? "Restaurando…" : "Restaurar preview"}
      </button>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="min-h-[40px] rounded-full border border-border bg-background/90 px-3 text-xs font-medium text-foreground shadow-md backdrop-blur transition-colors hover:bg-muted"
      >
        Forçar recarregamento
      </button>
    </div>
  );
};

export default PreviewRecoveryControls;
