import { useState, useCallback, useEffect, useRef } from 'react';
import { browser } from 'wxt/browser';
import { db } from '@/stores/injectDb';
import type { InjectScript, InjectVariable } from '@/types/inject';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type AutoInjectStorageScript = Pick<InjectScript, 'id' | 'name' | 'code'>;

function toAutoInjectStorageScripts(scripts: InjectScript[]): AutoInjectStorageScript[] {
  return scripts
    .filter(s => s.enabled)
    .map(s => ({ id: s.id, name: s.name, code: s.code }));
}

function isSameAutoInjectScripts(a: AutoInjectStorageScript[] | undefined, b: AutoInjectStorageScript[]) {
  if (!a || a.length !== b.length) return false;
  return a.every((item, index) => (
    item.id === b[index]?.id
    && item.name === b[index]?.name
    && item.code === b[index]?.code
  ));
}

/** 将启用的脚本同步到 browser.storage.local，供 background 自动注入使用 */
async function syncEnabledScriptsToStorage(scripts: InjectScript[]) {
  await browser.storage.local.set({ hellcatAutoInjectScripts: toAutoInjectStorageScripts(scripts) });
}

/** 首次打开注入面板时，按需修复 storage 中的自动注入脚本状态 */
async function syncEnabledScriptsToStorageIfNeeded(scripts: InjectScript[]) {
  const next = toAutoInjectStorageScripts(scripts);
  const data = await browser.storage.local.get('hellcatAutoInjectScripts');
  const current = Array.isArray(data.hellcatAutoInjectScripts)
    ? data.hellcatAutoInjectScripts as AutoInjectStorageScript[]
    : undefined;

  if (isSameAutoInjectScripts(current, next)) return;
  await browser.storage.local.set({ hellcatAutoInjectScripts: next });
}

