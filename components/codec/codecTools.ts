import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';
import { SignJWT, jwtVerify, decodeJwt, decodeProtectedHeader } from 'jose';

/** 工具分类 */
export type CodecCategory = 'encoding' | 'hash' | 'symmetric' | 'asymmetric' | 'jwt';

/** 工具定义 */
export interface CodecTool {
  key: string;
  label: string;
  category: CodecCategory;
  /** 是否需要密钥 */
  needKey?: boolean;
  /** 是否需要 IV */
  needIV?: boolean;
  /** 是否为单向（不可解码/解密） */
  oneWay?: boolean;
  /** 是否需要公钥/私钥 */
  needKeyPair?: boolean;
  encode: (input: string, key?: string, iv?: string) => string | Promise<string>;
  decode?: (input: string, key?: string, iv?: string) => string | Promise<string>;
}

// ==================== 编码工具 ====================

const base64Tool: CodecTool = {
  key: 'base64', label: 'Base64', category: 'encoding',
  encode: (input) => btoa(unescape(encodeURIComponent(input))),
  decode: (input) => decodeURIComponent(escape(atob(input))),
};

const urlTool: CodecTool = {
  key: 'url', label: 'URL Encode', category: 'encoding',
  encode: (input) => encodeURIComponent(input),
  decode: (input) => decodeURIComponent(input),
};

const hexTool: CodecTool = {
  key: 'hex', label: 'Hex', category: 'encoding',
  encode: (input) => Array.from(new TextEncoder().encode(input)).map(b => b.toString(16).padStart(2, '0')).join(' '),
  decode: (input) => new TextDecoder().decode(new Uint8Array(input.trim().split(/\s+/).map(h => parseInt(h, 16)))),
};

