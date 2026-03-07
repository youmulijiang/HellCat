import React, { useState } from 'react';
import { Input, Collapse, message, Tooltip } from 'antd';
import { CopyOutlined, SearchOutlined } from '@ant-design/icons';
import { PAYLOAD_GROUPS } from './payloadData';

const { Search } = Input;

/**
 * Payload 存储面板
 * 分组展示渗透测试常用 payload，支持搜索和一键复制
 */
export const PayloadStoreLayout: React.FC = () => {
  const [keyword, setKeyword] = useState('');

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  /** 按关键字过滤 payload */
  const filteredGroups = PAYLOAD_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        item.label.toLowerCase().includes(keyword.toLowerCase()) ||
        item.value.toLowerCase().includes(keyword.toLowerCase()),
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 顶部搜索 */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-[#f0f0f0]">
        <Search
          placeholder="搜索 Payload..."
          allowClear
          prefix={<SearchOutlined className="text-[#bfbfbf]" />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          size="small"
        />
      </div>

      {/* 分组列表 */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filteredGroups.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
            没有匹配的 Payload
          </div>
        ) : (
          <Collapse
            size="small"
            defaultActiveKey={PAYLOAD_GROUPS.map((g) => g.key)}
            ghost
            items={filteredGroups.map((group) => ({
              key: group.key,
              label: (
                <span className="text-xs font-semibold text-[#595959]">
                  {group.title}
                  <span className="ml-1 text-[#bfbfbf] font-normal">({group.items.length})</span>
                </span>
              ),
              children: (
                <div className="flex flex-col gap-1">
                  {group.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center gap-2 px-2 py-1.5 rounded
                        hover:bg-[#f5f5f5] transition-colors duration-100 cursor-pointer"
                      onClick={() => handleCopy(item.value)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[#595959] font-medium truncate">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-[#8c8c8c] font-mono truncate mt-0.5">
                          {item.value}
                        </div>
                      </div>
                      <Tooltip title="复制" mouseEnterDelay={0.4}>
                        <CopyOutlined
                          className="flex-shrink-0 text-[#bfbfbf] group-hover:text-[#177ddc]
                            transition-colors duration-100 text-xs"
                        />
                      </Tooltip>
                    </div>
                  ))}
                </div>
              ),
            }))}
          />
        )}
      </div>
    </div>
  );
};

