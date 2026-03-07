import React, { useState, useCallback } from 'react';
import { Button, InputNumber, Select, Table, Tag, message, Tabs } from 'antd';
import { CopyOutlined, ThunderboltOutlined, DeleteOutlined } from '@ant-design/icons';
import { GENERATORS, getCategories, batchGenerate, type GeneratorDef } from './generators';

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
  const categories = getCategories();
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [selectedGenerator, setSelectedGenerator] = useState<string>(
    GENERATORS.filter((g) => g.category === categories[0])[0]?.key ?? ''
  );
  const [count, setCount] = useState(10);
  const [results, setResults] = useState<GeneratedRow[]>([]);

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
      type: gen.label,
      value,
    }));
    setResults(rows);
  }, [selectedGenerator, count]);

  const handleCopyAll = useCallback(() => {
    if (results.length === 0) return;
    const text = results.map((r) => r.value).join('\n');
    navigator.clipboard.writeText(text).then(() => message.success('已复制全部数据'));
  }, [results]);

  const handleCopyOne = useCallback((value: string) => {
    navigator.clipboard.writeText(value).then(() => message.success('已复制'));
  }, []);

  const columns = [
    { title: '#', dataIndex: 'index', width: 50 },
    { title: '类型', dataIndex: 'type', width: 100, render: (t: string) => <Tag>{t}</Tag> },
    {
      title: '数据',
      dataIndex: 'value',
      ellipsis: true,
      render: (v: string) => <span className="font-mono text-xs select-all">{v}</span>,
    },
    {
      title: '操作',
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
    label: g.label,
  }));

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50">
        <span className="text-xs font-bold text-gray-600 tracking-wide">DATA GENERATOR</span>
        <span className="text-[10px] text-gray-400">渗透测试数据生成</span>
      </div>

      {/* 分类标签 */}
      <Tabs
        activeKey={activeCategory}
        onChange={handleCategoryChange}
        size="small"
        className="px-2"
        style={{ marginBottom: 0 }}
        items={categories.map((c) => ({ key: c, label: c }))}
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
          addonAfter="条"
        />
        <Button
          type="primary"
          size="small"
          icon={<ThunderboltOutlined />}
          onClick={handleGenerate}
        >
          生成
        </Button>
        <Button size="small" icon={<CopyOutlined />} onClick={handleCopyAll} disabled={!results.length}>
          复制全部
        </Button>
        <Button size="small" icon={<DeleteOutlined />} onClick={() => setResults([])} disabled={!results.length}>
          清空
        </Button>
      </div>

      {/* 结果表格 */}
      <div className="flex-1 overflow-auto px-1">
        <Table
          dataSource={results}
          columns={columns}
          size="small"
          pagination={false}
          scroll={{ y: 'calc(100vh - 180px)' }}
          locale={{ emptyText: '点击「生成」按钮生成测试数据' }}
        />
      </div>
    </div>
  );
};

