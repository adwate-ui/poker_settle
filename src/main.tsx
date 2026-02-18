import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Initialize Sentry for error tracking in production
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    // Only send 10% of transactions for performance monitoring
    tracesSampleRate: 0.1,
    // Don't send PII
    beforeSend(event) {
      // Remove sensitive data from events
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
      return event;
    },
  });
}

// Add network status monitoring
window.addEventListener('online', () => {
  // Network recovered
});

window.addEventListener('offline', () => {
  console.warn('Network: Offline - Some features may not work');
});

// Register service worker with network-first strategy
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Auto-update immediately to prevent stale content
    updateSW(true);
  },
  onOfflineReady() {
    // Offline mode is intentionally limited - log but don't advertise
  },
  onRegisteredSW(swUrl, r) {
    // Check for updates every 3 minutes
    if (r) {
      setInterval(() => {
        // Only check for updates when online
        if (navigator.onLine) {
          r.update().catch(() => {
            // Silent fail - SW update checks are non-critical
          });
        }
      }, 3 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.error('SW registration error', error);
  },
});

// Clear old caches more aggressively
if ('caches' in window) {
  caches.keys().then((names) => {
    names.forEach((name) => {
      // Keep only essential workbox precache, clear all runtime caches
      if (!name.startsWith('workbox-precache')) {
        caches.delete(name);
      }
    });
  });
}

// Prevent service worker from serving stale data
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      // Force reload when cache is updated
      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
