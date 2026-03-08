/**
 * 敏感信息匹配正则配置
 * 参考 snoweyes 实现
 */

/** 域名匹配 - HTML 中 */
export const DOMAIN_PATTERN = /(?:https?:\/\/)?(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|net|org|edu|gov|mil|int|co|io|cn|uk|de|jp|fr|au|ru|in|br|it|nl|se|no|es|fi|ch|at|be|dk|cz|pl|pt|kr|hk|tw|sg|my|th|vn|ph|nz|za|mx|ar|cl|pe|info|biz|name|pro|museum|coop|aero|cat|jobs|mobi|travel|asia|tel|xxx|post|bike|clothing|guru|holdings|plumbing|singles|ventures|wien|xyz|club|wang|top|online|site|tech|store|app|dev|cloud|ai|cc|me|tv|us|eu|ca)(?::\d{1,5})?(?:\/[^\s"'<>)}\]]*)?/gi;

/** 域名匹配 - JS资源中 */
export const DOMAIN_RESOURCE_PATTERN = /["'](?:https?:\/\/)?(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|net|org|edu|gov|io|cn|uk|de|jp|fr|au|app|dev|cloud|ai|cc|me|top|xyz|site|tech|store|online|club)(?::\d{1,5})?(?:\/[^\s"'<>)}\]]*)?["']/gi;

/** API路径匹配 */
export const API_PATTERN = /["'][/][a-zA-Z0-9_\-/.]+(?:\/api\/|\/v[0-9]+\/|\/graphql|\/rest\/|\/ajax\/|\/rpc\/|\/query\/|\/search\/|\/auth\/|\/login|\/register|\/upload|\/download|\/export|\/import|\/webhook|\/callback)[a-zA-Z0-9_\-/.]*["']/gi;

/** IP 地址 - HTML 中 */
export const IP_PATTERN = /(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)(?::\d{1,5})?/g;

/** IP 地址 - JS资源中 */
export const IP_RESOURCE_PATTERN = /["'](?:https?:\/\/)?(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)(?::\d{1,5})?(?:\/[^\s"']*)?["']/g;

/** 手机号码 */
export const PHONE_PATTERN = /(?<=[^0-9a-zA-Z])1[3-9]\d{9}(?=[^0-9a-zA-Z])/g;

/** 邮箱地址 */
export const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/** 身份证号码 */
export const IDCARD_PATTERN = /(?<=[^0-9])[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx](?=[^0-9])/g;

/** JWT Token */
export const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;

/** 用户名/密码相关 */
export const CREDENTIALS_PATTERNS = [
  /["']?(?:password|passwd|pwd|secret|token|apikey|api_key|access_key|accesskey|auth_token|authtoken)["']?\s*[:=]\s*["'][^"']{3,}["']/gi,
  /["']?(?:username|user|account|login)["']?\s*[:=]\s*["'][^"']{3,}["']/gi,
];

/** ID/密钥相关 */
export const ID_KEY_PATTERNS = [
  /["']?(?:(?:access|secret|api|app|client|consumer|private|public)[_-]?(?:key|token|secret|id))["']?\s*[:=]\s*["'][A-Za-z0-9_\-./+=]{8,}["']/gi,
  /(?:AKIA|ASIA)[A-Z0-9]{16}/g,
  /(?:sk|pk)(?:_live|_test)_[A-Za-z0-9]{20,}/g,
];

/** 需要跳过的JS库文件名模式 */
export const SKIP_JS_PATTERNS = [
  /jquery[-.]?\d/i,
  /vue[-.]?(?:min|prod)/i,
  /react[-.]?(?:dom|min|prod)/i,
  /angular[-.]?(?:min|core)/i,
  /bootstrap[-.]?\d/i,
  /lodash/i,
  /moment[-.]?(?:min)?/i,
  /axios[-.]?min/i,
  /echarts[-.]?min/i,
  /chart[-.]?(?:min|bundle)/i,
  /d3[-.]?(?:min)?\.js/i,
  /three[-.]?min/i,
  /polyfill/i,
  /babel/i,
  /core-js/i,
  /webpack-runtime/i,
  /vendor[-.]?(?:min|chunk)?/i,
  /chunk-vendors/i,
  /runtime[-.]?(?:min)?/i,
];

/** 常见内网/无效IP前缀 */
export const INVALID_IP_PREFIXES = [
  '0.', '127.', '10.', '172.16.', '172.17.', '172.18.', '172.19.',
  '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
  '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
  '192.168.', '255.', '224.', '169.254.',
];

/** 常见无效域名后缀/模式 */
export const INVALID_DOMAIN_PATTERNS = [
  /\.(?:png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp3|mp4|webm|ogg|wav|avi)$/i,
  /^(?:localhost|example\.com|test\.com|w3\.org|schema\.org|schemas\.microsoft\.com)/i,
  /^(?:\d+\.){3}\d+$/,
  /\.min\.js$/i,
  /\.bundle\.js$/i,
];

/** URL匹配 */
export const URL_PATTERN = /https?:\/\/[^\s"'<>)}\]]+/g;

/** JS文件URL */
export const JS_FILE_PATTERN = /["'](?:[^"']+\.js(?:\?[^\s"']*)?)["']/g;

