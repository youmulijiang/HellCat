import { useState, useCallback } from 'react';
import { browser } from 'wxt/browser';

export interface UrlEntry {
  id: string;
  url: string;
}

/** URL 打开方式 */
export type OpenMode = 'current-window' | 'new-window';

/** 规范化 URL，自动补全协议 */
const normalizeUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

/** 生成简单唯一 ID */
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function useUrlOpener() {
  const [urls, setUrls] = useState<UrlEntry[]>([{ id: uid(), url: '' }]);
  const [loading, setLoading] = useState(false);

  /** 添加一条 URL 输入行 */
  const addUrl = useCallback(() => {
    setUrls((prev) => [...prev, { id: uid(), url: '' }]);
  }, []);

  /** 删除一条 URL 输入行 */
  const removeUrl = useCallback((id: string) => {
    setUrls((prev) => (prev.length <= 1 ? prev : prev.filter((u) => u.id !== id)));
  }, []);

  /** 更新某一行的 URL 值 */
  const updateUrl = useCallback((id: string, url: string) => {
    setUrls((prev) => prev.map((u) => (u.id === id ? { ...u, url } : u)));
  }, []);

  /** 清空所有 URL 输入 */
  const clearAll = useCallback(() => {
    setUrls([{ id: uid(), url: '' }]);
  }, []);

  /** 批量打开 URL */
  const openUrls = useCallback(
    async (mode: OpenMode) => {
      const validUrls = urls
        .map((u) => normalizeUrl(u.url))
        .filter(Boolean);

      if (validUrls.length === 0) return;

      setLoading(true);
      try {
        if (mode === 'new-window') {
          // 新窗口打开：第一个 URL 作为新窗口 url，其余在该窗口新建标签页
          const win = await browser.windows.create({ url: validUrls[0] });
          for (let i = 1; i < validUrls.length; i++) {
            await browser.tabs.create({ windowId: win.id, url: validUrls[i] });
          }
        } else {
          // 当前窗口打开：每个 URL 新建标签页
          for (const url of validUrls) {
            await browser.tabs.create({ url });
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [urls],
  );

  /** 从文本批量导入 URL（每行一个） */
  const importFromText = useCallback((text: string) => {
    const lines = text
      .split(/[\n\r]+/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    setUrls(lines.map((url) => ({ id: uid(), url })));
  }, []);

  return {
    urls,
    loading,
    addUrl,
    removeUrl,
    updateUrl,
    clearAll,
    openUrls,
    importFromText,
  };
}

