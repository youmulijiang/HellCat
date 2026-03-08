import { useState, useCallback, useEffect } from 'react';
import { browser } from 'wxt/browser';
import { db } from '@/stores/injectDb';
import type { InjectScript, InjectVariable } from '@/types/inject';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function useInject() {
  const [scripts, setScripts] = useState<InjectScript[]>([]);
  const [variables, setVariables] = useState<InjectVariable[]>([]);
  const [loading, setLoading] = useState(false);

  /** 从 Dexie 加载持久化数据 */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [savedScripts, savedVars] = await Promise.all([
        db.scripts.toArray(),
        db.variables.toArray(),
      ]);
      setScripts(savedScripts);
      setVariables(savedVars);
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
    setScripts(prev => [...prev, newScript]);
  }, []);

  const updateScript = useCallback(async (id: string, updates: Partial<Pick<InjectScript, 'name' | 'code' | 'enabled'>>) => {
    await db.scripts.update(id, updates);
    setScripts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const removeScript = useCallback(async (id: string) => {
    await db.scripts.delete(id);
    setScripts(prev => prev.filter(s => s.id !== id));
  }, []);

  const toggleScript = useCallback(async (id: string) => {
    const script = scripts.find(s => s.id === id);
    if (!script) return;
    const newEnabled = !script.enabled;
    await db.scripts.update(id, { enabled: newEnabled });
    setScripts(prev => prev.map(s => s.id === id ? { ...s, enabled: newEnabled } : s));
  }, [scripts]);

  /** 获取当前活动标签页 */
  const getActiveTab = useCallback(async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    return tab;
  }, []);

  /** 注入启用的脚本到当前页面 */
  const injectEnabledScripts = useCallback(async () => {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    const enabledScripts = scripts.filter(s => s.enabled);
    for (const script of enabledScripts) {
      await browser.tabs.sendMessage(tab.id, { action: 'injectScript', code: script.code });
    }
  }, [scripts, getActiveTab]);

  /** 注入单个脚本 */
  const injectSingleScript = useCallback(async (code: string) => {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    await browser.tabs.sendMessage(tab.id, { action: 'injectScript', code });
  }, [getActiveTab]);

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

