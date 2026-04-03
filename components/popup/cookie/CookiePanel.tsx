import React, { useState } from 'react';
import { Button, message, Popconfirm, Input, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      message.success(t('common.feedback.saveSuccess'));
    } catch {
      message.error(t('common.feedback.saveFailed'));
    }
  };

  const handleDelete = async (cookie: CookieItem) => {
    await removeCookie(cookie);
    message.success(t('common.feedback.deleteSuccess'));
  };

  const handleCopyValue = (cookie: CookieItem) => {
    navigator.clipboard.writeText(cookie.value);
    message.success(t('common.feedback.copySuccess'));
  };

  const handleCopyAll = () => {
    const text = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    navigator.clipboard.writeText(text);
    message.success(t('popup.cookie.messages.copiedAll'));
  };

  const handleExport = () => {
    const json = exportCookies();
    navigator.clipboard.writeText(json);
    message.success(t('popup.cookie.messages.exportedToClipboard'));
  };

  const handleImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      await importCookies(text);
      message.success(t('popup.cookie.messages.importSuccess'));
    } catch {
      message.error(t('popup.cookie.messages.importFailed'));
    }
  };

  const handleDeleteAll = async () => {
    await removeAllCookies();
    message.success(t('popup.cookie.messages.deletedAll'));
  };

  return (
    <div className="flex flex-col h-full">
      {/* 域名信息和操作栏 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700">
            {currentDomain || t('popup.cookie.unknownDomain')}
          </span>
          <span className="text-[10px] text-gray-400">({filteredCookies.length})</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Tooltip title={t('common.actions.refresh')}><Button type="text" size="small" icon={<ReloadOutlined />} onClick={loadCookies} /></Tooltip>
          <Tooltip title={t('common.actions.add')}><Button type="text" size="small" icon={<PlusOutlined />} onClick={handleAdd} /></Tooltip>
          <Tooltip title={t('popup.cookie.tooltips.copyAll')}><Button type="text" size="small" icon={<CopyOutlined />} onClick={handleCopyAll} /></Tooltip>
          <Tooltip title={t('popup.cookie.tooltips.exportJson')}><Button type="text" size="small" icon={<ExportOutlined />} onClick={handleExport} /></Tooltip>
          <Tooltip title={t('popup.cookie.tooltips.importFromClipboard')}><Button type="text" size="small" icon={<ImportOutlined />} onClick={handleImport} /></Tooltip>
          <Popconfirm
            title={t('popup.cookie.confirmDeleteAll')}
            onConfirm={handleDeleteAll}
            okText={t('common.actions.confirm')}
            cancelText={t('common.actions.cancel')}
          >
            <Tooltip title={t('popup.cookie.tooltips.deleteAll')}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="px-3 py-1.5 border-b border-gray-100">
        <Input
          size="small"
          placeholder={t('popup.cookie.searchPlaceholder')}
          prefix={<SearchOutlined className="text-gray-300" />}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          allowClear
        />
      </div>

      {/* Cookie 列表 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
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

