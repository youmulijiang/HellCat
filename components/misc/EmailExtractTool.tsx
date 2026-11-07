import React, { useState, useCallback, useMemo } from 'react';
import { Input, Button, Switch, message, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { CopyOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { TextArea } = Input;

/**
 * Email 提取工具
 * 从文本中提取邮箱地址，支持去重和排序
 */
export const EmailExtractTool: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [deduplicate, setDeduplicate] = useState(true);
  const [sortOutput, setSortOutput] = useState(true);
  const [lowerCase, setLowerCase] = useState(true);
  const [output, setOutput] = useState('');

  const handleExtract = useCallback(() => {
    if (!input.trim()) {
      message.warning(t('devtools.misc.email.inputRequired'));
      return;
    }
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,63}/g;
    const matches = input.match(emailRegex) || [];

    let results = lowerCase ? matches.map((e) => e.toLowerCase()) : [...matches];

    if (deduplicate) {
      results = [...new Set(results)];
    }
    if (sortOutput) {
      results.sort((a, b) => a.localeCompare(b));
    }

    if (results.length === 0) {
      message.warning(t('devtools.misc.email.noResults'));
    }
    setOutput(results.join('\n'));
  }, [input, deduplicate, sortOutput, lowerCase, t]);

  const count = useMemo(() => {
    if (!output) return 0;
    return output.split('\n').filter((l) => l.trim()).length;
  }, [output]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => message.success(t('common.feedback.copySuccess')));
  }, [output, t]);

  return (
    <div className="flex flex-col h-full gap-2 p-3">
      <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
        <div className="flex items-center gap-1">
          <Switch size="small" checked={lowerCase} onChange={setLowerCase} />
          {t('devtools.misc.email.lowerCase')}
        </div>
        <div className="flex items-center gap-1">
          <Switch size="small" checked={deduplicate} onChange={setDeduplicate} />
          {t('devtools.misc.email.deduplicate')}
        </div>
        <div className="flex items-center gap-1">
          <Switch size="small" checked={sortOutput} onChange={setSortOutput} />
          {t('devtools.misc.email.sort')}
        </div>
        <div className="flex-1" />
        <Space size={4}>
          <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={handleExtract}>{t('common.actions.extract')}</Button>
          <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={!output}>{t('common.actions.copy')}</Button>
          <Button size="small" icon={<DeleteOutlined />} onClick={() => { setInput(''); setOutput(''); }}>{t('common.actions.clear')}</Button>
        </Space>
      </div>

      {output && (
        <div className="text-[10px] text-gray-400">
          {t('devtools.misc.email.countLabel', { count })}
        </div>
      )}

      <div className="flex flex-1 gap-2 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[10px] font-bold text-gray-500 mb-1">{t('devtools.misc.email.inputLabel')}</div>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('devtools.misc.email.inputPlaceholder')}
            className="flex-1 resize-none font-mono text-xs"
          />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[10px] font-bold text-gray-500 mb-1">{t('devtools.misc.email.outputLabel')}</div>
          <TextArea
            value={output}
            readOnly
            placeholder={t('devtools.misc.email.outputPlaceholder')}
            className="flex-1 resize-none font-mono text-xs bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
};
