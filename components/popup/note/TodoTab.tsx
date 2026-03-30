import React, { useState, useCallback, useEffect } from 'react';
import { Input, Button, Checkbox, Empty, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, ClearOutlined } from '@ant-design/icons';

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
  const [todos, setTodos] = useState<TodoItem[]>(loadTodos);
  const [draft, setDraft] = useState('');

  useEffect(() => { saveTodos(todos); }, [todos]);

  const handleAdd = useCallback(() => {
    const text = draft.trim();
    if (!text) { message.warning('请输入待办内容'); return; }
    setTodos((prev) => [...prev, { id: uid(), text, done: false, createdAt: Date.now() }]);
    setDraft('');
  }, [draft]);

  const handleToggle = useCallback((id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const handleRemove = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleClearDone = useCallback(() => {
    setTodos((prev) => {
      const remaining = prev.filter((t) => !t.done);
      if (remaining.length === prev.length) { message.info('没有已完成的待办'); return prev; }
      message.success(`已清除 ${prev.length - remaining.length} 项`);
      return remaining;
    });
  }, []);

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
          placeholder="输入待办事项，Enter 添加..."
          size="small"
          className="flex-1 text-xs"
        />
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAdd}>
          添加
        </Button>
      </div>

      {/* 统计栏 */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-gray-400">
            共 {totalCount} 项，已完成{' '}
            <Tag color={doneCount === totalCount ? 'success' : 'default'} className="text-[10px]">
              {doneCount}/{totalCount}
            </Tag>
          </div>
          <Button type="text" size="small" icon={<ClearOutlined />}
            onClick={handleClearDone} disabled={doneCount === 0}
            className="text-[10px] text-gray-400">
            清除已完成
          </Button>
        </div>
      )}

      {/* 待办列表 */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {todos.length === 0 ? (
          <Empty description="暂无待办" image={Empty.PRESENTED_IMAGE_SIMPLE} className="mt-6" />
        ) : (
          todos.map((t) => (
            <div key={t.id}
              className={`group flex items-center gap-2 border rounded px-2 py-1.5 transition-colors
                ${t.done ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <Checkbox checked={t.done} onChange={() => handleToggle(t.id)} />
              <span className={`flex-1 text-xs break-all ${t.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {t.text}
              </span>
              <Popconfirm title="删除此待办？" onConfirm={() => handleRemove(t.id)}
                okButtonProps={{ size: 'small' }} cancelButtonProps={{ size: 'small' }}>
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

