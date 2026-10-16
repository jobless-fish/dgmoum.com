import { BED_ID } from "@/lib/editor/project";
import type { GeneratorId, MediaKind, MediaMeta } from "@/lib/editor/types";

export type MediaNode = {
  el: HTMLMediaElement;
  gain: GainNode;
  kind: "video" | "audio";
};

type Rec = {
  url: string;
  elKind: "video" | "audio";
  nodes: Map<string, MediaNode>;
};

const registry = new Map<string, Rec>();
let audioCtx: AudioContext | null = null;
let master: GainNode | null = null;
let recDest: MediaStreamAudioDestinationNode | null = null;
let recConnected = false;
let hostEl: HTMLDivElement | null = null;

function host(): HTMLDivElement | null {
  if (typeof document === "undefined") return null;
  if (!hostEl) {
    hostEl = document.createElement("div");
    hostEl.setAttribute("aria-hidden", "true");
    hostEl.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none";
    document.body.appendChild(hostEl);
  }
  return hostEl;
}

export function getAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctx();
    master = audioCtx.createGain();
    master.gain.value = 1;
    master.connect(audioCtx.destination);
  }
  return audioCtx;
}

export function unlockAudio(): void {
  const ctx = getAudio();
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

export function recordDestination(): MediaStreamAudioDestinationNode | null {
  const ctx = getAudio();
  if (!ctx || !master) return null;
  if (!recDest) recDest = ctx.createMediaStreamDestination();
  if (!recConnected) {
    master.connect(recDest);
    recConnected = true;
  }
  return recDest;
}

function wire(el: HTMLMediaElement): GainNode {
  const ctx = getAudio();
  if (!ctx || !master) {
    const dummy = {
      gain: { value: 1 },
    } as GainNode;
    return dummy;
  }
  const src = ctx.createMediaElementSource(el);
  const gain = ctx.createGain();
  gain.gain.value = 0;
  src.connect(gain);
  gain.connect(master);
  return gain;
}

export function registerUrl(id: string, url: string, elKind: "video" | "audio" = "video"): void {
  const prev = registry.get(id);
  if (prev && prev.url !== url) {
    URL.revokeObjectURL(prev.url);
    for (const node of prev.nodes.values()) node.el.remove();
  }
  registry.set(id, {
    url,
    elKind,
    nodes: prev && prev.url === url ? prev.nodes : new Map(),
  });
}

export function hasUrl(id: string): boolean {
  return registry.has(id);
}

const frameWaiters = new Set<() => void>();

export function onFrameReady(fn: () => void): () => void {
  frameWaiters.add(fn);
  return () => frameWaiters.delete(fn);
}

function pingFrame(): void {
  for (const fn of frameWaiters) fn();
}

function makeElement(kind: "video" | "audio", url: string): HTMLMediaElement {
  const el = document.createElement(kind);
  el.preload = "auto";
  el.crossOrigin = "anonymous";
  if (el instanceof HTMLVideoElement) el.playsInline = true;
  el.src = url;
  el.addEventListener("seeked", pingFrame);
  el.addEventListener("loadeddata", pingFrame);
  host()?.appendChild(el);
  return el;
}

export function nodeFor(clipId: string, mediaId: string, kind: "video" | "audio" = "video"): MediaNode | null {
  const rec = registry.get(mediaId);
  if (!rec || typeof document === "undefined") return null;
  const existing = rec.nodes.get(clipId);
  if (existing) return existing;
  const elKind = rec.elKind || kind;
  const el = makeElement(elKind, rec.url);
  const gain = wire(el);
  const node: MediaNode = { el, gain, kind: elKind };
  rec.nodes.set(clipId, node);
  return node;
}

const images = new Map<string, HTMLImageElement>();

export function imageFor(mediaId: string): HTMLImageElement | null {
  const rec = registry.get(mediaId);
  if (!rec || typeof document === "undefined") return null;
  let img = images.get(mediaId);
  if (!img) {
    img = new Image();
    img.src = rec.url;
    images.set(mediaId, img);
  }
  return img;
}

export type SyncItem = {
  clipId: string;
  mediaId: string;
  kind: "video" | "audio" | "image";
  srcTime: number;
  play: boolean;
  rate: number;
  volume: number;
};

export function syncMedia(items: SyncItem[], allowPlay: boolean): void {
  const live = new Set(items.map((item) => item.clipId));
  for (const rec of registry.values()) {
    for (const [clipId, node] of rec.nodes) {
      if (live.has(clipId)) continue;
      node.gain.gain.value = 0;
      if (!node.el.paused) node.el.pause();
    }
  }

  for (const item of items) {
    if (item.kind === "image") continue;
    const node = nodeFor(item.clipId, item.mediaId, item.kind === "audio" ? "audio" : "video");
    if (!node) continue;
    const el = node.el;
    node.gain.gain.value = item.volume;
    const rate = Math.min(4, Math.max(0.25, item.rate || 1));
    if (el.playbackRate !== rate) {
      try {
        el.playbackRate = rate;
      } catch {
        /* some browsers reject rate before metadata */
      }
    }
    const drift = Math.abs((el.currentTime || 0) - item.srcTime);
    if (allowPlay && item.play && item.volume >= 0) {
      if (drift > 0.28) {
        try {
          el.currentTime = Math.max(0, item.srcTime);
        } catch {
          /* seek before metadata */
        }
      }
      if (el.paused) void el.play().catch(() => undefined);
    } else {
    if (!el.paused) el.pause();
      if (drift > 0.045) {
        try {
          el.currentTime = Math.max(0, item.srcTime);
        } catch {
          /* ignore */
        }
      }
    }
  }
}

export function pauseAll(): void {
  for (const rec of registry.values()) {
    for (const node of rec.nodes.values()) {
      node.gain.gain.value = 0;
      if (!node.el.paused) node.el.pause();
    }
  }
}

export function drawable(mediaId: string, clipId: string, kind: MediaKind): CanvasImageSource | null {
  if (kind === "image") {
    const img = imageFor(mediaId);
    if (!img || !img.complete || img.naturalWidth === 0) return null;
    return img;
  }
  if (kind === "video") {
    const node = nodeFor(clipId, mediaId, "video");
    if (!node || node.el.readyState < 2) return null;
    return node.el as HTMLVideoElement;
  }
  return null;
}

function waitEvent(el: HTMLMediaElement, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ok = () => {
      cleanup();
      resolve();
    };
    const bad = () => {
      cleanup();
      reject(new Error("이 파일은 브라우저에서 읽지 못해요"));
    };
    const cleanup = () => {
      el.removeEventListener(event, ok);
      el.removeEventListener("error", bad);
    };
    el.addEventListener(event, ok, { once: true });
    el.addEventListener("error", bad, { once: true });
  });
}

