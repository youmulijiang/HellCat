import React from 'react';
import { usePacketStore } from '@/stores/usePacketStore';
import { PanelHeader } from '../shared/PanelHeader';
import { ContentTabs } from '../shared/ContentTabs';
import { ContentViewer } from '../shared/ContentViewer';
import { SearchBar } from '../shared/SearchBar';
import { RequestToolbar } from './RequestToolbar';
import type { RequestViewTab } from '@/types/packet';

const REQUEST_TABS: RequestViewTab[] = ['Pretty', 'Raw', 'Hex'];

interface RequestPanelProps {
  onSend?: () => void;
}

/**
 * 请求面板
 * 展示选中数据包的请求详情，支持编辑
 */
export const RequestPanel: React.FC<RequestPanelProps> = ({ onSend }) => {
  const {
    requestViewTab,
    setRequestViewTab,
    requestSearchKeyword,
    setRequestSearchKeyword,
    getSelectedPacket,
    editedRequestRaw,
    setEditedRequestRaw,
  } = usePacketStore();

  const selectedPacket = getSelectedPacket();

  /** 根据视图标签获取展示内容 */
  const getContent = (): string => {
    if (!selectedPacket) return '';
    const { request } = selectedPacket;

    switch (requestViewTab) {
      case 'Pretty':
      case 'Raw':
        return formatRawRequest(request);
      case 'Hex':
        return formatRawRequest(request);
      default:
        return '';
    }
  };

  // 显示内容：优先使用编辑态文本，否则使用格式化后的原始内容
  const displayContent = editedRequestRaw ?? getContent();

  /** 编辑回调：首次编辑时初始化编辑态 */
  const handleChange = (value: string) => {
    setEditedRequestRaw(value);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <PanelHeader title="REQUEST" />
      <RequestToolbar onSend={onSend} />
      <ContentTabs
        tabs={REQUEST_TABS}
        activeTab={requestViewTab}
        onTabChange={setRequestViewTab}
      />
      <ContentViewer
        content={displayContent}
        viewType={requestViewTab}
        editable
        onChange={handleChange}
      />
      <SearchBar
        placeholder="Search in request..."
        value={requestSearchKeyword}
        onChange={setRequestSearchKeyword}
      />
    </div>
  );
};

/** 格式化原始请求内容 */
function formatRawRequest(request: {
  method: string;
  url: string;
  httpVersion: string;
  headers: { name: string; value: string }[];
  body: string;
}): string {
  const lines: string[] = [];
  const urlObj = safeParseUrl(request.url);
  const path = urlObj ? `${urlObj.pathname}${urlObj.search}` : request.url;

  lines.push(`${request.method} ${path} ${request.httpVersion}`);

  if (urlObj) {
    lines.push(`Host: ${urlObj.host}`);
  }

  for (const header of request.headers) {
    lines.push(`${header.name}: ${header.value}`);
  }

  if (request.body) {
    lines.push('');
    lines.push(request.body);
  }

  return lines.join('\n');
}

function safeParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

