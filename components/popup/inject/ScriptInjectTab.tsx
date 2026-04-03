import React, { useState } from 'react';
import { Button, Switch, Tooltip, Empty, Popconfirm, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    const presetLabel = t(preset.labelKey);

    // 检查是否已存在同名脚本
    if (scripts.some(s => s.name === presetLabel || s.code === preset.code)) {
      message.warning(t('popup.inject.script.messages.presetExists', { name: presetLabel }));
      return;
    }
    try {
      await onAdd(presetLabel, preset.code);
      message.success(t('popup.inject.script.messages.presetAdded', { name: presetLabel }));
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('popup.inject.script.messages.presetAddFailed'));
    }
  };

  const presetMenuItems: MenuProps['items'] = PRESET_SCRIPTS.map(p => ({
    key: p.key,
    label: (
      <div className="flex flex-col py-0.5">
        <span className="text-xs font-medium">{t(p.labelKey)}</span>
        <span className="text-[10px] text-gray-400 leading-tight">{t(p.descriptionKey)}</span>
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
      message.success(t('common.feedback.saveSuccess'));
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('common.feedback.saveFailed'));
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
      message.error(err instanceof Error ? err.message : t('popup.inject.script.messages.toggleFailed'));
    } finally {
      setPendingToggleIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleInjectAll = async () => {
    const enabledCount = scripts.filter(s => s.enabled).length;
    if (enabledCount === 0) {
      message.warning(t('popup.inject.script.messages.noEnabledScripts'));
      return;
    }
    const result = await onInjectAll();
    if (result.failed === 0) {
      message.success(t('popup.inject.script.messages.injectedAll', { count: result.success }));
    } else {
      message.warning(t('popup.inject.script.messages.injectedPartial', {
        success: result.success,
        failed: result.failed,
      }));
    }
  };

  const handleRunSingle = async (script: InjectScript) => {
    const result = await onInjectSingle(script.code);
    if (result.ok) {
      message.success(t('popup.inject.script.messages.runSuccess', { name: script.name }));
    } else {
      message.error(t('popup.inject.script.messages.runFailed', {
        error: result.error || t('common.status.unknown'),
      }));
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{t('popup.inject.script.listTitle', { count: scripts.length })}</span>
        <div className="flex items-center gap-1">
          <Tooltip title={t('popup.inject.script.tooltips.injectAll')}>
            <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={handleInjectAll}>
              {t('common.actions.inject')}
            </Button>
          </Tooltip>
          <Dropdown
            menu={{ items: presetMenuItems, onClick: ({ key }) => void handleImportPreset(String(key)) }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Tooltip title={t('popup.inject.script.tooltips.presets')}>
              <Button size="small" icon={<AppstoreAddOutlined />} />
            </Tooltip>
          </Dropdown>
          <Tooltip title={t('popup.inject.script.tooltips.addScript')}>
            <Button size="small" icon={<PlusOutlined />} onClick={handleAdd} />
          </Tooltip>
        </div>
      </div>

      {/* 脚本列表 */}
      {scripts.length === 0 ? (
        <Empty description={t('popup.inject.script.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-6" />
      ) : (
        <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
          {scripts.map(script => (
            <div
              key={script.id}
              className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded border border-gray-100 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Tooltip title={t('popup.inject.script.tooltips.autoRun')} placement="top">
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
                <Tooltip title={t('popup.inject.script.tooltips.run')}>
                  <Button type="text" size="small" icon={<PlayCircleOutlined />} onClick={() => handleRunSingle(script)} />
                </Tooltip>
                <Tooltip title={t('popup.inject.script.tooltips.edit')}>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(script)} />
                </Tooltip>
                <Popconfirm
                  title={t('popup.inject.script.confirmDelete')}
                  onConfirm={() => onRemove(script.id)}
                  okText={t('common.actions.confirm')}
                  cancelText={t('common.actions.cancel')}
                >
                  <Tooltip title={t('popup.inject.script.tooltips.delete')}>
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

