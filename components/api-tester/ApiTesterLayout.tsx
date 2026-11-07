import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input, Select, Button, message, Divider, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
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

type RuntimePort = ReturnType<typeof browser.runtime.connect>;

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

const REQUEST_TIMEOUT_MS = 30000;

/** 构造 multipart/form-data 请求体（字段值均为文本） */
function buildMultipartBody(items: KeyValueItem[]): { body: string; contentType: string } {
  const boundary = `----HellcatFormBoundary${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`;
  const parts: string[] = [];
  for (const item of items) {
    if (!item.enabled || !item.key) continue;
    parts.push(
      `--${boundary}\r\nContent-Disposition: form-data; name="${item.key}"\r\n\r\n${item.value}\r\n`,
    );
  }
  parts.push(`--${boundary}--\r\n`);
  return {
    body: parts.join(''),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

/** 将 shell 词法单元切分（支持单引号、双引号与反斜杠转义） */
function tokenizeShell(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let hasToken = false;
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (escaped) {
      current += quote === "'" ? ch : (ch === 'n' ? '\n' : ch);
      escaped = false;
      continue;
    }
    if (ch === '\\' && quote !== "'") {
      escaped = true;
      hasToken = true;
      continue;
    }
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      hasToken = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (hasToken) {
        tokens.push(current);
        current = '';
        hasToken = false;
      }
      continue;
    }
    current += ch;
    hasToken = true;
  }
  if (hasToken) tokens.push(current);
  return tokens;
}

interface ParsedCurl {
  method?: HttpMethod;
  url?: string;
  headers: { name: string; value: string }[];
  body?: string;
}

/** 解析常用 cURL 命令（-X/-H/--data/--data-raw/-u/URL） */
export function parseCurlCommand(input: string): ParsedCurl | null {
  const trimmed = input.trim().replace(/\\\r?\n/g, ' ');
  if (!/^curl\b/i.test(trimmed)) return null;

  const tokens = tokenizeShell(trimmed);
  const parsed: ParsedCurl = { headers: [] };
  const dataParts: string[] = [];

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    const lower = token.toLowerCase();
    if (lower === '-x' || lower === '--request') {
      parsed.method = (tokens[++i] || '').toUpperCase() as HttpMethod;
    } else if (lower === '-h' || lower === '--header') {
      const raw = tokens[++i] || '';
      const colonIdx = raw.indexOf(':');
      if (colonIdx > 0) {
        parsed.headers.push({ name: raw.slice(0, colonIdx).trim(), value: raw.slice(colonIdx + 1).trim() });
      }
    } else if (lower === '-d' || lower === '--data' || lower === '--data-raw' || lower === '--data-ascii') {
      dataParts.push(tokens[++i] || '');
    } else if (lower === '-u' || lower === '--user') {
      const credential = tokens[++i] || '';
      try {
        parsed.headers.push({ name: 'Authorization', value: `Basic ${btoa(credential)}` });
      } catch { /* 非 Latin1 凭据跳过 */ }
    } else if (token === '-' || lower === '--compressed' || lower === '-s' || lower === '--silent'
      || lower === '-k' || lower === '--insecure' || lower === '-l' || lower === '--location') {
      continue;
    } else if (!token.startsWith('-') && !parsed.url) {
      parsed.url = token;
    }
  }

  if (dataParts.length > 0) parsed.body = dataParts.join('&');
  if (parsed.method === undefined && parsed.body !== undefined) parsed.method = 'POST';
  if (!parsed.url) return null;
  return parsed;
}

/**
 * API 测试模块主布局
 */
