import React, { useState } from 'react';
import { Button, Switch, Tooltip, Empty, Popconfirm, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
  AppstoreAddOutlined,
} from '@ant-design/icons';
import type { InjectScript } from '@/types/inject';
import { ScriptEditModal } from './ScriptEditModal';
import { PRESET_SCRIPTS } from './presetScripts';

interface Props {
  scripts: InjectScript[];
  onAdd: (name: string, code: string) => void | Promise<void>;
  onUpdate: (id: string, updates: Partial<Pick<InjectScript, 'name' | 'code' | 'enabled'>>) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
  onToggle: (id: string) => void | Promise<void>;
  onInjectAll: () => Promise<{ success: number; failed: number }>;
  onInjectSingle: (code: string) => Promise<{ ok: boolean; error?: string }>;
}

export const ScriptInjectTab: React.FC<Props> = ({
  scripts, onAdd, onUpdate, onRemove, onToggle, onInjectAll, onInjectSingle,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<InjectScript | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingToggleIds, setPendingToggleIds] = useState<string[]>([]);

  const handleAdd = () => {
    setEditingScript(null);
    setModalOpen(true);
  };

  /** 导入预设脚本 */
  const handleImportPreset = async (key: string) => {
    const preset = PRESET_SCRIPTS.find(p => p.key === key);
    if (!preset) return;
    // 检查是否已存在同名脚本
    if (scripts.some(s => s.name === preset.label)) {
      message.warning(`脚本「${preset.label}」已存在`);
      return;
    }
    try {
      await onAdd(preset.label, preset.code);
      message.success(`已添加预设脚本: ${preset.label}`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '添加预设失败');
    }
  };

  const presetMenuItems: MenuProps['items'] = PRESET_SCRIPTS.map(p => ({
    key: p.key,
    label: (
      <div className="flex flex-col py-0.5">
        <span className="text-xs font-medium">{p.label}</span>
        <span className="text-[10px] text-gray-400 leading-tight">{p.description}</span>
      </div>
    ),
  }));

  const handleEdit = (script: InjectScript) => {
    setEditingScript(script);
    setModalOpen(true);
  };

  const handleSave = async (name: string, code: string) => {
    setSaving(true);
    try {
      if (editingScript) {
        await onUpdate(editingScript.id, { name, code });
      } else {
        await onAdd(name, code);
      }
      setModalOpen(false);
      message.success('已保存');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    if (pendingToggleIds.includes(id)) return;

    setPendingToggleIds(prev => [...prev, id]);
    try {
      await onToggle(id);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '切换自动注入状态失败');
    } finally {
      setPendingToggleIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleInjectAll = async () => {
    const enabledCount = scripts.filter(s => s.enabled).length;
    if (enabledCount === 0) {
      message.warning('没有启用的脚本');
      return;
    }
    const result = await onInjectAll();
    if (result.failed === 0) {
      message.success(`已注入 ${result.success} 个脚本`);
    } else {
      message.warning(`成功 ${result.success} 个，失败 ${result.failed} 个`);
    }
  };

  const handleRunSingle = async (script: InjectScript) => {
    const result = await onInjectSingle(script.code);
    if (result.ok) {
      message.success(`已执行: ${script.name}`);
    } else {
      message.error(`执行失败: ${result.error || '未知错误'}`);
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">脚本列表 ({scripts.length})</span>
        <div className="flex items-center gap-1">
          <Tooltip title="注入所有启用的脚本">
            <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={handleInjectAll}>
              注入
            </Button>
          </Tooltip>
          <Dropdown
            menu={{ items: presetMenuItems, onClick: ({ key }) => void handleImportPreset(key) }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Tooltip title="预设脚本">
              <Button size="small" icon={<AppstoreAddOutlined />} />
            </Tooltip>
          </Dropdown>
          <Tooltip title="添加脚本">
            <Button size="small" icon={<PlusOutlined />} onClick={handleAdd} />
          </Tooltip>
        </div>
      </div>

      {/* 脚本列表 */}
      {scripts.length === 0 ? (
        <Empty description="暂无脚本" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-6" />
      ) : (
        <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
          {scripts.map(script => (
            <div
              key={script.id}
              className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded border border-gray-100 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Tooltip title="自动执行脚本" placement="top">
                  <Switch
                    size="small"
                    checked={script.enabled}
                    loading={pendingToggleIds.includes(script.id)}
                    onChange={() => void handleToggle(script.id)}
                  />
                </Tooltip>
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
        confirmLoading={saving}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};

