export type AspectId = "16:9" | "9:16" | "1:1" | "4:5";

export type TransitionType =
  | "none"
  | "dissolve"
  | "dip-black"
  | "dip-white"
  | "wipe-left"
  | "wipe-right"
  | "wipe-up"
  | "wipe-down"
  | "slide-left"
  | "slide-right"
  | "push-left"
  | "zoom"
  | "flash"
  | "glitch";

export type GeneratorId = "studio" | "night" | "graphic";

export type PresetId =
  | "shorts-hook"
  | "shorts-pill"
  | "shorts-word"
  | "karaoke"
  | "impact"
  | "lower"
  | "news"
  | "cinema"
  | "minimal"
  | "stack";

export type MediaKind = "video" | "audio" | "image" | "generator";

export type MediaMeta = {
  id: string;
  name: string;
  kind: MediaKind;
  duration: number;
  width: number;
  height: number;
  hasAudio: boolean;
  generator?: GeneratorId;
  peaks?: number[];
};

type ClipBase = {
  id: string;
  trackId: string;
  name: string;
  start: number;
  duration: number;
  inPoint: number;
};

export type VisualClip = ClipBase & {
  type: "video" | "image" | "generator";
  mediaId: string;
  opacity: number;
  volume: number;
  speed: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  brightness: number;
  contrast: number;
  saturate: number;
  fadeIn: number;
  fadeOut: number;
  transition: TransitionType;
  transitionDur: number;
};

export type AudioClip = ClipBase & {
  type: "audio";
  mediaId: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
};

export type TextClip = ClipBase & {
  type: "text";
  text: string;
  preset: PresetId;
  fontScale: number;
  /** Empty string keeps the preset color. */
  color: string;
  /** Null keeps the preset anchor. */
  y: number | null;
  /** 가로로 옮긴 정도 (화면 폭 비율, 0 = 프리셋 위치). 예전 프로젝트엔 없을 수 있어요. */
  x?: number | null;
};

export type Clip = VisualClip | AudioClip | TextClip;

export type Track = {
  id: string;
  kind: "video" | "audio" | "text";
  name: string;
  muted: boolean;
  hidden: boolean;
  locked: boolean;
};

export type ToolId = "select" | "razor" | "text";

export type MobilePanel = "timeline" | "bin" | "inspector";

export const ASPECTS: Record<AspectId, { w: number; h: number; label: string }> = {
  "16:9": { w: 1280, h: 720, label: "16:9 가로" },
  "9:16": { w: 720, h: 1280, label: "9:16 숏폼" },
  "1:1": { w: 720, h: 720, label: "1:1 정사각" },
  "4:5": { w: 864, h: 1080, label: "4:5 피드" },
};

export function isVisual(clip: Clip): clip is VisualClip {
  return clip.type === "video" || clip.type === "image" || clip.type === "generator";
}

export function clipEnd(clip: Clip): number {
  return clip.start + clip.duration;
}

export function clipSpeed(clip: Clip): number {
  return isVisual(clip) ? clip.speed : 1;
}
