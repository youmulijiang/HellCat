import React, { useState, useMemo, useCallback } from 'react';
import { Button, Input, Select, Tooltip, Switch, message } from 'antd';
import {
  SearchOutlined,
  CopyOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { browser } from 'wxt/browser';
import {
  DORK_ENGINES,
  buildDorkQuery,
  buildSearchUrl,
  type DorkEngine,
} from '@/config/dork-engines';

/** 每个操作符对应的用户输入状态 */
interface OperatorValue {
  value: string;
  negated: boolean;
}

type OperatorValues = Record<string, OperatorValue>;

/** 创建空的操作符值映射 */
function createEmptyValues(engine: DorkEngine): OperatorValues {
  const values: OperatorValues = {};
  for (const op of engine.operators) {
    values[op.keyword] = { value: '', negated: false };
  }
  return values;
}

export const DorkPanel: React.FC = () => {
  const { t } = useTranslation();
  const [engineId, setEngineId] = useState(DORK_ENGINES[0].id);
  const [operatorValues, setOperatorValues] = useState<OperatorValues>(
    () => createEmptyValues(DORK_ENGINES[0]),
  );
  const [freeText, setFreeText] = useState('');

  const engine = useMemo(
    () => DORK_ENGINES.find((e) => e.id === engineId) ?? DORK_ENGINES[0],
    [engineId],
  );

  /** 切换引擎时重置表单 */
  const handleEngineChange = useCallback(
    (id: string) => {
      const next = DORK_ENGINES.find((e) => e.id === id) ?? DORK_ENGINES[0];
      setEngineId(id);
      setOperatorValues(createEmptyValues(next));
      setFreeText('');
    },
    [],
  );

  /** 更新单个操作符的值 */
  const updateValue = useCallback((keyword: string, value: string) => {
    setOperatorValues((prev) => ({
      ...prev,
      [keyword]: { ...prev[keyword], value },
    }));
  }, []);

  /** 切换取反 */
  const toggleNegate = useCallback((keyword: string) => {
    setOperatorValues((prev) => ({
      ...prev,
      [keyword]: { ...prev[keyword], negated: !prev[keyword]?.negated },
    }));
  }, []);

  /** 生成的 dork 查询 */
  const query = useMemo(
    () => buildDorkQuery(engine, operatorValues, freeText),
    [engine, operatorValues, freeText],
  );

  /** 复制 */
  const handleCopy = () => {
    if (!query) return;
    navigator.clipboard.writeText(query).then(() => message.success(t('common.feedback.copySuccess')));
  };

  /** 打开搜索 */
  const handleSearch = () => {
    if (!query) {
      message.warning(t('popup.dork.messages.inputRequired'));
      return;
    }
    const url = buildSearchUrl(engine, query);
    browser.tabs.create({ url });
  };

  /** 清空 */
  const handleClear = () => {
    setOperatorValues(createEmptyValues(engine));
    setFreeText('');
  };

  /** 引擎选项 */
  const engineOptions = DORK_ENGINES.map((e) => ({ label: e.name, value: e.id }));

  return (
    <div className="flex flex-col h-full">
      {/* 顶部：引擎选择 + 操作按钮 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/50">
        <Select
          size="small"
          value={engineId}
          options={engineOptions}
          onChange={handleEngineChange}
          className="w-28"
        />
        <div className="flex items-center gap-0.5">
          <Tooltip title={t('common.actions.clear')}>
            <Button type="text" size="small" icon={<ClearOutlined />} onClick={handleClear} />
          </Tooltip>
          <Tooltip title={t('popup.dork.tooltips.copyQuery')}>
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={!query} />
          </Tooltip>
          <Button type="primary" size="small" icon={<SearchOutlined />} onClick={handleSearch} disabled={!query}>
            {t('common.actions.search')}
          </Button>
        </div>
      </div>

      {/* 操作符表单 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {engine.operators.map((op) => {
          const entry = operatorValues[op.keyword];
          const negatable = op.negatable !== false;
          return (
            <div key={op.keyword} className="flex items-center gap-1.5">
              {/* 取反开关 */}
              {negatable ? (
                <Tooltip title={entry?.negated ? t('popup.dork.tooltips.exclude') : t('popup.dork.tooltips.include')}>
                  <Switch
                    size="small"
                    checked={entry?.negated}
                    onChange={() => toggleNegate(op.keyword)}
                    checkedChildren="-"
                    unCheckedChildren="+"
                    className="flex-shrink-0"
                  />
                </Tooltip>
              ) : (
                <span className="w-[44px] flex-shrink-0" />
              )}
              {/* 标签 */}
              <span className="text-xs text-gray-500 w-20 text-right flex-shrink-0 truncate" title={`${op.keyword}:`}>
                {t(op.labelKey)}
              </span>
              {/* 输入框 */}
              <Input
                size="small"
                placeholder={t(op.placeholderKey)}
                value={entry?.value ?? ''}
                onChange={(e) => updateValue(op.keyword, e.target.value)}
                className="flex-1"
              />
            </div>
          );
        })}

        {/* 自由文本 */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
          <span className="w-[44px] flex-shrink-0" />
          <span className="text-xs text-gray-500 w-20 text-right flex-shrink-0">{t('popup.dork.labels.freeText')}</span>
          <Input
            size="small"
            placeholder={t('popup.dork.placeholders.freeText')}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      {/* 底部预览 */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-gray-400">{t('popup.dork.labels.generatedQuery')}</span>
          {query && (
            <Button
              type="link"
              size="small"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              className="text-[10px] p-0 h-auto leading-none"
            >
              {t('common.actions.search')}
            </Button>
          )}
        </div>
        <div
          className={`text-xs font-mono bg-white border border-gray-200 rounded px-2 py-1 min-h-[28px] break-all text-gray-700 ${query ? 'cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors select-all' : ''}`}
          onClick={query ? handleSearch : undefined}
          title={query ? t('popup.dork.tooltips.clickToSearch') : undefined}
        >
          {query || <span className="text-gray-300 italic">{t('popup.dork.emptyPreview')}</span>}
        </div>
      </div>
    </div>
  );
};

