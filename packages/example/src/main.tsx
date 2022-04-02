import React from "react";
import ReactDOM from "react-dom";
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
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById("root")
  );
});
