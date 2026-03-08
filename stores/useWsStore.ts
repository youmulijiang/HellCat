import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  WsConnection,
  WsFrame,
  WsFrameFilter,
  WsFrameDirection,
  WsFrameDataType,
} from '@/types/websocket';

interface WsStoreState {
  /** 所有 WebSocket 连接 */
  connections: WsConnection[];
  /** 所有帧（按连接 ID 分组存储） */
  frames: Map<string, WsFrame[]>;
  /** 当前选中的连接 ID */
  selectedConnectionId: string | null;
  /** 当前选中的帧 ID */
  selectedFrameId: string | null;
  /** 帧过滤器 */
  filter: WsFrameFilter;
  /** 是否正在监控 */
  isMonitoring: boolean;
  /** 是否自动滚动到最新帧 */
  autoScroll: boolean;

  // ─── Actions ─────────────────────────────

  /** 添加新连接 */
  addConnection: (requestId: string, url: string, initiator?: string) => void;
  /** 关闭连接 */
  closeConnection: (requestId: string) => void;
  /** 添加帧 */
  addFrame: (
    connectionId: string,
    direction: WsFrameDirection,
    data: string,
    opcode: number,
    mask: boolean,
    timestamp: number,
  ) => void;
  /** 选择连接 */
  selectConnection: (id: string | null) => void;
  /** 选择帧 */
  selectFrame: (id: string | null) => void;
  /** 更新过滤器 */
  setFilter: (filter: Partial<WsFrameFilter>) => void;
  /** 设置监控状态 */
  setMonitoring: (active: boolean) => void;
  /** 设置自动滚动 */
  setAutoScroll: (auto: boolean) => void;
  /** 清空所有数据 */
  clearAll: () => void;
  /** 清空指定连接的帧 */
  clearFrames: (connectionId: string) => void;
  /** 获取当前连接的过滤后帧列表 */
  getFilteredFrames: () => WsFrame[];
}

const DEFAULT_FILTER: WsFrameFilter = {
  direction: 'all',
  searchText: '',
  dataType: 'all',
};

export const useWsStore = create<WsStoreState>((set, get) => ({
  connections: [],
  frames: new Map(),
  selectedConnectionId: null,
  selectedFrameId: null,
  filter: { ...DEFAULT_FILTER },
  isMonitoring: false,
  autoScroll: true,

  addConnection: (requestId, url, initiator) => {
    set((state) => ({
      connections: [
        ...state.connections,
        {
          requestId,
          url,
          status: 'open',
          createdAt: Date.now(),
          sentCount: 0,
          receivedCount: 0,
          initiator,
        },
      ],
    }));
  },

  closeConnection: (requestId) => {
    set((state) => ({
      connections: state.connections.map((c) =>
        c.requestId === requestId
          ? { ...c, status: 'closed' as const, closedAt: Date.now() }
          : c,
      ),
    }));
  },

  addFrame: (connectionId, direction, data, opcode, mask, timestamp) => {
    const frame: WsFrame = {
      id: nanoid(8),
      connectionId,
      direction,
      data,
      dataType: opcode === 2 ? 'binary' : 'text',
      timestamp: timestamp * 1000, // CDP timestamp is in seconds
      length: new Blob([data]).size,
      opcode,
      mask,
    };

    set((state) => {
      const newFrames = new Map(state.frames);
      const existing = newFrames.get(connectionId) ?? [];
      newFrames.set(connectionId, [...existing, frame]);

      // 更新连接计数
      const connections = state.connections.map((c) => {
        if (c.requestId !== connectionId) return c;
        return direction === 'sent'
          ? { ...c, sentCount: c.sentCount + 1 }
          : { ...c, receivedCount: c.receivedCount + 1 };
      });

      return { frames: newFrames, connections };
    });
  },

  selectConnection: (id) => set({ selectedConnectionId: id, selectedFrameId: null }),
  selectFrame: (id) => set({ selectedFrameId: id }),
  setFilter: (partial) => set((s) => ({ filter: { ...s.filter, ...partial } })),
  setMonitoring: (active) => set({ isMonitoring: active }),
  setAutoScroll: (auto) => set({ autoScroll: auto }),

  clearAll: () =>
    set({
      connections: [],
      frames: new Map(),
      selectedConnectionId: null,
      selectedFrameId: null,
    }),

  clearFrames: (connectionId) =>
    set((state) => {
      const newFrames = new Map(state.frames);
      newFrames.delete(connectionId);
      return { frames: newFrames, selectedFrameId: null };
    }),

  getFilteredFrames: () => {
    const { selectedConnectionId, frames, filter } = get();
    if (!selectedConnectionId) return [];
    const all = frames.get(selectedConnectionId) ?? [];
    return all.filter((f) => {
      if (filter.direction !== 'all' && f.direction !== filter.direction) return false;
      if (filter.dataType !== 'all' && f.dataType !== filter.dataType) return false;
      if (filter.searchText && !f.data.toLowerCase().includes(filter.searchText.toLowerCase()))
        return false;
      return true;
    });
  },
}));

