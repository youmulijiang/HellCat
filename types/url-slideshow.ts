export const URL_SLIDESHOW_STORAGE_KEY = 'hellcatUrlSlideshowState';
export const URL_SLIDESHOW_ALARM_NAME = 'hellcat-url-slideshow-next';

export interface UrlSlideshowState {
  running: boolean;
  paused: boolean;
  completed: boolean;
  currentIndex: number;
  total: number;
  currentUrl: string;
  urls: string[];
  duration: number;
  tabId: number | null;
}

export interface StartUrlSlideshowMessage {
  action: 'startUrlSlideshow';
  urls: string[];
  duration: number;
}

export interface PauseUrlSlideshowMessage {
  action: 'pauseUrlSlideshow';
}

export interface ResumeUrlSlideshowMessage {
  action: 'resumeUrlSlideshow';
}

export interface StopUrlSlideshowMessage {
  action: 'stopUrlSlideshow';
}

export interface GetUrlSlideshowStateMessage {
  action: 'getUrlSlideshowState';
}

export type UrlSlideshowRuntimeMessage =
  | StartUrlSlideshowMessage
  | PauseUrlSlideshowMessage
  | ResumeUrlSlideshowMessage
  | StopUrlSlideshowMessage
  | GetUrlSlideshowStateMessage;

export interface UrlSlideshowResponse {
  success: boolean;
  state?: UrlSlideshowState;
  error?: string;
}

export const createIdleUrlSlideshowState = (): UrlSlideshowState => ({
  running: false,
  paused: false,
  completed: false,
  currentIndex: 0,
  total: 0,
  currentUrl: '',
  urls: [],
  duration: 10,
  tabId: null,
});

export const normalizeUrlSlideshowState = (value: unknown): UrlSlideshowState => {
  const fallback = createIdleUrlSlideshowState();
  if (!value || typeof value !== 'object') return fallback;

  const source = value as Partial<UrlSlideshowState>;
  const urls = Array.isArray(source.urls)
    ? source.urls.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  const maxIndex = Math.max(urls.length - 1, 0);
  const currentIndex = Number.isInteger(source.currentIndex)
    ? Math.min(Math.max(source.currentIndex as number, 0), maxIndex)
    : 0;
  const duration = typeof source.duration === 'number' && Number.isFinite(source.duration)
    ? Math.max(1, Math.round(source.duration))
    : fallback.duration;

  return {
    running: Boolean(source.running),
    paused: Boolean(source.paused),
    completed: Boolean(source.completed),
    currentIndex,
    total: urls.length,
    currentUrl: typeof source.currentUrl === 'string' && source.currentUrl
      ? source.currentUrl
      : (urls[currentIndex] ?? ''),
    urls,
    duration,
    tabId: Number.isInteger(source.tabId) ? Number(source.tabId) : null,
  };
};