import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      // Check for updates when the app opens.
      await registration.update();

      // Detect an update that was already waiting.
      if (registration.waiting && navigator.serviceWorker.controller) {
        window.dispatchEvent(new Event('cove-update-ready'));
      }

      // Detect a newly downloaded service worker.
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener('statechange', () => {
          if (
            installing.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            window.dispatchEvent(new Event('cove-update-ready'));
          }
        });
      });

      // Detect activation in this or another tab.
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'COVE_UPDATED') {
          window.dispatchEvent(new Event('cove-updated'));
        }
      });

    } catch (error) {
      console.error('COVE service worker registration failed:', error);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);