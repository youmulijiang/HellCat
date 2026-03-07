import { create } from 'zustand';
import type {
  CapturedPacket,
  ResponseData,
  RequestViewTab,
  ResponseViewTab,
  HistoryFilterType,
} from '@/types/packet';

interface PacketStoreState {
  /** 所有捕获的数据包 */
  packets: CapturedPacket[];
  /** 当前选中的数据包 ID */
  selectedPacketId: string | null;
  /** 历史面板过滤关键词 */
  filterKeyword: string;
  /** 历史面板过滤类型 */
  filterType: HistoryFilterType;
  /** 请求面板当前视图标签 */
  requestViewTab: RequestViewTab;
  /** 响应面板当前视图标签 */
  responseViewTab: ResponseViewTab;
  /** 请求面板搜索关键词 */
  requestSearchKeyword: string;
  /** 响应面板搜索关键词 */
  responseSearchKeyword: string;
  /** 是否使用 HTTPS */
  useHttps: boolean;
  /** 是否正在转发 */
  isForwarding: boolean;
  /** 是否正在捕获网络请求 */
  isCapturing: boolean;
  /** 是否开启拦截模式 */
  isIntercepting: boolean;
}

interface PacketStoreActions {
  /** 添加数据包 */
  addPacket: (packet: CapturedPacket) => void;
  /** 删除数据包 */
  removePacket: (id: string) => void;
  /** 清空所有数据包 */
  clearPackets: () => void;
  /** 选中数据包 */
  selectPacket: (id: string | null) => void;
  /** 切换数据包星标 */
  toggleStarPacket: (id: string) => void;
  /** 设置过滤关键词 */
  setFilterKeyword: (keyword: string) => void;
  /** 设置过滤类型 */
  setFilterType: (type: HistoryFilterType) => void;
  /** 设置请求视图标签 */
  setRequestViewTab: (tab: RequestViewTab) => void;
  /** 设置响应视图标签 */
  setResponseViewTab: (tab: ResponseViewTab) => void;
  /** 设置请求搜索关键词 */
  setRequestSearchKeyword: (keyword: string) => void;
  /** 设置响应搜索关键词 */
  setResponseSearchKeyword: (keyword: string) => void;
  /** 切换 HTTPS */
  toggleHttps: () => void;
  /** 切换捕获状态 */
  toggleCapturing: () => void;
  /** 切换拦截状态 */
  toggleIntercepting: () => void;
  /** 更新数据包的响应数据 */
  updatePacketResponse: (id: string, response: ResponseData) => void;
  /** 获取当前选中的数据包 */
  getSelectedPacket: () => CapturedPacket | undefined;
  /** 更新数据包状态 */
  updatePacketStatus: (id: string, status: import('@/types/packet').PacketStatus) => void;
  /** 获取所有被拦截（暂停中）的数据包 */
  getInterceptedPackets: () => CapturedPacket[];
}

export const usePacketStore = create<PacketStoreState & PacketStoreActions>((set, get) => ({
  packets: [],
  selectedPacketId: null,
  filterKeyword: '',
  filterType: 'All',
  requestViewTab: 'Pretty',
  responseViewTab: 'Pretty',
  requestSearchKeyword: '',
  responseSearchKeyword: '',
  useHttps: true,
  isForwarding: false,
  isCapturing: true,
  isIntercepting: false,

  addPacket: (packet) =>
    set((state) => ({ packets: [...state.packets, packet] })),

  removePacket: (id) =>
    set((state) => ({
      packets: state.packets.filter((p) => p.id !== id),
      selectedPacketId: state.selectedPacketId === id ? null : state.selectedPacketId,
    })),

  clearPackets: () =>
    set({ packets: [], selectedPacketId: null }),

  selectPacket: (id) =>
    set({ selectedPacketId: id }),

  toggleStarPacket: (id) =>
    set((state) => ({
      packets: state.packets.map((p) =>
        p.id === id ? { ...p, isStarred: !p.isStarred } : p
      ),
    })),

  setFilterKeyword: (keyword) =>
    set({ filterKeyword: keyword }),

  setFilterType: (type) =>
    set({ filterType: type }),

  setRequestViewTab: (tab) =>
    set({ requestViewTab: tab }),

  setResponseViewTab: (tab) =>
    set({ responseViewTab: tab }),

  setRequestSearchKeyword: (keyword) =>
    set({ requestSearchKeyword: keyword }),

  setResponseSearchKeyword: (keyword) =>
    set({ responseSearchKeyword: keyword }),

  toggleHttps: () =>
    set((state) => ({ useHttps: !state.useHttps })),

  toggleCapturing: () =>
    set((state) => ({ isCapturing: !state.isCapturing })),

  toggleIntercepting: () =>
    set((state) => ({ isIntercepting: !state.isIntercepting })),

  updatePacketResponse: (id, response) =>
    set((state) => ({
      packets: state.packets.map((p) =>
        p.id === id ? { ...p, response, status: 'completed' as const } : p
      ),
    })),

  getSelectedPacket: () => {
    const { packets, selectedPacketId } = get();
    return packets.find((p) => p.id === selectedPacketId);
  },

  updatePacketStatus: (id, status) =>
    set((state) => ({
      packets: state.packets.map((p) =>
        p.id === id ? { ...p, status } : p
      ),
    })),

  getInterceptedPackets: () => {
    return get().packets.filter((p) => p.status === 'intercepted');
  },
}));

