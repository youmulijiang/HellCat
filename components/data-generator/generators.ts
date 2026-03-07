import { Faker, zh_CN, en } from '@faker-js/faker';

const faker = new Faker({ locale: [zh_CN, en] });

/** 中国大陆地区代码（省/直辖市） */
const AREA_CODES = [
  '110101', '110102', '110105', '110106', '110107', '110108', '110109', '110111',
  '120101', '120102', '120103', '120104', '120105', '120106',
  '310101', '310104', '310105', '310106', '310107', '310108', '310109', '310110',
  '440103', '440104', '440105', '440106', '440111', '440112', '440113', '440114',
  '330102', '330103', '330104', '330105', '330106', '330108', '330109', '330110',
  '320102', '320104', '320105', '320106', '320111', '320113', '320114', '320115',
  '510104', '510105', '510106', '510107', '510108', '510112', '510113', '510114',
  '500101', '500102', '500103', '500104', '500105', '500106',
  '420102', '420103', '420104', '420105', '420106', '420107', '420111', '420112',
  '430102', '430103', '430104', '430105', '430111', '430112',
];

/** 计算身份证校验位 */
function calcCheckDigit(id17: string): string {
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(id17[i]) * weights[i];
  }
  return checkCodes[sum % 11];
}

/** 生成中国大陆身份证号 */
function generateChineseIdCard(): string {
  const area = AREA_CODES[Math.floor(Math.random() * AREA_CODES.length)];
  const year = 1960 + Math.floor(Math.random() * 45);
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const maxDay = new Date(year, parseInt(month), 0).getDate();
  const day = String(1 + Math.floor(Math.random() * maxDay)).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  const id17 = `${area}${year}${month}${day}${seq}`;
  return id17 + calcCheckDigit(id17);
}

/** 生成中国手机号 */
function generateChinesePhone(): string {
  const prefixes = ['130','131','132','133','134','135','136','137','138','139',
    '150','151','152','153','155','156','157','158','159',
    '170','171','172','173','175','176','177','178',
    '180','181','182','183','184','185','186','187','188','189',
    '191','193','195','196','197','198','199'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  return prefix + suffix;
}

/** 生成中国银行卡号（16-19位） */
function generateBankCard(): string {
  const bins = ['621700', '622202', '622848', '620200', '621661', '622600',
    '625000', '621060', '622150', '621282', '622580', '623058'];
  const bin = bins[Math.floor(Math.random() * bins.length)];
  const len = [16, 17, 18, 19][Math.floor(Math.random() * 4)];
  let card = bin;
  for (let i = bin.length; i < len - 1; i++) {
    card += Math.floor(Math.random() * 10);
  }
  // Luhn 校验位
  let sum = 0;
  let alt = true;
  for (let i = card.length - 1; i >= 0; i--) {
    let n = parseInt(card[i]);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  card += String((10 - (sum % 10)) % 10);
  return card;
}

/** 数据生成器定义 */
export interface GeneratorDef {
  key: string;
  label: string;
  category: string;
  generate: () => string;
}

export const GENERATORS: GeneratorDef[] = [
  // 个人信息
  { key: 'id-card', label: '身份证号', category: '个人信息', generate: generateChineseIdCard },
  { key: 'name', label: '中文姓名', category: '个人信息', generate: () => faker.person.fullName() },
  { key: 'phone', label: '手机号', category: '个人信息', generate: generateChinesePhone },
  { key: 'email', label: '邮箱地址', category: '个人信息', generate: () => faker.internet.email() },
  { key: 'username', label: '用户名', category: '个人信息', generate: () => faker.internet.username() },
  { key: 'password', label: '密码', category: '个人信息', generate: () => faker.internet.password({ length: 16 }) },
  { key: 'address', label: '地址', category: '个人信息', generate: () => faker.location.streetAddress({ useFullAddress: true }) },
  { key: 'company', label: '公司名称', category: '个人信息', generate: () => faker.company.name() },

  // 网络信息
  { key: 'ipv4', label: 'IPv4 地址', category: '网络信息', generate: () => faker.internet.ipv4() },
  { key: 'ipv4-private', label: '内网 IPv4', category: '网络信息', generate: () => faker.internet.ipv4({ network: 'private-a' }) },
  { key: 'ipv6', label: 'IPv6 地址', category: '网络信息', generate: () => faker.internet.ipv6() },
  { key: 'mac', label: 'MAC 地址', category: '网络信息', generate: () => faker.internet.mac() },
  { key: 'url', label: 'URL', category: '网络信息', generate: () => faker.internet.url() },
  { key: 'domain', label: '域名', category: '网络信息', generate: () => faker.internet.domainName() },
  { key: 'user-agent', label: 'User-Agent', category: '网络信息', generate: () => faker.internet.userAgent() },
  { key: 'port', label: '端口号', category: '网络信息', generate: () => String(faker.internet.port()) },

  // 金融信息
  { key: 'bank-card', label: '银行卡号', category: '金融信息', generate: generateBankCard },
  { key: 'credit-card', label: '信用卡号', category: '金融信息', generate: () => faker.finance.creditCardNumber() },
  { key: 'credit-card-cvv', label: 'CVV', category: '金融信息', generate: () => faker.finance.creditCardCVV() },
  { key: 'iban', label: 'IBAN', category: '金融信息', generate: () => faker.finance.iban() },
  { key: 'bitcoin', label: 'BTC 地址', category: '金融信息', generate: () => faker.finance.bitcoinAddress() },
  { key: 'ethereum', label: 'ETH 地址', category: '金融信息', generate: () => faker.finance.ethereumAddress() },
  { key: 'amount', label: '金额', category: '金融信息', generate: () => faker.finance.amount({ min: 1, max: 100000, dec: 2, symbol: '¥' }) },

  // 其他
  { key: 'uuid', label: 'UUID', category: '其他', generate: () => faker.string.uuid() },
  { key: 'jwt', label: 'JWT Token', category: '其他', generate: () => faker.internet.jwt() },
  { key: 'color-hex', label: '颜色 HEX', category: '其他', generate: () => faker.color.rgb() },
  { key: 'date', label: '日期', category: '其他', generate: () => faker.date.past().toISOString().split('T')[0] },
  { key: 'datetime', label: '日期时间', category: '其他', generate: () => faker.date.past().toISOString() },
  { key: 'lorem', label: '随机文本', category: '其他', generate: () => faker.lorem.sentence() },
];

/** 获取所有分类 */
export function getCategories(): string[] {
  return [...new Set(GENERATORS.map((g) => g.category))];
}

/** 批量生成数据 */
export function batchGenerate(generatorKey: string, count: number): string[] {
  const gen = GENERATORS.find((g) => g.key === generatorKey);
  if (!gen) return [];
  return Array.from({ length: count }, () => gen.generate());
}

