import React, { useState } from 'react';
import { Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  FilterOutlined,
  GlobalOutlined,
  MailOutlined,
  FileSearchOutlined,
  ClusterOutlined,
} from '@ant-design/icons';
import { DeduplicateTool } from './DeduplicateTool';
import { DomainExtractTool } from './DomainExtractTool';
import { EmailExtractTool } from './EmailExtractTool';
import { RegexExtractTool } from './RegexExtractTool';
import { IpExtractTool } from './IpExtractTool';

/** 杂项子功能定义 */
interface MiscTool {
  key: string;
  labelKey: string;
  icon: React.ReactNode;
}

const MISC_TOOLS: MiscTool[] = [
  { key: 'deduplicate', labelKey: 'devtools.misc.tools.deduplicate', icon: <FilterOutlined /> },
  { key: 'domain', labelKey: 'devtools.misc.tools.domain', icon: <GlobalOutlined /> },
  { key: 'email', labelKey: 'devtools.misc.tools.email', icon: <MailOutlined /> },
  { key: 'regex', labelKey: 'devtools.misc.tools.regex', icon: <FileSearchOutlined /> },
  { key: 'ip', labelKey: 'devtools.misc.tools.ip', icon: <ClusterOutlined /> },
];

/**
 * 杂项工具模块主布局
 * 左侧功能选择栏 + 右侧工具区
 */
export const MiscLayout: React.FC = () => {
  const { t } = useTranslation();
  const [activeTool, setActiveTool] = useState(() => localStorage.getItem('popup_misc_subtab') || 'deduplicate');
  const handleToolChange = (key: string) => { setActiveTool(key); localStorage.setItem('popup_misc_subtab', key); };

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
      case 'ip':
        return <IpExtractTool />;
      default:
        return null;
    }
  };

  const activeLabel = MISC_TOOLS.find((tool) => tool.key === activeTool)
    ? t(`devtools.misc.tools.${activeTool}`)
    : '';

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
              <Tooltip key={tool.key} title={t(tool.labelKey)} placement="right" mouseEnterDelay={0.5}>
                <div
                  className={`
                    flex items-center gap-1.5 px-2 py-1.5 cursor-pointer text-xs
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-r-blue-500 font-bold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 border-r-2 border-r-transparent'
                    }
                  `}
                  onClick={() => handleToolChange(tool.key)}
                >
                  <span style={{ fontSize: 13 }}>{tool.icon}</span>
                  <span className="truncate">{t(tool.labelKey)}</span>
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
          <span className="text-[10px] text-gray-400">{t('devtools.misc.title')}</span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {renderToolContent()}
        </div>
      </div>
    </div>
  );
};
