/**
 * 预设注入脚本 —— 安全测试常用 Hook / 绕过脚本
 */

export interface PresetScript {
  /** 唯一标识 */
  key: string;
  /** 国际化显示名称 key */
  labelKey:
    | 'popup.inject.presets.hookCryptoJs.label'
    | 'popup.inject.presets.hookJsEncrypt.label'
    | 'popup.inject.presets.forceF12.label';
  /** 国际化简短描述 key */
  descriptionKey:
    | 'popup.inject.presets.hookCryptoJs.description'
    | 'popup.inject.presets.hookJsEncrypt.description'
    | 'popup.inject.presets.forceF12.description';
  /** 注入的 JS 代码 */
  code: string;
}

/* ------------------------------------------------------------------ */
/*  1. Hook CryptoJS 加密方法                                          */
/* ------------------------------------------------------------------ */
const HOOK_CRYPTO_JS = `(function () {
  'use strict';

  const TAG = '[Hellcat CryptoJS Hook]';

  function waitForCryptoJS(cb, maxRetry) {
    maxRetry = maxRetry || 50;
    var retry = 0;
    var timer = setInterval(function () {
      if (typeof window.CryptoJS !== 'undefined') {
        clearInterval(timer);
        cb(window.CryptoJS);
      } else if (++retry >= maxRetry) {
        clearInterval(timer);
        console.warn(TAG, 'CryptoJS not found after', maxRetry, 'retries');
      }
    }, 200);
  }

  function wrapMethod(obj, path, methodName) {
    var original = obj[methodName];
    if (typeof original !== 'function') return;

    obj[methodName] = function () {
      var args = Array.prototype.slice.call(arguments);
      var result = original.apply(this, args);

      console.groupCollapsed(TAG + ' ' + path + '.' + methodName);
      console.log('Input :', args[0] && args[0].toString ? args[0].toString() : args[0]);
      if (args[1]) console.log('Key   :', args[1] && args[1].toString ? args[1].toString() : args[1]);
      if (args[2]) console.log('Config:', args[2]);
      console.log('Output:', result && result.toString ? result.toString() : result);
      console.groupEnd();
      return result;
    };
  }

  waitForCryptoJS(function (CryptoJS) {
    // AES / DES / TripleDES / Rabbit / RC4
    var ciphers = ['AES', 'DES', 'TripleDES', 'Rabbit', 'RC4'];
    ciphers.forEach(function (name) {
      if (CryptoJS[name]) {
        wrapMethod(CryptoJS[name], 'CryptoJS.' + name, 'encrypt');
        wrapMethod(CryptoJS[name], 'CryptoJS.' + name, 'decrypt');
      }
    });

    // Hash: MD5 / SHA1 / SHA256 / SHA512 / SHA3 / RIPEMD160
    var hashes = ['MD5', 'SHA1', 'SHA256', 'SHA512', 'SHA3', 'RIPEMD160'];
    hashes.forEach(function (name) {
      if (typeof CryptoJS[name] === 'function') {
        var orig = CryptoJS[name];
        CryptoJS[name] = function () {
          var args = Array.prototype.slice.call(arguments);
          var result = orig.apply(this, args);
          console.groupCollapsed(TAG + ' CryptoJS.' + name);
          console.log('Input :', args[0] && args[0].toString ? args[0].toString() : args[0]);
          console.log('Output:', result.toString());
          console.groupEnd();
          return result;
        };
      }
    });

    // HmacMD5 / HmacSHA1 / HmacSHA256 / HmacSHA512
    var hmacs = ['HmacMD5', 'HmacSHA1', 'HmacSHA256', 'HmacSHA512'];
    hmacs.forEach(function (name) {
      if (typeof CryptoJS[name] === 'function') {
        var orig = CryptoJS[name];
        CryptoJS[name] = function () {
          var args = Array.prototype.slice.call(arguments);
          var result = orig.apply(this, args);
          console.groupCollapsed(TAG + ' CryptoJS.' + name);
          console.log('Message:', args[0] && args[0].toString ? args[0].toString() : args[0]);
          console.log('Key    :', args[1] && args[1].toString ? args[1].toString() : args[1]);
          console.log('Output :', result.toString());
          console.groupEnd();
          return result;
        };
      }
    });

    // enc.Base64 / enc.Hex / enc.Utf8
    if (CryptoJS.enc) {
      ['Base64', 'Hex', 'Utf8'].forEach(function (enc) {
        if (CryptoJS.enc[enc] && typeof CryptoJS.enc[enc].stringify === 'function') {
          var origStringify = CryptoJS.enc[enc].stringify;
          CryptoJS.enc[enc].stringify = function (wordArray) {
            var result = origStringify.call(this, wordArray);
            console.log(TAG, 'enc.' + enc + '.stringify =>', result);
            return result;
          };
        }
      });
    }

    console.log(TAG, 'All hooks installed successfully');
  });
}());`;

