import React, { useState, useEffect, useRef } from 'react';
import { Input } from 'antd';

const { TextArea } = Input;

const STORAGE_KEY = 'hellcat_notes';

export const NoteTab: React.FC = () => {
  const [content, setContent] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 输入变化时延迟 300ms 自动保存
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, content);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [content]);

  return (
    <div className="flex flex-col h-full px-3 py-2">
      <TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="在这里记录临时笔记，内容会自动保存..."
        className="flex-1 resize-none text-xs font-mono"
        style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}
      />
    </div>
  );
};

