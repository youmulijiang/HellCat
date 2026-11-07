import React, { useState, useCallback, useMemo } from 'react';
import { Input, Button, Switch, message, Space, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { CopyOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { TextArea } = Input;

/**
 * 自定义正则提取工具
 * 支持自定义正则或选择预设模板，从文本中提取匹配内容
 */
export const RegexExtractTool: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('gi');
  const [deduplicate, setDeduplicate] = useState(true);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  /** 预设正则模板 */
  const regexPresets = useMemo(() => [
    { label: t('devtools.misc.regex.presets.custom'), value: '' },
    { label: t('devtools.misc.regex.presets.ip'), value: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
    { label: 'URL', value: 'https?://[^\\s<>"\'\\)\\]]+' },
    { label: t('devtools.misc.regex.presets.phone'), value: '1[3-9]\\d{9}' },
    { label: t('devtools.misc.regex.presets.idCard'), value: '[1-9]\\d{5}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]' },
    { label: 'MD5', value: '\\b[a-fA-F0-9]{32}\\b' },
    { label: 'SHA256', value: '\\b[a-fA-F0-9]{64}\\b' },
    { label: 'JWT', value: 'eyJ[A-Za-z0-9_-]+\\.eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+' },
    { label: 'Base64', value: '(?:[A-Za-z0-9+/]{4}){2,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?' },
    { label: t('devtools.misc.regex.presets.mac'), value: '(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}' },
  ], [t]);

  const handlePresetChange = useCallback((value: string) => {
    setPattern(value);
    setError('');
  }, []);

  const handleExtract = useCallback(() => {
    if (!input.trim()) {
      message.warning(t('devtools.misc.regex.inputRequired'));
      return;
    }
    if (!pattern.trim()) {
      setError(t('devtools.misc.regex.patternRequired'));
      return;
    }
    try {
      const regex = new RegExp(pattern, flags);
      const matches = input.match(regex) || [];
      let results = [...matches];
      if (deduplicate) {
        results = [...new Set(results)];
      }
      if (results.length === 0) {
        message.warning(t('devtools.misc.regex.noMatches'));
      }
      setOutput(results.join('\n'));
      setError('');
    } catch (e) {
      setError(t('devtools.misc.regex.invalidRegex', { message: (e as Error).message }));
      setOutput('');
    }
  }, [input, pattern, flags, deduplicate, t]);

  const count = useMemo(() => {
    if (!output) return 0;
    return output.split('\n').filter((l) => l.trim()).length;
  }, [output]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => message.success(t('common.feedback.copySuccess')));
  }, [output, t]);

  return (
    <div className="flex flex-col h-full gap-2 p-3">
      {/* 正则输入区 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          options={regexPresets}
          placeholder={t('devtools.misc.regex.selectPreset')}
          onChange={handlePresetChange}
          size="small"
          className="w-32"
          allowClear
        />
        <Input
          value={pattern}
          onChange={(e) => { setPattern(e.target.value); setError(''); }}
          placeholder={t('devtools.misc.regex.patternPlaceholder')}
          size="small"
          className="flex-1 font-mono text-xs"
          status={error ? 'error' : undefined}
        />
        <Input
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          placeholder="flags"
          size="small"
          className="w-16 font-mono text-xs"
        />
      </div>

      {error && <div className="text-[10px] text-red-500">{error}</div>}

      {/* 选项和操作 */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Switch size="small" checked={deduplicate} onChange={setDeduplicate} />
          {t('devtools.misc.regex.deduplicate')}
        </div>
        <div className="flex-1" />
        <Space size={4}>
          <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={handleExtract}>{t('common.actions.extract')}</Button>
          <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={!output}>{t('common.actions.copy')}</Button>
          <Button size="small" icon={<DeleteOutlined />} onClick={() => { setInput(''); setOutput(''); setError(''); }}>{t('common.actions.clear')}</Button>
        </Space>
      </div>

      {output && (
        <div className="text-[10px] text-gray-400">
          {t('devtools.misc.regex.countLabel', { count })}
        </div>
      )}

      {/* 输入输出区 */}
      <div className="flex flex-1 gap-2 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[10px] font-bold text-gray-500 mb-1">{t('devtools.misc.regex.inputLabel')}</div>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('devtools.misc.regex.inputPlaceholder')}
            className="flex-1 resize-none font-mono text-xs"
          />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[10px] font-bold text-gray-500 mb-1">{t('devtools.misc.regex.outputLabel')}</div>
          <TextArea
            value={output}
            readOnly
            placeholder={t('devtools.misc.regex.outputPlaceholder')}
            className="flex-1 resize-none font-mono text-xs bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
};
