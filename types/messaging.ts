import type { HttpHeader, HttpMethod } from './packet';

/**
 * DevTools 面板 → Background 消息
 */

/** 开启拦截 */
export interface StartInterceptMessage {
  type: 'START_INTERCEPT';
  tabId: number;
}

/** 关闭拦截 */
export interface StopInterceptMessage {
  type: 'STOP_INTERCEPT';
  tabId: number;
}

/** 放行被拦截的请求（原样放行） */
export interface ForwardRequestMessage {
  type: 'FORWARD_REQUEST';
  requestId: string;
}

/** 放行被拦截的请求（带修改内容） */
export interface ForwardModifiedRequestMessage {
  type: 'FORWARD_MODIFIED_REQUEST';
  requestId: string;
  method: string;
  url: string;
  headers: { name: string; value: string }[];
  body?: string;
}

/** 丢弃被拦截的请求 */
export interface DropRequestMessage {
  type: 'DROP_REQUEST';
  requestId: string;
}

/** 重放/发送请求 */
export interface SendRequestMessage {
  type: 'SEND_REQUEST';
  /** 客户端生成的唯一 ID，用于关联响应 */
  packetId: string;
  method: string;
  url: string;
  headers: { name: string; value: string }[];
  body?: string;
}

/** 开启 WebSocket 监控 */
export interface StartWsMonitorMessage {
  type: 'START_WS_MONITOR';
  tabId: number;
}

/** 关闭 WebSocket 监控 */
export interface StopWsMonitorMessage {
  type: 'STOP_WS_MONITOR';
  tabId: number;
}

/** 所有从 DevTools → Background 的消息 */
export type DevToolsToBackgroundMessage =
  | StartInterceptMessage
  | StopInterceptMessage
  | ForwardRequestMessage
  | ForwardModifiedRequestMessage
  | DropRequestMessage
  | SendRequestMessage
  | StartWsMonitorMessage
  | StopWsMonitorMessage;

/**
 * Background → DevTools 面板 消息
 */

/** 被拦截的请求数据 */
export interface InterceptedRequestData {
  /** CDP 请求 ID（用于后续 continueRequest / failRequest） */
  networkRequestId: string;
  method: HttpMethod;
  url: string;
  headers: HttpHeader[];
  postData?: string;
}

/** 请求被拦截事件 */
export interface RequestInterceptedMessage {
  type: 'REQUEST_INTERCEPTED';
  data: InterceptedRequestData;
}

/** 拦截状态变更 */
export interface InterceptStatusMessage {
  type: 'INTERCEPT_STATUS';
  active: boolean;
  tabId: number;
}

/** 请求重放响应结果 */
export interface SendResponseMessage {
  type: 'SEND_RESPONSE';
  packetId: string;
  status: number;
  statusText: string;
  headers: { name: string; value: string }[];
  body: string;
  duration: number;
}

/** 请求重放失败 */
export interface SendErrorMessage {
  type: 'SEND_ERROR';
  packetId: string;
  error: string;
}

/** WebSocket 连接创建 */
export interface WsConnectionCreatedMessage {
  type: 'WS_CONNECTION_CREATED';
  requestId: string;
  url: string;
  initiator?: string;
}

/** WebSocket 连接关闭 */
export interface WsConnectionClosedMessage {
  type: 'WS_CONNECTION_CLOSED';
  requestId: string;
}

/** WebSocket 帧事件 */
export interface WsFrameMessage {
  type: 'WS_FRAME';
  requestId: string;
  direction: 'sent' | 'received';
  data: string;
  opcode: number;
  mask: boolean;
  timestamp: number;
}

/** WebSocket 帧错误 */
export interface WsFrameErrorMessage {
  type: 'WS_FRAME_ERROR';
  requestId: string;
  errorMessage: string;
}

/** WebSocket 监控状态变更 */
export interface WsMonitorStatusMessage {
  type: 'WS_MONITOR_STATUS';
  active: boolean;
  tabId: number;
}

/** 所有从 Background → DevTools 的消息 */
export type BackgroundToDevToolsMessage =
  | RequestInterceptedMessage
  | InterceptStatusMessage
  | SendResponseMessage
  | SendErrorMessage
  | WsConnectionCreatedMessage
  | WsConnectionClosedMessage
  | WsFrameMessage
  | WsFrameErrorMessage
  | WsMonitorStatusMessage;

