/** HTTP 请求方法 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'CONNECT';

/** 数据包状态 */
export type PacketStatus = 'pending' | 'completed' | 'error' | 'timeout';

/** HTTP 头部键值对 */
export interface HttpHeader {
  name: string;
  value: string;
}

/** 请求数据 */
export interface RequestData {
  method: HttpMethod;
  url: string;
  httpVersion: string;
  headers: HttpHeader[];
  queryString: HttpHeader[];
  body: string;
  contentType: string;
}

/** 响应数据 */
export interface ResponseData {
  status: number;
  statusText: string;
  httpVersion: string;
  headers: HttpHeader[];
  body: string;
  contentType: string;
  bodySize: number;
}

/** 捕获的数据包 */
export interface CapturedPacket {
  id: string;
  timestamp: number;
  host: string;
  path: string;
  request: RequestData;
  response: ResponseData | null;
  status: PacketStatus;
  duration: number;
  isStarred: boolean;
  isHighlighted: boolean;
  comment: string;
}

/** 内容视图标签类型 - 请求 */
export type RequestViewTab = 'Pretty' | 'Raw' | 'Hex';

/** 内容视图标签类型 - 响应 */
export type ResponseViewTab = 'Pretty' | 'Raw' | 'Hex' | 'Json' | 'Preview';

/** 历史面板过滤类型 */
export type HistoryFilterType = 'All' | 'Starred' | 'Commented' | 'Highlighted';

