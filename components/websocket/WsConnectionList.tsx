import React from 'react';
import { Badge, Empty, Tooltip } from 'antd';
import { useWsStore } from '@/stores/useWsStore';
import type { WsConnection } from '@/types/websocket';

/** 格式化时间 */
function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour12: false });
}

/** 从 URL 提取简短显示名 */
function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

/** 状态颜色 */
function statusColor(status: WsConnection['status']): string {
  switch (status) {
    case 'open':
      return '#52c41a';
    case 'closed':
      return '#8c8c8c';
    case 'error':
      return '#ff4d4f';
    default:
      return '#faad14';
  }
}

export const WsConnectionList: React.FC = () => {
  const connections = useWsStore((s) => s.connections);
  const selectedConnectionId = useWsStore((s) => s.selectedConnectionId);
  const selectConnection = useWsStore((s) => s.selectConnection);

  if (connections.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description="暂无 WebSocket 连接" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {connections.map((conn) => {
        const isSelected = conn.requestId === selectedConnectionId;
        return (
          <div
            key={conn.requestId}
            className={`
              flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-gray-100
              transition-colors duration-100
              ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50 border-l-2 border-l-transparent'}
            `}
            onClick={() => selectConnection(conn.requestId)}
          >
            {/* 状态指示器 */}
            <Badge color={statusColor(conn.status)} />

            {/* 连接信息 */}
            <div className="flex-1 min-w-0">
              <Tooltip title={conn.url} placement="topLeft">
                <div className="text-xs font-mono text-gray-700 truncate">
                  {shortUrl(conn.url)}
                </div>
              </Tooltip>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                <span>{formatTime(conn.createdAt)}</span>
                <span>↑{conn.sentCount}</span>
                <span>↓{conn.receivedCount}</span>
              </div>
            </div>

            {/* 状态标签 */}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{
                color: statusColor(conn.status),
                backgroundColor: `${statusColor(conn.status)}15`,
              }}
            >
              {conn.status}
            </span>
          </div>
        );
      })}
    </div>
  );
};

