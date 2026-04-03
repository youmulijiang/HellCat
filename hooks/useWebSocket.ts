import { useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';
import { useWsStore } from '@/stores/useWsStore';
import type {
  DevToolsToBackgroundMessage,
  BackgroundToDevToolsMessage,
} from '@/types/messaging';

type RuntimePort = ReturnType<typeof browser.runtime.connect>;

/**
 * WebSocket 监控 Hook
 * 通过 browser.runtime.connect 与 background 通信，
 * 接收 CDP Network 域的 WebSocket 事件并更新 store。
 *
 * 使用 useWsStore.getState() 访问 actions，避免因解构导致的不必要重渲染。
 */
export function useWebSocket() {
  const isMonitoring = useWsStore((s) => s.isMonitoring);
  const isIntercepting = useWsStore((s) => s.isIntercepting);
  const clearAll = useWsStore((s) => s.clearAll);

  const portRef = useRef<RuntimePort | null>(null);

  /** 获取或创建 port（使用 getState 避免闭包过期） */
  const getPort = useCallback(() => {
    if (portRef.current) return portRef.current;

    if (typeof browser === 'undefined' || !browser.runtime?.connect) {
      throw new Error('browser.runtime.connect is not available');
    }

    const port = browser.runtime.connect({ name: 'hellcat-devtools' });
    portRef.current = port;

    port.onMessage.addListener((msg: BackgroundToDevToolsMessage) => {
      const store = useWsStore.getState();
      switch (msg.type) {
        case 'WS_MONITOR_STATUS':
          store.setMonitoring(msg.active);
          break;
        case 'WS_CONNECTION_CREATED':
          store.addConnection(msg.requestId, msg.url, msg.initiator);
          break;
        case 'WS_CONNECTION_CLOSED':
          store.closeConnection(msg.requestId);
          break;
        case 'WS_FRAME':
          store.addFrame(
            msg.requestId,
            msg.direction,
            msg.data,
            msg.opcode,
            msg.mask,
            msg.timestamp,
          );
          break;
        case 'WS_FRAME_ERROR':
          store.addFrame(
            msg.requestId,
            'received',
            `[ERROR] ${msg.errorMessage}`,
            1,
            false,
            Date.now() / 1000,
          );
          break;
        case 'WS_SEND_RESULT':
          if (msg.success) {
            message.success('WebSocket 消息已发送');
          } else {
            message.error(`发送失败: ${msg.error || '未知错误'}`);
          }
          break;
        case 'WS_INTERCEPT_STATUS':
          store.setIntercepting(msg.active);
          if (!msg.active) store.clearPausedFrames?.();
          break;
        case 'WS_FRAME_INTERCEPTED':
          store.addPausedFrame({
            interceptId: msg.interceptId,
            direction: msg.direction,
            data: msg.data,
            url: msg.url,
            timestamp: msg.timestamp,
          });
          break;
      }
    });

    port.onDisconnect.addListener(() => {
      portRef.current = null;
      useWsStore.getState().setMonitoring(false);
    });

    return port;
  }, []);

  /** 发送消息到 background */
  const sendMessage = useCallback(
    (msg: DevToolsToBackgroundMessage) => {
      getPort().postMessage(msg);
    },
    [getPort],
  );

  /** 开始监控 */
  const startMonitor = useCallback(() => {
    const tabId = browser.devtools.inspectedWindow.tabId;
    sendMessage({ type: 'START_WS_MONITOR', tabId });
  }, [sendMessage]);

  /** 停止监控 */
  const stopMonitor = useCallback(() => {
    const tabId = browser.devtools.inspectedWindow.tabId;
    sendMessage({ type: 'STOP_WS_MONITOR', tabId });
  }, [sendMessage]);

  /** 切换监控 */
  const toggleMonitor = useCallback(() => {
    if (useWsStore.getState().isMonitoring) {
      stopMonitor();
    } else {
      startMonitor();
    }
  }, [startMonitor, stopMonitor]);

  /** 发送/重放 WebSocket 消息 */
  const sendWsMessage = useCallback(
    (url: string, data: string) => {
      const tabId = browser.devtools.inspectedWindow.tabId;
      sendMessage({ type: 'SEND_WS_MESSAGE', tabId, url, data });
    },
    [sendMessage],
  );

  /** 开始 WS 拦截 */
  const startIntercept = useCallback(() => {
    const tabId = browser.devtools.inspectedWindow.tabId;
    sendMessage({ type: 'START_WS_INTERCEPT', tabId });
  }, [sendMessage]);

  /** 停止 WS 拦截 */
  const stopIntercept = useCallback(() => {
    const tabId = browser.devtools.inspectedWindow.tabId;
    sendMessage({ type: 'STOP_WS_INTERCEPT', tabId });
  }, [sendMessage]);

  /** 切换 WS 拦截 */
  const toggleIntercept = useCallback(() => {
    if (useWsStore.getState().isIntercepting) {
      stopIntercept();
    } else {
      startIntercept();
    }
  }, [startIntercept, stopIntercept]);

  /** 放行被拦截的帧 */
  const forwardWsFrame = useCallback(
    (interceptId: string, data?: string) => {
      const tabId = browser.devtools.inspectedWindow.tabId;
      sendMessage({ type: 'FORWARD_WS_FRAME', tabId, interceptId, data });
      useWsStore.getState().removePausedFrame(interceptId);
    },
    [sendMessage],
  );

  /** 丢弃被拦截的帧 */
  const dropWsFrame = useCallback(
    (interceptId: string) => {
      const tabId = browser.devtools.inspectedWindow.tabId;
      sendMessage({ type: 'DROP_WS_FRAME', tabId, interceptId });
      useWsStore.getState().removePausedFrame(interceptId);
    },
    [sendMessage],
  );

  /** 组件卸载时停止监控并断开 port */
  useEffect(() => {
    return () => {
      if (portRef.current) {
        try {
          const tabId = browser.devtools.inspectedWindow.tabId;
          portRef.current.postMessage({ type: 'STOP_WS_MONITOR', tabId });
          portRef.current.postMessage({ type: 'STOP_WS_INTERCEPT', tabId });
        } catch { /* port may already be disconnected */ }
        try {
          portRef.current.disconnect();
        } catch { /* ignore */ }
        portRef.current = null;
      }
    };
  }, []);

  return {
    isMonitoring,
    isIntercepting,
    startMonitor,
    stopMonitor,
    toggleMonitor,
    clearAll,
    sendWsMessage,
    startIntercept,
    stopIntercept,
    toggleIntercept,
    forwardWsFrame,
    dropWsFrame,
  };
}