const unicodeTool: CodecTool = {
  key: 'unicode', label: 'Unicode', category: 'encoding',
  encode: (input) => Array.from(input).map(c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`).join(''),
  decode: (input) => input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))),
};

const htmlEntityTool: CodecTool = {
  key: 'html-entity', label: 'HTML Entity', category: 'encoding',
  encode: (input) => input.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c)),
  decode: (input) => input.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
};

// ==================== 哈希工具 ====================

const md5Tool: CodecTool = {
  key: 'md5', label: 'MD5', category: 'hash', oneWay: true,
  encode: (input) => CryptoJS.MD5(input).toString(),
};

const sha1Tool: CodecTool = {
  key: 'sha1', label: 'SHA-1', category: 'hash', oneWay: true,
  encode: (input) => CryptoJS.SHA1(input).toString(),
};

const sha256Tool: CodecTool = {
  key: 'sha256', label: 'SHA-256', category: 'hash', oneWay: true,
  encode: (input) => CryptoJS.SHA256(input).toString(),
};

const sha512Tool: CodecTool = {
  key: 'sha512', label: 'SHA-512', category: 'hash', oneWay: true,
  encode: (input) => CryptoJS.SHA512(input).toString(),
};

const hmacMd5Tool: CodecTool = {
  key: 'hmac-md5', label: 'HMAC-MD5', category: 'hash', oneWay: true, needKey: true,
  encode: (input, key = '') => CryptoJS.HmacMD5(input, key).toString(),
};

const hmacSha256Tool: CodecTool = {
  key: 'hmac-sha256', label: 'HMAC-SHA256', category: 'hash', oneWay: true, needKey: true,
  encode: (input, key = '') => CryptoJS.HmacSHA256(input, key).toString(),
};

// ==================== 对称加密 ====================

const aesTool: CodecTool = {
  key: 'aes', label: 'AES', category: 'symmetric', needKey: true, needIV: true,
  encode: (input, key = '', iv = '') => {
    const k = CryptoJS.enc.Utf8.parse(key.padEnd(16, '\0').slice(0, 16));
    const i = CryptoJS.enc.Utf8.parse(iv.padEnd(16, '\0').slice(0, 16));
    return CryptoJS.AES.encrypt(input, k, { iv: i, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).toString();
  },
  decode: (input, key = '', iv = '') => {
    const k = CryptoJS.enc.Utf8.parse(key.padEnd(16, '\0').slice(0, 16));
    const i = CryptoJS.enc.Utf8.parse(iv.padEnd(16, '\0').slice(0, 16));
    return CryptoJS.AES.decrypt(input, k, { iv: i, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).toString(CryptoJS.enc.Utf8);
  },
};

const desTool: CodecTool = {
  key: 'des', label: 'DES', category: 'symmetric', needKey: true, needIV: true,
  encode: (input, key = '', iv = '') => {
    const k = CryptoJS.enc.Utf8.parse(key.padEnd(8, '\0').slice(0, 8));
    const i = CryptoJS.enc.Utf8.parse(iv.padEnd(8, '\0').slice(0, 8));
    return CryptoJS.DES.encrypt(input, k, { iv: i, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).toString();
  },
  decode: (input, key = '', iv = '') => {
    const k = CryptoJS.enc.Utf8.parse(key.padEnd(8, '\0').slice(0, 8));
    const i = CryptoJS.enc.Utf8.parse(iv.padEnd(8, '\0').slice(0, 8));
    return CryptoJS.DES.decrypt(input, k, { iv: i, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).toString(CryptoJS.enc.Utf8);
  },
};

const tripleDesTool: CodecTool = {
  key: '3des', label: '3DES', category: 'symmetric', needKey: true, needIV: true,
  encode: (input, key = '', iv = '') => {
    const k = CryptoJS.enc.Utf8.parse(key.padEnd(24, '\0').slice(0, 24));
    const i = CryptoJS.enc.Utf8.parse(iv.padEnd(8, '\0').slice(0, 8));
    return CryptoJS.TripleDES.encrypt(input, k, { iv: i, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).toString();
  },
  decode: (input, key = '', iv = '') => {
    const k = CryptoJS.enc.Utf8.parse(key.padEnd(24, '\0').slice(0, 24));
    const i = CryptoJS.enc.Utf8.parse(iv.padEnd(8, '\0').slice(0, 8));
    return CryptoJS.TripleDES.decrypt(input, k, { iv: i, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).toString(CryptoJS.enc.Utf8);
  },
};

const rc4Tool: CodecTool = {
  key: 'rc4', label: 'RC4', category: 'symmetric', needKey: true,
  encode: (input, key = '') => CryptoJS.RC4.encrypt(input, key).toString(),
  decode: (input, key = '') => CryptoJS.RC4.decrypt(input, key).toString(CryptoJS.enc.Utf8),
};



// ==================== 非对称加密 ====================

const rsaTool: CodecTool = {
  key: 'rsa', label: 'RSA', category: 'asymmetric', needKeyPair: true,
  encode: (input, publicKey = '') => {
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    return encrypt.encrypt(input) || 'Encryption failed (check public key)';
  },
  decode: (input, privateKey = '') => {
    const decrypt = new JSEncrypt();
    decrypt.setPrivateKey(privateKey);
    return decrypt.decrypt(input) || 'Decryption failed (check private key)';
  },
};

// ==================== JWT ====================

/** 将字符串转为 Uint8Array 密钥（用于 HMAC 签名） */
function textToSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/**
 * JWT 签名工具
 * Input：JSON 格式的 payload（如 {"sub":"1234","name":"test"}）
 * Key：HMAC Secret（用于 HS256/HS384/HS512 签名）
 * Encode：生成签名后的 JWT Token
 * Decode：解析 JWT Token 为 Header + Payload（无需密钥），如有密钥则同时验证签名
 */
const jwtTool: CodecTool = {
  key: 'jwt', label: 'JWT (HS256)', category: 'jwt', needKey: true,
  encode: async (input, key = '') => {
    if (!key) throw new Error('请输入 Secret Key 用于签名');
    const payload = JSON.parse(input);
    const secret = textToSecret(key);
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .sign(secret);
    return token;
  },
  decode: async (input, key = '') => {
    const token = input.trim();
    // 先解析 Header 和 Payload（不验证签名）
    const header = decodeProtectedHeader(token);
    const payload = decodeJwt(token);

    const parts: string[] = [
      '=== HEADER ===',
      JSON.stringify(header, null, 2),
      '',
      '=== PAYLOAD ===',
      JSON.stringify(payload, null, 2),
    ];

    // 如果提供了密钥，尝试验证签名
    if (key) {
      try {
        const secret = textToSecret(key);
        const { protectedHeader } = await jwtVerify(token, secret);
        parts.push('', '=== SIGNATURE ===', `✅ 签名验证通过 (alg: ${protectedHeader.alg})`);
      } catch (err) {
        parts.push('', '=== SIGNATURE ===', `❌ 签名验证失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      parts.push('', '=== SIGNATURE ===', '⚠️ 未提供 Secret Key，跳过签名验证');
    }

    return parts.join('\n');
  },
};

