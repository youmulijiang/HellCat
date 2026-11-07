import React, { useMemo } from 'react';
import { usePacketStore } from '@/stores/usePacketStore';
import { useTranslation } from 'react-i18next';
import { HistoryToolbar } from './HistoryToolbar';
import { HistoryListItem } from './HistoryListItem';

interface HistoryPanelProps {
  onForward: (packetId: string) => void;
  onDrop: (packetId: string) => void;
}

/** 一次最多渲染的条目数，超出部分提示使用过滤缩小范围（大量节点直接渲染会卡死面板） */
const MAX_RENDERED_ITEMS = 300;

/**
 * 历史面板
 * 左侧面板，展示捕获的数据包列表
 */
export const HistoryPanel: React.FC<HistoryPanelProps> = ({ onForward, onDrop }) => {
  const { t } = useTranslation();
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
          <>
            {filteredPackets.slice(0, MAX_RENDERED_ITEMS).map((packet) => (
              <HistoryListItem
                key={packet.id}
                packet={packet}
                isSelected={packet.id === selectedPacketId}
                onSelect={selectPacket}
                onToggleStar={toggleStarPacket}
                onForward={onForward}
                onDrop={onDrop}
              />
            ))}
            {filteredPackets.length > MAX_RENDERED_ITEMS && (
              <div className="px-3 py-2 text-center text-[10px] text-gray-400">
                {t('devtools.packetReplay.history.renderLimit', {
                  shown: MAX_RENDERED_ITEMS,
                  total: filteredPackets.length,
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

