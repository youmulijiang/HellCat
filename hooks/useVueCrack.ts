import { useState, useEffect, useCallback } from 'react';
import type {
  VueDetectionResult,
  VueRouterAnalysisResult,
  VueCrackEvent,
} from '@/types/vue-crack';

export type VueCrackStatus = 'idle' | 'detecting' | 'detected' | 'not-detected' | 'error';

export interface VueCrackState {
  status: VueCrackStatus;
  detection: VueDetectionResult | null;
  analysis: VueRouterAnalysisResult | null;
  error: string | null;
}

export function useVueCrack() {
  const [state, setState] = useState<VueCrackState>({
    status: 'idle',
    detection: null,
    analysis: null,
    error: null,
  });

  /** 监听 content script 发来的消息 */
  useEffect(() => {
    const listener = (message: VueCrackEvent) => {
      if (message.action === 'vueDetectionResult') {
        const result = message.result;
        if (result.detected) {
          setState((s) => ({ ...s, status: 'detecting', detection: result }));
        } else {
          setState((s) => ({ ...s, status: 'not-detected', detection: result }));
        }
      } else if (message.action === 'vueRouterAnalysisResult') {
        setState((s) => ({
          ...s,
          status: 'detected',
          analysis: message.result,
        }));
      } else if (
        message.action === 'vueDetectionError' ||
        message.action === 'vueRouterAnalysisError'
      ) {
        setState((s) => ({ ...s, status: 'error', error: message.error }));
      }
    };

    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  /** 触发检测 */
  const detect = useCallback(async () => {
    setState({ status: 'detecting', detection: null, analysis: null, error: null });
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setState((s) => ({ ...s, status: 'error', error: '无法获取当前标签页' }));
        return;
      }
      await browser.tabs.sendMessage(tab.id, { action: 'detectVue' });
    } catch (e) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: '无法连接到页面，请刷新后重试',
      }));
    }
  }, []);

  /** 推断出的 base path（routerBase 优先，其次 pageAnalysis） */
  const inferredBasePath =
    state.analysis?.routerBase ||
    state.analysis?.pageAnalysis?.detectedBasePath ||
    '';

  /** 生成完整 URL 列表，可传入自定义 basePath 覆盖推断值 */
  const buildFullUrls = useCallback(
    async (customBasePath?: string): Promise<{ path: string; url: string }[]> => {
      if (!state.analysis?.allRoutes?.length) return [];

      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url) return [];

      const urlObj = new URL(tab.url);
      const domainBase = urlObj.origin;
      const isHash = tab.url.includes('#/') || tab.url.includes('#');

      let baseUrl: string;
      if (isHash) {
        const hashIdx = tab.url.indexOf('#');
        baseUrl = tab.url.substring(0, hashIdx + 1);
      } else {
        baseUrl = domainBase;
      }

      // 优先使用传入的自定义 basePath，否则用推断值
      const basePath = customBasePath ?? inferredBasePath;

      return state.analysis.allRoutes.map((route) => {
        const cleanPath = route.path.startsWith('/') ? route.path.substring(1) : route.path;
        let url: string;
        if (isHash) {
          url = baseUrl.endsWith('#/')
            ? `${baseUrl}${cleanPath}`
            : `${baseUrl}/${cleanPath}`;
        } else {
          const prefix = basePath ? `${domainBase}${basePath}` : domainBase;
          url = `${prefix}/${cleanPath}`;
        }
        // 清理重复斜杠
        url = url.replace(/([^:]\/)\/+/g, '$1').replace(/\/$/, '');
        return { path: route.path, url };
      });
    },
    [state.analysis, inferredBasePath],
  );

  /** 复制所有路径 */
  const copyAllPaths = useCallback(async () => {
    if (!state.analysis?.allRoutes?.length) return;
    const text = state.analysis.allRoutes.map((r) => r.path).join('\n');
    await navigator.clipboard.writeText(text);
  }, [state.analysis]);

  /** 复制所有 URL */
  const copyAllUrls = useCallback(async (customBasePath?: string) => {
    const urls = await buildFullUrls(customBasePath);
    const text = urls.map((u) => u.url).join('\n');
    await navigator.clipboard.writeText(text);
  }, [buildFullUrls]);

  return {
    ...state,
    inferredBasePath,
    detect,
    buildFullUrls,
    copyAllPaths,
    copyAllUrls,
  };
}

