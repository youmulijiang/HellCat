import React, { useCallback } from 'react';
import { Input, Checkbox, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

export interface KeyValueItem {
  id: string;
  enabled: boolean;
  key: string;
  value: string;
  description?: string;
}

interface KeyValueEditorProps {
  items: KeyValueItem[];
  onChange: (items: KeyValueItem[]) => void;
  /** 是否显示描述列 */
  showDescription?: boolean;
  /** key 列占位文字 */
  keyPlaceholder?: string;
  /** value 列占位文字 */
  valuePlaceholder?: string;
}

let idCounter = 0;
export const genKvId = () => `kv_${Date.now()}_${++idCounter}`;

/**
 * 键值对编辑器（类似 Postman 的 Params/Headers 编辑表格）
 */
export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  items,
  onChange,
  showDescription = false,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}) => {
  const updateItem = useCallback((id: string, field: keyof KeyValueItem, value: unknown) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }, [items, onChange]);

  const removeItem = useCallback((id: string) => {
    onChange(items.filter((item) => item.id !== id));
  }, [items, onChange]);

  const addItem = useCallback(() => {
    onChange([...items, { id: genKvId(), enabled: true, key: '', value: '', description: '' }]);
  }, [items, onChange]);

  return (
    <div className="flex flex-col text-xs">
      {/* 表头 */}
      <div className="flex items-center gap-1 px-1 py-0.5 bg-gray-50 border-b border-gray-200 text-[10px] text-gray-400 font-medium">
        <div className="w-5" />
        <div className="flex-1 min-w-0">Key</div>
        <div className="flex-1 min-w-0">Value</div>
        {showDescription && <div className="flex-1 min-w-0">Description</div>}
        <div className="w-6" />
      </div>

      {/* 行 */}
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-1 px-1 py-0.5 border-b border-gray-100 hover:bg-blue-50/30 group">
          <Checkbox
            checked={item.enabled}
            onChange={(e) => updateItem(item.id, 'enabled', e.target.checked)}
            className="w-5"
          />
          <Input
            size="small"
            variant="borderless"
            placeholder={keyPlaceholder}
            value={item.key}
            onChange={(e) => updateItem(item.id, 'key', e.target.value)}
            className="flex-1 min-w-0 text-xs"
          />
          <Input
            size="small"
            variant="borderless"
            placeholder={valuePlaceholder}
            value={item.value}
            onChange={(e) => updateItem(item.id, 'value', e.target.value)}
            className="flex-1 min-w-0 text-xs"
          />
          {showDescription && (
            <Input
              size="small"
              variant="borderless"
              placeholder="Description"
              value={item.description ?? ''}
              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
              className="flex-1 min-w-0 text-xs"
            />
          )}
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeItem(item.id)}
            className="w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
          />
        </div>
      ))}

      {/* 添加按钮 */}
      <div className="px-1 py-1">
        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addItem} className="text-xs w-full">
          添加
        </Button>
      </div>
    </div>
  );
};