export const ApiTesterLayout: React.FC = () => {
  const { t } = useTranslation();
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
  const portRef = useRef<RuntimePort | null>(null);
  const pendingIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 建立与 background 的长连接
  useEffect(() => {
    if (typeof browser === 'undefined' || !browser.runtime?.connect) return;
    const port = browser.runtime.connect({ name: 'hellcat-devtools' });
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
    return () => {
      try { port.disconnect(); } catch { /* ignore */ }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
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

  /** 构建请求体；form-data 走真正的 multipart 编码 */
  const buildBody = useCallback((): { body?: string; contentType?: string } => {
    if (['GET', 'HEAD'].includes(method)) return {};
    if (bodyType === 'none') return {};
    if (bodyType === 'form-urlencoded') {
      const sp = new URLSearchParams();
      bodyFormItems.filter((i) => i.enabled && i.key).forEach((i) => sp.set(i.key, i.value));
      return { body: sp.toString() };
    }
    if (bodyType === 'form-data') {
      return buildMultipartBody(bodyFormItems);
    }
    return { body: bodyRaw || undefined };
  }, [method, bodyType, bodyFormItems, bodyRaw]);

  /** 构建 headers（可由请求体注入对应的 Content-Type） */
  const buildHeaders = useCallback((bodyContentType?: string) => {
    const result = headers.filter((h) => h.enabled && h.key).map((h) => ({ name: h.key, value: h.value }));
    // 自动添加 Content-Type
    if (!['GET', 'HEAD'].includes(method) && bodyContentType) {
      const hasContentType = result.some((h) => h.name.toLowerCase() === 'content-type');
      if (!hasContentType) {
        result.push({ name: 'Content-Type', value: bodyContentType });
      }
    }
    return result;
  }, [headers, method]);

  /** 发送请求 */
  const handleSend = useCallback(() => {
    const finalUrl = buildFinalUrl();
    if (!finalUrl) { message.warning(t('devtools.apiTester.messages.urlRequired')); return; }
    if (!portRef.current) { message.error(t('devtools.apiTester.messages.backgroundDisconnected')); return; }

    const packetId = `api_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    pendingIdRef.current = packetId;
    setLoading(true);
    setError(null);
    setResponse(null);

    // 添加到历史
    setHistory((prev) => [{
      id: packetId, method, url: finalUrl, timestamp: Date.now(),
    }, ...prev].slice(0, 50));

    // 超时兜底：Background 可能已被回收或断连
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (pendingIdRef.current !== packetId) return;
      pendingIdRef.current = null;
      setLoading(false);
      setError(t('devtools.apiTester.messages.requestTimeout'));
    }, REQUEST_TIMEOUT_MS);

    const bodyInfo = buildBody();

    portRef.current.postMessage({
      type: 'SEND_REQUEST',
      packetId,
      method,
      url: finalUrl,
      headers: buildHeaders(bodyInfo.contentType),
      body: bodyInfo.body,
    });
  }, [buildFinalUrl, buildHeaders, buildBody, method, t]);

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

  /** 输入内容支持直接粘贴 cURL 命令，自动解析填充 */
  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    if (!/^curl\s/i.test(value.trim())) return;

    const parsed = parseCurlCommand(value);
    if (!parsed) return;

    try {
      const urlObj = new URL(parsed.url!);
      setUrl(`${urlObj.origin}${urlObj.pathname}`);
      const qParams: KeyValueItem[] = [];
      urlObj.searchParams.forEach((v, k) => qParams.push({ id: genKvId(), enabled: true, key: k, value: v }));
      if (qParams.length === 0) qParams.push(DEFAULT_PARAMS[0]);
      setParams(qParams);
    } catch {
      setUrl(parsed.url!);
    }

    if (parsed.method) setMethod(parsed.method);
    if (parsed.headers.length > 0) {
      setHeaders([
        ...parsed.headers.map((h) => ({ id: genKvId(), enabled: true, key: h.name, value: h.value, description: '' })),
        { id: genKvId(), enabled: true, key: '', value: '', description: '' },
      ]);
    }

    if (parsed.body !== undefined) {
      setBodyRaw(parsed.body);
      setBodyType(parsed.body.trim().startsWith('{') ? 'raw-json' : 'raw-text');
      if (parsed.method === 'POST' && parsed.headers.some((h) => h.name.toLowerCase() === 'content-type')) {
        const ct = parsed.headers.find((h) => h.name.toLowerCase() === 'content-type')!.value;
        if (ct.includes('form-urlencoded')) setBodyType('form-urlencoded');
        else if (ct.includes('multipart/form-data')) setBodyType('form-data');
        else if (ct.includes('json')) setBodyType('raw-json');
      }
    }
    message.success(t('devtools.apiTester.messages.curlParsed'));
  }, [t]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 标题栏 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 shrink-0">
        <span className="text-sm font-bold tracking-wide text-gray-600">API TESTER</span>
        <Tooltip title={showHistory ? t('devtools.apiTester.tooltips.hideHistory') : t('devtools.apiTester.tooltips.showHistory')}>
          <Button type="text" icon={<HistoryOutlined />} onClick={() => setShowHistory(!showHistory)}
            className={showHistory ? 'text-blue-500' : 'text-gray-400'} />
        </Tooltip>
      </div>

      {/* URL 输入栏 */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-200 shrink-0">
        <Select
          value={method}
          onChange={setMethod}
          className="w-[110px] shrink-0"
          popupMatchSelectWidth={false}
          options={HTTP_METHODS.map((m) => ({
            label: <span style={{ color: METHOD_COLORS[m], fontWeight: 700, fontSize: 13 }}>{m}</span>,
            value: m,
          }))}
        />
        <Input
          placeholder="Enter URL or paste cURL"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          onPressEnter={handleSend}
          className="flex-1 text-sm font-mono"
        />
        <Button
          type="primary"
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
            <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
              <span className="text-xs font-bold text-gray-500">HISTORY</span>
              <Button type="text" icon={<DeleteOutlined />}
                onClick={() => setHistory([])} className="text-gray-400" />
            </div>
            {history.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">{t('devtools.apiTester.history.empty')}</div>
            ) : history.map((entry) => (
              <div key={entry.id}
                className="cursor-pointer border-b border-gray-100 px-3 py-2 text-xs hover:bg-blue-50"
                onClick={() => loadFromHistory(entry)}
              >
                <div className="flex items-center gap-1.5">
                  <span style={{ color: METHOD_COLORS[entry.method], fontWeight: 700 }}>{entry.method}</span>
                  {entry.status && <span className="text-gray-500">{entry.status}</span>}
                  {entry.duration != null && <span className="text-gray-400">{entry.duration}ms</span>}
                </div>
                <div className="mt-1 truncate text-gray-500">{entry.url}</div>
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
