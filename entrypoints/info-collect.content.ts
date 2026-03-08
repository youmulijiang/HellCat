import {
  DOMAIN_PATTERN,
  DOMAIN_RESOURCE_PATTERN,
  API_PATTERN,
  IP_PATTERN,
  IP_RESOURCE_PATTERN,
  PHONE_PATTERN,
  EMAIL_PATTERN,
  IDCARD_PATTERN,
  JWT_PATTERN,
  CREDENTIALS_PATTERNS,
  ID_KEY_PATTERNS,
  SKIP_JS_PATTERNS,
  INVALID_IP_PREFIXES,
  INVALID_DOMAIN_PATTERNS,
  URL_PATTERN,
  JS_FILE_PATTERN,
} from '@/config/info-collect-patterns';
import type { InfoItem, ScanResults } from '@/types/info-collect';
import { createEmptyScanResults } from '@/types/info-collect';

/** 已扫描的JS URL集合 */
const scannedJsUrls = new Set<string>();
/** 扫描结果 */
let scanResults: ScanResults = createEmptyScanResults();
/** 已发现的值去重集合 */
const seenValues: Record<string, Set<string>> = {};
/** JS队列 */
const jsQueue: string[] = [];
/** 正在处理的JS */
const inFlightSet = new Set<string>();
const MAX_CONCURRENT = 8;

function initSeenValues() {
  for (const key of Object.keys(scanResults)) {
    seenValues[key] = new Set<string>();
  }
}

function isThirdPartyLib(url: string): boolean {
  const fileName = url.split('/').pop()?.split('?')[0]?.toLowerCase() || '';
  return SKIP_JS_PATTERNS.some((p) => p.test(fileName));
}

function isValidIp(ip: string): boolean {
  return !INVALID_IP_PREFIXES.some((prefix) => ip.startsWith(prefix));
}

