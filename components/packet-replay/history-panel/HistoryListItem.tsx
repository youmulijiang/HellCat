import React from 'react';
import { Tag, Typography, Button, Tooltip } from 'antd';
import { StarFilled, StarOutlined, FastForwardOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { CapturedPacket } from '@/types/packet';

interface HistoryListItemProps {
  packet: CapturedPacket;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
  onForward?: (id: string) => void;
  onDrop?: (id: string) => void;
}

/**
 * 历史记录列表项
 * 展示单条数据包的摘要信息
 */
export const HistoryListItem: React.FC<HistoryListItemProps> = ({
  packet,
  isSelected,
  onSelect,
  onToggleStar,
  onForward,
  onDrop,
}) => {
  const isIntercepted = packet.status === 'intercepted';
  const isDropped = packet.status === 'dropped';
  const isForwarded = packet.status === 'forwarded';
  /** 构建悬浮提示内容 */
  const tooltipContent = (
    <div style={{ maxWidth: 480, wordBreak: 'break-all', fontSize: 12, lineHeight: 1.6 }}>
      <div><strong>URL:</strong> {packet.request.url.length > 50 ? `${packet.request.url.slice(0, 50)}...` : packet.request.url}</div>
      <div><strong>Method:</strong> {packet.request.method}</div>
      {packet.response && (
        <div><strong>Status:</strong> {packet.response.status} {packet.response.statusText}</div>
      )}
      {packet.duration > 0 && (
        <div><strong>Duration:</strong> {packet.duration}ms</div>
      )}
      {packet.response?.contentType && (
        <div><strong>Content-Type:</strong> {packet.response.contentType}</div>
      )}
      {packet.comment && (
        <div><strong>Comment:</strong> {packet.comment}</div>
      )}
    </div>
  );

  return (
    <Tooltip
      title={tooltipContent}
      placement="right"
      mouseEnterDelay={0.5}
      overlayStyle={{ maxWidth: 500 }}
    >
    <div
      className={`
        flex items-center px-2 py-1 cursor-pointer border-b border-gray-100
        text-xs font-mono transition-colors duration-100
        ${isIntercepted ? 'bg-orange-50 border-l-2 border-l-orange-500' : ''}
        ${isDropped ? 'bg-red-50 border-l-2 border-l-red-400 opacity-60' : ''}
        ${isForwarded ? 'bg-green-50 border-l-2 border-l-green-400' : ''}
        ${!isIntercepted && !isDropped && !isForwarded ? (isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50 border-l-2 border-l-transparent') : ''}
      `}
      onClick={() => onSelect(packet.id)}
    >
      {/* 星标按钮 */}
      <span
        className="mr-1.5 shrink-0 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar(packet.id);
        }}
        style={{ color: packet.isStarred ? '#faad14' : '#d9d9d9', fontSize: 12 }}
      >
        {packet.isStarred ? <StarFilled /> : <StarOutlined />}
      </span>

      {/* 方法 */}
      <Tag
        color={getMethodColor(packet.request.method)}
        style={{ fontSize: 10, lineHeight: '16px', marginRight: 4, padding: '0 4px' }}
      >
        {packet.request.method}
      </Tag>

      {/* 状态码 / 拦截标签 */}
      {isIntercepted ? (
        <Tag color="orange" style={{ fontSize: 10, lineHeight: '16px', marginRight: 4, padding: '0 4px' }}>
          PAUSED
        </Tag>
      ) : isDropped ? (
        <Tag color="red" style={{ fontSize: 10, lineHeight: '16px', marginRight: 4, padding: '0 4px' }}>
          DROP
        </Tag>
      ) : isForwarded ? (
        <Tag color="green" style={{ fontSize: 10, lineHeight: '16px', marginRight: 4, padding: '0 4px' }}>
          FWD
        </Tag>
      ) : (
        <Typography.Text
          type={getStatusType(packet.status)}
          style={{ fontSize: 11, width: 28, textAlign: 'center', flexShrink: 0 }}
        >
          {packet.response?.status ?? '—'}
        </Typography.Text>
      )}

      {/* URL 路径 */}
      <Typography.Text
        ellipsis
        className="flex-1 mx-1.5"
        style={{ fontSize: 11 }}
      >
        {packet.host}{packet.path}
      </Typography.Text>

      {/* 拦截操作按钮 / 耗时 */}
      {isIntercepted ? (
        <span className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="放行" mouseEnterDelay={0.3}>
            <Button
              type="primary"
              size="small"
              icon={<FastForwardOutlined />}
              style={{ fontSize: 10, height: 18, width: 18, minWidth: 18 }}
              onClick={() => onForward?.(packet.id)}
            />
          </Tooltip>
          <Tooltip title="丢弃" mouseEnterDelay={0.3}>
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              style={{ fontSize: 10, height: 18, width: 18, minWidth: 18 }}
              onClick={() => onDrop?.(packet.id)}
            />
          </Tooltip>
        </span>
      ) : (
        <Typography.Text type="secondary" style={{ fontSize: 10, flexShrink: 0 }}>
          {packet.duration > 0 ? `${packet.duration}ms` : ''}
        </Typography.Text>
      )}
    </div>
    </Tooltip>
  );
};

function getMethodColor(method: string): string {
  const colorMap: Record<string, string> = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple',
  };
  return colorMap[method] ?? 'default';
}

function getStatusType(status: string): 'success' | 'danger' | 'warning' | 'secondary' {
  const typeMap: Record<string, 'success' | 'danger' | 'warning' | 'secondary'> = {
    completed: 'success',
    error: 'danger',
    pending: 'warning',
    timeout: 'warning',
  };
  return typeMap[status] ?? 'secondary';
}