async function peaksFor(file: File): Promise<number[] | undefined> {
  if (file.size > 12_000_000) return undefined;
  if (!file.type.startsWith("audio/")) return undefined;
  try {
    const ctx = getAudio();
    if (!ctx) return undefined;
    const audio = await ctx.decodeAudioData((await file.arrayBuffer()).slice(0));
    const ch = audio.getChannelData(0);
    const bars = 64;
    const size = Math.max(1, Math.floor(ch.length / bars));
    const peaks: number[] = [];
    for (let i = 0; i < bars; i++) {
      let m = 0;
      const base = i * size;
      for (let j = 0; j < size; j += 16) {
        const v = Math.abs(ch[base + j] || 0);
        if (v > m) m = v;
      }
      peaks.push(m);
    }
    return peaks;
  } catch {
    return undefined;
  }
}

export async function ingestFile(file: File): Promise<MediaMeta> {
  const url = URL.createObjectURL(file);
  const id = `file-${Math.random().toString(36).slice(2, 9)}`;
  const name = file.name.replace(/\.[^.]+$/, "") || file.name;

  if (file.type.startsWith("image/")) {
    const img = new Image();
    img.src = url;
    await img.decode().catch(() => {
      throw new Error(`${file.name} 이미지를 열지 못했어요`);
    });
    registerUrl(id, url);
    images.set(id, img);
    return {
      id,
      name,
      kind: "image",
      duration: 5,
      width: img.naturalWidth,
      height: img.naturalHeight,
      hasAudio: false,
    };
  }

  const kind: "video" | "audio" = file.type.startsWith("audio/") ? "audio" : "video";
  const el = makeElement(kind, url);
  await waitEvent(el, "loadedmetadata");
  const duration = Number.isFinite(el.duration) ? el.duration : 0;
  if (duration <= 0) {
    el.remove();
    URL.revokeObjectURL(url);
    throw new Error(`${file.name} 길이를 알 수 없어요`);
  }
  registerUrl(id, url, kind);
  const rec = registry.get(id)!;
  const gain = wire(el);
  rec.nodes.set(`probe-${id}`, { el, gain, kind });

  const meta: MediaMeta = {
    id,
    name,
    kind,
    duration,
    width: el instanceof HTMLVideoElement ? el.videoWidth : 0,
    height: el instanceof HTMLVideoElement ? el.videoHeight : 0,
    hasAudio: kind === "audio" ? true : true,
    peaks: await peaksFor(file),
  };
  return meta;
}

export function ensureBed(metaDuration = 12.5): void {
  if (registry.has(BED_ID) || typeof document === "undefined") return;
  const sr = 22050;
  const n = Math.floor(sr * metaDuration);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const beat = t % 0.5;
    const kick = Math.sin(2 * Math.PI * 72 * beat) * Math.exp(-beat * 16) * 0.42;
    const tick = (Math.sin(i * 12.3) > 0 ? 1 : -1) * Math.exp(-(t % 0.25) * 48) * 0.03;
    const notes = [196, 246.94, 293.66, 392];
    let tone = 0;
    for (const f of notes) tone += Math.sin(2 * Math.PI * f * t);
    const swell = 0.55 + 0.45 * Math.sin((2 * Math.PI * t) / 6.25);
    const tail = t > metaDuration - 0.8 ? (metaDuration - t) / 0.8 : 1;
    samples[i] = (kick + tick + tone * 0.045 * swell) * tail;
  }
  const blob = encodeWav(samples, sr);
  registerUrl(BED_ID, URL.createObjectURL(blob), "audio");
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export function generatorOf(meta: MediaMeta | undefined): GeneratorId | null {
  return meta?.generator ?? null;
}