/* ------------------------------------------------------------------ */
/*  2. Hook JSEncrypt (RSA) 加密方法                                    */
/* ------------------------------------------------------------------ */
const HOOK_JSENCRYPT = `(function () {
  'use strict';

  const TAG = '[Hellcat JSEncrypt Hook]';

  function waitForJSEncrypt(cb, maxRetry) {
    maxRetry = maxRetry || 50;
    var retry = 0;
    var timer = setInterval(function () {
      if (typeof window.JSEncrypt !== 'undefined') {
        clearInterval(timer);
        cb(window.JSEncrypt);
      } else if (++retry >= maxRetry) {
        clearInterval(timer);
        console.warn(TAG, 'JSEncrypt not found after', maxRetry, 'retries');
      }
    }, 200);
  }

  waitForJSEncrypt(function (JSEncrypt) {
    var proto = JSEncrypt.prototype;

    // Hook encrypt
    var origEncrypt = proto.encrypt;
    proto.encrypt = function (message) {
      var result = origEncrypt.call(this, message);
      console.groupCollapsed(TAG + ' encrypt');
      console.log('Plaintext :', message);
      console.log('PublicKey  :', this.getPublicKey && this.getPublicKey());
      console.log('Ciphertext:', result);
      console.groupEnd();
      return result;
    };

    // Hook decrypt
    var origDecrypt = proto.decrypt;
    proto.decrypt = function (ciphertext) {
      var result = origDecrypt.call(this, ciphertext);
      console.groupCollapsed(TAG + ' decrypt');
      console.log('Ciphertext:', ciphertext);
      console.log('Plaintext :', result);
      console.groupEnd();
      return result;
    };

    // Hook setPublicKey / setPrivateKey
    var origSetPub = proto.setPublicKey;
    proto.setPublicKey = function (key) {
      console.log(TAG, 'setPublicKey:', key);
      return origSetPub.call(this, key);
    };

    var origSetPriv = proto.setPrivateKey;
    proto.setPrivateKey = function (key) {
      console.log(TAG, 'setPrivateKey:', key);
      return origSetPriv.call(this, key);
    };

    console.log(TAG, 'All hooks installed successfully');
  });
}());`;

/* ------------------------------------------------------------------ */
/*  3. 强制开启 F12 / 禁用反调试                                       */
/* ------------------------------------------------------------------ */
const FORCE_ENABLE_F12 = `(function () {
  'use strict';

  const TAG = '[Hellcat F12 Unlocker]';

  // 1. 阻止右键菜单被禁用
  document.addEventListener('contextmenu', function (e) { e.stopPropagation(); }, true);

  // 2. 阻止常见禁用快捷键的 keydown handler
  document.addEventListener('keydown', function (e) {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) { e.stopPropagation(); return; }
    // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && ['I','J','C'].indexOf(e.key.toUpperCase()) !== -1) { e.stopPropagation(); return; }
    // Ctrl+U (查看源码)
    if (e.ctrlKey && e.key.toUpperCase() === 'U') { e.stopPropagation(); return; }
  }, true);

  // 3. 覆盖 onkeydown / oncontextmenu
  try {
    Object.defineProperty(document, 'onkeydown', { get: function () { return null; }, set: function () {}, configurable: true });
    Object.defineProperty(document, 'oncontextmenu', { get: function () { return null; }, set: function () {}, configurable: true });
  } catch (_) {}

  // 4. 反 debugger：用 Function.prototype 的 constructor 拦截 debugger 语句
  (function antiDebugger() {
    var _origConstructor = Function.prototype.constructor;
    Function.prototype.constructor = function () {
      var args = Array.prototype.slice.call(arguments);
      // 检测并移除 debugger 语句
      if (args.length > 0 && typeof args[args.length - 1] === 'string') {
        args[args.length - 1] = args[args.length - 1].replace(/debugger/gi, '');
      }
      return _origConstructor.apply(this, args);
    };
  })();

  // 5. 重写 setInterval / setTimeout 中可能注入的 debugger
  var _origSetInterval = window.setInterval;
  window.setInterval = function (fn, delay) {
    if (typeof fn === 'string' && fn.indexOf('debugger') !== -1) {
      console.log(TAG, 'Blocked debugger in setInterval');
      return _origSetInterval(function () {}, delay);
    }
    if (typeof fn === 'function') {
      var fnStr = fn.toString();
      if (fnStr.indexOf('debugger') !== -1) {
        console.log(TAG, 'Blocked debugger function in setInterval');
        return _origSetInterval(function () {}, delay);
      }
    }
    return _origSetInterval.apply(this, arguments);
  };

  var _origSetTimeout = window.setTimeout;
  window.setTimeout = function (fn, delay) {
    if (typeof fn === 'string' && fn.indexOf('debugger') !== -1) {
      console.log(TAG, 'Blocked debugger in setTimeout');
      return _origSetTimeout(function () {}, delay);
    }
    if (typeof fn === 'function') {
      var fnStr = fn.toString();
      if (fnStr.indexOf('debugger') !== -1) {
        console.log(TAG, 'Blocked debugger function in setTimeout');
        return _origSetTimeout(function () {}, delay);
      }
    }
    return _origSetTimeout.apply(this, arguments);
  };

  // 6. 阻止 eval 中的 debugger
  var _origEval = window.eval;
  window.eval = function (code) {
    if (typeof code === 'string') {
      code = code.replace(/debugger/gi, '');
    }
    return _origEval.call(this, code);
  };

  // 7. 阻止通过 console.clear 清除控制台
  var _origClear = console.clear;
  console.clear = function () {
    console.log(TAG, 'console.clear() was blocked');
  };

  console.log(TAG, 'F12 & DevTools protection bypassed');
}());`;

/* ================================================================== */
/*  导出预设脚本列表                                                    */
/* ================================================================== */
export const PRESET_SCRIPTS: PresetScript[] = [
  {
    key: 'hook-cryptojs',
    labelKey: 'popup.inject.presets.hookCryptoJs.label',
    descriptionKey: 'popup.inject.presets.hookCryptoJs.description',
    code: HOOK_CRYPTO_JS,
  },
  {
    key: 'hook-jsencrypt',
    labelKey: 'popup.inject.presets.hookJsEncrypt.label',
    descriptionKey: 'popup.inject.presets.hookJsEncrypt.description',
    code: HOOK_JSENCRYPT,
  },
  {
    key: 'force-f12',
    labelKey: 'popup.inject.presets.forceF12.label',
    descriptionKey: 'popup.inject.presets.forceF12.description',
    code: FORCE_ENABLE_F12,
  },
];
