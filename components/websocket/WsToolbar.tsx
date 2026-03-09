import React from 'react';
import { Button, Input, Select, Switch, Tooltip } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ClearOutlined,
  DeleteOutlined,
  VerticalAlignBottomOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useWsStore } from '@/stores/useWsStore';
import { useWebSocket } from '@/hooks/useWebSocket';

const DIRECTION_OPTIONS = [
  { label: '全部方向', value: 'all' },
  { label: '↑ 发送', value: 'sent' },
  { label: '↓ 接收', value: 'received' },
];

const DATA_TYPE_OPTIONS = [
  { label: '全部类型', value: 'all' },
  { label: 'Text', value: 'text' },
  { label: 'Binary', value: 'binary' },
];

export const WsToolbar: React.FC = () => {
  const { isMonitoring, isIntercepting, toggleMonitor, toggleIntercept, clearAll } = useWebSocket();
  const filter = useWsStore((s) => s.filter);
  const setFilter = useWsStore((s) => s.setFilter);
  const autoScroll = useWsStore((s) => s.autoScroll);
  const setAutoScroll = useWsStore((s) => s.setAutoScroll);
  const selectedConnectionId = useWsStore((s) => s.selectedConnectionId);
  const clearFrames = useWsStore((s) => s.clearFrames);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 bg-gray-50/80">
      {/* 监控开关 */}
      <Tooltip title={isMonitoring ? '停止监控' : '开始监控'}>
        <Button
          type={isMonitoring ? 'primary' : 'default'}
          danger={isMonitoring}
          size="small"
          icon={isMonitoring ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={toggleMonitor}
        >
          {isMonitoring ? '停止' : '监控'}
        </Button>
      </Tooltip>

      {/* 拦截开关 */}
      <Tooltip title={isIntercepting ? '关闭拦截' : '开启拦截（拦截出/入站 WS 帧）'}>
        <Button
          type={isIntercepting ? 'primary' : 'default'}
          danger={isIntercepting}
          size="small"
          icon={<ApiOutlined />}
          onClick={toggleIntercept}
          disabled={!isMonitoring}
        >
          {isIntercepting ? '拦截中' : '拦截'}
        </Button>
      </Tooltip>

      <div className="w-px h-4 bg-gray-300" />

      {/* 过滤器 */}
      <Select
        size="small"
        value={filter.direction}
        options={DIRECTION_OPTIONS}
        onChange={(v) => setFilter({ direction: v as typeof filter.direction })}
        className="w-24"
      />

      <Select
        size="small"
        value={filter.dataType}
        options={DATA_TYPE_OPTIONS}
        onChange={(v) => setFilter({ dataType: v as typeof filter.dataType })}
        className="w-24"
      />

      <Input
        size="small"
        placeholder="搜索内容..."
        value={filter.searchText}
        onChange={(e) => setFilter({ searchText: e.target.value })}
        allowClear
        className="w-40"
      />

      <div className="flex-1" />

      {/* 自动滚动 */}
      <Tooltip title="自动滚动到最新">
        <div className="flex items-center gap-1">
          <VerticalAlignBottomOutlined
            className={`text-xs ${autoScroll ? 'text-blue-500' : 'text-gray-400'}`}
          />
          <Switch
            size="small"
            checked={autoScroll}
            onChange={setAutoScroll}
          />
        </div>
      </Tooltip>

      <div className="w-px h-4 bg-gray-300" />

      {/* 清空按钮 */}
      <Tooltip title="清空当前连接帧">
        <Button
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          disabled={!selectedConnectionId}
          onClick={() => selectedConnectionId && clearFrames(selectedConnectionId)}
        />
      </Tooltip>

      <Tooltip title="清空全部">
        <Button
          type="text"
          size="small"
          icon={<ClearOutlined />}
          onClick={clearAll}
        />
      </Tooltip>
    </div>
  );
};

