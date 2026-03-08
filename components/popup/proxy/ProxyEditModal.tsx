import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber } from 'antd';
import type { ProxyScheme } from '@/types/proxy';
import { DEFAULT_PORTS } from '@/types/proxy';

interface ProxyEditModalProps {
  open: boolean;
  editingProfile?: {
    name: string;
    scheme: ProxyScheme;
    host: string;
    port: number;
    username?: string;
    password?: string;
  } | null;
  onOk: (data: {
    name: string; scheme: ProxyScheme; host: string; port: number;
    username?: string; password?: string;
  }) => void;
  onCancel: () => void;
}

export const ProxyEditModal: React.FC<ProxyEditModalProps> = ({
  open, editingProfile, onOk, onCancel,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (editingProfile) {
        form.setFieldsValue(editingProfile);
      } else {
        form.resetFields();
        form.setFieldsValue({ scheme: 'http', port: 80 });
      }
    }
  }, [open, editingProfile, form]);

  const handleSchemeChange = (scheme: ProxyScheme) => {
    const currentPort = form.getFieldValue('port');
    const defaults = Object.values(DEFAULT_PORTS);
    if (!currentPort || defaults.includes(currentPort)) {
      form.setFieldValue('port', DEFAULT_PORTS[scheme]);
    }
  };

  return (
    <Modal
      title={editingProfile ? '编辑代理' : '添加代理'}
      open={open}
      onOk={() => form.validateFields().then(onOk)}
      onCancel={onCancel}
      width={360}
      destroyOnClose
    >
      <Form form={form} layout="vertical" size="small" className="mt-3">
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="My Proxy" />
        </Form.Item>
        <div className="flex gap-2">
          <Form.Item name="scheme" label="协议" className="w-28"
            rules={[{ required: true }]}>
            <Select onChange={handleSchemeChange}
              options={[
                { label: 'HTTP', value: 'http' },
                { label: 'HTTPS', value: 'https' },
                { label: 'SOCKS4', value: 'socks4' },
                { label: 'SOCKS5', value: 'socks5' },
              ]}
            />
          </Form.Item>
          <Form.Item name="host" label="主机" className="flex-1"
            rules={[{ required: true, message: '请输入主机地址' }]}>
            <Input placeholder="127.0.0.1" />
          </Form.Item>
          <Form.Item name="port" label="端口" className="w-20"
            rules={[{ required: true, message: '端口' }]}>
            <InputNumber min={1} max={65535} className="w-full" />
          </Form.Item>
        </div>
        <div className="flex gap-2">
          <Form.Item name="username" label="用户名（可选）" className="flex-1">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item name="password" label="密码（可选）" className="flex-1">
            <Input.Password placeholder="可选" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

