import { Trash2 } from "lucide-react";
import { edit } from "@/lib/editor/actions";
import { PRESETS } from "@/lib/editor/presets";
import { useEditor } from "@/lib/editor/store";
import type { PresetId } from "@/lib/editor/types";
import { isVisual } from "@/lib/editor/types";
import { FieldSlider } from "@/components/editor/controls";

export function Inspector() {
  const clips = useEditor((s) => s.clips);
  const selectedIds = useEditor((s) => s.selectedIds);
  const patch = useEditor((s) => s.patchClip);
  const selected = clips.filter((clip) => selectedIds.includes(clip.id));
  const clip = selected[selected.length - 1];

  if (!clip) {
    return (
      <aside className="inspector" aria-label="속성">
        <div className="panel-head">
          <h2>속성</h2>
        </div>
        <p className="empty-note">클립을 선택하면 길이, 변형, 색, 자막, 전환을 바꿀 수 있어요.</p>
      </aside>
    );
  }

  return (
    <aside className="inspector" aria-label="속성">
      <div className="panel-head">
        <h2>{clip.name}</h2>
        <button
          className="icon-btn"
          type="button"
          aria-label="삭제"
          onClick={() => edit(() => useEditor.getState().removeSelected(false))}
        >
          <Trash2 size={15} />
        </button>
      </div>
      {selected.length > 1 ? <p className="empty-note">{selected.length}개 선택 · 슬라이더는 마지막 클립</p> : null}

      <FieldSlider
        label="시작"
        min={0}
        max={Math.max(30, clip.start + clip.duration + 5)}
        step={0.01}
        value={clip.start}
        format={(value) => `${value.toFixed(2)}s`}
        onChange={(start) => {
          const dt = start - clip.start;
          useEditor.getState().moveClips([clip.id], dt);
        }}
      />
      <FieldSlider
        label="길이"
        min={0.12}
        max={60}
        step={0.01}
        value={clip.duration}
        format={(value) => `${value.toFixed(2)}s`}
        onChange={(duration) => useEditor.getState().trimRight(clip.id, clip.start + duration)}
      />

      {isVisual(clip) ? (
        <>
          <h3 className="subhead">변형</h3>
          <FieldSlider label="크기" min={0.2} max={3} step={0.01} value={clip.scale} format={(v) => `${Math.round(v * 100)}%`} onChange={(scale) => patch(clip.id, { scale })} />
          <FieldSlider label="가로" min={-1} max={1} step={0.01} value={clip.offsetX} onChange={(offsetX) => patch(clip.id, { offsetX })} />
          <FieldSlider label="세로" min={-1} max={1} step={0.01} value={clip.offsetY} onChange={(offsetY) => patch(clip.id, { offsetY })} />
          <FieldSlider label="회전" min={-180} max={180} step={1} value={clip.rotation} format={(v) => `${Math.round(v)}°`} onChange={(rotation) => patch(clip.id, { rotation })} />
          <FieldSlider label="불투명" min={0} max={1} step={0.01} value={clip.opacity} format={(v) => `${Math.round(v * 100)}%`} onChange={(opacity) => patch(clip.id, { opacity })} />
          <h3 className="subhead">색</h3>
          <FieldSlider label="밝기" min={-1} max={1} step={0.01} value={clip.brightness} onChange={(brightness) => patch(clip.id, { brightness })} />
          <FieldSlider label="대비" min={-1} max={1} step={0.01} value={clip.contrast} onChange={(contrast) => patch(clip.id, { contrast })} />
          <FieldSlider label="채도" min={-1} max={1} step={0.01} value={clip.saturate} onChange={(saturate) => patch(clip.id, { saturate })} />
          <h3 className="subhead">소리 · 속도</h3>
          <FieldSlider label="볼륨" min={0} max={1} step={0.01} value={clip.volume} format={(v) => `${Math.round(v * 100)}%`} onChange={(volume) => patch(clip.id, { volume })} />
          <FieldSlider label="속도" min={0.25} max={4} step={0.05} value={clip.speed} format={(v) => `${v.toFixed(2)}×`} onChange={(speed) => patch(clip.id, { speed })} />
          <FieldSlider label="페이드 인" min={0} max={3} step={0.01} value={clip.fadeIn} format={(v) => `${v.toFixed(2)}s`} onChange={(fadeIn) => patch(clip.id, { fadeIn })} />
          <FieldSlider label="페이드 아웃" min={0} max={3} step={0.01} value={clip.fadeOut} format={(v) => `${v.toFixed(2)}s`} onChange={(fadeOut) => patch(clip.id, { fadeOut })} />
          <FieldSlider
            label="전환 길이"
            min={0.1}
            max={2}
            step={0.01}
            value={clip.transitionDur}
            format={(v) => `${v.toFixed(2)}s`}
            onChange={(transitionDur) => patch(clip.id, { transitionDur })}
          />
          <p className="empty-note">전환은 클립이 시작하는 지점에 붙어요. 소스 탭의 전환에서 고르세요.</p>
        </>
      ) : null}

      {clip.type === "audio" ? (
        <>
          <h3 className="subhead">소리</h3>
          <FieldSlider label="볼륨" min={0} max={1} step={0.01} value={clip.volume} format={(v) => `${Math.round(v * 100)}%`} onChange={(volume) => patch(clip.id, { volume })} />
          <FieldSlider label="페이드 인" min={0} max={3} step={0.01} value={clip.fadeIn} format={(v) => `${v.toFixed(2)}s`} onChange={(fadeIn) => patch(clip.id, { fadeIn })} />
          <FieldSlider label="페이드 아웃" min={0} max={3} step={0.01} value={clip.fadeOut} format={(v) => `${v.toFixed(2)}s`} onChange={(fadeOut) => patch(clip.id, { fadeOut })} />
        </>
      ) : null}

      {clip.type === "text" ? (
        <>
          <h3 className="subhead">자막</h3>
          <label className="field">
            <span className="field-label">
              <span>내용</span>
            </span>
            <textarea
              className="textarea"
              value={clip.text}
              onFocus={() => useEditor.getState().begin()}
              onBlur={() => useEditor.getState().end()}
              onChange={(event) => patch(clip.id, { text: event.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">
              <span>프리셋</span>
            </span>
            <select
              className="select"
              value={clip.preset}
              onChange={(event) => edit(() => useEditor.getState().applyPreset(event.target.value as PresetId))}
            >
              {PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.group} · {preset.name}
                </option>
              ))}
            </select>
          </label>
          <FieldSlider label="크기" min={0.5} max={2.2} step={0.01} value={clip.fontScale} format={(v) => `${Math.round(v * 100)}%`} onChange={(fontScale) => patch(clip.id, { fontScale })} />
          <FieldSlider
            label="세로 위치"
            min={0.1}
            max={0.95}
            step={0.01}
            value={clip.y ?? PRESETS.find((preset) => preset.id === clip.preset)?.y ?? 0.8}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(y) => patch(clip.id, { y })}
          />
          <label className="field">
            <span className="field-label">
              <span>글자색</span>
            </span>
            <span className="color-row">
              <input
                type="color"
                aria-label="글자색"
                value={clip.color || "#ffffff"}
                onChange={(event) => patch(clip.id, { color: event.target.value })}
              />
              <button className="btn ghost" type="button" onClick={() => edit(() => patch(clip.id, { color: "" }))}>
                프리셋 색
              </button>
            </span>
          </label>
          <p className="empty-note">줄바꿈은 스택 캡션에서 윗줄을 작게 보여 줘요. 단어 강조는 띄어쓰기 단위로 움직입니다.</p>
        </>
      ) : null}

      <div className="row-actions">
        <button className="btn" type="button" onClick={() => edit(() => useEditor.getState().removeSelected(true))}>
          잔물결 삭제
        </button>
        <button className="btn" type="button" onClick={() => edit(() => useEditor.getState().duplicateSelected())}>
          복제
        </button>
      </div>
    </aside>
  );
}
