import React, { useEffect, useState, useCallback } from 'react';
import { Button, Collapse, Tag, Progress, Empty, Tooltip, message, Input } from 'antd';
import {
  ReloadOutlined,
  CopyOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ScanResults } from '@/types/info-collect';
import { createEmptyScanResults, SCAN_SECTION_KEYS } from '@/types/info-collect';

/** 各分类颜色 */
const SECTION_COLORS: Record<string, string> = {
  domains: 'blue',
  absoluteApis: 'cyan',
  apis: 'geekblue',
  ips: 'orange',
  phones: 'red',
  emails: 'green',
  idcards: 'volcano',
  jwts: 'purple',
  credentials: 'magenta',
  idKeys: 'gold',
  urls: 'lime',
  jsFiles: 'default',
};

export const InfoCollectPanel: React.FC = () => {
  const { t } = useTranslation();
  const [results, setResults] = useState<ScanResults>(createEmptyScanResults());
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  /** 从 content script 获取扫描结果 */
  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;
      const response = await browser.tabs.sendMessage(tab.id, {
        action: 'getInfoCollectResults',
      });
      if (response?.results) {
        setResults(response.results);
        setProgress(response.progress ?? 0);
      }
    } catch {
      /* content script 可能未加载 */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
    // 监听实时更新
    const listener = (msg: any) => {
      if (msg.action === 'infoCollectUpdate') {
        setResults(msg.results);
        setProgress(msg.progress ?? 0);
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, [fetchResults]);

  /** 复制分类下所有值 */
  const copySection = (key: keyof ScanResults) => {
    const values = results[key].map((item) => item.value).join('\n');
    if (!values) return;
    navigator.clipboard.writeText(values).then(() => {
      message.success(t('popup.infoCollect.messages.copiedSection', { count: results[key].length }));
    });
  };

  /** 复制单个值 */
  const copyValue = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      message.success(t('common.feedback.copySuccess'));
    });
  };

  /** 构建 Collapse items */
  const collapseItems = SCAN_SECTION_KEYS
    .filter((key) => {
      const items = results[key];
      if (!items.length) return false;
      if (!searchKeyword) return true;
      return items.some((item) =>
        item.value.toLowerCase().includes(searchKeyword.toLowerCase()),
      );
    })
    .map((key) => {
      const items = results[key].filter((item) =>
        !searchKeyword || item.value.toLowerCase().includes(searchKeyword.toLowerCase()),
      );
      return {
        key,
        label: (
          <div className="flex items-center justify-between w-full pr-2">
            <span>
              {t(`popup.infoCollect.sections.${key}`)}
              <Tag color={SECTION_COLORS[key]} className="ml-2">{items.length}</Tag>
            </span>
            <Tooltip title={t('popup.infoCollect.tooltips.copyAll')}>
              <CopyOutlined
                className="text-gray-400 hover:text-blue-500"
                onClick={(e) => { e.stopPropagation(); copySection(key); }}
              />
            </Tooltip>
          </div>
        ),
        children: (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between group px-1 py-0.5 hover:bg-gray-50 rounded text-xs"
              >
                <Tooltip title={t('popup.infoCollect.tooltips.source', { source: item.source })} placement="topLeft">
                  <span className="truncate flex-1 mr-2 cursor-default">{item.value}</span>
                </Tooltip>
                <CopyOutlined
                  className="text-gray-300 group-hover:text-blue-500 cursor-pointer flex-shrink-0"
                  onClick={() => copyValue(item.value)}
                />
              </div>
            ))}
          </div>
        ),
      };
    });

  const totalCount = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-1 py-1.5">
        <Input
          size="small"
          placeholder={t('popup.infoCollect.searchPlaceholder')}
          prefix={<SearchOutlined className="text-gray-400" />}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          allowClear
          className="flex-1"
        />
        <Button size="small" icon={<ReloadOutlined spin={loading} />} onClick={fetchResults}>
          {t('common.actions.refresh')}
        </Button>
      </div>
      <div className="flex items-center gap-2 px-1 pb-1">
        <Progress percent={progress} size="small" className="flex-1 mb-0" />
        <Tag>{t('popup.infoCollect.countLabel', { count: totalCount })}</Tag>
      </div>
      <div className="flex-1 overflow-y-auto px-1">
        {collapseItems.length > 0 ? (
          <Collapse size="small" items={collapseItems} />
        ) : (
          <Empty description={t('popup.infoCollect.empty')} className="mt-8" />
        )}
      </div>
    </div>
  );
};

