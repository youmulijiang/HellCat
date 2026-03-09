import React, { useState } from 'react';
import { Button, Input, Checkbox, Select, Tooltip, message } from 'antd';
import {
  ChromeOutlined,
  CopyOutlined,
  DeleteOutlined,
  FilterOutlined,
  ImportOutlined,
  OrderedListOutlined,
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
    message.success(`已去重，移除 ${removed} 条重复`);
  };

  /** 获取当前所有标签页 URL */
  const handleGetTabUrls = async () => {
    try {
      const tabs = await browser.tabs.query({});
      const tabUrls = tabs
        .map((t) => t.url)
        .filter((u): u is string => !!u && /^https?:\/\//.test(u));
      if (tabUrls.length === 0) {
        message.warning('没有找到有效的标签页URL');
        return;
      }
      const current = text.trim();
      setText(current ? `${current}\n${tabUrls.join('\n')}` : tabUrls.join('\n'));
      message.success(`已获取 ${tabUrls.length} 个标签页URL`);
    } catch {
      message.error('获取标签页URL失败');
    }
  };

  /** 从文本提取 URL */
  const handleExtractUrls = () => {
    const extracted = extractUrlsFromText(text);
    if (extracted.length === 0) {
      message.warning('未从文本中提取到URL');
      return;
    }
    setText(extracted.join('\n'));
    message.success(`已提取 ${extracted.length} 个URL`);
  };

  /** 打开 URL */
  const handleOpen = async () => {
    const urls = getUrls();
    if (urls.length === 0) {
      message.warning('请输入至少一个URL');
      return;
    }
    setLoading(true);
    try {
      if (openMode === 'new') {
        const win = await browser.windows.create({ url: urls[0] });
        for (let i = 1; i < urls.length; i++) {
          await browser.tabs.create({ windowId: win.id, url: urls[i] });
        }
      } else {
        for (const url of urls) {
          await browser.tabs.create({ url });
        }
      }
      message.success(`已打开 ${urls.length} 个URL`);
    } catch {
      message.error('打开URL失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-2">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 flex-wrap">
        <Tooltip title="获取所有标签页URL">
          <Button size="small" icon={<ImportOutlined />} onClick={handleGetTabUrls}>
            获取标签页
          </Button>
        </Tooltip>
        <Tooltip title="从文本中提取URL">
          <Button size="small" icon={<FilterOutlined />} onClick={handleExtractUrls}>
            提取URL
          </Button>
        </Tooltip>
        <Tooltip title="去除重复URL">
          <Button size="small" icon={<DeleteOutlined />} onClick={handleDedup}>
            去重
          </Button>
        </Tooltip>
        <Tooltip title="清空">
          <Button size="small" danger onClick={() => setText('')}>
            清空
          </Button>
        </Tooltip>
      </div>

      {/* URL 输入区 */}
      <div className="flex-1 min-h-0">
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'每行一个URL，例如:\nexample.com\nhttps://google.com\n192.168.1.1:8080'}
          className="!h-full !resize-none text-xs font-mono"
          spellCheck={false}
        />
      </div>

      {/* 选项区 */}
      <div className="flex items-center gap-3 flex-wrap text-xs">
        <Checkbox
          checked={ignoreDuplicates}
          onChange={(e) => setIgnoreDuplicates(e.target.checked)}
        >
          <span className="text-xs">忽略重复</span>
        </Checkbox>
        <Checkbox
          checked={randomOrder}
          onChange={(e) => setRandomOrder(e.target.checked)}
        >
          <span className="text-xs">随机顺序</span>
        </Checkbox>
      </div>

      {/* 底部操作区 */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">{lineCount} 个URL</span>
        <div className="flex items-center gap-2">
          <Select
            size="small"
            value={openMode}
            onChange={setOpenMode}
            className="w-28"
            options={[
              { value: 'current', label: '当前窗口' },
              { value: 'new', label: '新窗口' },
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
            打开 ({lineCount})
          </Button>
        </div>
      </div>
    </div>
  );
};

