/**
 * 信息收集内容脚本
 * 扫描引擎直接移植自 SnowEyes（https://github.com/SickleSec/SnowEyes）的 content.js，
 * 并适配为本项目的按需扫描模型：
 * - popup 打开信息收集面板时通过 startInfoCollect 触发（不自动扫描）
 * - 保留 SnowEyes 的分块扫描、exec 无限循环保护、Webpack chunk 路径还原、
 *   JS 队列递归发现、动态 DOM 监听（debounce 1s）
 * - 未移植：deepScan 路径树修复与 background 徽标（依赖 SnowEyes 专属的后台协议）
 */
import { createEmptyScanResults } from '@/types/info-collect';
import type { ScanResults } from '@/types/info-collect';
import {
  API_CONFIG,
  CREDENTIALS_PATTERNS,
  ID_KEY_PATTERNS,
  SCAN_PATTERNS,
  isThirdPartyLibUrl,
} from '@/config/info-collect-patterns';
import { SCAN_FILTERS } from '@/config/info-collect-filters';
import type { ScanResultsWriter } from '@/config/info-collect-filters';

/** 扫描结果 */
let scanResults: ScanResults = createEmptyScanResults();
/** 已发现的值去重集合 */
const seenValues: Record<string, Set<string>> = {};
/** 当前页面是否已经启动过扫描 */
let scanStarted = false;

/** 已扫描的JS URL集合 */
const scannedJsUrls = new Set<string>();
/** JS队列 */
const jsQueue: string[] = [];
/** 正在处理的JS */
const inFlightSet = new Set<string>();
const MAX_CONCURRENT = 10;
/** 大文件分块大小（按行切分，避免超长正则匹配卡死） */
const MAX_CHUNK_SIZE = 50000;
/** 单个正则的最大迭代次数（防止零宽断言导致的死循环） */
const MAX_PATTERN_ITERATIONS = 10000;
/** 单个分类的最大结果数（防止异常页面撑爆 popup） */
const MAX_PER_CATEGORY = 2000;

function initSeenValues() {
  for (const key of Object.keys(scanResults)) {
    seenValues[key] = new Set<string>();
  }
}

