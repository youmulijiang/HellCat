import { create } from 'zustand';
import type {
  CapturedPacket,
  RequestData,
  ResponseData,
  RequestViewTab,
  ResponseViewTab,
  HistoryFilterType,
  HttpMethod,
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
  /** 编辑中的请求原始文本（null 表示未编辑） */
  editedRequestRaw: string | null;
  /** 编辑中的响应原始文本（null 表示未编辑） */
  editedResponseRaw: string | null;
  /** 请求编辑历史（状态机）：past + present + future */
  requestEditHistory: string[];
  /** 当前历史指针位置 */
  requestEditIndex: number;
  /** Request/Response 布局方向：false=垂直（左右），true=水平（上下） */
  requestSplitView: boolean;
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
  /** 设置编辑中的请求原始文本 */
  setEditedRequestRaw: (raw: string | null) => void;
  /** 设置编辑中的响应原始文本 */
  setEditedResponseRaw: (raw: string | null) => void;
  /** 将编辑后的请求原始文本解析并应用到选中数据包 */
  applyEditedRequest: () => void;
  /** 将编辑后的响应原始文本解析并应用到选中数据包 */
  applyEditedResponse: () => void;
  /** 将当前编辑内容记录到历史（供编辑回调调用） */
  pushRequestEditSnapshot: (content: string) => void;
  /** 撤销请求编辑 */
  undoRequestEdit: () => void;
  /** 重做请求编辑 */
  redoRequestEdit: () => void;
  /** 切换 Request/Response 布局方向 */
  toggleRequestSplitView: () => void;
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
  editedRequestRaw: null,
  editedResponseRaw: null,
  requestEditHistory: [],
  requestEditIndex: -1,
  requestSplitView: false,

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
    set({ selectedPacketId: id, editedRequestRaw: null, editedResponseRaw: null, requestEditHistory: [], requestEditIndex: -1 }),

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

  setEditedRequestRaw: (raw) => {
    set({ editedRequestRaw: raw });
  },

  setEditedResponseRaw: (raw) =>
    set({ editedResponseRaw: raw }),

  applyEditedRequest: () => {
    const { editedRequestRaw, selectedPacketId, packets } = get();
    if (!editedRequestRaw || !selectedPacketId) return;
    const parsed = parseRawRequest(editedRequestRaw);
    if (!parsed) return;
    set({
      packets: packets.map((p) =>
        p.id === selectedPacketId ? { ...p, request: parsed } : p
      ),
    });
  },

  pushRequestEditSnapshot: (content) => {
    const { requestEditHistory, requestEditIndex } = get();
    // 丢弃当前指针之后的 future 快照
    const trimmed = requestEditHistory.slice(0, requestEditIndex + 1);
    const next = [...trimmed, content];
    // 最多保留 10 步历史
    const MAX_HISTORY = 10;
    if (next.length > MAX_HISTORY) {
      next.splice(0, next.length - MAX_HISTORY);
    }
    set({ requestEditHistory: next, requestEditIndex: next.length - 1 });
  },

  undoRequestEdit: () => {
    const { requestEditHistory, requestEditIndex } = get();
    if (requestEditIndex <= 0) return;
    const newIndex = requestEditIndex - 1;
    set({ editedRequestRaw: requestEditHistory[newIndex], requestEditIndex: newIndex });
  },

  redoRequestEdit: () => {
    const { requestEditHistory, requestEditIndex } = get();
    if (requestEditIndex >= requestEditHistory.length - 1) return;
    const newIndex = requestEditIndex + 1;
    set({ editedRequestRaw: requestEditHistory[newIndex], requestEditIndex: newIndex });
  },

  toggleRequestSplitView: () =>
    set((state) => ({ requestSplitView: !state.requestSplitView })),

  applyEditedResponse: () => {
    const { editedResponseRaw, selectedPacketId, packets } = get();
    if (!editedResponseRaw || !selectedPacketId) return;
    const parsed = parseRawResponse(editedResponseRaw);
    if (!parsed) return;
    set({
      packets: packets.map((p) =>
        p.id === selectedPacketId ? { ...p, response: parsed } : p
      ),
    });
  },
}));

/**
 * 解析原始请求文本为 RequestData
 * 格式: METHOD PATH HTTP/x.x\nHeader: Value\n...\n\nbody
 */
export function parseRawRequest(raw: string): RequestData | null {
  try {
    const [headerSection, ...bodyParts] = raw.split('\n\n');
    const body = bodyParts.join('\n\n');
    const lines = headerSection.split('\n');
    if (lines.length === 0) return null;

    // 解析请求行
    const requestLine = lines[0];
    const parts = requestLine.split(' ');
    const method = (parts[0] || 'GET').toUpperCase() as HttpMethod;
    const pathPart = parts[1] || '/';
    const httpVersion = parts[2] || 'HTTP/1.1';

    // 解析 headers
    const headers: { name: string; value: string }[] = [];
    let host = '';
    for (let i = 1; i < lines.length; i++) {
      const colonIdx = lines[i].indexOf(':');
      if (colonIdx === -1) continue;
      const name = lines[i].substring(0, colonIdx).trim();
      const value = lines[i].substring(colonIdx + 1).trim();
      headers.push({ name, value });
      if (name.toLowerCase() === 'host') host = value;
    }

    // 重建完整 URL
    const scheme = 'https';
    const url = host ? `${scheme}://${host}${pathPart}` : pathPart;

    // 解析 queryString
    const queryString: { name: string; value: string }[] = [];
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.forEach((v, k) => queryString.push({ name: k, value: v }));
    } catch { /* ignore */ }

    const contentType = headers.find((h) => h.name.toLowerCase() === 'content-type')?.value ?? '';

    return { method, url, httpVersion, headers, queryString, body, contentType };
  } catch {
    return null;
  }
}

/**
 * 解析原始响应文本为 ResponseData
 * 格式: HTTP/x.x STATUS TEXT\nHeader: Value\n...\n\nbody
 */
function parseRawResponse(raw: string): ResponseData | null {
  try {
    const [headerSection, ...bodyParts] = raw.split('\n\n');
    const body = bodyParts.join('\n\n');
    const lines = headerSection.split('\n');
    if (lines.length === 0) return null;

    // 解析状态行
    const statusLine = lines[0];
    const parts = statusLine.split(' ');
    const httpVersion = parts[0] || 'HTTP/1.1';
    const status = parseInt(parts[1] || '200', 10);
    const statusText = parts.slice(2).join(' ') || 'OK';

    // 解析 headers
    const headers: { name: string; value: string }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const colonIdx = lines[i].indexOf(':');
      if (colonIdx === -1) continue;
      const name = lines[i].substring(0, colonIdx).trim();
      const value = lines[i].substring(colonIdx + 1).trim();
      headers.push({ name, value });
    }

    const contentType = headers.find((h) => h.name.toLowerCase() === 'content-type')?.value ?? '';

    return { status, statusText, httpVersion, headers, body, contentType, bodySize: body.length };
  } catch {
    return null;
  }
}

