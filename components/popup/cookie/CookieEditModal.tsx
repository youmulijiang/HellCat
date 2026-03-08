import React, { useEffect } from 'react';
import { Modal, Form, Input, Switch, Select, InputNumber } from 'antd';
import type { CookieItem } from '@/hooks/useCookies';

interface CookieEditModalProps {
  open: boolean;
  cookie: CookieItem | null;
  onSave: (cookie: Omit<CookieItem, 'key'>) => void;
  onCancel: () => void;
  currentDomain: string;
}

const SAME_SITE_OPTIONS = [
  { label: 'Unspecified', value: 'unspecified' },
  { label: 'Lax', value: 'lax' },
  { label: 'Strict', value: 'strict' },
  { label: 'None', value: 'no_restriction' },
];

export const CookieEditModal: React.FC<CookieEditModalProps> = ({
  open,
  cookie,
  onSave,
  onCancel,
  currentDomain,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!cookie;

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
      title={isEdit ? '编辑 Cookie' : '添加 Cookie'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={380}
      okText="保存"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" size="small" className="mt-3">
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="cookie name" />
        </Form.Item>
        <Form.Item name="value" label="值" rules={[{ required: true, message: '请输入值' }]}>
          <Input.TextArea placeholder="cookie value" rows={2} />
        </Form.Item>
        <div className="flex gap-2">
          <Form.Item name="domain" label="域名" className="flex-1" rules={[{ required: true }]}>
            <Input placeholder=".example.com" />
          </Form.Item>
          <Form.Item name="path" label="路径" className="flex-1" rules={[{ required: true }]}>
            <Input placeholder="/" />
          </Form.Item>
        </div>
        <div className="flex gap-2">
          <Form.Item name="sameSite" label="SameSite" className="flex-1">
            <Select options={SAME_SITE_OPTIONS} />
          </Form.Item>
          <Form.Item name="expirationDate" label="过期时间(时间戳)" className="flex-1">
            <InputNumber className="w-full" placeholder="留空=会话" />
          </Form.Item>
        </div>
        <div className="flex gap-4">
          <Form.Item name="secure" label="Secure" valuePropName="checked">
            <Switch size="small" />
          </Form.Item>
          <Form.Item name="httpOnly" label="HttpOnly" valuePropName="checked">
            <Switch size="small" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

