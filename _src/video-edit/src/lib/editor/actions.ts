import { transport } from "@/lib/editor/engine";
import { hasUrl, ingestFile } from "@/lib/editor/media";
import { BED_ID } from "@/lib/editor/project";
import { useEditor } from "@/lib/editor/store";
import type { Clip } from "@/lib/editor/types";
import { isVisual } from "@/lib/editor/types";

let clipboard: Clip[] = [];

export function edit(fn: () => void): void {
  const store = useEditor.getState();
  store.begin();
  fn();
  store.end();
}

function endOf(kind: "video" | "audio"): number {
  const { clips, tracks } = useEditor.getState();
  const ids = new Set(tracks.filter((track) => track.kind === kind).map((track) => track.id));
  let end = 0;
  for (const clip of clips) {
    if (ids.has(clip.trackId)) end = Math.max(end, clip.start + clip.duration);
  }
  return end;
}

export async function importFiles(list: FileList | File[]): Promise<void> {
  const files = [...list].filter((file) => /^(video|audio|image)\//.test(file.type) || /\.(mp4|mov|webm|mkv|m4v|mp3|wav|m4a|aac|ogg|flac|png|jpe?g|webp|gif)$/i.test(file.name));
  if (files.length === 0) {
    useEditor.getState().showToast("영상, 사진, 소리 파일만 올릴 수 있어요");
    return;
  }
  let placed = 0;
  let began = false;
  for (const file of files) {
    try {
      const meta = await ingestFile(file);
      const store = useEditor.getState();
      if (!began) {
        store.begin();
        began = true;
      }
      store.addMedia(meta);
      const kind = meta.kind === "audio" ? "audio" : "video";
      store.placeMedia(meta.id, "auto", endOf(kind));
      placed += 1;
    } catch (error) {
      useEditor.getState().showToast(error instanceof Error ? error.message : "가져오지 못했어요");
    }
  }
  if (began) useEditor.getState().end();
  if (placed > 0) {
    useEditor.getState().showToast(placed === 1 ? "타임라인 끝에 올렸어요" : `${placed}개를 이어 붙였어요`);
  }
}

export function copySelection(): void {
  const { clips, selectedIds } = useEditor.getState();
  clipboard = clips.filter((clip) => selectedIds.includes(clip.id)).map((clip) => ({ ...clip }));
  if (clipboard.length === 0) return;
  useEditor.getState().showToast("복사했어요");
}

export function pasteClipboard(): void {
  if (clipboard.length === 0) return;
  const min = Math.min(...clipboard.map((clip) => clip.start));
  const copies = clipboard.map((clip) => ({
    ...clip,
    id: `clip-${Math.random().toString(36).slice(2, 9)}`,
    start: Math.max(0, transport.time + (clip.start - min)),
  }));
  edit(() => {
    useEditor.setState({
      clips: [...useEditor.getState().clips, ...copies],
      selectedIds: copies.map((clip) => clip.id),
    });
  });
}

export function splitPlayhead(): void {
  const { selectedIds, splitAt, clips, tracks } = useEditor.getState();
  const time = transport.time;
  const crossing = clips.filter((clip) => {
    const track = tracks.find((item) => item.id === clip.trackId);
    if (track?.locked) return false;
    return time > clip.start + 0.06 && time < clip.start + clip.duration - 0.06;
  });
  const ids = selectedIds.length
    ? crossing.filter((clip) => selectedIds.includes(clip.id)).map((clip) => clip.id)
    : crossing.map((clip) => clip.id);
  if (ids.length === 0) {
    useEditor.getState().showToast("자를 클립이 재생헤드 위에 없어요");
    return;
  }
  edit(() => splitAt(time, ids));
}

export function missingImports(): number {
  const { clips, media } = useEditor.getState();
  let count = 0;
  for (const clip of clips) {
    if (clip.type === "text" || !isVisual(clip) && clip.type !== "audio") continue;
    if (clip.type !== "audio" && clip.type !== "video" && clip.type !== "image") continue;
    const meta = media.find((item) => item.id === clip.mediaId);
    if (!meta || meta.kind === "generator" || meta.id === BED_ID) continue;
    if (!hasUrl(clip.mediaId)) count += 1;
  }
  return count;
}
