import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, Keyboard, Redo2, Undo2 } from "lucide-react";
import { exportExtension, exportMovie } from "@/lib/editor/engine";
import { useEditor } from "@/lib/editor/store";
import { ASPECTS, type AspectId } from "@/lib/editor/types";

export function TopBar({ onHelp }: { onHelp: () => void }) {
  const name = useEditor((s) => s.projectName);
  const aspect = useEditor((s) => s.aspect);
  const fps = useEditor((s) => s.fps);
  const canUndo = useEditor((s) => s.canUndo);
  const canRedo = useEditor((s) => s.canRedo);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const setAspect = useEditor((s) => s.setAspect);
  const setFps = useEditor((s) => s.setFps);
  const rename = useEditor((s) => s.renameProject);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [ext, setExt] = useState("webm");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const signal = useState({ cancelled: false })[0];

  async function startExport() {
    setOpen(true);
    setRunning(true);
    setError(null);
    setProgress(0);
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
    signal.cancelled = false;
    try {
      const result = await exportMovie(setProgress, signal);
      const next = URL.createObjectURL(result.blob);
      setUrl(next);
      setExt(exportExtension(result.mime));
    } catch (err) {
      if (err instanceof Error && err.message !== "cancelled") setError(err.message);
    } finally {
      setRunning(false);
    }
  }


  return (
    <header className="topbar">
      <a className="brand" href="../../" title="도구모음 홈으로">
        <img className="brand-logo" src="../../assets/logo.png" alt="도구모음" width="168" height="58" />
      </a>
      <h1 className="app-title">컷편집Pro</h1>
      <input
        className="project-name"
        aria-label="프로젝트 이름"
        value={name}
        onChange={(event) => rename(event.target.value)}
      />
      <div className="spacer" />
      <div className="cluster">
        <select className="select" aria-label="화면 비율" value={aspect} onChange={(event) => setAspect(event.target.value as AspectId)}>
          {(Object.keys(ASPECTS) as AspectId[]).map((id) => (
            <option key={id} value={id}>
              {ASPECTS[id].label}
            </option>
          ))}
        </select>
        <select className="select hide-sm" aria-label="프레임 레이트" value={fps} onChange={(event) => setFps(Number(event.target.value))}>
          {[24, 30, 60].map((value) => (
            <option key={value} value={value}>
              {value}fps
            </option>
          ))}
        </select>
        <button className="icon-btn" type="button" aria-label="실행 취소" disabled={!canUndo} onClick={() => undo()}>
          <Undo2 size={16} />
        </button>
        <button className="icon-btn" type="button" aria-label="다시 실행" disabled={!canRedo} onClick={() => redo()}>
          <Redo2 size={16} />
        </button>
        <button className="icon-btn hide-sm" type="button" aria-label="단축키" onClick={onHelp}>
          <Keyboard size={16} />
        </button>
        <button className="btn primary" type="button" onClick={() => void startExport()}>
          <Download size={16} />
          내보내기
        </button>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dlg-overlay" />
          <Dialog.Content className="dlg" aria-describedby={undefined}>
            <Dialog.Title asChild>
              <h2>영상 내보내기</h2>
            </Dialog.Title>
            <p>영상 길이만큼 걸려요. 인점과 아웃을 모두 찍어 두면 그 구간만 내보내요. 파일은 이 기기에만 저장돼요.</p>
            {running ? (
              <>
                <div className="progress" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
                <p>{Math.round(progress * 100)}%</p>
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    signal.cancelled = true;
                  }}
                >
                  취소
                </button>
              </>
            ) : null}
            {error ? <p>{error}</p> : null}
            {url ? (
              <>
                <video className="preview-video" src={url} controls playsInline />
                <a className="btn primary" href={url} download={`${name || "컷편집"}.${ext}`}>
                  {ext.toUpperCase()}로 저장
                </a>
                {ext !== "mp4" ? <p className="dlg-note">이 브라우저는 MP4로 녹화할 수 없어 WebM으로 만들었어요. 크롬·엣지·사파리에서는 MP4로 저장돼요.</p> : null}
              </>
            ) : null}
            <div className="row-actions">
              <Dialog.Close className="btn ghost" type="button">
                닫기
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
}
