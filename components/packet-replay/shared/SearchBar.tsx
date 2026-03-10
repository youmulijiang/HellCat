import React from 'react';
import { Input } from 'antd';

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * 搜索栏组件
 * 用于 Request/Response 面板底部的内容搜索
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  value,
  onChange,
}) => {
  return (
    <div className="border-t border-gray-200 bg-white px-2.5 py-2">
      <Input.Search
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        allowClear
        className="text-sm"
      />
    </div>
  );
};

