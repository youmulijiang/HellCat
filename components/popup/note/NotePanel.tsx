import React, { useState } from 'react';
import { Tabs } from 'antd';
import { FileTextOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { NoteTab } from './NoteTab';
import { TodoTab } from './TodoTab';

const STORAGE_KEY = 'popup_note_subtab';

export const NotePanel: React.FC = () => {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState(() => localStorage.getItem(STORAGE_KEY) || 'notes');
  const items = [
    {
      key: 'notes',
      label: (
        <span className="flex items-center gap-1 text-xs">
          <FileTextOutlined /> {t('popup.note.tabs.notes')}
        </span>
      ),
      children: <NoteTab />,
    },
    {
      key: 'todo',
      label: (
        <span className="flex items-center gap-1 text-xs">
          <CheckSquareOutlined /> {t('popup.note.tabs.todo')}
        </span>
      ),
      children: <TodoTab />,
    },
  ];

  return (
    <div className="flex flex-col h-full py-1">
      <Tabs
        activeKey={activeKey}
        onChange={(k) => { setActiveKey(k); localStorage.setItem(STORAGE_KEY, k); }}
        size="small"
        items={items}
        tabBarStyle={{ marginBottom: 8 }}
      />
    </div>
  );
};

