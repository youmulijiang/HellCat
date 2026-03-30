import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Hellcat',
    description: '浏览器安全测试工具箱',
    icons: {
      16: '/icon/logo.png',
      32: '/icon/logo.png',
      48: '/icon/logo.png',
      96: '/icon/logo.png',
      128: '/icon/logo.png',
    },
    permissions: ['debugger', 'cookies', 'activeTab', 'tabs', 'proxy', 'scripting', 'storage', 'alarms'],
    host_permissions: ['<all_urls>'],
    web_accessible_resources: [
      {
        resources: ['vue-detector.js'],
        matches: ['*://*/*'],
      },
    ],

  },
  zip:{
    artifactTemplate: "hellcat-{{browser}}-extension.zip",
    zipSources: false, // 只打包构建产物，不包含源代码
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
