import React, { useMemo } from 'react';
import { usePacketStore } from '@/stores/usePacketStore';
import { HistoryToolbar } from './HistoryToolbar';
import { HistoryListItem } from './HistoryListItem';

interface HistoryPanelProps {
  onForward: (packetId: string) => void;
  onDrop: (packetId: string) => void;
}

/**
 * 历史面板
 * 左侧面板，展示捕获的数据包列表
 */
export const HistoryPanel: React.FC<HistoryPanelProps> = ({ onForward, onDrop }) => {
  const {
    packets,
    selectedPacketId,
    filterKeyword,
    filterType,
    selectPacket,
    toggleStarPacket,
  } = usePacketStore();

  /** 根据过滤条件筛选数据包 */
  const filteredPackets = useMemo(() => {
    let result = packets;

    // 按类型过滤
    switch (filterType) {
      case 'Starred':
        result = result.filter((p) => p.isStarred);
        break;
      case 'Commented':
        result = result.filter((p) => p.comment.length > 0);
        break;
      case 'Highlighted':
        result = result.filter((p) => p.isHighlighted);
        break;
    }

    // 按关键词过滤
    if (filterKeyword.trim()) {
      const keyword = filterKeyword.toLowerCase();
      result = result.filter(
        (p) =>
          p.request.url.toLowerCase().includes(keyword) ||
          p.host.toLowerCase().includes(keyword) ||
          p.path.toLowerCase().includes(keyword) ||
          p.request.method.toLowerCase().includes(keyword)
      );
    }

    return result;
  }, [packets, filterKeyword, filterType]);

  return (
    <div className="flex flex-col h-full bg-white">
      <HistoryToolbar onForwardAll={onForward} onDropAll={onDrop} />

      {/* 数据包列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredPackets.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-xs">
            No captured packets
          </div>
        ) : (
          filteredPackets.map((packet) => (
            <HistoryListItem
              key={packet.id}
              packet={packet}
              isSelected={packet.id === selectedPacketId}
              onSelect={selectPacket}
              onToggleStar={toggleStarPacket}
              onForward={onForward}
              onDrop={onDrop}
            />
          ))
        )}
      </div>
    </div>
  );
};

