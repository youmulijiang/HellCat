import Dexie, { type EntityTable } from 'dexie';

export interface UrlScreenshotRecord {
  id: string;
  sessionId: string;
  url: string;
  blob: Blob;
  filename: string;
  mimeType: string;
  order: number;
  createdAt: number;
}

export const urlScreenshotDb = new Dexie('HellcatUrlScreenshotDB') as Dexie & {
  screenshots: EntityTable<UrlScreenshotRecord, 'id'>;
};

urlScreenshotDb.version(1).stores({
  screenshots: 'id, sessionId, order, createdAt',
});