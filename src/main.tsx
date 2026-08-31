import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/typography.css";
import { MaintenanceGate } from "./components/MaintenanceGate";
import PreviewRecoveryControls, { hardRestorePreview } from "./components/PreviewRecoveryControls";

import { prefetchCoreModules } from "./lib/prefetch";
import { initLiturgicalPrefetchGuard } from "./lib/litcalPrefetchGuard";
import { registerSW } from 'virtual:pwa-register';
import { initSentry } from "./lib/sentry";
import { initRuntimeErrorLogger } from "./lib/runtimeErrorLogger";
import { initActionLogger } from "./lib/observability/logAction";
import { reportWebVitals } from "./lib/vitals/report";
// Auto-registra todos os ReaderAutoNexus (Bíblia, CIC, Magistério, Santo,
// Liturgia, Oração, Glossário, Jornada) no ReaderAutoNexusRegistry.
import "./core/knowledge/adapters/registry";
// Registra o LiturgyProvider oficial (fonte única de leituras do dia).
import { registerLiturgyProvider } from "./core/liturgy/LiturgyProvider";
import { RailwayInAdiutoriumProvider } from "./core/liturgy/providers/RailwayInAdiutoriumProvider";

registerLiturgyProvider(new RailwayInAdiutoriumProvider());

initLiturgicalPrefetchGuard();
initSentry();
initRuntimeErrorLogger();
initActionLogger();
reportWebVitals();

if (import.meta.env.DEV) {
  const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
  const isPreview =
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app") ||
    window.location.hostname.includes("id-preview--");
  const forceEnable = new URLSearchParams(window.location.search).has("inspector");
  if (forceEnable || (!inIframe && !isPreview)) {
    import("./lib/devInspector").then((m) => m.initDevInspector());
  }
}
import { telemetry } from "./utils/navigation-telemetry";

// Iniciar telemetria
telemetry.log('App Initialized', 'info');


// Guard: unregister service workers in preview/iframe contexts
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
} else {
  // Register combined SW (push + offline cache) with vite-plugin-pwa
  registerSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      console.log('SW registered at:', swUrl);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    }
  });
}

// Auto-recuperação: se um asset antigo em cache quebrar a inicialização
// (tela branca), limpa service workers/caches e recarrega uma única vez.
window.addEventListener("error", (event) => {
  const msg = String((event as ErrorEvent).message || "");
  const isChunkFailure =
    /Failed to fetch dynamically imported module|Importing a module script failed|Unexpected token '<'|reading 'forwardRef'/.test(msg);
  if (!isChunkFailure) return;
  try {
    if (sessionStorage.getItem("cathedra:self-heal") === "1") return;
    sessionStorage.setItem("cathedra:self-heal", "1");
  } catch {}
  void hardRestorePreview();
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MaintenanceGate>
      <App />
      <PreviewRecoveryControls />
    </MaintenanceGate>
  </React.StrictMode>
);


// Prefetch core modules after initial render
prefetchCoreModules();
