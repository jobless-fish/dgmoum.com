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
          <canvas ref={canvasRef} width={w} height={h} aria-label="미리보기" />
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
        <span className="help-inline">스페이스 재생 · S 자르기</span>
      </div>
    </section>
  );
}
