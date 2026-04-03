import React, { useState, useCallback, useEffect } from 'react';
import { Input, Button, Checkbox, Empty, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, ClearOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'hellcat_todos';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function loadTodos(): TodoItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveTodos(todos: TodoItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export const TodoTab: React.FC = () => {
  const { t } = useTranslation();
  const [todos, setTodos] = useState<TodoItem[]>(loadTodos);
  const [draft, setDraft] = useState('');

  useEffect(() => { saveTodos(todos); }, [todos]);

  const handleAdd = useCallback(() => {
    const text = draft.trim();
    if (!text) { message.warning(t('popup.note.todo.messages.inputRequired')); return; }
    setTodos((prev) => [...prev, { id: uid(), text, done: false, createdAt: Date.now() }]);
    setDraft('');
  }, [draft, t]);

  const handleToggle = useCallback((id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const handleRemove = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleClearDone = useCallback(() => {
    setTodos((prev) => {
      const remaining = prev.filter((t) => !t.done);
      if (remaining.length === prev.length) { message.info(t('popup.note.todo.messages.noCompleted')); return prev; }
      message.success(t('popup.note.todo.messages.cleared', { count: prev.length - remaining.length }));
      return remaining;
    });
  }, [t]);

  const doneCount = todos.filter((t) => t.done).length;
  const totalCount = todos.length;

  return (
    <div className="flex flex-col h-full gap-2 px-3 py-2">
      {/* 输入区 */}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPressEnter={handleAdd}
          placeholder={t('popup.note.todo.inputPlaceholder')}
          size="small"
          className="flex-1 text-xs"
        />
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAdd}>
          {t('common.actions.add')}
        </Button>
      </div>

      {/* 统计栏 */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-gray-400">
            {t('popup.note.todo.statsSummary', { total: totalCount })}{' '}
            <Tag color={doneCount === totalCount ? 'success' : 'default'} className="text-[10px]">
              {doneCount}/{totalCount}
            </Tag>
          </div>
          <Button type="text" size="small" icon={<ClearOutlined />}
            onClick={handleClearDone} disabled={doneCount === 0}
            className="text-[10px] text-gray-400">
            {t('popup.note.todo.clearCompleted')}
          </Button>
        </div>
      )}

      {/* 待办列表 */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {todos.length === 0 ? (
          <Empty description={t('popup.note.todo.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} className="mt-6" />
        ) : (
          todos.map((todo) => (
            <div key={todo.id}
              className={`group flex items-center gap-2 border rounded px-2 py-1.5 transition-colors
                ${todo.done ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <Checkbox checked={todo.done} onChange={() => handleToggle(todo.id)} />
              <span className={`flex-1 text-xs break-all ${todo.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {todo.text}
              </span>
              <Popconfirm
                title={t('popup.note.todo.confirmDelete')}
                onConfirm={() => handleRemove(todo.id)}
                okText={t('common.actions.confirm')}
                cancelText={t('common.actions.cancel')}
                okButtonProps={{ size: 'small' }}
                cancelButtonProps={{ size: 'small' }}
              >
                <Button type="text" size="small" danger icon={<DeleteOutlined />}
                  className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </Popconfirm>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

