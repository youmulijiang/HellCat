import React, { useState } from 'react';
import { Modal, Input } from 'antd';

interface UrlImportModalProps {
  open: boolean;
  onImport: (text: string) => void;
  onCancel: () => void;
}

export const UrlImportModal: React.FC<UrlImportModalProps> = ({
  open,
  onImport,
  onCancel,
}) => {
  const [text, setText] = useState('');

  const handleOk = () => {
    if (text.trim()) {
      onImport(text);
      setText('');
    }
  };

  const handleCancel = () => {
    setText('');
    onCancel();
  };

  const lineCount = text
    .split(/[\n\r]+/)
    .filter((l) => l.trim()).length;

  return (
    <Modal
      title="批量导入URL"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      width={380}
      okText="导入"
      cancelText="取消"
      okButtonProps={{ disabled: lineCount === 0 }}
      destroyOnClose
    >
      <div className="mt-3">
        <Input.TextArea
          placeholder={'每行一个URL，例如:\nexample.com\nhttps://google.com\n192.168.1.1:8080'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          autoFocus
        />
        <div className="text-[10px] text-gray-400 mt-1.5">
          识别到 {lineCount} 个URL，自动补全协议前缀
        </div>
      </div>
    </Modal>
  );
};

