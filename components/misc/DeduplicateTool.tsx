import React, { useState, useCallback, useMemo } from 'react';
import { Input, Button, Switch, message, Space } from 'antd';
import { CopyOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { TextArea } = Input;

/**
 * 数据去重工具
 * 支持按行去重，可选忽略大小写、忽略空行、排序输出
 */
export const DeduplicateTool: React.FC = () => {
  const [input, setInput] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreEmpty, setIgnoreEmpty] = useState(true);
  const [sortOutput, setSortOutput] = useState(false);
  const [output, setOutput] = useState('');

  const handleProcess = useCallback(() => {
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
    setOutput(result.join('\n'));
  }, [input, ignoreCase, ignoreEmpty, sortOutput]);

  const stats = useMemo(() => {
    if (!output && !input) return null;
    const inputLines = input.split('\n').filter((l) => l.trim() !== '').length;
    const outputLines = output.split('\n').filter((l) => l.trim() !== '').length;
    return { inputLines, outputLines, removed: inputLines - outputLines };
  }, [input, output]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => message.success('已复制'));
  }, [output]);

  return (
    <div className="flex flex-col h-full gap-2 p-3">
      {/* 选项栏 */}
      <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
        <div className="flex items-center gap-1">
          <Switch size="small" checked={ignoreCase} onChange={setIgnoreCase} />
          忽略大小写
        </div>
        <div className="flex items-center gap-1">
          <Switch size="small" checked={ignoreEmpty} onChange={setIgnoreEmpty} />
          忽略空行
        </div>
        <div className="flex items-center gap-1">
          <Switch size="small" checked={sortOutput} onChange={setSortOutput} />
          排序输出
        </div>
        <div className="flex-1" />
        <Space size={4}>
          <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={handleProcess}>去重</Button>
          <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={!output}>复制</Button>
          <Button size="small" icon={<DeleteOutlined />} onClick={() => { setInput(''); setOutput(''); }}>清空</Button>
        </Space>
      </div>

      {/* 统计 */}
      {stats && output && (
        <div className="text-[10px] text-gray-400">
          输入 {stats.inputLines} 行 → 输出 {stats.outputLines} 行，去除 <span className="text-red-500">{stats.removed}</span> 条重复
        </div>
      )}

      {/* 输入输出区 */}
      <div className="flex flex-1 gap-2 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[10px] font-bold text-gray-500 mb-1">输入数据（每行一条）</div>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴需要去重的数据，每行一条..."
            className="flex-1 resize-none font-mono text-xs"
          />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[10px] font-bold text-gray-500 mb-1">去重结果</div>
          <TextArea
            value={output}
            readOnly
            placeholder="去重结果将显示在这里..."
            className="flex-1 resize-none font-mono text-xs bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
};

