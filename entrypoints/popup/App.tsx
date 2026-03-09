import React, { lazy, Suspense } from 'react';
import { ConfigProvider, Spin, Tabs } from 'antd';

/* ── 懒加载各面板（命名导出需要包装为 default） ── */
const CookiePanel = lazy(() =>
  import('@/components/popup/cookie/CookiePanel').then((m) => ({ default: m.CookiePanel })),
);
const UrlOpenerPanel = lazy(() =>
  import('@/components/popup/url-opener/UrlOpenerPanel').then((m) => ({ default: m.UrlOpenerPanel })),
);
const VueCrackPanel = lazy(() =>
  import('@/components/popup/vue-crack/VueCrackPanel').then((m) => ({ default: m.VueCrackPanel })),
);
const InfoCollectPanel = lazy(() =>
  import('@/components/popup/info-collect/InfoCollectPanel').then((m) => ({ default: m.InfoCollectPanel })),
);
const DorkPanel = lazy(() =>
  import('@/components/popup/dork/DorkPanel').then((m) => ({ default: m.DorkPanel })),
);
const InjectPanel = lazy(() =>
  import('@/components/popup/inject/InjectPanel').then((m) => ({ default: m.InjectPanel })),
);
const ProxyPanel = lazy(() =>
  import('@/components/popup/proxy/ProxyPanel').then((m) => ({ default: m.ProxyPanel })),
);

/** 懒加载 fallback */
const LazyFallback = (
  <div className="flex items-center justify-center h-32">
    <Spin size="small" />
  </div>
);

/** Popup 选项卡定义 */
const POPUP_TABS = [
  {
    key: 'info-collect',
    label: '信息收集',
    children: <Suspense fallback={LazyFallback}><InfoCollectPanel /></Suspense>,
  },
  {
    key: 'vue-crack',
    label: 'VueCrack',
    children: <Suspense fallback={LazyFallback}><VueCrackPanel /></Suspense>,
  },
  {
    key: 'proxy',
    label: '代理',
    children: <Suspense fallback={LazyFallback}><ProxyPanel /></Suspense>,
  },
  {
    key: 'inject',
    label: '注入',
    children: <Suspense fallback={LazyFallback}><InjectPanel /></Suspense>,
  },
  {
    key: 'cookie',
    label: 'Cookie操作',
    children: <Suspense fallback={LazyFallback}><CookiePanel /></Suspense>,
  },
  {
    key: 'dork',
    label: 'Dork',
    children: <Suspense fallback={LazyFallback}><DorkPanel /></Suspense>,
  },
  {
    key: 'url-opener',
    label: 'URL多开',
    children: <Suspense fallback={LazyFallback}><UrlOpenerPanel /></Suspense>,
  },
];

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontSize: 12,
          borderRadius: 4,
          controlHeight: 28,
        },
        components: {
          Button: { controlHeight: 24, paddingInlineSM: 8 },
          Input: { controlHeight: 24 },
          Select: { controlHeight: 24 },
          Tabs: { horizontalMargin: '0' },
        },
      }}
    >
      <div className="w-full h-full">
        <Tabs
          defaultActiveKey="info-collect"
          size="small"
          className="px-2 h-full"
          items={POPUP_TABS}
          tabBarStyle={{ marginBottom: 0 }}
        />
      </div>
    </ConfigProvider>
  );
};

export default App;
