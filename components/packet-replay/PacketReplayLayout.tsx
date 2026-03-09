import React, { useState, useCallback } from 'react';
import { HistoryPanel } from './history-panel/HistoryPanel';
import { RequestPanel } from './request-panel/RequestPanel';
import { ResponsePanel } from './response-panel/ResponsePanel';
import { useNetworkCapture } from '@/hooks/useNetworkCapture';

/** 面板最小宽度（px） */
const MIN_PANEL_WIDTH = 150;

/**
 * 抓包重放主布局
 * 三栏结构：History | Request | Response
 * 支持拖拽调整面板宽度
 */
export const PacketReplayLayout: React.FC = () => {
  // 初始化网络捕获 & 拦截
  const { forwardRequest, dropRequest, sendRequest } = useNetworkCapture();

  const [historyWidth, setHistoryWidth] = useState(320);
  const [requestWidthRatio, setRequestWidthRatio] = useState(0.5);
  const [dragging, setDragging] = useState<'history' | 'request' | null>(null);

  const handleMouseDown = useCallback(
    (panel: 'history' | 'request') => (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(panel);

      const startX = e.clientX;
      const startHistoryWidth = historyWidth;
      const startRatio = requestWidthRatio;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (panel === 'history') {
          const newWidth = Math.max(
            MIN_PANEL_WIDTH,
            startHistoryWidth + (moveEvent.clientX - startX)
          );
          setHistoryWidth(newWidth);
        } else {
          const rightArea = document.getElementById('packet-right-area');
          if (!rightArea) return;
          const rightRect = rightArea.getBoundingClientRect();
          const relativeX = moveEvent.clientX - rightRect.left;
          const newRatio = Math.min(
            0.8,
            Math.max(0.2, relativeX / rightRect.width)
          );
          setRequestWidthRatio(newRatio);
        }
      };

      const handleMouseUp = () => {
        setDragging(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [historyWidth, requestWidthRatio]
  );

  return (
    <div
      className="flex h-full w-full select-none"
      style={{ cursor: dragging ? 'col-resize' : 'default' }}
    >
      {/* 左侧 History 面板 */}
      <div
        className="shrink-0 border-r border-gray-200 overflow-hidden"
        style={{ width: historyWidth }}
      >
        <HistoryPanel onForward={forwardRequest} onDrop={dropRequest} />
      </div>

      {/* History | Request 分隔条 */}
      <div
        className="w-1 shrink-0 bg-gray-100 hover:bg-blue-300 cursor-col-resize transition-colors"
        onMouseDown={handleMouseDown('history')}
      />

      {/* 右侧区域：Request + Response */}
      <div id="packet-right-area" className="flex flex-1 min-w-0 overflow-hidden">
        {/* Request 面板 */}
        <div
          className="overflow-hidden border-r border-gray-200"
          style={{ width: `${requestWidthRatio * 100}%` }}
        >
          <RequestPanel onSend={sendRequest} />
        </div>

        {/* Request | Response 分隔条 */}
        <div
          className="w-1 shrink-0 bg-gray-100 hover:bg-blue-300 cursor-col-resize transition-colors"
          onMouseDown={handleMouseDown('request')}
        />

        {/* Response 面板 */}
        <div
          className="flex-1 overflow-hidden"
          style={{ width: `${(1 - requestWidthRatio) * 100}%` }}
        >
          <ResponsePanel />
        </div>
      </div>
    </div>
  );
};

