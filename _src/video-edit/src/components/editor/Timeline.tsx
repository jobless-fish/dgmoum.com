import { memo, useEffect, useMemo, useRef } from "react";
import { Eye, EyeOff, Lock, LockOpen, Magnet, MousePointer2, Plus, Scissors, Type, Volume2, VolumeX, ZoomIn, ZoomOut } from "lucide-react";
import { edit } from "@/lib/editor/actions";
import { bindPlayhead, bindScroller, seek, transport, updateChrome, zoomFit } from "@/lib/editor/engine";
import { formatTimecode } from "@/lib/editor/project";
import { useEditor } from "@/lib/editor/store";
import type { Clip, Track } from "@/lib/editor/types";
import { isVisual } from "@/lib/editor/types";

function snapTime(time: number, ignore: Set<string>, pps: number): number {
  const { snap, clips, inMark, outMark } = useEditor.getState();
  if (!snap) return Math.max(0, time);
  const thresh = 8 / pps;
  const points = [0, transport.time];
  if (inMark != null) points.push(inMark);
  if (outMark != null) points.push(outMark);
  for (const clip of clips) {
    if (ignore.has(clip.id)) continue;
    points.push(clip.start, clip.start + clip.duration);
  }
  let best = Math.max(0, time);
  let bestD = thresh;
  for (const point of points) {
    const dist = Math.abs(point - time);
    if (dist < bestD) {
      best = point;
      bestD = dist;
    }
  }
  return Math.max(0, best);
}

const Playhead = memo(function Playhead() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bindPlayhead(ref.current);
    return () => bindPlayhead(null);
  }, []);
  return <div className="playhead" ref={ref} />;
});

