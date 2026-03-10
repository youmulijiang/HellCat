import React from 'react';
import { Tabs, Radio, Input } from 'antd';
import type { KeyValueItem } from './KeyValueEditor';
import { KeyValueEditor } from './KeyValueEditor';

export type BodyType = 'none' | 'form-urlencoded' | 'form-data' | 'raw-json' | 'raw-text' | 'raw-xml';

export const BODY_TYPE_LABELS: Record<BodyType, string> = {
  'none': 'none',
  'form-urlencoded': 'x-www-form-urlencoded',
  'form-data': 'form-data',
  'raw-json': 'JSON',
  'raw-text': 'Text',
  'raw-xml': 'XML',
};

interface RequestConfigProps {
  params: KeyValueItem[];
  onParamsChange: (items: KeyValueItem[]) => void;
  headers: KeyValueItem[];
  onHeadersChange: (items: KeyValueItem[]) => void;
  bodyType: BodyType;
  onBodyTypeChange: (type: BodyType) => void;
  bodyRaw: string;
  onBodyRawChange: (raw: string) => void;
  bodyFormItems: KeyValueItem[];
  onBodyFormItemsChange: (items: KeyValueItem[]) => void;
  /** 当前激活的 tab key */
  activeTab: string;
  onActiveTabChange: (key: string) => void;
}

/**
 * 请求配置区 — Params / Headers / Body 标签页
 */
export const RequestConfig: React.FC<RequestConfigProps> = ({
  params, onParamsChange,
  headers, onHeadersChange,
  bodyType, onBodyTypeChange,
  bodyRaw, onBodyRawChange,
  bodyFormItems, onBodyFormItemsChange,
  activeTab, onActiveTabChange,
}) => {
  /** Body 标签页内容 */
  const renderBodyContent = () => (
    <div className="flex flex-col gap-2">
      {/* Body 类型选择 */}
      <Radio.Group
        value={bodyType}
        onChange={(e) => onBodyTypeChange(e.target.value)}
        className="text-sm"
        optionType="button"
        buttonStyle="solid"
      >
        {Object.entries(BODY_TYPE_LABELS).map(([key, label]) => (
          <Radio.Button key={key} value={key} className="text-[13px]">{label}</Radio.Button>
        ))}
      </Radio.Group>

      {/* Body 内容 */}
      {bodyType === 'none' ? (
        <div className="py-4 text-center text-sm text-gray-400">
          This request does not have a body
        </div>
      ) : bodyType === 'form-urlencoded' || bodyType === 'form-data' ? (
        <KeyValueEditor
          items={bodyFormItems}
          onChange={onBodyFormItemsChange}
          keyPlaceholder="Key"
          valuePlaceholder="Value"
          showDescription
        />
      ) : (
        <Input.TextArea
          value={bodyRaw}
          onChange={(e) => onBodyRawChange(e.target.value)}
          placeholder={
            bodyType === 'raw-json' ? '{\n  "key": "value"\n}'
              : bodyType === 'raw-xml' ? '<?xml version="1.0"?>\n<root></root>'
                : 'Enter request body...'
          }
          autoSize={{ minRows: 6, maxRows: 20 }}
          className="text-sm font-mono leading-6"
          style={{ resize: 'none' }}
        />
      )}
    </div>
  );

  const tabItems = [
    {
      key: 'params',
      label: <span className="text-sm">Params {params.filter((p) => p.enabled && p.key).length > 0 ? `(${params.filter((p) => p.enabled && p.key).length})` : ''}</span>,
      children: (
        <KeyValueEditor
          items={params}
          onChange={onParamsChange}
          keyPlaceholder="Parameter"
          valuePlaceholder="Value"
          showDescription
        />
      ),
    },
    {
      key: 'headers',
      label: <span className="text-sm">Headers {headers.filter((h) => h.enabled && h.key).length > 0 ? `(${headers.filter((h) => h.enabled && h.key).length})` : ''}</span>,
      children: (
        <KeyValueEditor
          items={headers}
          onChange={onHeadersChange}
          keyPlaceholder="Header Name"
          valuePlaceholder="Header Value"
        />
      ),
    },
    {
      key: 'body',
      label: <span className="text-sm">Body</span>,
      children: renderBodyContent(),
    },
  ];

  return (
    <Tabs
      activeKey={activeTab}
      onChange={onActiveTabChange}
      items={tabItems}
      className="api-tester-tabs px-2"
    />
  );
};

