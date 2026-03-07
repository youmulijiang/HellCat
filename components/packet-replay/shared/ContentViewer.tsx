import React from 'react';

interface ContentViewerProps {
  content: string;
  viewType: string;
}

/**
 * 内容查看器组件
 * 根据视图类型（Pretty/Raw/Hex/Json/Preview）展示内容
 */
export const ContentViewer: React.FC<ContentViewerProps> = ({
  content,
  viewType,
}) => {
  const renderContent = () => {
    if (!content) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-xs">
          No data available
        </div>
      );
    }

    switch (viewType) {
      case 'Pretty':
        return (
          <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-5 text-gray-700">
            {content}
          </pre>
        );
      case 'Raw':
        return (
          <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-5 text-gray-600">
            {content}
          </pre>
        );
      case 'Hex':
        return (
          <pre className="text-xs font-mono whitespace-pre leading-5 text-gray-600">
            {formatHex(content)}
          </pre>
        );
      case 'Json':
        return (
          <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-5 text-gray-700">
            {formatJson(content)}
          </pre>
        );
      case 'Preview':
        return (
          <div className="text-xs text-gray-700 p-1">
            {content}
          </div>
        );
      default:
        return (
          <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-5 text-gray-700">
            {content}
          </pre>
        );
    }
  };

  return (
    <div className="flex-1 overflow-auto p-2 bg-white">
      {renderContent()}
    </div>
  );
};

/** 将字符串转换为 Hex 格式展示 */
function formatHex(str: string): string {
  if (!str) return '';
  const bytes = new TextEncoder().encode(str);
  const lines: string[] = [];

  for (let i = 0; i < bytes.length; i += 16) {
    const slice = bytes.slice(i, i + 16);
    const offset = i.toString(16).padStart(8, '0');
    const hex = Array.from(slice)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')
      .padEnd(47, ' ');
    const ascii = Array.from(slice)
      .map((b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.'))
      .join('');
    lines.push(`${offset}  ${hex}  |${ascii}|`);
  }

  return lines.join('\n');
}

/** 格式化 JSON 字符串 */
function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

