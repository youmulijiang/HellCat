import type {
  DevToolsToBackgroundMessage,
  InterceptedRequestData,
} from '@/types/messaging';
import type { HttpMethod, HttpHeader } from '@/types/packet';

export default defineBackground(() => {
  console.log('[Hellcat] Background started', { id: browser.runtime.id });

  /** 记录哪些 tab 正在被拦截 */
  const interceptedTabs = new Set<number>();

  /** 记录每个 tab 关联的 devtools port（用于向面板发消息） */
  const devtoolsPorts = new Map<number, chrome.runtime.Port>();

  /**
   * 处理 DevTools 面板的长连接
   */
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'hellcat-devtools') return;

    let connectedTabId: number | null = null;

    port.onMessage.addListener((msg: DevToolsToBackgroundMessage) => {
      switch (msg.type) {
        case 'START_INTERCEPT':
          connectedTabId = msg.tabId;
          devtoolsPorts.set(msg.tabId, port);
          startIntercept(msg.tabId);
          break;

        case 'STOP_INTERCEPT':
          stopIntercept(msg.tabId);
          break;

        case 'FORWARD_REQUEST':
          forwardRequest(msg.requestId);
          break;

        case 'DROP_REQUEST':
          dropRequest(msg.requestId);
          break;
      }
    });

    port.onDisconnect.addListener(() => {
      if (connectedTabId !== null) {
        stopIntercept(connectedTabId);
        devtoolsPorts.delete(connectedTabId);
      }
    });
  });

  /**
   * 存储被暂停的请求：CDP requestId → { tabId }
   */
  const pausedRequests = new Map<string, { tabId: number }>();

  /**
   * 开启拦截：attach debugger 并启用 Fetch 域
   */
  async function startIntercept(tabId: number) {
    if (interceptedTabs.has(tabId)) return;

    try {
      await chrome.debugger.attach({ tabId }, '1.3');
      await chrome.debugger.sendCommand({ tabId }, 'Fetch.enable', {
        patterns: [{ urlPattern: '*', requestStage: 'Request' }],
      });
      interceptedTabs.add(tabId);
      console.log(`[Hellcat] Intercepting enabled for tab ${tabId}`);

      // 通知 DevTools 面板拦截已启动
      notifyDevTools(tabId, { type: 'INTERCEPT_STATUS', active: true, tabId });
    } catch (err) {
      console.error(`[Hellcat] Failed to start intercept for tab ${tabId}:`, err);
    }
  }

  /**
   * 关闭拦截：detach debugger
   */
  async function stopIntercept(tabId: number) {
    if (!interceptedTabs.has(tabId)) return;

    try {
      // 先放行所有暂停的请求
      for (const [reqId, info] of pausedRequests.entries()) {
        if (info.tabId === tabId) {
          try {
            await chrome.debugger.sendCommand({ tabId }, 'Fetch.continueRequest', {
              requestId: reqId,
            });
          } catch { /* ignore */ }
          pausedRequests.delete(reqId);
        }
      }

      await chrome.debugger.sendCommand({ tabId }, 'Fetch.disable');
      await chrome.debugger.detach({ tabId });
      interceptedTabs.delete(tabId);
      console.log(`[Hellcat] Intercepting disabled for tab ${tabId}`);

      notifyDevTools(tabId, { type: 'INTERCEPT_STATUS', active: false, tabId });
    } catch (err) {
      console.error(`[Hellcat] Failed to stop intercept for tab ${tabId}:`, err);
      interceptedTabs.delete(tabId);
    }
  }

  /**
   * 放行被拦截的请求
   */
  async function forwardRequest(requestId: string) {
    const info = pausedRequests.get(requestId);
    if (!info) return;

    try {
      await chrome.debugger.sendCommand({ tabId: info.tabId }, 'Fetch.continueRequest', {
        requestId,
      });
    } catch (err) {
      console.error(`[Hellcat] Failed to forward request ${requestId}:`, err);
    }
    pausedRequests.delete(requestId);
  }

  /**
   * 丢弃被拦截的请求
   */
  async function dropRequest(requestId: string) {
    const info = pausedRequests.get(requestId);
    if (!info) return;

    try {
      await chrome.debugger.sendCommand({ tabId: info.tabId }, 'Fetch.failRequest', {
        requestId,
        errorReason: 'BlockedByClient',
      });
    } catch (err) {
      console.error(`[Hellcat] Failed to drop request ${requestId}:`, err);
    }
    pausedRequests.delete(requestId);
  }

  /**
   * 监听 CDP 事件
   */
  chrome.debugger.onEvent.addListener((source, method, params) => {
    if (method !== 'Fetch.requestPaused' || !source.tabId) return;

    const tabId = source.tabId;
    if (!interceptedTabs.has(tabId)) return;

    const p = params as {
      requestId: string;
      request: {
        url: string;
        method: string;
        headers: Record<string, string>;
        postData?: string;
      };
    };

    // 记录被暂停的请求
    pausedRequests.set(p.requestId, { tabId });

    // 转换 headers
    const headers: HttpHeader[] = Object.entries(p.request.headers).map(
      ([name, value]) => ({ name, value })
    );

    const interceptedData: InterceptedRequestData = {
      networkRequestId: p.requestId,
      method: p.request.method.toUpperCase() as HttpMethod,
      url: p.request.url,
      headers,
      postData: p.request.postData,
    };

    // 发送到 DevTools 面板
    notifyDevTools(tabId, {
      type: 'REQUEST_INTERCEPTED',
      data: interceptedData,
    });
  });

  /**
   * 监听 debugger 被 detach（例如用户手动关闭）
   */
  chrome.debugger.onDetach.addListener((source) => {
    if (source.tabId) {
      interceptedTabs.delete(source.tabId);
      // 清理该 tab 的暂停请求
      for (const [reqId, info] of pausedRequests.entries()) {
        if (info.tabId === source.tabId) {
          pausedRequests.delete(reqId);
        }
      }
    }
  });

  /**
   * 向 DevTools 面板发送消息
   */
  function notifyDevTools(tabId: number, message: unknown) {
    const port = devtoolsPorts.get(tabId);
    if (port) {
      try {
        port.postMessage(message);
      } catch { /* port 可能已断开 */ }
    }
  }
});
