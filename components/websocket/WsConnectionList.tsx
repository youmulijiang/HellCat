import React from 'react';
import { Badge, Empty, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useWsStore } from '@/stores/useWsStore';
import type { WsConnection } from '@/types/websocket';

/** 格式化时间 */
function formatTime(ts: number, locale: string): string {
  return new Date(ts).toLocaleTimeString(locale, { hour12: false });
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

function getStatusLabel(t: ReturnType<typeof useTranslation>['t'], status: WsConnection['status']): string {
  switch (status) {
    case 'connecting':
      return t('devtools.websocket.connectionList.status.connecting');
    case 'open':
      return t('devtools.websocket.connectionList.status.open');
    case 'closed':
      return t('devtools.websocket.connectionList.status.closed');
    case 'error':
      return t('devtools.websocket.connectionList.status.error');
  }
}

export const WsConnectionList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const connections = useWsStore((s) => s.connections);
  const selectedConnectionId = useWsStore((s) => s.selectedConnectionId);
  const selectConnection = useWsStore((s) => s.selectConnection);

  if (connections.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description={t('devtools.websocket.connectionList.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
                <span>{formatTime(conn.createdAt, i18n.resolvedLanguage ?? i18n.language)}</span>
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
              {getStatusLabel(t, conn.status)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

