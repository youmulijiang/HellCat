import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input, Select, Button, message, Divider, Tooltip } from 'antd';
import {
  SendOutlined,
  HistoryOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { HttpMethod } from '@/types/packet';
import type { BackgroundToDevToolsMessage } from '@/types/messaging';
import type { KeyValueItem } from './KeyValueEditor';
import { genKvId } from './KeyValueEditor';
import type { BodyType } from './RequestConfig';
import { RequestConfig } from './RequestConfig';
import type { ApiResponse } from './ResponseViewer';
import { ResponseViewer } from './ResponseViewer';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

const METHOD_COLORS: Record<string, string> = {
  GET: '#52c41a', POST: '#faad14', PUT: '#1890ff',
  DELETE: '#ff4d4f', PATCH: '#722ed1', HEAD: '#13c2c2', OPTIONS: '#8c8c8c',
};

/** 历史记录条目 */
interface HistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  status?: number;
  duration?: number;
  timestamp: number;
}

const DEFAULT_PARAMS: KeyValueItem[] = [{ id: genKvId(), enabled: true, key: '', value: '', description: '' }];
const DEFAULT_HEADERS: KeyValueItem[] = [
  { id: genKvId(), enabled: true, key: 'User-Agent', value: 'Hellcat/1.0', description: '' },
  { id: genKvId(), enabled: true, key: 'Accept', value: '*/*', description: '' },
  { id: genKvId(), enabled: true, key: '', value: '', description: '' },
];

/**
 * API 测试模块主布局
 */
