import React, { useState } from 'react';
import { Tooltip } from 'antd';
import {
  FilterOutlined,
  GlobalOutlined,
  MailOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import { DeduplicateTool } from './DeduplicateTool';
import { DomainExtractTool } from './DomainExtractTool';
import { EmailExtractTool } from './EmailExtractTool';
import { RegexExtractTool } from './RegexExtractTool';

/** 杂项子功能定义 */
interface MiscTool {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const MISC_TOOLS: MiscTool[] = [
  { key: 'deduplicate', label: '数据去重', icon: <FilterOutlined /> },
  { key: 'domain', label: '域名提取', icon: <GlobalOutlined /> },
  { key: 'email', label: 'Email 提取', icon: <MailOutlined /> },
  { key: 'regex', label: '正则提取', icon: <FileSearchOutlined /> },
];

/**
 * 杂项工具模块主布局
 * 左侧功能选择栏 + 右侧工具区
 */
export const MiscLayout: React.FC = () => {
  const [activeTool, setActiveTool] = useState('deduplicate');

  const renderToolContent = () => {
    switch (activeTool) {
      case 'deduplicate':
        return <DeduplicateTool />;
      case 'domain':
        return <DomainExtractTool />;
      case 'email':
        return <EmailExtractTool />;
      case 'regex':
        return <RegexExtractTool />;
      default:
        return null;
    }
  };

  const activeLabel = MISC_TOOLS.find((t) => t.key === activeTool)?.label ?? '';

  return (
    <div className="flex h-full bg-white">
      {/* 左侧功能选择栏 */}
      <div className="flex flex-col w-28 shrink-0 border-r border-gray-200 bg-gray-50">
        <div className="px-2 py-1.5 text-[10px] font-bold text-gray-500 tracking-wide border-b border-gray-200">
          MISC TOOLS
        </div>
        <div className="flex flex-col py-1">
          {MISC_TOOLS.map((tool) => {
            const isActive = tool.key === activeTool;
            return (
              <Tooltip key={tool.key} title={tool.label} placement="right" mouseEnterDelay={0.5}>
                <div
                  className={`
                    flex items-center gap-1.5 px-2 py-1.5 cursor-pointer text-xs
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-r-blue-500 font-bold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 border-r-2 border-r-transparent'
                    }
                  `}
                  onClick={() => setActiveTool(tool.key)}
                >
                  <span style={{ fontSize: 13 }}>{tool.icon}</span>
                  <span className="truncate">{tool.label}</span>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* 右侧工具区 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50">
          <span className="text-xs font-bold text-gray-600 tracking-wide">{activeLabel.toUpperCase()}</span>
          <span className="text-[10px] text-gray-400">杂项工具</span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {renderToolContent()}
        </div>
      </div>
    </div>
  );
};

