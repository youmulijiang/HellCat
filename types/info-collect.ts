/** 信息收集扫描结果中每个条目 */
export interface InfoItem {
  /** 匹配到的内容 */
  value: string;
  /** 来源 URL */
  source: string;
}

/**
 * 扫描结果分类
 * 分类与过滤器移植自 SnowEyes：domains/urls/githubUrls/cookies/companies 等
 * 为 SnowEyes 同名分类；jsFiles/vueFiles/imageFiles/docFiles/moduleFiles
 * 由 API 过滤器自动归类。
 */
export interface ScanResults {
  domains: InfoItem[];
  absoluteApis: InfoItem[];
  apis: InfoItem[];
  ips: InfoItem[];
  phones: InfoItem[];
  emails: InfoItem[];
  idcards: InfoItem[];
  jwts: InfoItem[];
  /** Cookie / 会话凭证 */
  cookies: InfoItem[];
  credentials: InfoItem[];
  idKeys: InfoItem[];
  /** 中文公司名 */
  companies: InfoItem[];
  urls: InfoItem[];
  /** GitHub 仓库 / 代码链接 */
  githubUrls: InfoItem[];
  jsFiles: InfoItem[];
  /** .vue 文件引用 */
  vueFiles: InfoItem[];
  /** 图片 / 媒体文件引用 */
  imageFiles: InfoItem[];
  /** 文档 / 安装包文件引用 */
  docFiles: InfoItem[];
  /** ./ 相对模块引用 */
  moduleFiles: InfoItem[];
}

/** 各分类顺序（决定 popup 展示顺序） */
export const SCAN_SECTION_KEYS: (keyof ScanResults)[] = [
  'domains',
  'absoluteApis',
  'apis',
  'ips',
  'phones',
  'emails',
  'idcards',
  'jwts',
  'cookies',
  'credentials',
  'idKeys',
  'companies',
  'urls',
  'githubUrls',
  'jsFiles',
  'vueFiles',
  'imageFiles',
  'docFiles',
  'moduleFiles',
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
    cookies: [],
    credentials: [],
    idKeys: [],
    companies: [],
    urls: [],
    githubUrls: [],
    jsFiles: [],
    vueFiles: [],
    imageFiles: [],
    docFiles: [],
    moduleFiles: [],
  };
}
