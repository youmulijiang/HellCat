import React from 'react';
import { ConfigProvider, Tabs } from 'antd';
import { CookiePanel } from '@/components/popup/cookie/CookiePanel';
import { UrlOpenerPanel } from '@/components/popup/url-opener/UrlOpenerPanel';
import { VueCrackPanel } from '@/components/popup/vue-crack/VueCrackPanel';
import { InfoCollectPanel } from '@/components/popup/info-collect/InfoCollectPanel';
import { DorkPanel } from '@/components/popup/dork/DorkPanel';
import { InjectPanel } from '@/components/popup/inject/InjectPanel';
import { ProxyPanel } from '@/components/popup/proxy/ProxyPanel';

/** Popup 选项卡定义 */
const POPUP_TABS = [
  {
    key: 'cookie',
    label: 'Cookie操作',
    children: <CookiePanel />,
  },
  {
    key: 'url-opener',
    label: 'URL多开',
    children: <UrlOpenerPanel />,
  },
  {
    key: 'vue-crack',
    label: 'VueCrack',
    children: <VueCrackPanel />,
  },
  {
    key: 'info-collect',
    label: '信息收集',
    children: <InfoCollectPanel />,
  },
  {
    key: 'dork',
    label: 'Dork',
    children: <DorkPanel />,
  },
  {
    key: 'inject',
    label: '注入',
    children: <InjectPanel />,
  },
  {
    key: 'proxy',
    label: '代理',
    children: <ProxyPanel />,
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
      <div className="flex flex-col w-full h-full">
        <Tabs
          defaultActiveKey="cookie"
          size="small"
          className="px-2 flex-1"
          items={POPUP_TABS}
          tabBarStyle={{ marginBottom: 0 }}
        />
      </div>
    </ConfigProvider>
  );
};

export default App;
