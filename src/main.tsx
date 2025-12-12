import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Force online mode - monitor network status
let isOnline = navigator.onLine;

// Add network status monitoring
window.addEventListener('online', () => {
  isOnline = true;
  console.log('Network: Online');
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.warn('Network: Offline - Some features may not work');
});

// Register service worker with network-first strategy
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Auto-update immediately to prevent stale content
    console.log('PWA: New version available, updating...');
    updateSW(true);
  },
  onOfflineReady() {
    // Offline mode is intentionally limited - log but don't advertise
    console.log('PWA: Service worker registered (offline support disabled)');
  },
  onRegisteredSW(swUrl, r) {
    console.log('Service Worker registered:', swUrl);
    // Check for updates every 3 minutes
    if (r) {
      setInterval(() => {
        // Only check for updates when online
        if (navigator.onLine) {
          r.update().catch(err => {
            console.log('SW update check failed:', err);
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
      // Keep only essential workbox caches, clear everything else
      if (!name.startsWith('workbox-') || name.includes('runtime')) {
        caches.delete(name);
        console.log('Cleared cache:', name);
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
