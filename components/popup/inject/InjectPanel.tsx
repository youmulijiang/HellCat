import React, { useState } from 'react';
import { Tabs } from 'antd';
import {
  CodeOutlined,
  FormOutlined,
  FunctionOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useInject } from '@/hooks/useInject';
import { ScriptInjectTab } from './ScriptInjectTab';
import { TextInjectTab } from './TextInjectTab';
import { VariableInjectTab } from './VariableInjectTab';

export const InjectPanel: React.FC = () => {
  const { t } = useTranslation();
  const {
    scripts, addScript, updateScript, removeScript, toggleScript,
    injectEnabledScripts, injectSingleScript,
    fillText, startRegionSelect, stopRegionSelect,
    variables, addVariable, updateVariable, removeVariable, fillVariables,
  } = useInject();

  const items = [
    {
      key: 'script',
      label: (
        <span className="flex items-center gap-1 text-xs">
          <CodeOutlined /> {t('popup.inject.tabs.script')}
        </span>
      ),
      children: (
        <ScriptInjectTab
          scripts={scripts}
          onAdd={addScript}
          onUpdate={updateScript}
          onRemove={removeScript}
          onToggle={toggleScript}
          onInjectAll={injectEnabledScripts}
          onInjectSingle={injectSingleScript}
        />
      ),
    },
    {
      key: 'text',
      label: (
        <span className="flex items-center gap-1 text-xs">
          <FormOutlined /> {t('popup.inject.tabs.text')}
        </span>
      ),
      children: (
        <TextInjectTab
          onFillText={fillText}
          onStartRegionSelect={startRegionSelect}
          onStopRegionSelect={stopRegionSelect}
        />
      ),
    },
    {
      key: 'variable',
      label: (
        <span className="flex items-center gap-1 text-xs">
          <FunctionOutlined /> {t('popup.inject.tabs.variable')}
        </span>
      ),
      children: (
        <VariableInjectTab
          variables={variables}
          onAdd={addVariable}
          onUpdate={updateVariable}
          onRemove={removeVariable}
          onFillVariables={fillVariables}
        />
      ),
    },
  ];

  const [activeKey, setActiveKey] = useState(() => localStorage.getItem('popup_inject_subtab') || 'script');

  return (
    <div className="flex flex-col h-full py-1">
      <Tabs
        activeKey={activeKey}
        onChange={(k) => { setActiveKey(k); localStorage.setItem('popup_inject_subtab', k); }}
        size="small"
        items={items}
        tabBarStyle={{ marginBottom: 8 }}
      />
    </div>
  );
};

