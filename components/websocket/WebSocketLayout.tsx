import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { WsToolbar } from './WsToolbar';
import { WsConnectionList } from './WsConnectionList';
import { WsFrameList } from './WsFrameList';
import { WsFrameDetail } from './WsFrameDetail';

/** 面板最小宽度 */
const MIN_PANEL_WIDTH = 120;

/**
 * WebSocket 调试主布局
 * 三栏结构：连接列表 | 帧列表 | 帧详情
 * 支持拖拽调整面板宽度
 */
export const WebSocketLayout: React.FC = () => {
  const { t } = useTranslation();
  const [connListWidth, setConnListWidth] = useState(200);
  const [frameListRatio, setFrameListRatio] = useState(0.55);
  const [dragging, setDragging] = useState<'conn' | 'frame' | null>(null);

  const handleMouseDown = useCallback(
    (panel: 'conn' | 'frame') => (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(panel);

      const startX = e.clientX;
      const startConnWidth = connListWidth;
      const startRatio = frameListRatio;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (panel === 'conn') {
          const newWidth = Math.max(
            MIN_PANEL_WIDTH,
            startConnWidth + (moveEvent.clientX - startX),
          );
          setConnListWidth(newWidth);
        } else {
          const rightArea = document.getElementById('ws-right-area');
          if (!rightArea) return;
          const totalWidth = rightArea.offsetWidth;
          const delta = moveEvent.clientX - startX;
          const newRatio = Math.max(0.2, Math.min(0.8, startRatio + delta / totalWidth));
          setFrameListRatio(newRatio);
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
    [connListWidth, frameListRatio],
  );

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工具栏 */}
      <WsToolbar />

      {/* 主内容区 */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* 连接列表 */}
        <div
          className="flex-shrink-0 border-r border-gray-200 overflow-hidden"
          style={{ width: connListWidth }}
        >
          <div className="px-2 py-1 text-[10px] text-gray-400 font-medium bg-gray-50/80 border-b border-gray-100">
            {t('devtools.websocket.layout.connections')}
          </div>
          <div className="h-[calc(100%-24px)] overflow-hidden">
            <WsConnectionList />
          </div>
        </div>

        {/* 连接列表拖拽把手 */}
        <div
          className={`w-1 cursor-col-resize hover:bg-blue-300 transition-colors flex-shrink-0 ${
            dragging === 'conn' ? 'bg-blue-400' : 'bg-transparent'
          }`}
          onMouseDown={handleMouseDown('conn')}
        />

        {/* 右侧区域：帧列表 + 帧详情 */}
        <div id="ws-right-area" className="flex flex-1 min-w-0 overflow-hidden">
          {/* 帧列表 */}
          <div
            className="flex-shrink-0 overflow-hidden border-r border-gray-200"
            style={{ width: `${frameListRatio * 100}%` }}
          >
            <div className="px-2 py-1 text-[10px] text-gray-400 font-medium bg-gray-50/80 border-b border-gray-100">
              {t('devtools.websocket.layout.frames')}
            </div>
            <div className="h-[calc(100%-24px)] overflow-hidden">
              <WsFrameList />
            </div>
          </div>

          {/* 帧列表拖拽把手 */}
          <div
            className={`w-1 cursor-col-resize hover:bg-blue-300 transition-colors flex-shrink-0 ${
              dragging === 'frame' ? 'bg-blue-400' : 'bg-transparent'
            }`}
            onMouseDown={handleMouseDown('frame')}
          />

          {/* 帧详情 */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="px-2 py-1 text-[10px] text-gray-400 font-medium bg-gray-50/80 border-b border-gray-100">
              {t('devtools.websocket.layout.detail')}
            </div>
            <div className="h-[calc(100%-24px)] overflow-hidden">
              <WsFrameDetail />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

