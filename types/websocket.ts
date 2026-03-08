/**
 * WebSocket 调试模块类型定义
 */

/** WebSocket 连接状态 */
export type WsConnectionStatus = 'connecting' | 'open' | 'closed' | 'error';

/** WebSocket 帧方向 */
export type WsFrameDirection = 'sent' | 'received';

/** WebSocket 帧数据类型 */
export type WsFrameDataType = 'text' | 'binary';

/** WebSocket 连接信息 */
export interface WsConnection {
  /** CDP requestId */
  requestId: string;
  /** WebSocket URL */
  url: string;
  /** 连接状态 */
  status: WsConnectionStatus;
  /** 创建时间戳 */
  createdAt: number;
  /** 关闭时间戳 */
  closedAt?: number;
  /** 发送帧计数 */
  sentCount: number;
  /** 接收帧计数 */
  receivedCount: number;
  /** initiator 信息（可选） */
  initiator?: string;
}

/** WebSocket 帧 */
export interface WsFrame {
  /** 唯一 ID */
  id: string;
  /** 所属连接的 requestId */
  connectionId: string;
  /** 方向：发送 / 接收 */
  direction: WsFrameDirection;
  /** 数据内容 */
  data: string;
  /** 数据类型 */
  dataType: WsFrameDataType;
  /** 时间戳 */
  timestamp: number;
  /** 数据长度（字节） */
  length: number;
  /** opcode */
  opcode: number;
  /** 是否被标记（mask） */
  mask: boolean;
}

/** WebSocket 帧过滤选项 */
export interface WsFrameFilter {
  /** 方向过滤 */
  direction: 'all' | WsFrameDirection;
  /** 搜索关键词 */
  searchText: string;
  /** 数据类型过滤 */
  dataType: 'all' | WsFrameDataType;
}

