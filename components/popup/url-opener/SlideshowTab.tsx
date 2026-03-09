import React, { useState, useRef, useCallback } from 'react';
import { Button, Input, InputNumber, Progress, Tag, message } from 'antd';
import {
  CaretRightOutlined,
  PauseOutlined,
  StopOutlined,
  ClockCircleOutlined,
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

interface SlideshowState {
  running: boolean;
  paused: boolean;
  currentIndex: number;
  total: number;
  currentUrl: string;
}

export const SlideshowTab: React.FC = () => {
  const [text, setText] = useState('');
  const [duration, setDuration] = useState(10);
  const [state, setState] = useState<SlideshowState>({
    running: false,
    paused: false,
    currentIndex: 0,
    total: 0,
    currentUrl: '',
  });

  const abortRef = useRef(false);
  const pauseRef = useRef(false);
  const pauseResolveRef = useRef<(() => void) | null>(null);

  const lineCount = text.split(/[\n\r]+/).filter((l) => l.trim()).length;

  /** 等待指定秒数，支持中止和暂停 */
  const waitSeconds = useCallback(
    (seconds: number) =>
      new Promise<void>((resolve) => {
        const interval = 500;
        let elapsed = 0;
        const tick = () => {
          if (abortRef.current) { resolve(); return; }
          if (pauseRef.current) {
            pauseResolveRef.current = () => tick();
            return;
          }
          elapsed += interval;
          if (elapsed >= seconds * 1000) { resolve(); return; }
          setTimeout(tick, interval);
        };
        setTimeout(tick, interval);
      }),
    [],
  );

  /** 开始幻灯片 */
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
    pauseRef.current = false;
    setState({ running: true, paused: false, currentIndex: 0, total: urls.length, currentUrl: '' });

    for (let i = 0; i < urls.length; i++) {
      if (abortRef.current) break;

      setState((s) => ({ ...s, currentIndex: i, currentUrl: urls[i] }));

      let tabId: number | undefined;
      try {
        const tab = await browser.tabs.create({ url: urls[i], active: true });
        tabId = tab.id;
      } catch {
        continue;
      }

      await waitSeconds(duration);

      if (abortRef.current) {
        if (tabId) try { await browser.tabs.remove(tabId); } catch { /* */ }
        break;
      }

      if (tabId) {
        try { await browser.tabs.remove(tabId); } catch { /* */ }
      }
    }

    setState({ running: false, paused: false, currentIndex: 0, total: 0, currentUrl: '' });
    if (!abortRef.current) message.success('幻灯片播放完成');
  };

  /** 暂停/继续 */
  const handlePauseResume = () => {
    if (pauseRef.current) {
      pauseRef.current = false;
      setState((s) => ({ ...s, paused: false }));
      pauseResolveRef.current?.();
      pauseResolveRef.current = null;
    } else {
      pauseRef.current = true;
      setState((s) => ({ ...s, paused: true }));
    }
  };

  /** 停止 */
  const handleStop = () => {
    abortRef.current = true;
    pauseRef.current = false;
    pauseResolveRef.current?.();
    pauseResolveRef.current = null;
  };

  const percent = state.total > 0 ? Math.round(((state.currentIndex + 1) / state.total) * 100) : 0;

  return (
    <div className="flex flex-col h-full gap-2">
      {/* 停留时间设置 */}
      <div className="flex items-center gap-2">
        <ClockCircleOutlined className="text-gray-400" />
        <span className="text-xs text-gray-600">每页停留</span>
        <InputNumber
          min={1}
          max={300}
          value={duration}
          onChange={(v) => setDuration(v ?? 10)}
          size="small"
          className="w-20"
          disabled={state.running}
        />
        <span className="text-xs text-gray-400">秒</span>
      </div>



      {/* URL 输入区 */}
      <div className="flex-1 min-h-0">
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'每行一个URL，例如:\nexample.com\nhttps://google.com'}
          className="!h-full !resize-none text-xs font-mono"
          spellCheck={false}
          disabled={state.running}
        />
      </div>

      {/* 运行状态 */}
      {state.running && (
        <div className="flex flex-col gap-1.5 px-1">
          <div className="flex items-center justify-between">
            <Tag color={state.paused ? 'orange' : 'processing'}>
              {state.paused ? '已暂停' : '播放中'}
            </Tag>
            <span className="text-[10px] text-gray-400">
              {state.currentIndex + 1} / {state.total}
            </span>
          </div>
          <Progress percent={percent} size="small" showInfo={false} />
          <div className="text-[10px] text-gray-500 truncate" title={state.currentUrl}>
            当前: {state.currentUrl}
          </div>
        </div>
      )}

      {/* 底部操作区 */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">{lineCount} 个URL</span>
        <div className="flex items-center gap-1">
          {state.running ? (
            <>
              <Button
                size="small"
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