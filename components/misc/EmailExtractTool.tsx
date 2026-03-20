import React, { useState, useCallback, useMemo } from 'react';
import { Input, Button, Switch, message, Space } from 'antd';
import { CopyOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { TextArea } = Input;

/**
 * Email 提取工具
 * 从文本中提取邮箱地址，支持去重和排序
 */
export const EmailExtractTool: React.FC = () => {
  const [input, setInput] = useState('');
  const [deduplicate, setDeduplicate] = useState(true);
  const [sortOutput, setSortOutput] = useState(true);
  const [lowerCase, setLowerCase] = useState(true);
  const [output, setOutput] = useState('');

  const handleExtract = useCallback(() => {
    if (!input.trim()) {
      message.warning('请先输入需要提取邮箱的文本');
      return;
    }
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,63}/g;
    const matches = input.match(emailRegex) || [];

    let results = lowerCase ? matches.map((e) => e.toLowerCase()) : [...matches];

    if (deduplicate) {
      results = [...new Set(results)];
    }
    if (sortOutput) {
      results.sort((a, b) => a.localeCompare(b));
    }

    if (results.length === 0) {
      message.warning('未提取到任何邮箱地址，请检查输入文本');
    }
    setOutput(results.join('\n'));
  }, [input, deduplicate, sortOutput, lowerCase]);

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
      <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
        <div className="flex items-center gap-1">
          <Switch size="small" checked={lowerCase} onChange={setLowerCase} />
          统一小写
        </div>
        <div className="flex items-center gap-1">
          <Switch size="small" checked={deduplicate} onChange={setDeduplicate} />
          去重
        </div>
        <div className="flex items-center gap-1">
          <Switch size="small" checked={sortOutput} onChange={setSortOutput} />
          排序
        </div>
        <div className="flex-1" />
        <Space size={4}>
          <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={handleExtract}>提取</Button>
          <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={!output}>复制</Button>
          <Button size="small" icon={<DeleteOutlined />} onClick={() => { setInput(''); setOutput(''); }}>清空</Button>
        </Space>
      </div>

      {output && (
        <div className="text-[10px] text-gray-400">
          共提取到 <span className="text-blue-500 font-bold">{count}</span> 个邮箱地址
        </div>
      )}

      <div className="flex flex-1 gap-2 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[10px] font-bold text-gray-500 mb-1">输入文本</div>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴包含邮箱的文本..."
            className="flex-1 resize-none font-mono text-xs"
          />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[10px] font-bold text-gray-500 mb-1">提取结果</div>
          <TextArea
            value={output}
            readOnly
            placeholder="提取的邮箱将显示在这里..."
            className="flex-1 resize-none font-mono text-xs bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
};

