/** 信息收集扫描结果中每个条目 */
export interface InfoItem {
  /** 匹配到的内容 */
  value: string;
  /** 来源 URL */
  source: string;
}

/** 扫描结果分类 */
export interface ScanResults {
  domains: InfoItem[];
  absoluteApis: InfoItem[];
  apis: InfoItem[];
  ips: InfoItem[];
  phones: InfoItem[];
  emails: InfoItem[];
  idcards: InfoItem[];
  jwts: InfoItem[];
  credentials: InfoItem[];
  idKeys: InfoItem[];
  urls: InfoItem[];
  jsFiles: InfoItem[];
}

/** 各分类顺序 */
export const SCAN_SECTION_KEYS: (keyof ScanResults)[] = [
  'domains',
  'absoluteApis',
  'apis',
  'ips',
  'phones',
  'emails',
  'idcards',
  'jwts',
  'credentials',
  'idKeys',
  'urls',
  'jsFiles',
];

/** content → popup 扫描更新消息 */
export interface ScanUpdateMessage {
  action: 'infoCollectUpdate';
  results: ScanResults;
  progress: number;
}

/** popup → content 请求结果 */
export interface GetScanResultsRequest {
  action: 'getInfoCollectResults';
}

/** content → background 获取JS文件内容 */
export interface FetchJsRequest {
  action: 'fetchJsContent';
  url: string;
}

/** background → content 返回JS文件内容 */
export interface FetchJsResponse {
  content: string | null;
}

/** 创建空结果 */
export function createEmptyScanResults(): ScanResults {
  return {
    domains: [],
    absoluteApis: [],
    apis: [],
    ips: [],
    phones: [],
    emails: [],
    idcards: [],
    jwts: [],
    credentials: [],
    idKeys: [],
    urls: [],
    jsFiles: [],
  };
}

