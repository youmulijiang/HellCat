/**
 * Dork 搜索引擎注册表
 *
 * 扩展方式：
 *   1. 新增一个 DorkEngine 对象，填入 operators 和 searchUrl
 *   2. push 到 DORK_ENGINES 数组即可自动出现在 UI 中
 *
 * 每个 operator 代表一条 dork 语法规则，UI 会根据它自动渲染输入控件。
 */

// ─── 类型定义 ────────────────────────────────────────

/** 单条 dork 操作符 */
export interface DorkOperator {
  /** 操作符关键字，如 site / inurl */
  keyword: string;
  /** 文案 key（用于 UI 展示） */
  labelKey: string;
  /** 占位提示 key */
  placeholderKey: string;
  /** 值是否需要用引号包裹，默认 false */
  quoted?: boolean;
  /** 该操作符是否支持取反（NOT / -），默认 true */
  negatable?: boolean;
}

/** 搜索引擎定义 */
export interface DorkEngine {
  /** 唯一标识（同时作为 Select option value） */
  id: string;
  /** 显示名称 */
  name: string;
  /** 引擎图标 URL 或 antd icon 名（可选） */
  icon?: string;
  /** 搜索 URL 模板，`{query}` 会被替换为生成的 dork 字符串 */
  searchUrl: string;
  /** 该引擎支持的 dork 操作符列表 */
  operators: DorkOperator[];
}

// ─── 内置引擎 ────────────────────────────────────────

const googleEngine: DorkEngine = {
  id: 'google',
  name: 'Google',
  searchUrl: 'https://www.google.com/search?q={query}',
  operators: [
    { keyword: 'site', labelKey: 'popup.dork.operators.google.site.label', placeholderKey: 'popup.dork.operators.google.site.placeholder' },
    { keyword: 'inurl', labelKey: 'popup.dork.operators.google.inurl.label', placeholderKey: 'popup.dork.operators.google.inurl.placeholder' },
    { keyword: 'intitle', labelKey: 'popup.dork.operators.google.intitle.label', placeholderKey: 'popup.dork.operators.google.intitle.placeholder', quoted: true },
    { keyword: 'intext', labelKey: 'popup.dork.operators.google.intext.label', placeholderKey: 'popup.dork.operators.google.intext.placeholder', quoted: true },
    { keyword: 'filetype', labelKey: 'popup.dork.operators.google.filetype.label', placeholderKey: 'popup.dork.operators.google.filetype.placeholder' },
    { keyword: 'ext', labelKey: 'popup.dork.operators.google.ext.label', placeholderKey: 'popup.dork.operators.google.ext.placeholder' },
    { keyword: 'cache', labelKey: 'popup.dork.operators.google.cache.label', placeholderKey: 'popup.dork.operators.google.cache.placeholder' },
    { keyword: 'link', labelKey: 'popup.dork.operators.google.link.label', placeholderKey: 'popup.dork.operators.google.link.placeholder' },
    { keyword: 'related', labelKey: 'popup.dork.operators.google.related.label', placeholderKey: 'popup.dork.operators.google.related.placeholder' },
    { keyword: 'info', labelKey: 'popup.dork.operators.google.info.label', placeholderKey: 'popup.dork.operators.google.info.placeholder' },
  ],
};

const githubEngine: DorkEngine = {
  id: 'github',
  name: 'GitHub',
  searchUrl: 'https://github.com/search?q={query}&type=code',
  operators: [
    { keyword: 'org', labelKey: 'popup.dork.operators.github.org.label', placeholderKey: 'popup.dork.operators.github.org.placeholder' },
    { keyword: 'user', labelKey: 'popup.dork.operators.github.user.label', placeholderKey: 'popup.dork.operators.github.user.placeholder' },
    { keyword: 'repo', labelKey: 'popup.dork.operators.github.repo.label', placeholderKey: 'popup.dork.operators.github.repo.placeholder' },
    { keyword: 'path', labelKey: 'popup.dork.operators.github.path.label', placeholderKey: 'popup.dork.operators.github.path.placeholder' },
    { keyword: 'filename', labelKey: 'popup.dork.operators.github.filename.label', placeholderKey: 'popup.dork.operators.github.filename.placeholder' },
    { keyword: 'extension', labelKey: 'popup.dork.operators.github.extension.label', placeholderKey: 'popup.dork.operators.github.extension.placeholder' },
    { keyword: 'language', labelKey: 'popup.dork.operators.github.language.label', placeholderKey: 'popup.dork.operators.github.language.placeholder' },
    { keyword: 'in', labelKey: 'popup.dork.operators.github.in.label', placeholderKey: 'popup.dork.operators.github.in.placeholder' },
  ],
};

// ─── 引擎注册表（新引擎只需 push 到此数组） ──────────

export const DORK_ENGINES: DorkEngine[] = [googleEngine, githubEngine];

/**
 * 根据用户输入的 operatorValues 生成最终 dork 查询字符串
 *
 * @param engine       当前引擎
 * @param values       { [keyword]: { value: string; negated: boolean } }
 * @param freeText     自由文本（追加到最后）
 */
export function buildDorkQuery(
  engine: DorkEngine,
  values: Record<string, { value: string; negated: boolean }>,
  freeText: string,
): string {
  const parts: string[] = [];

  for (const op of engine.operators) {
    const entry = values[op.keyword];
    if (!entry?.value.trim()) continue;

    const val = op.quoted ? `"${entry.value.trim()}"` : entry.value.trim();
    const prefix = entry.negated ? '-' : '';
    parts.push(`${prefix}${op.keyword}:${val}`);
  }

  if (freeText.trim()) {
    parts.push(freeText.trim());
  }

  return parts.join(' ');
}

/**
 * 生成完整搜索 URL
 */
export function buildSearchUrl(engine: DorkEngine, query: string): string {
  return engine.searchUrl.replace('{query}', encodeURIComponent(query));
}

