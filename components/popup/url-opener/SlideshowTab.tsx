import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, InputNumber, Progress, Tag, message } from 'antd';
import {
  CaretRightOutlined,
  PauseOutlined,
  StopOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { browser } from 'wxt/browser';
import {
  URL_SLIDESHOW_STORAGE_KEY,
  createIdleUrlSlideshowState,
  normalizeUrlSlideshowState,
  type UrlSlideshowResponse,
  type UrlSlideshowState,
} from '@/types/url-slideshow';

const { TextArea } = Input;

/** 规范化 URL */
const normalizeUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const SlideshowTab: React.FC = () => {
  const [text, setText] = useState('');
  const [duration, setDuration] = useState(10);
  const [state, setState] = useState<UrlSlideshowState>(createIdleUrlSlideshowState());
  const activeItemRef = useRef<HTMLDivElement | null>(null);

  const previewUrls = useMemo(
    () => text
      .split(/[\n\r]+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map(normalizeUrl)
      .filter(Boolean),
    [text],
  );

  const lineCount = previewUrls.length;
  const hasSession = state.urls.length > 0 && (state.running || state.paused || state.completed);
  const displayUrls = hasSession ? state.urls : previewUrls;

  const syncStateFromStorage = useCallback(async () => {
    const data = await browser.storage.local.get(URL_SLIDESHOW_STORAGE_KEY);
    const nextState = normalizeUrlSlideshowState(data[URL_SLIDESHOW_STORAGE_KEY]);
    setState(nextState);
    if (!nextState.running && !nextState.paused) {
      setDuration(nextState.duration || 10);
    }
  }, []);

  useEffect(() => {
    void syncStateFromStorage();

    const handleStorageChange = (
      changes: Record<string, Browser.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'local' || !changes[URL_SLIDESHOW_STORAGE_KEY]) return;
      setState(normalizeUrlSlideshowState(changes[URL_SLIDESHOW_STORAGE_KEY].newValue));
    };

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, [syncStateFromStorage]);

  useEffect(() => {
    if ((state.running || state.paused) && state.urls.length > 0) {
      const nextText = state.urls.join('\n');
      setText((prev) => (prev === nextText ? prev : nextText));
    }
  }, [state.paused, state.running, state.urls]);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [state.completed, state.currentIndex, state.paused, state.running]);

  const sendControlMessage = useCallback(async (action: string, payload?: Record<string, unknown>) => {
    const response = await browser.runtime.sendMessage({ action, ...(payload ?? {}) }) as UrlSlideshowResponse;
    if (!response?.success) {
      throw new Error(response?.error || '操作失败');
    }
    if (response.state) {
      setState(normalizeUrlSlideshowState(response.state));
    }
    return response;
  }, []);

  const handleStart = useCallback(async () => {
    if (previewUrls.length === 0) {
      message.warning('请输入至少一个URL');
      return;
    }

    try {
      await sendControlMessage('startUrlSlideshow', { urls: previewUrls, duration });
      message.success('幻灯片已开始播放');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '启动幻灯片失败');
    }
  }, [duration, previewUrls, sendControlMessage]);

  const handlePauseResume = useCallback(async () => {
    try {
      if (state.paused) {
        await sendControlMessage('resumeUrlSlideshow');
        message.success('已继续播放');
      } else {
        await sendControlMessage('pauseUrlSlideshow');
        message.success('已暂停播放');
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '切换播放状态失败');
    }
  }, [sendControlMessage, state.paused]);

  const handleStop = useCallback(async () => {
    try {
      await sendControlMessage('stopUrlSlideshow');
      message.success('已停止播放');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '停止播放失败');
    }
  }, [sendControlMessage]);

  const percent = state.total > 0
    ? (state.completed ? 100 : Math.round(((state.currentIndex + 1) / state.total) * 100))
    : 0;
  const statusColor = state.completed ? 'success' : (state.paused ? 'orange' : 'processing');
  const statusText = state.completed ? '已完成' : (state.paused ? '已暂停' : '播放中');

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <div className="flex items-center gap-2">
          <ClockCircleOutlined className="text-gray-400" />
          <span className="text-xs font-medium text-gray-700">每页停留</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <InputNumber
            min={1}
            max={300}
            value={duration}
            onChange={(value) => setDuration(value ?? 10)}
            size="small"
            className="w-24"
            disabled={state.running || state.paused}
          />
          <span className="text-xs text-gray-400">秒 / 页</span>
          {hasSession && <Tag color={statusColor}>{statusText}</Tag>}
        </div>
      </div>

      <div className="flex-[1.1] min-h-0 flex flex-col [&_.ant-input]:!flex-1 [&_.ant-input]:!resize-none">
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'每行一个URL，例如:\nexample.com\nhttps://google.com'}
          className="!h-full !resize-none rounded-lg text-xs font-mono"
          spellCheck={false}
          disabled={state.running || state.paused}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">播放队列</span>
          <span className="text-[10px] text-gray-400">{displayUrls.length} 个 URL</span>
        </div>

        <div className="max-h-32 overflow-y-auto pr-1">
          {displayUrls.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {displayUrls.map((url, index) => {
                const isCurrent = hasSession && index === state.currentIndex;
                const isDone = hasSession && index < state.currentIndex;
                const itemClassName = isCurrent
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : isDone
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600';

                return (
                  <div
                    key={`${index}-${url}`}
                    ref={isCurrent ? activeItemRef : undefined}
                    className={`rounded-md border px-2 py-2 transition-colors ${itemClassName}`}
                  >
                    <div className="flex items-center gap-2 text-[11px] font-medium">
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/80 px-1 text-[10px]">
                        {index + 1}
                      </span>
                      <span className="truncate">{url}</span>
                      {isCurrent && (
                        <span className="ml-auto shrink-0 rounded-full bg-white/90 px-2 py-0.5 text-[10px]">
                          {state.paused ? '暂停中' : (state.completed ? '结束' : '当前')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-gray-200 px-3 py-4 text-center text-[11px] text-gray-400">
              请输入 URL 列表后开始播放
            </div>
          )}
        </div>
      </div>

      {hasSession && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">播放进度</span>
            <span className="text-[10px] text-gray-400">
              {Math.min(state.currentIndex + 1, state.total)} / {state.total}
            </span>
          </div>
          <Progress percent={percent} size="small" showInfo={false} />
          <div className="truncate text-[10px] text-gray-500" title={state.currentUrl || displayUrls[state.currentIndex] || ''}>
            当前: {state.currentUrl || displayUrls[state.currentIndex] || '-'}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          {hasSession ? `${state.total} 个URL` : `${lineCount} 个URL`}
        </span>
        <div className="flex items-center gap-2">
          {state.running || state.paused ? (
            <>
              <Button
                size="small"
                type={state.paused ? 'primary' : 'default'}
                icon={state.paused ? <CaretRightOutlined /> : <PauseOutlined />}
                onClick={handlePauseResume}
              >
                {state.paused ? '继续' : '暂停'}
              </Button>
              <Button size="small" danger icon={<StopOutlined />} onClick={handleStop}>
                停止
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              size="small"
              icon={<CaretRightOutlined />}
              disabled={lineCount === 0}
              onClick={handleStart}
            >
              开始播放
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};