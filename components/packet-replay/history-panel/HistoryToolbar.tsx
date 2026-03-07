import React from 'react';
import { Input, Select, Button, Space, Tooltip } from 'antd';
import {
  DeleteOutlined,
  MoreOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  MessageOutlined,
  HighlightOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { usePacketStore } from '@/stores/usePacketStore';
import type { HistoryFilterType } from '@/types/packet';

/**
 * 历史面板工具栏
 * 包含过滤输入框、操作按钮、过滤类型选择
 */
export const HistoryToolbar: React.FC = () => {
  const {
    filterKeyword,
    setFilterKeyword,
    filterType,
    setFilterType,
    clearPackets,
    isForwarding,
  } = usePacketStore();

  const filterOptions: { value: HistoryFilterType; label: string }[] = [
    { value: 'All', label: 'All' },
    { value: 'Starred', label: 'Starred' },
    { value: 'Commented', label: 'Commented' },
    { value: 'Highlighted', label: 'Highlighted' },
  ];

  const toolbarIcons = [
    { icon: <DeleteOutlined />, title: 'Clear history', onClick: clearPackets },
    { icon: <MoreOutlined />, title: 'More options', onClick: () => {} },
    { icon: <FilterOutlined />, title: 'Filter', onClick: () => {} },
    { icon: <SortAscendingOutlined />, title: 'Sort', onClick: () => {} },
    { icon: <MessageOutlined />, title: 'Comments', onClick: () => {} },
    { icon: <HighlightOutlined />, title: 'Highlight', onClick: () => {} },
    { icon: <SettingOutlined />, title: 'Settings', onClick: () => {} },
  ];

  return (
    <div className="border-b border-gray-200 bg-[#fafafa]">
      {/* 第一行：过滤输入 + 工具图标 */}
      <div className="flex items-center px-2 py-1 gap-1">
        <Input
          size="small"
          placeholder="Filter..."
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          allowClear
          className="flex-1"
        />
        <Space size={0}>
          {toolbarIcons.map(({ icon, title, onClick }) => (
            <Tooltip key={title} title={title} mouseEnterDelay={0.5}>
              <Button
                type="text"
                size="small"
                icon={icon}
                onClick={onClick}
              />
            </Tooltip>
          ))}
        </Space>
      </div>

      {/* 第二行：过滤类型 + Forward */}
      <div className="flex items-center px-2 py-1 gap-2 border-t border-gray-100">
        <Select
          size="small"
          value={filterType}
          onChange={setFilterType}
          options={filterOptions}
          style={{ width: 100 }}
        />
        <div className="ml-auto">
          <Button
            size="small"
            type={isForwarding ? 'primary' : 'default'}
            danger={isForwarding}
          >
            Forward (0)
          </Button>
        </div>
      </div>
    </div>
  );
};