/** 结果写入器：带去重与容量上限 */
const writer: ScanResultsWriter = {
  add(category, value, source) {
    const cleaned = value.replace(/^["'\s]+|["'\s]+$/g, '');
    if (!cleaned || cleaned.length < 3) return false;
    if (!seenValues[category]) seenValues[category] = new Set();
    if (seenValues[category].has(cleaned)) return false;
    const bucket = scanResults[category];
    if (!bucket || bucket.length >= MAX_PER_CATEGORY) return false;
    seenValues[category].add(cleaned);
    bucket.push({ value: cleaned, source });
    return true;
  },
};

/** 计算扫描进度（基于已扫描/排队/处理中的 JS 数量） */
function calculateProgress() {
  const total = scannedJsUrls.size;
  const remaining = jsQueue.length;
  const dealing = inFlightSet.size;
  if (total === 0) return 100;
  const percent = Math.floor(((total - remaining - dealing) / total) * 100);
  return Math.min(percent, 100);
}

/** 发送扫描更新到popup */
function sendScanUpdate() {
  browser.runtime.sendMessage({
    action: 'infoCollectUpdate',
    results: scanResults,
    progress: calculateProgress(),
  }).catch(() => { /* popup可能未打开 */ });
}

/**
 * 将长文本按行切分为不超过 MAX_CHUNK_SIZE 的块（SnowEyes splitIntoChunks）
 */
function* splitIntoChunks(text: string): Generator<string> {
  if (text.length <= MAX_CHUNK_SIZE) {
    yield text;
    return;
  }
  const lines = text.split(/\r?\n/);
  let currentLines: string[] = [];
  let currentSize = 0;

  for (const line of lines) {
    const lineSize = line.length + 1;

    if (currentSize + lineSize > MAX_CHUNK_SIZE) {
      if (currentSize > 0) {
        yield currentLines.join('\n') + '\n';
        currentLines = [];
        currentSize = 0;
      }
      if (line.length > MAX_CHUNK_SIZE) {
        for (let i = 0; i < line.length; i += MAX_CHUNK_SIZE) {
          yield line.slice(i, i + MAX_CHUNK_SIZE);
        }
      } else {
        currentLines.push(line);
        currentSize = lineSize;
      }
    } else {
      currentLines.push(line);
      currentSize += lineSize;
    }
  }

  if (currentLines.length > 0) {
    yield currentLines.join('\n') + '\n';
  }
}

/**
 * 对单个块执行全部规则匹配（SnowEyes matchPatterns）
 * @returns 是否产生了新结果
 */
async function matchPatterns(chunk: string, isHtmlContent: boolean, url: string): Promise<boolean> {
  let updated = false;
  let lastIndex = 0;

  /** 通用 exec 循环：带无限循环保护 */
  const execAll = (pattern: RegExp, onMatch: (match: string) => void) => {
    pattern.lastIndex = 0;
    let iterations = MAX_PATTERN_ITERATIONS;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(chunk)) !== null) {
      if (pattern.lastIndex <= lastIndex) {
        console.warn(`[Hellcat] 检测到可能的无限循环: ${pattern.source.slice(0, 50)}`);
        break;
      }
      lastIndex = pattern.lastIndex;
      onMatch(m[0]);
      if (--iterations <= 0) {
        console.warn(`[Hellcat] 达到最大迭代次数: ${pattern.source.slice(0, 50)}`);
        break;
      }
      if (!pattern.global) break;
    }
  };

  // ── DOMAIN：HTML 与资源文件使用不同模式 ──
  try {
    const domainPattern = isHtmlContent ? SCAN_PATTERNS.DOMAIN : SCAN_PATTERNS.DOMAIN_RESOURCE;
    execAll(domainPattern, (m) => {
      if (SCAN_FILTERS.domain(m, url, writer)) updated = true;
    });
  } catch (e) {
    console.error('[Hellcat] 匹配 DOMAIN 出错:', e);
  }

  // ── IP：HTML 与资源文件使用不同模式 ──
  try {
    const ipPattern = isHtmlContent ? SCAN_PATTERNS.IP : SCAN_PATTERNS.IP_RESOURCE;
    execAll(ipPattern, (m) => {
      if (SCAN_FILTERS.ip(m, url, writer)) updated = true;
    });
  } catch (e) {
    console.error('[Hellcat] 匹配 IP 出错:', e);
  }

  // ── API 路径 ──
  try {
    execAll(API_CONFIG.PATTERN, (m) => {
      if (SCAN_FILTERS.api(m, url, writer)) updated = true;
    });
  } catch (e) {
    console.error('[Hellcat] 匹配 API 出错:', e);
  }

  // ── 凭证（多模式数组）──
  try {
    for (const pattern of CREDENTIALS_PATTERNS) {
      execAll(pattern, (m) => {
        if (SCAN_FILTERS.credentials(m, url, writer)) updated = true;
      });
    }
  } catch (e) {
    console.error('[Hellcat] 匹配 CREDENTIALS 出错:', e);
  }

  // ── ID / 密钥（多模式数组，规则名用于来源标注）──
  try {
    for (const { name, pattern } of ID_KEY_PATTERNS) {
      execAll(pattern, (m) => {
        // 逐条规则尝试写入；被 id_key 过滤器拒绝的裸值不再重试
        if (SCAN_FILTERS.id_key(m, url, writer)) updated = true;
      });
      void name;
    }
  } catch (e) {
    console.error('[Hellcat] 匹配 ID_KEY 出错:', e);
  }

  // ── 其余单模式规则：PHONE / EMAIL / IDCARD / URL / JWT / COMPANY / COOKIE ──
  const simpleRules: Array<{ pattern: RegExp; filter: (m: string, u: string, w: ScanResultsWriter) => boolean; label: string }> = [
    { pattern: SCAN_PATTERNS.PHONE, filter: SCAN_FILTERS.phone, label: 'PHONE' },
    { pattern: SCAN_PATTERNS.EMAIL, filter: SCAN_FILTERS.email, label: 'EMAIL' },
    { pattern: SCAN_PATTERNS.IDCARD, filter: SCAN_FILTERS.idcard, label: 'IDCARD' },
    { pattern: SCAN_PATTERNS.URL, filter: SCAN_FILTERS.url, label: 'URL' },
    { pattern: SCAN_PATTERNS.JWT, filter: SCAN_FILTERS.jwt, label: 'JWT' },
    { pattern: SCAN_PATTERNS.COMPANY, filter: SCAN_FILTERS.company, label: 'COMPANY' },
    { pattern: SCAN_PATTERNS.COOKIE, filter: SCAN_FILTERS.cookie, label: 'COOKIE' },
  ];
  for (const rule of simpleRules) {
    try {
      execAll(rule.pattern, (m) => {
        if (rule.filter(m, url, writer)) updated = true;
      });
    } catch (e) {
      console.error(`[Hellcat] 匹配 ${rule.label} 出错:`, e);
    }
  }

  return updated;
}

