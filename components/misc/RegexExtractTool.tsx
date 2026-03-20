import React, { useState, useCallback, useMemo } from 'react';
import { Input, Button, Switch, message, Space, Select } from 'antd';
import { CopyOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { TextArea } = Input;

/** 预设正则模板 */
const REGEX_PRESETS = [
  { label: '自定义', value: '' },
  { label: 'IP 地址', value: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  { label: 'URL', value: 'https?://[^\\s<>"\'\\)\\]]+' },
  { label: '手机号', value: '1[3-9]\\d{9}' },
  { label: '身份证号', value: '[1-9]\\d{5}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]' },
  { label: 'MD5', value: '\\b[a-fA-F0-9]{32}\\b' },
  { label: 'SHA256', value: '\\b[a-fA-F0-9]{64}\\b' },
  { label: 'JWT', value: 'eyJ[A-Za-z0-9_-]+\\.eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+' },
  { label: 'Base64', value: '(?:[A-Za-z0-9+/]{4}){2,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?' },
  { label: 'MAC 地址', value: '(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}' },
];

/**
 * 自定义正则提取工具
 * 支持自定义正则或选择预设模板，从文本中提取匹配内容
 */
export const RegexExtractTool: React.FC = () => {
  const [input, setInput] = useState('');
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('gi');
  const [deduplicate, setDeduplicate] = useState(true);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const handlePresetChange = useCallback((value: string) => {
    setPattern(value);
    setError('');
  }, []);

  const handleExtract = useCallback(() => {
    if (!input.trim()) {
      message.warning('请先输入需要提取的文本');
      return;
    }
    if (!pattern.trim()) {
      setError('请输入正则表达式');
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
        message.warning('未匹配到任何结果，请检查输入文本或正则表达式');
      }
      setOutput(results.join('\n'));
      setError('');
    } catch (e) {
      setError(`正则表达式错误: ${(e as Error).message}`);
      setOutput('');
    }
  }, [input, pattern, flags, deduplicate]);

  const count = useMemo(() => {
    if (!output) return 0;
    return output.split('\n').filter((l) => l.trim()).length;
  }, [output]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => message.success('已复制'));
  }, [output]);

  return (
    <div className="flex flex-col h-full gap-2 p-3">
      {/* 正则输入区 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          options={REGEX_PRESETS}
          placeholder="选择预设模板"
          onChange={handlePresetChange}
          size="small"
          className="w-32"
          allowClear
        />
        <Input
          value={pattern}
          onChange={(e) => { setPattern(e.target.value); setError(''); }}
          placeholder="输入正则表达式..."
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
          去重
        </div>
        <div className="flex-1" />
        <Space size={4}>
          <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={handleExtract}>提取</Button>
          <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={!output}>复制</Button>
          <Button size="small" icon={<DeleteOutlined />} onClick={() => { setInput(''); setOutput(''); setError(''); }}>清空</Button>
        </Space>
      </div>

      {output && (
        <div className="text-[10px] text-gray-400">
          共匹配到 <span className="text-blue-500 font-bold">{count}</span> 条结果
        </div>
      )}

      {/* 输入输出区 */}
      <div className="flex flex-1 gap-2 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[10px] font-bold text-gray-500 mb-1">输入文本</div>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴需要提取的文本..."
            className="flex-1 resize-none font-mono text-xs"
          />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[10px] font-bold text-gray-500 mb-1">匹配结果</div>
          <TextArea
            value={output}
            readOnly
            placeholder="匹配结果将显示在这里..."
            className="flex-1 resize-none font-mono text-xs bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
};

