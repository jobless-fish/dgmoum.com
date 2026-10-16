import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pause, Play, Repeat, SkipBack, SkipForward } from "lucide-react";
import {
  bindCanvas,
  bindTimecode,
  onTransport,
  play,
  setRate,
  step,
  toggleLoop,
  togglePlay,
  transport,
  unbindTimecode,
} from "@/lib/editor/engine";
import { formatTimecode } from "@/lib/editor/project";
import { presetById } from "@/lib/editor/presets";
import { textBoxes } from "@/lib/editor/render";
import type { TextClip } from "@/lib/editor/types";
import { useEditor } from "@/lib/editor/store";
import { ASPECTS } from "@/lib/editor/types";

const RATES = [0.5, 1, 1.5, 2];

export function Monitor() {
  const aspect = useEditor((s) => s.aspect);
  const fps = useEditor((s) => s.fps);
  const setIn = useEditor((s) => s.setIn);
  const setOut = useEditor((s) => s.setOut);
  const { w, h } = ASPECTS[aspect];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tcRef = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [rate, setRateState] = useState(1);
  const drag = useRef<{ id: string; px: number; py: number; x0: number; y0: number; moved: boolean } | null>(null);

  // 미리보기 화면 위의 자막을 눌러 고르고, 끌어서 옮겨요
  const toCanvas = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const c = event.currentTarget, r = c.getBoundingClientRect();
    return { x: ((event.clientX - r.left) * c.width) / r.width, y: ((event.clientY - r.top) * c.height) / r.height };
  };
  const hitText = (c: HTMLCanvasElement, x: number, y: number) => {
    const boxes = textBoxes.get(c) || [];
    for (let i = boxes.length - 1; i >= 0; i--) {
      const b = boxes[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
    }
    return null;
  };
  const onDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const c = event.currentTarget, p = toCanvas(event), hit = hitText(c, p.x, p.y);
    if (!hit) return;
    const st = useEditor.getState();
    const clip = st.clips.find((item) => item.id === hit.id) as TextClip | undefined;
    if (!clip) return;
    const track = st.tracks.find((item) => item.id === clip.trackId);
    st.selectOnly([clip.id]);
    if (track?.locked) { st.showToast("잠긴 트랙의 자막은 옮길 수 없어요"); return; }
    if (hit.fixed) { st.showToast("이 자막 모양은 위치가 정해져 있어요"); return; }
    event.preventDefault();
    c.setPointerCapture(event.pointerId);
    drag.current = { id: clip.id, px: p.x, py: p.y, x0: clip.x ?? 0, y0: clip.y ?? presetById(clip.preset).y, moved: false };
  };
  const onMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const c = event.currentTarget, p = toCanvas(event), d = drag.current;
    if (!d) { c.style.cursor = hitText(c, p.x, p.y) ? "move" : ""; return; }
    const st = useEditor.getState();
    if (!d.moved) { st.begin(); d.moved = true; } // 한 번 끈 것은 되돌리기 한 번으로 돌아가요
    const x = Math.max(-0.45, Math.min(0.45, d.x0 + (p.x - d.px) / c.width));
    const y = Math.max(0.04, Math.min(0.96, d.y0 + (p.y - d.py) / c.height));
    st.patchClip(d.id, { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 } as Partial<TextClip>);
  };
  const onUp = () => {
    const d = drag.current; drag.current = null;
    if (d?.moved) useEditor.getState().end();
  };

  useLayoutEffect(() => {
    bindCanvas(canvasRef.current);
    bindTimecode(tcRef.current);
  }, [aspect]);

  useEffect(() => {
    return () => {
      bindCanvas(null);
      unbindTimecode(tcRef.current);
    };
  }, []);

  useEffect(() => {
    return onTransport(() => {
      setPlaying(transport.playing);
      setLoop(transport.loop);
      setRateState(transport.rate);
    });
  }, []);

  return (
    <section className="monitor" aria-label="프로그램 모니터">
      <div className="stage-fit">
        <div className="program-frame" style={{ ["--aw" as string]: String(w), ["--ah" as string]: String(h) }}>
          <canvas
            ref={canvasRef}
            width={w}
            height={h}
            aria-label="미리보기 (자막을 끌어서 옮길 수 있어요)"
            data-preview="1"
            style={{ touchAction: "none" }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
        </div>
      </div>
      <div className="transport">
        <button className="icon-btn" type="button" aria-label="이전 프레임" onClick={() => step(-1)}>
          <SkipBack size={16} />
        </button>
        <button className="play-btn" type="button" aria-label={playing ? "일시정지" : "재생"} onClick={() => togglePlay()}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="icon-btn" type="button" aria-label="다음 프레임" onClick={() => step(1)}>
          <SkipForward size={16} />
        </button>
        <span className="tc" ref={tcRef}>
          {formatTimecode(transport.time, fps)}
        </span>
        <button className="seg-btn" type="button" data-on={String(loop)} aria-pressed={loop} onClick={() => toggleLoop()}>
          <Repeat size={14} />
          반복
        </button>
        <button
          className="seg-btn"
          type="button"
          onClick={() => {
            const idx = RATES.findIndex((item) => item === Math.abs(rate));
            const next = RATES[(idx + 1) % RATES.length] ?? 1;
            setRate(transport.rate < 0 ? -next : next);
            if (!transport.playing) play();
          }}
        >
          {Math.abs(rate)}×
        </button>
        <button className="seg-btn" type="button" onClick={() => setIn(transport.time)}>
          인점
        </button>
        <button className="seg-btn" type="button" onClick={() => setOut(transport.time)}>
          아웃
        </button>
        <span className="help-inline">스페이스 재생 · S 자르기 · 자막은 화면에서 끌어 옮기기</span>
      </div>
    </section>
  );
}
