import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Register service worker with better update strategy
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Auto-update immediately to prevent stale content
    console.log('PWA: New version available, updating...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('PWA: App ready to work offline');
  },
  onRegisteredSW(swUrl, r) {
    console.log('Service Worker registered:', swUrl);
    // Check for updates more frequently - every 30 seconds
    if (r) {
      setInterval(() => {
        r.update().catch(err => {
          console.log('SW update check failed:', err);
        });
      }, 30 * 1000);
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
      // Keep only workbox caches, clear everything else
      if (!name.startsWith('workbox-')) {
        caches.delete(name);
        console.log('Cleared cache:', name);
      }
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
