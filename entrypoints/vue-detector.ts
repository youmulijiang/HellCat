/**
 * Vue Detector - 注入到页面 main world 的脚本
 * 用于检测 Vue 实例、提取路由、清除路由守卫和修改路由鉴权
 */
export default defineUnlistedScript(() => {
  // ======== 工具函数 ========

  /** BFS 查找 Vue 根节点 */
  function findVueRoot(root: Node, maxDepth = 1000): HTMLElement | null {
    const queue: { node: Node; depth: number }[] = [{ node: root, depth: 0 }];
    while (queue.length) {
      const { node, depth } = queue.shift()!;
      if (depth > maxDepth) break;
      const el = node as any;
      if (el.__vue_app__ || el.__vue__ || el._vnode) return el;
      if (node.nodeType === 1 && node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          queue.push({ node: node.childNodes[i], depth: depth + 1 });
        }
      }
    }
    return null;
  }

  /** 获取 Vue 版本 */
  function getVueVersion(vueRoot: any): string {
    let version =
      vueRoot.__vue_app__?.version ||
      vueRoot.__vue__?.$root?.$options?._base?.version;
    if (!version || version === 'unknown') {
      const w = window as any;
      if (w.Vue?.version) version = w.Vue.version;
      else if (w.__VUE_DEVTOOLS_GLOBAL_HOOK__?.Vue)
        version = w.__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue.version;
    }
    return version || 'unknown';
  }

  /** 定位 Vue Router 实例 */
  function findVueRouter(vueRoot: any): any {
    try {
      if (vueRoot.__vue_app__) {
        const app = vueRoot.__vue_app__;
        if (app.config?.globalProperties?.$router) return app.config.globalProperties.$router;
        const inst = app._instance;
        if (inst?.appContext?.config?.globalProperties?.$router)
          return inst.appContext.config.globalProperties.$router;
        if (inst?.ctx?.$router) return inst.ctx.$router;
      }
      if (vueRoot.__vue__) {
        const vue = vueRoot.__vue__;
        return vue.$router || vue.$root?.$router || vue.$root?.$options?.router || vue._router;
      }
    } catch {}
    return null;
  }

  /** 判断 meta 字段是否表示需要鉴权 */
  function isAuthTrue(val: any): boolean {
    return val === true || val === 'true' || val === 1 || val === '1';
  }

  /** 路径拼接 */
  function joinPath(base: string, path: string): string {
    if (!path) return base || '/';
    if (path.startsWith('/')) return path;
    if (!base || base === '/') return '/' + path;
    return (base.endsWith('/') ? base.slice(0, -1) : base) + '/' + path;
  }

  /** 遍历路由树 */
  function walkRoutes(routes: any[], cb: (r: any) => void) {
    if (!Array.isArray(routes)) return;
    routes.forEach((r) => {
      cb(r);
      if (Array.isArray(r.children) && r.children.length) walkRoutes(r.children, cb);
    });
  }

  /** 提取 Router base */
  function extractRouterBase(router: any): string {
    try {
      return router.options?.base || router.history?.base || '';
    } catch {
      return '';
    }
  }

  // ======== 消息发送 ========

  function sendDetectionResult(result: any) {
    window.postMessage({ type: 'VUE_DETECTION_RESULT', result }, '*');
  }

  function sendRouterResult(result: any) {
    // 安全序列化
    const safe = safeSerialize(result);
    window.postMessage({ type: 'VUE_ROUTER_ANALYSIS_RESULT', result: safe }, '*');
  }

  function sendError(error: string) {
    window.postMessage({ type: 'VUE_ROUTER_ANALYSIS_ERROR', error }, '*');
  }

  /** 安全序列化，去除不可序列化属性 */
  function safeSerialize(obj: any): any {
    if (obj == null || typeof obj !== 'object') return obj;
    if (typeof obj === 'function') return '[Function]';
    const out: any = Array.isArray(obj) ? [] : {};
    try {
      for (const key in obj) {
        if (!obj.hasOwnProperty?.(key)) continue;
        if (key.startsWith('_') || key.startsWith('$') || key === 'parent' || key === 'router' || key === 'matched') continue;
        const v = obj[key];
        if (typeof v === 'function' || v instanceof Promise) continue;
        if (Array.isArray(v)) {
          out[key] = v.map((item: any) => {
            if (item && typeof item === 'object') {
              return { name: item.name || '', path: item.path || '', meta: simplifyMeta(item.meta) };
            }
            return item;
          });
        } else if (typeof v === 'object' && v !== null) {
          if (key === 'meta') out[key] = simplifyMeta(v);
          else out[key] = '[Object]';
        } else {
          out[key] = v;
        }
      }
    } catch { return '[Serialization Error]'; }
    return out;
  }

  function simplifyMeta(meta: any): Record<string, any> {
    if (!meta || typeof meta !== 'object') return {};
    const out: any = {};
    try {
      for (const k in meta) {
        if (meta.hasOwnProperty?.(k)) {
          const v = meta[k];
          if (typeof v === 'function' || typeof v === 'object') continue;
          out[k] = v;
        }
      }
    } catch {}
    return out;
  }

  // ======== 路由操作 ========

  /** 修改路由 auth meta */
  function patchAllRouteAuth(router: any): { path: string; name: string }[] {
    const modified: { path: string; name: string }[] = [];
    function patchMeta(route: any) {
      if (route.meta && typeof route.meta === 'object') {
        Object.keys(route.meta).forEach((key) => {
          if (key.toLowerCase().includes('auth') && isAuthTrue(route.meta[key])) {
            route.meta[key] = false;
            modified.push({ path: route.path, name: route.name });
          }
        });
      }
    }
    try {
      if (typeof router.getRoutes === 'function') router.getRoutes().forEach(patchMeta);
      else if (router.options?.routes) walkRoutes(router.options.routes, patchMeta);
      else if (router.matcher?.getRoutes) router.matcher.getRoutes().forEach(patchMeta);
    } catch {}
    return modified;
  }

  /** 清除路由守卫 */
  function patchRouterGuards(router: any) {
    try {
      ['beforeEach', 'beforeResolve', 'afterEach'].forEach((hook) => {
        if (typeof router[hook] === 'function') router[hook] = () => {};
      });
      ['beforeGuards', 'beforeResolveGuards', 'afterGuards', 'beforeHooks', 'resolveHooks', 'afterHooks'].forEach((prop) => {
        if (Array.isArray(router[prop])) router[prop].length = 0;
      });
    } catch {}
  }

  /** 列出所有路由 */
  function listAllRoutes(router: any): { name: string; path: string; meta: any }[] {
    const list: { name: string; path: string; meta: any }[] = [];
    try {
      if (typeof router.getRoutes === 'function') {
        router.getRoutes().forEach((r: any) => list.push({ name: r.name, path: r.path, meta: r.meta }));
      } else if (router.options?.routes) {
        (function traverse(routes: any[], basePath = '') {
          routes.forEach((r: any) => {
            const fp = joinPath(basePath, r.path);
            list.push({ name: r.name, path: fp, meta: r.meta });
            if (Array.isArray(r.children)) traverse(r.children, fp);
          });
        })(router.options.routes);
      } else if (router.matcher?.getRoutes) {
        router.matcher.getRoutes().forEach((r: any) => list.push({ name: r.name, path: r.path, meta: r.meta }));
      }
    } catch {}
    return list;
  }

  // ======== 页面链接分析 ========

  /** 分析页面中的 <a> 链接，推断公共 base path */
  function analyzePageLinks(): { detectedBasePath: string; commonPrefixes: { prefix: string; count: number }[] } {
    const result = { detectedBasePath: '', commonPrefixes: [] as { prefix: string; count: number }[] };
    try {
      const links = Array.from(document.querySelectorAll('a[href]'))
        .map((a) => a.getAttribute('href'))
        .filter((href): href is string =>
          !!href && href.startsWith('/') && !href.startsWith('//') && !href.includes('.'),
        );
      if (links.length < 3) return result;

      const firstSegments: Record<string, number> = {};
      links.forEach((link) => {
        const seg = link.split('/').filter(Boolean)[0];
        if (seg) firstSegments[seg] = (firstSegments[seg] || 0) + 1;
      });

      const sorted = Object.entries(firstSegments)
        .sort((a, b) => b[1] - a[1])
        .map(([prefix, count]) => ({ prefix, count }));
      result.commonPrefixes = sorted;

      if (sorted.length > 0 && sorted[0].count / links.length > 0.6) {
        result.detectedBasePath = '/' + sorted[0].prefix;
      }
    } catch {}
    return result;
  }

  // ======== 完整分析 ========

  function performFullAnalysis() {
    const result: any = {
      vueDetected: false, vueVersion: null, routerDetected: false,
      modifiedRoutes: [], allRoutes: [], routerBase: '', currentPath: window.location.pathname,
      pageAnalysis: { detectedBasePath: '', commonPrefixes: [] },
    };
    try {
      const vueRoot = findVueRoot(document.body);
      if (!vueRoot) return result;
      result.vueDetected = true;

      const router = findVueRouter(vueRoot);
      if (!router) return result;
      result.routerDetected = true;
      result.vueVersion = getVueVersion(vueRoot);
      result.routerBase = extractRouterBase(router);
      result.pageAnalysis = analyzePageLinks();
      result.modifiedRoutes = patchAllRouteAuth(router);
      patchRouterGuards(router);
      result.allRoutes = listAllRoutes(router).map((r) => ({
        name: r.name || '', path: r.path || '', meta: simplifyMeta(r.meta),
      }));
    } catch (e: any) {
      result.error = e?.toString?.() || 'Unknown error';
    }
    return result;
  }

  // ======== 延迟检测 ========

  function delayedDetection(delay = 0, retryCount = 0) {
    if (retryCount >= 3) {
      sendDetectionResult({ detected: false, method: 'Max retry limit reached' });
      return;
    }
    setTimeout(() => {
      const vueRoot = findVueRoot(document.body);
      if (vueRoot) {
        sendDetectionResult({ detected: true, method: delay === 0 ? 'Immediate' : `Delayed ${delay}ms` });
        setTimeout(() => sendRouterResult(performFullAnalysis()), 50);
      } else if (delay < 600) {
        delayedDetection(delay === 0 ? 300 : 600, retryCount + 1);
      } else {
        sendDetectionResult({ detected: false, method: `All attempts failed (${retryCount + 1})` });
      }
    }, delay);
  }

  // ======== 入口 ========

  try {
    const vueRoot = findVueRoot(document.body);
    if (vueRoot) {
      sendDetectionResult({ detected: true, method: 'Immediate detection' });
      setTimeout(() => sendRouterResult(performFullAnalysis()), 50);
    } else {
      delayedDetection(0, 0);
    }
  } catch {
    delayedDetection(500, 0);
  }
});

