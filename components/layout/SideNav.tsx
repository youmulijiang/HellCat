import React from 'react';
import { Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  SendOutlined,
  BugOutlined,
  ApiOutlined,
  FileTextOutlined,
  CodeOutlined,
  ExperimentOutlined,
  DiffOutlined,
  ToolOutlined,
  LockOutlined,
  SwapOutlined,
} from '@ant-design/icons';

/** 导航模块定义 */
interface NavModule {
  key: string;
  labelKey: string;
  icon: React.ReactNode;
}

/** 可用模块列表 */
const NAV_MODULES: NavModule[] = [
  { key: 'packet-replay', labelKey: 'devtools.modules.packetReplay', icon: <SendOutlined /> },
  { key: 'websocket', labelKey: 'devtools.modules.websocket', icon: <SwapOutlined /> },
  { key: 'api-test', labelKey: 'devtools.modules.apiTest', icon: <ApiOutlined /> },
  { key: 'vulnerability', labelKey: 'devtools.modules.vulnerability', icon: <BugOutlined /> },
  { key: 'codec', labelKey: 'devtools.modules.codec', icon: <LockOutlined /> },
  { key: 'payload-store', labelKey: 'devtools.modules.payloadStore', icon: <CodeOutlined /> },
  { key: 'data-generator', labelKey: 'devtools.modules.dataGenerator', icon: <ExperimentOutlined /> },
  { key: 'diff', labelKey: 'devtools.modules.diff', icon: <DiffOutlined /> },
  { key: 'misc', labelKey: 'devtools.modules.misc', icon: <ToolOutlined /> },
  { key: 'report-writer', labelKey: 'devtools.modules.reportWriter', icon: <FileTextOutlined /> },
  // { key: 'settings', labelKey: 'devtools.modules.settings', icon: <SettingOutlined /> },
];

interface SideNavProps {
  /** 当前激活的模块 key */
  activeModule: string;
  /** 模块切换回调 */
  onModuleChange: (key: string) => void;
  /** 侧边栏是否折叠 */
  collapsed: boolean;
  /** 折叠切换回调 */
  onCollapsedChange: (collapsed: boolean) => void;
}

/**
 * 左侧导航栏组件
 * 包含模块图标导航和折叠/展开按钮
 */
export const SideNav: React.FC<SideNavProps> = ({
  activeModule,
  onModuleChange,
  collapsed,
  onCollapsedChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative flex h-full">
      {/* 导航图标区域 */}
      {!collapsed && (
        <div className="flex flex-col items-center w-10 bg-[#1f1f1f] border-r border-[#303030] py-2 gap-1">
          {NAV_MODULES.map((module) => {
            const isActive = module.key === activeModule;
            return (
              <Tooltip key={module.key} title={t(module.labelKey)} placement="right" mouseEnterDelay={0.3}>
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded cursor-pointer
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-[#177ddc] text-white'
                      : 'text-[#8c8c8c] hover:text-white hover:bg-[#303030]'
                    }
                  `}
                  onClick={() => onModuleChange(module.key)}
                  style={{ fontSize: 16 }}
                >
                  {module.icon}
                </div>
              </Tooltip>
            );
          })}
        </div>
      )}

      {/* 折叠/展开按钮 - 位于右边缘中间 */}
      <div
        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer z-10
          w-3 h-8 bg-[#f0f0f0] border border-[#d9d9d9] hover:bg-[#e0e0e0] transition-colors duration-150"
        style={{
          right: -13,
          borderRadius: '0 4px 4px 0',
        }}
        onClick={() => onCollapsedChange(!collapsed)}
        title={collapsed ? t('layout.sideNav.expand') : t('layout.sideNav.collapse')}
      >
        <span
          style={{
            fontSize: 8,
            color: '#595959',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {collapsed ? '▶' : '◀'}
        </span>
      </div>
    </div>
  );
};

