import React, { useMemo } from 'react';
import { Button, Tabs, message } from 'antd';
import { CopyOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useWsStore } from '@/stores/useWsStore';

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
  const selectedFrameId = useWsStore((s) => s.selectedFrameId);
  const selectedConnectionId = useWsStore((s) => s.selectedConnectionId);
  const frames = useWsStore((s) => s.frames);

  const frame = useMemo(() => {
    if (!selectedConnectionId || !selectedFrameId) return null;
    const connectionFrames = frames.get(selectedConnectionId) ?? [];
    return connectionFrames.find((f) => f.id === selectedFrameId) ?? null;
  }, [selectedConnectionId, selectedFrameId, frames]);

  if (!frame) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-xs">
        选择一个帧查看详情
      </div>
    );
  }

  const { formatted, isJson } = tryFormatJson(frame.data);
  const hexView = toHexView(frame.data);
  const isSent = frame.direction === 'sent';

  const handleCopy = () => {
    navigator.clipboard.writeText(frame.data).then(() => message.success('已复制'));
  };

  const tabItems = [
    {
      key: 'data',
      label: isJson ? 'JSON' : '数据',
      children: (
        <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-all p-3 m-0 overflow-y-auto h-full bg-gray-50/50">
          {formatted}
        </pre>
      ),
    },
    {
      key: 'raw',
      label: 'Raw',
      children: (
        <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-all p-3 m-0 overflow-y-auto h-full bg-gray-50/50">
          {frame.data}
        </pre>
      ),
    },
    {
      key: 'hex',
      label: 'Hex',
      children: (
        <pre className="text-xs font-mono text-gray-700 whitespace-pre p-3 m-0 overflow-auto h-full bg-gray-50/50">
          {hexView}
        </pre>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 帧信息头 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2 text-xs">
          {isSent ? (
            <ArrowUpOutlined className="text-green-500" />
          ) : (
            <ArrowDownOutlined className="text-red-500" />
          )}
          <span className="text-gray-500">
            {isSent ? '发送' : '接收'} · {frame.dataType} · opcode:{frame.opcode} · {frame.length}B
          </span>
        </div>
        <Button type="text" size="small" icon={<CopyOutlined />} onClick={handleCopy}>
          复制
        </Button>
      </div>

      {/* 内容标签页 */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          size="small"
          items={tabItems}
          className="h-full [&_.ant-tabs-content]:h-[calc(100%-32px)] [&_.ant-tabs-tabpane]:h-full"
          tabBarStyle={{ margin: '0 12px', marginBottom: 0 }}
        />
      </div>
    </div>
  );
};

