import React from 'react';
import { Button, Checkbox, Divider, Space, Tooltip } from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  UndoOutlined,
  RedoOutlined,
  CopyOutlined,
  SplitCellsOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { usePacketStore } from '@/stores/usePacketStore';

/**
 * 请求面板工具栏
 * 包含编辑操作、HTTPS 切换、Send 按钮等
 */
export const RequestToolbar: React.FC = () => {
  const { useHttps, toggleHttps } = usePacketStore();

  const editActions = [
    { icon: <PlusOutlined />, title: 'Add parameter' },
    { icon: <MinusOutlined />, title: 'Remove parameter' },
    { icon: <UndoOutlined />, title: 'Undo' },
    { icon: <RedoOutlined />, title: 'Redo' },
  ];

  const viewActions = [
    { icon: <CopyOutlined />, title: 'Copy to clipboard' },
    { icon: <SplitCellsOutlined />, title: 'Toggle split view' },
  ];

  return (
    <div className="flex items-center px-2 py-1 border-b border-gray-200 bg-[#fafafa]">
      <Space size={0}>
        {editActions.map(({ icon, title }) => (
          <Tooltip key={title} title={title} mouseEnterDelay={0.5}>
            <Button type="text" size="small" icon={icon} />
          </Tooltip>
        ))}
      </Space>

      <Divider type="vertical" />

      <Checkbox checked={useHttps} onChange={toggleHttps}>
        <span style={{ fontSize: 12 }}>HTTPS</span>
      </Checkbox>

      <Divider type="vertical" />

      <Space size={0}>
        {viewActions.map(({ icon, title }) => (
          <Tooltip key={title} title={title} mouseEnterDelay={0.5}>
            <Button type="text" size="small" icon={icon} />
          </Tooltip>
        ))}
      </Space>

      <Button
        type="primary"
        size="small"
        icon={<SendOutlined />}
        className="ml-auto"
      >
        Send
      </Button>
    </div>
  );
};

