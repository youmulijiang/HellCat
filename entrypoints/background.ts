import type {
  DevToolsToBackgroundMessage,
  InterceptedRequestData,
} from '@/types/messaging';
import type { HttpMethod, HttpHeader } from '@/types/packet';
import {
  URL_SLIDESHOW_ALARM_NAME,
  URL_SLIDESHOW_STORAGE_KEY,
  createIdleUrlSlideshowState,
  normalizeUrlSlideshowState,
} from '@/types/url-slideshow';
import {
  URL_SCREENSHOT_STORAGE_KEY,
  createIdleUrlScreenshotState,
  normalizeUrlScreenshotState,
} from '@/types/url-screenshot';
import { urlScreenshotDb } from '@/stores/urlScreenshotDb';

export default defineBackground(() => {
  console.log('[Hellcat] Background started', { id: browser.runtime.id });

  type AutoInjectScript = {
    id: string;
    name: string;
    code: string;
  };

  let autoInjectScripts: AutoInjectScript[] = [];
  let autoInjectScriptsLoaded = false;
  let urlSlideshowState = createIdleUrlSlideshowState();
  let urlScreenshotState = createIdleUrlScreenshotState();
  let urlScreenshotAbortRequested = false;
  let urlScreenshotRunToken = 0;

  const isInjectableUrl = (url?: string) => Boolean(url && /^https?:\/\//.test(url));

  async function loadAutoInjectScripts() {
    if (autoInjectScriptsLoaded) return autoInjectScripts;
    try {
      const data = await browser.storage.local.get('hellcatAutoInjectScripts');
      autoInjectScripts = Array.isArray(data.hellcatAutoInjectScripts)
        ? data.hellcatAutoInjectScripts as AutoInjectScript[]
        : [];
    } catch (err) {
      console.warn('[Hellcat] Auto-inject storage read error:', err);
      autoInjectScripts = [];
    } finally {
      autoInjectScriptsLoaded = true;
    }
    return autoInjectScripts;
  }

  async function persistUrlSlideshowState() {
    await browser.storage.local.set({ [URL_SLIDESHOW_STORAGE_KEY]: urlSlideshowState });
  }

  async function setUrlSlideshowState(nextState: unknown) {
    urlSlideshowState = normalizeUrlSlideshowState(nextState);
    await persistUrlSlideshowState();
  }

  async function persistUrlScreenshotState() {
    await browser.storage.local.set({ [URL_SCREENSHOT_STORAGE_KEY]: urlScreenshotState });
  }

  async function setUrlScreenshotState(nextState: unknown) {
    urlScreenshotState = normalizeUrlScreenshotState(nextState);
    await persistUrlScreenshotState();
  }

  async function clearUrlSlideshowAlarm() {
    await browser.alarms.clear(URL_SLIDESHOW_ALARM_NAME);
  }

  async function scheduleUrlSlideshowAdvance(seconds: number) {
    await clearUrlSlideshowAlarm();
    await browser.alarms.create(URL_SLIDESHOW_ALARM_NAME, {
      when: Date.now() + Math.max(1000, Math.round(seconds * 1000)),
    });
  }

  async function waitForTabLoad(tabId: number, timeoutMs = 15000) {
    try {
      const tab = await browser.tabs.get(tabId);
      if (tab.status === 'complete') return;
    } catch {
      return;
    }

    await new Promise<void>((resolve) => {
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        browser.tabs.onUpdated.removeListener(handleUpdated);
        browser.tabs.onRemoved.removeListener(handleRemoved);
        clearTimeout(timeoutId);
        resolve();
      };

      const handleUpdated = (updatedTabId: number, changeInfo: { status?: string }) => {
        if (updatedTabId === tabId && changeInfo.status === 'complete') finish();
      };

      const handleRemoved = (removedTabId: number) => {
        if (removedTabId === tabId) finish();
      };

      const timeoutId = setTimeout(finish, timeoutMs);
      browser.tabs.onUpdated.addListener(handleUpdated);
      browser.tabs.onRemoved.addListener(handleRemoved);
    });
  }

  async function wait(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function clearUrlScreenshotResults() {
    await urlScreenshotDb.screenshots.clear();
  }

  function buildScreenshotFileName(url: string, index: number) {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const pathParts = parsed.pathname
        .split('/')
        .filter(Boolean)
        .map((part) => part.replace(/[^a-zA-Z0-9.-]/g, '_'));
      const lastPath = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'home';
      return `${String(index + 1).padStart(2, '0')}_${hostname}_${lastPath}.png`;
    } catch {
      return `screenshot_${index + 1}.png`;
    }
  }

  function base64ToBlob(base64: string, mimeType = 'image/png') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  async function captureTabScreenshotBlob(tabId: number) {
    let attachedByUs = false;

    try {
      if (!isDebuggerAttached(tabId)) {
        await browser.debugger.attach({ tabId }, '1.3');
        attachedByUs = true;
      }

      await browser.debugger.sendCommand({ tabId }, 'Page.enable');
      const metrics = await browser.debugger.sendCommand({ tabId }, 'Page.getLayoutMetrics') as {
        cssContentSize?: { width?: number; height?: number };
        contentSize?: { width?: number; height?: number };
      };

      const rawWidth = Math.ceil(metrics.cssContentSize?.width ?? metrics.contentSize?.width ?? 1280);
      const rawHeight = Math.ceil(metrics.cssContentSize?.height ?? metrics.contentSize?.height ?? 720);
      const width = Math.max(1280, Math.min(rawWidth, 10000));
      const height = Math.max(720, Math.min(rawHeight, 16000));

      await browser.debugger.sendCommand({ tabId }, 'Emulation.setDeviceMetricsOverride', {
        mobile: false,
        width,
        height,
        deviceScaleFactor: 1,
      });
      await wait(250);

      const screenshot = await browser.debugger.sendCommand({ tabId }, 'Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: true,
      }) as { data?: string };

      if (!screenshot.data) {
        throw new Error('未获取到截图数据');
      }

      return base64ToBlob(screenshot.data, 'image/png');
    } finally {
      try {
        await browser.debugger.sendCommand({ tabId }, 'Emulation.clearDeviceMetricsOverride');
      } catch {
        // ignore
      }

      try {
        await browser.debugger.sendCommand({ tabId }, 'Page.disable');
      } catch {
        // ignore
      }

      if (attachedByUs) {
        try {
          await browser.debugger.detach({ tabId });
        } catch {
          // ignore
        }
      }
    }
  }

  async function runUrlScreenshotJob(urls: string[], sessionId: string, runToken: number) {
    let capturedCount = 0;
    let failedCount = 0;
    let lastError = '';

    for (let index = 0; index < urls.length; index += 1) {
      if (runToken !== urlScreenshotRunToken || urlScreenshotAbortRequested) break;

      const currentUrl = urls[index];
      await setUrlScreenshotState({
        ...urlScreenshotState,
        running: true,
        stopping: false,
        completed: false,
        currentIndex: index,
        currentUrl,
        sessionId,
        total: urls.length,
        updatedAt: Date.now(),
      });

      let tabId: number | null = null;
      try {
        const tab = await browser.tabs.create({ url: currentUrl, active: false });
        tabId = tab.id ?? null;
        if (!tabId) {
          throw new Error('创建标签页失败');
        }

        await waitForTabLoad(tabId, 20000);
        await wait(1200);

        if (runToken !== urlScreenshotRunToken || urlScreenshotAbortRequested) break;

        const blob = await captureTabScreenshotBlob(tabId);
        await urlScreenshotDb.screenshots.add({
          id: crypto.randomUUID(),
          sessionId,
          url: currentUrl,
          blob,
          filename: buildScreenshotFileName(currentUrl, index),
          mimeType: 'image/png',
          order: index,
          createdAt: Date.now(),
        });
        capturedCount += 1;
      } catch (err) {
        failedCount += 1;
        lastError = err instanceof Error ? err.message : '截图失败';
        console.warn(`[Hellcat] Screenshot failed for ${currentUrl}:`, err);
      } finally {
        if (tabId) {
          try {
            await browser.tabs.remove(tabId);
          } catch {
            // ignore
          }
        }
      }

      await setUrlScreenshotState({
        ...urlScreenshotState,
        running: true,
        stopping: false,
        completed: false,
        currentIndex: index,
        processedCount: index + 1,
        currentUrl,
        sessionId,
        total: urls.length,
        capturedCount,
        failedCount,
        lastError,
        updatedAt: Date.now(),
      });
    }

    if (runToken !== urlScreenshotRunToken) return;

    const aborted = urlScreenshotAbortRequested;
    urlScreenshotAbortRequested = false;
    await setUrlScreenshotState({
      ...urlScreenshotState,
      running: false,
      stopping: false,
      completed: !aborted,
      currentUrl: '',
      sessionId,
      total: urls.length,
      processedCount: capturedCount + failedCount,
      capturedCount,
      failedCount,
      lastError,
      updatedAt: Date.now(),
    });
  }

  async function startUrlScreenshot(urls: string[]) {
    if (urlScreenshotState.running) {
      throw new Error('截图任务进行中');
    }

    const normalizedUrls = urls
      .map((item) => item.trim())
      .filter((item) => /^https?:\/\//i.test(item));

    if (normalizedUrls.length === 0) {
      throw new Error('没有可截图的 URL');
    }

    const sessionId = crypto.randomUUID();
    urlScreenshotRunToken += 1;
    urlScreenshotAbortRequested = false;

    await clearUrlScreenshotResults();
    await setUrlScreenshotState({
      ...createIdleUrlScreenshotState(),
      running: true,
      currentUrl: normalizedUrls[0],
      total: normalizedUrls.length,
      sessionId,
      updatedAt: Date.now(),
    });

    void runUrlScreenshotJob(normalizedUrls, sessionId, urlScreenshotRunToken);
  }

  async function stopUrlScreenshot() {
    if (!urlScreenshotState.running) return;

    urlScreenshotAbortRequested = true;
    await setUrlScreenshotState({
      ...urlScreenshotState,
      stopping: true,
      updatedAt: Date.now(),
    });
  }

  async function resetUrlScreenshotState() {
    if (urlScreenshotState.running) {
      throw new Error('截图任务进行中，无法清空结果');
    }

    urlScreenshotAbortRequested = false;
    await clearUrlScreenshotResults();
    await setUrlScreenshotState(createIdleUrlScreenshotState());
  }

  async function ensureUrlSlideshowTab(url: string, preferredTabId: number | null) {
    if (preferredTabId) {
      try {
        const existingTab = await browser.tabs.get(preferredTabId);
        if (existingTab.url === url) {
          await browser.tabs.update(preferredTabId, { active: true });
          return preferredTabId;
        }

        await browser.tabs.update(preferredTabId, { url, active: true });
        return preferredTabId;
      } catch {
        // 标签已失效时退回到创建新标签
      }
    }

    const createdTab = await browser.tabs.create({ url, active: true });
    return createdTab.id ?? null;
  }

  async function completeUrlSlideshow() {
    await clearUrlSlideshowAlarm();

    if (urlSlideshowState.urls.length === 0) {
      await setUrlSlideshowState(createIdleUrlSlideshowState());
      return;
    }

    const lastIndex = Math.max(0, Math.min(urlSlideshowState.currentIndex, urlSlideshowState.urls.length - 1));
    await setUrlSlideshowState({
      ...urlSlideshowState,
      running: false,
      paused: false,
      completed: true,
      currentIndex: lastIndex,
      currentUrl: urlSlideshowState.urls[lastIndex] ?? urlSlideshowState.currentUrl,
    });
  }

  async function stopUrlSlideshow() {
    await clearUrlSlideshowAlarm();
    await setUrlSlideshowState(createIdleUrlSlideshowState());
  }

  async function runUrlSlideshowStep(nextIndex: number) {
    const targetUrl = urlSlideshowState.urls[nextIndex];
    if (!targetUrl) {
      await completeUrlSlideshow();
      return;
    }

    const tabId = await ensureUrlSlideshowTab(targetUrl, urlSlideshowState.tabId);
    if (!tabId) {
      await stopUrlSlideshow();
      return;
    }

    await setUrlSlideshowState({
      ...urlSlideshowState,
      running: true,
      paused: false,
      completed: false,
      currentIndex: nextIndex,
      currentUrl: targetUrl,
      tabId,
    });

    await waitForTabLoad(tabId);

    if (!urlSlideshowState.running || urlSlideshowState.paused || urlSlideshowState.currentIndex !== nextIndex) {
      return;
    }

    await scheduleUrlSlideshowAdvance(urlSlideshowState.duration);
  }

  async function advanceUrlSlideshow() {
    if (!urlSlideshowState.running || urlSlideshowState.paused) return;

    const nextIndex = urlSlideshowState.currentIndex + 1;
    if (nextIndex >= urlSlideshowState.urls.length) {
      await completeUrlSlideshow();
      return;
    }

    await runUrlSlideshowStep(nextIndex);
  }

  async function startUrlSlideshow(urls: string[], duration: number) {
    const normalizedUrls = urls
      .map((item) => item.trim())
      .filter((item) => /^https?:\/\//i.test(item));

    if (normalizedUrls.length === 0) {
      throw new Error('没有可播放的 URL');
    }

    await clearUrlSlideshowAlarm();
    await setUrlSlideshowState({
      ...createIdleUrlSlideshowState(),
      running: true,
      paused: false,
      completed: false,
      currentIndex: 0,
      total: normalizedUrls.length,
      currentUrl: normalizedUrls[0],
      urls: normalizedUrls,
      duration: Math.max(1, Math.round(duration || 10)),
      tabId: urlSlideshowState.tabId,
    });

    await runUrlSlideshowStep(0);
  }

  async function pauseUrlSlideshow() {
    if (!urlSlideshowState.running || urlSlideshowState.paused) return;
    await clearUrlSlideshowAlarm();
    await setUrlSlideshowState({ ...urlSlideshowState, paused: true });
  }

  async function resumeUrlSlideshow() {
    if (!urlSlideshowState.running || !urlSlideshowState.paused) return;

    const currentUrl = urlSlideshowState.currentUrl || urlSlideshowState.urls[urlSlideshowState.currentIndex];
    if (!currentUrl) {
      await stopUrlSlideshow();
      return;
    }

    const tabId = await ensureUrlSlideshowTab(currentUrl, urlSlideshowState.tabId);
    await setUrlSlideshowState({
      ...urlSlideshowState,
      paused: false,
      currentUrl,
      tabId,
    });

    if (!tabId) return;

    await waitForTabLoad(tabId);
    if (!urlSlideshowState.running || urlSlideshowState.paused) return;
    await scheduleUrlSlideshowAdvance(urlSlideshowState.duration);
  }

  async function loadUrlSlideshowState() {
    try {
      const data = await browser.storage.local.get(URL_SLIDESHOW_STORAGE_KEY);
      urlSlideshowState = normalizeUrlSlideshowState(data[URL_SLIDESHOW_STORAGE_KEY]);
      if (urlSlideshowState.running && !urlSlideshowState.paused) {
        await scheduleUrlSlideshowAdvance(urlSlideshowState.duration);
      }
    } catch (err) {
      console.warn('[Hellcat] Url slideshow state load error:', err);
      urlSlideshowState = createIdleUrlSlideshowState();
    }
  }

  async function loadUrlScreenshotState() {
    try {
      const data = await browser.storage.local.get(URL_SCREENSHOT_STORAGE_KEY);
      urlScreenshotState = normalizeUrlScreenshotState(data[URL_SCREENSHOT_STORAGE_KEY]);

      if (urlScreenshotState.running) {
        await setUrlScreenshotState({
          ...urlScreenshotState,
          running: false,
          stopping: false,
          currentUrl: '',
          lastError: urlScreenshotState.lastError || '扩展已重启，截图任务未继续执行',
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      console.warn('[Hellcat] Url screenshot state load error:', err);
      urlScreenshotState = createIdleUrlScreenshotState();
    }
  }

  void loadAutoInjectScripts();
  void loadUrlSlideshowState();
  void loadUrlScreenshotState();

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;

    if (changes.hellcatAutoInjectScripts) {
      autoInjectScriptsLoaded = true;
      autoInjectScripts = Array.isArray(changes.hellcatAutoInjectScripts.newValue)
        ? changes.hellcatAutoInjectScripts.newValue as AutoInjectScript[]
        : [];
    }

    if (changes[URL_SLIDESHOW_STORAGE_KEY]) {
      urlSlideshowState = normalizeUrlSlideshowState(changes[URL_SLIDESHOW_STORAGE_KEY].newValue);
    }

    if (changes[URL_SCREENSHOT_STORAGE_KEY]) {
      urlScreenshotState = normalizeUrlScreenshotState(changes[URL_SCREENSHOT_STORAGE_KEY].newValue);
    }
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === URL_SLIDESHOW_ALARM_NAME) {
      void advanceUrlSlideshow();
    }
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    if (urlSlideshowState.tabId === tabId) {
      void setUrlSlideshowState({ ...urlSlideshowState, tabId: null });
    }
  });

  // ─── 自动注入：页面开始加载时尽早注入启用的脚本 ───────────────
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'loading') return;
    if (!isInjectableUrl(tab.url)) return;

    const scripts = autoInjectScriptsLoaded ? autoInjectScripts : await loadAutoInjectScripts();
    if (scripts.length === 0) return;

    for (const script of scripts) {
      try {
        await browser.scripting.executeScript({
          target: { tabId },
          func: (code: string) => {
            const mountAndRun = () => {
              const parent = document.head || document.documentElement || document.body;
              if (!parent) return false;

              const el = document.createElement('script');
              el.textContent = code;
              parent.appendChild(el);
              el.remove();
              return true;
            };

            try {
              if (mountAndRun()) return;

              const observer = new MutationObserver(() => {
                if (mountAndRun()) observer.disconnect();
              });

              observer.observe(document, { childList: true, subtree: true });
              window.addEventListener('DOMContentLoaded', () => {
                if (mountAndRun()) observer.disconnect();
              }, { once: true });
            } catch (e) {
              console.error('[Hellcat] Auto-inject error:', e);
            }
          },
          args: [script.code],
          world: 'MAIN',
          injectImmediately: true,
        });
        console.log(`[Hellcat] Auto-injected: ${script.name} into tab ${tabId}`);
      } catch (err) {
        console.warn(`[Hellcat] Failed to auto-inject "${script.name}" into tab ${tabId}:`, err);
      }
    }
  });

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

    if (
      message.action === 'getUrlSlideshowState'
      || message.action === 'startUrlSlideshow'
      || message.action === 'pauseUrlSlideshow'
      || message.action === 'resumeUrlSlideshow'
      || message.action === 'stopUrlSlideshow'
    ) {
      void (async () => {
        try {
          switch (message.action) {
            case 'getUrlSlideshowState':
              sendResponse({ success: true, state: urlSlideshowState });
              return;
            case 'startUrlSlideshow':
              await startUrlSlideshow(message.urls ?? [], message.duration ?? 10);
              sendResponse({ success: true, state: urlSlideshowState });
              return;
            case 'pauseUrlSlideshow':
              await pauseUrlSlideshow();
              sendResponse({ success: true, state: urlSlideshowState });
              return;
            case 'resumeUrlSlideshow':
              await resumeUrlSlideshow();
              sendResponse({ success: true, state: urlSlideshowState });
              return;
            case 'stopUrlSlideshow':
              await stopUrlSlideshow();
              sendResponse({ success: true, state: urlSlideshowState });
              return;
          }
        } catch (err) {
          sendResponse({
            success: false,
            error: err instanceof Error ? err.message : 'URL 幻灯片操作失败',
            state: urlSlideshowState,
          });
        }
      })();
      return true;
    }

    if (
      message.action === 'getUrlScreenshotState'
      || message.action === 'startUrlScreenshot'
      || message.action === 'stopUrlScreenshot'
      || message.action === 'clearUrlScreenshotResults'
    ) {
      void (async () => {
        try {
          switch (message.action) {
            case 'getUrlScreenshotState':
              sendResponse({ success: true, state: urlScreenshotState });
              return;
            case 'startUrlScreenshot':
              await startUrlScreenshot(message.urls ?? []);
              sendResponse({ success: true, state: urlScreenshotState });
              return;
            case 'stopUrlScreenshot':
              await stopUrlScreenshot();
              sendResponse({ success: true, state: urlScreenshotState });
              return;
            case 'clearUrlScreenshotResults':
              await resetUrlScreenshotState();
              sendResponse({ success: true, state: urlScreenshotState });
              return;
          }
        } catch (err) {
          sendResponse({
            success: false,
            error: err instanceof Error ? err.message : 'URL 截图操作失败',
            state: urlScreenshotState,
          });
        }
      })();
      return true;
    }

    return false;
  });

  /** 记录哪些 tab 正在被拦截 */
  const interceptedTabs = new Set<number>();

  /** 记录哪些 tab 正在进行 WebSocket 监控 */
  const wsMonitoredTabs = new Set<number>();

  /** 记录哪些 tab 正在进行 WebSocket 拦截 */
  const wsInterceptedTabs = new Set<number>();

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

        case 'SEND_WS_MESSAGE':
          sendWsMessage(msg.tabId, msg.url, msg.data, port);
          break;

        case 'START_WS_INTERCEPT':
          connectedTabId = msg.tabId;
          devtoolsPorts.set(msg.tabId, port);
          startWsIntercept(msg.tabId);
          break;

        case 'STOP_WS_INTERCEPT':
          stopWsIntercept(msg.tabId);
          break;

        case 'FORWARD_WS_FRAME':
          forwardWsFrame(msg.tabId, msg.interceptId, msg.data);
          break;

        case 'DROP_WS_FRAME':
          dropWsFrame(msg.tabId, msg.interceptId);
          break;
      }
    });

    port.onDisconnect.addListener(() => {
      if (connectedTabId !== null) {
        stopIntercept(connectedTabId);
        stopWsMonitor(connectedTabId);
        stopWsIntercept(connectedTabId);
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
    return interceptedTabs.has(tabId) || wsMonitoredTabs.has(tabId) || wsInterceptedTabs.has(tabId);
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
      // 注入 WebSocket 实例追踪脚本，用于后续重放
      await injectWsHook(tabId);
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
   * 注入 WebSocket 实例追踪脚本
   * 在页面上下文中 hook WebSocket 构造函数，保存所有 WS 实例的引用
   */
  async function injectWsHook(tabId: number) {
    const script = `
      (function() {
        if (window.__hellcatWsInstances) return;
        window.__hellcatWsInstances = [];
        const OrigWS = window.WebSocket;
        window.WebSocket = function(...args) {
          const ws = new OrigWS(...args);
          window.__hellcatWsInstances.push(ws);
          ws.addEventListener('close', function() {
            const idx = window.__hellcatWsInstances.indexOf(ws);
            if (idx !== -1) window.__hellcatWsInstances.splice(idx, 1);
          });
          return ws;
        };
        window.WebSocket.prototype = OrigWS.prototype;
        window.WebSocket.CONNECTING = 0;
        window.WebSocket.OPEN = 1;
        window.WebSocket.CLOSING = 2;
        window.WebSocket.CLOSED = 3;
      })();
    `;
    try {
      await browser.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
        expression: script,
        allowUnsafeEvalBlockedByCSP: true,
      });
    } catch (err) {
      console.warn(`[Hellcat] Failed to inject WS hook for tab ${tabId}:`, err);
    }
  }

  /**
   * 通过注入的 hook 发送 WebSocket 消息（重放）
   */
  async function sendWsMessage(
    tabId: number,
    url: string,
    data: string,
    port: Browser.runtime.Port,
  ) {
    // 对 data 进行安全转义
    const escapedData = JSON.stringify(data);
    const escapedUrl = JSON.stringify(url);
    const script = `
      (function() {
        var instances = window.__hellcatWsInstances || [];
        var target = null;
        for (var i = instances.length - 1; i >= 0; i--) {
          if (instances[i].url === ${escapedUrl} && instances[i].readyState === WebSocket.OPEN) {
            target = instances[i];
            break;
          }
        }
        if (target) {
          target.send(${escapedData});
          return { success: true };
        }
        // 没有找到已有连接，创建新连接发送
        try {
          var ws = new WebSocket(${escapedUrl});
          ws.onopen = function() { ws.send(${escapedData}); };
          ws.onerror = function() {};
          return { success: true, newConnection: true };
        } catch(e) {
          return { success: false, error: e.message };
        }
      })();
    `;

    try {
      const result = await browser.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
        expression: script,
        returnByValue: true,
        allowUnsafeEvalBlockedByCSP: true,
      }) as { result?: { value?: { success: boolean; error?: string } } };

      const value = result?.result?.value;
      port.postMessage({
        type: 'WS_SEND_RESULT',
        success: value?.success ?? false,
        error: value?.error,
      });
    } catch (err) {
      port.postMessage({
        type: 'WS_SEND_RESULT',
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ─── WebSocket 拦截 ─────────────────────────────────────

  /**
   * 开启 WebSocket 拦截：注入 monkey-patch 脚本 + Runtime.addBinding
   * 必须先启动 WS 监控
   */
  async function startWsIntercept(tabId: number) {
    if (wsInterceptedTabs.has(tabId)) return;

    try {
      // 确保 debugger 已 attach
      if (!isDebuggerAttached(tabId)) {
        await browser.debugger.attach({ tabId }, '1.3');
      }
      // 确保 Runtime 域已启用
      await browser.debugger.sendCommand({ tabId }, 'Runtime.enable');
      // 注册 binding：页面调用此函数时会触发 Runtime.bindingCalled 事件
      try {
        await browser.debugger.sendCommand({ tabId }, 'Runtime.addBinding', {
          name: '__hellcatWsIntercepted',
        });
      } catch { /* binding 可能已存在 */ }

      // 注入拦截脚本
      await injectWsInterceptHook(tabId);

      wsInterceptedTabs.add(tabId);
      console.log(`[Hellcat] WS intercept enabled for tab ${tabId}`);
      notifyDevTools(tabId, { type: 'WS_INTERCEPT_STATUS', active: true, tabId });
    } catch (err) {
      console.error(`[Hellcat] Failed to start WS intercept for tab ${tabId}:`, err);
    }
  }

  /**
   * 关闭 WebSocket 拦截
   */
  async function stopWsIntercept(tabId: number) {
    if (!wsInterceptedTabs.has(tabId)) return;

    try {
      // 释放所有暂停的帧
      await releaseAllPausedWsFrames(tabId);

      // 在页面中停用拦截
      await browser.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
        expression: `(function(){ window.__hellcatWsIntercepting = false; })();`,
        allowUnsafeEvalBlockedByCSP: true,
      });

      // 移除 binding
      try {
        await browser.debugger.sendCommand({ tabId }, 'Runtime.removeBinding', {
          name: '__hellcatWsIntercepted',
        });
      } catch { /* ignore */ }

      // 仅在其他功能未使用时 detach
      if (!interceptedTabs.has(tabId) && !wsMonitoredTabs.has(tabId)) {
        await browser.debugger.detach({ tabId });
      }

      wsInterceptedTabs.delete(tabId);
      console.log(`[Hellcat] WS intercept disabled for tab ${tabId}`);
      notifyDevTools(tabId, { type: 'WS_INTERCEPT_STATUS', active: false, tabId });
    } catch (err) {
      console.error(`[Hellcat] Failed to stop WS intercept for tab ${tabId}:`, err);
      wsInterceptedTabs.delete(tabId);
    }
  }

  /**
   * 注入 WebSocket 拦截脚本
   * monkey-patch WebSocket.prototype.send（出站）和 message 事件（入站）
   */
  async function injectWsInterceptHook(tabId: number) {
    const script = `
      (function() {
        if (window.__hellcatWsInterceptHooked) return;
        window.__hellcatWsInterceptHooked = true;
        window.__hellcatWsIntercepting = true;
        window.__hellcatWsInterceptCounter = window.__hellcatWsInterceptCounter || 0;
        window.__hellcatWsInterceptQueue = window.__hellcatWsInterceptQueue || new Map();

        // ── 出站拦截：patch WebSocket.prototype.send ──
        var origSend = WebSocket.prototype.send;
        WebSocket.prototype.send = function(data) {
          if (!window.__hellcatWsIntercepting) {
            return origSend.call(this, data);
          }
          var id = String(++window.__hellcatWsInterceptCounter);
          var ws = this;
          window.__hellcatWsInterceptQueue.set(id, {
            type: 'outgoing',
            origSend: origSend.bind(ws),
            data: data,
            url: ws.url
          });
          try {
            window.__hellcatWsIntercepted(JSON.stringify({
              id: id,
              direction: 'sent',
              data: typeof data === 'string' ? data : '[binary data]',
              url: ws.url,
              timestamp: Date.now()
            }));
          } catch(e) { origSend.call(ws, data); }
        };

        // ── 入站拦截：patch WebSocket 构造函数包裹 message 事件 ──
        var OrigWS = window.__hellcatOrigWS || window.WebSocket.__hellcatOrigWS || WebSocket;
        // 保存原始构造函数引用
        if (!window.__hellcatOrigWS) {
          // 找到真正的原始 WebSocket（可能已被实例追踪 hook 包装过）
          if (WebSocket.__hellcatOrigWS) {
            window.__hellcatOrigWS = WebSocket.__hellcatOrigWS;
          } else {
            window.__hellcatOrigWS = WebSocket;
          }
        }

        // 重写构造函数以拦截入站消息
        var PrevWS = window.WebSocket;
        window.WebSocket = function() {
          var ws = new (Function.prototype.bind.apply(window.__hellcatOrigWS, [null].concat(Array.from(arguments))))();

          // 追踪实例（兼容实例追踪）
          if (window.__hellcatWsInstances) {
            window.__hellcatWsInstances.push(ws);
            ws.addEventListener('close', function() {
              var idx = window.__hellcatWsInstances.indexOf(ws);
              if (idx !== -1) window.__hellcatWsInstances.splice(idx, 1);
            });
          }

          // 拦截入站消息
          var userMessageHandlers = [];
          var userOnMessage = null;

          // 包装 addEventListener
          var origAddEventListener = ws.addEventListener.bind(ws);
          var origRemoveEventListener = ws.removeEventListener.bind(ws);
          ws.addEventListener = function(type, handler, opts) {
            if (type === 'message') {
              userMessageHandlers.push({ handler: handler, opts: opts });
              return;
            }
            return origAddEventListener(type, handler, opts);
          };
          ws.removeEventListener = function(type, handler, opts) {
            if (type === 'message') {
              userMessageHandlers = userMessageHandlers.filter(function(h) { return h.handler !== handler; });
              return;
            }
            return origRemoveEventListener(type, handler, opts);
          };

          // 包装 onmessage
          Object.defineProperty(ws, 'onmessage', {
            get: function() { return userOnMessage; },
            set: function(fn) { userOnMessage = fn; },
            configurable: true
          });

          // 注册真实的 message 监听器
          origAddEventListener('message', function(event) {
            if (!window.__hellcatWsIntercepting) {
              // 非拦截模式，直接分发
              if (userOnMessage) userOnMessage.call(ws, event);
              userMessageHandlers.forEach(function(h) { h.handler.call(ws, event); });
              return;
            }
            // 拦截模式：队列并通知
            var id = String(++window.__hellcatWsInterceptCounter);
            window.__hellcatWsInterceptQueue.set(id, {
              type: 'incoming',
              ws: ws,
              eventData: event.data,
              userOnMessage: userOnMessage,
              userHandlers: userMessageHandlers.slice(),
              url: ws.url
            });
            try {
              window.__hellcatWsIntercepted(JSON.stringify({
                id: id,
                direction: 'received',
                data: typeof event.data === 'string' ? event.data : '[binary data]',
                url: ws.url,
                timestamp: Date.now()
              }));
            } catch(e) {
              // fallback: 直接分发
              if (userOnMessage) userOnMessage.call(ws, event);
              userMessageHandlers.forEach(function(h) { h.handler.call(ws, event); });
            }
          });

          return ws;
        };
        window.WebSocket.prototype = (window.__hellcatOrigWS || OrigWS).prototype;
        window.WebSocket.__hellcatOrigWS = window.__hellcatOrigWS || OrigWS;
        window.WebSocket.CONNECTING = 0;
        window.WebSocket.OPEN = 1;
        window.WebSocket.CLOSING = 2;
        window.WebSocket.CLOSED = 3;
      })();
    `;
    try {
      await browser.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
        expression: script,
        allowUnsafeEvalBlockedByCSP: true,
      });
    } catch (err) {
      console.warn(`[Hellcat] Failed to inject WS intercept hook for tab ${tabId}:`, err);
    }
  }

  /**
   * 放行被拦截的 WS 帧
   */
  async function forwardWsFrame(tabId: number, interceptId: string, modifiedData?: string) {
    const escapedId = JSON.stringify(interceptId);
    const escapedData = modifiedData !== undefined ? JSON.stringify(modifiedData) : 'null';
    const script = `
      (function() {
        var queue = window.__hellcatWsInterceptQueue;
        if (!queue) return { success: false, error: 'no queue' };
        var item = queue.get(${escapedId});
        if (!item) return { success: false, error: 'not found' };
        queue.delete(${escapedId});

        if (item.type === 'outgoing') {
          var data = ${escapedData} !== null ? ${escapedData} : item.data;
          item.origSend(data);
          return { success: true };
        } else if (item.type === 'incoming') {
          var eventData = ${escapedData} !== null ? ${escapedData} : item.eventData;
          var fakeEvent = new MessageEvent('message', { data: eventData });
          if (item.userOnMessage) item.userOnMessage.call(item.ws, fakeEvent);
          item.userHandlers.forEach(function(h) { h.handler.call(item.ws, fakeEvent); });
          return { success: true };
        }
        return { success: false, error: 'unknown type' };
      })();
    `;
    try {
      await browser.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
        expression: script,
        returnByValue: true,
        allowUnsafeEvalBlockedByCSP: true,
      });
    } catch (err) {
      console.error(`[Hellcat] Failed to forward WS frame ${interceptId}:`, err);
    }
  }

  /**
   * 丢弃被拦截的 WS 帧
   */
  async function dropWsFrame(tabId: number, interceptId: string) {
    const escapedId = JSON.stringify(interceptId);
    const script = `
      (function() {
        var queue = window.__hellcatWsInterceptQueue;
        if (queue) queue.delete(${escapedId});
        return { success: true };
      })();
    `;
    try {
      await browser.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
        expression: script,
        returnByValue: true,
        allowUnsafeEvalBlockedByCSP: true,
      });
    } catch (err) {
      console.error(`[Hellcat] Failed to drop WS frame ${interceptId}:`, err);
    }
  }

  /**
   * 释放所有暂停的 WS 帧（关闭拦截时调用）
   */
  async function releaseAllPausedWsFrames(tabId: number) {
    const script = `
      (function() {
        var queue = window.__hellcatWsInterceptQueue;
        if (!queue) return;
        queue.forEach(function(item, id) {
          if (item.type === 'outgoing') {
            item.origSend(item.data);
          } else if (item.type === 'incoming') {
            var fakeEvent = new MessageEvent('message', { data: item.eventData });
            if (item.userOnMessage) item.userOnMessage.call(item.ws, fakeEvent);
            item.userHandlers.forEach(function(h) { h.handler.call(item.ws, fakeEvent); });
          }
        });
        queue.clear();
      })();
    `;
    try {
      await browser.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
        expression: script,
        allowUnsafeEvalBlockedByCSP: true,
      });
    } catch (err) {
      console.warn(`[Hellcat] Failed to release all paused WS frames for tab ${tabId}:`, err);
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

    // ── Runtime.bindingCalled（WS 拦截通知）──
    if (method === 'Runtime.bindingCalled' && wsInterceptedTabs.has(tabId)) {
      const p = params as { name: string; payload: string };
      if (p.name === '__hellcatWsIntercepted') {
        try {
          const info = JSON.parse(p.payload);
          notifyDevTools(tabId, {
            type: 'WS_FRAME_INTERCEPTED',
            interceptId: info.id,
            direction: info.direction,
            data: info.data,
            url: info.url,
            timestamp: info.timestamp,
          });
        } catch (e) {
          console.warn('[Hellcat] Failed to parse WS intercept payload:', e);
        }
      }
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
      wsInterceptedTabs.delete(source.tabId);
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
