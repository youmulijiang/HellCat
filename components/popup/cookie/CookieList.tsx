import React from 'react';
import { Tag, Tooltip, Empty, Spin } from 'antd';
import { DeleteOutlined, EditOutlined, CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { CookieItem } from '@/hooks/useCookies';

interface CookieListProps {
  cookies: CookieItem[];
  loading: boolean;
  onEdit: (cookie: CookieItem) => void;
  onDelete: (cookie: CookieItem) => void;
  onCopyValue: (cookie: CookieItem) => void;
}

export const CookieList: React.FC<CookieListProps> = ({
  cookies,
  loading,
  onEdit,
  onDelete,
  onCopyValue,
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spin size="small" tip={t('common.status.loading')} />
      </div>
    );
  }

  if (cookies.length === 0) {
    return <Empty description={t('popup.cookie.empty')} className="py-6" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {cookies.map((cookie) => (
        <div
          key={cookie.key}
          className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-800 truncate max-w-[120px]">
                {cookie.name}
              </span>
              {cookie.secure && <Tag color="green" className="text-[10px] leading-tight px-1 py-0 m-0">S</Tag>}
              {cookie.httpOnly && <Tag color="orange" className="text-[10px] leading-tight px-1 py-0 m-0">H</Tag>}
            </div>
            <Tooltip title={cookie.value} placement="topLeft" mouseEnterDelay={0.5}>
              <div className="text-[11px] text-gray-400 truncate max-w-[200px] mt-0.5">
                {cookie.value}
              </div>
            </Tooltip>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip title={t('popup.cookie.tooltips.copyValue')}>
              <button
                onClick={() => onCopyValue(cookie)}
                className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors cursor-pointer border-none bg-transparent"
              >
                <CopyOutlined style={{ fontSize: 12 }} />
              </button>
            </Tooltip>
            <Tooltip title={t('common.actions.edit')}>
              <button
                onClick={() => onEdit(cookie)}
                className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors cursor-pointer border-none bg-transparent"
              >
                <EditOutlined style={{ fontSize: 12 }} />
              </button>
            </Tooltip>
            <Tooltip title={t('common.actions.delete')}>
              <button
                onClick={() => onDelete(cookie)}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer border-none bg-transparent"
              >
                <DeleteOutlined style={{ fontSize: 12 }} />
              </button>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  );
};

