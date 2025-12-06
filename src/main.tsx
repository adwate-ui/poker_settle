import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Register service worker - auto update without prompts to prevent stale content
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Auto-update immediately without asking user
    updateSW(true);
  },
  onOfflineReady() {
    console.log('PWA: Ready for install');
  },
  onRegisteredSW(swUrl, r) {
    console.log('Service Worker registered:', swUrl);
    // Check for updates every 5 minutes
    if (r) {
      setInterval(() => {
        r.update();
      }, 5 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.error('SW registration error', error);
  },
});

// Clear all old caches on startup to prevent stale data
if ('caches' in window) {
  caches.keys().then((names) => {
    names.forEach((name) => {
      // Clear API and game data caches
      if (name.includes('api-cache') || name.includes('game-data')) {
        caches.delete(name);
        console.log('Cleared stale cache:', name);
      }
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
