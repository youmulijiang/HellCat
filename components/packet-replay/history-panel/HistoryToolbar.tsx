import React from 'react';
import { Input, Button, Space, Tooltip, Badge } from 'antd';
import {
  DeleteOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  FastForwardOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { usePacketStore } from '@/stores/usePacketStore';

interface HistoryToolbarProps {
  onForwardAll: (packetId: string) => void;
  onDropAll: (packetId: string) => void;
}

/**
 * 历史面板工具栏
 * 包含捕获开关、拦截开关、过滤输入框、操作按钮
 */
export const HistoryToolbar: React.FC<HistoryToolbarProps> = ({ onForwardAll, onDropAll }) => {
  const {
    packets,
    filterKeyword,
    setFilterKeyword,
    clearPackets,
    isCapturing,
    toggleCapturing,
    isIntercepting,
    toggleIntercepting,
    getInterceptedPackets,
  } = usePacketStore();

  const interceptedCount = getInterceptedPackets().length;

  return (
    <div className="border-b border-gray-200 bg-[#fafafa]">
      {/* 第一行：捕获控制 + 拦截控制 */}
      <div className="flex items-center px-2 py-1 gap-1">
        <Tooltip title={isCapturing ? '暂停捕获' : '开始捕获'} mouseEnterDelay={0.3}>
          <Button
            size="small"
            type={isCapturing ? 'primary' : 'default'}
            icon={isCapturing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={toggleCapturing}
          >
            {isCapturing ? 'Capturing' : 'Paused'}
          </Button>
        </Tooltip>

        <Tooltip title={isIntercepting ? '关闭拦截' : '开启拦截'} mouseEnterDelay={0.3}>
          <Button
            size="small"
            type={isIntercepting ? 'primary' : 'default'}
            danger={isIntercepting}
            icon={<StopOutlined />}
            onClick={toggleIntercepting}
          >
            Intercept {isIntercepting ? 'ON' : 'OFF'}
          </Button>
        </Tooltip>

        {/* 拦截模式下显示 Forward / Drop 按钮 */}
        {isIntercepting && interceptedCount > 0 && (
          <>
            <Tooltip title="放行所有拦截的请求" mouseEnterDelay={0.3}>
              <Button
                size="small"
                type="primary"
                icon={<FastForwardOutlined />}
                onClick={() => {
                  const intercepted = getInterceptedPackets();
                  intercepted.forEach((p) => onForwardAll(p.id));
                }}
              >
                Forward ({interceptedCount})
              </Button>
            </Tooltip>
            <Tooltip title="丢弃所有拦截的请求" mouseEnterDelay={0.3}>
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  const intercepted = getInterceptedPackets();
                  intercepted.forEach((p) => onDropAll(p.id));
                }}
              >
                Drop
              </Button>
            </Tooltip>
          </>
        )}

        <div className="ml-auto">
          <Badge count={packets.length} size="small" overflowCount={999}>
            <span className="text-xs text-gray-500 px-1">Packets</span>
          </Badge>
        </div>
      </div>

      {/* 第二行：过滤输入 + 清除按钮 */}
      <div className="flex items-center px-2 py-1 gap-1 border-t border-gray-100">
        <Input
          size="small"
          placeholder="Filter..."
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          allowClear
          className="flex-1"
        />
        <Tooltip title="Clear history" mouseEnterDelay={0.5}>
          <Button type="text" size="small" icon={<DeleteOutlined />} onClick={clearPackets} />
        </Tooltip>
      </div>
    </div>
  );
};

