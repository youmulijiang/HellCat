import React, { useState } from 'react';
import { Button, Input, Switch, Tooltip, message } from 'antd';
import {
  FormOutlined,
  SelectOutlined,
  SendOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;

interface Props {
  onFillText: (text: string) => Promise<void>;
  onStartRegionSelect: (text: string) => Promise<void>;
  onStopRegionSelect: () => Promise<void>;
}

export const TextInjectTab: React.FC<Props> = ({
  onFillText, onStartRegionSelect, onStopRegionSelect,
}) => {
  const [text, setText] = useState('');
  const [partialMode, setPartialMode] = useState(false);
  const [regionSelecting, setRegionSelecting] = useState(false);

  const handleBatchFill = async () => {
    if (!text.trim()) {
      message.warning('请输入填充文本');
      return;
    }
    await onFillText(text);
    message.success('批量填充完成');
  };

  const handleTogglePartial = async (checked: boolean) => {
    if (checked && !text.trim()) {
      message.warning('请先输入填充文本');
      return;
    }
    setPartialMode(checked);
    if (checked) {
      setRegionSelecting(true);
      await onStartRegionSelect(text);
      message.info('请在页面中拖拽划出矩形区域，双击方框即可填充');
    } else {
      setRegionSelecting(false);
      await onStopRegionSelect();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 填充文本输入 */}
      <div className="flex flex-col gap-1">
        <span className="text-sm text-gray-500">填充文本</span>
        <TextArea
          rows={4}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="输入要填充到表单中的文本内容..."
          className="text-sm leading-6"
          spellCheck={false}
        />
      </div>

      {/* 模式切换 */}
      <div className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-2 py-2">
        <div className="flex items-center gap-2">
          <SelectOutlined className="text-blue-500" />
          <span className="text-sm">局部填充模式</span>
        </div>
        <Switch
          checked={partialMode}
          onChange={handleTogglePartial}
        />
      </div>

      {partialMode && (
        <div className="px-2 text-xs leading-5 text-orange-500">
          ⚠️ 局部填充已开启：在页面中拖拽划出矩形区域，<strong>双击方框</strong>即可填充区域内的表单
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        <Tooltip title="填充所有表单字段">
          <Button
            type="primary"
            icon={<FormOutlined />}
            onClick={handleBatchFill}
            disabled={partialMode}
            block
          >
            批量填充
          </Button>
        </Tooltip>
      </div>

      {/* 提示说明 */}
      <div className="px-1 text-xs leading-5 text-gray-400">
        <p>• <strong>批量填充</strong>：将文本填充到页面所有可见的表单输入框</p>
        <p>• <strong>局部填充</strong>：开启后在页面拖拽划出矩形区域，仅填充区域内的表单</p>
        <p>• 支持 input、textarea、contenteditable 元素</p>
      </div>
    </div>
  );
};

