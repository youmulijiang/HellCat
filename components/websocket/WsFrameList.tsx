import React, { useEffect, useRef, useMemo } from 'react';
import { Empty } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useWsStore } from '@/stores/useWsStore';

/** 格式化时间戳为 HH:mm:ss.SSS */
function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

/** 格式化字节长度 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/** 截断数据预览 */
function previewData(data: string, maxLen = 120): string {
  if (data.length <= maxLen) return data;
  return data.slice(0, maxLen) + '…';
}

export const WsFrameList: React.FC = () => {
  const selectedConnectionId = useWsStore((s) => s.selectedConnectionId);
  const selectedFrameId = useWsStore((s) => s.selectedFrameId);
  const selectFrame = useWsStore((s) => s.selectFrame);
  const autoScroll = useWsStore((s) => s.autoScroll);
  const frames = useWsStore((s) => s.frames);
  const filter = useWsStore((s) => s.filter);
  const listRef = useRef<HTMLDivElement>(null);

  /** 在组件内计算过滤后的帧列表 */
  const filteredFrames = useMemo(() => {
    if (!selectedConnectionId) return [];
    const all = frames.get(selectedConnectionId) ?? [];
    return all.filter((f) => {
      if (filter.direction !== 'all' && f.direction !== filter.direction) return false;
      if (filter.dataType !== 'all' && f.dataType !== filter.dataType) return false;
      if (filter.searchText && !f.data.toLowerCase().includes(filter.searchText.toLowerCase()))
        return false;
      return true;
    });
  }, [selectedConnectionId, frames, filter]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [filteredFrames.length, autoScroll]);

  if (!selectedConnectionId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-xs">
        请选择一个连接
      </div>
    );
  }

  if (filteredFrames.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description="暂无帧数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div ref={listRef} className="flex flex-col h-full overflow-y-auto">
      {/* 表头 */}
      <div className="flex items-center text-[10px] text-gray-400 font-medium px-3 py-1 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
        <span className="w-6 flex-shrink-0" />
        <span className="w-24 flex-shrink-0">时间</span>
        <span className="flex-1">数据</span>
        <span className="w-16 flex-shrink-0 text-right">大小</span>
      </div>

      {filteredFrames.map((frame) => {
        const isSelected = frame.id === selectedFrameId;
        const isSent = frame.direction === 'sent';

        return (
          <div
            key={frame.id}
            className={`
              flex items-start px-3 py-1.5 cursor-pointer border-b border-gray-50
              transition-colors duration-100
              ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
              ${isSent ? 'bg-green-50/30' : 'bg-red-50/30'}
            `}
            onClick={() => selectFrame(frame.id)}
          >
            {/* 方向图标 */}
            <span className="w-6 flex-shrink-0 pt-0.5">
              {isSent ? (
                <ArrowUpOutlined className="text-green-500 text-[10px]" />
              ) : (
                <ArrowDownOutlined className="text-red-500 text-[10px]" />
              )}
            </span>

            {/* 时间 */}
            <span className="w-24 flex-shrink-0 text-[10px] text-gray-400 font-mono pt-0.5">
              {formatTimestamp(frame.timestamp)}
            </span>

            {/* 数据预览 */}
            <span className="flex-1 text-xs font-mono text-gray-600 break-all min-w-0 leading-relaxed">
              {previewData(frame.data)}
            </span>

            {/* 大小 */}
            <span className="w-16 flex-shrink-0 text-right text-[10px] text-gray-400 pt-0.5">
              {formatSize(frame.length)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

