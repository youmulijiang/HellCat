import React, { useState, useEffect } from 'react';
import { Modal, Input, Tag, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface BypassListModalProps {
  open: boolean;
  profileName: string;
  bypassList: string[];
  onOk: (list: string[]) => void;
  onCancel: () => void;
}

export const BypassListModal: React.FC<BypassListModalProps> = ({
  open, profileName, bypassList, onOk, onCancel,
}) => {
  const [list, setList] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (open) setList([...bypassList]);
  }, [open, bypassList]);

  const handleAdd = () => {
    const val = inputValue.trim();
    if (val && !list.includes(val)) {
      setList(prev => [...prev, val]);
    }
    setInputValue('');
  };

  const handleRemove = (item: string) => {
    setList(prev => prev.filter(i => i !== item));
  };

  return (
    <Modal
      title={`绕过列表 - ${profileName}`}
      open={open}
      onOk={() => onOk(list)}
      onCancel={onCancel}
      width={400}
      destroyOnClose
    >
      <div className="text-xs text-gray-500 mb-2">
        以下域名/IP 将不走代理，直接连接。支持通配符如 *.example.com
      </div>

      <Space.Compact className="w-full mb-3">
        <Input
          size="small"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onPressEnter={handleAdd}
          placeholder="输入域名，如 *.google.com"
        />
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加
        </Button>
      </Space.Compact>

      <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
        {list.length === 0 && (
          <div className="text-xs text-gray-400 py-2">暂无绕过规则</div>
        )}
        {list.map(item => (
          <Tag
            key={item}
            closable
            onClose={() => handleRemove(item)}
            className="text-xs"
          >
            {item}
          </Tag>
        ))}
      </div>

      <div className="mt-3 flex gap-1 flex-wrap">
        <span className="text-[10px] text-gray-400">快速添加：</span>
        {['localhost', '127.0.0.1', '<local>', '*.local', '10.*', '172.16.*', '192.168.*']
          .filter(p => !list.includes(p))
          .map(preset => (
            <Tag
              key={preset}
              className="text-[10px] cursor-pointer hover:border-blue-400"
              onClick={() => setList(prev => [...prev, preset])}
            >
              + {preset}
            </Tag>
          ))}
      </div>
    </Modal>
  );
};

