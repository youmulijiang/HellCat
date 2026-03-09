export const URL_SCREENSHOT_STORAGE_KEY = 'hellcatUrlScreenshotState';

export interface UrlScreenshotState {
  running: boolean;
  stopping: boolean;
  completed: boolean;
  currentIndex: number;
  processedCount: number;
  total: number;
  currentUrl: string;
  sessionId: string | null;
  capturedCount: number;
  failedCount: number;
  updatedAt: number;
  lastError: string;
}

export interface StartUrlScreenshotMessage {
  action: 'startUrlScreenshot';
  urls: string[];
}

export interface StopUrlScreenshotMessage {
  action: 'stopUrlScreenshot';
}

export interface GetUrlScreenshotStateMessage {
  action: 'getUrlScreenshotState';
}

export interface ClearUrlScreenshotResultsMessage {
  action: 'clearUrlScreenshotResults';
}

export type UrlScreenshotRuntimeMessage =
  | StartUrlScreenshotMessage
  | StopUrlScreenshotMessage
  | GetUrlScreenshotStateMessage
  | ClearUrlScreenshotResultsMessage;

export interface UrlScreenshotResponse {
  success: boolean;
  state?: UrlScreenshotState;
  error?: string;
}

export const createIdleUrlScreenshotState = (): UrlScreenshotState => ({
  running: false,
  stopping: false,
  completed: false,
  currentIndex: 0,
  processedCount: 0,
  total: 0,
  currentUrl: '',
  sessionId: null,
  capturedCount: 0,
  failedCount: 0,
  updatedAt: 0,
  lastError: '',
});

export const normalizeUrlScreenshotState = (value: unknown): UrlScreenshotState => {
  const fallback = createIdleUrlScreenshotState();
  if (!value || typeof value !== 'object') return fallback;

  const source = value as Partial<UrlScreenshotState>;
  const total = Number.isInteger(source.total) ? Math.max(0, Number(source.total)) : 0;
  const processedCount = Number.isInteger(source.processedCount)
    ? Math.min(Math.max(0, Number(source.processedCount)), total)
    : 0;
  const currentIndex = Number.isInteger(source.currentIndex)
    ? Math.min(Math.max(0, Number(source.currentIndex)), Math.max(total - 1, 0))
    : 0;

  return {
    running: Boolean(source.running),
    stopping: Boolean(source.stopping),
    completed: Boolean(source.completed),
    currentIndex,
    processedCount,
    total,
    currentUrl: typeof source.currentUrl === 'string' ? source.currentUrl : '',
    sessionId: typeof source.sessionId === 'string' && source.sessionId ? source.sessionId : null,
    capturedCount: Number.isInteger(source.capturedCount)
      ? Math.min(Math.max(0, Number(source.capturedCount)), total)
      : 0,
    failedCount: Number.isInteger(source.failedCount)
      ? Math.min(Math.max(0, Number(source.failedCount)), total)
      : 0,
    updatedAt: typeof source.updatedAt === 'number' && Number.isFinite(source.updatedAt)
      ? source.updatedAt
      : 0,
    lastError: typeof source.lastError === 'string' ? source.lastError : '',
  };
};