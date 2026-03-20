import React, { useState, useCallback } from 'react';
import { HistoryPanel } from './history-panel/HistoryPanel';
import { RequestPanel } from './request-panel/RequestPanel';
import { ResponsePanel } from './response-panel/ResponsePanel';
import { useNetworkCapture } from '@/hooks/useNetworkCapture';
import { usePacketStore } from '@/stores/usePacketStore';

/** 面板最小尺寸（px） */
const MIN_PANEL_SIZE = 150;

/**
 * 抓包重放主布局
 * History | (Request + Response)
 * Request/Response 支持垂直分割（左右）和水平分割（上下）切换
 * 支持拖拽调整面板尺寸
 */
export const PacketReplayLayout: React.FC = () => {
  const { forwardRequest, dropRequest, sendRequest } = useNetworkCapture();
  const requestSplitView = usePacketStore((s) => s.requestSplitView);

  const [historyWidth, setHistoryWidth] = useState(320);
  // 垂直模式下的宽度比例 / 水平模式下的高度比例
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [dragging, setDragging] = useState<'history' | 'split' | null>(null);

  const handleHistoryDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging('history');
      const startX = e.clientX;
      const startWidth = historyWidth;

      const onMove = (ev: MouseEvent) => {
        setHistoryWidth(Math.max(MIN_PANEL_SIZE, startWidth + (ev.clientX - startX)));
      };
      const onUp = () => {
        setDragging(null);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [historyWidth]
  );

  const handleSplitDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging('split');
      const isHorizontal = requestSplitView;
      const container = document.getElementById('packet-right-area');
      if (!container) return;

      const onMove = (ev: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        let ratio: number;
        if (isHorizontal) {
          ratio = (ev.clientY - rect.top) / rect.height;
        } else {
          ratio = (ev.clientX - rect.left) / rect.width;
        }
        setSplitRatio(Math.min(0.8, Math.max(0.2, ratio)));
      };
      const onUp = () => {
        setDragging(null);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [requestSplitView]
  );

  const cursorStyle = dragging
    ? dragging === 'history'
      ? 'col-resize'
      : requestSplitView
        ? 'row-resize'
        : 'col-resize'
    : 'default';

  return (
    <div
      className="flex h-full w-full select-none"
      style={{ cursor: cursorStyle }}
    >
      {/* 左侧 History 面板 */}
      <div
        className="shrink-0 border-r border-gray-200 overflow-hidden"
        style={{ width: historyWidth }}
      >
        <HistoryPanel onForward={forwardRequest} onDrop={dropRequest} />
      </div>

      {/* History | 右侧 分隔条 */}
      <div
        className="w-1 shrink-0 bg-gray-100 hover:bg-blue-300 cursor-col-resize transition-colors"
        onMouseDown={handleHistoryDrag}
      />

      {/* 右侧区域：Request + Response（垂直或水平分割） */}
      <div
        id="packet-right-area"
        className={`flex flex-1 min-w-0 overflow-hidden ${requestSplitView ? 'flex-col' : 'flex-row'}`}
      >
        {/* Request 面板 */}
        <div
          className={`overflow-hidden ${requestSplitView ? 'border-b' : 'border-r'} border-gray-200`}
          style={
            requestSplitView
              ? { height: `${splitRatio * 100}%` }
              : { width: `${splitRatio * 100}%` }
          }
        >
          <RequestPanel onSend={sendRequest} />
        </div>

        {/* Request | Response 分隔条 */}
        <div
          className={`shrink-0 bg-gray-100 hover:bg-blue-300 transition-colors ${
            requestSplitView
              ? 'h-1 cursor-row-resize'
              : 'w-1 cursor-col-resize'
          }`}
          onMouseDown={handleSplitDrag}
        />

        {/* Response 面板 */}
        <div
          className="flex-1 overflow-hidden"
          style={
            requestSplitView
              ? { height: `${(1 - splitRatio) * 100}%` }
              : { width: `${(1 - splitRatio) * 100}%` }
          }
        >
          <ResponsePanel />
        </div>
      </div>
    </div>
  );
};

