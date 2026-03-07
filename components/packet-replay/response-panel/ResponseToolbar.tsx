import React from 'react';
import { Button, Space, Tooltip } from 'antd';
import {
  DownloadOutlined,
  CopyOutlined,
  SaveOutlined,
  EyeOutlined,
  SettingOutlined,
} from '@ant-design/icons';

/**
 * 响应面板工具栏
 * 包含保存、复制、下载等操作
 */
export const ResponseToolbar: React.FC = () => {
  const actions = [
    { icon: <DownloadOutlined />, title: 'Download response' },
    { icon: <CopyOutlined />, title: 'Copy response' },
    { icon: <SaveOutlined />, title: 'Save response' },
    { icon: <EyeOutlined />, title: 'Preview' },
    { icon: <SettingOutlined />, title: 'Settings' },
  ];

  return (
    <Space size={0}>
      {actions.map(({ icon, title }) => (
        <Tooltip key={title} title={title} mouseEnterDelay={0.5}>
          <Button type="text" size="small" icon={icon} />
        </Tooltip>
      ))}
    </Space>
  );
};

