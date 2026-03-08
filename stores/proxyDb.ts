import Dexie, { type EntityTable } from 'dexie';
import type { ProxyProfile, ProxyGlobalSettings } from '@/types/proxy';

/**
 * Proxy 模块 IndexedDB 数据库
 */

interface ProxySettingsRecord {
  id: string;
  settings: ProxyGlobalSettings;
}

const proxyDb = new Dexie('HellcatProxyDB') as Dexie & {
  profiles: EntityTable<ProxyProfile, 'id'>;
  settings: EntityTable<ProxySettingsRecord, 'id'>;
};

proxyDb.version(1).stores({
  profiles: 'id, name, enabled, createdAt',
  settings: 'id',
});

/** 默认全局设置 */
const DEFAULT_SETTINGS: ProxyGlobalSettings = {
  mode: 'direct',
  activeProfileId: null,
};

/** 获取全局设置 */
export async function getGlobalSettings(): Promise<ProxyGlobalSettings> {
  const record = await proxyDb.settings.get('global');
  return record?.settings ?? { ...DEFAULT_SETTINGS };
}

/** 保存全局设置 */
export async function saveGlobalSettings(settings: ProxyGlobalSettings): Promise<void> {
  await proxyDb.settings.put({ id: 'global', settings });
}

export { proxyDb };

