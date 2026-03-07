import React, { useState, useCallback, useMemo } from 'react';
import { Button, Radio, Input, Switch } from 'antd';
import {
  SwapOutlined,
  ClearOutlined,
  DiffOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import * as Diff from 'diff';
import { DiffResultView } from './DiffResultView';

const { TextArea } = Input;

export type DiffMode = 'chars' | 'words' | 'lines';

/**
 * Diff 比对模块
 * 支持字符级 / 单词级 / 行级比对，并高亮显示差异
 */
export const DiffLayout: React.FC = () => {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [mode, setMode] = useState<DiffMode>('lines');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [compared, setCompared] = useState(false);

  const diffResult = useMemo(() => {
    if (!compared) return null;
    const opts = { ignoreWhitespace };
    switch (mode) {
      case 'chars':
        return Diff.diffChars(leftText, rightText, opts);
      case 'words':
        return Diff.diffWords(leftText, rightText, opts);
      case 'lines':
        return Diff.diffLines(leftText, rightText, opts);
    }
  }, [leftText, rightText, mode, ignoreWhitespace, compared]);

  const handleCompare = useCallback(() => setCompared(true), []);

  const handleSwap = useCallback(() => {
    setLeftText(rightText);
    setRightText(leftText);
    setCompared(false);
  }, [leftText, rightText]);

  const handleClear = useCallback(() => {
    setLeftText('');
    setRightText('');
    setCompared(false);
  }, []);

  const stats = useMemo(() => {
    if (!diffResult) return { added: 0, removed: 0, unchanged: 0 };
    let added = 0, removed = 0, unchanged = 0;
    for (const part of diffResult) {
      const len = part.value.length;
      if (part.added) added += len;
      else if (part.removed) removed += len;
      else unchanged += len;
    }
    return { added, removed, unchanged };
  }, [diffResult]);

  const handleCopyDiff = useCallback(() => {
    if (!diffResult) return;
    const text = diffResult
      .map((p) => {
        if (p.added) return `+ ${p.value}`;
        if (p.removed) return `- ${p.value}`;
        return `  ${p.value}`;
      })
      .join('');
    navigator.clipboard.writeText(text);
  }, [diffResult]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50">
        <span className="text-xs font-bold text-gray-600 tracking-wide">DIFF COMPARE</span>
        <span className="text-[10px] text-gray-400">文本差异比对</span>
      </div>

      <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-200 flex-wrap">
        <Radio.Group value={mode} onChange={(e) => { setMode(e.target.value); setCompared(false); }} size="small">
          <Radio.Button value="chars">字符级</Radio.Button>
          <Radio.Button value="words">单词级</Radio.Button>
          <Radio.Button value="lines">行级</Radio.Button>
        </Radio.Group>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Switch size="small" checked={ignoreWhitespace} onChange={(v) => { setIgnoreWhitespace(v); setCompared(false); }} />
          忽略空白
        </div>
        <div className="flex-1" />
        <Button size="small" icon={<SwapOutlined />} onClick={handleSwap}>交换</Button>
        <Button size="small" icon={<ClearOutlined />} onClick={handleClear}>清空</Button>
        <Button type="primary" size="small" icon={<DiffOutlined />} onClick={handleCompare}>比对</Button>
      </div>

      <div className="flex flex-1 min-h-0 border-b border-gray-200">
        <div className="flex-1 flex flex-col border-r border-gray-200 min-w-0">
          <div className="px-2 py-1 text-[10px] font-bold text-gray-500 bg-red-50 border-b border-gray-100">
            ◀ 原始文本 (LEFT)
          </div>
          <TextArea
            value={leftText}
            onChange={(e) => { setLeftText(e.target.value); setCompared(false); }}
            placeholder="粘贴原始文本..."
            className="flex-1 resize-none border-none rounded-none font-mono text-xs"
            style={{ boxShadow: 'none' }}
          />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-2 py-1 text-[10px] font-bold text-gray-500 bg-green-50 border-b border-gray-100">
            修改文本 (RIGHT) ▶
          </div>
          <TextArea
            value={rightText}
            onChange={(e) => { setRightText(e.target.value); setCompared(false); }}
            placeholder="粘贴修改后文本..."
            className="flex-1 resize-none border-none rounded-none font-mono text-xs"
            style={{ boxShadow: 'none' }}
          />
        </div>
      </div>

      <div className="flex flex-col min-h-[120px] max-h-[45%] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3 text-[10px]">
            <span className="font-bold text-gray-600">差异结果</span>
            {diffResult && (
              <>
                <span className="text-green-600">+{stats.added}</span>
                <span className="text-red-600">-{stats.removed}</span>
                <span className="text-gray-400">={stats.unchanged}</span>
              </>
            )}
          </div>
          <Button size="small" type="text" icon={<CopyOutlined />} onClick={handleCopyDiff} disabled={!diffResult}>
            复制差异
          </Button>
        </div>
        <DiffResultView diffResult={diffResult} mode={mode} />
      </div>
    </div>
  );
};

