import { useEffect, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { usePacketStore, parseRawRequest } from '@/stores/usePacketStore';
import type { CapturedPacket, HttpMethod, HttpHeader } from '@/types/packet';
import type {
  BackgroundToDevToolsMessage,
  DevToolsToBackgroundMessage,
} from '@/types/messaging';

type RuntimePort = ReturnType<typeof browser.runtime.connect>;

/**
 * HAR Entry 类型定义（简化版）
 * 对应 browser.devtools.network.onRequestFinished 回调参数
 */
interface HarEntry {
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: { name: string; value: string }[];
    queryString: { name: string; value: string }[];
    postData?: {
      mimeType: string;
      text?: string;
    };
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: { name: string; value: string }[];
    content: {
      size: number;
      mimeType: string;
    };
  };
  startedDateTime: string;
  time: number;
  /** 获取响应体内容 */
  getContent: (callback: (content: string, encoding: string) => void) => void;
}

/**
 * 将 HAR Entry 转换为 CapturedPacket
 */
function harEntryToPacket(entry: HarEntry): CapturedPacket {
  const url = safeParseUrl(entry.request.url);
  const host = url?.host ?? '';
  const path = url ? `${url.pathname}${url.search}` : entry.request.url;

  const method = entry.request.method.toUpperCase() as HttpMethod;
  const headers: HttpHeader[] = entry.request.headers.map((h) => ({
    name: h.name,
    value: h.value,
  }));
  const queryString: HttpHeader[] = entry.request.queryString.map((q) => ({
    name: q.name,
    value: q.value,
  }));

  return {
    id: nanoid(),
    timestamp: new Date(entry.startedDateTime).getTime(),
    host,
    path,
    request: {
      method,
      url: entry.request.url,
      httpVersion: entry.request.httpVersion,
      headers,
      queryString,
      body: entry.request.postData?.text ?? '',
      contentType: entry.request.postData?.mimeType ?? '',
    },
    response: {
      status: entry.response.status,
      statusText: entry.response.statusText,
      httpVersion: entry.response.httpVersion,
      headers: entry.response.headers.map((h) => ({
        name: h.name,
        value: h.value,
      })),
      body: '', // 先置空，通过 getContent 异步获取
      contentType: entry.response.content.mimeType,
      bodySize: entry.response.content.size,
    },
    status: 'completed',
    duration: Math.round(entry.time),
    isStarred: false,
    isHighlighted: false,
    comment: '',
  };
}

function safeParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/**
 * 网络捕获 Hook
 * 使用 browser.devtools.network.onRequestFinished 监听网络请求
 * 使用 browser.runtime.connect 与 background 通信实现请求拦截
 * 将捕获的数据包转换并存入 Zustand store
 */