/**
 * 收集内容中的 JS URL，含 Webpack chunk 路径还原（SnowEyes collectJsUrls）
 */
function collectJsUrls(content: string, isHtmlContent: boolean): Set<string> {
  const jsUrls = new Set<string>();
  const baseUrl = window.location.origin;
  const jsPattern = /['"](?:[^'"]+\.(?:js)(?:\?[^\s'"]*)?)['"]/g;
  // Webpack chunk 映射：识别 "static/js/"+...{"chunkId":"hash"}[e]+".js" 形式并还原完整文件名
  const chunkCodePattern = /("[a-z/]*")[+|()\[\]\{\}a-z]*\+"."\+{(?:"?[0-9a-z-]*"?:"?[0-9a-z-]{1,}"?,?){1,}}\[[a-z]\]\+".js"/i;
  const chunkJsPattern = /"?[0-9a-z-]*"?\s*:\s*"?[0-9a-z-]*"?/g;

  const chunkMatch = content.match(chunkCodePattern);
  if (chunkMatch) {
    let chunkBasePath = chunkMatch[1].slice(1, -1);
    if (!chunkBasePath.startsWith('/')) {
      chunkBasePath = '/' + chunkBasePath;
    }
    Array.from(chunkMatch[0].matchAll(chunkJsPattern)).forEach((chunkJsMatch) => {
      let chunkId = chunkJsMatch[0].split(':')[0];
      if (chunkId.includes('"') || chunkId.includes("'")) {
        chunkId = chunkId.slice(1, -1);
      }
      const chunkHash = (chunkJsMatch[0].split(':')[1] ?? '').replace(/["']/g, '');
      if (!chunkId || !chunkHash) return;
      const chunkUrl = baseUrl + chunkBasePath + chunkId + '.' + chunkHash + '.js';
      jsUrls.add(chunkUrl);
    });
  }

  if (isHtmlContent) {
    const matches = Array.from(content.matchAll(jsPattern))
      .map((match) => {
        const path = match[0].slice(1, -1);
        try {
          if (path.startsWith('http')) return path;
          if (path.startsWith('//')) return window.location.protocol + path;
          if (path.startsWith('/')) return baseUrl + path;
          return new URL(path, baseUrl).href;
        } catch {
          return null;
        }
      })
      .filter((url): url is string => url !== null);
    matches.forEach((url) => jsUrls.add(url));
  }

  return jsUrls;
}

/** 将URL加入扫描队列 */
function enqueueJsUrl(url: string) {
  if (!scannedJsUrls.has(url) && !isThirdPartyLibUrl(url)) {
    scannedJsUrls.add(url);
    writer.add('jsFiles', url, 'page');
    jsQueue.push(url);
    void processJsQueue();
  }
}

/** 处理JS队列（并发上限内递归处理） */
async function processJsQueue() {
  while (jsQueue.length > 0 && inFlightSet.size < MAX_CONCURRENT) {
    const url = jsQueue.shift()!;
    inFlightSet.add(url);

    handleJsTask(url).finally(() => {
      inFlightSet.delete(url);
      if (inFlightSet.size === 0) sendScanUpdate();
      if (jsQueue.length > 0) void processJsQueue();
    });
    await new Promise((r) => setTimeout(r, 0));
  }
}

/** 处理单个JS文件：抓取 → 扫描 → 递归发现新JS */
async function handleJsTask(url: string) {
  try {
    const response = await browser.runtime.sendMessage({
      action: 'fetchJsContent',
      url,
    });
    if (response?.content) {
      await scanSources([response.content], false, url);
      const newJsUrls = collectJsUrls(response.content, false);
      newJsUrls.forEach((jsUrl) => enqueueJsUrl(jsUrl));
    }
  } catch (e) {
    console.error('[Hellcat] 处理JS出错:', url, e);
  }
}

/** 扫描一批内容源（分块执行，块间让出主线程） */
async function scanSources(sources: string[], isHtmlContent: boolean, url: string) {
  try {
    for (const source of sources) {
      if (!source) continue;
      for (const chunk of splitIntoChunks(source)) {
        const updated = await matchPatterns(chunk, isHtmlContent, url);
        if (updated) sendScanUpdate();
        await new Promise((r) => setTimeout(r, 0));
      }
    }
  } catch (e) {
    if ((e as Error).message !== 'Extension context invalidated.') {
      console.error('[Hellcat] 扫描出错:', e);
    }
  }
}

// ── 动态扫描：DOM 变化后 debounce 重扫 HTML（SnowEyes dynamicScan）──
let scanTimeout: ReturnType<typeof setTimeout> | null = null;
let observerInitialized = false;

const debounceScan = () => {
  if (scanTimeout) clearTimeout(scanTimeout);
  scanTimeout = setTimeout(() => {
    const htmlContent = document.documentElement.innerHTML;
    if (htmlContent) {
      void scanSources([htmlContent], true, document.location.href);
    }
  }, 1000);
};

const observer = new MutationObserver((mutations) => {
  const significantChanges = mutations.filter((mutation) => {
    // class / style 变化不触发重扫
    if (mutation.type === 'attributes' && (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
      return false;
    }
    return true;
  });
  if (significantChanges.length > 0) {
    debounceScan();
  }
});

/** 初始化扫描（HTML + 页面引用的JS 队列） */
async function initScan() {
  scanResults = createEmptyScanResults();
  initSeenValues();

  const htmlContent = document.documentElement.innerHTML;
  if (htmlContent) {
    await scanSources([htmlContent], true, document.location.href);

    const jsUrls = collectJsUrls(htmlContent, true);
    jsUrls.forEach((url) => enqueueJsUrl(url));
  }

  // 首次扫描完成后开启动态监听，SPA 路由变化带来的新内容会被重扫
  if (!observerInitialized && document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributeFilter: ['src', 'href', 'data-*'],
      characterDataOldValue: false,
    });
    observerInitialized = true;
  }
}

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  async main() {
    console.log('[Hellcat] Info collect content script loaded');

    // 按需扫描：仅在 popup 打开信息收集面板时触发，避免每个页面都自动抓取全部 JS
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === 'startInfoCollect') {
        if (!scanStarted) {
          scanStarted = true;
          void initScan();
        }
        sendResponse({ status: 'scanning', progress: calculateProgress() });
        return true;
      }
      if (message.action === 'getInfoCollectResults') {
        sendResponse({
          results: scanResults,
          progress: calculateProgress(),
        });
        return true;
      }
      return false;
    });
  },
});
