import React, { useState } from 'react';
import { Button, Input, Switch, Tooltip, message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  FormOutlined,
  SelectOutlined,
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
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [partialMode, setPartialMode] = useState(false);

  const handleBatchFill = async () => {
    if (!text.trim()) {
      message.warning(t('popup.inject.text.messages.inputRequired'));
      return;
    }
    await onFillText(text);
    message.success(t('popup.inject.text.messages.filled'));
  };

  const handleTogglePartial = async (checked: boolean) => {
    if (checked && !text.trim()) {
      message.warning(t('popup.inject.text.messages.inputFirst'));
      return;
    }
    setPartialMode(checked);
    if (checked) {
      await onStartRegionSelect(text);
      message.info(t('popup.inject.text.messages.selectionStarted'));
    } else {
      await onStopRegionSelect();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 填充文本输入 */}
      <div className="flex flex-col gap-1">
        <span className="text-sm text-gray-500">{t('common.fields.text')}</span>
        <TextArea
          rows={4}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('popup.inject.text.placeholder')}
          className="text-sm leading-6"
          spellCheck={false}
        />
      </div>

      {/* 模式切换 */}
      <div className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-2 py-2">
        <div className="flex items-center gap-2">
          <SelectOutlined className="text-blue-500" />
          <span className="text-sm">{t('popup.inject.text.partialMode')}</span>
        </div>
        <Switch
          checked={partialMode}
          onChange={handleTogglePartial}
        />
      </div>

      {partialMode && (
        <div className="px-2 text-xs leading-5 text-orange-500">
          {t('popup.inject.text.partialModeNotice')}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        <Tooltip title={t('popup.inject.text.tooltips.fillAll')}>
          <Button
            type="primary"
            icon={<FormOutlined />}
            onClick={handleBatchFill}
            disabled={partialMode}
            block
          >
            {t('common.actions.fill')}
          </Button>
        </Tooltip>
      </div>

      {/* 提示说明 */}
      <div className="px-1 text-xs leading-5 text-gray-400">
        <p>• <strong>{t('popup.inject.text.help.batchFillTitle')}</strong>：{t('popup.inject.text.help.batchFillDescription')}</p>
        <p>• <strong>{t('popup.inject.text.help.partialFillTitle')}</strong>：{t('popup.inject.text.help.partialFillDescription')}</p>
        <p>• {t('popup.inject.text.help.supportedElements')}</p>
      </div>
    </div>
  );
};

