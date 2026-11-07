import React from 'react';
import { Button, Space, Tooltip, message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  DownloadOutlined,
  CopyOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { usePacketStore } from '@/stores/usePacketStore';

/**
 * 响应面板工具栏
 * 包含下载、复制、保存操作
 */
export const ResponseToolbar: React.FC = () => {
  const { t } = useTranslation();
  const { getSelectedPacket } = usePacketStore();
  const selectedPacket = getSelectedPacket();
  const response = selectedPacket?.response;

  /** 复制响应报文到剪贴板 */
  const handleCopy = async () => {
    if (!response) return;
    const raw = formatFullResponse(response);
    try {
      await navigator.clipboard.writeText(raw);
      message.success(t('devtools.packetReplay.response.copiedFull'));
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = raw;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      message.success(t('devtools.packetReplay.response.copiedFull'));
    }
  };

  /** 下载响应体 */
  const handleDownload = () => {
    if (!response) return;
    const contentType = response.contentType || 'text/plain';
    const ext = getFileExtension(contentType);
    const blob = new Blob([response.body], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(t('devtools.packetReplay.response.downloadStarted'));
  };

  /** 保存完整响应报文（含 headers） */
  const handleSave = () => {
    if (!response) return;
    const raw = formatFullResponse(response);
    const blob = new Blob([raw], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-full-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(t('devtools.packetReplay.response.savedFull'));
  };

  const actions = [
    { icon: <DownloadOutlined />, title: t('devtools.packetReplay.response.downloadBody'), onClick: handleDownload },
    { icon: <CopyOutlined />, title: t('devtools.packetReplay.response.copyFull'), onClick: handleCopy },
    { icon: <SaveOutlined />, title: t('devtools.packetReplay.response.saveFull'), onClick: handleSave },
  ];

  return (
    <Space size={0}>
      {actions.map(({ icon, title, onClick }) => (
        <Tooltip key={title} title={title} mouseEnterDelay={0.5}>
          <Button
            type="text"
            size="small"
            icon={icon}
            disabled={!response}
            onClick={onClick}
          />
        </Tooltip>
      ))}
    </Space>
  );
};

/** 格式化完整响应报文（状态行 + headers + body） */
function formatFullResponse(response: {
  status: number;
  statusText: string;
  httpVersion: string;
  headers: { name: string; value: string }[];
  body: string;
}): string {
  const lines: string[] = [];
  lines.push(`${response.httpVersion} ${response.status} ${response.statusText}`);
  for (const h of response.headers) {
    lines.push(`${h.name}: ${h.value}`);
  }
  lines.push('');
  lines.push(response.body);
  return lines.join('\r\n');
}

/** 根据 Content-Type 获取文件扩展名 */
function getFileExtension(contentType: string): string {
  const map: Record<string, string> = {
    'text/html': '.html',
    'text/css': '.css',
    'text/javascript': '.js',
    'application/javascript': '.js',
    'application/json': '.json',
    'application/xml': '.xml',
    'text/xml': '.xml',
    'text/plain': '.txt',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
  };
  const base = contentType.split(';')[0].trim().toLowerCase();
  return map[base] || '.bin';
}

