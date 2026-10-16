import { useRef, useState } from "react";
import { FileVideo, Image as ImageIcon, Music, Upload } from "lucide-react";
import { edit, importFiles } from "@/lib/editor/actions";
import { transport } from "@/lib/editor/engine";
import { PRESETS, TRANSITIONS } from "@/lib/editor/presets";
import { formatTimecode } from "@/lib/editor/project";
import { useEditor } from "@/lib/editor/store";
import type { PresetId } from "@/lib/editor/types";
import { isVisual } from "@/lib/editor/types";

export function Bin() {
  const media = useEditor((s) => s.media);
  const fps = useEditor((s) => s.fps);
  const selected = useEditor((s) => s.selectedIds);
  const clips = useEditor((s) => s.clips);
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"media" | "subs" | "fx">("subs");
  const selectedClips = clips.filter((clip) => selected.includes(clip.id));
  const textPreset = selectedClips.find((clip) => clip.type === "text");
  const visual = selectedClips.find((clip) => isVisual(clip));

  return (
    <aside className="bin" aria-label="소스">
      <div className="panel-head">
        <h2>소스</h2>
        <button className="btn" type="button" onClick={() => inputRef.current?.click()}>
          <Upload size={14} /> 가져오기
        </button>
        <input
          ref={inputRef}
          hidden
          type="file"
          multiple
          accept="video/*,audio/*,image/*"
          onChange={(event) => {
            if (event.target.files) void importFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      <div className="seg" role="tablist">
        {(
          [
            ["media", "미디어"],
            ["subs", "자막"],
            ["fx", "전환"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" data-on={String(tab === id)} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "media" ? (
        <div className="media-list">
          {media.map((item) => (
            <div
              key={item.id}
              className="media-card"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("application/x-dgcut", item.id);
                event.dataTransfer.effectAllowed = "copy";
              }}
              onDoubleClick={() => edit(() => useEditor.getState().placeMedia(item.id, "auto", transport.time))}
            >
              <span className={`swatch ${item.kind === "audio" ? "audio" : item.kind === "image" ? "image" : item.kind === "generator" ? "gen" : ""}`}>
                {item.kind === "audio" ? <Music size={16} /> : item.kind === "image" ? <ImageIcon size={16} /> : <FileVideo size={16} />}
              </span>
              <span>
                <b>{item.name}</b>
                <small>
                  {item.kind === "generator" ? "모션 플레이트" : item.kind === "image" ? "이미지" : formatTimecode(item.duration, fps)}
                  {" · 더블클릭 또는 트랙에 놓기"}
                </small>
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "subs" ? (
        <div className="preset-list">
          <p className="empty-note">누르면 선택한 자막에 적용되고, 선택이 없으면 재생헤드에 새 자막이 생겨요.</p>
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="preset-card"
              data-on={String(textPreset?.type === "text" && textPreset.preset === preset.id)}
              onClick={() => {
                const store = useEditor.getState();
                const hasText = store.clips.some((clip) => store.selectedIds.includes(clip.id) && clip.type === "text");
                edit(() => {
                  if (hasText) store.applyPreset(preset.id as PresetId);
                  else store.addText(transport.time, preset.id);
                });
              }}
            >
              <span>
                <b>{preset.name}</b>
                <small>
                  {preset.group} · {preset.blurb}
                </small>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {tab === "fx" ? (
        <div className="fx-grid">
          {TRANSITIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="fx-card"
              data-on={String(visual && isVisual(visual) && visual.transition === item.id)}
              onClick={() => edit(() => useEditor.getState().applyTransition(item.id))}
            >
              <span>
                <b>{item.name}</b>
                <small>{item.blurb}</small>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
