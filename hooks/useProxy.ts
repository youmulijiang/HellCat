import { useState, useCallback, useEffect } from 'react';
import { browser } from 'wxt/browser';
import { proxyDb, getGlobalSettings, saveGlobalSettings } from '@/stores/proxyDb';
import type { ProxyProfile, ProxyGlobalSettings, ProxyScheme } from '@/types/proxy';
import { PROFILE_COLORS, DEFAULT_PORTS } from '@/types/proxy';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function useProxy() {
  const [profiles, setProfiles] = useState<ProxyProfile[]>([]);
  const [globalSettings, setGlobalSettings] = useState<ProxyGlobalSettings>({
    mode: 'direct',
    activeProfileId: null,
  });
  const [loading, setLoading] = useState(false);

  /** 从 Dexie 加载数据 */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [savedProfiles, settings] = await Promise.all([
        proxyDb.profiles.toArray(),
        getGlobalSettings(),
      ]);
      setProfiles(savedProfiles);
      setGlobalSettings(settings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /** 应用代理设置到浏览器 */
  const applyProxy = useCallback(async (settings: ProxyGlobalSettings, profileList?: ProxyProfile[]) => {
    const list = profileList ?? profiles;
    if (settings.mode === 'direct') {
      await browser.proxy.settings.set({ value: { mode: 'direct' }, scope: 'regular' });
    } else if (settings.mode === 'system') {
      await browser.proxy.settings.set({ value: { mode: 'system' }, scope: 'regular' });
    } else if (settings.mode === 'pac_script') {
      const pacScript: Record<string, unknown> = {};
      if (settings.pacScriptUrl) pacScript.url = settings.pacScriptUrl;
      else if (settings.pacScriptData) pacScript.data = settings.pacScriptData;
      await browser.proxy.settings.set({
        value: { mode: 'pac_script', pacScript },
        scope: 'regular',
      });
    } else if (settings.mode === 'fixed_servers' && settings.activeProfileId) {
      const profile = list.find(p => p.id === settings.activeProfileId);
      if (profile) {
        const proxyServer = {
          scheme: profile.server.scheme,
          host: profile.server.host,
          port: profile.server.port,
        };
        await browser.proxy.settings.set({
          value: {
            mode: 'fixed_servers',
            rules: {
              singleProxy: proxyServer,
              bypassList: profile.bypassList,
            },
          },
          scope: 'regular',
        });
      }
    }
  }, [profiles]);

  /** 添加代理配置 */
  const addProfile = useCallback(async (data: {
    name: string; scheme: ProxyScheme; host: string; port: number;
    username?: string; password?: string; bypassList?: string[];
  }) => {
    const now = Date.now();
    const profile: ProxyProfile = {
      id: uid(),
      name: data.name,
      color: PROFILE_COLORS[profiles.length % PROFILE_COLORS.length],
      server: {
        scheme: data.scheme,
        host: data.host,
        port: data.port || DEFAULT_PORTS[data.scheme],
        username: data.username,
        password: data.password,
      },
      bypassList: data.bypassList ?? ['localhost', '127.0.0.1', '<local>'],
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };
    await proxyDb.profiles.add(profile);
    setProfiles(prev => [...prev, profile]);
    return profile;
  }, [profiles.length]);

  /** 更新代理配置 */
  const updateProfile = useCallback(async (id: string, data: Partial<ProxyProfile>) => {
    const updated = { ...data, updatedAt: Date.now() };
    await proxyDb.profiles.update(id, updated);
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  }, []);

  /** 删除代理配置 */
  const removeProfile = useCallback(async (id: string) => {
    await proxyDb.profiles.delete(id);
    setProfiles(prev => prev.filter(p => p.id !== id));
    // 如果删除的是当前激活的，切回 direct
    if (globalSettings.activeProfileId === id) {
      const newSettings = { ...globalSettings, mode: 'direct' as const, activeProfileId: null };
      await saveGlobalSettings(newSettings);
      setGlobalSettings(newSettings);
      await applyProxy(newSettings);
    }
  }, [globalSettings, applyProxy]);

  /** 切换代理模式 */
  const switchMode = useCallback(async (mode: ProxyGlobalSettings['mode'], profileId?: string | null) => {
    const newSettings: ProxyGlobalSettings = {
      ...globalSettings,
      mode,
      activeProfileId: profileId ?? globalSettings.activeProfileId,
    };
    await saveGlobalSettings(newSettings);
    setGlobalSettings(newSettings);
    await applyProxy(newSettings);
  }, [globalSettings, applyProxy]);

  /** 激活某个代理配置 */
  const activateProfile = useCallback(async (id: string) => {
    await switchMode('fixed_servers', id);
  }, [switchMode]);

  /** 断开代理（切回直连） */
  const disconnect = useCallback(async () => {
    await switchMode('direct', null);
  }, [switchMode]);

  /** 更新绕过列表 */
  const updateBypassList = useCallback(async (profileId: string, bypassList: string[]) => {
    await updateProfile(profileId, { bypassList });
    // 如果是当前激活的配置，重新应用
    if (globalSettings.activeProfileId === profileId && globalSettings.mode === 'fixed_servers') {
      const updatedProfiles = profiles.map(p =>
        p.id === profileId ? { ...p, bypassList } : p
      );
      await applyProxy(globalSettings, updatedProfiles);
    }
  }, [globalSettings, profiles, updateProfile, applyProxy]);

  return {
    profiles, globalSettings, loading,
    addProfile, updateProfile, removeProfile,
    switchMode, activateProfile, disconnect,
    updateBypassList,
  };
}

