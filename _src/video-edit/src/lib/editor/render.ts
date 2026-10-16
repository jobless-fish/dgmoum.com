import { drawable, type SyncItem } from "@/lib/editor/media";
import { presetById, type TextPreset } from "@/lib/editor/presets";
import { useEditor } from "@/lib/editor/store";
import type { Clip, TextClip, VisualClip } from "@/lib/editor/types";
import { isVisual } from "@/lib/editor/types";

const FONT = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif';

let layer: HTMLCanvasElement | null = null;

function hash(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function envelope(start: number, duration: number, fadeIn: number, fadeOut: number, t: number): number {
  const local = t - start;
  let e = 1;
  if (fadeIn > 0 && local < fadeIn) e *= local / fadeIn;
  const tail = start + duration - t;
  if (fadeOut > 0 && tail < fadeOut) e *= Math.max(0, tail / fadeOut);
  return Math.max(0, Math.min(1, e));
}

function layerCtx(w: number, h: number): CanvasRenderingContext2D {
  if (!layer) layer = document.createElement("canvas");
  if (layer.width !== w || layer.height !== h) {
    layer.width = w;
    layer.height = h;
  }
  const ctx = layer.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.globalAlpha = 1;
  ctx.filter = "none";
  return ctx;
}

function findPrev(trackId: string, clip: VisualClip, clips: Clip[]): VisualClip | null {
  let best: VisualClip | null = null;
  let bestEnd = -1;
  for (const other of clips) {
    if (other.trackId !== trackId || other.id === clip.id || !isVisual(other)) continue;
    const end = other.start + other.duration;
    const gap = clip.start - end;
    if (gap <= 0.05 && gap > -0.02 && end > bestEnd) {
      best = other;
      bestEnd = end;
    }
  }
  return best;
}

export function buildPlan(t: number, forward: boolean): SyncItem[] {
  const { clips, tracks } = useEditor.getState();
  const map = new Map<string, SyncItem>();
  const trackById = new Map(tracks.map((track) => [track.id, track]));

  const put = (clip: VisualClip | Extract<Clip, { type: "audio" }>, srcTime: number, play: boolean, audible: boolean) => {
    if (clip.type !== "video" && clip.type !== "audio") return;
    const track = trackById.get(clip.trackId);
    const fade = envelope(clip.start, clip.duration, clip.fadeIn, clip.fadeOut, Math.min(t, clip.start + clip.duration - 0.001));
    const volume = !audible || track?.muted ? 0 : clip.volume * fade;
    map.set(clip.id, {
      clipId: clip.id,
      mediaId: clip.mediaId,
      kind: clip.type === "audio" ? "audio" : "video",
      srcTime: Math.max(0, srcTime),
      play: play && volume >= 0,
      rate: clip.type === "video" ? clip.speed : 1,
      volume,
    });
  };

  for (const clip of clips) {
    if (t < clip.start || t >= clip.start + clip.duration) continue;
    if (clip.type === "video") {
      put(clip, clip.inPoint + (t - clip.start) * clip.speed, forward, true);
    } else if (clip.type === "audio") {
      put(clip, clip.inPoint + (t - clip.start), forward, true);
    }
  }

  for (const clip of clips) {
    if (!isVisual(clip) || clip.transition === "none" || clip.transitionDur <= 0) continue;
    const local = t - clip.start;
    if (local < 0 || local >= clip.transitionDur) continue;
    const covering = clips
      .filter((other) => other.trackId === clip.trackId && isVisual(other) && t >= other.start && t < other.start + other.duration)
      .sort((a, b) => a.start - b.start);
    const under = covering.filter((other) => other.id !== clip.id).at(-1);
    const prev = (under && isVisual(under) ? under : findPrev(clip.trackId, clip, clips)) ?? null;
    if (!prev || prev.type !== "video" || map.has(prev.id)) continue;
    const freeze = prev.inPoint + Math.max(0, prev.duration * prev.speed - 0.04);
    put(prev, freeze, false, false);
    const item = map.get(prev.id);
    if (item) item.play = false;
  }

  return [...map.values()];
}

function withLook(
  ctx: CanvasRenderingContext2D,
  clip: VisualClip,
  w: number,
  h: number,
  alpha: number,
  draw: () => void,
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const b = 1 + clip.brightness * 0.7;
  const c = 1 + clip.contrast * 0.75;
  const s = Math.max(0, 1 + clip.saturate);
  if (clip.brightness || clip.contrast || clip.saturate) {
    ctx.filter = `brightness(${b}) contrast(${c}) saturate(${s})`;
  }
  const cx = w / 2 + clip.offsetX * w * 0.5;
  const cy = h / 2 + clip.offsetY * h * 0.5;
  ctx.translate(cx, cy);
  ctx.rotate((clip.rotation * Math.PI) / 180);
  ctx.scale(clip.scale, clip.scale);
  ctx.translate(-w / 2, -h / 2);
  draw();
  ctx.restore();
}

function drawOffline(ctx: CanvasRenderingContext2D, w: number, h: number, title: string, sub: string) {
  ctx.fillStyle = "#171a20";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#2a2f38";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, w - 36, h - 36);
  ctx.fillStyle = "#eceef2";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.round(Math.min(w, h) * 0.045)}px ${FONT}`;
  ctx.fillText(title, w / 2, h / 2 - Math.min(w, h) * 0.02);
  ctx.fillStyle = "#98a1ad";
  ctx.font = `500 ${Math.round(Math.min(w, h) * 0.028)}px ${FONT}`;
  ctx.fillText(sub, w / 2, h / 2 + Math.min(w, h) * 0.05);
}

function plateLabel(ctx: CanvasRenderingContext2D, w: number, h: number, label: string) {
  const u = Math.min(w, h);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.filter = "none";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(236,238,242,0.72)";
  ctx.font = `600 ${Math.round(u * 0.032)}px ${FONT}`;
  ctx.fillText(label, w * 0.08, h * 0.16);
  ctx.fillStyle = "#ff5a0a";
  ctx.fillRect(w * 0.08, h * 0.175, u * 0.08, Math.max(3, u * 0.006));
  ctx.restore();
}

function drawStudio(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = "#0e1014";
  ctx.fillRect(0, 0, w, h);
  const gx = w * (0.62 + Math.sin(t * 0.4) * 0.08);
  const gy = h * (0.38 + Math.cos(t * 0.33) * 0.05);
  const g = ctx.createRadialGradient(gx, gy, 10, gx, gy, Math.max(w, h) * 0.62);
  g.addColorStop(0, "rgba(255,90,10,0.55)");
  g.addColorStop(0.38, "rgba(255,90,10,0.14)");
  g.addColorStop(1, "rgba(255,90,10,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(236,238,242,0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.72);
  ctx.lineTo(w * 0.92, h * 0.72);
  ctx.stroke();
  plateLabel(ctx, w, h, "SCENE 01  ·  스튜디오");
  ctx.fillStyle = "#eceef2";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `750 ${Math.round(Math.min(w, h) * 0.11)}px ${FONT}`;
  ctx.fillText("컷편집", w * 0.08, h * 0.42);
}

function drawNight(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#12141a");
  sky.addColorStop(1, "#1a120e");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createLinearGradient(0, h * 0.42, 0, h * 0.62);
  glow.addColorStop(0, "rgba(255,90,10,0)");
  glow.addColorStop(1, "rgba(255,90,10,0.35)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, h * 0.42, w, h * 0.2);
  const ground = h * 0.78;
  for (let i = 0; i < 14; i++) {
    const bw = w * (0.06 + hash(i + 3) * 0.07);
    const x = (i / 14) * w * 1.05 - w * 0.02;
    const bh = h * (0.18 + hash(i + 9) * 0.34);
    ctx.fillStyle = hash(i) > 0.5 ? "#16130f" : "#221c16";
    ctx.fillRect(x, ground - bh, bw, bh);
    const cols = Math.max(2, Math.floor(bw / 18));
    const rows = Math.max(2, Math.floor(bh / 22));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = hash(i * 40 + r * 7 + c) > 0.62;
        const blink = Math.sin(t * 1.5 + hash(i + r + c) * 8) > 0.2;
        ctx.fillStyle = lit && blink ? "rgba(255,196,140,0.85)" : "rgba(236,238,242,0.05)";
        const wx = x + 6 + c * ((bw - 10) / cols);
        const wy = ground - bh + 8 + r * ((bh - 12) / rows);
        ctx.fillRect(wx, wy, Math.max(2, bw / cols - 8), Math.max(2, bh / rows - 12));
      }
    }
  }
  ctx.fillStyle = "#0e1014";
  ctx.fillRect(0, ground, w, h - ground);
  plateLabel(ctx, w, h, "SCENE 02  ·  야간");
}

function drawGraphic(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = "#101114";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(236,238,242,0.08)";
  ctx.lineWidth = 1;
  const gap = Math.min(w, h) * 0.08;
  for (let x = gap; x < w; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = gap; y < h; y += gap) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  const shift = ((t * 0.18) % 1) * w;
  ctx.save();
  ctx.translate(shift - w * 0.2, 0);
  ctx.rotate(-0.18);
  ctx.fillStyle = "#ff5a0a";
  ctx.fillRect(-w, h * 0.38, w * 3, Math.max(10, h * 0.035));
  ctx.restore();
  plateLabel(ctx, w, h, "SCENE 03  ·  그래픽");
  ctx.fillStyle = "#eceef2";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `750 ${Math.round(Math.min(w, h) * 0.16)}px ${FONT}`;
  const n = String(Math.floor(t * 10) % 100).padStart(2, "0");
  ctx.fillText(n, w * 0.08, h * 0.62);
}

function paintSource(
  ctx: CanvasRenderingContext2D,
  clip: VisualClip,
  time: number,
  w: number,
  h: number,
  alpha: number,
) {
  const { media } = useEditor.getState();
  const meta = media.find((item) => item.id === clip.mediaId);
  withLook(ctx, clip, w, h, alpha, () => {
    if (clip.type === "generator" || meta?.kind === "generator") {
      const srcT = clip.inPoint + time;
      const id = meta?.generator;
      if (id === "night") drawNight(ctx, w, h, srcT);
      else if (id === "graphic") drawGraphic(ctx, w, h, srcT);
      else drawStudio(ctx, w, h, srcT);
      return;
    }
    if (!meta) {
      drawOffline(ctx, w, h, clip.name, "연결된 소스가 없어요");
      return;
    }
    const source = drawable(meta.id, clip.id, meta.kind);
    if (!source) {
      drawOffline(ctx, w, h, clip.name, meta.kind === "image" ? "불러오는 중" : "파일을 다시 가져와 주세요");
      return;
    }
    const sw = meta.width || (source as HTMLVideoElement).videoWidth || w;
    const sh = meta.height || (source as HTMLVideoElement).videoHeight || h;
    const scale = Math.min(w / sw, h / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.drawImage(source, (w - dw) / 2, (h - dh) / 2, dw, dh);
  });
}

function paintClip(ctx: CanvasRenderingContext2D, clip: VisualClip, t: number, alphaMul: number, freeze: boolean) {
  const local = freeze ? Math.max(0, clip.duration - 0.04) : Math.max(0, t - clip.start);
  const sampleT = local * (clip.speed || 1);
  const alpha =
    alphaMul *
    clip.opacity *
    envelope(clip.start, clip.duration, clip.fadeIn, clip.fadeOut, freeze ? clip.start + clip.duration - 0.04 : t);
  paintSource(ctx, clip, sampleT, ctx.canvas.width, ctx.canvas.height, alpha);
}

function drawPair(
  ctx: CanvasRenderingContext2D,
  prev: VisualClip | null,
  incoming: VisualClip,
  p: number,
  t: number,
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const clamped = Math.max(0, Math.min(1, p));
  const prevFreeze = !prev || t >= prev.start + prev.duration - 0.02;
  const paintPrev = (mul: number) => {
    if (!prev || mul <= 0) return;
    paintClip(ctx, prev, t, mul, prevFreeze);
  };
  const paintIn = (mul: number) => {
    if (mul <= 0) return;
    paintClip(ctx, incoming, t, mul, false);
  };
  const type = incoming.transition;

  if (type === "dissolve" || type === "none") {
    paintPrev(1 - clamped);
    paintIn(clamped);
    return;
  }
  if (type === "dip-black" || type === "dip-white") {
    if (clamped < 0.5) paintPrev(1 - clamped * 2);
    else paintIn((clamped - 0.5) * 2);
    if (type === "dip-white") {
      ctx.save();
      ctx.globalAlpha = Math.sin(clamped * Math.PI) * 0.92;
      ctx.fillStyle = "#f4f1ea";
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
    return;
  }
  if (type === "wipe-left" || type === "wipe-right" || type === "wipe-up" || type === "wipe-down") {
    paintPrev(1);
    ctx.save();
    ctx.beginPath();
    if (type === "wipe-left") ctx.rect(0, 0, w * clamped, h);
    else if (type === "wipe-right") ctx.rect(w * (1 - clamped), 0, w * clamped, h);
    else if (type === "wipe-down") ctx.rect(0, 0, w, h * clamped);
    else ctx.rect(0, h * (1 - clamped), w, h * clamped);
    ctx.clip();
    paintIn(1);
    ctx.restore();
    return;
  }
  if (type === "slide-left" || type === "slide-right") {
    paintPrev(1);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    ctx.translate(type === "slide-left" ? (1 - clamped) * w : (clamped - 1) * w, 0);
    paintIn(1);
    ctx.restore();
    return;
  }
  if (type === "push-left") {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    ctx.save();
    ctx.translate(-clamped * w, 0);
    paintPrev(1);
    ctx.restore();
    ctx.save();
    ctx.translate((1 - clamped) * w, 0);
    paintIn(1);
    ctx.restore();
    ctx.restore();
    return;
  }
  if (type === "zoom") {
    paintPrev(1 - clamped);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    const z = 1.28 - 0.28 * clamped;
    ctx.scale(z, z);
    ctx.translate(-w / 2, -h / 2);
    paintIn(clamped);
    ctx.restore();
    return;
  }
  if (type === "flash") {
    paintPrev(1 - clamped);
    paintIn(clamped);
    ctx.save();
    ctx.globalAlpha = Math.sin(clamped * Math.PI) * 0.88;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return;
  }
  paintPrev(1);
  const slices = 9;
  for (let i = 0; i < slices; i++) {
    const jitter = (hash(i * 17 + Math.floor(clamped * 18)) - 0.5) * w * 0.09 * (1 - clamped);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, (h / slices) * i, w, h / slices + 1);
    ctx.clip();
    ctx.translate(jitter, 0);
    paintIn(clamped > 0.2 ? 1 : clamped / 0.2);
    ctx.restore();
  }
}

function drawTrack(ctx: CanvasRenderingContext2D, trackId: string, t: number) {
  const { clips } = useEditor.getState();
  const covering = clips
    .filter((clip) => clip.trackId === trackId && isVisual(clip) && t >= clip.start && t < clip.start + clip.duration)
    .sort((a, b) => a.start - b.start);
  if (covering.length === 0) return;
  const top = covering[covering.length - 1] as VisualClip;
  const local = t - top.start;
  const inTrans = top.transition !== "none" && top.transitionDur > 0.02 && local < top.transitionDur;
  if (!inTrans) {
    for (const clip of covering) paintClip(ctx, clip as VisualClip, t, 1, false);
    return;
  }
  const under = covering.length > 1 ? (covering[covering.length - 2] as VisualClip) : findPrev(trackId, top, clips);
  drawPair(ctx, under, top, local / top.transitionDur, t);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    const source = para.length ? para : " ";
    for (const ch of source) {
      const test = line + ch;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = ch.trim() ? ch : "";
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  return lines.slice(0, 5);
}

function animOf(preset: TextPreset, age: number, h: number, tail: number) {
  const u = Math.max(0, Math.min(1, age / 0.32));
  const ease = 1 - (1 - u) ** 3;
  let alpha = 1;
  let scale = 1;
  let dy = 0;
  if (preset.anim === "pop") {
    scale = 0.84 + 0.16 * ease;
    alpha = Math.min(1, age / 0.1);
  } else if (preset.anim === "rise" || preset.anim === "words") {
    alpha = Math.min(1, age / 0.18);
    dy = (1 - ease) * h * 0.025;
  } else if (preset.anim === "fade" || preset.anim === "karaoke") {
    alpha = Math.min(1, age / 0.16);
  }
  if (tail < 0.16) alpha *= Math.max(0, tail / 0.16);
  return { alpha, scale, dy };
}

function fillStroke(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill: string,
  preset: TextPreset,
  fontSize: number,
) {
  ctx.fillStyle = fill;
  ctx.shadowColor = "transparent";
  if (preset.stroke && preset.strokeWidth > 0) {
    ctx.lineJoin = "round";
    ctx.strokeStyle = preset.stroke;
    ctx.lineWidth = fontSize * preset.strokeWidth;
    ctx.strokeText(text, x, y);
  }
  if (preset.shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = fontSize * 0.18;
    ctx.shadowOffsetY = fontSize * 0.05;
  }
  ctx.fillText(text, x, y);
  ctx.shadowColor = "transparent";
}

function drawTextClip(ctx: CanvasRenderingContext2D, clip: TextClip, t: number) {
  const preset = presetById(clip.preset);
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const age = t - clip.start;
  const tail = clip.start + clip.duration - t;
  const motion = animOf(preset, age, h, tail);
  const fontSize = Math.max(16, h * preset.size * clip.fontScale);
  const fill = clip.color || preset.fill;
  const anchor = clip.y == null ? preset.y : clip.y;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, motion.alpha));
  ctx.textAlign = preset.align;
  ctx.textBaseline = "middle";
  ctx.font = `${preset.weight} ${fontSize}px ${FONT}`;

  if (preset.layout === "cinema") {
    ctx.fillStyle = "#07080a";
    ctx.fillRect(0, 0, w, h * 0.09);
    ctx.fillRect(0, h * 0.91, w, h * 0.09);
  }

  const maxWidth = w * (preset.layout === "lower" || preset.layout === "bar" ? 0.78 : 0.86);
  const lines = wrapText(ctx, clip.text || " ", maxWidth);
  const lineH = fontSize * 1.22;
  const blockH = lines.length * lineH;

  const cx = preset.align === "left" ? w * 0.1 : preset.align === "right" ? w * 0.9 : w / 2;
  let centerY = anchor * h + motion.dy;
  if (preset.layout === "bar") centerY = h - h * 0.055;
  if (preset.layout === "cinema") centerY = h * 0.9;

  ctx.translate(w / 2, centerY);
  ctx.rotate(preset.rotate);
  ctx.scale(motion.scale, motion.scale);
  ctx.translate(-w / 2, -centerY);

  if (preset.layout === "bar") {
    const barH = h * 0.11;
    ctx.fillStyle = preset.bg || "#f4f1ea";
    ctx.fillRect(0, h - barH, w, barH);
    ctx.fillStyle = preset.accent;
    ctx.fillRect(0, h - barH, Math.max(6, w * 0.012), barH);
  }

  if (preset.layout === "pill" || preset.layout === "lower") {
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width), 40);
    const padX = fontSize * 0.7;
    const padY = fontSize * 0.38;
    const boxW = widest + padX * 2;
    const boxH = blockH + padY * 2;
    const boxX = preset.align === "center" ? cx - boxW / 2 : preset.align === "right" ? cx - boxW : cx - fontSize * 0.2;
    const boxY = centerY - boxH / 2;
    ctx.fillStyle = preset.bg || "rgba(14,16,20,0.86)";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, preset.layout === "pill" ? boxH / 2 : 8);
    ctx.fill();
    if (preset.layout === "lower") {
      ctx.fillStyle = preset.accent;
      ctx.fillRect(boxX, boxY, 5, boxH);
    }
  }

  if (preset.anim === "words" || preset.layout === "words") {
    const parts = clip.text.includes(" ") ? clip.text.split(/\s+/).filter(Boolean) : chunkChars(clip.text, 4);
    const idx = Math.min(parts.length - 1, Math.floor((age / Math.max(0.2, clip.duration)) * parts.length));
    ctx.textAlign = "center";
    const gap = fontSize * 0.28;
    const widths = parts.map((part) => ctx.measureText(part).width);
    const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, parts.length - 1);
    let x = w / 2 - total / 2;
    parts.forEach((part, i) => {
      const active = i === idx;
      ctx.save();
      if (active) ctx.translate(0, -fontSize * 0.04);
      fillStroke(ctx, part, x + widths[i] / 2, centerY, active ? preset.accent : fill, preset, active ? fontSize * 1.06 : fontSize);
      ctx.restore();
      x += widths[i] + gap;
    });
    ctx.restore();
    return;
  }

  if (preset.id === "stack" && lines.length > 1) {
    const kicker = lines[0] ?? "";
    const rest = lines.slice(1);
    ctx.font = `600 ${fontSize * 0.42}px ${FONT}`;
    ctx.fillStyle = preset.accent;
    ctx.fillText(kicker, cx, centerY - blockH * 0.28);
    ctx.font = `${preset.weight} ${fontSize}px ${FONT}`;
    rest.forEach((line, i) => {
      fillStroke(ctx, line, cx, centerY + fontSize * 0.15 + i * lineH, fill, preset, fontSize);
    });
    ctx.restore();
    return;
  }

  lines.forEach((line, i) => {
    const y = centerY - blockH / 2 + lineH / 2 + i * lineH;
    if (preset.anim === "karaoke") {
      const total = lines.reduce((sum, item) => sum + item.length, 0) || 1;
      const reveal = Math.floor(total * Math.max(0, Math.min(1, age / clip.duration)));
      const before = lines.slice(0, i).reduce((sum, item) => sum + item.length, 0);
      const n = Math.max(0, Math.min(line.length, reveal - before));
      fillStroke(ctx, line, cx, y, fill, preset, fontSize);
      if (n > 0) {
        const width = ctx.measureText(line.slice(0, n)).width;
        const full = ctx.measureText(line).width;
        const left = preset.align === "center" ? cx - full / 2 : preset.align === "right" ? cx - full : cx;
        ctx.save();
        ctx.beginPath();
        ctx.rect(left, y - lineH / 2, width, lineH);
        ctx.clip();
        fillStroke(ctx, line, cx, y, preset.accent, preset, fontSize);
        ctx.restore();
      }
      return;
    }
    fillStroke(ctx, line, cx, y, fill, preset, fontSize);
  });
  ctx.restore();
}

function chunkChars(text: string, size: number): string[] {
  const parts: string[] = [];
  const clean = text.replace(/\s+/g, "");
  for (let i = 0; i < clean.length; i += size) parts.push(clean.slice(i, i + size));
  return parts.length ? parts : [" "];
}

function drawGuides(ctx: CanvasRenderingContext2D) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.save();
  ctx.strokeStyle = "rgba(236,238,242,0.35)";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  const m = 0.08;
  ctx.strokeRect(w * m, h * m, w * (1 - m * 2), h * (1 - m * 2));
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(255,90,10,0.7)";
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.86);
  ctx.lineTo(w * 0.88, h * 0.86);
  ctx.stroke();
  ctx.restore();
}

export function drawFrame(ctx: CanvasRenderingContext2D, t: number): void {
  const { tracks, clips, safe } = useEditor.getState();
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.filter = "none";
  ctx.fillStyle = "#07080a";
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const videos = tracks.filter((track) => track.kind === "video" && !track.hidden);
  for (const track of [...videos].reverse()) {
    const lctx = layerCtx(w, h);
    drawTrack(lctx, track.id, t);
    ctx.drawImage(lctx.canvas, 0, 0);
  }

  const texts = tracks.filter((track) => track.kind === "text" && !track.hidden);
  for (const track of [...texts].reverse()) {
    const items = clips
      .filter((clip): clip is TextClip => clip.type === "text" && clip.trackId === track.id && t >= clip.start && t < clip.start + clip.duration)
      .sort((a, b) => a.start - b.start);
    for (const clip of items) drawTextClip(ctx, clip, t);
  }

  if (safe) drawGuides(ctx);
}
