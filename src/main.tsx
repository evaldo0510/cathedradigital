import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { prefetchCoreModules } from "./lib/prefetch";
import { registerSW } from 'virtual:pwa-register';
const initTelemetry = () => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    import("./lib/sentry").then(({ initSentry }) => initSentry());
  }
};


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

// Defer non-critical work until after first paint
const scheduleIdle = (task: () => void) => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(task, { timeout: 5000 });
  } else {
    window.setTimeout(task, 2500);
  }
};

scheduleIdle(initTelemetry);
scheduleIdle(prefetchCoreModules);
