import React, { useMemo, useState } from 'react';
import { Button, Tabs, Tooltip, message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  CopyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SendOutlined,
  EditOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { useWsStore } from '@/stores/useWsStore';
import { useWebSocket } from '@/hooks/useWebSocket';

/** 尝试格式化 JSON */
function tryFormatJson(data: string): { formatted: string; isJson: boolean } {
  try {
    const parsed = JSON.parse(data);
    return { formatted: JSON.stringify(parsed, null, 2), isJson: true };
  } catch {
    return { formatted: data, isJson: false };
  }
}

/** 生成 Hex 视图 */
function toHexView(data: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16);
    const hex = Array.from(chunk)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    const ascii = Array.from(chunk)
      .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.'))
      .join('');
    const offset = i.toString(16).padStart(8, '0');
    lines.push(`${offset}  ${hex.padEnd(48)}  ${ascii}`);
  }
  return lines.join('\n');
}

export const WsFrameDetail: React.FC = () => {
  const { t } = useTranslation();
  const selectedFrameId = useWsStore((s) => s.selectedFrameId);
  const selectedConnectionId = useWsStore((s) => s.selectedConnectionId);
  const frames = useWsStore((s) => s.frames);
  const connections = useWsStore((s) => s.connections);
  const editedFrameData = useWsStore((s) => s.editedFrameData);
  const setEditedFrameData = useWsStore((s) => s.setEditedFrameData);
  const { sendWsMessage } = useWebSocket();
  const [isEditing, setIsEditing] = useState(false);

  const frame = useMemo(() => {
    if (!selectedConnectionId || !selectedFrameId) return null;
    const connectionFrames = frames.get(selectedConnectionId) ?? [];
    return connectionFrames.find((f) => f.id === selectedFrameId) ?? null;
  }, [selectedConnectionId, selectedFrameId, frames]);

  const connection = useMemo(() => {
    if (!selectedConnectionId) return null;
    return connections.find((c) => c.requestId === selectedConnectionId) ?? null;
  }, [selectedConnectionId, connections]);

  if (!frame) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-xs">
        {t('devtools.websocket.frameDetail.empty')}
      </div>
    );
  }

  const currentData = editedFrameData ?? frame.data;
  const { formatted, isJson } = tryFormatJson(currentData);
  const hexView = toHexView(currentData);
  const isSent = frame.direction === 'sent';
  const hasEdited = editedFrameData !== null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentData).then(() => message.success(t('common.feedback.copySuccess')));
  };

  const handleSend = () => {
    if (!connection) {
      message.error(t('devtools.websocket.frameDetail.messages.connectionNotFound'));
      return;
    }
    const dataToSend = editedFrameData ?? frame.data;
    sendWsMessage(connection.url, dataToSend);
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // 退出编辑模式
      setIsEditing(false);
    } else {
      // 进入编辑模式，初始化编辑数据
      if (editedFrameData === null) {
        setEditedFrameData(frame.data);
      }
      setIsEditing(true);
    }
  };

  const handleReset = () => {
    setEditedFrameData(null);
    setIsEditing(false);
  };

  const handleDataChange = (value: string) => {
    setEditedFrameData(value);
  };

  /** 根据是否编辑模式渲染内容 */
  const renderEditableContent = (content: string) => {
    if (isEditing) {
      return (
        <textarea
          className="w-full h-full resize-none border-none outline-none p-3
            text-sm font-mono leading-6 text-gray-700 bg-gray-50/50"
          value={editedFrameData ?? frame.data}
          onChange={(e) => handleDataChange(e.target.value)}
          spellCheck={false}
        />
      );
    }
    return (
      <pre className="m-0 h-full overflow-y-auto bg-gray-50/50 p-3 text-sm font-mono leading-6 text-gray-700 whitespace-pre-wrap break-all">
        {content}
      </pre>
    );
  };

  const tabItems = [
    {
      key: 'data',
      label: isJson ? 'JSON' : t('devtools.websocket.frameDetail.tabs.data'),
      children: renderEditableContent(formatted),
    },
    {
      key: 'raw',
      label: t('devtools.websocket.frameDetail.tabs.raw'),
      children: renderEditableContent(currentData),
    },
    {
      key: 'hex',
      label: t('devtools.websocket.frameDetail.tabs.hex'),
      children: (
        <pre className="m-0 h-full overflow-auto bg-gray-50/50 p-3 text-sm font-mono leading-6 text-gray-700 whitespace-pre">
          {hexView}
        </pre>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 帧信息头 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2 text-sm">
          {isSent ? (
            <ArrowUpOutlined className="text-green-500" />
          ) : (
            <ArrowDownOutlined className="text-red-500" />
          )}
          <span className="text-gray-500">
            {isSent ? t('devtools.websocket.frameDetail.labels.sent') : t('devtools.websocket.frameDetail.labels.received')} · {frame.dataType} · opcode:{frame.opcode} · {frame.length}B
            {hasEdited && <span className="text-orange-500 ml-1">({t('devtools.websocket.frameDetail.labels.edited')})</span>}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip title={isEditing ? t('devtools.websocket.frameDetail.tooltips.exitEdit') : t('devtools.websocket.frameDetail.tooltips.edit')}>
            <Button
              type={isEditing ? 'primary' : 'text'}
              icon={<EditOutlined />}
              onClick={handleToggleEdit}
            />
          </Tooltip>
          {hasEdited && (
            <Tooltip title={t('devtools.websocket.frameDetail.tooltips.resetEdit')}>
              <Button type="text" icon={<UndoOutlined />} onClick={handleReset} />
            </Tooltip>
          )}
          <Tooltip title={t('devtools.websocket.frameDetail.tooltips.copyData')}>
            <Button type="text" icon={<CopyOutlined />} onClick={handleCopy} />
          </Tooltip>
          <Tooltip title={t('devtools.websocket.frameDetail.tooltips.replay')}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!connection}
            >
              {t('devtools.websocket.frameDetail.buttons.send')}
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* 内容标签页 */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          items={tabItems}
          className="h-full [&_.ant-tabs-content]:h-[calc(100%-32px)] [&_.ant-tabs-tabpane]:h-full"
          tabBarStyle={{ margin: '0 12px', marginBottom: 0 }}
        />
      </div>
    </div>
  );
};