function isValidDomain(domain: string): boolean {
  const cleaned = domain.replace(/^["']|["']$/g, '').replace(/^https?:\/\//, '');
  const hostname = cleaned.split('/')[0].split(':')[0];
  if (hostname === location.hostname) return false;
  if (hostname.length < 4) return false;
  return !INVALID_DOMAIN_PATTERNS.some((p) => p.test(cleaned));
}

function addResult(category: keyof ScanResults, value: string, source: string) {
  const cleaned = value.replace(/^["'\s]+|["'\s]+$/g, '');
  if (!cleaned || cleaned.length < 3) return false;
  if (!seenValues[category]) seenValues[category] = new Set();
  if (seenValues[category].has(cleaned)) return false;
  seenValues[category].add(cleaned);
  scanResults[category].push({ value: cleaned, source });
  return true;
}

function matchPatterns(text: string, isHtml: boolean, sourceUrl: string): boolean {
  let updated = false;

  // 域名
  const domainPat = isHtml ? DOMAIN_PATTERN : DOMAIN_RESOURCE_PATTERN;
  const domainMatches = text.match(domainPat);
  if (domainMatches) {
    for (const m of domainMatches) {
      if (isValidDomain(m) && addResult('domains', m, sourceUrl)) updated = true;
    }
  }

  // API
  const apiMatches = text.match(API_PATTERN);
  if (apiMatches) {
    for (const m of apiMatches) {
      const cleaned = m.replace(/^["']|["']$/g, '');
      if (cleaned.startsWith('/')) {
        if (cleaned.startsWith('//')) {
          if (addResult('absoluteApis', cleaned, sourceUrl)) updated = true;
        } else {
          if (addResult('apis', cleaned, sourceUrl)) updated = true;
        }
      }
    }
  }

  // IP
  const ipPat = isHtml ? IP_PATTERN : IP_RESOURCE_PATTERN;
  const ipMatches = text.match(ipPat);
  if (ipMatches) {
    for (const m of ipMatches) {
      const ip = m.replace(/^["']|["']$/g, '').replace(/^https?:\/\//, '');
      if (isValidIp(ip.split(':')[0].split('/')[0]) && addResult('ips', m, sourceUrl))
        updated = true;
    }
  }

  // 手机号
  const phoneMatches = text.match(PHONE_PATTERN);
  if (phoneMatches) {
    for (const m of phoneMatches) {
      if (addResult('phones', m, sourceUrl)) updated = true;
    }
  }

  // 邮箱
  const emailMatches = text.match(EMAIL_PATTERN);
  if (emailMatches) {
    for (const m of emailMatches) {
      if (!m.includes('@example') && addResult('emails', m, sourceUrl)) updated = true;
    }
  }

  // 身份证
  const idcardMatches = text.match(IDCARD_PATTERN);
  if (idcardMatches) {
    for (const m of idcardMatches) {
      if (addResult('idcards', m, sourceUrl)) updated = true;
    }
  }

  // JWT
  const jwtMatches = text.match(JWT_PATTERN);
  if (jwtMatches) {
    for (const m of jwtMatches) {
      if (addResult('jwts', m, sourceUrl)) updated = true;
    }
  }

  // 用户名密码
  for (const pat of CREDENTIALS_PATTERNS) {
    const matches = text.match(pat);
    if (matches) {
      for (const m of matches) {
        if (addResult('credentials', m, sourceUrl)) updated = true;
      }
    }
  }

  // ID密钥
  for (const pat of ID_KEY_PATTERNS) {
    const matches = text.match(pat);
    if (matches) {
      for (const m of matches) {
        if (addResult('idKeys', m, sourceUrl)) updated = true;
      }
    }
  }

  return updated;
}

/** 收集页面中的JS URL */
function collectJsUrls(content: string, isHtml: boolean): Set<string> {
  const jsUrls = new Set<string>();
  const baseUrl = location.origin;

  if (isHtml) {
    const scriptPattern = /<script[^>]+src=["']([^"']+\.js[^"']*)["']/gi;
    let match;
    while ((match = scriptPattern.exec(content)) !== null) {
      try {
        const url = new URL(match[1], baseUrl).href;
        jsUrls.add(url);
      } catch { /* ignore */ }
    }
  }

  const jsMatches = content.match(JS_FILE_PATTERN);
  if (jsMatches) {
    for (const m of jsMatches) {
      const path = m.slice(1, -1);
      try {
        let url: string;
        if (path.startsWith('http')) {
          url = path;
        } else if (path.startsWith('//')) {
          url = location.protocol + path;
        } else if (path.startsWith('/')) {
          url = baseUrl + path;
        } else {
          url = new URL(path, baseUrl).href;
        }
        jsUrls.add(url);
      } catch { /* ignore */ }
    }
  }

  return jsUrls;
}

/** 将URL加入扫描队列 */
function enqueueJsUrl(url: string) {
  if (!scannedJsUrls.has(url) && !isThirdPartyLib(url)) {
    scannedJsUrls.add(url);
    addResult('jsFiles', url, 'page');
    jsQueue.push(url);
    processJsQueue();
  }
}

/** 发送扫描更新到popup */
function sendScanUpdate() {
  const total = scannedJsUrls.size;
  const remaining = jsQueue.length;
  const dealing = inFlightSet.size;
  const percent = total === 0 ? 100 : Math.floor(((total - remaining - dealing) / total) * 100);

  browser.runtime.sendMessage({
    action: 'infoCollectUpdate',
    results: scanResults,
    progress: Math.min(percent, 100),
  }).catch(() => { /* popup可能未打开 */ });
}

/** 处理JS队列 */
async function processJsQueue() {
  while (jsQueue.length > 0 && inFlightSet.size < MAX_CONCURRENT) {
    const url = jsQueue.shift()!;
    inFlightSet.add(url);

    handleJsTask(url).finally(() => {
      inFlightSet.delete(url);
      if (inFlightSet.size === 0) sendScanUpdate();
      if (jsQueue.length > 0) processJsQueue();
    });
  }
}

/** 处理单个JS文件 */
async function handleJsTask(url: string) {
  try {
    const response = await browser.runtime.sendMessage({
      action: 'fetchJsContent',
      url,
    });
    if (response?.content) {
      const updated = matchPatterns(response.content, false, url);
      if (updated) sendScanUpdate();

      const newJsUrls = collectJsUrls(response.content, false);
      newJsUrls.forEach((jsUrl) => enqueueJsUrl(jsUrl));
    }
  } catch (e) {
    console.error('[Hellcat] 处理JS出错:', url, e);
  }
}

/** 初始化扫描 */
async function initScan() {
  console.log('[Hellcat] 信息收集扫描开始...');
  scanResults = createEmptyScanResults();
  initSeenValues();

  const htmlContent = document.documentElement.innerHTML;
  if (htmlContent) {
    matchPatterns(htmlContent, true, location.href);
    sendScanUpdate();

    const jsUrls = collectJsUrls(htmlContent, true);
    jsUrls.forEach((url) => enqueueJsUrl(url));
  }
}

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  async main() {
    console.log('[Hellcat] Info collect content script loaded');

    initScan();

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === 'getInfoCollectResults') {
        sendResponse({
          results: scanResults,
          progress: jsQueue.length === 0 && inFlightSet.size === 0 ? 100 : 50,
        });
        return true;
      }
      return false;
    });
  },
});

