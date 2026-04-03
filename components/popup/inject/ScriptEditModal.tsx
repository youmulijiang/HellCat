import React, { useEffect } from 'react';
import { Modal, Input, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import type { InjectScript } from '@/types/inject';

const { TextArea } = Input;

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
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const defaultCodeTemplate = t('popup.inject.script.modal.defaultCodeTemplate');

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: script?.name || '',
        code: script?.code || (script ? '' : defaultCodeTemplate),
      });
    }
  }, [defaultCodeTemplate, open, script, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSave(values.name, values.code);
    form.resetFields();
  };

  return (
    <Modal
      title={script ? t('popup.inject.script.modal.editTitle') : t('popup.inject.script.modal.addTitle')}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText={t('common.actions.save')}
      cancelText={t('common.actions.cancel')}
      width={400}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-3">
        <Form.Item
          name="name"
          label={t('common.fields.scriptName')}
          rules={[{ required: true, message: t('popup.inject.script.validation.nameRequired') }]}
        >
          <Input placeholder={t('popup.inject.script.modal.namePlaceholder')} size="small" />
        </Form.Item>
        <Form.Item
          name="code"
          label={t('common.fields.code')}
          rules={[{ required: true, message: t('popup.inject.script.validation.codeRequired') }]}
        >
          <TextArea
            rows={10}
            placeholder={t('popup.inject.script.modal.codePlaceholder')}
            className="font-mono text-xs"
            spellCheck={false}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

