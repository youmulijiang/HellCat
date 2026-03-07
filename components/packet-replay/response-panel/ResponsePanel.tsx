import React from 'react';
import { usePacketStore } from '@/stores/usePacketStore';
import { PanelHeader } from '../shared/PanelHeader';
import { ContentTabs } from '../shared/ContentTabs';
import { ContentViewer } from '../shared/ContentViewer';
import { SearchBar } from '../shared/SearchBar';
import { ResponseToolbar } from './ResponseToolbar';
import type { ResponseViewTab } from '@/types/packet';

const RESPONSE_TABS: ResponseViewTab[] = ['Pretty', 'Raw', 'Hex', 'Json', 'Preview'];

/**
 * 响应面板
 * 展示选中数据包的响应详情
 */
export const ResponsePanel: React.FC = () => {
  const {
    responseViewTab,
    setResponseViewTab,
    responseSearchKeyword,
    setResponseSearchKeyword,
    getSelectedPacket,
  } = usePacketStore();

  const selectedPacket = getSelectedPacket();

  /** 根据视图标签获取展示内容 */
  const getContent = (): string => {
    if (!selectedPacket?.response) return '';
    const { response } = selectedPacket;

    switch (responseViewTab) {
      case 'Pretty':
      case 'Raw':
        return formatRawResponse(response);
      case 'Hex':
        return formatRawResponse(response);
      case 'Json':
        return response.body;
      case 'Preview':
        return response.body;
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <PanelHeader title="RESPONSE" actions={<ResponseToolbar />} />
      <ContentTabs
        tabs={RESPONSE_TABS}
        activeTab={responseViewTab}
        onTabChange={setResponseViewTab}
      />
      <ContentViewer content={getContent()} viewType={responseViewTab} />
      <SearchBar
        placeholder="Search in response..."
        value={responseSearchKeyword}
        onChange={setResponseSearchKeyword}
      />
    </div>
  );
};

/** 格式化原始响应内容 */
function formatRawResponse(response: {
  status: number;
  statusText: string;
  httpVersion: string;
  headers: { name: string; value: string }[];
  body: string;
}): string {
  const lines: string[] = [];

  lines.push(`${response.httpVersion} ${response.status} ${response.statusText}`);

  for (const header of response.headers) {
    lines.push(`${header.name}: ${header.value}`);
  }

  if (response.body) {
    lines.push('');
    lines.push(response.body);
  }

  return lines.join('\n');
}

