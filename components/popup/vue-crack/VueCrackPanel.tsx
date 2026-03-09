import React, { useEffect, useState } from 'react';
import { Button, List, Tag, message, Spin, Typography, Space, Tooltip, Empty } from 'antd';
import {
  SearchOutlined,
  CopyOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useVueCrack } from '@/hooks/useVueCrack';

const { Text } = Typography;

export const VueCrackPanel: React.FC = () => {
  const {
    status,
    analysis,
    error,
    detect,
    buildFullUrls,
    copyAllPaths,
    copyAllUrls,
  } = useVueCrack();

  const [fullUrls, setFullUrls] = useState<{ path: string; url: string }[]>([]);

  /** 自动触发检测 */
  useEffect(() => {
    detect();
  }, [detect]);

  /** 分析完成后构建 URL 列表 */
  useEffect(() => {
    if (analysis?.allRoutes?.length) {
      buildFullUrls().then(setFullUrls);
    }
  }, [analysis, buildFullUrls]);

  /** 复制单个 URL */
  const copySingle = async (url: string) => {
    await navigator.clipboard.writeText(url);
    message.success('已复制');
  };

  /** 打开单个 URL */
  const openUrl = async (url: string) => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) browser.tabs.update(tab.id, { url });
  };

  const handleCopyPaths = async () => {
    await copyAllPaths();
    message.success('已复制所有路径');
  };

  const handleCopyUrls = async () => {
    await copyAllUrls();
    message.success('已复制所有URL');
  };

  // ---- 渲染状态 ----

  if (status === 'detecting') {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Spin size="small" />
        <Text className="mt-2 text-[11px]" type="secondary">正在检测 Vue.js ...</Text>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <ExclamationCircleOutlined className="text-red-500 text-lg" />
        <Text type="danger" className="text-[11px]">{error}</Text>
        <Button size="small" icon={<ReloadOutlined />} onClick={detect}>重试</Button>
      </div>
    );
  }

  if (status === 'not-detected') {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <CloseCircleOutlined className="text-red-500 text-lg" />
        <Text type="secondary" className="text-[11px]">未检测到 Vue.js</Text>
        <Button size="small" icon={<ReloadOutlined />} onClick={detect}>重新检测</Button>
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <Button type="primary" size="small" icon={<SearchOutlined />} onClick={detect}>
          检测 Vue
        </Button>
      </div>
    );
  }

  // ---- 检测成功，显示结果 ----

  return (
    <div className="flex flex-col gap-2 py-1 h-full">
      {/* 状态概览 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Tag color="green" className="text-[10px] m-0">
          <CheckCircleOutlined /> Vue {analysis?.vueVersion || ''}
        </Tag>
        {analysis?.routerDetected ? (
          <Tag color="blue" className="text-[10px] m-0">
            <CheckCircleOutlined /> Router
          </Tag>
        ) : (
          <Tag color="red" className="text-[10px] m-0">
            <CloseCircleOutlined /> 未检测到 Router
          </Tag>
        )}
        {(analysis?.modifiedRoutes?.length ?? 0) > 0 && (
          <Tag color="orange" className="text-[10px] m-0">
            已修改 {analysis!.modifiedRoutes.length} 个 auth
          </Tag>
        )}
        <Tag color="purple" className="text-[10px] m-0">守卫已清除</Tag>
        <Button size="small" type="text" icon={<ReloadOutlined />} onClick={detect} className="ml-auto" />
      </div>

      {/* 操作按钮 */}
      {fullUrls.length > 0 && (
        <Space size={4}>
          <Button size="small" icon={<CopyOutlined />} onClick={handleCopyPaths}>复制路径</Button>
          <Button size="small" icon={<CopyOutlined />} onClick={handleCopyUrls}>复制URL</Button>
        </Space>
      )}

      {/* 路由列表 */}
      {fullUrls.length > 0 ? (
        <List
          size="small"
          dataSource={fullUrls}
          className="flex-1 min-h-0 overflow-y-auto border border-gray-200 rounded"
          renderItem={(item) => (
            <List.Item className="!py-1 !px-2 group" style={{ padding: '4px 8px' }}>
              <div className="flex items-center w-full gap-1 min-w-0">
                <Text className="text-[10px] truncate flex-1 font-mono" title={item.url}>
                  {item.path}
                </Text>
                <Tooltip title="复制URL">
                  <Button
                    type="text" size="small"
                    icon={<CopyOutlined className="text-[10px]" />}
                    className="opacity-0 group-hover:opacity-100 !w-5 !h-5 !min-w-0"
                    onClick={() => copySingle(item.url)}
                  />
                </Tooltip>
                <Tooltip title="打开">
                  <Button
                    type="text" size="small"
                    icon={<LinkOutlined className="text-[10px]" />}
                    className="opacity-0 group-hover:opacity-100 !w-5 !h-5 !min-w-0"
                    onClick={() => openUrl(item.url)}
                  />
                </Tooltip>
              </div>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="没有找到路由" image={Empty.PRESENTED_IMAGE_SIMPLE} className="!my-4" />
      )}
    </div>
  );
};

