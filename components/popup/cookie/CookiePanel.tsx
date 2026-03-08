import React, { useState } from 'react';
import { Button, message, Popconfirm, Input, Tooltip } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  ReloadOutlined,
  ImportOutlined,
  ExportOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useCookies, type CookieItem } from '@/hooks/useCookies';
import { CookieList } from './CookieList';
import { CookieEditModal } from './CookieEditModal';

export const CookiePanel: React.FC = () => {
  const {
    cookies,
    currentDomain,
    loading,
    loadCookies,
    removeCookie,
    removeAllCookies,
    setCookie,
    exportCookies,
    importCookies,
  } = useCookies();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCookie, setEditingCookie] = useState<CookieItem | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredCookies = searchKeyword
    ? cookies.filter(
        (c) =>
          c.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          c.value.toLowerCase().includes(searchKeyword.toLowerCase()),
      )
    : cookies;

  const handleEdit = (cookie: CookieItem) => {
    setEditingCookie(cookie);
    setEditModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCookie(null);
    setEditModalOpen(true);
  };

  const handleSave = async (cookie: Omit<CookieItem, 'key'>) => {
    try {
      await setCookie(cookie);
      setEditModalOpen(false);
      message.success('Cookie已保存');
    } catch {
      message.error('保存失败');
    }
  };

  const handleDelete = async (cookie: CookieItem) => {
    await removeCookie(cookie);
    message.success('已删除');
  };

  const handleCopyValue = (cookie: CookieItem) => {
    navigator.clipboard.writeText(cookie.value);
    message.success('已复制');
  };

  const handleCopyAll = () => {
    const text = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    navigator.clipboard.writeText(text);
    message.success('已复制所有Cookie');
  };

  const handleExport = () => {
    const json = exportCookies();
    navigator.clipboard.writeText(json);
    message.success('已导出到剪贴板');
  };

  const handleImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      await importCookies(text);
      message.success('导入成功');
    } catch {
      message.error('导入失败，请确保剪贴板中为有效JSON');
    }
  };

  const handleDeleteAll = async () => {
    await removeAllCookies();
    message.success('已删除所有Cookie');
  };

  return (
    <div className="flex flex-col h-full">
      {/* 域名信息和操作栏 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700">{currentDomain || '未知域名'}</span>
          <span className="text-[10px] text-gray-400">({filteredCookies.length})</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Tooltip title="刷新"><Button type="text" size="small" icon={<ReloadOutlined />} onClick={loadCookies} /></Tooltip>
          <Tooltip title="添加"><Button type="text" size="small" icon={<PlusOutlined />} onClick={handleAdd} /></Tooltip>
          <Tooltip title="复制全部"><Button type="text" size="small" icon={<CopyOutlined />} onClick={handleCopyAll} /></Tooltip>
          <Tooltip title="导出JSON"><Button type="text" size="small" icon={<ExportOutlined />} onClick={handleExport} /></Tooltip>
          <Tooltip title="从剪贴板导入"><Button type="text" size="small" icon={<ImportOutlined />} onClick={handleImport} /></Tooltip>
          <Popconfirm title="确定删除所有Cookie？" onConfirm={handleDeleteAll} okText="确定" cancelText="取消">
            <Tooltip title="删除全部"><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="px-3 py-1.5 border-b border-gray-100">
        <Input
          size="small"
          placeholder="搜索Cookie..."
          prefix={<SearchOutlined className="text-gray-300" />}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          allowClear
        />
      </div>

      {/* Cookie 列表 */}
      <div className="flex-1 overflow-hidden">
        <CookieList
          cookies={filteredCookies}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCopyValue={handleCopyValue}
        />
      </div>

      {/* 编辑弹窗 */}
      <CookieEditModal
        open={editModalOpen}
        cookie={editingCookie}
        onSave={handleSave}
        onCancel={() => setEditModalOpen(false)}
        currentDomain={currentDomain}
      />
    </div>
  );
};

