import { useState, useEffect, useCallback } from 'react';

type BrowserCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: string;
  expirationDate?: number;
};

export interface CookieItem {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'no_restriction' | 'lax' | 'strict' | 'unspecified';
  expirationDate?: number;
  /** 用于标识的唯一key */
  key: string;
}

/** 将浏览器 cookie 转为内部格式 */
const toCookieItem = (c: BrowserCookie): CookieItem => ({
  name: c.name,
  value: c.value,
  domain: c.domain,
  path: c.path,
  secure: c.secure,
  httpOnly: c.httpOnly,
  sameSite: c.sameSite as CookieItem['sameSite'],
  expirationDate: c.expirationDate,
  key: `${c.domain}|${c.path}|${c.name}`,
});

export function useCookies() {
  const [cookies, setCookies] = useState<CookieItem[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentDomain, setCurrentDomain] = useState('');
  const [loading, setLoading] = useState(false);

  /** 获取当前标签页信息 */
  const getCurrentTab = useCallback(async () => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  }, []);

  /** 加载当前域名的所有 cookie */
  const loadCookies = useCallback(async () => {
    setLoading(true);
    try {
      const tab = await getCurrentTab();
      if (!tab?.url) return;

      const url = new URL(tab.url);
      setCurrentUrl(tab.url);
      setCurrentDomain(url.hostname);

      const allCookies = await browser.cookies.getAll({ url: tab.url });
      setCookies(allCookies.map(toCookieItem));
    } catch (err) {
      console.error('加载Cookie失败:', err);
    } finally {
      setLoading(false);
    }
  }, [getCurrentTab]);

  /** 删除单个 cookie */
  const removeCookie = useCallback(async (cookie: CookieItem) => {
    const protocol = cookie.secure ? 'https' : 'http';
    const domain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
    const url = `${protocol}://${domain}${cookie.path}`;
    await browser.cookies.remove({ url, name: cookie.name });
    await loadCookies();
  }, [loadCookies]);

  /** 删除所有 cookie */
  const removeAllCookies = useCallback(async () => {
    await Promise.all(cookies.map((c) => removeCookie(c)));
  }, [cookies, removeCookie]);

  /** 添加或更新 cookie */
  const setCookie = useCallback(async (cookie: Omit<CookieItem, 'key'>) => {
    const protocol = cookie.secure ? 'https' : 'http';
    const domain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
    const url = `${protocol}://${domain}${cookie.path}`;

    await browser.cookies.set({
      url,
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
      expirationDate: cookie.expirationDate,
    });
    await loadCookies();
  }, [loadCookies]);

  /** 导出所有 cookie 为 JSON 字符串 */
  const exportCookies = useCallback(() => {
    return JSON.stringify(cookies, null, 2);
  }, [cookies]);

  /** 导入 cookie (JSON 字符串) */
  const importCookies = useCallback(async (json: string) => {
    const items: Omit<CookieItem, 'key'>[] = JSON.parse(json);
    for (const item of items) {
      await setCookie(item);
    }
  }, [setCookie]);

  useEffect(() => {
    loadCookies();
  }, [loadCookies]);

  return {
    cookies,
    currentUrl,
    currentDomain,
    loading,
    loadCookies,
    removeCookie,
    removeAllCookies,
    setCookie,
    exportCookies,
    importCookies,
  };
}

