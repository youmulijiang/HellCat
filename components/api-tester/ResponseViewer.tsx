import React, { useMemo, useState } from 'react';
import { Tabs, Tag, Empty, Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: { name: string; value: string }[];
  body: string;
  duration: number;
  size: number;
}

interface ResponseViewerProps {
  response: ApiResponse | null;
  loading: boolean;
  error: string | null;
}

/** 状态码颜色 */
function getStatusColor(status: number) {
  if (status >= 200 && status < 300) return 'green';
  if (status >= 300 && status < 400) return 'blue';
  if (status >= 400 && status < 500) return 'orange';
  if (status >= 500) return 'red';
  return 'default';
}

/** 格式化大小 */
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** 尝试格式化 JSON */
function tryFormatJson(text: string): { formatted: string; isJson: boolean } {
  try {
    const parsed = JSON.parse(text);
    return { formatted: JSON.stringify(parsed, null, 2), isJson: true };
  } catch {
    return { formatted: text, isJson: false };
  }
}

/**
 * 响应查看器 — 展示状态码、耗时、大小、Body（Pretty/Raw）、Headers
 */
export const ResponseViewer: React.FC<ResponseViewerProps> = ({ response, loading, error }) => {
  const [activeTab, setActiveTab] = useState('body');

  const formattedBody = useMemo(() => {
    if (!response?.body) return { formatted: '', isJson: false };
    return tryFormatJson(response.body);
  }, [response?.body]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full" />
          <span>Sending request...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-sm text-red-500">
        <div className="text-center">
          <div className="text-lg mb-2">✕</div>
          <div className="font-bold mb-1">Request Error</div>
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description={<span className="text-gray-400 text-sm">点击 Send 发送请求后查看响应</span>} />
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(response.body);
    message.success('已复制响应体');
  };

  const tabItems = [
    {
      key: 'body',
      label: <span className="text-sm">Body</span>,
      children: (
        <div className="relative">
          <Button
            type="text" icon={<CopyOutlined />}
            onClick={handleCopy}
            className="absolute right-0 top-0 z-10 text-gray-400 hover:text-blue-500"
          />
          <pre className="m-0 max-h-[calc(100vh-220px)] overflow-auto rounded bg-gray-50 p-3 text-sm font-mono leading-6 whitespace-pre-wrap break-all">
            {formattedBody.isJson ? formattedBody.formatted : response.body}
          </pre>
        </div>
      ),
    },
    {
      key: 'headers',
      label: <span className="text-sm">Headers ({response.headers.length})</span>,
      children: (
        <div className="space-y-1 p-3 text-sm leading-6">
          {response.headers.map((h, i) => (
            <div key={i} className="flex gap-2 border-b border-gray-100 py-1">
              <span className="font-bold text-blue-600 shrink-0">{h.name}:</span>
              <span className="text-gray-600 break-all">{h.value}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 状态栏 */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2 shrink-0">
        <Tag color={getStatusColor(response.status)} className="m-0 text-sm font-mono">
          {response.status} {response.statusText}
        </Tag>
        <span className="text-xs text-gray-400">Time: <span className="font-mono text-gray-600">{response.duration}ms</span></span>
        <span className="text-xs text-gray-400">Size: <span className="font-mono text-gray-600">{formatSize(response.size)}</span></span>
      </div>

      {/* 标签页 */}
      <div className="flex-1 min-h-0 overflow-auto">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="px-2" />
      </div>
    </div>
  );
};

