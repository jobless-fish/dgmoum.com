import { create } from "zustand";
import { createSample, projectDuration, SAVE_KEY, uid } from "@/lib/editor/project";
import type {
  AspectId,
  AudioClip,
  Clip,
  MediaMeta,
  MobilePanel,
  PresetId,
  TextClip,
  ToolId,
  Track,
  TransitionType,
  VisualClip,
} from "@/lib/editor/types";
import { clipSpeed, isVisual } from "@/lib/editor/types";

type Snap = {
  projectName: string;
  aspect: AspectId;
  fps: number;
  tracks: Track[];
  clips: Clip[];
  media: MediaMeta[];
  inMark: number | null;
  outMark: number | null;
};

const sample = createSample();

type EditorState = {
  projectName: string;
  aspect: AspectId;
  fps: number;
  tracks: Track[];
  clips: Clip[];
  media: MediaMeta[];
  selectedIds: string[];
  tool: ToolId;
  snap: boolean;
  safe: boolean;
  inMark: number | null;
  outMark: number | null;
  pxPerSec: number;
  mobilePanel: MobilePanel;
  toast: string | null;
  canUndo: boolean;
  canRedo: boolean;
  gesture: number;
  past: Snap[];
  future: Snap[];
  toastTimer: number;

  showToast: (message: string) => void;
  begin: () => void;
  end: () => void;
  undo: () => void;
  redo: () => void;
  setTool: (tool: ToolId) => void;
  setSnap: (snap: boolean) => void;
  setSafe: (safe: boolean) => void;
  setAspect: (aspect: AspectId) => void;
  setFps: (fps: number) => void;
  setPxPerSec: (px: number) => void;
  setPanel: (panel: MobilePanel) => void;
  renameProject: (name: string) => void;
  select: (id: string | null, additive?: boolean) => void;
  selectOnly: (ids: string[]) => void;
  addMedia: (meta: MediaMeta) => void;
  placeMedia: (mediaId: string, trackId: string | "auto", start: number) => string | null;
  patchClip: (id: string, partial: Partial<Clip>) => void;
  moveClips: (ids: string[], dt: number) => void;
  trimLeft: (id: string, newStart: number) => void;
  trimRight: (id: string, newEnd: number) => void;
  splitAt: (time: number, ids?: string[]) => void;
  removeSelected: (ripple: boolean) => void;
  duplicateSelected: () => void;
  addText: (start: number, preset?: PresetId) => string | null;
  applyPreset: (preset: PresetId) => void;
  applyTransition: (type: TransitionType) => void;
  toggleTrack: (id: string, key: "muted" | "hidden" | "locked") => void;
  addTrack: (kind: Track["kind"]) => void;
  removeTrack: (id: string) => void;
  setIn: (time: number | null) => void;
  setOut: (time: number | null) => void;
  clearMarks: () => void;
  loadSnap: (snap: Snap) => void;
  serialize: () => Snap;
};

function take(state: EditorState): Snap {
  return {
    projectName: state.projectName,
    aspect: state.aspect,
    fps: state.fps,
    tracks: state.tracks,
    clips: state.clips,
    media: state.media,
    inMark: state.inMark,
    outMark: state.outMark,
  };
}

function sourceLimit(clip: Clip, media: MediaMeta[]): number {
  if (clip.type === "text" || clip.type === "image") return 1e9;
  const meta = media.find((m) => m.id === clip.mediaId);
  if (!meta) return 1e9;
  if (meta.kind === "generator" || meta.kind === "image") return 1e9;
  return meta.duration;
}

function blankVisual(media: MediaMeta, trackId: string, start: number): VisualClip {
  const type = media.kind === "image" ? "image" : media.kind === "generator" ? "generator" : "video";
  const duration =
    media.kind === "image" ? 5 : media.kind === "generator" ? 4 : Math.min(media.duration, 120);
  return {
    id: uid("clip"),
    trackId,
    type,
    name: media.name,
    mediaId: media.id,
    start: Math.max(0, start),
    duration: Math.max(0.2, duration),
    inPoint: 0,
    opacity: 1,
    volume: media.hasAudio ? 1 : 0,
    speed: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    brightness: 0,
    contrast: 0,
    saturate: 0,
    fadeIn: 0,
    fadeOut: 0,
    transition: "none",
    transitionDur: 0.6,
  };
}

