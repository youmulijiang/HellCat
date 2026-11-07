import React, { useState, useCallback, useMemo } from 'react';
import { Input, Button, Switch, message, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { CopyOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { TextArea } = Input;

/**
 * 数据去重工具
 * 支持按行去重，可选忽略大小写、忽略空行、排序输出
 */
export const DeduplicateTool: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreEmpty, setIgnoreEmpty] = useState(true);
  const [sortOutput, setSortOutput] = useState(false);
  const [output, setOutput] = useState('');

  const handleProcess = useCallback(() => {
    if (!input.trim()) {
      message.warning(t('devtools.misc.deduplicate.inputRequired'));
      return;
    }
    let lines = input.split('\n');
    if (ignoreEmpty) {
      lines = lines.filter((l) => l.trim() !== '');
    }
    const seen = new Set<string>();
    const result: string[] = [];
    for (const line of lines) {
      const key = ignoreCase ? line.toLowerCase() : line;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(line);
      }
    }
    if (sortOutput) result.sort((a, b) => a.localeCompare(b));
    if (result.length === 0) {
      message.warning(t('devtools.misc.deduplicate.noValidData'));
    }
    setOutput(result.join('\n'));
  }, [input, ignoreCase, ignoreEmpty, sortOutput, t]);

  const stats = useMemo(() => {
    if (!output && !input) return null;
    const inputLines = input.split('\n').filter((l) => l.trim() !== '').length;
    const outputLines = output.split('\n').filter((l) => l.trim() !== '').length;
    return { inputLines, outputLines, removed: inputLines - outputLines };
  }, [input, output]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => message.success(t('common.feedback.copySuccess')));
  }, [output, t]);

  return (
    <div className="flex flex-col h-full gap-2 p-3">
      {/* 选项栏 */}
      <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
        <div className="flex items-center gap-1">
          <Switch size="small" checked={ignoreCase} onChange={setIgnoreCase} />
          {t('devtools.misc.deduplicate.ignoreCase')}
        </div>
        <div className="flex items-center gap-1">
          <Switch size="small" checked={ignoreEmpty} onChange={setIgnoreEmpty} />
          {t('devtools.misc.deduplicate.ignoreEmpty')}
        </div>
        <div className="flex items-center gap-1">
          <Switch size="small" checked={sortOutput} onChange={setSortOutput} />
          {t('devtools.misc.deduplicate.sortOutput')}
        </div>
        <div className="flex-1" />
        <Space size={4}>
          <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={handleProcess}>{t('devtools.misc.deduplicate.dedupe')}</Button>
          <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={!output}>{t('common.actions.copy')}</Button>
          <Button size="small" icon={<DeleteOutlined />} onClick={() => { setInput(''); setOutput(''); }}>{t('common.actions.clear')}</Button>
        </Space>
      </div>

      {/* 统计 */}
      {stats && output && (
        <div className="text-[10px] text-gray-400">
          {t('devtools.misc.deduplicate.stats', { input: stats.inputLines, output: stats.outputLines, removed: stats.removed })}
        </div>
      )}

      {/* 输入输出区 */}
      <div className="flex flex-1 gap-2 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[10px] font-bold text-gray-500 mb-1">{t('devtools.misc.deduplicate.inputLabel')}</div>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('devtools.misc.deduplicate.inputPlaceholder')}
            className="flex-1 resize-none font-mono text-xs"
          />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[10px] font-bold text-gray-500 mb-1">{t('devtools.misc.deduplicate.outputLabel')}</div>
          <TextArea
            value={output}
            readOnly
            placeholder={t('devtools.misc.deduplicate.outputPlaceholder')}
            className="flex-1 resize-none font-mono text-xs bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
};
