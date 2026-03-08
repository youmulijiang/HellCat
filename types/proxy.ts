/** 代理协议类型 */
export type ProxyScheme = 'http' | 'https' | 'socks4' | 'socks5';

/** 代理模式 */
export type ProxyMode = 'direct' | 'system' | 'fixed_servers' | 'pac_script';

/** 代理服务器配置 */
export interface ProxyServer {
  scheme: ProxyScheme;
  host: string;
  port: number;
  username?: string;
  password?: string;
}

/** 代理配置文件 */
export interface ProxyProfile {
  id: string;
  name: string;
  color: string;
  server: ProxyServer;
  /** 绕过代理的域名列表 */
  bypassList: string[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

/** 全局代理设置 */
export interface ProxyGlobalSettings {
  /** 当前激活的模式 */
  mode: ProxyMode;
  /** 当前激活的代理配置 ID（fixed_servers 模式下） */
  activeProfileId: string | null;
  /** PAC 脚本 URL（pac_script 模式下） */
  pacScriptUrl?: string;
  /** PAC 脚本内容（pac_script 模式下） */
  pacScriptData?: string;
}

/** 默认端口映射 */
export const DEFAULT_PORTS: Record<ProxyScheme, number> = {
  http: 80,
  https: 443,
  socks4: 1080,
  socks5: 1080,
};

/** 预设颜色 */
export const PROFILE_COLORS = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d',
  '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16',
];

