/** 用户自定义脚本 */
export interface InjectScript {
  id: string;
  /** 脚本名称 */
  name: string;
  /** 脚本代码 */
  code: string;
  /** 是否启用注入 */
  enabled: boolean;
  /** 创建时间 */
  createdAt: number;
}

/** 变量键值对 */
export interface InjectVariable {
  id: string;
  /** 变量名 (用于 {{key}} 占位符) */
  key: string;
  /** 变量值 */
  value: string;
}

/** Popup → Content Script 消息类型 */
export interface InjectScriptMessage {
  action: 'injectScript';
  code: string;
}

export interface TextFillMessage {
  action: 'textFill';
  text: string;
  /** 是否启用局部填充（框选区域） */
  partial: boolean;
}

export interface VariableFillMessage {
  action: 'variableFill';
  variables: Record<string, string>;
}

export interface StartRegionSelectMessage {
  action: 'startRegionSelect';
  /** 待填充的文本，画完方框双击后自动填充 */
  text: string;
}

export interface StopRegionSelectMessage {
  action: 'stopRegionSelect';
}

/** Content Script → Popup 消息 */
export interface RegionSelectedMessage {
  action: 'regionSelected';
  rect: { x: number; y: number; width: number; height: number };
}

export interface RegionFillMessage {
  action: 'regionFill';
  text: string;
  rect: { x: number; y: number; width: number; height: number };
}

export type InjectContentMessage =
  | InjectScriptMessage
  | TextFillMessage
  | VariableFillMessage
  | StartRegionSelectMessage
  | StopRegionSelectMessage
  | RegionFillMessage;

