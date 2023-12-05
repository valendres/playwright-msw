import { Buffer as BufferPolyfill } from 'buffer';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { setupWorker } from 'msw/browser';
import handlers from './mocks/handlers';

// Polyfill buffer so we can base64 encode/decode within mocks in browser (via dev server) & node
globalThis.Buffer = BufferPolyfill;

const worker = setupWorker(...handlers);

async function prepare() {
  if (import.meta.env.DEV) {
    await import('../mockServiceWorker.js?worker');

    return worker.start({}).then(() => {
      console.groupCollapsed('[MSW] Loaded with handlers 🎉');
      worker.listHandlers();
      console.groupEnd();
      return null;
    });
  }
}

void prepare().then(() => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
});