export function useNetworkCapture() {
  const {
    isCapturing,
    isIntercepting,
    addPacket,
    updatePacketResponse,
    updatePacketStatus,
  } = usePacketStore();
  const isCapturingRef = useRef(isCapturing);
  const portRef = useRef<RuntimePort | null>(null);

  // 同步 ref 以避免闭包过期
  useEffect(() => {
    isCapturingRef.current = isCapturing;
  }, [isCapturing]);

  // 被动捕获：监听已完成的请求
  useEffect(() => {
    if (typeof browser === 'undefined' || !browser.devtools?.network) {
      console.warn('[Hellcat] Not in DevTools environment, network capture disabled.');
      return;
    }

    const handleRequestFinished = (harEntry: unknown) => {
      if (!isCapturingRef.current) return;

      const entry = harEntry as HarEntry;
      const packet = harEntryToPacket(entry);
      addPacket(packet);

      // 异步获取响应体内容
      entry.getContent((content, encoding) => {
        const body = encoding === 'base64' ? atob(content ?? '') : (content ?? '');
        updatePacketResponse(packet.id, {
          ...packet.response!,
          body,
        });
      });
    };

    browser.devtools.network.onRequestFinished.addListener(
      handleRequestFinished as Parameters<typeof browser.devtools.network.onRequestFinished.addListener>[0]
    );

    return () => {
      browser.devtools.network.onRequestFinished.removeListener(
        handleRequestFinished as Parameters<typeof browser.devtools.network.onRequestFinished.removeListener>[0]
      );
    };
  }, []);

  // 建立与 background 的长连接
  useEffect(() => {
    if (typeof browser === 'undefined' || !browser.runtime?.connect) return;

    const port = browser.runtime.connect({ name: 'hellcat-devtools' });
    portRef.current = port;

    port.onMessage.addListener((msg: BackgroundToDevToolsMessage) => {
      if (msg.type === 'SEND_RESPONSE') {
        const store = usePacketStore.getState();
        store.updatePacketResponse(msg.packetId, {
          status: msg.status,
          statusText: msg.statusText,
          httpVersion: 'HTTP/1.1',
          headers: msg.headers,
          body: msg.body,
          contentType:
            msg.headers.find((h) => h.name.toLowerCase() === 'content-type')?.value ?? '',
          bodySize: msg.body.length,
        });
      } else if (msg.type === 'SEND_ERROR') {
        const store = usePacketStore.getState();
        store.updatePacketStatus(msg.packetId, 'error');
      } else if (msg.type === 'REQUEST_INTERCEPTED') {
        const { data } = msg;
        const url = safeParseUrl(data.url);
        const host = url?.host ?? '';
        const path = url ? `${url.pathname}${url.search}` : data.url;

        const packet: CapturedPacket = {
          id: nanoid(),
          timestamp: Date.now(),
          host,
          path,
          request: {
            method: data.method,
            url: data.url,
            httpVersion: 'HTTP/1.1',
            headers: data.headers,
            queryString: url
              ? Array.from(url.searchParams.entries()).map(([name, value]) => ({ name, value }))
              : [],
            body: data.postData ?? '',
            contentType:
              data.headers.find((h) => h.name.toLowerCase() === 'content-type')?.value ?? '',
          },
          response: null,
          status: 'intercepted',
          duration: 0,
          isStarred: false,
          isHighlighted: false,
          comment: '',
          networkRequestId: data.networkRequestId,
        };

        addPacket(packet);
      }
    });

    port.onDisconnect.addListener(() => {
      portRef.current = null;
    });

    return () => {
      port.disconnect();
      portRef.current = null;
    };
  }, []);

  // 拦截模式切换
  useEffect(() => {
    const port = portRef.current;
    if (!port) return;

    const tabId = browser.devtools?.inspectedWindow?.tabId;
    if (!tabId) return;

    if (isIntercepting) {
      port.postMessage({ type: 'START_INTERCEPT', tabId } satisfies DevToolsToBackgroundMessage);
    } else {
      port.postMessage({ type: 'STOP_INTERCEPT', tabId } satisfies DevToolsToBackgroundMessage);
    }
  }, [isIntercepting]);

  /** 放行被拦截的请求（如果有编辑内容则带修改转发） */
  const forwardRequest = useCallback((packetId: string) => {
    const store = usePacketStore.getState();
    const packet = store.packets.find((p) => p.id === packetId);
    if (!packet?.networkRequestId || !portRef.current) return;

    // 先应用编辑内容
    store.applyEditedRequest();
    // 重新获取最新的 packet（可能已被 applyEditedRequest 更新）
    const updatedPacket = usePacketStore.getState().packets.find((p) => p.id === packetId);
    const req = updatedPacket?.request ?? packet.request;

    const hasEdited = store.editedRequestRaw !== null;

    if (hasEdited) {
      portRef.current.postMessage({
        type: 'FORWARD_MODIFIED_REQUEST',
        requestId: packet.networkRequestId,
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body || undefined,
      } satisfies DevToolsToBackgroundMessage);
    } else {
      portRef.current.postMessage({
        type: 'FORWARD_REQUEST',
        requestId: packet.networkRequestId,
      } satisfies DevToolsToBackgroundMessage);
    }

    updatePacketStatus(packetId, 'forwarded');
    store.setEditedRequestRaw(null);
  }, [updatePacketStatus]);

  /** 丢弃被拦截的请求 */
  const dropRequest = useCallback((packetId: string) => {
    const store = usePacketStore.getState();
    const packet = store.packets.find((p) => p.id === packetId);
    if (!packet?.networkRequestId || !portRef.current) return;

    portRef.current.postMessage({
      type: 'DROP_REQUEST',
      requestId: packet.networkRequestId,
    } satisfies DevToolsToBackgroundMessage);

    updatePacketStatus(packetId, 'dropped');
  }, [updatePacketStatus]);

  /** 重放/发送请求（使用编辑后的内容，或直接从粘贴的原始文本解析） */
  const sendRequest = useCallback(() => {
    const store = usePacketStore.getState();
    const packet = store.getSelectedPacket();
    if (!portRef.current) return;

    let req: CapturedPacket['request'];

    if (packet) {
      // 有选中包：先应用编辑内容再发送
      store.applyEditedRequest();
      const updatedPacket = usePacketStore.getState().getSelectedPacket();
      req = updatedPacket?.request ?? packet.request;
    } else if (store.editedRequestRaw) {
      // 无选中包但有粘贴/编辑的原始请求文本：直接解析
      const parsed = parseRawRequest(store.editedRequestRaw);
      if (!parsed) return;
      req = parsed;
    } else {
      return;
    }

    // 创建一个新数据包用于接收重放结果
    const newId = nanoid();
    const url = safeParseUrl(req.url);
    const host = url?.host ?? '';
    const path = url ? `${url.pathname}${url.search}` : req.url;

    const newPacket: CapturedPacket = {
      id: newId,
      timestamp: Date.now(),
      host,
      path,
      request: { ...req },
      response: null,
      status: 'pending',
      duration: 0,
      isStarred: false,
      isHighlighted: false,
      comment: '[Replay]',
    };

    addPacket(newPacket);
    store.selectPacket(newId);

    portRef.current.postMessage({
      type: 'SEND_REQUEST',
      packetId: newId,
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body || undefined,
    } satisfies DevToolsToBackgroundMessage);
  }, [addPacket]);

  return { forwardRequest, dropRequest, sendRequest };
}