function blankAudio(media: MediaMeta, trackId: string, start: number): AudioClip {
  return {
    id: uid("clip"),
    trackId,
    type: "audio",
    name: media.name,
    mediaId: media.id,
    start: Math.max(0, start),
    duration: Math.max(0.2, Math.min(media.duration || 5, 180)),
    inPoint: 0,
    volume: 1,
    fadeIn: 0,
    fadeOut: 0,
  };
}

export const useEditor = create<EditorState>((set, get) => ({
  projectName: sample.projectName,
  aspect: sample.aspect,
  fps: sample.fps,
  tracks: sample.tracks,
  clips: sample.clips,
  media: sample.media,
  selectedIds: [],
  tool: "select",
  snap: true,
  safe: true,
  inMark: null,
  outMark: null,
  pxPerSec: 76,
  mobilePanel: "timeline",
  toast: null,
  canUndo: false,
  canRedo: false,
  gesture: 0,
  past: [],
  future: [],
  toastTimer: 0,

  showToast: (message) => {
    const prev = get().toastTimer;
    if (prev && typeof window !== "undefined") window.clearTimeout(prev);
    const toastTimer =
      typeof window === "undefined"
        ? 0
        : window.setTimeout(() => {
            if (get().toast === message) set({ toast: null, toastTimer: 0 });
          }, 2600);
    set({ toast: message, toastTimer });
  },

  begin: () => {
    const state = get();
    if (state.gesture === 0) {
      const past = [...state.past, take(state)].slice(-80);
      set({ past, future: [], gesture: 1, canUndo: true, canRedo: false });
    } else {
      set({ gesture: state.gesture + 1 });
    }
  },

  end: () => set({ gesture: Math.max(0, get().gesture - 1) }),

  undo: () => {
    const state = get();
    if (state.gesture > 0 || state.past.length === 0) return;
    const past = state.past.slice();
    const snap = past.pop()!;
    const future = [...state.future, take(state)];
    set({
      ...snap,
      past,
      future,
      canUndo: past.length > 0,
      canRedo: true,
      selectedIds: state.selectedIds.filter((id) => snap.clips.some((c) => c.id === id)),
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const future = state.future.slice();
    const snap = future.pop()!;
    const past = [...state.past, take(state)].slice(-80);
    set({
      ...snap,
      past,
      future,
      canUndo: true,
      canRedo: future.length > 0,
      selectedIds: state.selectedIds.filter((id) => snap.clips.some((c) => c.id === id)),
    });
  },

  setTool: (tool) => set({ tool }),
  setSnap: (snap) => set({ snap }),
  setSafe: (safe) => set({ safe }),
  setAspect: (aspect) => {
    get().begin();
    set({ aspect });
    get().end();
  },
  setFps: (fps) => {
    get().begin();
    set({ fps });
    get().end();
  },
  setPxPerSec: (px) => set({ pxPerSec: Math.min(280, Math.max(18, px)) }),
  setPanel: (mobilePanel) => set({ mobilePanel }),
  renameProject: (projectName) => set({ projectName }),

  select: (id, additive) => {
    if (!id) {
      set({ selectedIds: [] });
      return;
    }
    const cur = get().selectedIds;
    if (additive) {
      set({
        selectedIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
      });
    } else if (!cur.includes(id) || cur.length > 1) {
      set({ selectedIds: [id] });
    }
  },

  selectOnly: (selectedIds) => set({ selectedIds }),

  addMedia: (meta) => {
    if (get().media.some((m) => m.id === meta.id)) {
      set({
        media: get().media.map((m) => (m.id === meta.id ? { ...m, ...meta } : m)),
      });
      return;
    }
    set({ media: [...get().media, meta] });
  },

  placeMedia: (mediaId, trackId, start) => {
    const state = get();
    const meta = state.media.find((m) => m.id === mediaId);
    if (!meta) return null;
    let track =
      trackId === "auto"
        ? undefined
        : state.tracks.find((t) => t.id === trackId && !t.locked);
    if (!track) {
      const kind = meta.kind === "audio" ? "audio" : "video";
      track = [...state.tracks].reverse().find((t) => t.kind === kind && !t.locked);
    }
    if (!track) return null;
    if (track.kind === "text") return null;
    if (track.kind === "audio" && meta.kind !== "audio" && meta.kind !== "video") return null;
    if (track.kind === "video" && meta.kind === "audio") return null;

    const clip =
      track.kind === "audio" || meta.kind === "audio"
        ? track.kind === "video"
          ? null
          : blankAudio(meta, track.id, start)
        : blankVisual(meta, track.id, start);
    if (!clip) {
      if (meta.kind === "video" && track.kind === "audio") {
        const audio = blankAudio(meta, track.id, start);
        set({ clips: [...state.clips, audio], selectedIds: [audio.id] });
        return audio.id;
      }
      return null;
    }
    if (meta.kind === "video" && track.kind === "audio") {
      const audio = blankAudio(meta, track.id, start);
      set({ clips: [...state.clips, audio], selectedIds: [audio.id] });
      return audio.id;
    }
    set({ clips: [...state.clips, clip], selectedIds: [clip.id] });
    return clip.id;
  },

  patchClip: (id, partial) => {
    set({
      clips: get().clips.map((clip) => {
        if (clip.id !== id) return clip;
        const next = { ...clip, ...partial } as Clip;
        if (isVisual(next) && isVisual(clip) && partial && "speed" in partial) {
          const speed = Math.min(4, Math.max(0.25, next.speed || 1));
          const duration = (clip.duration * clip.speed) / speed;
          const limit = sourceLimit(clip, get().media);
          const maxDur = Math.max(0.12, (limit - clip.inPoint) / speed);
          return { ...next, speed, duration: Math.min(duration, maxDur) };
        }
        return next;
      }),
    });
  },

  moveClips: (ids, dt) => {
    if (!dt) return;
    const moving = new Set(ids);
    set({
      clips: get().clips.map((clip) =>
        moving.has(clip.id) ? { ...clip, start: Math.max(0, clip.start + dt) } : clip,
      ),
    });
  },

  trimLeft: (id, newStart) => {
    set({
      clips: get().clips.map((clip) => {
        if (clip.id !== id) return clip;
        const speed = clipSpeed(clip);
        let start = newStart;
        let dIn = (start - clip.start) * speed;
        if (clip.inPoint + dIn < 0) {
          dIn = -clip.inPoint;
          start = clip.start - clip.inPoint / speed;
        }
        let duration = clip.duration - (start - clip.start);
        if (duration < 0.12) return clip;
        if (clip.type === "text") {
          return { ...clip, start, duration, inPoint: 0 };
        }
        const limit = sourceLimit(clip, get().media);
        const endSrc = clip.inPoint + dIn + duration * speed;
        if (endSrc > limit + 0.02) return clip;
        return { ...clip, start, duration, inPoint: clip.inPoint + dIn };
      }),
    });
  },

  trimRight: (id, newEnd) => {
    set({
      clips: get().clips.map((clip) => {
        if (clip.id !== id) return clip;
        let duration = newEnd - clip.start;
        const speed = clipSpeed(clip);
        const limit = sourceLimit(clip, get().media);
        const maxDur = (limit - clip.inPoint) / speed;
        duration = Math.max(0.12, Math.min(duration, maxDur));
        return { ...clip, duration };
      }),
    });
  },

  splitAt: (time, ids) => {
    const state = get();
    const next: Clip[] = [];
    let did = false;
    for (const clip of state.clips) {
      const track = state.tracks.find((t) => t.id === clip.trackId);
      const targeted = !ids || ids.includes(clip.id);
      const crosses = time > clip.start + 0.06 && time < clip.start + clip.duration - 0.06;
      if (!targeted || !crosses || track?.locked) {
        next.push(clip);
        continue;
      }
      did = true;
      const leftDur = time - clip.start;
      const speed = clipSpeed(clip);
      const right: Clip = {
        ...clip,
        id: uid("clip"),
        start: time,
        duration: clip.duration - leftDur,
        inPoint: clip.inPoint + leftDur * speed,
      };
      if (isVisual(right)) right.transition = "none";
      next.push({ ...clip, duration: leftDur }, right);
    }
    if (!did) return;
    set({ clips: next });
  },

  removeSelected: (ripple) => {
    const state = get();
    const ids = new Set(state.selectedIds);
    if (ids.size === 0) return;
    let clips = state.clips.filter((c) => !ids.has(c.id));
    if (ripple) {
      const removed = state.clips.filter((c) => ids.has(c.id));
      for (const clip of removed) {
        const gap = clip.duration;
        clips = clips.map((other) =>
          other.trackId === clip.trackId && other.start >= clip.start + clip.duration - 0.001
            ? { ...other, start: Math.max(0, other.start - gap) }
            : other,
        );
      }
    }
    set({ clips, selectedIds: [] });
  },

  duplicateSelected: () => {
    const state = get();
    const picked = state.clips.filter((c) => state.selectedIds.includes(c.id));
    if (picked.length === 0) return;
    const copies = picked.map((clip) => ({
      ...clip,
      id: uid("clip"),
      start: clip.start + clip.duration,
    }));
    set({ clips: [...state.clips, ...copies], selectedIds: copies.map((c) => c.id) });
  },

  addText: (start, preset) => {
    const state = get();
    let track = state.tracks.find((t) => t.kind === "text" && !t.locked);
    let tracks = state.tracks;
    if (!track) {
      track = {
        id: uid("tr"),
        kind: "text",
        name: "자막",
        muted: false,
        hidden: false,
        locked: false,
      };
      tracks = [track, ...tracks];
    }
    const clip: TextClip = {
      id: uid("sub"),
      trackId: track.id,
      type: "text",
      name: "자막",
      start: Math.max(0, start),
      duration: 2.4,
      inPoint: 0,
      text: "자막을 입력하세요",
      preset: preset ?? "shorts-hook",
      fontScale: 1,
      color: "",
      y: null,
    };
    set({ tracks, clips: [...state.clips, clip], selectedIds: [clip.id], mobilePanel: "inspector" });
    return clip.id;
  },

  applyPreset: (preset) => {
    const state = get();
    const selected = state.clips.filter((c) => state.selectedIds.includes(c.id) && c.type === "text");
    if (selected.length === 0) return;
    const ids = new Set(selected.map((c) => c.id));
    set({
      clips: state.clips.map((c) => (ids.has(c.id) && c.type === "text" ? { ...c, preset } : c)),
    });
  },

  applyTransition: (transition) => {
    const state = get();
    const ids = new Set(
      state.clips.filter((c) => state.selectedIds.includes(c.id) && isVisual(c)).map((c) => c.id),
    );
    if (ids.size === 0) {
      state.showToast("영상 클립을 먼저 선택하세요");
      return;
    }
    set({
      clips: state.clips.map((c) => (ids.has(c.id) && isVisual(c) ? { ...c, transition } : c)),
    });
  },

  toggleTrack: (id, key) => {
    set({
      tracks: get().tracks.map((t) => (t.id === id ? { ...t, [key]: !t[key] } : t)),
    });
  },

  addTrack: (kind) => {
    const tracks = get().tracks;
    const n = tracks.filter((t) => t.kind === kind).length + 1;
    const name = kind === "video" ? `V${n}` : kind === "audio" ? `A${n}` : `자막 ${n}`;
    const track: Track = {
      id: uid("tr"),
      kind,
      name,
      muted: false,
      hidden: false,
      locked: false,
    };
    if (kind === "audio") {
      set({ tracks: [...tracks, track] });
      return;
    }
    const textCount = tracks.filter((t) => t.kind === "text").length;
    const copy = tracks.slice();
    copy.splice(kind === "text" ? 0 : textCount, 0, track);
    set({ tracks: copy });
  },

  removeTrack: (id) => {
    const tracks = get().tracks;
    const track = tracks.find((t) => t.id === id);
    if (!track) return;
    if (track.kind === "video" && tracks.filter((t) => t.kind === "video").length <= 1) {
      get().showToast("영상 트랙은 하나 남겨 두세요");
      return;
    }
    set({
      tracks: tracks.filter((t) => t.id !== id),
      clips: get().clips.filter((c) => c.trackId !== id),
      selectedIds: get().selectedIds.filter((sid) =>
        get().clips.some((c) => c.id === sid && c.trackId !== id),
      ),
    });
  },

  setIn: (inMark) => set({ inMark }),
  setOut: (outMark) => set({ outMark }),
  clearMarks: () => set({ inMark: null, outMark: null }),

  loadSnap: (snap) => {
    set({
      ...snap,
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
      selectedIds: [],
      gesture: 0,
    });
  },

  serialize: () => take(get()),
}));

export function durationOf(state: { clips: Clip[] } = useEditor.getState()): number {
  return projectDuration(state.clips);
}

export function saveProject(): void {
  if (typeof localStorage === "undefined") return;
  const snap = useEditor.getState().serialize();
  localStorage.setItem(SAVE_KEY, JSON.stringify(snap));
}

export function loadSavedProject(): boolean {
  if (typeof localStorage === "undefined") return false;
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const snap = JSON.parse(raw) as Snap;
    if (!snap || !Array.isArray(snap.clips) || !Array.isArray(snap.tracks) || !Array.isArray(snap.media)) return false;
    if (!snap.aspect || !snap.projectName) return false;
    useEditor.getState().loadSnap(snap);
    return true;
  } catch {
    return false;
  }
}

void SAVE_KEY;
