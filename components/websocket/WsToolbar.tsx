import React from 'react';
import { Button, Input, Select, Switch, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
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

export const WsToolbar: React.FC = () => {
  const { t } = useTranslation();
  const { isMonitoring, isIntercepting, toggleMonitor, toggleIntercept, clearAll } = useWebSocket();
  const filter = useWsStore((s) => s.filter);
  const setFilter = useWsStore((s) => s.setFilter);
  const autoScroll = useWsStore((s) => s.autoScroll);
  const setAutoScroll = useWsStore((s) => s.setAutoScroll);
  const selectedConnectionId = useWsStore((s) => s.selectedConnectionId);
  const clearFrames = useWsStore((s) => s.clearFrames);

  const directionOptions = [
    { label: t('devtools.websocket.toolbar.filters.allDirections'), value: 'all' },
    { label: t('devtools.websocket.toolbar.filters.sent'), value: 'sent' },
    { label: t('devtools.websocket.toolbar.filters.received'), value: 'received' },
  ];

  const dataTypeOptions = [
    { label: t('devtools.websocket.toolbar.filters.allTypes'), value: 'all' },
    { label: t('devtools.websocket.toolbar.filters.text'), value: 'text' },
    { label: t('devtools.websocket.toolbar.filters.binary'), value: 'binary' },
  ];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 bg-gray-50/80">
      {/* 监控开关 */}
      <Tooltip title={isMonitoring ? t('devtools.websocket.toolbar.tooltips.stopMonitor') : t('devtools.websocket.toolbar.tooltips.startMonitor')}>
        <Button
          type={isMonitoring ? 'primary' : 'default'}
          danger={isMonitoring}
          size="small"
          icon={isMonitoring ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={toggleMonitor}
        >
          {isMonitoring ? t('common.actions.stop') : t('devtools.websocket.toolbar.buttons.monitor')}
        </Button>
      </Tooltip>

      {/* 拦截开关 */}
      <Tooltip title={isIntercepting ? t('devtools.websocket.toolbar.tooltips.stopIntercept') : t('devtools.websocket.toolbar.tooltips.startIntercept')}>
        <Button
          type={isIntercepting ? 'primary' : 'default'}
          danger={isIntercepting}
          size="small"
          icon={<ApiOutlined />}
          onClick={toggleIntercept}
          disabled={!isMonitoring}
        >
          {isIntercepting ? t('devtools.websocket.toolbar.buttons.intercepting') : t('devtools.websocket.toolbar.buttons.intercept')}
        </Button>
      </Tooltip>

      <div className="w-px h-4 bg-gray-300" />

      {/* 过滤器 */}
      <Select
        size="small"
        value={filter.direction}
          options={directionOptions}
        onChange={(v) => setFilter({ direction: v as typeof filter.direction })}
        className="w-24"
      />

      <Select
        size="small"
        value={filter.dataType}
          options={dataTypeOptions}
        onChange={(v) => setFilter({ dataType: v as typeof filter.dataType })}
        className="w-24"
      />

      <Input
        size="small"
        placeholder={t('devtools.websocket.toolbar.filters.searchPlaceholder')}
        value={filter.searchText}
        onChange={(e) => setFilter({ searchText: e.target.value })}
        allowClear
        className="w-40"
      />

      <div className="flex-1" />

      {/* 自动滚动 */}
      <Tooltip title={t('devtools.websocket.toolbar.tooltips.autoScroll')}>
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
      <Tooltip title={t('devtools.websocket.toolbar.tooltips.clearCurrentFrames')}>
        <Button
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          disabled={!selectedConnectionId}
          onClick={() => selectedConnectionId && clearFrames(selectedConnectionId)}
        />
      </Tooltip>

      <Tooltip title={t('devtools.websocket.toolbar.tooltips.clearAll')}>
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

