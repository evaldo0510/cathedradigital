import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { prefetchCoreModules } from "./lib/prefetch";
import { initLiturgicalPrefetchGuard } from "./lib/litcalPrefetchGuard";
import { registerSW } from 'virtual:pwa-register';
import { initSentry } from "./lib/sentry";

initLiturgicalPrefetchGuard();
initSentry();

if (import.meta.env.DEV) {
  import("./lib/devInspector").then((m) => m.initDevInspector());
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

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Prefetch core modules after initial render
prefetchCoreModules();
