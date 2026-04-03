import React, { useState } from 'react';
import { message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PAYLOAD_GROUPS } from './payloadData';

/**
 * Payload 存储面板
 * 左侧：漏洞分组列表 | 右侧：选中分组的 payload 详情 + 复制
 */
export const PayloadStoreLayout: React.FC = () => {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState(PAYLOAD_GROUPS[0].key);

  const activeGroup = PAYLOAD_GROUPS.find((g) => g.key === activeKey) ?? PAYLOAD_GROUPS[0];

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(t('common.feedback.copySuccess'));
    } catch {
      message.error(t('common.feedback.copyFailed'));
    }
  };

  return (
    <div className="flex h-full bg-white">
      {/* ——— 左侧分组列表 ——— */}
      <div className="flex-shrink-0 w-44 border-r border-[#f0f0f0] overflow-y-auto">
        <div className="px-3 py-2 text-xs text-[#bfbfbf] font-semibold uppercase tracking-wider select-none">
          {t('devtools.payloadStore.sidebar.groups')}
        </div>
        {PAYLOAD_GROUPS.map((group) => {
          const isActive = group.key === activeKey;
          return (
            <div
              key={group.key}
              className={`
                flex items-center justify-between px-3 py-2.5 cursor-pointer text-sm
                transition-colors duration-100 select-none
                ${isActive
                  ? 'bg-[#e6f4ff] text-[#177ddc] font-semibold border-r-2 border-[#177ddc]'
                  : 'text-[#595959] hover:bg-[#fafafa]'
                }
              `}
              onClick={() => setActiveKey(group.key)}
            >
              <span className="truncate">{t(group.titleKey)}</span>
              <span className={`ml-1 text-xs ${isActive ? 'text-[#177ddc]/60' : 'text-[#bfbfbf]'}`}>
                {group.items.length}
              </span>
            </div>
          );
        })}
      </div>

      {/* ——— 右侧 Payload 详情 ——— */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* 标题栏 */}
        <div className="flex-shrink-0 px-4 py-2.5 border-b border-[#f0f0f0] flex items-center gap-2">
          <span className="text-base font-semibold text-[#262626]">{t(activeGroup.titleKey)}</span>
          <span className="text-xs text-[#bfbfbf]">{t('devtools.payloadStore.header.totalItems', { count: activeGroup.items.length })}</span>
        </div>

        {/* payload 列表 */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {activeGroup.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-3 py-3 rounded cursor-pointer
                hover:bg-[#e6f4ff] active:bg-[#bae0ff] transition-colors duration-100"
              onClick={() => handleCopy(item.value)}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[#595959] font-medium">{t(item.labelKey)}</div>
                <div className="mt-1.5 px-2.5 py-2 rounded bg-[#f5f5f5] border border-[#e8e8e8]">
                  <code className="text-xs text-[#434343] font-mono whitespace-pre-wrap break-all">
                    {item.value}
                  </code>
                </div>
              </div>
              <CopyOutlined className="flex-shrink-0 text-base text-[#bfbfbf] group-hover:text-[#177ddc]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

