import React, { useCallback } from 'react';
import { Button, Checkbox, Space, Tooltip, message } from 'antd';
import {
  UndoOutlined,
  RedoOutlined,
  CopyOutlined,
  SplitCellsOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { usePacketStore } from '@/stores/usePacketStore';

interface RequestToolbarProps {
  onSend?: () => void;
}

/**
 * 请求面板工具栏（内联在 PanelHeader actions 插槽中）
 * 包含 HTTPS 切换、Undo/Redo、Copy、Split View、Send
 */
export const RequestToolbar: React.FC<RequestToolbarProps> = ({ onSend }) => {
  const {
    useHttps,
    toggleHttps,
    getSelectedPacket,
    editedRequestRaw,
    requestEditHistory,
    requestEditIndex,
    requestSplitView,
    undoRequestEdit,
    redoRequestEdit,
    toggleRequestSplitView,
  } = usePacketStore();

  const selectedPacket = getSelectedPacket();
  const canSend = !!selectedPacket || !!editedRequestRaw;
  const canUndo = requestEditIndex > 0;
  const canRedo = requestEditIndex < requestEditHistory.length - 1;

  /** 复制当前请求内容到剪贴板 */
  const handleCopy = useCallback(async () => {
    const content = editedRequestRaw ?? '';
    if (!content) {
      message.warning('没有可复制的内容');
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  }, [editedRequestRaw]);

  return (
    <Space size={2} className="flex items-center">
      <Checkbox checked={useHttps} onChange={toggleHttps} className="mr-1">
        <span style={{ fontSize: 12 }}>HTTPS</span>
      </Checkbox>

      <Tooltip title="Undo" mouseEnterDelay={0.5}>
        <Button
          type="text"
          size="small"
          icon={<UndoOutlined />}
          disabled={!canUndo}
          onClick={undoRequestEdit}
        />
      </Tooltip>
      <Tooltip title="Redo" mouseEnterDelay={0.5}>
        <Button
          type="text"
          size="small"
          icon={<RedoOutlined />}
          disabled={!canRedo}
          onClick={redoRequestEdit}
        />
      </Tooltip>

      <Tooltip title="Copy to clipboard" mouseEnterDelay={0.5}>
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          onClick={handleCopy}
        />
      </Tooltip>
      <Tooltip title="Toggle split view" mouseEnterDelay={0.5}>
        <Button
          type="text"
          size="small"
          icon={<SplitCellsOutlined />}
          onClick={toggleRequestSplitView}
          style={requestSplitView ? { color: '#1677ff' } : undefined}
        />
      </Tooltip>

      <Button
        type="primary"
        size="small"
        icon={<SendOutlined />}
        disabled={!canSend}
        onClick={onSend}
      >
        Send
      </Button>
    </Space>
  );
};

