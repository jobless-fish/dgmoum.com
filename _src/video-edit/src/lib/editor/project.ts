import type {
  AspectId,
  AudioClip,
  Clip,
  GeneratorId,
  MediaMeta,
  TextClip,
  Track,
  VisualClip,
} from "@/lib/editor/types";

export const INITIAL_TIME = 1.2;
export const BED_ID = "gen-bed";

export function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatTimecode(time: number, fps: number): string {
  const fpsR = Math.max(1, Math.round(fps));
  const t = Math.max(0, time);
  const framesTotal = Math.floor(t * fpsR + 1e-4);
  const ff = framesTotal % fpsR;
  const sec = Math.floor(framesTotal / fpsR);
  const ss = sec % 60;
  const mm = Math.floor(sec / 60) % 60;
  const hh = Math.floor(sec / 3600);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${p(hh)}:${p(mm)}:${p(ss)}:${p(ff)}`;
}

export function projectDuration(clips: Clip[]): number {
  let end = 1;
  for (const clip of clips) end = Math.max(end, clip.start + clip.duration);
  return end;
}

export function generatorMedia(): MediaMeta[] {
  const gens: { id: GeneratorId; name: string }[] = [
    { id: "studio", name: "스튜디오" },
    { id: "night", name: "야간" },
    { id: "graphic", name: "그래픽" },
  ];
  return gens.map((g) => ({
    id: `gen-${g.id}`,
    name: g.name,
    kind: "generator" as const,
    duration: 600,
    width: 1280,
    height: 720,
    hasAudio: false,
    generator: g.id,
  }));
}

export function bedMeta(): MediaMeta {
  return {
    id: BED_ID,
    name: "소프트 비트",
    kind: "audio",
    duration: 12.5,
    width: 0,
    height: 0,
    hasAudio: true,
    peaks: bedPeaks(),
  };
}

function bedPeaks(): number[] {
  const bars = 64;
  const peaks: number[] = [];
  for (let i = 0; i < bars; i++) {
    const t = (i / bars) * 12.5;
    const beat = t % 0.5;
    const kick = Math.exp(-beat * 14) * 0.85;
    const tone = 0.28 + 0.12 * Math.sin(t * 1.7);
    peaks.push(Math.min(1, kick * 0.7 + tone));
  }
  return peaks;
}

function visual(
  partial: Pick<VisualClip, "id" | "trackId" | "name" | "mediaId" | "start" | "duration"> &
    Partial<VisualClip>,
): VisualClip {
  return {
    type: "generator",
    inPoint: 0,
    opacity: 1,
    volume: 1,
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
    ...partial,
  };
}

function text(
  partial: Pick<TextClip, "id" | "trackId" | "start" | "duration" | "text" | "preset"> &
    Partial<TextClip>,
): TextClip {
  return {
    type: "text",
    name: "자막",
    inPoint: 0,
    fontScale: 1,
    color: "",
    y: null,
    ...partial,
  };
}

export function createSample(): {
  projectName: string;
  aspect: AspectId;
  fps: number;
  tracks: Track[];
  clips: Clip[];
  media: MediaMeta[];
} {
  const tracks: Track[] = [
    { id: "tr-text", kind: "text", name: "자막", muted: false, hidden: false, locked: false },
    { id: "tr-v2", kind: "video", name: "V2", muted: false, hidden: false, locked: false },
    { id: "tr-v1", kind: "video", name: "V1", muted: false, hidden: false, locked: false },
    { id: "tr-a1", kind: "audio", name: "A1", muted: false, hidden: false, locked: false },
  ];

  const clips: Clip[] = [
    visual({
      id: "c-studio",
      trackId: "tr-v1",
      name: "스튜디오",
      mediaId: "gen-studio",
      start: 0,
      duration: 4,
    }),
    visual({
      id: "c-night",
      trackId: "tr-v1",
      name: "야간",
      mediaId: "gen-night",
      start: 4,
      duration: 4.2,
      transition: "dissolve",
      transitionDur: 0.7,
    }),
    visual({
      id: "c-graphic",
      trackId: "tr-v1",
      name: "그래픽",
      mediaId: "gen-graphic",
      start: 8.2,
      duration: 4.3,
      transition: "wipe-left",
      transitionDur: 0.55,
    }),
    text({
      id: "s1",
      trackId: "tr-text",
      start: 0.35,
      duration: 2.9,
      text: "이것만 기억해",
      preset: "shorts-hook",
    }),
    text({
      id: "s2",
      trackId: "tr-text",
      start: 3.5,
      duration: 2.6,
      text: "컷은 드래그로 자르고",
      preset: "shorts-pill",
    }),
    text({
      id: "s3",
      trackId: "tr-text",
      start: 6.45,
      duration: 3,
      text: "전환은 클립 앞에 붙어요",
      preset: "karaoke",
    }),
    text({
      id: "s4",
      trackId: "tr-text",
      start: 9.7,
      duration: 2.5,
      text: "바로 내보내기",
      preset: "impact",
    }),
    {
      id: "a-bed",
      trackId: "tr-a1",
      type: "audio",
      name: "소프트 비트",
      mediaId: BED_ID,
      start: 0,
      duration: 12.5,
      inPoint: 0,
      volume: 0.72,
      fadeIn: 0.15,
      fadeOut: 0.8,
    } satisfies AudioClip,
  ];

  return {
    projectName: "숏폼 샘플",
    aspect: "16:9",
    fps: 30,
    tracks,
    clips,
    media: [...generatorMedia(), bedMeta()],
  };
}

export const SAVE_KEY = "dgcut-project-v1";
