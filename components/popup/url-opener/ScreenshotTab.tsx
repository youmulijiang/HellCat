import React, { useState, useRef } from 'react';
import { Button, Input, List, message, Image, Progress, Tag } from 'antd';
import {
  CameraOutlined,
  DownloadOutlined,
  DeleteOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { browser } from 'wxt/browser';

const { TextArea } = Input;

/** 规范化 URL */
const normalizeUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

interface ScreenshotResult {
  url: string;
  dataUrl: string;
  timestamp: number;
}

export const ScreenshotTab: React.FC = () => {
  const [text, setText] = useState('');
  const [results, setResults] = useState<ScreenshotResult[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const abortRef = useRef(false);

  const lineCount = text.split(/[\n\r]+/).filter((l) => l.trim()).length;

  /** 等待页面加载完成 */
  const waitForTabLoad = (tabId: number, timeout = 15000): Promise<void> =>
    new Promise((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => { if (!resolved) { resolved = true; resolve(); } }, timeout);
      const listener = (id: number, info: { status?: string }) => {
        if (id === tabId && info.status === 'complete' && !resolved) {
          resolved = true;
          clearTimeout(timer);
          browser.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      browser.tabs.onUpdated.addListener(listener);
    });

  /** 开始截图 */
  const handleStart = async () => {
    const urls = text
      .split(/[\n\r]+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map(normalizeUrl)
      .filter(Boolean);

    if (urls.length === 0) {
      message.warning('请输入至少一个URL');
      return;
    }

    abortRef.current = false;
    setRunning(true);
    setResults([]);
    setProgress({ current: 0, total: urls.length });

    const newResults: ScreenshotResult[] = [];

    for (let i = 0; i < urls.length; i++) {
      if (abortRef.current) break;
      setProgress({ current: i + 1, total: urls.length });

      let tabId: number | undefined;
      try {
        const tab = await browser.tabs.create({ url: urls[i], active: true });
        tabId = tab.id;
        if (tabId) await waitForTabLoad(tabId);
        // 额外等待渲染
        await new Promise((r) => setTimeout(r, 1500));

        if (abortRef.current) {
          if (tabId) try { await browser.tabs.remove(tabId); } catch { /* */ }
          break;
        }

        const dataUrl = await browser.tabs.captureVisibleTab(undefined, {
          format: 'png',
        });
        newResults.push({ url: urls[i], dataUrl, timestamp: Date.now() });
        setResults([...newResults]);
      } catch (err) {
        console.warn(`[Hellcat] Screenshot failed for ${urls[i]}:`, err);
      } finally {
        if (tabId) {
          try { await browser.tabs.remove(tabId); } catch { /* */ }
        }
      }
    }

    setRunning(false);
    if (!abortRef.current) {
      message.success(`截图完成，成功 ${newResults.length}/${urls.length}`);
    }
  };

  /** 停止 */
  const handleStop = () => { abortRef.current = true; };

  /** 导出全部截图为 zip（逐个下载） */
  const handleExportAll = () => {
    if (results.length === 0) return;
    results.forEach((r, i) => {
      const a = document.createElement('a');
      a.href = r.dataUrl;
      const hostname = new URL(r.url).hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
      a.download = `screenshot_${i + 1}_${hostname}.png`;
      a.click();
    });
    message.success(`已导出 ${results.length} 张截图`);
  };

  /** 导出单张 */
  const handleExportSingle = (result: ScreenshotResult, index: number) => {
    const a = document.createElement('a');
    a.href = result.dataUrl;
    const hostname = new URL(result.url).hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
    a.download = `screenshot_${index + 1}_${hostname}.png`;
    a.click();
  };

  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col h-full gap-2">
      {/* URL 输入区 */}
      <div className={results.length > 0 || running ? 'h-20 shrink-0' : 'flex-1 min-h-0'}>
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'每行一个URL，例如:\nexample.com\nhttps://google.com'}
          className="!h-full !resize-none text-xs font-mono"
          spellCheck={false}
          disabled={running}
        />
      </div>

      {/* 进度 */}
      {running && (
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center justify-between">
            <Tag color="processing">截图中</Tag>
            <span className="text-[10px] text-gray-400">
              {progress.current} / {progress.total}
            </span>
          </div>
          <Progress percent={percent} size="small" showInfo={false} />
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
                    onClick={() => handleExportSingle(item, index)}
                  />,
                ]}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Image
                    src={item.dataUrl}
                    width={48}
                    height={32}
                    className="rounded border border-gray-200 object-cover shrink-0"
                    preview={{ mask: '预览' }}
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
          {results.length > 0 ? `${results.length} 张截图` : `${lineCount} 个URL`}
        </span>
        <div className="flex items-center gap-1">
          {running ? (
            <Button size="small" danger icon={<StopOutlined />} onClick={handleStop}>
              停止
            </Button>
          ) : (
            <>
              {results.length > 0 && (
                <>
                  <Button
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => setResults([])}
                  >
                    清空
                  </Button>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={handleExportAll}
                  >
                    导出全部
                  </Button>
                </>
              )}
              <Button
                type="primary"
                size="small"
                icon={<CameraOutlined />}
                disabled={lineCount === 0}
                onClick={handleStart}
              >
                开始截图
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
