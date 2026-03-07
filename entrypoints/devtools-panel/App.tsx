import React, { useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import { SideNav } from '@/components/layout/SideNav';
import { PacketReplayLayout } from '@/components/packet-replay/PacketReplayLayout';
import { DataGeneratorLayout } from '@/components/data-generator/DataGeneratorLayout';
import { DiffLayout } from '@/components/diff/DiffLayout';
import { MiscLayout } from '@/components/misc/MiscLayout';
import { PayloadStoreLayout } from '@/components/payload-store/PayloadStoreLayout';
import { VulnScanLayout } from '@/components/vulnerability/VulnScanLayout';
import { CodecLayout } from '@/components/codec/CodecLayout';
import { ApiTesterLayout } from '@/components/api-tester/ApiTesterLayout';

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
          {renderModuleContent()}
        </div>
      </div>
    </ConfigProvider>
  );
};

export default App;

