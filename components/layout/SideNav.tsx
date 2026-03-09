import React from 'react';
import { Tooltip } from 'antd';
import {
  SendOutlined,
  BugOutlined,
  ApiOutlined,
  FileTextOutlined,
  SettingOutlined,
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
  label: string;
  icon: React.ReactNode;
}

/** 可用模块列表 */
const NAV_MODULES: NavModule[] = [
  { key: 'packet-replay', label: '抓包/重放', icon: <SendOutlined /> },
  { key: 'websocket', label: 'WS测试', icon: <SwapOutlined /> },
  { key: 'api-test', label: 'API测试', icon: <ApiOutlined /> },
  { key: 'vulnerability', label: '漏洞扫描', icon: <BugOutlined /> },
  { key: 'codec', label: '加密解密', icon: <LockOutlined /> },
  { key: 'payload-store', label: 'Payload存储', icon: <CodeOutlined /> },
  { key: 'data-generator', label: '数据生成', icon: <ExperimentOutlined /> },
  { key: 'diff', label: 'Diff', icon: <DiffOutlined /> },
  { key: 'misc', label: '杂项工具', icon: <ToolOutlined /> },
  { key: 'data-store', label: '报告编写', icon: <FileTextOutlined /> },
  { key: 'settings', label: '设置', icon: <SettingOutlined /> },
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
  return (
    <div className="relative flex h-full">
      {/* 导航图标区域 */}
      {!collapsed && (
        <div className="flex flex-col items-center w-10 bg-[#1f1f1f] border-r border-[#303030] py-2 gap-1">
          {NAV_MODULES.map((module) => {
            const isActive = module.key === activeModule;
            return (
              <Tooltip key={module.key} title={module.label} placement="right" mouseEnterDelay={0.3}>
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
        title={collapsed ? '展开侧栏' : '收起侧栏'}
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

