import React, { useEffect } from 'react';
import { Modal, Input, Form } from 'antd';
import type { InjectScript } from '@/types/inject';

const { TextArea } = Input;

/** 新建脚本默认代码模板 */
const DEFAULT_CODE_TEMPLATE = `(function() {
  console.log("Hellcat Injected");
}());`;

interface Props {
  open: boolean;
  script: InjectScript | null;
  onSave: (name: string, code: string) => void | Promise<void>;
  confirmLoading?: boolean;
  onCancel: () => void;
}

export const ScriptEditModal: React.FC<Props> = ({
  open, script, onSave, confirmLoading = false, onCancel,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: script?.name || '',
        code: script?.code || (script ? '' : DEFAULT_CODE_TEMPLATE),
      });
    }
  }, [open, script, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSave(values.name, values.code);
    form.resetFields();
  };

  return (
    <Modal
      title={script ? '编辑脚本' : '添加脚本'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText="保存"
      cancelText="取消"
      width={400}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-3">
        <Form.Item name="name" label="脚本名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="如：自动填充登录表单" size="small" />
        </Form.Item>
        <Form.Item name="code" label="JS代码" rules={[{ required: true, message: '请输入代码' }]}>
          <TextArea
            rows={10}
            placeholder="// 输入你的JavaScript代码..."
            className="font-mono text-xs"
            spellCheck={false}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

