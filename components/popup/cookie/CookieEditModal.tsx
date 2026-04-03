import React, { useEffect } from 'react';
import { Modal, Form, Input, Switch, Select, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import type { CookieItem } from '@/hooks/useCookies';

interface CookieEditModalProps {
  open: boolean;
  cookie: CookieItem | null;
  onSave: (cookie: Omit<CookieItem, 'key'>) => void;
  onCancel: () => void;
  currentDomain: string;
}

export const CookieEditModal: React.FC<CookieEditModalProps> = ({
  open,
  cookie,
  onSave,
  onCancel,
  currentDomain,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isEdit = !!cookie;

  const sameSiteOptions = [
    { label: t('popup.cookie.sameSite.unspecified'), value: 'unspecified' },
    { label: t('popup.cookie.sameSite.lax'), value: 'lax' },
    { label: t('popup.cookie.sameSite.strict'), value: 'strict' },
    { label: t('popup.cookie.sameSite.none'), value: 'no_restriction' },
  ];

  useEffect(() => {
    if (open) {
      if (cookie) {
        form.setFieldsValue({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          sameSite: cookie.sameSite,
          expirationDate: cookie.expirationDate
            ? Math.floor(cookie.expirationDate)
            : undefined,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          domain: currentDomain,
          path: '/',
          secure: false,
          httpOnly: false,
          sameSite: 'lax',
        });
      }
    }
  }, [open, cookie, form, currentDomain]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSave({
      name: values.name,
      value: values.value,
      domain: values.domain,
      path: values.path,
      secure: values.secure,
      httpOnly: values.httpOnly,
      sameSite: values.sameSite,
      expirationDate: values.expirationDate || undefined,
    });
  };

  return (
    <Modal
      title={isEdit ? t('popup.cookie.modal.editTitle') : t('popup.cookie.modal.addTitle')}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={380}
      okText={t('common.actions.save')}
      cancelText={t('common.actions.cancel')}
      destroyOnClose
    >
      <Form form={form} layout="vertical" size="small" className="mt-3">
        <Form.Item name="name" label={t('common.fields.name')} rules={[{ required: true, message: t('popup.cookie.validation.nameRequired') }]}>
          <Input placeholder={t('popup.cookie.modal.namePlaceholder')} />
        </Form.Item>
        <Form.Item name="value" label={t('common.fields.value')} rules={[{ required: true, message: t('popup.cookie.validation.valueRequired') }]}>
          <Input.TextArea placeholder={t('popup.cookie.modal.valuePlaceholder')} rows={2} />
        </Form.Item>
        <div className="flex gap-2">
          <Form.Item name="domain" label={t('common.fields.domain')} className="flex-1" rules={[{ required: true, message: t('popup.cookie.validation.domainRequired') }]}>
            <Input placeholder=".example.com" />
          </Form.Item>
          <Form.Item name="path" label={t('common.fields.path')} className="flex-1" rules={[{ required: true, message: t('popup.cookie.validation.pathRequired') }]}>
            <Input placeholder="/" />
          </Form.Item>
        </div>
        <div className="flex gap-2">
          <Form.Item name="sameSite" label={t('common.fields.sameSite')} className="flex-1">
            <Select options={sameSiteOptions} />
          </Form.Item>
          <Form.Item name="expirationDate" label={t('common.fields.expirationDate')} className="flex-1">
            <InputNumber className="w-full" placeholder={t('popup.cookie.modal.expirationPlaceholder')} />
          </Form.Item>
        </div>
        <div className="flex gap-4">
          <Form.Item name="secure" label={t('common.fields.secure')} valuePropName="checked">
            <Switch size="small" />
          </Form.Item>
          <Form.Item name="httpOnly" label={t('common.fields.httpOnly')} valuePropName="checked">
            <Switch size="small" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

