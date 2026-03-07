import React, { useState, useCallback } from 'react';
import { Input, Select, Button, Space, Tabs, message, Tooltip } from 'antd';
import {
  SwapOutlined,
  CopyOutlined,
  ClearOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { ALL_CODEC_TOOLS, CODEC_CATEGORIES } from './codecTools';
import type { CodecCategory } from './codecTools';

const { TextArea } = Input;

/**
 * 编码解码 / 加密解密 模块主布局
 */
export const CodecLayout: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CodecCategory>('encoding');
  const [selectedTool, setSelectedTool] = useState('base64');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [iv, setIv] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  const currentTool = ALL_CODEC_TOOLS.find((t) => t.key === selectedTool);
  const categoryTools = ALL_CODEC_TOOLS.filter((t) => t.category === activeCategory);

  const handleEncode = useCallback(async () => {
    if (!currentTool || !input.trim()) return;
    try {
      const key = currentTool.needKeyPair ? publicKey : secretKey;
      const result = await currentTool.encode(input, key, iv);
      setOutput(result);
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [currentTool, input, secretKey, iv, publicKey]);

  const handleDecode = useCallback(async () => {
    if (!currentTool?.decode || !input.trim()) return;
    try {
      const key = currentTool.needKeyPair ? privateKey : secretKey;
      const result = await currentTool.decode(input, key, iv);
      setOutput(result || '(empty result)');
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [currentTool, input, secretKey, iv, privateKey]);

  const handleCopyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      message.success('已复制');
    } catch {
      message.error('复制失败');
    }
  };

  const handleSwap = () => {
    setInput(output);
    setOutput('');
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat as CodecCategory);
    const first = ALL_CODEC_TOOLS.find((t) => t.category === cat);
    if (first) setSelectedTool(first.key);
    setOutput('');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 顶部标题栏 */}
      <div className="flex items-center px-3 py-1.5 border-b border-gray-200 bg-[#fafafa]">
        <LockOutlined className="mr-1.5 text-blue-500" />
        <span className="font-semibold text-xs text-gray-700 tracking-wide">CODEC / CRYPTO</span>
      </div>

      {/* 分类 Tabs */}
      <Tabs
        activeKey={activeCategory}
        onChange={handleCategoryChange}
        size="small"
        className="px-3"
        items={CODEC_CATEGORIES.map((c) => ({ key: c.key, label: c.label }))}
      />

      {/* 工具选择 + 密钥输入 */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 border-b border-gray-200 bg-[#fafafa]">
        <Select
          value={selectedTool}
          onChange={(v) => { setSelectedTool(v); setOutput(''); }}
          size="small"
          style={{ width: 140 }}
          options={categoryTools.map((t) => ({ value: t.key, label: t.label }))}
        />
        {currentTool?.needKey && (
          <Input
            size="small" placeholder="Secret Key" value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            style={{ width: 160 }} prefix={<LockOutlined />}
          />
        )}
        {currentTool?.needIV && (
          <Input
            size="small" placeholder="IV (可选)" value={iv}
            onChange={(e) => setIv(e.target.value)}
            style={{ width: 140 }}
          />
        )}
      </div>

      {/* RSA 密钥对输入 */}
      {currentTool?.needKeyPair && (
        <div className="flex gap-2 px-3 py-1.5 border-b border-gray-200">
          <TextArea rows={3} placeholder="Public Key (PEM)" value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)} className="flex-1 !text-xs font-mono" />
          <TextArea rows={3} placeholder="Private Key (PEM)" value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)} className="flex-1 !text-xs font-mono" />
        </div>
      )}

      {/* 输入/输出区域 + 操作按钮 */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* 输入 */}
        <div className="flex-1 flex flex-col border-r border-gray-200">
          <div className="px-3 py-1 text-xs text-gray-500 bg-[#fafafa] border-b border-gray-100">Input</div>
          <TextArea value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="在此输入明文或密文..." className="!flex-1 !border-0 !rounded-none !resize-none font-mono !text-xs" />
        </div>

        {/* 中间操作栏 */}
        <div className="flex flex-col items-center justify-center gap-2 px-2 bg-[#fafafa]">
          <Tooltip title={currentTool?.oneWay ? '生成摘要' : '编码/加密'}>
            <Button type="primary" size="small" icon={<LockOutlined />} onClick={handleEncode}>
              {currentTool?.oneWay ? 'Hash' : 'Encode'}
            </Button>
          </Tooltip>
          {!currentTool?.oneWay && (
            <Tooltip title="解码/解密">
              <Button size="small" icon={<UnlockOutlined />} onClick={handleDecode}>Decode</Button>
            </Tooltip>
          )}
          <Tooltip title="交换输入输出"><Button size="small" icon={<SwapOutlined />} onClick={handleSwap} /></Tooltip>
          <Tooltip title="复制输出"><Button size="small" icon={<CopyOutlined />} onClick={handleCopyOutput} /></Tooltip>
          <Tooltip title="清空"><Button size="small" icon={<ClearOutlined />} onClick={() => { setInput(''); setOutput(''); }} /></Tooltip>
        </div>

        {/* 输出 */}
        <div className="flex-1 flex flex-col">
          <div className="px-3 py-1 text-xs text-gray-500 bg-[#fafafa] border-b border-gray-100">Output</div>
          <TextArea value={output} readOnly
            placeholder="结果将显示在此处..." className="!flex-1 !border-0 !rounded-none !resize-none font-mono !text-xs" />
        </div>
      </div>
    </div>
  );
};

