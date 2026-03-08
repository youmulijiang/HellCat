import Dexie, { type EntityTable } from 'dexie';
import type { InjectScript, InjectVariable } from '@/types/inject';

/**
 * Inject 模块 IndexedDB 数据库
 * 使用 Dexie 进行持久化存储
 */
const db = new Dexie('HellcatInjectDB') as Dexie & {
  scripts: EntityTable<InjectScript, 'id'>;
  variables: EntityTable<InjectVariable, 'id'>;
};

db.version(1).stores({
  scripts: 'id, name, enabled, createdAt',
  variables: 'id, key',
});

export { db };

