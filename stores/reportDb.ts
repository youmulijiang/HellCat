import Dexie, { type EntityTable } from 'dexie';

/** 报告数据结构 */
export interface Report {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

/** 报告图片数据结构 */
export interface ReportImage {
  id: string;
  reportId: string;
  blob: Blob;
  name: string;
  mimeType: string;
  createdAt: number;
}

/**
 * 报告编写模块 IndexedDB 数据库
 * 使用 Dexie 进行持久化存储
 */
const db = new Dexie('HellcatReportDB') as Dexie & {
  reports: EntityTable<Report, 'id'>;
  images: EntityTable<ReportImage, 'id'>;
};

db.version(2).stores({
  reports: 'id, title, updatedAt, createdAt',
  images: 'id, reportId, createdAt',
});

export { db };

