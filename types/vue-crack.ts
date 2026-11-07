/**
 * VueCrack 相关类型定义
 */

/** 单条路由信息 */
export interface VueRouteInfo {
  name: string;
  path: string;
  meta: Record<string, unknown>;
}

/** Vue Router 分析结果 */
/** 页面链接分析结果 */
export interface PageAnalysis {
  detectedBasePath: string;
  commonPrefixes: { prefix: string; count: number }[];
}

/** Vue Router 分析结果 */
export interface VueRouterAnalysisResult {
  vueDetected: boolean;
  vueVersion: string | null;
  routerDetected: boolean;
  modifiedRoutes: { path: string; name: string }[];
  allRoutes: VueRouteInfo[];
  routerBase: string;
  currentPath: string;
  pageAnalysis?: PageAnalysis;
  error?: string;
}

/** Vue 检测结果 */
export interface VueDetectionResult {
  detected: boolean;
  method: string;
}

// ---- 页面上下文 → Content Script（window.postMessage）----

export interface VueDetectionPostMessage {
  type: 'VUE_DETECTION_RESULT';
  result: VueDetectionResult;
}

export interface VueRouterAnalysisPostMessage {
  type: 'VUE_ROUTER_ANALYSIS_RESULT';
  result: VueRouterAnalysisResult;
}

/** Content Script → 页面上下文：显式请求修改路由鉴权 */
export interface VuePatchAuthCommand {
  type: 'VUE_PATCH_AUTH';
}

/** 页面上下文 → Content Script：路由鉴权修改完成（结果为更新后的完整分析） */
export interface VuePatchAuthResultPostMessage {
  type: 'VUE_PATCH_AUTH_RESULT';
  result: VueRouterAnalysisResult;
}

export interface VueRouterAnalysisErrorPostMessage {
  type: 'VUE_ROUTER_ANALYSIS_ERROR';
  error: string;
}

// ---- Content Script ↔ Popup（browser.runtime messaging）----

/** Popup → Content Script 请求 */
export type VueCrackRequest =
  | { action: 'detectVue' }
  | { action: 'analyzeVueRouter' }
  | { action: 'patchVueAuth' };

/** Content Script → Popup 响应（通过 runtime.sendMessage） */
export type VueCrackEvent =
  | { action: 'vueDetectionResult'; result: VueDetectionResult }
  | { action: 'vueRouterAnalysisResult'; result: VueRouterAnalysisResult }
  | { action: 'vuePatchResult'; result: VueRouterAnalysisResult }
  | { action: 'vueDetectionError'; error: string }
  | { action: 'vueRouterAnalysisError'; error: string };

