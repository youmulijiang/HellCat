import React, { useState } from 'react';
import { Button, Input, Checkbox, Select, Tooltip, message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  ChromeOutlined,
  DeleteOutlined,
  FilterOutlined,
  ImportOutlined,
  WindowsOutlined,
} from '@ant-design/icons';
import { browser } from 'wxt/browser';

const { TextArea } = Input;

/** 规范化 URL，自动补全协议 */
const normalizeUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

/** 从任意文本中提取 URL */
const extractUrlsFromText = (text: string): string[] => {
  const urlRegex = /https?:\/\/[^\s<>"')\]]+/gi;
  const matches = text.match(urlRegex) || [];
  return [...new Set(matches)];
};

export const MultiOpenTab: React.FC = () => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [openMode, setOpenMode] = useState<'current' | 'new'>('current');
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(false);
  const [randomOrder, setRandomOrder] = useState(false);
  const [loading, setLoading] = useState(false);

  /** 获取有效 URL 列表 */
  const getUrls = (): string[] => {
    let urls = text
      .split(/[\n\r]+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map(normalizeUrl)
      .filter(Boolean);
    if (ignoreDuplicates) urls = [...new Set(urls)];
    if (randomOrder) urls = urls.sort(() => Math.random() - 0.5);
    return urls;
  };

  const lineCount = text.split(/[\n\r]+/).filter((l) => l.trim()).length;

  /** 去重 */
  const handleDedup = () => {
    const lines = text.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
    const unique = [...new Set(lines)];
    const removed = lines.length - unique.length;
    setText(unique.join('\n'));
    message.success(t('popup.urlOpener.multiOpen.messages.deduplicated', { count: removed }));
  };

  /** 获取当前所有标签页 URL */
  const handleGetTabUrls = async () => {
    try {
      const tabs = await browser.tabs.query({});
      const tabUrls = tabs
        .map((t) => t.url)
        .filter((u): u is string => !!u && /^https?:\/\//.test(u));
      if (tabUrls.length === 0) {
        message.warning(t('popup.urlOpener.multiOpen.messages.noValidTabUrls'));
        return;
      }
      const current = text.trim();
      setText(current ? `${current}\n${tabUrls.join('\n')}` : tabUrls.join('\n'));
      message.success(t('popup.urlOpener.multiOpen.messages.fetchedTabUrls', { count: tabUrls.length }));
    } catch {
      message.error(t('popup.urlOpener.multiOpen.messages.fetchTabUrlsFailed'));
    }
  };

  /** 从文本提取 URL */
  const handleExtractUrls = () => {
    const extracted = extractUrlsFromText(text);
    if (extracted.length === 0) {
      message.warning(t('popup.urlOpener.multiOpen.messages.noUrlsExtracted'));
      return;
    }
    setText(extracted.join('\n'));
    message.success(t('popup.urlOpener.multiOpen.messages.extractedUrls', { count: extracted.length }));
  };

  /** 打开 URL */
  const handleOpen = async () => {
    const urls = getUrls();
    if (urls.length === 0) {
      message.warning(t('popup.urlOpener.multiOpen.messages.inputRequired'));
      return;
    }
    setLoading(true);
    try {
      if (openMode === 'new') {
        const win = await browser.windows.create({ url: urls[0] });
        if (!win || typeof win.id !== 'number') {
          throw new Error(t('popup.urlOpener.multiOpen.messages.createWindowFailed'));
        }

        const windowId = win.id;
        for (let i = 1; i < urls.length; i++) {
          await browser.tabs.create({ windowId, url: urls[i] });
        }
      } else {
        for (const url of urls) {
          await browser.tabs.create({ url });
        }
      }
      message.success(t('popup.urlOpener.multiOpen.messages.openedUrls', { count: urls.length }));
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('popup.urlOpener.multiOpen.messages.openFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 flex-wrap">
        <Tooltip title={t('popup.urlOpener.multiOpen.tooltips.getTabUrls')}>
          <Button size="small" icon={<ImportOutlined />} onClick={handleGetTabUrls}>
            {t('popup.urlOpener.multiOpen.buttons.getTabUrls')}
          </Button>
        </Tooltip>
        <Tooltip title={t('popup.urlOpener.multiOpen.tooltips.extractUrls')}>
          <Button size="small" icon={<FilterOutlined />} onClick={handleExtractUrls}>
            {t('popup.urlOpener.multiOpen.buttons.extractUrls')}
          </Button>
        </Tooltip>
        <Tooltip title={t('popup.urlOpener.multiOpen.tooltips.deduplicate')}>
          <Button size="small" icon={<DeleteOutlined />} onClick={handleDedup}>
            {t('popup.urlOpener.multiOpen.buttons.deduplicate')}
          </Button>
        </Tooltip>
        <Tooltip title={t('popup.urlOpener.multiOpen.tooltips.clear')}>
          <Button size="small" danger onClick={() => setText('')}>
            {t('common.actions.clear')}
          </Button>
        </Tooltip>
      </div>

      {/* URL 输入区 */}
      <div className="flex-1 min-h-0 flex flex-col [&_.ant-input]:!min-h-[240px] [&_.ant-input]:!flex-1 [&_.ant-input]:!resize-none">
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('popup.urlOpener.multiOpen.placeholder')}
          className="!h-full !resize-none text-xs font-mono"
          spellCheck={false}
        />
      </div>

      {/* 底部操作区 */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={ignoreDuplicates}
            onChange={(e) => setIgnoreDuplicates(e.target.checked)}
          >
            <span className="text-[11px]">{t('popup.urlOpener.multiOpen.options.ignoreDuplicates')}</span>
          </Checkbox>
          <Checkbox
            checked={randomOrder}
            onChange={(e) => setRandomOrder(e.target.checked)}
          >
            <span className="text-[11px]">{t('popup.urlOpener.multiOpen.options.randomOrder')}</span>
          </Checkbox>
          <span className="text-[10px] text-gray-400">{t('popup.urlOpener.multiOpen.options.lineCount', { count: lineCount })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Select
            size="small"
            value={openMode}
            onChange={setOpenMode}
            className="w-24"
            options={[
              { value: 'current', label: t('popup.urlOpener.multiOpen.options.currentWindow') },
              { value: 'new', label: t('popup.urlOpener.multiOpen.options.newWindow') },
            ]}
          />
          <Button
            type="primary"
            size="small"
            icon={openMode === 'new' ? <WindowsOutlined /> : <ChromeOutlined />}
            loading={loading}
            disabled={lineCount === 0}
            onClick={handleOpen}
          >
            {t('popup.urlOpener.multiOpen.buttons.openWithCount', { count: lineCount })}
          </Button>
        </div>
      </div>
    </div>
  );
};

