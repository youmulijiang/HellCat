import type { VueCrackRequest, VueDetectionResult, VueRouterAnalysisResult } from '@/types/vue-crack';
import type { InjectContentMessage } from '@/types/inject';

export default defineContentScript({
  matches: ['*://*/*'],
  async main() {
    console.log('[Hellcat] Content script loaded');

    /** 缓存检测结果 */
    let detectionResult: VueDetectionResult | null = null;
    let routerAnalysisResult: VueRouterAnalysisResult | null = null;

    // ========== Inject 模块：区域选择状态 ==========
    let regionOverlay: HTMLDivElement | null = null;
    let regionBox: HTMLDivElement | null = null;
    let isSelecting = false;
    let startX = 0;
    let startY = 0;
    let pendingFillText = '';               // 待填充文本
    let highlightedElements: HTMLElement[] = []; // 被高亮的表单元素
    const HIGHLIGHT_OUTLINE = '2px solid #1890ff';
    const HIGHLIGHT_BG = 'rgba(24,144,255,0.12)';

    /** 获取页面所有可填充的表单元素 */
    function getFormElements(root?: Element): (HTMLInputElement | HTMLTextAreaElement | HTMLElement)[] {
      const container = root || document;
      const inputs = Array.from(container.querySelectorAll<HTMLInputElement>(
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([readonly]):not([disabled])'
      ));
      const textareas = Array.from(container.querySelectorAll<HTMLTextAreaElement>(
        'textarea:not([readonly]):not([disabled])'
      ));
      const editables = Array.from(container.querySelectorAll<HTMLElement>(
        '[contenteditable="true"]'
      ));
      return [...inputs, ...textareas, ...editables];
    }

    /** 获取指定矩形区域内的表单元素 */
    function getFormElementsInRect(rect: { x: number; y: number; width: number; height: number }) {
      const all = getFormElements();
      return all.filter(el => {
        const r = el.getBoundingClientRect();
        return (
          r.left >= rect.x &&
          r.top >= rect.y &&
          r.right <= rect.x + rect.width &&
          r.bottom <= rect.y + rect.height
        );
      });
    }

    /** 设置表单元素的值 */
    function setElementValue(el: HTMLElement, value: string) {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const nativeInputValueSetter =
          Object.getOwnPropertyDescriptor(
            el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
            'value'
          )?.set;
        nativeInputValueSetter?.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (el.isContentEditable) {
        el.textContent = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    /** 替换表单元素中的变量占位符 */
    function replaceVariablesInElement(el: HTMLElement, variables: Record<string, string>) {
      let currentValue = '';
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        currentValue = el.value;
      } else if (el.isContentEditable) {
        currentValue = el.textContent || '';
      }
      let newValue = currentValue;
      for (const [key, val] of Object.entries(variables)) {
        newValue = newValue.replaceAll(`{{${key}}}`, val);
      }
      if (newValue !== currentValue) {
        setElementValue(el, newValue);
      }
    }

    /** 清除高亮 */
    function clearHighlights() {
      for (const el of highlightedElements) {
        (el as HTMLElement).style.outline = '';
        (el as HTMLElement).style.backgroundColor = '';
      }
      highlightedElements = [];
    }

    /** 高亮表单元素 */
    function highlightFormElements(elements: HTMLElement[]) {
      clearHighlights();
      for (const el of elements) {
        el.style.outline = HIGHLIGHT_OUTLINE;
        el.style.backgroundColor = HIGHLIGHT_BG;
      }
      highlightedElements = elements;
    }

    /** 创建区域选择覆盖层 */
    function createRegionOverlay() {
      removeRegionOverlay();
      regionOverlay = document.createElement('div');
      Object.assign(regionOverlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        zIndex: '2147483647', cursor: 'crosshair', background: 'rgba(0,0,0,0.05)',
      });
      regionBox = document.createElement('div');
      Object.assign(regionBox.style, {
        position: 'fixed', border: '2px dashed #1890ff', background: 'rgba(24,144,255,0.08)',
        borderRadius: '2px', display: 'none', pointerEvents: 'none',
      });
      regionOverlay.appendChild(regionBox);
      document.body.appendChild(regionOverlay);

      regionOverlay.addEventListener('mousedown', onRegionMouseDown);
      regionOverlay.addEventListener('mousemove', onRegionMouseMove);
      regionOverlay.addEventListener('mouseup', onRegionMouseUp);
    }

    /** 移除所有区域选择相关元素 */
    function removeRegionOverlay() {
      clearHighlights();
      if (regionBox) {
        regionBox.remove();
        regionBox = null;
      }
      if (regionOverlay) {
        regionOverlay.remove();
        regionOverlay = null;
      }
    }

    function onRegionMouseDown(e: MouseEvent) {
      isSelecting = true;
      startX = e.clientX;
      startY = e.clientY;
      if (regionBox) {
        regionBox.style.display = 'block';
        regionBox.style.left = `${startX}px`;
        regionBox.style.top = `${startY}px`;
        regionBox.style.width = '0';
        regionBox.style.height = '0';
      }
    }

    function onRegionMouseMove(e: MouseEvent) {
      if (!isSelecting || !regionBox) return;
      const x = Math.min(e.clientX, startX);
      const y = Math.min(e.clientY, startY);
      const w = Math.abs(e.clientX - startX);
      const h = Math.abs(e.clientY - startY);
      regionBox.style.left = `${x}px`;
      regionBox.style.top = `${y}px`;
      regionBox.style.width = `${w}px`;
      regionBox.style.height = `${h}px`;
    }

    /** 双击方框执行填充 */
    function onRegionBoxDblClick() {
      if (!regionBox) return;
      const rect = {
        x: parseFloat(regionBox.style.left),
        y: parseFloat(regionBox.style.top),
        width: parseFloat(regionBox.style.width),
        height: parseFloat(regionBox.style.height),
      };
      const elements = getFormElementsInRect(rect);
      elements.forEach(el => setElementValue(el, pendingFillText));
      // 填充完成后清理
      removeRegionOverlay();
    }

    function onRegionMouseUp(e: MouseEvent) {
      if (!isSelecting) return;
      isSelecting = false;
      const rect = {
        x: Math.min(e.clientX, startX),
        y: Math.min(e.clientY, startY),
        width: Math.abs(e.clientX - startX),
        height: Math.abs(e.clientY - startY),
      };
      // 忽略太小的区域（可能是误点）
      if (rect.width < 10 || rect.height < 10) return;

      // 移除透明遮罩，保留方框并使其可交互
      if (regionOverlay && regionBox) {
        regionOverlay.removeEventListener('mousedown', onRegionMouseDown);
        regionOverlay.removeEventListener('mousemove', onRegionMouseMove);
        regionOverlay.removeEventListener('mouseup', onRegionMouseUp);
        // 将 box 移到 body 上
        document.body.appendChild(regionBox);
        regionOverlay.remove();
        regionOverlay = null;
        // 让 box 可交互
        regionBox.style.pointerEvents = 'auto';
        regionBox.style.cursor = 'pointer';
        regionBox.addEventListener('dblclick', onRegionBoxDblClick);
      }

      // 高亮区域内的表单元素
      const elements = getFormElementsInRect(rect);
      highlightFormElements(elements);
    }

    /** 注入 vue-detector 到页面上下文 */
    async function injectDetector() {
      try {
        await injectScript('/vue-detector.js', { keepInDom: false });
      } catch (e) {
        console.error('[Hellcat] Failed to inject vue-detector:', e);
        browser.runtime.sendMessage({
          action: 'vueDetectionError',
          error: String(e),
        });
      }
    }

    /** 监听来自 vue-detector 的 postMessage */
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;

      try {
        if (event.data?.type === 'VUE_DETECTION_RESULT') {
          detectionResult = event.data.result;
          browser.runtime.sendMessage({
            action: 'vueDetectionResult',
            result: detectionResult,
          });
        } else if (event.data?.type === 'VUE_ROUTER_ANALYSIS_RESULT') {
          routerAnalysisResult = event.data.result;
          browser.runtime.sendMessage({
            action: 'vueRouterAnalysisResult',
            result: routerAnalysisResult,
          });
        } else if (event.data?.type === 'VUE_ROUTER_ANALYSIS_ERROR') {
          browser.runtime.sendMessage({
            action: 'vueRouterAnalysisError',
            error: event.data.error,
          });
        }
      } catch (e) {
        console.error('[Hellcat] Message relay error:', e);
      }
    });

    /** 监听来自 popup 的请求 */
    browser.runtime.onMessage.addListener(
      (request: VueCrackRequest | InjectContentMessage, _sender, sendResponse) => {
        try {
          // ========== VueCrack 请求 ==========
          if (request.action === 'detectVue') {
            sendResponse({ status: 'detecting' });
            injectDetector();
          } else if (request.action === 'analyzeVueRouter') {
            if (routerAnalysisResult) {
              browser.runtime.sendMessage({
                action: 'vueRouterAnalysisResult',
                result: routerAnalysisResult,
              });
            } else {
              injectDetector();
            }
            sendResponse({ status: 'analyzing' });

          // ========== Inject 模块请求 ==========
          } else if (request.action === 'injectScript') {
            const script = document.createElement('script');
            script.textContent = request.code;
            document.documentElement.appendChild(script);
            script.remove();
            sendResponse({ status: 'ok' });

          } else if (request.action === 'textFill') {
            const elements = getFormElements();
            elements.forEach(el => setElementValue(el, request.text));
            sendResponse({ status: 'ok', count: elements.length });

          } else if (request.action === 'startRegionSelect') {
            pendingFillText = request.text;
            createRegionOverlay();
            sendResponse({ status: 'ok' });

          } else if (request.action === 'stopRegionSelect') {
            removeRegionOverlay();
            sendResponse({ status: 'ok' });

          } else if (request.action === 'regionFill') {
            const elements = getFormElementsInRect(request.rect);
            elements.forEach(el => setElementValue(el, request.text));
            removeRegionOverlay();
            sendResponse({ status: 'ok', count: elements.length });

          } else if (request.action === 'variableFill') {
            const elements = getFormElements();
            elements.forEach(el => replaceVariablesInElement(el, request.variables));
            sendResponse({ status: 'ok', count: elements.length });
          }
        } catch (e) {
          sendResponse({ status: 'error', error: String(e) });
        }
        return true;
      },
    );
  },
});
