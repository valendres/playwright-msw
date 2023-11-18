import { testHandlers } from './mocks/handler';
import { createApp } from 'vue';
import App from './App.vue';
import { setupWorker } from 'msw/browser';

const worker = setupWorker(...testHandlers);

async function prepare() {
  if ('active' === import.meta.env.VITE_MSW) {
    await import('../public/mockServiceWorker.js?worker');

    return worker.start({}).then(() => {
      console.groupCollapsed('[MSW] Loaded with handlers 🎉');
      worker.listHandlers();
      console.groupEnd();
      return null;
    });
  }
}

void prepare().then(() => {
  createApp(App).mount('#app');
});