export const ApiTesterLayout: React.FC = () => {
  // 请求配置状态
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('');
  const [params, setParams] = useState<KeyValueItem[]>(DEFAULT_PARAMS);
  const [headers, setHeaders] = useState<KeyValueItem[]>(DEFAULT_HEADERS);
  const [bodyType, setBodyType] = useState<BodyType>('none');
  const [bodyRaw, setBodyRaw] = useState('');
  const [bodyFormItems, setBodyFormItems] = useState<KeyValueItem[]>([{ id: genKvId(), enabled: true, key: '', value: '' }]);
  const [configTab, setConfigTab] = useState('params');

  // 响应状态
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 历史记录
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Background port
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const pendingIdRef = useRef<string | null>(null);

  // 建立与 background 的长连接
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.connect) return;
    const port = chrome.runtime.connect({ name: 'hellcat-devtools' });
    portRef.current = port;

    port.onMessage.addListener((msg: BackgroundToDevToolsMessage) => {
      if (msg.type === 'SEND_RESPONSE' && msg.packetId === pendingIdRef.current) {
        setResponse({
          status: msg.status,
          statusText: msg.statusText,
          headers: msg.headers,
          body: msg.body,
          duration: msg.duration,
          size: msg.body.length,
        });
        setLoading(false);
        setError(null);
        // 更新历史记录状态
        setHistory((prev) => prev.map((h) =>
          h.id === msg.packetId ? { ...h, status: msg.status, duration: msg.duration } : h
        ));
      } else if (msg.type === 'SEND_ERROR' && msg.packetId === pendingIdRef.current) {
        setError(msg.error);
        setLoading(false);
      }
    });

    port.onDisconnect.addListener(() => { portRef.current = null; });
    return () => { try { port.disconnect(); } catch { /* ignore */ } };
  }, []);

  /** 构建最终 URL（合并 params） */
  const buildFinalUrl = useCallback(() => {
    let finalUrl = url.trim();
    if (!finalUrl) return '';
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `http://${finalUrl}`;
    try {
      const urlObj = new URL(finalUrl);
      params.filter((p) => p.enabled && p.key).forEach((p) => urlObj.searchParams.set(p.key, p.value));
      return urlObj.toString();
    } catch {
      return finalUrl;
    }
  }, [url, params]);

  /** 构建请求体 */
  const buildBody = useCallback((): string | undefined => {
    if (['GET', 'HEAD'].includes(method)) return undefined;
    if (bodyType === 'none') return undefined;
    if (bodyType === 'form-urlencoded') {
      const sp = new URLSearchParams();
      bodyFormItems.filter((i) => i.enabled && i.key).forEach((i) => sp.set(i.key, i.value));
      return sp.toString();
    }
    if (bodyType === 'form-data') {
      // 简化处理：转为 JSON 传输
      const obj: Record<string, string> = {};
      bodyFormItems.filter((i) => i.enabled && i.key).forEach((i) => { obj[i.key] = i.value; });
      return JSON.stringify(obj);
    }
    return bodyRaw || undefined;
  }, [method, bodyType, bodyFormItems, bodyRaw]);

  /** 构建 headers */
  const buildHeaders = useCallback(() => {
    const result = headers.filter((h) => h.enabled && h.key).map((h) => ({ name: h.key, value: h.value }));
    // 自动添加 Content-Type
    if (!['GET', 'HEAD'].includes(method) && bodyType !== 'none') {
      const hasContentType = result.some((h) => h.name.toLowerCase() === 'content-type');
      if (!hasContentType) {
        if (bodyType === 'form-urlencoded') result.push({ name: 'Content-Type', value: 'application/x-www-form-urlencoded' });
        else if (bodyType === 'raw-json') result.push({ name: 'Content-Type', value: 'application/json' });
        else if (bodyType === 'raw-xml') result.push({ name: 'Content-Type', value: 'application/xml' });
        else if (bodyType === 'raw-text') result.push({ name: 'Content-Type', value: 'text/plain' });
      }
    }
    return result;
  }, [headers, method, bodyType]);

  /** 发送请求 */
  const handleSend = useCallback(() => {
    const finalUrl = buildFinalUrl();
    if (!finalUrl) { message.warning('请输入 URL'); return; }
    if (!portRef.current) { message.error('未连接到 Background，请检查扩展状态'); return; }

    const packetId = `api_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    pendingIdRef.current = packetId;
    setLoading(true);
    setError(null);
    setResponse(null);

    // 添加到历史
    setHistory((prev) => [{
      id: packetId, method, url: finalUrl, timestamp: Date.now(),
    }, ...prev].slice(0, 50));

    portRef.current.postMessage({
      type: 'SEND_REQUEST',
      packetId,
      method,
      url: finalUrl,
      headers: buildHeaders(),
      body: buildBody(),
    });
  }, [buildFinalUrl, buildHeaders, buildBody, method]);

  /** 从历史加载 */
  const loadFromHistory = useCallback((entry: HistoryEntry) => {
    try {
      const urlObj = new URL(entry.url);
      setUrl(`${urlObj.origin}${urlObj.pathname}`);
      setMethod(entry.method);
      const qParams: KeyValueItem[] = [];
      urlObj.searchParams.forEach((v, k) => qParams.push({ id: genKvId(), enabled: true, key: k, value: v }));
      if (qParams.length === 0) qParams.push({ id: genKvId(), enabled: true, key: '', value: '' });
      setParams(qParams);
    } catch {
      setUrl(entry.url);
      setMethod(entry.method);
    }
    setShowHistory(false);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50 shrink-0">
        <span className="text-xs font-bold text-gray-600 tracking-wide">API TESTER</span>
        <Tooltip title={showHistory ? '隐藏历史' : '显示历史'}>
          <Button type="text" size="small" icon={<HistoryOutlined />} onClick={() => setShowHistory(!showHistory)}
            className={showHistory ? 'text-blue-500' : 'text-gray-400'} />
        </Tooltip>
      </div>

      {/* URL 输入栏 */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-200 shrink-0">
        <Select
          size="small"
          value={method}
          onChange={setMethod}
          className="w-[110px] shrink-0"
          popupMatchSelectWidth={false}
          options={HTTP_METHODS.map((m) => ({
            label: <span style={{ color: METHOD_COLORS[m], fontWeight: 700, fontSize: 11 }}>{m}</span>,
            value: m,
          }))}
        />
        <Input
          size="small"
          placeholder="Enter URL or paste cURL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPressEnter={handleSend}
          className="flex-1 text-xs font-mono"
        />
        <Button
          type="primary"
          size="small"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
        >
          Send
        </Button>
      </div>

      {/* 主体区域 */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* 左侧：历史记录面板 */}
        {showHistory && (
          <div className="w-48 shrink-0 border-r border-gray-200 overflow-y-auto bg-gray-50">
            <div className="flex items-center justify-between px-2 py-1 border-b border-gray-200">
              <span className="text-[10px] font-bold text-gray-500">HISTORY</span>
              <Button type="text" size="small" icon={<DeleteOutlined />}
                onClick={() => setHistory([])} className="text-gray-400 text-[10px]" />
            </div>
            {history.length === 0 ? (
              <div className="text-[10px] text-gray-400 text-center py-4">暂无历史</div>
            ) : history.map((entry) => (
              <div key={entry.id}
                className="px-2 py-1.5 border-b border-gray-100 cursor-pointer hover:bg-blue-50 text-[10px]"
                onClick={() => loadFromHistory(entry)}
              >
                <div className="flex items-center gap-1">
                  <span style={{ color: METHOD_COLORS[entry.method], fontWeight: 700 }}>{entry.method}</span>
                  {entry.status && <span className="text-gray-500">{entry.status}</span>}
                  {entry.duration != null && <span className="text-gray-400">{entry.duration}ms</span>}
                </div>
                <div className="text-gray-500 truncate mt-0.5">{entry.url}</div>
              </div>
            ))}
          </div>
        )}

        {/* 中间 + 右侧：请求配置 & 响应 */}
        <div className="flex flex-1 min-w-0 overflow-hidden">
          {/* 请求配置 */}
          <div className="flex-1 min-w-0 overflow-auto border-r border-gray-200">
            <RequestConfig
              params={params} onParamsChange={setParams}
              headers={headers} onHeadersChange={setHeaders}
              bodyType={bodyType} onBodyTypeChange={setBodyType}
              bodyRaw={bodyRaw} onBodyRawChange={setBodyRaw}
              bodyFormItems={bodyFormItems} onBodyFormItemsChange={setBodyFormItems}
              activeTab={configTab} onActiveTabChange={setConfigTab}
            />
          </div>

          {/* 分隔线 */}
          <Divider type="vertical" className="h-full m-0" style={{ height: '100%' }} />

          {/* 响应区 */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <ResponseViewer response={response} loading={loading} error={error} />
          </div>
        </div>
      </div>
    </div>
  );
};
