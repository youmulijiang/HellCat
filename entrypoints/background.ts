import type {
  DevToolsToBackgroundMessage,
  InterceptedRequestData,
} from '@/types/messaging';
import type { HttpMethod, HttpHeader } from '@/types/packet';

export default defineBackground(() => {
  console.log('[Hellcat] Background started', { id: browser.runtime.id });

  /**
   * 监听来自 content script 的 fetchJsContent 请求
   */
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'fetchJsContent' && message.url) {
      fetch(message.url, { credentials: 'omit' })
        .then((resp) => resp.text())
        .then((content) => sendResponse({ content }))
        .catch(() => sendResponse({ content: null }));
      return true; // 异步响应
    }
    return false;
  });

  /** 记录哪些 tab 正在被拦截 */
  const interceptedTabs = new Set<number>();

  /** 记录哪些 tab 正在进行 WebSocket 监控 */
  const wsMonitoredTabs = new Set<number>();

  /** 记录每个 tab 关联的 devtools port（用于向面板发消息） */
  const devtoolsPorts = new Map<number, Browser.runtime.Port>();

  /**
   * 处理 DevTools 面板的长连接
   */
  browser.runtime.onConnect.addListener((port) => {
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

        case 'FORWARD_MODIFIED_REQUEST':
          forwardModifiedRequest(msg.requestId, msg.method, msg.url, msg.headers, msg.body);
          break;

        case 'DROP_REQUEST':
          dropRequest(msg.requestId);
          break;

        case 'SEND_REQUEST':
          sendRequest(msg, port);
          break;

        case 'START_WS_MONITOR':
          connectedTabId = msg.tabId;
          devtoolsPorts.set(msg.tabId, port);
          startWsMonitor(msg.tabId);
          break;

        case 'STOP_WS_MONITOR':
          stopWsMonitor(msg.tabId);
          break;
      }
    });

    port.onDisconnect.addListener(() => {
      if (connectedTabId !== null) {
        stopIntercept(connectedTabId);
        stopWsMonitor(connectedTabId);
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
      await browser.debugger.attach({ tabId }, '1.3');
      await browser.debugger.sendCommand({ tabId }, 'Fetch.enable', {
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
            await browser.debugger.sendCommand({ tabId }, 'Fetch.continueRequest', {
              requestId: reqId,
            });
          } catch { /* ignore */ }
          pausedRequests.delete(reqId);
        }
      }

      await browser.debugger.sendCommand({ tabId }, 'Fetch.disable');
      // 仅在 WS 监控也未使用时才 detach
      if (!wsMonitoredTabs.has(tabId)) {
        await browser.debugger.detach({ tabId });
      }
      interceptedTabs.delete(tabId);
      console.log(`[Hellcat] Intercepting disabled for tab ${tabId}`);

      notifyDevTools(tabId, { type: 'INTERCEPT_STATUS', active: false, tabId });
    } catch (err) {
      console.error(`[Hellcat] Failed to stop intercept for tab ${tabId}:`, err);
      interceptedTabs.delete(tabId);
    }
  }

  // ─── WebSocket 监控 ─────────────────────────────────────

  /**
   * 判断当前 tab 是否已经 attach 了 debugger
   */
  function isDebuggerAttached(tabId: number): boolean {
    return interceptedTabs.has(tabId) || wsMonitoredTabs.has(tabId);
  }

  /**
   * 开启 WebSocket 监控：启用 Network 域监听 WS 事件
   */
  async function startWsMonitor(tabId: number) {
    if (wsMonitoredTabs.has(tabId)) return;

    try {
      // 如果 debugger 尚未 attach，先 attach
      if (!isDebuggerAttached(tabId)) {
        await browser.debugger.attach({ tabId }, '1.3');
      }
      await browser.debugger.sendCommand({ tabId }, 'Network.enable');
      wsMonitoredTabs.add(tabId);
      console.log(`[Hellcat] WS monitor enabled for tab ${tabId}`);

      notifyDevTools(tabId, { type: 'WS_MONITOR_STATUS', active: true, tabId });
    } catch (err) {
      console.error(`[Hellcat] Failed to start WS monitor for tab ${tabId}:`, err);
    }
  }

  /**
   * 关闭 WebSocket 监控
   */
  async function stopWsMonitor(tabId: number) {
    if (!wsMonitoredTabs.has(tabId)) return;

    try {
      await browser.debugger.sendCommand({ tabId }, 'Network.disable');
      // 仅在 Fetch 拦截也未使用时才 detach
      if (!interceptedTabs.has(tabId)) {
        await browser.debugger.detach({ tabId });
      }
      wsMonitoredTabs.delete(tabId);
      console.log(`[Hellcat] WS monitor disabled for tab ${tabId}`);

      notifyDevTools(tabId, { type: 'WS_MONITOR_STATUS', active: false, tabId });
    } catch (err) {
      console.error(`[Hellcat] Failed to stop WS monitor for tab ${tabId}:`, err);
      wsMonitoredTabs.delete(tabId);
    }
  }

  /**
   * 放行被拦截的请求
   */
  async function forwardRequest(requestId: string) {
    const info = pausedRequests.get(requestId);
    if (!info) return;

    try {
      await browser.debugger.sendCommand({ tabId: info.tabId }, 'Fetch.continueRequest', {
        requestId,
      });
    } catch (err) {
      console.error(`[Hellcat] Failed to forward request ${requestId}:`, err);
    }
    pausedRequests.delete(requestId);
  }

  /**
   * 放行被拦截的请求（带修改内容）
   * 使用 Fetch.continueRequest 传入修改后的 method/url/headers/postData
   */
  async function forwardModifiedRequest(
    requestId: string,
    method: string,
    url: string,
    headers: { name: string; value: string }[],
    body?: string,
  ) {
    const info = pausedRequests.get(requestId);
    if (!info) return;

    try {
      const cdpHeaders = headers.map((h) => ({ name: h.name, value: h.value }));
      await browser.debugger.sendCommand({ tabId: info.tabId }, 'Fetch.continueRequest', {
        requestId,
        method,
        url,
        headers: cdpHeaders,
        postData: body ? btoa(body) : undefined,
      });
    } catch (err) {
      console.error(`[Hellcat] Failed to forward modified request ${requestId}:`, err);
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
      await browser.debugger.sendCommand({ tabId: info.tabId }, 'Fetch.failRequest', {
        requestId,
        errorReason: 'BlockedByClient',
      });
    } catch (err) {
      console.error(`[Hellcat] Failed to drop request ${requestId}:`, err);
    }
    pausedRequests.delete(requestId);
  }

  /**
   * 重放/发送请求：使用 fetch 发起请求并将响应返回给 DevTools 面板
   */
  async function sendRequest(
    msg: import('@/types/messaging').SendRequestMessage,
    port: Browser.runtime.Port
  ) {
    const startTime = Date.now();
    try {
      // 构造 headers
      const headers = new Headers();
      for (const h of msg.headers) {
        // 跳过浏览器自动管理的 headers
        const lower = h.name.toLowerCase();
        if (['host', 'connection', 'content-length'].includes(lower)) continue;
        try {
          headers.set(h.name, h.value);
        } catch { /* skip invalid headers */ }
      }

      const resp = await fetch(msg.url, {
        method: msg.method,
        headers,
        body: ['GET', 'HEAD'].includes(msg.method.toUpperCase()) ? undefined : (msg.body || undefined),
      });

      const duration = Date.now() - startTime;

      // 提取响应 headers
      const respHeaders: { name: string; value: string }[] = [];
      resp.headers.forEach((value, name) => {
        respHeaders.push({ name, value });
      });

      const body = await resp.text();

      port.postMessage({
        type: 'SEND_RESPONSE',
        packetId: msg.packetId,
        status: resp.status,
        statusText: resp.statusText,
        headers: respHeaders,
        body,
        duration,
      });
    } catch (err) {
      port.postMessage({
        type: 'SEND_ERROR',
        packetId: msg.packetId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * 监听 CDP 事件（Fetch + WebSocket）
   */
  browser.debugger.onEvent.addListener((source, method, params) => {
    if (!source.tabId) return;
    const tabId = source.tabId;

    // ── Fetch 拦截事件 ──
    if (method === 'Fetch.requestPaused' && interceptedTabs.has(tabId)) {
      const p = params as {
        requestId: string;
        request: {
          url: string;
          method: string;
          headers: Record<string, string>;
          postData?: string;
        };
      };

      pausedRequests.set(p.requestId, { tabId });

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

      notifyDevTools(tabId, {
        type: 'REQUEST_INTERCEPTED',
        data: interceptedData,
      });
      return;
    }

    // ── WebSocket 事件 ──
    if (!wsMonitoredTabs.has(tabId)) return;

    if (method === 'Network.webSocketCreated') {
      const p = params as { requestId: string; url: string; initiator?: { url?: string } };
      notifyDevTools(tabId, {
        type: 'WS_CONNECTION_CREATED',
        requestId: p.requestId,
        url: p.url,
        initiator: p.initiator?.url,
      });
    } else if (method === 'Network.webSocketClosed') {
      const p = params as { requestId: string };
      notifyDevTools(tabId, {
        type: 'WS_CONNECTION_CLOSED',
        requestId: p.requestId,
      });
    } else if (method === 'Network.webSocketFrameReceived') {
      const p = params as {
        requestId: string;
        timestamp: number;
        response: { opcode: number; mask: boolean; payloadData: string };
      };
      notifyDevTools(tabId, {
        type: 'WS_FRAME',
        requestId: p.requestId,
        direction: 'received',
        data: p.response.payloadData,
        opcode: p.response.opcode,
        mask: p.response.mask,
        timestamp: p.timestamp,
      });
    } else if (method === 'Network.webSocketFrameSent') {
      const p = params as {
        requestId: string;
        timestamp: number;
        response: { opcode: number; mask: boolean; payloadData: string };
      };
      notifyDevTools(tabId, {
        type: 'WS_FRAME',
        requestId: p.requestId,
        direction: 'sent',
        data: p.response.payloadData,
        opcode: p.response.opcode,
        mask: p.response.mask,
        timestamp: p.timestamp,
      });
    } else if (method === 'Network.webSocketFrameError') {
      const p = params as { requestId: string; errorMessage: string };
      notifyDevTools(tabId, {
        type: 'WS_FRAME_ERROR',
        requestId: p.requestId,
        errorMessage: p.errorMessage,
      });
    }
  });

  /**
   * 监听 debugger 被 detach（例如用户手动关闭）
   */
  browser.debugger.onDetach.addListener((source) => {
    if (source.tabId) {
      interceptedTabs.delete(source.tabId);
      wsMonitoredTabs.delete(source.tabId);
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
