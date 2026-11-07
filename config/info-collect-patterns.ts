/**
 * 敏感信息匹配规则配置
 * 直接移植自 SnowEyes（https://github.com/SickleSec/SnowEyes）的 scanner.config.js，
 * 并适配为本项目的 TypeScript 模块。原实现版权归 SnowEyes 作者所有，本项目仅用于
 * 安全测试辅助（MIT），如需分发请遵循原项目许可约定。
 *
 * 结构说明：
 * - SCAN_PATTERNS：主匹配规则（HTML 与资源文件使用不同模式）
 * - ID_KEY_PATTERNS / CREDENTIALS_PATTERNS：多规则组合匹配
 * - API_CONFIG / DOMAIN_CONFIG / IP_CONFIG：辅助过滤配置
 * - VALUE_BLACKLIST / KEY_BLACKLIST：误报词黑名单（短值/中值/长值/中文）
 */

// ─────────────────────────────────────────────
// API 相关配置
// ─────────────────────────────────────────────
export const API_CONFIG = {
  /** API / 路径匹配（引号包裹的相对路径或 mime 形式） */
  PATTERN: /['"`](?:\/|\.\.\/|\.\/)[^\/\>\< \)\(\}\,\'\"\\](?:[^\^\>\< \)\(\,\'\"\\])*?['"`]|['"`][a-zA_Z0-9]+(?<!text|application)\/(?:[^\^\>\< \)\(\{\}\,\'\"\\])*?["'`]/g,
  /** 图片 / 媒体文件模式 */
  IMAGE_PATTERN: /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|mp3|mp4|m4a|wav|swf)(?:\?[^'"]*)?$/i,
  /** JS 文件模式 */
  JS_PATTERN: /\.(js|jsx|ts|tsx|less)(?:\?[^'"]*)?$/i,
  /** 文档 / 安装包模式 */
  DOC_PATTERN: /\.(pdf|doc|docx|xls|xlsx|ppt|exe|apk|zip|7z|dll|dmg|pptx|txt|rar|md|csv)(?:\?[^'"]*)?$/i,
  /** 字体 / 样式文件模式（不作为 API 收集） */
  FONT_PATTERN: /\.(ttf|eot|woff|woff2|otf|css)(?:\?[^'"]*)?$/i,
  /** 需要跳过的第三方 JS 库文件名规则 */
  SKIP_JS_PATTERNS: [
    // jQuery相关
    /^jquery([.-]?\d*\.?\d*\.?\d*)?(?:[\.-]cookie)?(?:[\.-]fancybox)?(?:[\.-]validate)?(?:[\.-]artDialog)?(?:[\.-]blockui)?(?:[\.-]pack)?(?:[\.-]base64)?(?:[\.-]md5)?(?:[\.-]min)?\.js$/i,
    /^(?:vue|vue-router|vuex)[.-]?\d*\.?\d*\.?\d*(?:\.min)?\.js$/i,
    // React相关
    /^(react|react-dom)[.-]?\d*\.?\d*\.?\d*(?:\.min)?\.js$/i,
    // Bootstrap相关
    /^bootstrap(?:\.bundle)?[.-]?\d*\.?\d*\.?\d*(?:[\.-]datepicker|datetimepicker)?(?:[\.-]zh-CN)?(?:[\.-]min)?\.js$/i,
    // UI框架相关
    /^(layui|lay|layer|liger|h-ui|element-ui|ueditor|kindeditor|ant-design)[.-]?\d*\.?\d*\.?\d*(?:[\.-]all)?(?:\.admin)?(?:[\.-]config)?(?:[\.-]min)?\.js$/i,
    // 图表相关
    /^(echarts|chart|highcharts)[.-]?\d*\.?\d*\.?\d*(?:\.min)?\.js$/i,
    // 工具库相关
    /^(lodash|moment|katex|tableexport|axios|plupload|pqgrid|md5)[.-]?\d*\.?\d*\.?\d*(?:\.full)?(?:\.min)?\.js$/i,
    // 其他常用库
    /^(polyfill|modernizr|device|less|isotope.pkgd|lhgdialog|kendo.web|dataTables|editor|seajs-style|seajs-text|tinymce|jsencrypt|backbone|select2|underscore|ext-all|ext-unigui-min|exporter|buttons|v5_float_4)[.-]?\d*\.?\d*\.?\d*(?:[\.-]dev)?(?:[\.-]html5|bootstrap|print|full)?(?:[\.-]min)?\.js$/i,
    // 日期选择器
    /^(datepicker|datetimepicker|wdatepicker|laydate)[.-]?\d*\.?\d*\.?\d*(?:\.min)?\.js$/i,
    // 语言包
    /^(?:zh|en|zh-cn|zh-tw|ja|ko)[.-]?\d*\.?\d*\.?\d*(?:\.min)?\.js$/i,
  ],
  /** 需要过滤的内容类型（非 API 的常见字符串） */
  FILTERED_CONTENT_TYPES: [
    'multipart/form-data',
    'node_modules/',
    'pause/break',
    'partial/ajax',
    'chrome/',
    'firefox/',
    'edge/',
    'examples/element-ui',
    'static/js/',
    'static/css/',
    'stylesheet/less',
    'jpg/jpeg/png/pdf',
    // 日期类型
    'yyyy/mm/dd',
    'dd/mm/yyyy',
    'mm/dd/yy',
    'yy/mm/dd',
    'm/d/Y',
    'm/d/y',
    'xx/xx',
    'zrender/vml/vml',
  ],
};

// ─────────────────────────────────────────────
// 域名配置
// ─────────────────────────────────────────────
export const DOMAIN_CONFIG = {
  /** 域名黑名单：不会展示以下域名 */
  BLACKLIST: [
    'el.datepicker.today',
    'obj.style.top',
    'window.top',
    'mydragdiv.style.top',
    'container.style.top',
    'location.host',
    'page.info',
    'res.info',
    'item.info',
  ],
};

// ─────────────────────────────────────────────
// IP 配置
// ─────────────────────────────────────────────
export const IP_CONFIG = {
  /** 特殊 IP 范围（保留地址和特殊用途地址） */
  SPECIAL_RANGES: [
    /^0\.0\.0\.0$/,          // 当前网络
    /^255\.255\.255\.255$/,  // 广播地址
  ],
};

// ─────────────────────────────────────────────
// 主匹配规则
// ─────────────────────────────────────────────
export const SCAN_PATTERNS = {
  /** 域名匹配 - HTML 页面 */
  DOMAIN: /\b(?:(?!this)[a-z0-9%-]+\.)*?(?:(?!this)[a-z0-9%-]{2,}\.)(?:wang|club|xyz|vip|top|beer|work|ren|technology|fashion|luxe|yoga|red|love|online|ltd|chat|group|pub|run|city|live|kim|pet|space|site|tech|host|fun|store|pink|ski|design|ink|wiki|video|email|company|plus|center|cool|fund|gold|guru|life|team|today|world|zone|social|bio|black|blue|green|lotto|organic|poker|promo|vote|archi|voto|fit|cn|website|press|icu|art|law|shop|band|media|cab|cash|cafe|games|link|fan|net|cc|com|fans|cloud|info|pro|mobi|asia|studio|biz|vin|news|fyi|tax|tv|market|shopping|mba|sale|co|org)(?:\:\d{1,5})?(?![a-zA-Z0-9._=>\(\);!}-])\b/g,
  /** 域名匹配 - 资源文件 */
  DOMAIN_RESOURCE: /["'](?:(?:[a-z0-9]+:)?\/\/)?(?:(?!this)[a-z0-9%-]+\.)*?(?:[a-z0-9%-]{2,}\.)(?:wang|club|xyz|vip|top|beer|work|ren|technology|fashion|luxe|yoga|red|love|online|ltd|chat|group|pub|run|city|live|kim|pet|space|site|tech|host|fun|store|pink|ski|design|ink|wiki|video|email|company|plus|center|cool|fund|gold|guru|life|team|today|world|zone|social|bio|black|blue|green|lotto|organic|poker|promo|vote|archi|voto|fit|cn|website|press|icu|art|law|shop|band|media|cab|cash|cafe|games|link|fan|net|cc|com|fans|cloud|info|pro|mobi|asia|studio|biz|vin|news|fyi|tax|tv|market|shopping|mba|sale|co|org)(?![a-zA-Z0-9.])(?:\:\d{1,5})?\S*?["']/g,
  /** 域名清理/提取 */
  DOMAIN_FILTER: /\b(?:[a-zA-Z0-9%-]+\.)+[a-z]{2,10}(?:\:\d{1,5})?\b/,
  /** IP 地址匹配 - HTML 页面 */
  IP: /(?<!\.|\d)(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?::\d{1,5})?(?!\.|[0-9])/g,
  /** IP 地址匹配 - 资源文件 */
  IP_RESOURCE: /["'](?:(?:[a-zA-Z0-9%-]+\:)?\/\/)?(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?::\d{1,5}|\/)?\S*?["']/g,
  /** API 路径（复用 API_CONFIG.PATTERN） */
  API: API_CONFIG.PATTERN,
  /** 手机号（精确号段） */
  PHONE: /(?<!\d|\.)(?:13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9]|198|199)\d{8}(?!\d)/g,
  /** 邮箱（排除 .png 误报） */
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+(?!\.png)\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?/g,
  /** 身份证号码（15 位旧格式 + 18 位新格式） */
  IDCARD: /(?:\d{6}(?:19|20)(?:0\d|10|11|12)(?:[0-2]\d|30|31)\d{3}$)|(?:\d{6}(?:18|19|20)\d{2}(?:0[1-9]|10|11|12)(?:[0-2]\d|30|31)\d{3}(?:\d|X|x))(?!\d)/g,
  /** URL（http/https/ws/wss/ftp） */
  URL: /(?:https?|wss?|ftp):\/\/(?:(?:[\w-]+\.)+[a-z]{2,}|(?:\d{1,3}\.){3}\d{1,3})(?::\d{2,5})?(?:\/[^\s\>\)\}\<'"]*)?/gi,
  /** JWT Token（引号包裹形式） */
  JWT: /["'](?:ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}|ey[A-Za-z0-9_\/+-]{10,}\.[A-Za-z0-9._\/+-]{10,})["']/g,
  /** 中文公司名 */
  COMPANY: /(?:[\u4e00-\u9fa5\（\）]{4,15}[^的](?:公司|中心)|[\u4e00-\u9fa5\（\）]{2,10}[^的](?:软件)|[\u4e00-\u9fa5]{2,15}(?:科技|集团))(?!法|点|与|查)/g,
  /** Cookie / 会话凭证 */
  COOKIE: /\b\w*(?:token|PHPSESSID|JSESSIONID)\s*[:=]\s*["']?(?!localStorage)(?:[a-zA-Z0-9-._]{4,})["']?/ig,
};

// ─────────────────────────────────────────────
// ID 密钥规则（云厂商 / 开放平台）
// ─────────────────────────────────────────────
export interface NamedKeyPattern {
  name: string;
  pattern: RegExp;
}

export const ID_KEY_PATTERNS: NamedKeyPattern[] = [
  { name: '微信开放平台密钥', pattern: /wx[a-z0-9]{15,18}/g },
  { name: 'AWS密钥', pattern: /AKIA[0-9A-Z]{16}/g },
  { name: '阿里云密钥', pattern: /LTAI[A-Za-z\d]{12,30}/g },
  { name: 'Google API密钥', pattern: /AIza[0-9A-Za-z_\-]{35}/g },
  { name: '腾讯云密钥', pattern: /AKID[A-Za-z\d]{13,40}/g },
  { name: '京东云密钥', pattern: /JDC_[0-9A-Z]{25,40}/g },
  { name: '其他AWS密钥', pattern: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },
  { name: '支付宝开放平台密钥', pattern: /(?:AKLT|AKTP)[a-zA-Z0-9]{35,50}/g },
  { name: 'GitLab Token1', pattern: /glpat-[a-zA-Z0-9\-=_]{20,22}/g },
  { name: 'GitHub Token2', pattern: /(?:ghp|gho|ghu|ghs|ghr|github_pat)_[a-zA-Z0-9_]{36,255}/g },
  { name: 'Apple开发者密钥', pattern: /APID[a-zA-Z0-9]{32,42}/g },
  { name: '企业微信密钥', pattern: /ww[a-z0-9]{15,18}/g },
  { name: 'key1', pattern: /(?:['"]?(?:[\w-]*(?:secret|oss|bucket|key)[\w-]*)|ak["']?)\s*[:=]\s*(?:"(?!\+)[^\,\s\"\(\>\<]{6,}"|'(?!\+)[^\,\s\'\(\>\<]{6,}'|[0-9a-zA-Z_-]{16,})/ig },
  { name: 'key2', pattern: /["'][a-zA-Z0-9]{32}["']/g },
];

/** ID 密钥关键词黑名单 */
export const ID_KEY_BLACKLIST = new Set([
  'size', 'row', 'dict', 'up', 'highlight', 'cabin', 'cross', 'time',
]);

// ─────────────────────────────────────────────
// 用户名 / 密码凭证规则
// ─────────────────────────────────────────────
export const CREDENTIALS_PATTERNS: RegExp[] = [
  /['"]\w*(?:pwd|pass|user|member|account|password|passwd|admin|root|system)[_-]?(?:id|name)?[0-9]*["']\s*[:=]\s*(?:['"][^\,\s\"\(]*["'])/gi,
  /\w*(?:pwd|pass|user|member|account|password|passwd|admin|root|system)[_-]?(?:id|name)?[0-9]*\s*[:=]\s*(?:['"][^\,\s\"\(]*["'])/gi,
  /['"]\w*(?:pwd|pass|user|member|account|password|passwd|admin|root|system)[_-]?(?:id|name)?[0-9]*\s*[:=]\s*(?:[^\,\s\"\(]*)["']/gi,
];

// ─────────────────────────────────────────────
// 误报词黑名单（值黑名单）
// ─────────────────────────────────────────────
export const VALUE_BLACKLIST = {
  /** 短值黑名单（值长度 < 12 时命中即过滤） */
  SHORT_VALUES: new Set([
    'up', 'in', 'by', 'of', 'is', 'on', 'to', 'no',
    'age', 'all', 'app', 'ang', 'bar', 'bea', 'big', 'bug', 'can', 'com', 'con', 'cry', 'dom',
    'dow', 'emp', 'ent', 'eta', 'eye', 'for', 'get', 'gen', 'has', 'hei', 'hid', 'ing', 'int',
    'ken', 'key', 'lea', 'log', 'low', 'met', 'mod', 'new', 'nor', 'not', 'num', 'red', 'obj',
    'old', 'out', 'pic', 'pre', 'pro', 'pop', 'pun', 'put', 'rad', 'ran', 'ref', 'red', 'reg',
    'ren', 'rig', 'row', 'sea', 'set', 'seq', 'shi', 'str', 'sub', 'sup', 'sun', 'tab', 'tan',
    'tip', 'top', 'uri', 'url', 'use', 'ver', 'via', 'rce', 'sum', 'bit', 'kit', 'uid',
  ]),
  /** 中值黑名单（值长度 >= 12 时命中即过滤） */
  MEDIUM_VALUES: new Set([
    'null', 'node', 'when', 'face', 'read', 'load', 'body', 'left', 'mark', 'down',
    'ctrl', 'play', 'ntal', 'head', 'item', 'init', 'hand', 'next', 'nect', 'json',
    'long', 'slid', 'less', 'view', 'html', 'tion', 'rect', 'link', 'char', 'core',
    'turn', 'atom', 'tech', 'type', 'main', 'size', 'time', 'full', 'card', 'more',
    'wrap', 'this', 'tool', 'late', 'note', 'leng', 'area', 'bool', 'pick', 'parm',
    'axis', 'high', 'true', 'date', 'tend', 'work', 'lang', 'func', 'able', 'dark',
    'term', 'info', 'data', 'opts', 'self', 'void', 'pace', 'list', 'brac', 'cret',
    'tive', 'sult', 'text', 'stor', 'back', 'port', 'case', 'pare', 'dent', 'blot',
    'fine', 'reif', 'cord', 'else', 'fail', 'rend', 'leav', 'hint', 'coll', 'move',
    'with', 'base', 'rate', 'name', 'hile', 'lete', 'post', 'pect', 'icon', 'auth',
    'jump', 'wave', 'land', 'wood', 'lize', 'room', 'chat', 'user', 'vice', 'ress',
    'line', 'send', 'mess', 'calc', 'http', 'rame', 'rest', 'last', 'guar', 'iate',
    'ment', 'task', 'stat', 'fill', 'coun', 'faul', 'rece', 'arse', 'exam', 'good',
    'gest', 'word', 'cast', 'lock', 'slot', 'fund', 'plus', 'thre', 'sign', 'pack',
    'reak', 'code', 'tent', 'math', 'lect', 'draw', 'lend', 'glow', 'past', 'blue',
    'dial', 'purp',
  ]),
  /** 长值黑名单（值长度 >= 16 时额外命中即过滤） */
  LONG_VALUES: new Set([
    'about', 'alias', 'apply', 'array', 'basic', 'beare', 'begin', 'black', 'break',
    'broad', 'catch', 'class', 'close', 'clear', 'click', 'clude', 'color', 'count',
    'cover', 'croll', 'crypt', 'error', 'false', 'fault', 'fetch', 'final', 'found',
    'gener', 'green', 'group', 'guard', 'index', 'inner', 'input', 'inter', 'light',
    'login', 'opera', 'param', 'parse', 'panel', 'place', 'print', 'phony', 'radio',
    'range', 'right', 'refer', 'serve', 'share', 'shift', 'style', 'tance', 'title',
    'token', 'tract', 'trans', 'trave', 'valid', 'video', 'white', 'write',

    'button', 'cancel', 'create', 'double', 'finger', 'global', 'insert', 'module',
    'normal', 'object', 'popper', 'triple', 'search', 'select', 'simple', 'single',
    'status', 'statis', 'switch', 'system', 'visual', 'verify', 'detail', 'screen',
    'member', 'change', 'buffer', 'grade',
  ]),
  /** 公司名中文黑名单 */
  CHINESE_BLACKLIST: new Set([
    '请', '输入', '前往', '整个', '常用', '咨询', '为中心', '是否', '以上', '目前', '任务',
    '或者', '推动', '需要', '直接', '识别', '获取', '用于', '清除', '遍历', '使用', '是由',
    '您', '用户', '一家', '项目', '等', '造价', '判断', '通过', '为了', '可以', '掌握',
    '传统', '杀毒', '允许', '分析', '包括', '很多', '接', '未经', '方式', '些', '的', '第三方',
    '因此', '形式', '任何', '提交', '多数', '其他', '执行', '操作', '维护', '或', '其它',
    '分享', '导致', '一概', '所有', '及其', '以及', '应当', '条件', '除非', '否则', '违反',
    '将被', '提供', '无法', '建立', '打造', '帮助', '依法', '鉴于', '快速', '构建', '是', '在',
    '去', '恶意', '挖矿', '流氓', '勒索', '依靠', '基于', '通常', '这', '个', '没有', '并', '、',
    '，', '查看', '确保', '提高', '减少', '检查', '更新', '卸载', '常见', '依赖', '进行', '测试',
    '作弊', ' ',
  ]),
};

/** 判断 URL 是否为需要跳过的第三方 JS 库 */
export function isThirdPartyLibUrl(url: string): boolean {
  const fileName = url.split('/').pop()?.split('?')[0]?.toLowerCase() || '';
  return API_CONFIG.SKIP_JS_PATTERNS.some((p) => p.test(fileName));
}
