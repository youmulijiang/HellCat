import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, InputNumber, Select, Table, Tag, message, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { CopyOutlined, ThunderboltOutlined, DeleteOutlined } from '@ant-design/icons';
import { GENERATORS, getCategories, getCategoryLabelKey, batchGenerate } from './generators';

interface GeneratedRow {
  key: string;
  index: number;
  type: string;
  value: string;
}

/**
 * 数据生成模块主布局
 * 渗透测试常用假数据生成器
 */
export const DataGeneratorLayout: React.FC = () => {
  const { t } = useTranslation();
  const categories = getCategories();
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [selectedGenerator, setSelectedGenerator] = useState<string>(
    GENERATORS.filter((g) => g.category === categories[0])[0]?.key ?? ''
  );
  const [count, setCount] = useState(10);
  const [results, setResults] = useState<GeneratedRow[]>([]);
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const [tableScrollY, setTableScrollY] = useState<number>(300);

  // 动态计算表格可滚动高度（容器高度 - 表头高度）
  useEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const header = el.querySelector('.ant-table-thead');
      const headerH = header?.getBoundingClientRect().height ?? 39;
      setTableScrollY(el.clientHeight - headerH);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const currentGenerators = GENERATORS.filter((g) => g.category === activeCategory);

  const handleCategoryChange = useCallback(
    (cat: string) => {
      setActiveCategory(cat);
      const first = GENERATORS.find((g) => g.category === cat);
      if (first) setSelectedGenerator(first.key);
    },
    []
  );

  const handleGenerate = useCallback(() => {
    const gen = GENERATORS.find((g) => g.key === selectedGenerator);
    if (!gen) return;
    const data = batchGenerate(selectedGenerator, count);
    const rows: GeneratedRow[] = data.map((value, i) => ({
      key: `${Date.now()}-${i}`,
      index: i + 1,
      type: t(`devtools.dataGenerator.generators.${gen.labelKey}`),
      value,
    }));
    setResults(rows);
  }, [selectedGenerator, count, t]);

  const handleCopyAll = useCallback(() => {
    if (results.length === 0) return;
    const text = results.map((r) => r.value).join('\n');
    navigator.clipboard.writeText(text).then(() => message.success(t('devtools.dataGenerator.messages.copiedAll')));
  }, [results, t]);

  const handleCopyOne = useCallback((value: string) => {
    navigator.clipboard.writeText(value).then(() => message.success(t('common.feedback.copySuccess')));
  }, [t]);

  const columns = [
    { title: '#', dataIndex: 'index', width: 50 },
    { title: t('devtools.dataGenerator.columns.type'), dataIndex: 'type', width: 100, render: (type: string) => <Tag>{type}</Tag> },
    {
      title: t('devtools.dataGenerator.columns.data'),
      dataIndex: 'value',
      ellipsis: true,
      render: (v: string) => <span className="font-mono text-xs select-all">{v}</span>,
    },
    {
      title: t('devtools.dataGenerator.columns.actions'),
      width: 60,
      render: (_: unknown, record: GeneratedRow) => (
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          onClick={() => handleCopyOne(record.value)}
        />
      ),
    },
  ];

  const generatorOptions = currentGenerators.map((g) => ({
    value: g.key,
    label: t(`devtools.dataGenerator.generators.${g.labelKey}`),
  }));

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50">
        <span className="text-xs font-bold text-gray-600 tracking-wide">DATA GENERATOR</span>
        <span className="text-[10px] text-gray-400">{t('devtools.dataGenerator.subtitle')}</span>
      </div>

      {/* 分类标签 */}
      <Tabs
        activeKey={activeCategory}
        onChange={handleCategoryChange}
        size="small"
        className="px-2"
        style={{ marginBottom: 0 }}
        items={categories.map((c) => ({ key: c, label: t(getCategoryLabelKey(c)) }))}
      />

      {/* 工具栏 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
        <Select
          value={selectedGenerator}
          onChange={setSelectedGenerator}
          options={generatorOptions}
          size="small"
          className="w-36"
        />
        <InputNumber
          min={1}
          max={1000}
          value={count}
          onChange={(v) => setCount(v ?? 10)}
          size="small"
          className="w-20"
          addonAfter={t('devtools.dataGenerator.rowsUnit')}
        />
        <Button
          type="primary"
          size="small"
          icon={<ThunderboltOutlined />}
          onClick={handleGenerate}
        >
          {t('devtools.dataGenerator.generate')}
        </Button>
        <Button size="small" icon={<CopyOutlined />} onClick={handleCopyAll} disabled={!results.length}>
          {t('devtools.dataGenerator.copyAll')}
        </Button>
        <Button size="small" icon={<DeleteOutlined />} onClick={() => setResults([])} disabled={!results.length}>
          {t('common.actions.clear')}
        </Button>
      </div>

      {/* 结果表格 - 填充剩余空间 */}
      <div ref={tableWrapRef} className="flex-1 min-h-0 overflow-hidden">
        <Table
          dataSource={results}
          columns={columns}
          size="small"
          pagination={false}
          scroll={{ x: '100%', y: tableScrollY }}
          locale={{ emptyText: t('devtools.dataGenerator.emptyHint') }}
        />
      </div>
    </div>
  );
};
