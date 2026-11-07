/**
 * 敏感信息过滤器
 * 直接移植自 SnowEyes（https://github.com/SickleSec/SnowEyes）的 scanner.filter.js，
 * 并适配为本项目的 TypeScript 模块与结果写入接口。原实现版权归 SnowEyes 作者所有。
 *
 * 每个过滤器负责：清洗匹配值 → 黑名单/误报校验 → 按类别写入结果。
 * 返回 true 表示产生了新结果（用于驱动实时推送）。
 */

import {
  API_CONFIG,
  DOMAIN_CONFIG,
  ID_KEY_BLACKLIST,
  IP_CONFIG,
  SCAN_PATTERNS,
  VALUE_BLACKLIST,
} from './info-collect-patterns';
import type { ScanResults } from '@/types/info-collect';

/** 结果写入接口（由 content script 提供，内部做去重） */
export interface ScanResultsWriter {
  add(category: keyof ScanResults, value: string, source: string): boolean;
}

/** 正则表达式缓存（SnowEyes regexCache） */
const regexCache = {
  coordPattern: /^coord/,
  valuePattern: /^\/|true|false|register|signUp|basic|http/i,
  chinesePattern: /^[\u4e00-\u9fa5]+$/,
  camelCasePattern: /\b[_a-z]+(?:[A-Z][a-z]+)+\b/,
};

