import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Register Service Worker — offline-first PWA capability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        navigator.serviceWorker.addEventListener('message', e => {
          if (e.data?.type === 'SYNC_READY') {
            window.dispatchEvent(new CustomEvent('ss:sync-ready'));
          }
        });
        setInterval(() => reg.update(), 60_000);
      })
      .catch(() => {});
  });
}
