import React, { lazy, Suspense, useState, useEffect } from 'react';
import { ConfigProvider, Spin, Tabs } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

const TAB_STORAGE_KEY = 'popup_active_tab';

/* ── 懒加载各面板（命名导出需要包装为 default） ── */
const HomePanel = lazy(() =>
  import('@/components/popup/home/HomePanel').then((m) => ({ default: m.HomePanel })),
);
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
const NotePanel = lazy(() =>
  import('@/components/popup/note/NotePanel').then((m) => ({ default: m.NotePanel })),
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
    key: 'home',
    label: "首页",
    children: <Suspense fallback={LazyFallback}><HomePanel /></Suspense>,
  },
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
  {
    key: 'note',
    label: '笔记',
    children: <Suspense fallback={LazyFallback}><NotePanel /></Suspense>,
  },
];

const VALID_TAB_KEYS = new Set(POPUP_TABS.map((t) => t.key));

const App: React.FC = () => {
  const [activeKey, setActiveKey] = useState('home');

  // 初始化时从 localStorage 读取上次的选项卡
  useEffect(() => {
    const saved = localStorage.getItem(TAB_STORAGE_KEY);
    if (saved && VALID_TAB_KEYS.has(saved)) {
      setActiveKey(saved);
    }
  }, []);

  const handleTabChange = (key: string) => {
    setActiveKey(key);
    localStorage.setItem(TAB_STORAGE_KEY, key);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          fontSize: 14,
          borderRadius: 4,
          controlHeight: 32,
        },
        components: {
          Button: { controlHeight: 30, paddingInlineSM: 10 },
          Input: { controlHeight: 30 },
          Select: { controlHeight: 30 },
          Tabs: { horizontalMargin: '0' },
        },
      }}
    >
      <div className="flex h-full min-h-0 w-full flex-col">
        <Tabs
          activeKey={activeKey}
          onChange={handleTabChange}
          size="small"
          className="flex h-full min-h-0 flex-col px-2 [&_.ant-tabs-content]:h-full [&_.ant-tabs-content-holder]:min-h-0 [&_.ant-tabs-tabpane]:h-full"
          items={POPUP_TABS}
          tabBarStyle={{ marginBottom: 0 }}
        />
      </div>
    </ConfigProvider>
  );
};

export default App;
