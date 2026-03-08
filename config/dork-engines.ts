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
  /** 中文描述（用于 UI 展示） */
  label: string;
  /** 占位提示 */
  placeholder: string;
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
    { keyword: 'site', label: '站点', placeholder: 'example.com' },
    { keyword: 'inurl', label: 'URL中包含', placeholder: 'admin' },
    { keyword: 'intitle', label: '标题包含', placeholder: 'login', quoted: true },
    { keyword: 'intext', label: '正文包含', placeholder: '密码', quoted: true },
    { keyword: 'filetype', label: '文件类型', placeholder: 'pdf' },
    { keyword: 'ext', label: '扩展名', placeholder: 'sql' },
    { keyword: 'cache', label: '缓存页面', placeholder: 'example.com' },
    { keyword: 'link', label: '链接到', placeholder: 'example.com' },
    { keyword: 'related', label: '相关站点', placeholder: 'example.com' },
    { keyword: 'info', label: '站点信息', placeholder: 'example.com' },
  ],
};

const githubEngine: DorkEngine = {
  id: 'github',
  name: 'GitHub',
  searchUrl: 'https://github.com/search?q={query}&type=code',
  operators: [
    { keyword: 'org', label: '组织', placeholder: 'microsoft' },
    { keyword: 'user', label: '用户', placeholder: 'torvalds' },
    { keyword: 'repo', label: '仓库', placeholder: 'owner/repo' },
    { keyword: 'path', label: '文件路径', placeholder: 'src/' },
    { keyword: 'filename', label: '文件名', placeholder: '.env' },
    { keyword: 'extension', label: '扩展名', placeholder: 'py' },
    { keyword: 'language', label: '语言', placeholder: 'python' },
    { keyword: 'in', label: '搜索范围', placeholder: 'file,path' },
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

