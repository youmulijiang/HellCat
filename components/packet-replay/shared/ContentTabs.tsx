import React, { useMemo } from 'react';
import { Tabs } from 'antd';

interface ContentTabsProps<T extends string> {
  tabs: T[];
  activeTab: T;
  onTabChange: (tab: T) => void;
}

/**
 * 内容视图标签切换组件
 * 用于 Request/Response 面板的 Pretty/Raw/Hex 等标签切换
 */
export function ContentTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: ContentTabsProps<T>) {
  const items = useMemo(
    () => tabs.map((tab) => ({ key: tab, label: tab })),
    [tabs]
  );

  return (
    <Tabs
      activeKey={activeTab}
      onChange={(key) => onTabChange(key as T)}
      items={items}
      size="small"
      className="px-2"
      style={{ marginBottom: 0 }}
    />
  );
}