/** API 过滤器：分类到 js/vue/图片/文档/模块/绝对API/相对API */
export function filterApi(match: string, url: string, writer: ScanResultsWriter): boolean {
  const value = match.slice(1, -1);

  if (API_CONFIG.FONT_PATTERN.test(value)) {
    return false;
  }
  if (value.endsWith('.vue')) {
    return writer.add('vueFiles', value, url);
  }
  if (API_CONFIG.IMAGE_PATTERN.test(value)) {
    return writer.add('imageFiles', value, url);
  }
  if (API_CONFIG.JS_PATTERN.test(value)) {
    return writer.add('jsFiles', value, url);
  }
  if (API_CONFIG.DOC_PATTERN.test(value)) {
    return writer.add('docFiles', value, url);
  }

  const lcValue = value.toLowerCase();
  const shouldFilter = API_CONFIG.FILTERED_CONTENT_TYPES.some(
    (type) => lcValue === type.toLowerCase(),
  );
  if (shouldFilter) {
    return false;
  }

  if (value.startsWith('./')) {
    return writer.add('moduleFiles', value, url);
  }

  if (value.startsWith('/')) {
    // 绝对路径：过滤掉过短的疑似正则片段
    if (value.length <= 4 && /[A-Z.\/\#\+\?23]/.test(value.slice(1))) return false;
    return writer.add('absoluteApis', value, url);
  }

  // 相对路径
  if (/^(audio|blots|core|ace|icon|css|formats|image|js|modules|text|themes|ui|video|static|attributors|application)/.test(value)) return false;
  if (value.length <= 4) return false;
  return writer.add('apis', value, url);
}

/** 域名过滤器：清理 + URL 解码 + 黑名单 */
export function filterDomain(match: string, url: string, writer: ScanResultsWriter): boolean {
  // URL 解码缓存
  const decodeCache = decodeCacheMap;

  const cleaned = (() => {
    try {
      // 1. 处理引号
      let domain = match.replace(/^['"]|['"]$/g, '');
      // 2. 转小写
      domain = domain.toLowerCase();
      // 3. URL 解码（使用缓存）
      if (decodeCache.has(domain)) {
        domain = decodeCache.get(domain)!;
      } else {
        try {
          const decoded = decodeURIComponent(domain.replace(/\+/g, ' '));
          decodeCache.set(domain, decoded);
          domain = decoded;
        } catch {
          decodeCache.set(domain, domain);
        }
      }
      // 4. 使用过滤规则提取域名
      const filterMatch = domain.match(SCAN_PATTERNS.DOMAIN_FILTER);
      if (!filterMatch) return null;
      if (/\b[a-z]+\.(?:top|bottom)-[a-z]+\.top\b/.test(filterMatch[0])) return null;
      if (filterMatch[0].split('.')[0] !== 'el' && filterMatch[0].split('.')[0] !== 'e') {
        return filterMatch[0];
      }
      return null;
    } catch {
      return null;
    }
  })();

  if (!cleaned) return false;

  // 检查是否在黑名单中
  if (DOMAIN_CONFIG.BLACKLIST.some((blacklisted) => cleaned.includes(blacklisted))) {
    return false;
  }

  return writer.add('domains', cleaned, url);
}

// 域名解码缓存（模块级，避免每次扫描重建）
const decodeCacheMap = new Map<string, string>();

/** IP 过滤器：剔除引号与特殊范围 */
export function filterIp(match: string, url: string, writer: ScanResultsWriter): boolean {
  const value = match.replace(/^[`'"]|[`'"]$/g, '');
  const ipMatch = value.match(SCAN_PATTERNS.IP);
  if (ipMatch) {
    const extractedIp = ipMatch[0];
    if (IP_CONFIG.SPECIAL_RANGES.some((range) => range.test(extractedIp))) return false;
    return writer.add('ips', extractedIp, url);
  }
  return false;
}

/** 手机号过滤器 */
export function filterPhone(match: string, url: string, writer: ScanResultsWriter): boolean {
  return writer.add('phones', match, url);
}

/** 邮箱过滤器 */
export function filterEmail(match: string, url: string, writer: ScanResultsWriter): boolean {
  return writer.add('emails', match, url);
}

/** 身份证过滤器 */
export function filterIdCard(match: string, url: string, writer: ScanResultsWriter): boolean {
  return writer.add('idcards', match, url);
}

/** JWT 过滤器（去掉包裹引号） */
export function filterJwt(match: string, url: string, writer: ScanResultsWriter): boolean {
  return writer.add('jwts', match.replace(/^["']|["']$/g, ''), url);
}

/** URL 过滤器：GitHub URL 单独归类；当前站点路径拆分为 API */
export function filterUrl(match: string, url: string, writer: ScanResultsWriter): boolean {
  // GitHub URL 单独归类
  if (match.toLowerCase().includes('github.com/')) {
    return writer.add('githubUrls', match, url);
  }

  let updated = writer.add('urls', match, url);

  try {
    const matchUrl = new URL(match);
    const currentHost = window.location.host;
    // 仅对当前域名的 URL 做路径拆分
    if (matchUrl.host === currentHost) {
      const path = matchUrl.pathname;
      if (API_CONFIG.FONT_PATTERN.test(path)) {
        return updated;
      }
      if (API_CONFIG.IMAGE_PATTERN.test(path)) {
        return writer.add('imageFiles', path, url) || updated;
      }
      if (API_CONFIG.JS_PATTERN.test(path)) {
        return writer.add('jsFiles', path, url) || updated;
      }
      if (API_CONFIG.DOC_PATTERN.test(path)) {
        return writer.add('docFiles', path, url) || updated;
      }
      // 如果不是特定类型文件，则当作 API 处理
      if (!path.match(/\.[a-zA-Z0-9]+$/)) {
        if (path.startsWith('/')) {
          updated = writer.add('absoluteApis', path, url) || updated;
        } else {
          updated = writer.add('apis', path, url) || updated;
        }
      }
    }
  } catch {
    // URL 解析失败仅保留 urls 结果
  }

  return updated;
}

/** 公司名过滤器：括号形态与中文黑名单过滤 */
export function filterCompany(match: string, url: string, writer: ScanResultsWriter): boolean {
  if (/[（）]/.test(match) && !match.match(/（\S*）/)) return false;
  if (Array.from(VALUE_BLACKLIST.CHINESE_BLACKLIST).some((blackWord) => match.includes(blackWord))) {
    return false;
  }
  return writer.add('companies', match, url);
}

/** Cookie / 会话凭证过滤器 */
export function filterCookie(match: string, url: string, writer: ScanResultsWriter): boolean {
  const valueMatch = match.replace(/\s+/g, '').split(/[:=]/);
  if (!valueMatch[1] || valueMatch[1].replace(/['"]/g, '').length < 4) {
    return false;
  }
  const key = valueMatch[0].replace(/['"<>]/g, '').toLowerCase();
  const value = valueMatch[1].replace(/['"<>]/g, '').toLowerCase();
  if (!value.length || key === value) {
    return false;
  }
  if (value.length < 12) {
    if (Array.from(VALUE_BLACKLIST.SHORT_VALUES).some((blackWord) => value.includes(blackWord))) {
      return false;
    }
  } else {
    if (Array.from(VALUE_BLACKLIST.MEDIUM_VALUES).some((blackWord) => value.includes(blackWord))) {
      return false;
    }
  }
  return writer.add('cookies', match, url);
}

/** 用户名/密码凭证过滤器 */
export function filterCredentials(match: string, url: string, writer: ScanResultsWriter): boolean {
  const valueMatch = match.replace(/\s+/g, '').split(/[:=]/);
  const key = valueMatch[0].replace(/['"]/g, '').toLowerCase();
  const value = (valueMatch[1] ?? '').replace(/['"{}\[\]，：。？、?！><]/g, '').toLowerCase();
  if (!value.length) {
    return false;
  }
  if (regexCache.coordPattern.test(key) || regexCache.valuePattern.test(value) || value.length <= 1) {
    return false;
  }
  if (regexCache.chinesePattern.test(value)) return false;

  return writer.add('credentials', match, url);
}

/** ID / 密钥过滤器（黑名单最严格的一类） */
export function filterIdKey(match: string, url: string, writer: ScanResultsWriter): boolean {
  const hasDelimiter = match.match(/[:=]/);

  if (!hasDelimiter && match.length < 32) return false;

  if (hasDelimiter) {
    const valueMatch = match.replace(/\s+/g, '').split(/[:=]/);
    const key = valueMatch[0].replace(/['"<>]/g, '');
    const value = (valueMatch[1] ?? '').replace(/['"><]/g, '');
    const keyLower = key.toLowerCase();
    const valueLower = value.toLowerCase();

    if (!value.length || keyLower === valueLower) {
      return false;
    }
    // 检查 key 是否在黑名单中
    if (Array.from(ID_KEY_BLACKLIST).some((blackWord) => keyLower.includes(blackWord))) {
      return false;
    }
    // 检查 value 是否在统一黑名单中
    if (value.length < 16) {
      if (Array.from(VALUE_BLACKLIST.SHORT_VALUES).some((blackWord) => valueLower.includes(blackWord))) {
        return false;
      }
      if (Array.from(VALUE_BLACKLIST.MEDIUM_VALUES).some((blackWord) => valueLower.includes(blackWord))) {
        return false;
      }
    } else {
      if (Array.from(VALUE_BLACKLIST.MEDIUM_VALUES).some((blackWord) => valueLower.includes(blackWord))) {
        return false;
      }
      if (Array.from(VALUE_BLACKLIST.LONG_VALUES).some((blackWord) => valueLower.includes(blackWord))) {
        return false;
      }
    }
    // 其他检查：泛化的 key=xxx 过短或驼峰命中的视为配置代码
    if (keyLower === 'key' && (value.length <= 8 || regexCache.camelCasePattern.test(value))) {
      return false;
    }
    if (value.length <= 3) {
      return false;
    }
  } else {
    // 无分隔符但长度 >= 32 的裸字符串：纯字母视为普通单词
    if (/^[a-zA-Z]+$/.test(match.slice(1, -1))) {
      return false;
    }
    if (Array.from(VALUE_BLACKLIST.MEDIUM_VALUES).some((blackWord) => match.includes(blackWord))) {
      return false;
    }
    if (Array.from(VALUE_BLACKLIST.LONG_VALUES).some((blackWord) => match.includes(blackWord))) {
      return false;
    }
  }

  return writer.add('idKeys', match, url);
}

/** 各过滤器映射（key 与 SCAN_PATTERNS 对应） */
export const SCAN_FILTERS: {
  api: typeof filterApi;
  domain: typeof filterDomain;
  ip: typeof filterIp;
  phone: typeof filterPhone;
  email: typeof filterEmail;
  idcard: typeof filterIdCard;
  url: typeof filterUrl;
  jwt: typeof filterJwt;
  company: typeof filterCompany;
  cookie: typeof filterCookie;
  credentials: typeof filterCredentials;
  id_key: typeof filterIdKey;
} = {
  api: filterApi,
  domain: filterDomain,
  ip: filterIp,
  phone: filterPhone,
  email: filterEmail,
  idcard: filterIdCard,
  url: filterUrl,
  jwt: filterJwt,
  company: filterCompany,
  cookie: filterCookie,
  credentials: filterCredentials,
  id_key: filterIdKey,
};
