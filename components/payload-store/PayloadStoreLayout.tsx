import React, { useState } from 'react';
import { message, Tooltip } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { PAYLOAD_GROUPS } from './payloadData';

/**
 * Payload 存储面板
 * 左侧：漏洞分组列表 | 右侧：选中分组的 payload 详情 + 复制
 */
export const PayloadStoreLayout: React.FC = () => {
  const [activeKey, setActiveKey] = useState(PAYLOAD_GROUPS[0].key);

  const activeGroup = PAYLOAD_GROUPS.find((g) => g.key === activeKey) ?? PAYLOAD_GROUPS[0];

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  return (
    <div className="flex h-full bg-white">
      {/* ——— 左侧分组列表 ——— */}
      <div className="flex-shrink-0 w-36 border-r border-[#f0f0f0] overflow-y-auto">
        <div className="px-2 py-1.5 text-[11px] text-[#bfbfbf] font-semibold uppercase tracking-wider select-none">
          分组
        </div>
        {PAYLOAD_GROUPS.map((group) => {
          const isActive = group.key === activeKey;
          return (
            <div
              key={group.key}
              className={`
                flex items-center justify-between px-3 py-2 cursor-pointer text-xs
                transition-colors duration-100 select-none
                ${isActive
                  ? 'bg-[#e6f4ff] text-[#177ddc] font-semibold border-r-2 border-[#177ddc]'
                  : 'text-[#595959] hover:bg-[#fafafa]'
                }
              `}
              onClick={() => setActiveKey(group.key)}
            >
              <span className="truncate">{group.title}</span>
              <span className={`ml-1 text-[10px] ${isActive ? 'text-[#177ddc]/60' : 'text-[#bfbfbf]'}`}>
                {group.items.length}
              </span>
            </div>
          );
        })}
      </div>

      {/* ——— 右侧 Payload 详情 ——— */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* 标题栏 */}
        <div className="flex-shrink-0 px-4 py-2 border-b border-[#f0f0f0] flex items-center gap-2">
          <span className="text-sm font-semibold text-[#262626]">{activeGroup.title}</span>
          <span className="text-[11px] text-[#bfbfbf]">共 {activeGroup.items.length} 条</span>
        </div>

        {/* payload 列表 */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {activeGroup.items.map((item, idx) => (
            <div
              key={idx}
              className="group flex items-start gap-3 px-3 py-2.5 rounded
                hover:bg-[#fafafa] transition-colors duration-100"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[#595959] font-medium">{item.label}</div>
                <div className="mt-1 px-2 py-1.5 rounded bg-[#f5f5f5] border border-[#e8e8e8]">
                  <code className="text-[11px] text-[#434343] font-mono whitespace-pre-wrap break-all">
                    {item.value}
                  </code>
                </div>
              </div>
              <Tooltip title="复制" mouseEnterDelay={0.3}>
                <button
                  className="flex-shrink-0 mt-5 p-1 rounded text-[#bfbfbf] hover:text-[#177ddc]
                    hover:bg-[#e6f4ff] transition-colors duration-100 cursor-pointer border-none bg-transparent"
                  onClick={() => handleCopy(item.value)}
                >
                  <CopyOutlined className="text-sm" />
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

