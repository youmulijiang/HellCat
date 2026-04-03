import React, { useState } from 'react';
import { Tabs } from 'antd';
import {
  AppstoreOutlined,
  PlayCircleOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MultiOpenTab } from './MultiOpenTab';
import { SlideshowTab } from './SlideshowTab';
import { ScreenshotTab } from './ScreenshotTab';

export const UrlOpenerPanel: React.FC = () => {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState(() => localStorage.getItem('popup_urlopener_subtab') || 'multi-open');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Tabs
        activeKey={activeKey}
        onChange={(k) => { setActiveKey(k); localStorage.setItem('popup_urlopener_subtab', k); }}
        className="flex h-full min-h-0 flex-col [&_.ant-tabs-content]:h-full [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-content-holder]:min-h-0 [&_.ant-tabs-content-holder]:overflow-hidden [&_.ant-tabs-tabpane]:h-full"
        items={[
          {
            key: 'multi-open',
            label: (
              <span className="flex items-center gap-1.5 text-sm">
                <AppstoreOutlined /> {t('popup.urlOpener.tabs.multiOpen')}
              </span>
            ),
            children: <MultiOpenTab />,
          },
          {
            key: 'slideshow',
            label: (
              <span className="flex items-center gap-1.5 text-sm">
                <PlayCircleOutlined /> {t('popup.urlOpener.tabs.slideshow')}
              </span>
            ),
            children: <SlideshowTab />,
          },
          {
            key: 'screenshot',
            label: (
              <span className="flex items-center gap-1.5 text-sm">
                <CameraOutlined /> {t('popup.urlOpener.tabs.screenshot')}
              </span>
            ),
            children: <ScreenshotTab />,
          },
        ]}
      />
    </div>
  );
};

