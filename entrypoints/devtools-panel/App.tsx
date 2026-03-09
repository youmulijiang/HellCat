import React, { lazy, Suspense, useState } from 'react';
import { ConfigProvider, Spin, theme } from 'antd';
import { SideNav } from '@/components/layout/SideNav';

/* ── 懒加载各功能模块（命名导出需要包装为 default） ── */
const PacketReplayLayout = lazy(() =>
  import('@/components/packet-replay/PacketReplayLayout').then((m) => ({ default: m.PacketReplayLayout })),
);
const CodecLayout = lazy(() =>
  import('@/components/codec/CodecLayout').then((m) => ({ default: m.CodecLayout })),
);
const PayloadStoreLayout = lazy(() =>
  import('@/components/payload-store/PayloadStoreLayout').then((m) => ({ default: m.PayloadStoreLayout })),
);
const DataGeneratorLayout = lazy(() =>
  import('@/components/data-generator/DataGeneratorLayout').then((m) => ({ default: m.DataGeneratorLayout })),
);
const DiffLayout = lazy(() =>
  import('@/components/diff/DiffLayout').then((m) => ({ default: m.DiffLayout })),
);
const MiscLayout = lazy(() =>
  import('@/components/misc/MiscLayout').then((m) => ({ default: m.MiscLayout })),
);
const VulnScanLayout = lazy(() =>
  import('@/components/vulnerability/VulnScanLayout').then((m) => ({ default: m.VulnScanLayout })),
);
const ApiTesterLayout = lazy(() =>
  import('@/components/api-tester/ApiTesterLayout').then((m) => ({ default: m.ApiTesterLayout })),
);
const WebSocketLayout = lazy(() =>
  import('@/components/websocket/WebSocketLayout').then((m) => ({ default: m.WebSocketLayout })),
);
const ReportLayout = lazy(() =>
  import('@/components/report/ReportLayout').then((m) => ({ default: m.ReportLayout })),
);

/** 懒加载 fallback */
const LazyFallback = (
  <div className="flex items-center justify-center h-full">
    <Spin size="small" tip="加载中..." />
  </div>
);

/**
 * DevTools 面板入口组件
 * 左侧导航栏 + 右侧功能区
 */
const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState('packet-replay');
  const [sideCollapsed, setSideCollapsed] = useState(false);

  /** 根据当前模块渲染对应功能区 */
  const renderModuleContent = () => {
    switch (activeModule) {
      case 'packet-replay':
        return <PacketReplayLayout />;
      case 'codec':
        return <CodecLayout />;
      case 'payload-store':
        return <PayloadStoreLayout />;
      case 'data-generator':
        return <DataGeneratorLayout />;
      case 'diff':
        return <DiffLayout />;
      case 'misc':
        return <MiscLayout />;
      case 'vulnerability':
        return <VulnScanLayout />;
      case 'api-test':
        return <ApiTesterLayout />;
      case 'websocket':
        return <WebSocketLayout />;
      case 'data-store':
        return <ReportLayout />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            模块开发中...
          </div>
        );
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
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
      <div className="flex w-full h-screen overflow-hidden">
        {/* 左侧导航栏 */}
        <SideNav
          activeModule={activeModule}
          onModuleChange={setActiveModule}
          collapsed={sideCollapsed}
          onCollapsedChange={setSideCollapsed}
        />

        {/* 右侧功能区 */}
        <div className="flex-1 min-w-0 overflow-hidden" style={{ marginLeft: 13 }}>
          <Suspense fallback={LazyFallback}>
            {renderModuleContent()}
          </Suspense>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default App;

