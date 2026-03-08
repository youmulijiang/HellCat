import React from 'react';
import { Tabs } from 'antd';
import {
  CodeOutlined,
  FormOutlined,
  FunctionOutlined,
} from '@ant-design/icons';
import { useInject } from '@/hooks/useInject';
import { ScriptInjectTab } from './ScriptInjectTab';
import { TextInjectTab } from './TextInjectTab';
import { VariableInjectTab } from './VariableInjectTab';

export const InjectPanel: React.FC = () => {
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
          <CodeOutlined /> 脚本注入
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
          <FormOutlined /> 文本注入
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
          <FunctionOutlined /> 变量填充
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

  return (
    <div className="flex flex-col h-full py-1">
      <Tabs
        defaultActiveKey="script"
        size="small"
        items={items}
        tabBarStyle={{ marginBottom: 8 }}
      />
    </div>
  );
};

