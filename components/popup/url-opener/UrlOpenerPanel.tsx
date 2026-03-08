import React, { useState } from 'react';
import { Button, Input, Tooltip, Dropdown, message } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ClearOutlined,
  ImportOutlined,
  ChromeOutlined,
  WindowsOutlined,
  CaretDownOutlined,
} from '@ant-design/icons';
import { useUrlOpener, type OpenMode } from '@/hooks/useUrlOpener';
import { UrlImportModal } from './UrlImportModal';

export const UrlOpenerPanel: React.FC = () => {
  const {
    urls,
    loading,
    addUrl,
    removeUrl,
    updateUrl,
    clearAll,
    openUrls,
    importFromText,
  } = useUrlOpener();

  const [importModalOpen, setImportModalOpen] = useState(false);

  const validCount = urls.filter((u) => u.url.trim()).length;

  const handleOpen = async (mode: OpenMode) => {
    if (validCount === 0) {
      message.warning('请至少输入一个URL');
      return;
    }
    try {
      await openUrls(mode);
      message.success(`已打开 ${validCount} 个URL`);
    } catch {
      message.error('打开URL失败');
    }
  };

  const handleImport = (text: string) => {
    importFromText(text);
    setImportModalOpen(false);
    message.success('导入成功');
  };

  const openMenuItems = [
    {
      key: 'current-window',
      icon: <ChromeOutlined />,
      label: '在当前窗口打开',
      onClick: () => handleOpen('current-window'),
    },
    {
      key: 'new-window',
      icon: <WindowsOutlined />,
      label: '在新窗口打开',
      onClick: () => handleOpen('new-window'),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700">URL列表</span>
          <span className="text-[10px] text-gray-400">({validCount}/{urls.length})</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Tooltip title="添加URL">
            <Button type="text" size="small" icon={<PlusOutlined />} onClick={addUrl} />
          </Tooltip>
          <Tooltip title="批量导入">
            <Button type="text" size="small" icon={<ImportOutlined />} onClick={() => setImportModalOpen(true)} />
          </Tooltip>
          <Tooltip title="清空全部">
            <Button type="text" size="small" danger icon={<ClearOutlined />} onClick={clearAll} />
          </Tooltip>
        </div>
      </div>

      {/* URL 输入列表 */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
        {urls.map((entry, index) => (
          <div key={entry.id} className="flex items-center gap-1.5 group">
            <span className="text-[10px] text-gray-400 w-4 text-right shrink-0">
              {index + 1}
            </span>
            <Input
              size="small"
              placeholder="输入URL，例如: example.com"
              value={entry.url}
              onChange={(e) => updateUrl(entry.id, e.target.value)}
              onPressEnter={addUrl}
              className="flex-1"
            />
            <button
              onClick={() => removeUrl(entry.id)}
              className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors cursor-pointer border-none bg-transparent opacity-0 group-hover:opacity-100 shrink-0"
              title="删除"
            >
              <DeleteOutlined style={{ fontSize: 11 }} />
            </button>
          </div>
        ))}
      </div>

      {/* 底部操作区 */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/50">
        <span className="text-[10px] text-gray-400">
          按 Enter 快速添加新行
        </span>
        <Dropdown menu={{ items: openMenuItems }} trigger={['click']}>
          <Button
            type="primary"
            size="small"
            loading={loading}
            disabled={validCount === 0}
            icon={<ChromeOutlined />}
          >
            打开 ({validCount}) <CaretDownOutlined />
          </Button>
        </Dropdown>
      </div>

      {/* 批量导入弹窗 */}
      <UrlImportModal
        open={importModalOpen}
        onImport={handleImport}
        onCancel={() => setImportModalOpen(false)}
      />
    </div>
  );
};