const jwtHs384Tool: CodecTool = {
  key: 'jwt-hs384', label: 'JWT (HS384)', category: 'jwt', needKey: true,
  encode: async (input, key = '') => {
    if (!key) throw new Error('请输入 Secret Key 用于签名');
    const payload = JSON.parse(input);
    const secret = textToSecret(key);
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS384', typ: 'JWT' })
      .setIssuedAt()
      .sign(secret);
    return token;
  },
  decode: async (input, key = '') => {
    const token = input.trim();
    const header = decodeProtectedHeader(token);
    const payload = decodeJwt(token);
    const parts: string[] = [
      '=== HEADER ===', JSON.stringify(header, null, 2),
      '', '=== PAYLOAD ===', JSON.stringify(payload, null, 2),
    ];
    if (key) {
      try {
        const secret = textToSecret(key);
        const { protectedHeader } = await jwtVerify(token, secret);
        parts.push('', '=== SIGNATURE ===', `✅ 签名验证通过 (alg: ${protectedHeader.alg})`);
      } catch (err) {
        parts.push('', '=== SIGNATURE ===', `❌ 签名验证失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      parts.push('', '=== SIGNATURE ===', '⚠️ 未提供 Secret Key，跳过签名验证');
    }
    return parts.join('\n');
  },
};

const jwtHs512Tool: CodecTool = {
  key: 'jwt-hs512', label: 'JWT (HS512)', category: 'jwt', needKey: true,
  encode: async (input, key = '') => {
    if (!key) throw new Error('请输入 Secret Key 用于签名');
    const payload = JSON.parse(input);
    const secret = textToSecret(key);
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS512', typ: 'JWT' })
      .setIssuedAt()
      .sign(secret);
    return token;
  },
  decode: async (input, key = '') => {
    const token = input.trim();
    const header = decodeProtectedHeader(token);
    const payload = decodeJwt(token);
    const parts: string[] = [
      '=== HEADER ===', JSON.stringify(header, null, 2),
      '', '=== PAYLOAD ===', JSON.stringify(payload, null, 2),
    ];
    if (key) {
      try {
        const secret = textToSecret(key);
        const { protectedHeader } = await jwtVerify(token, secret);
        parts.push('', '=== SIGNATURE ===', `✅ 签名验证通过 (alg: ${protectedHeader.alg})`);
      } catch (err) {
        parts.push('', '=== SIGNATURE ===', `❌ 签名验证失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      parts.push('', '=== SIGNATURE ===', '⚠️ 未提供 Secret Key，跳过签名验证');
    }
    return parts.join('\n');
  },
};

// ==================== 导出 ====================

export const CODEC_CATEGORIES: { key: CodecCategory; label: string }[] = [
  { key: 'encoding', label: '编码/解码' },
  { key: 'hash', label: '哈希摘要' },
  { key: 'symmetric', label: '对称加密' },
  { key: 'asymmetric', label: '非对称加密' },
  { key: 'jwt', label: 'JWT' },
];

export const ALL_CODEC_TOOLS: CodecTool[] = [
  base64Tool, urlTool, hexTool, unicodeTool, htmlEntityTool,
  md5Tool, sha1Tool, sha256Tool, sha512Tool, hmacMd5Tool, hmacSha256Tool,
  aesTool, desTool, tripleDesTool, rc4Tool,
  rsaTool,
  jwtTool, jwtHs384Tool, jwtHs512Tool,
];