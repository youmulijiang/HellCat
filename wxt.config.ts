import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ['debugger', 'cookies', 'activeTab', 'tabs', 'proxy', 'scripting', 'storage', 'alarms'],
    host_permissions: ['<all_urls>'],
    web_accessible_resources: [
      {
        resources: ['vue-detector.js'],
        matches: ['*://*/*'],
      },
    ],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
