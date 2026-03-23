import React, { useState, useCallback, useMemo } from 'react';
import { Input, Button, Tag, message, Space, Tabs } from 'antd';
import { CopyOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
import * as ipaddr from 'ipaddr.js';

const { TextArea } = Input;

/** 分类后的 IP 结果 */
interface IpClassified {
  all: string[];
  public: string[];
  private: string[];
  /** 按网段归类: key 为 C 段如 "192.168.1.0/24" */
  segments: Record<string, string[]>;
  ipv6: string[];
  invalid: string[];
}

/** 提取文本中所有 IP 地址（v4 + v6） */
function extractIps(text: string): string[] {
  const v4 = /(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])/g;
  const v6 = /(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}/g;
  const v4Matches = text.match(v4) ?? [];
  const v6Matches = text.match(v6) ?? [];
  return [...new Set([...v4Matches, ...v6Matches])];
}

/** 获取 IPv4 的 C 段 */
function getCSegment(ip: string): string {
  const parts = ip.split('.');
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

const PRIVATE_RANGES = new Set(['private', 'loopback', 'linkLocal', 'uniqueLocal']);

/** 对 IP 列表进行分类 */
function classifyIps(ips: string[]): IpClassified {
  const result: IpClassified = {
    all: [], public: [], private: [],
    segments: {}, ipv6: [], invalid: [],
  };

  for (const raw of ips) {
    try {
      const addr = ipaddr.parse(raw);
      result.all.push(raw);

      if (addr.kind() === 'ipv6') {
        result.ipv6.push(raw);
        const range = addr.range();
        if (PRIVATE_RANGES.has(range)) result.private.push(raw);
        else result.public.push(raw);
      } else {
        const range = addr.range();
        if (PRIVATE_RANGES.has(range)) {
          result.private.push(raw);
        } else if (range === 'unicast') {
          result.public.push(raw);
        } else {
          // broadcast, multicast, etc.
          result.public.push(raw);
        }
        const seg = getCSegment(raw);
        (result.segments[seg] ??= []).push(raw);
      }
    } catch {
      result.invalid.push(raw);
    }
  }
  return result;
}

/** 复制文本列表 */
const copyList = (list: string[]) => {
  if (!list.length) return;
  navigator.clipboard.writeText(list.join('\n')).then(() => message.success('已复制'));
};

/** 标签页头 */
const tabLabel = (label: string, count: number) => (
  <span className="text-xs">
    {label} <Tag className="ml-1 text-[10px] leading-tight">{count}</Tag>
  </span>
);

export const IpExtractTool: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<IpClassified | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const handleExtract = useCallback(() => {
    if (!input.trim()) { message.warning('请先输入包含 IP 地址的文本'); return; }
    const ips = extractIps(input);
    if (!ips.length) { message.warning('未找到任何 IP 地址'); return; }
    const classified = classifyIps(ips);
    setResult(classified);
    setActiveTab('all');
  }, [input]);

  const currentList = useMemo(() => {
    if (!result) return [];
    if (activeTab === 'all') return result.all;
    if (activeTab === 'public') return result.public;
    if (activeTab === 'private') return result.private;
    if (activeTab === 'ipv6') return result.ipv6;
    if (activeTab === 'invalid') return result.invalid;
    return result.segments[activeTab] ?? [];
  }, [result, activeTab]);

  /** 网段标签页 */
  const segmentTabs = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.segments)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([seg, list]) => ({
        key: seg, label: tabLabel(seg, list.length),
      }));
  }, [result]);

  const allTabs = useMemo(() => {
    if (!result) return [];
    const base = [
      { key: 'all', label: tabLabel('全部', result.all.length) },
      { key: 'public', label: tabLabel('公网', result.public.length) },
      { key: 'private', label: tabLabel('内网', result.private.length) },
    ];
    if (result.ipv6.length) base.push({ key: 'ipv6', label: tabLabel('IPv6', result.ipv6.length) });
    if (result.invalid.length) base.push({ key: 'invalid', label: tabLabel('无效', result.invalid.length) });
    return [...base, ...segmentTabs];
  }, [result, segmentTabs]);

  return (
    <div className="flex flex-col h-full gap-2 p-3">
      {/* 操作栏 */}
      <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
        <div className="flex-1" />
        <Space size={4}>
          <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={handleExtract}>提取</Button>
          <Button size="small" icon={<CopyOutlined />} onClick={() => copyList(currentList)} disabled={!currentList.length}>复制</Button>
          <Button size="small" icon={<DeleteOutlined />} onClick={() => { setInput(''); setResult(null); }}>清空</Button>
        </Space>
      </div>

      <div className="flex flex-1 gap-2 min-h-0">
        {/* 输入区 */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[10px] font-bold text-gray-500 mb-1">输入文本</div>
          <TextArea value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴包含 IP 地址的文本（日志、扫描结果等）..."
            className="flex-1 resize-none font-mono text-xs" />
        </div>
        {/* 结果区 */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[10px] font-bold text-gray-500 mb-1">提取结果</div>
          {result ? (
            <div className="flex-1 flex flex-col border border-gray-200 rounded overflow-hidden bg-gray-50">
              <Tabs size="small" activeKey={activeTab} onChange={setActiveTab} items={allTabs}
                className="px-2 [&_.ant-tabs-nav]:!mb-0" />
              <TextArea value={currentList.join('\n')} readOnly
                className="flex-1 resize-none font-mono text-xs border-0 bg-gray-50 !rounded-none" />
            </div>
          ) : (
            <TextArea readOnly placeholder="提取的 IP 地址将显示在这里..." className="flex-1 resize-none font-mono text-xs bg-gray-50" />
          )}
        </div>
      </div>
    </div>
  );
};

