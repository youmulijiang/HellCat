import React, { useState } from 'react';
import { Button, Tag, Tooltip, Popconfirm, Radio, Space, Empty } from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined,
  GlobalOutlined, StopOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import { useProxy } from '@/hooks/useProxy';
import { ProxyEditModal } from './ProxyEditModal';
import { BypassListModal } from './BypassListModal';
import type { ProxyProfile, ProxyScheme } from '@/types/proxy';

export const ProxyPanel: React.FC = () => {
  const {
    profiles, globalSettings,
    addProfile, updateProfile, removeProfile,
    activateProfile, disconnect, switchMode,
    updateBypassList,
  } = useProxy();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ProxyProfile | null>(null);
  const [bypassModalOpen, setBypassModalOpen] = useState(false);
  const [bypassProfile, setBypassProfile] = useState<ProxyProfile | null>(null);

  const handleAdd = () => { setEditingProfile(null); setEditModalOpen(true); };
  const handleEdit = (p: ProxyProfile) => { setEditingProfile(p); setEditModalOpen(true); };

  const handleEditOk = async (data: {
    name: string; scheme: ProxyScheme; host: string; port: number;
    username?: string; password?: string;
  }) => {
    if (editingProfile) {
      await updateProfile(editingProfile.id, {
        name: data.name,
        server: { scheme: data.scheme, host: data.host, port: data.port,
          username: data.username, password: data.password },
      });
    } else {
      await addProfile(data);
    }
    setEditModalOpen(false);
  };

  const handleBypass = (p: ProxyProfile) => {
    setBypassProfile(p);
    setBypassModalOpen(true);
  };

  const handleBypassOk = async (list: string[]) => {
    if (bypassProfile) {
      await updateBypassList(bypassProfile.id, list);
    }
    setBypassModalOpen(false);
  };

  const isActive = (id: string) =>
    globalSettings.mode === 'fixed_servers' && globalSettings.activeProfileId === id;

  const schemeColor: Record<ProxyScheme, string> = {
    http: 'blue', https: 'green', socks4: 'orange', socks5: 'purple',
  };

  return (
    <div className="flex flex-col gap-2 py-1 h-full">
      {/* 全局模式 */}
      <div className="flex items-center justify-between px-1">
        <Radio.Group
          size="small"
          value={globalSettings.mode === 'fixed_servers' ? 'fixed_servers' : globalSettings.mode}
          onChange={e => {
            const m = e.target.value;
            if (m === 'direct' || m === 'system') switchMode(m, null);
          }}
        >
          <Radio.Button value="direct">
            <StopOutlined className="mr-1" />直连
          </Radio.Button>
          <Radio.Button value="system">
            <GlobalOutlined className="mr-1" />系统
          </Radio.Button>
        </Radio.Group>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加代理
        </Button>
      </div>

      {/* 当前状态 */}
      <div className="px-1 text-[10px] text-gray-500 flex items-center gap-1">
        当前模式：
        <Tag color={globalSettings.mode === 'direct' ? 'default' :
          globalSettings.mode === 'fixed_servers' ? 'processing' : 'warning'}
          className="text-[10px]">
          {globalSettings.mode === 'direct' ? '直连' :
           globalSettings.mode === 'system' ? '系统代理' :
           globalSettings.mode === 'fixed_servers' ? '代理中' : globalSettings.mode}
        </Tag>
        {globalSettings.mode === 'fixed_servers' && globalSettings.activeProfileId && (
          <span className="text-blue-500">
            {profiles.find(p => p.id === globalSettings.activeProfileId)?.name}
          </span>
        )}
      </div>

      {/* 代理列表 */}
      <div className="flex-1 overflow-y-auto px-1 space-y-1">
        {profiles.length === 0 ? (
          <Empty description="暂无代理配置" image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="mt-4" />
        ) : (
          profiles.map(p => (
            <div key={p.id}
              className={`flex items-center justify-between p-2 rounded border text-xs
                ${isActive(p.id) ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: p.color }} />
                <span className="font-medium truncate">{p.name}</span>
                <Tag color={schemeColor[p.server.scheme]} className="text-[10px]">
                  {p.server.scheme.toUpperCase()}
                </Tag>
                <span className="text-gray-400 truncate">
                  {p.server.host}:{p.server.port}
                </span>
              </div>
              <Space size={2}>
                {isActive(p.id) ? (
                  <Button size="small" danger type="text" onClick={disconnect}>
                    断开
                  </Button>
                ) : (
                  <Button size="small" type="link" onClick={() => activateProfile(p.id)}>
                    连接
                  </Button>
                )}
                <Tooltip title="绕过列表">
                  <Button size="small" type="text" icon={<UnorderedListOutlined />}
                    onClick={() => handleBypass(p)} />
                </Tooltip>
                <Button size="small" type="text" icon={<EditOutlined />}
                  onClick={() => handleEdit(p)} />
                <Popconfirm title="确定删除？" onConfirm={() => removeProfile(p.id)}
                  okButtonProps={{ size: 'small' }} cancelButtonProps={{ size: 'small' }}>
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            </div>
          ))
        )}
      </div>

      {/* 弹窗 */}
      <ProxyEditModal
        open={editModalOpen}
        editingProfile={editingProfile ? {
          name: editingProfile.name,
          scheme: editingProfile.server.scheme,
          host: editingProfile.server.host,
          port: editingProfile.server.port,
          username: editingProfile.server.username,
          password: editingProfile.server.password,
        } : null}
        onOk={handleEditOk}
        onCancel={() => setEditModalOpen(false)}
      />
      <BypassListModal
        open={bypassModalOpen}
        profileName={bypassProfile?.name ?? ''}
        bypassList={bypassProfile?.bypassList ?? []}
        onOk={handleBypassOk}
        onCancel={() => setBypassModalOpen(false)}
      />
    </div>
  );
};
