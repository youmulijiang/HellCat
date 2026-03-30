import React from 'react';
import { Tabs } from 'antd';
import { FileTextOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { NoteTab } from './NoteTab';
import { TodoTab } from './TodoTab';

const items = [
  {
    key: 'notes',
    label: (
      <span className="flex items-center gap-1 text-xs">
        <FileTextOutlined /> 笔记
      </span>
    ),
    children: <NoteTab />,
  },
  {
    key: 'todo',
    label: (
      <span className="flex items-center gap-1 text-xs">
        <CheckSquareOutlined /> 待办
      </span>
    ),
    children: <TodoTab />,
  },
];

export const NotePanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full py-1">
      <Tabs
        defaultActiveKey="notes"
        size="small"
        items={items}
        tabBarStyle={{ marginBottom: 8 }}
      />
    </div>
  );
};

