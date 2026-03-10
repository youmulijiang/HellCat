import React from 'react';

interface ContentViewerProps {
  content: string;
  viewType: string;
  /** 是否可编辑 */
  editable?: boolean;
  /** 编辑回调 */
  onChange?: (value: string) => void;
}

/**
 * 内容查看器组件
 * 根据视图类型（Pretty/Raw/Hex/Json/Preview）展示内容
 * 支持编辑模式：editable=true 时渲染 textarea
 */
export const ContentViewer: React.FC<ContentViewerProps> = ({
  content,
  viewType,
  editable = false,
  onChange,
}) => {
  // Hex / Preview 视图不支持编辑
  const isEditable = editable && viewType !== 'Hex' && viewType !== 'Preview';

  if (isEditable) {
    return (
      <div className="flex-1 overflow-hidden p-0 bg-white">
        <textarea
          className="w-full h-full resize-none border-none outline-none p-2
            text-sm font-mono leading-6 text-gray-700 bg-white"
          value={content}
          onChange={(e) => onChange?.(e.target.value)}
          spellCheck={false}
        />
      </div>
    );
  }

  const renderContent = () => {
    if (!content) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          No data available
        </div>
      );
    }

    switch (viewType) {
      case 'Pretty':
        return (
          <pre className="text-sm font-mono whitespace-pre-wrap break-all leading-6 text-gray-700">
            {content}
          </pre>
        );
      case 'Raw':
        return (
          <pre className="text-sm font-mono whitespace-pre-wrap break-all leading-6 text-gray-600">
            {content}
          </pre>
        );
      case 'Hex':
        return (
          <pre className="text-sm font-mono whitespace-pre leading-6 text-gray-600">
            {formatHex(content)}
          </pre>
        );
      case 'Json':
        return (
          <pre className="text-sm font-mono whitespace-pre-wrap break-all leading-6 text-gray-700">
            {formatJson(content)}
          </pre>
        );
      case 'Preview':
        return (
          <div className="p-2 text-sm leading-6 text-gray-700">
            {content}
          </div>
        );
      default:
        return (
          <pre className="text-sm font-mono whitespace-pre-wrap break-all leading-6 text-gray-700">
            {content}
          </pre>
        );
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white p-3">
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

