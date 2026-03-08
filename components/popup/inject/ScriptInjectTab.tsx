import React, { useState } from 'react';
import { Button, Switch, Tooltip, Empty, Popconfirm, message } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { InjectScript } from '@/types/inject';
import { ScriptEditModal } from './ScriptEditModal';

interface Props {
  scripts: InjectScript[];
  onAdd: (name: string, code: string) => void | Promise<void>;
  onUpdate: (id: string, updates: Partial<Pick<InjectScript, 'name' | 'code' | 'enabled'>>) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
  onToggle: (id: string) => void | Promise<void>;
  onInjectAll: () => Promise<void>;
  onInjectSingle: (code: string) => Promise<void>;
}

export const ScriptInjectTab: React.FC<Props> = ({
  scripts, onAdd, onUpdate, onRemove, onToggle, onInjectAll, onInjectSingle,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<InjectScript | null>(null);

  const handleAdd = () => {
    setEditingScript(null);
    setModalOpen(true);
  };

  const handleEdit = (script: InjectScript) => {
    setEditingScript(script);
    setModalOpen(true);
  };

  const handleSave = (name: string, code: string) => {
    if (editingScript) {
      onUpdate(editingScript.id, { name, code });
    } else {
      onAdd(name, code);
    }
    setModalOpen(false);
    message.success('已保存');
  };

  const handleInjectAll = async () => {
    const enabledCount = scripts.filter(s => s.enabled).length;
    if (enabledCount === 0) {
      message.warning('没有启用的脚本');
      return;
    }
    await onInjectAll();
    message.success(`已注入 ${enabledCount} 个脚本`);
  };

  const handleRunSingle = async (script: InjectScript) => {
    await onInjectSingle(script.code);
    message.success(`已执行: ${script.name}`);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">脚本列表 ({scripts.length})</span>
        <div className="flex items-center gap-1">
          <Tooltip title="注入所有启用的脚本">
            <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={handleInjectAll}>
              注入
            </Button>
          </Tooltip>
          <Tooltip title="添加脚本">
            <Button size="small" icon={<PlusOutlined />} onClick={handleAdd} />
          </Tooltip>
        </div>
      </div>

      {/* 脚本列表 */}
      {scripts.length === 0 ? (
        <Empty description="暂无脚本" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-6" />
      ) : (
        <div className="flex flex-col gap-1 max-h-[340px] overflow-y-auto">
          {scripts.map(script => (
            <div
              key={script.id}
              className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded border border-gray-100 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Switch size="small" checked={script.enabled} onChange={() => onToggle(script.id)} />
                <span className="text-xs truncate" title={script.name}>{script.name}</span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Tooltip title="执行">
                  <Button type="text" size="small" icon={<PlayCircleOutlined />} onClick={() => handleRunSingle(script)} />
                </Tooltip>
                <Tooltip title="编辑">
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(script)} />
                </Tooltip>
                <Popconfirm title="确定删除？" onConfirm={() => onRemove(script.id)} okText="确定" cancelText="取消">
                  <Tooltip title="删除">
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      )}

      <ScriptEditModal
        open={modalOpen}
        script={editingScript}
        onSave={handleSave}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};