export function useInject() {
  const [scripts, setScripts] = useState<InjectScript[]>([]);
  const [variables, setVariables] = useState<InjectVariable[]>([]);
  const [loading, setLoading] = useState(false);
  const scriptsRef = useRef<InjectScript[]>([]);

  const setScriptsAndSync = useCallback(async (next: InjectScript[]) => {
    scriptsRef.current = next;
    setScripts(next);
    await syncEnabledScriptsToStorage(next);
  }, []);

  useEffect(() => {
    scriptsRef.current = scripts;
  }, [scripts]);

  /** 从 Dexie 加载持久化数据 */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [savedScripts, savedVars] = await Promise.all([
        db.scripts.toArray(),
        db.variables.toArray(),
      ]);
      scriptsRef.current = savedScripts;
      setScripts(savedScripts);
      setVariables(savedVars);
      // 非阻塞修复历史残留的 storage 状态，避免首次打开注入面板卡顿
      void syncEnabledScriptsToStorageIfNeeded(savedScripts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ========== 脚本管理 ==========
  const addScript = useCallback(async (name: string, code: string) => {
    const newScript: InjectScript = { id: uid(), name, code, enabled: false, createdAt: Date.now() };
    await db.scripts.add(newScript);
    const next = [...scriptsRef.current, newScript];
    await setScriptsAndSync(next);
  }, [setScriptsAndSync]);

  const updateScript = useCallback(async (id: string, updates: Partial<Pick<InjectScript, 'name' | 'code' | 'enabled'>>) => {
    await db.scripts.update(id, updates);
    const next = scriptsRef.current.map(s => s.id === id ? { ...s, ...updates } : s);
    await setScriptsAndSync(next);
  }, [setScriptsAndSync]);

  const removeScript = useCallback(async (id: string) => {
    await db.scripts.delete(id);
    const next = scriptsRef.current.filter(s => s.id !== id);
    await setScriptsAndSync(next);
  }, [setScriptsAndSync]);

  const toggleScript = useCallback(async (id: string) => {
    const script = scriptsRef.current.find(s => s.id === id);
    if (!script) return;
    const newEnabled = !script.enabled;
    await db.scripts.update(id, { enabled: newEnabled });
    const next = scriptsRef.current.map(s => s.id === id ? { ...s, enabled: newEnabled } : s);
    await setScriptsAndSync(next);
  }, [setScriptsAndSync]);

  /** 获取当前活动标签页 */
  const getActiveTab = useCallback(async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    return tab;
  }, []);

  /** 通过 scripting API 直接在页面中执行脚本 */
  const executeInPage = useCallback(async (tabId: number, code: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const results = await browser.scripting.executeScript({
        target: { tabId },
        func: (scriptCode: string) => {
          const mountAndRun = () => {
            const parent = document.head || document.documentElement || document.body;
            if (!parent) return false;

            const el = document.createElement('script');
            el.textContent = scriptCode;
            parent.appendChild(el);
            el.remove();
            return true;
          };

          try {
            if (!mountAndRun()) {
              const observer = new MutationObserver(() => {
                if (mountAndRun()) observer.disconnect();
              });

              observer.observe(document, { childList: true, subtree: true });
              window.addEventListener('DOMContentLoaded', () => {
                if (mountAndRun()) observer.disconnect();
              }, { once: true });
            }

            return { status: 'ok' };
          } catch (e) {
            return { status: 'error', error: String(e) };
          }
        },
        args: [code],
        world: 'MAIN',
        injectImmediately: true,
      });
      const result = results?.[0]?.result as { status: string; error?: string } | undefined;
      if (result?.status === 'ok') return { ok: true };
      return { ok: false, error: result?.error || '注入失败' };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }, []);

  /** 注入启用的脚本到当前页面，返回 { success: number, failed: number } */
  const injectEnabledScripts = useCallback(async (): Promise<{ success: number; failed: number }> => {
    const tab = await getActiveTab();
    if (!tab?.id) return { success: 0, failed: 0 };
    const enabledScripts = scripts.filter(s => s.enabled);
    let success = 0;
    let failed = 0;
    for (const script of enabledScripts) {
      const result = await executeInPage(tab.id, script.code);
      if (result.ok) success++;
      else failed++;
    }
    return { success, failed };
  }, [scripts, getActiveTab, executeInPage]);

  /** 注入单个脚本，返回 { ok: boolean, error?: string } */
  const injectSingleScript = useCallback(async (code: string): Promise<{ ok: boolean; error?: string }> => {
    const tab = await getActiveTab();
    if (!tab?.id) return { ok: false, error: '无法获取当前标签页' };
    return executeInPage(tab.id, code);
  }, [getActiveTab, executeInPage]);

  // ========== 文本填充 ==========
  const fillText = useCallback(async (text: string) => {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    await browser.tabs.sendMessage(tab.id, { action: 'textFill', text, partial: false });
  }, [getActiveTab]);

  /** 开始区域选择（携带填充文本） */
  const startRegionSelect = useCallback(async (text: string) => {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    await browser.tabs.sendMessage(tab.id, { action: 'startRegionSelect', text });
  }, [getActiveTab]);

  /** 停止区域选择 */
  const stopRegionSelect = useCallback(async () => {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    await browser.tabs.sendMessage(tab.id, { action: 'stopRegionSelect' });
  }, [getActiveTab]);

  /** 在选定区域内填充文本 */
  const fillTextInRegion = useCallback(async (text: string, rect: { x: number; y: number; width: number; height: number }) => {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    await browser.tabs.sendMessage(tab.id, { action: 'regionFill', text, rect });
  }, [getActiveTab]);

  // ========== 变量管理 ==========
  const addVariable = useCallback(async (key: string, value: string) => {
    const newVar: InjectVariable = { id: uid(), key, value };
    await db.variables.add(newVar);
    setVariables(prev => [...prev, newVar]);
  }, []);

  const updateVariable = useCallback(async (id: string, updates: Partial<Pick<InjectVariable, 'key' | 'value'>>) => {
    await db.variables.update(id, updates);
    setVariables(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  }, []);

  const removeVariable = useCallback(async (id: string) => {
    await db.variables.delete(id);
    setVariables(prev => prev.filter(v => v.id !== id));
  }, []);

  /** 用变量替换文本中的 {{key}} 占位符 */
  const resolveVariables = useCallback((text: string): string => {
    let result = text;
    for (const v of variables) {
      result = result.replaceAll(`{{${v.key}}}`, v.value);
    }
    return result;
  }, [variables]);

  /** 将变量注入到页面表单中 */
  const fillVariables = useCallback(async () => {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    const varMap: Record<string, string> = {};
    for (const v of variables) {
      varMap[v.key] = v.value;
    }
    await browser.tabs.sendMessage(tab.id, { action: 'variableFill', variables: varMap });
  }, [variables, getActiveTab]);

  return {
    scripts, addScript, updateScript, removeScript, toggleScript,
    injectEnabledScripts, injectSingleScript,
    fillText, startRegionSelect, stopRegionSelect, fillTextInRegion,
    variables, addVariable, updateVariable, removeVariable,
    resolveVariables, fillVariables,
    loading,
  };
}

