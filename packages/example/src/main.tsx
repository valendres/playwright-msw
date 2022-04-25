import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { setupWorker } from "msw";
import handlers from "./mocks/handlers";

const worker = setupWorker(...handlers);

async function prepare() {
  if (import.meta.env.DEV) {
    await import("../mockServiceWorker.js?worker");

    return worker.start({}).then(() => {
      console.groupCollapsed("[MSW] Loaded with handlers 🎉");
      worker.printHandlers();
      console.groupEnd();
      return null;
    });
  }
}

prepare().then(() => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
});