export function Timeline() {
  const tracks = useEditor((s) => s.tracks);
  const clips = useEditor((s) => s.clips);
  const media = useEditor((s) => s.media);
  const selected = useEditor((s) => s.selectedIds);
  const tool = useEditor((s) => s.tool);
  const snap = useEditor((s) => s.snap);
  const safe = useEditor((s) => s.safe);
  const pps = useEditor((s) => s.pxPerSec);
  const fps = useEditor((s) => s.fps);
  const inMark = useEditor((s) => s.inMark);
  const outMark = useEditor((s) => s.outMark);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    mode: "move" | "left" | "right";
    ids: string[];
    x: number;
    orig: Clip[];
    began: boolean;
  } | null>(null);

  const duration = useMemo(() => Math.max(8, ...clips.map((clip) => clip.start + clip.duration), 0), [clips]);
  const width = duration * pps + 160;

  useEffect(() => {
    bindScroller(scrollerRef.current);
    updateChrome();
  }, [pps, duration]);

  function timeAt(clientX: number): number {
    const inner = innerRef.current;
    if (!inner) return 0;
    const rect = inner.getBoundingClientRect();
    return Math.max(0, (clientX - rect.left) / pps);
  }

  function onClipDown(event: React.PointerEvent, clip: Clip, mode: "move" | "left" | "right") {
    event.stopPropagation();
    const track = tracks.find((item) => item.id === clip.trackId);
    if (track?.locked) return;
    if (tool === "razor" && mode === "move") {
      edit(() => useEditor.getState().splitAt(timeAt(event.clientX), [clip.id]));
      return;
    }
    if (tool === "text" && mode === "move" && track?.kind === "text") {
      edit(() => useEditor.getState().addText(timeAt(event.clientX)));
      return;
    }
    useEditor.getState().select(clip.id, event.shiftKey);
    const ids = event.shiftKey
      ? Array.from(new Set([...useEditor.getState().selectedIds, clip.id]))
      : useEditor.getState().selectedIds.includes(clip.id)
        ? useEditor.getState().selectedIds
        : [clip.id];
    const moving = mode === "move" ? ids : [clip.id];
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      mode,
      ids: moving,
      x: event.clientX,
      orig: useEditor.getState().clips.map((item) => ({ ...item })),
      began: false,
    };
  }

  function onMove(event: React.PointerEvent) {
    const session = drag.current;
    if (!session) return;
    const dx = event.clientX - session.x;
    if (!session.began) {
      if (Math.abs(dx) < 3) return;
      session.began = true;
      useEditor.getState().begin();
    }
    const origClips = session.orig;
    const ignore = new Set(session.ids);
    useEditor.setState({
      clips: useEditor.getState().clips.map((clip) => origClips.find((item) => item.id === clip.id) ?? clip),
    });
    const lead = origClips.find((clip) => clip.id === session.ids[0]);
    if (!lead) return;
    if (session.mode === "move") {
      const proposed = lead.start + dx / pps;
      const snapped = snapTime(proposed, ignore, pps);
      const dt = snapped - lead.start;
      useEditor.getState().moveClips(session.ids, dt);
      return;
    }
    if (session.mode === "left") {
      const snapped = snapTime(lead.start + dx / pps, ignore, pps);
      useEditor.getState().trimLeft(lead.id, snapped);
      return;
    }
    const snapped = snapTime(lead.start + lead.duration + dx / pps, ignore, pps);
    useEditor.getState().trimRight(lead.id, snapped);
  }

  function onUp() {
    const session = drag.current;
    drag.current = null;
    if (session?.began) useEditor.getState().end();
  }

  function onLaneDown(event: React.PointerEvent, track: Track) {
    const time = timeAt(event.clientX);
    if (tool === "text") {
      edit(() => useEditor.getState().addText(time));
      return;
    }
    if (tool === "razor") return;
    useEditor.getState().select(null);
    seek(time);
  }

  function onDrop(event: React.DragEvent, track: Track) {
    const mediaId = event.dataTransfer.getData("application/x-dgcut");
    if (!mediaId) return;
    event.preventDefault();
    event.stopPropagation();
    const start = timeAt(event.clientX);
    edit(() => useEditor.getState().placeMedia(mediaId, track.id, start));
  }

  const ticks = useMemo(() => {
    const steps = [0.1, 0.2, 0.5, 1, 2, 5, 10, 30, 60];
    const step = steps.find((item) => item >= 80 / pps) ?? 60;
    const marks: number[] = [];
    for (let t = 0; t <= duration + step; t += step) marks.push(Number(t.toFixed(3)));
    return { step, marks };
  }, [pps, duration]);

  return (
    <section className="timeline" aria-label="타임라인">
      <div className="toolrow">
        <button className="tool-btn" type="button" data-on={String(tool === "select")} onClick={() => useEditor.getState().setTool("select")}>
          <MousePointer2 size={15} /> 선택
        </button>
        <button className="tool-btn" type="button" data-on={String(tool === "razor")} onClick={() => useEditor.getState().setTool("razor")}>
          <Scissors size={15} /> 자르기
        </button>
        <button className="tool-btn" type="button" data-on={String(tool === "text")} onClick={() => useEditor.getState().setTool("text")}>
          <Type size={15} /> 자막
        </button>
        <button className="tool-btn" type="button" data-on={String(snap)} onClick={() => useEditor.getState().setSnap(!snap)}>
          <Magnet size={15} /> 스냅
        </button>
        <button className="tool-btn" type="button" data-on={String(safe)} onClick={() => useEditor.getState().setSafe(!safe)}>
          안전영역
        </button>
        <button className="icon-btn" type="button" aria-label="축소" onClick={() => useEditor.getState().setPxPerSec(pps / 1.25)}>
          <ZoomOut size={16} />
        </button>
        <button className="icon-btn" type="button" aria-label="확대" onClick={() => useEditor.getState().setPxPerSec(pps * 1.25)}>
          <ZoomIn size={16} />
        </button>
        <button className="seg-btn" type="button" onClick={() => zoomFit()}>
          맞추기
        </button>
        <button className="seg-btn" type="button" onClick={() => edit(() => useEditor.getState().addTrack("video"))}>
          <Plus size={14} /> 영상
        </button>
        <button className="seg-btn" type="button" onClick={() => edit(() => useEditor.getState().addTrack("audio"))}>
          <Plus size={14} /> 소리
        </button>
      </div>
      <div className="sheet">
        <div className="headers">
          <div className="ruler-gap" />
          {tracks.map((track) => (
            <div className="thead" data-kind={track.kind} key={track.id}>
              <b>{track.name}</b>
              <div className="thead-actions">
                <button type="button" data-on={String(track.muted)} aria-label="음소거" onClick={() => useEditor.getState().toggleTrack(track.id, "muted")}>
                  {track.muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
                <button type="button" data-on={String(track.hidden)} aria-label="숨기기" onClick={() => useEditor.getState().toggleTrack(track.id, "hidden")}>
                  {track.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button type="button" data-on={String(track.locked)} aria-label="잠금" onClick={() => useEditor.getState().toggleTrack(track.id, "locked")}>
                  {track.locked ? <Lock size={13} /> : <LockOpen size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div
          className="lanes-scroll"
          ref={scrollerRef}
          onScroll={(event) => {
            const headers = event.currentTarget.previousElementSibling;
            if (headers instanceof HTMLElement) headers.scrollTop = event.currentTarget.scrollTop;
          }}
          onWheel={(event) => {
            if (!event.ctrlKey && !event.metaKey) return;
            event.preventDefault();
            useEditor.getState().setPxPerSec(pps * (event.deltaY > 0 ? 0.9 : 1.1));
          }}
        >
          <div
            className="lane-inner"
            ref={innerRef}
            style={{ width }}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <div
              className="ruler"
              onPointerDown={(event) => {
                const scrub = (clientX: number) => seek(timeAt(clientX));
                scrub(event.clientX);
                const move = (ev: PointerEvent) => scrub(ev.clientX);
                const up = () => {
                  window.removeEventListener("pointermove", move);
                  window.removeEventListener("pointerup", up);
                };
                window.addEventListener("pointermove", move);
                window.addEventListener("pointerup", up);
              }}
            >
              {ticks.marks.map((mark) => (
                <span className="tick" key={mark} style={{ left: Math.round(mark * pps) }}>
                  {ticks.step >= 1 ? formatTimecode(mark, fps).slice(3, 8) : mark.toFixed(1)}
                </span>
              ))}
            </div>
            {inMark != null && outMark != null && outMark > inMark ? (
              <div className="io-range" style={{ left: Math.round(inMark * pps), width: Math.max(0, Math.round((outMark - inMark) * pps)) }} />
            ) : null}
            {tracks.map((track) => (
              <div
                className="lane"
                data-kind={track.kind}
                key={track.id}
                onPointerDown={(event) => onLaneDown(event, track)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => onDrop(event, track)}
              >
                {clips
                  .filter((clip) => clip.trackId === track.id)
                  .map((clip) => {
                    const meta = media.find((item) => item.id === ("mediaId" in clip ? clip.mediaId : ""));
                    const peaks = meta?.peaks;
                    return (
                      <div
                        key={clip.id}
                        className="clip"
                        data-type={clip.type === "text" ? "text" : clip.type === "audio" ? "audio" : "video"}
                        data-on={String(selected.includes(clip.id))}
                        style={{ left: Math.round(clip.start * pps), width: Math.max(8, Math.round(clip.duration * pps)) }}
                        onPointerDown={(event) => onClipDown(event, clip, "move")}
                      >
                        <span className="trim l" onPointerDown={(event) => onClipDown(event, clip, "left")} />
                        <span className="trim r" onPointerDown={(event) => onClipDown(event, clip, "right")} />
                        {clip.type === "audio" && peaks ? (
                          <span className="wave" aria-hidden="true">
                            {peaks.map((peak, index) => (
                              <i key={index} style={{ height: `${Math.round(Math.min(100, Math.max(8, peak * 100)))}%` }} />
                            ))}
                          </span>
                        ) : null}
                        <span className="clip-label">
                          {clip.type === "text" ? clip.text : clip.name}
                          {isVisual(clip) && clip.transition !== "none" ? ` · ${clip.transition}` : ""}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ))}
            <Playhead />
          </div>
        </div>
      </div>
    </section>
  );
}
