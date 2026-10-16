import { durationOf, useEditor } from "@/lib/editor/store";
import { ensureBed, onFrameReady, pauseAll, recordDestination, syncMedia, unlockAudio } from "@/lib/editor/media";
import { formatTimecode, INITIAL_TIME } from "@/lib/editor/project";
import { buildPlan, drawFrame } from "@/lib/editor/render";
import { ASPECTS } from "@/lib/editor/types";

export const transport = {
  time: INITIAL_TIME,
  playing: false,
  rate: 1,
  loop: false,
};

const listeners = new Set<() => void>();
const playheads = new Set<HTMLElement>();
const timecodes = new Set<HTMLElement>();

let canvas: HTMLCanvasElement | null = null;
let scroller: HTMLElement | null = null;
let raf = 0;
let last = 0;
let playing = false;
let exporting = false;
let subscribed = false;
let frameHooked = false;
let drawQueued = false;

function emit(): void {
  for (const fn of listeners) fn();
}

export function onTransport(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function bindPlayhead(el: HTMLElement | null): void {
  playheads.clear();
  if (el) playheads.add(el);
  updateChrome();
}

export function bindTimecode(el: HTMLElement | null): void {
  if (el) timecodes.add(el);
  updateChrome();
}

export function unbindTimecode(el: HTMLElement | null): void {
  if (el) timecodes.delete(el);
}

export function bindScroller(el: HTMLElement | null): void {
  scroller = el;
}

export function updateChrome(): void {
  const { pxPerSec, fps } = useEditor.getState();
  const x = `${transport.time * pxPerSec}px`;
  for (const el of playheads) el.style.transform = `translate3d(${x},0,0)`;
  const text = formatTimecode(transport.time, fps);
  for (const el of timecodes) el.textContent = text;
}

function drawOnly(): void {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  drawFrame(ctx, transport.time);
}

function renderAt(t: number, forward: boolean): void {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  drawFrame(ctx, t);
  syncMedia(buildPlan(t, forward), forward);
}

export function resize(): void {
  if (!canvas) return;
  const { w, h } = ASPECTS[useEditor.getState().aspect];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

export function renderNow(): void {
  resize();
  renderAt(transport.time, false);
  updateChrome();
}

export function seek(time: number): void {
  const dur = Math.max(0.1, durationOf());
  transport.time = Math.min(dur, Math.max(0, time));
  updateChrome();
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(() => {
    drawQueued = false;
    if (!exporting) renderAt(transport.time, false);
    updateChrome();
  });
}

function follow(): void {
  if (!scroller || !playing) return;
  const pps = useEditor.getState().pxPerSec;
  const x = transport.time * pps;
  const left = scroller.scrollLeft;
  const width = scroller.clientWidth;
  if (x > left + width * 0.82 || x < left + width * 0.12) {
    scroller.scrollLeft = Math.max(0, x - width * 0.25);
  }
}

function tick(now: number): void {
  if (!playing) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const dur = Math.max(0.1, durationOf());
  let next = transport.time + dt * transport.rate;
  if (transport.rate > 0 && next >= dur) {
    if (transport.loop) next = 0;
    else {
      transport.time = dur;
      drawOnly();
      updateChrome();
      pause();
      return;
    }
  }
  if (transport.rate < 0 && next <= 0) {
    transport.time = 0;
    drawOnly();
    updateChrome();
    pause();
    return;
  }
  transport.time = Math.max(0, next);
  const forward = playing && transport.rate > 0;
  renderAt(transport.time, forward);
  updateChrome();
  follow();
  if (playing) raf = requestAnimationFrame(tick);
}

export function pause(): void {
  if (!playing && !transport.playing) {
    pauseAll();
    return;
  }
  playing = false;
  transport.playing = false;
  cancelAnimationFrame(raf);
  pauseAll();
  emit();
  updateChrome();
}

export function play(): void {
  if (exporting) return;
  const dur = Math.max(0.1, durationOf());
  if (transport.rate > 0 && transport.time >= dur - 0.04) transport.time = 0;
  if (transport.rate < 0 && transport.time <= 0.04) transport.time = dur;
  playing = true;
  transport.playing = true;
  last = performance.now();
  unlockAudio();
  emit();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(tick);
}

export function togglePlay(): void {
  if (playing) pause();
  else play();
}

export function setRate(rate: number): void {
  transport.rate = Math.max(-4, Math.min(4, rate));
  emit();
}

export function toggleLoop(): void {
  transport.loop = !transport.loop;
  emit();
}

export function step(frames: number): void {
  pause();
  const fps = useEditor.getState().fps || 30;
  seek(transport.time + frames / fps);
}

export function zoomFit(): void {
  if (!scroller) return;
  const dur = Math.max(1, durationOf());
  useEditor.getState().setPxPerSec((scroller.clientWidth - 48) / dur);
  updateChrome();
}

export function bindCanvas(next: HTMLCanvasElement | null): void {
  canvas = next;
  if (!next) return;
  ensureBed();
  if (!subscribed) {
    subscribed = true;
    useEditor.subscribe(() => {
      if (!playing && !exporting) {
        resize();
        renderAt(transport.time, false);
        updateChrome();
      } else {
        updateChrome();
      }
    });
  }
  if (!frameHooked) {
    frameHooked = true;
    onFrameReady(() => {
      if (!playing && !exporting) drawOnly();
    });
  }
  resize();
  renderAt(transport.time, false);
  updateChrome();
  if (typeof document !== "undefined" && document.fonts?.ready) {
    void document.fonts.ready.then(() => {
      if (!playing && !exporting) drawOnly();
    });
  }
}

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  // MP4를 먼저 골라요. H.264(크롬·엣지·사파리) → MP4 안의 VP9(크로미움) → 그래도 안 되면 WebM
  const list = [
    "video/mp4;codecs=avc1.640028,mp4a.40.2",
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4;codecs=avc1,opus",
    "video/mp4;codecs=avc1",
    "video/mp4;codecs=vp9,opus",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return list.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function exportExtension(mime: string): string {
  return mime.includes("mp4") ? "mp4" : "webm";
}

export async function exportMovie(
  onProgress: (value: number) => void,
  signal: { cancelled: boolean },
): Promise<{ blob: Blob; mime: string }> {
  if (!canvas) throw new Error("미리보기가 아직 없어요");
  if (typeof MediaRecorder === "undefined") throw new Error("이 브라우저는 영상 내보내기를 지원하지 않아요");
  pause();
  exporting = true;
  canvas.dataset.preview = "0"; // 내보내는 동안엔 선택 테두리·안전영역 선을 그리지 않아요
  unlockAudio();
  const dur = durationOf();
  const { inMark, outMark, fps } = useEditor.getState();
  let start = 0;
  let end = dur;
  if (inMark != null && outMark != null && outMark > inMark + 0.15) {
    start = inMark;
    end = Math.min(dur, outMark);
  }
  transport.time = start;
  renderAt(start, false);

  const mime = pickMime();
  const stream = canvas.captureStream(Math.max(12, Math.round(fps)));
  const dest = recordDestination();
  const mixed = new MediaStream([
    ...stream.getVideoTracks(),
    ...(dest ? dest.stream.getAudioTracks() : []),
  ]);
  const options: MediaRecorderOptions = {
    videoBitsPerSecond: 5_000_000,
    audioBitsPerSecond: 128_000,
  };
  if (mime) options.mimeType = mime;
  const rec = new MediaRecorder(mixed, options);
  const chunks: Blob[] = [];
  rec.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  const stopped = new Promise<Blob>((resolve, reject) => {
    rec.onerror = () => reject(new Error("내보내기가 중단됐어요"));
    rec.onstop = () => resolve(new Blob(chunks, { type: mime || "video/webm" }));
  });
  rec.start(200);
  syncMedia(buildPlan(start, true), true);

  await new Promise<void>((resolve) => {
    let stamp = performance.now();
    const step = (now: number) => {
      if (signal.cancelled) {
        resolve();
        return;
      }
      const dt = Math.min(0.05, (now - stamp) / 1000);
      stamp = now;
      transport.time = Math.min(end, transport.time + dt);
      renderAt(transport.time, true);
      updateChrome();
      onProgress(Math.min(1, (transport.time - start) / Math.max(0.1, end - start)));
      if (transport.time >= end - 0.001) {
        resolve();
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  if (rec.state !== "inactive") rec.stop();
  pauseAll();
  exporting = false;
  canvas.dataset.preview = "1";
  transport.playing = false;
  playing = false;
  emit();
  const blob = await stopped;
  if (signal.cancelled) throw new Error("cancelled");
  return { blob, mime: mime || "video/webm" };
}
