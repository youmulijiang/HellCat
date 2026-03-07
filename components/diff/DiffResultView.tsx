import React from 'react';
import type { Change } from 'diff';
import type { DiffMode } from './DiffLayout';

interface DiffResultViewProps {
  diffResult: Change[] | null;
  mode: DiffMode;
}

/** 差异结果渲染组件 */
export const DiffResultView: React.FC<DiffResultViewProps> = ({ diffResult, mode }) => {
  if (!diffResult) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
        输入文本后点击「比对」查看差异
      </div>
    );
  }

  if (diffResult.every((p) => !p.added && !p.removed)) {
    return (
      <div className="flex-1 flex items-center justify-center text-green-500 text-xs font-bold">
        ✓ 两段文本完全相同，无差异
      </div>
    );
  }

  const isLineMode = mode === 'lines';

  return (
    <div className="flex-1 overflow-auto px-3 py-2 font-mono text-xs leading-5">
      {isLineMode ? (
        diffResult.map((part, i) => {
          const lines = part.value.replace(/\n$/, '').split('\n');
          return lines.map((line, j) => {
            let bgClass = '';
            let prefix = ' ';
            let textClass = 'text-gray-700';
            if (part.added) {
              bgClass = 'bg-green-50';
              prefix = '+';
              textClass = 'text-green-700';
            } else if (part.removed) {
              bgClass = 'bg-red-50';
              prefix = '-';
              textClass = 'text-red-700';
            }
            return (
              <div key={`${i}-${j}`} className={`${bgClass} px-1 whitespace-pre-wrap break-all`}>
                <span className={`${textClass} select-none mr-2 opacity-60`}>{prefix}</span>
                <span className={textClass}>{line}</span>
              </div>
            );
          });
        })
      ) : (
        <div className="whitespace-pre-wrap break-all leading-6">
          {diffResult.map((part, i) => {
            if (part.added) {
              return (
                <span key={i} className="bg-green-200 text-green-900 rounded-sm px-[1px]">
                  {part.value}
                </span>
              );
            }
            if (part.removed) {
              return (
                <span key={i} className="bg-red-200 text-red-900 line-through rounded-sm px-[1px]">
                  {part.value}
                </span>
              );
            }
            return <span key={i}>{part.value}</span>;
          })}
        </div>
      )}
    </div>
  );
};

