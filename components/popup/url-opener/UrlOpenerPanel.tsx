import React from 'react';
import { Tabs } from 'antd';
import {
  AppstoreOutlined,
  PlayCircleOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import { MultiOpenTab } from './MultiOpenTab';
import { SlideshowTab } from './SlideshowTab';
import { ScreenshotTab } from './ScreenshotTab';

export const UrlOpenerPanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <Tabs
        defaultActiveKey="multi-open"
        size="small"
        className="h-full [&_.ant-tabs-content]:h-full [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-content-holder]:min-h-0 [&_.ant-tabs-tabpane]:h-full"
        items={[
          {
            key: 'multi-open',
            label: (
              <span className="flex items-center gap-1 text-xs">
                <AppstoreOutlined /> 多开
              </span>
            ),
            children: <MultiOpenTab />,
          },
          {
            key: 'slideshow',
            label: (
              <span className="flex items-center gap-1 text-xs">
                <PlayCircleOutlined /> 幻灯片
              </span>
            ),
            children: <SlideshowTab />,
          },
          {
            key: 'screenshot',
            label: (
              <span className="flex items-center gap-1 text-xs">
                <CameraOutlined /> 截图
              </span>
            ),
            children: <ScreenshotTab />,
          },
        ]}
      />
    </div>
  );
};

