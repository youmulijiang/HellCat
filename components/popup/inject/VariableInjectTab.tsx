import React, { useState } from 'react';
import { Button, Input, Tooltip, Empty, Popconfirm, message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  PlusOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { InjectVariable } from '@/types/inject';

interface Props {
  variables: InjectVariable[];
  onAdd: (key: string, value: string) => void | Promise<void>;
  onUpdate: (id: string, updates: Partial<Pick<InjectVariable, 'key' | 'value'>>) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
  onFillVariables: () => Promise<void>;
}

export const VariableInjectTab: React.FC<Props> = ({
  variables, onAdd, onUpdate, onRemove, onFillVariables,
}) => {
  const { t } = useTranslation();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = async () => {
    if (!newKey.trim()) {
      message.warning(t('popup.inject.variable.messages.keyRequired'));
      return;
    }
    if (variables.some(v => v.key === newKey.trim())) {
      message.warning(t('popup.inject.variable.messages.keyExists'));
      return;
    }
    try {
      await onAdd(newKey.trim(), newValue);
      setNewKey('');
      setNewValue('');
      message.success(t('popup.inject.variable.messages.added'));
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('common.feedback.saveFailed'));
    }
  };

  const handleFill = async () => {
    if (variables.length === 0) {
      message.warning(t('popup.inject.variable.messages.inputFirst'));
      return;
    }
    try {
      await onFillVariables();
      message.success(t('popup.inject.variable.messages.filled'));
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('common.feedback.saveFailed'));
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* 添加新变量 */}
      <div className="flex items-center gap-2">
        <Input
          placeholder={t('popup.inject.variable.keyPlaceholder')}
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          className="flex-1 text-sm"
        />
        <Input
          placeholder={t('popup.inject.variable.valuePlaceholder')}
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          className="flex-1 text-sm"
        />
        <Tooltip title={t('popup.inject.variable.tooltips.add')}>
          <Button icon={<PlusOutlined />} onClick={() => void handleAdd()} />
        </Tooltip>
      </div>

      {/* 变量列表 */}
      {variables.length === 0 ? (
        <Empty description={t('popup.inject.variable.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-4" />
      ) : (
        <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
          {variables.map(v => (
            <div
              key={v.id}
              className="flex items-center gap-2 rounded border border-gray-100 bg-gray-50 px-2 py-2 hover:border-blue-200 transition-colors"
            >
              <Input
                value={v.key}
                onChange={e => onUpdate(v.id, { key: e.target.value })}
                className="flex-1 font-mono text-sm"
                prefix={<span className="text-xs text-gray-300">{'{{'}</span>}
                suffix={<span className="text-xs text-gray-300">{'}}'}</span>}
              />
              <span className="text-sm text-gray-300">=</span>
              <Input
                value={v.value}
                onChange={e => onUpdate(v.id, { value: e.target.value })}
                className="flex-1 text-sm"
              />
              <Popconfirm
                title={t('popup.inject.variable.confirmDelete')}
                onConfirm={() => onRemove(v.id)}
                okText={t('common.actions.confirm')}
                cancelText={t('common.actions.cancel')}
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </div>
          ))}
        </div>
      )}

      {/* 注入按钮 */}
      <Tooltip title={t('popup.inject.variable.tooltips.fill')}>
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={handleFill}
          block
        >
          {t('popup.inject.variable.fillButton')}
        </Button>
      </Tooltip>

      {/* 说明 */}
      <div className="px-1 text-xs leading-5 text-gray-400">
        <p>
          • {t('popup.inject.variable.help.placeholderUsage')}
          <code className="ml-1 rounded bg-gray-100 px-1">{'{{'}{t('popup.inject.variable.help.examplePlaceholder')}{'}}'}</code>
        </p>
        <p>• {t('popup.inject.variable.help.replaceDescription')}</p>
        <p>• {t('popup.inject.variable.help.supportedElements')}</p>
      </div>
    </div>
  );
};

