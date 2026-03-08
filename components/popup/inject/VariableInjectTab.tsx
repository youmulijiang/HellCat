import React, { useState } from 'react';
import { Button, Input, Tooltip, Empty, Popconfirm, message } from 'antd';
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
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (!newKey.trim()) {
      message.warning('请输入变量名');
      return;
    }
    if (variables.some(v => v.key === newKey.trim())) {
      message.warning('变量名已存在');
      return;
    }
    onAdd(newKey.trim(), newValue);
    setNewKey('');
    setNewValue('');
    message.success('已添加');
  };

  const handleFill = async () => {
    if (variables.length === 0) {
      message.warning('请先添加变量');
      return;
    }
    await onFillVariables();
    message.success('变量填充完成');
  };

  return (
    <div className="flex flex-col gap-2">
      {/* 添加新变量 */}
      <div className="flex items-center gap-1">
        <Input
          size="small"
          placeholder="变量名"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          className="flex-1"
        />
        <Input
          size="small"
          placeholder="值"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          className="flex-1"
        />
        <Tooltip title="添加变量">
          <Button size="small" icon={<PlusOutlined />} onClick={handleAdd} />
        </Tooltip>
      </div>

      {/* 变量列表 */}
      {variables.length === 0 ? (
        <Empty description="暂无变量" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-4" />
      ) : (
        <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto">
          {variables.map(v => (
            <div
              key={v.id}
              className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded border border-gray-100 hover:border-blue-200 transition-colors"
            >
              <Input
                size="small"
                value={v.key}
                onChange={e => onUpdate(v.id, { key: e.target.value })}
                className="flex-1 font-mono text-xs"
                prefix={<span className="text-gray-300 text-[10px]">{'{{'}</span>}
                suffix={<span className="text-gray-300 text-[10px]">{'}}'}</span>}
              />
              <span className="text-gray-300 text-xs">=</span>
              <Input
                size="small"
                value={v.value}
                onChange={e => onUpdate(v.id, { value: e.target.value })}
                className="flex-1 text-xs"
              />
              <Popconfirm title="确定删除？" onConfirm={() => onRemove(v.id)} okText="确定" cancelText="取消">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </div>
          ))}
        </div>
      )}

      {/* 注入按钮 */}
      <Tooltip title="将页面表单中的 {{变量名}} 替换为对应的值">
        <Button
          type="primary"
          size="small"
          icon={<ThunderboltOutlined />}
          onClick={handleFill}
          block
        >
          变量填充注入
        </Button>
      </Tooltip>

      {/* 说明 */}
      <div className="text-[10px] text-gray-400 leading-4 px-1">
        <p>• 在表单中使用 <code className="bg-gray-100 px-1 rounded">{'{{变量名}}'}</code> 作为占位符</p>
        <p>• 点击"变量填充注入"后，页面表单中匹配的占位符将被替换为对应的值</p>
        <p>• 支持 input、textarea、contenteditable 元素</p>
      </div>
    </div>
  );
};

