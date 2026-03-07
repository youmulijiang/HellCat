import React from 'react';
import { Typography } from 'antd';

interface PanelHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

/**
 * 面板头部组件
 * 用于 Request/Response 面板的标题栏
 */
export const PanelHeader: React.FC<PanelHeaderProps> = ({ title, actions }) => {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-[#fafafa]">
      <Typography.Text strong style={{ fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {title}
      </Typography.Text>
      {actions && (
        <div className="flex items-center gap-1">
          {actions}
        </div>
      )}
    </div>
  );
};

