import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Input, List, message, Image, Progress, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  CameraOutlined,
  DownloadOutlined,
  DeleteOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { browser } from 'wxt/browser';
import { createZipBlob } from '@/lib/zip';
import { urlScreenshotDb, type UrlScreenshotRecord } from '@/stores/urlScreenshotDb';
import {
  URL_SCREENSHOT_STORAGE_KEY,
  createIdleUrlScreenshotState,
  normalizeUrlScreenshotState,
  type UrlScreenshotResponse,
  type UrlScreenshotState,
} from '@/types/url-screenshot';

const { TextArea } = Input;

/** 规范化 URL */
const normalizeUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

interface ScreenshotPreview extends UrlScreenshotRecord {
  previewUrl: string;
}

export const ScreenshotTab: React.FC = () => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [results, setResults] = useState<ScreenshotPreview[]>([]);
  const [state, setState] = useState<UrlScreenshotState>(createIdleUrlScreenshotState());
  const [exporting, setExporting] = useState(false);
  const blobUrlsRef = useRef<Map<string, string>>(new Map());
  const loadVersionRef = useRef(0);
  const readyRef = useRef(false);
  const prevRunningRef = useRef(false);

  const lineCount = text.split(/[\n\r]+/).filter((l) => l.trim()).length;

  const statusTag = state.running
    ? (state.stopping ? t('popup.urlOpener.screenshot.statuses.stopping') : t('popup.urlOpener.screenshot.statuses.capturing'))
    : (state.completed
      ? t('popup.urlOpener.screenshot.statuses.completed')
      : (state.processedCount > 0 ? t('popup.urlOpener.screenshot.statuses.stopped') : t('popup.urlOpener.screenshot.statuses.pending')));

  const revokePreviewUrls = useCallback(() => {
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsRef.current.clear();
  }, []);

  const loadResults = useCallback(async (sessionId: string | null) => {
    const loadVersion = ++loadVersionRef.current;
    const records = sessionId
      ? (await urlScreenshotDb.screenshots.where('sessionId').equals(sessionId).toArray())
        .sort((a, b) => a.order - b.order)
      : [];

    const nextResults = records.map((record) => ({
      ...record,
      previewUrl: URL.createObjectURL(record.blob),
    }));

    if (loadVersion !== loadVersionRef.current) {
      nextResults.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return;
    }

    revokePreviewUrls();
    nextResults.forEach((item) => blobUrlsRef.current.set(item.id, item.previewUrl));
    setResults(nextResults);
  }, [revokePreviewUrls]);

  const syncStateFromBackground = useCallback(async () => {
    try {
      const response = await browser.runtime.sendMessage({
        action: 'getUrlScreenshotState',
      }) as UrlScreenshotResponse;
      const nextState = normalizeUrlScreenshotState(response?.state);
      setState(nextState);
      await loadResults(nextState.sessionId);
    } catch {
      setState(createIdleUrlScreenshotState());
      await loadResults(null);
    }
  }, [loadResults]);

  useEffect(() => {
    void syncStateFromBackground();

    const handleStorageChange = (changes: Record<string, { newValue?: unknown }>, areaName: string) => {
      if (areaName !== 'local' || !changes[URL_SCREENSHOT_STORAGE_KEY]) return;
      const nextState = normalizeUrlScreenshotState(changes[URL_SCREENSHOT_STORAGE_KEY].newValue);
      setState(nextState);
      void loadResults(nextState.sessionId);
    };

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange);
      revokePreviewUrls();
    };
  }, [loadResults, revokePreviewUrls, syncStateFromBackground]);

  useEffect(() => {
    if (!readyRef.current) {
      readyRef.current = true;
      prevRunningRef.current = state.running;
      return;
    }

    if (prevRunningRef.current && !state.running) {
      if (state.completed) {
        message.success(t('popup.urlOpener.screenshot.messages.completed', {
          success: state.capturedCount,
          total: state.total,
        }));
      } else if (state.processedCount > 0 || state.stopping) {
        message.info(t('popup.urlOpener.screenshot.messages.stopped', {
          success: state.capturedCount,
          total: state.total,
        }));
      }
    }

    prevRunningRef.current = state.running;
  }, [state, t]);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  const buildUrls = () => text
    .split(/[\n\r]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizeUrl)
    .filter(Boolean);

  const runAction = useCallback(async (payload: { action: string; urls?: string[] }) => {
    const response = await browser.runtime.sendMessage(payload) as UrlScreenshotResponse;
    if (!response?.success) {
      throw new Error(response?.error || t('popup.urlOpener.screenshot.messages.actionFailed'));
    }

    const nextState = normalizeUrlScreenshotState(response.state);
    setState(nextState);
    await loadResults(nextState.sessionId);
  }, [loadResults, t]);

  const getProgressCurrent = () => {
    if (state.running) {
      return Math.min(state.currentIndex + 1, state.total);
    }
    return state.processedCount;
  };

  /** 开始截图 */
  const handleStart = async () => {
    const urls = buildUrls();

    if (urls.length === 0) {
      message.warning(t('popup.urlOpener.screenshot.messages.inputRequired'));
      return;
    }

    try {
      await runAction({ action: 'startUrlScreenshot', urls });
      message.success(t('popup.urlOpener.screenshot.messages.started', { count: urls.length }));
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('popup.urlOpener.screenshot.messages.startFailed'));
    }
  };

  /** 停止 */
  const handleStop = async () => {
    try {
      await runAction({ action: 'stopUrlScreenshot' });
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('popup.urlOpener.screenshot.messages.stopFailed'));
    }
  };

  /** 清空结果 */
  const handleClear = async () => {
    try {
      await runAction({ action: 'clearUrlScreenshotResults' });
      message.success(t('popup.urlOpener.screenshot.messages.cleared'));
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('popup.urlOpener.screenshot.messages.clearFailed'));
    }
  };

  /** 导出单张 */
  const handleExportSingle = (result: ScreenshotPreview) => {
    downloadBlob(result.blob, result.filename);
  };

  /** 导出全部截图为 zip */
  const handleExportAll = async () => {
    if (results.length === 0) return;

    try {
      setExporting(true);
      const files = await Promise.all(results.map(async (item) => ({
        name: item.filename,
        data: new Uint8Array(await item.blob.arrayBuffer()),
        lastModified: item.createdAt,
      })));
      const zipBlob = createZipBlob(files);
      downloadBlob(zipBlob, `url-screenshots-${state.sessionId ?? Date.now()}.zip`);
      message.success(t('popup.urlOpener.screenshot.messages.exportedZip', { count: results.length }));
    } catch {
      message.error(t('popup.urlOpener.screenshot.messages.exportZipFailed'));
    } finally {
      setExporting(false);
    }
  };

  const percent = state.total > 0 ? Math.round((state.processedCount / state.total) * 100) : 0;

  return (
    <div className="flex flex-col h-full gap-2">
      {/* URL 输入区 */}
      <div className={results.length > 0 || state.running ? 'h-20 shrink-0' : 'flex-1 min-h-0 flex flex-col [&_.ant-input]:!flex-1 [&_.ant-input]:!resize-none'}>
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('popup.urlOpener.screenshot.placeholder')}
          className="!h-full !resize-none text-xs font-mono"
          spellCheck={false}
          disabled={state.running}
        />
      </div>

      {/* 进度 */}
      {(state.running || state.completed || state.processedCount > 0) && (
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center justify-between">
            <Tag color={state.running ? (state.stopping ? 'orange' : 'processing') : (state.completed ? 'success' : 'default')}>
              {statusTag}
            </Tag>
            <span className="text-[10px] text-gray-400">
              {getProgressCurrent()} / {state.total}
            </span>
          </div>
          <Progress percent={percent} size="small" showInfo={false} />
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <span>{t('popup.urlOpener.screenshot.summary.successCount', { count: state.capturedCount })}</span>
            <span>{t('popup.urlOpener.screenshot.summary.failedCount', { count: state.failedCount })}</span>
          </div>
          {state.currentUrl && (
            <div className="truncate text-[10px] text-gray-500" title={state.currentUrl}>
              {t('popup.urlOpener.screenshot.currentUrl', { url: state.currentUrl })}
            </div>
          )}
        </div>
      )}

      {/* 截图结果列表 */}
      {results.length > 0 && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <List
            size="small"
            dataSource={results}
            renderItem={(item, index) => (
              <List.Item
                className="!px-1 !py-1.5"
                actions={[
                  <Button
                    key="download"
                    type="text"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => handleExportSingle(item)}
                  />,
                ]}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Image
                    src={item.previewUrl}
                    width={48}
                    height={32}
                    className="rounded border border-gray-200 object-cover shrink-0"
                    preview={{ mask: t('popup.urlOpener.screenshot.previewMask') }}
                  />
                  <span className="text-[11px] text-gray-600 truncate flex-1" title={item.url}>
                    {item.url}
                  </span>
                </div>
              </List.Item>
            )}
          />
        </div>
      )}

      {/* 底部操作区 */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          {results.length > 0
            ? t('popup.urlOpener.screenshot.imageCount', { count: results.length })
            : (state.total > 0
              ? t('popup.urlOpener.screenshot.summary.successFailure', {
                success: state.capturedCount,
                failed: state.failedCount,
              })
              : t('popup.urlOpener.slideshow.countLabel', { count: lineCount }))}
        </span>
        <div className="flex items-center gap-1">
          {state.running ? (
            <Button size="small" danger icon={<StopOutlined />} onClick={handleStop}>
              {state.stopping ? t('common.status.stopping') : t('common.actions.stop')}
            </Button>
          ) : (
            <>
              {results.length > 0 && (
                <>
                  <Button
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={handleClear}
                  >
                    {t('common.actions.clear')}
                  </Button>
                  <Button
                    size="small"
                    loading={exporting}
                    icon={<DownloadOutlined />}
                    onClick={handleExportAll}
                  >
                    {t('popup.urlOpener.screenshot.buttons.exportZip')}
                  </Button>
                </>
              )}
              <Button
                type="primary"
                size="small"
                icon={<CameraOutlined />}
                disabled={lineCount === 0 || exporting}
                onClick={handleStart}
              >
                {t('common.actions.start')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
