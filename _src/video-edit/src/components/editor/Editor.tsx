import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { copySelection, edit, importFiles, missingImports, pasteClipboard, splitPlayhead } from "@/lib/editor/actions";
import { pause, play, seek, setRate, step, togglePlay, transport, zoomFit } from "@/lib/editor/engine";
import { loadSavedProject, saveProject, useEditor } from "@/lib/editor/store";
import { Bin } from "@/components/editor/Bin";
import { Inspector } from "@/components/editor/Inspector";
import { Monitor } from "@/components/editor/Monitor";
import { Timeline } from "@/components/editor/Timeline";
import { TopBar } from "@/components/editor/TopBar";

const HELP: [string, string][] = [
  ["스페이스", "재생 / 일시정지"],
  ["S", "재생헤드에서 자르기"],
  ["V / C / T", "선택 / 자르기 도구 / 자막"],
  ["← →", "한 프레임"],
  ["Shift + 방향키", "1초"],
  ["J K L", "되감기 / 정지 / 빨리"],
  ["I / O", "인점 / 아웃점"],
  ["X", "인아웃 지우기"],
  ["Delete", "삭제"],
  ["Shift + Delete", "잔물결 삭제"],
  ["Ctrl + Z / Y", "실행 취소 / 다시"],
  ["Ctrl + C / V / D", "복사 / 붙여넣기 / 복제"],
  ["+ / -", "타임라인 확대"],
];

function isField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function Editor() {
  const panel = useEditor((s) => s.mobilePanel);
  const setPanel = useEditor((s) => s.setPanel);
  const toast = useEditor((s) => s.toast);
  const [help, setHelp] = useState(false);
  const [hot, setHot] = useState(false);

  useEffect(() => {
    const loaded = loadSavedProject();
    if (loaded && missingImports() > 0) {
      useEditor.getState().showToast("이전에 넣은 파일은 새로고침되면 빠져요. 다시 가져와 주세요.");
    }
    const timer = window.setTimeout(() => saveProject(), 0);
    window.clearTimeout(timer);
    let saveTimer = 0;
    const unsub = useEditor.subscribe(() => {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => saveProject(), 500);
    });
    return () => {
      unsub();
      window.clearTimeout(saveTimer);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isField(event.target)) return;
      const meta = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (meta && key === "z") {
        event.preventDefault();
        if (event.shiftKey) useEditor.getState().redo();
        else useEditor.getState().undo();
        return;
      }
      if (meta && key === "y") {
        event.preventDefault();
        useEditor.getState().redo();
        return;
      }
      if (meta && key === "c") {
        event.preventDefault();
        copySelection();
        return;
      }
      if (meta && key === "v") {
        event.preventDefault();
        pasteClipboard();
        return;
      }
      if (meta && key === "d") {
        event.preventDefault();
        edit(() => useEditor.getState().duplicateSelected());
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
        return;
      }
      if (key === "s" && !meta) {
        event.preventDefault();
        splitPlayhead();
        return;
      }
      if (key === "v") useEditor.getState().setTool("select");
      if (key === "c" && !meta) useEditor.getState().setTool("razor");
      if (key === "t" && !meta) useEditor.getState().setTool("text");
      if (key === "j") {
        setRate(transport.playing && transport.rate < 0 ? Math.max(-4, transport.rate * 2) : -1);
        play();
      }
      if (key === "k") {
        setRate(1);
        pause();
      }
      if (key === "l") {
        setRate(transport.playing && transport.rate > 0 ? Math.min(4, transport.rate * 2) : 1);
        play();
      }
      if (key === "i") useEditor.getState().setIn(transport.time);
      if (key === "o") useEditor.getState().setOut(transport.time);
      if (key === "x" && !meta) useEditor.getState().clearMarks();
      if (key === "arrowleft") {
        event.preventDefault();
        step(event.shiftKey ? -useEditor.getState().fps : -1);
      }
      if (key === "arrowright") {
        event.preventDefault();
        step(event.shiftKey ? useEditor.getState().fps : 1);
      }
      if (key === "home") seek(0);
      if (key === "end") seek(99999);
      if (key === "delete" || key === "backspace") {
        event.preventDefault();
        edit(() => useEditor.getState().removeSelected(event.shiftKey));
      }
      if (key === "=" || key === "+") useEditor.getState().setPxPerSec(useEditor.getState().pxPerSec * 1.2);
      if (key === "-" || key === "_") useEditor.getState().setPxPerSec(useEditor.getState().pxPerSec / 1.2);
      if (key === "\\") zoomFit();
      if (key === "?" || (event.shiftKey && key === "/")) setHelp(true);
    };
    window.addEventListener("keydown", onKey);
    const over = (event: DragEvent) => {
      if (![...(event.dataTransfer?.types ?? [])].includes("Files")) return;
      event.preventDefault();
      setHot(true);
    };
    const drop = (event: DragEvent) => {
      setHot(false);
      if (!event.dataTransfer?.files?.length) return;
      if ([...(event.dataTransfer.types ?? [])].includes("application/x-dgcut")) return;
      event.preventDefault();
      void importFiles(event.dataTransfer.files);
    };
    const leave = () => setHot(false);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    window.addEventListener("dragleave", leave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
      window.removeEventListener("dragleave", leave);
    };
  }, []);

  return (
    <div className="nle" data-tab={panel}>
      <TopBar onHelp={() => setHelp(true)} />
      <Monitor />
      <div className="tabs" role="tablist">
        {(
          [
            ["timeline", "타임라인"],
            ["bin", "소스"],
            ["inspector", "속성"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" data-on={String(panel === id)} onClick={() => setPanel(id)}>
            {label}
          </button>
        ))}
      </div>
      <Bin />
      <Inspector />
      <Timeline />
      {toast ? <div className="toast" role="status">{toast}</div> : null}
      {hot ? <div className="dropveil">영상, 사진, 소리를 놓으면 타임라인에 이어 붙여요</div> : null}
      <Dialog.Root open={help} onOpenChange={setHelp}>
        <Dialog.Portal>
          <Dialog.Overlay className="dlg-overlay" />
          <Dialog.Content className="dlg">
            <Dialog.Title asChild>
              <h2>단축키</h2>
            </Dialog.Title>
            <p>프리미어에서 쓰던 컷, 자막, 전환을 브라우저 안에서 처리해요.</p>
            <dl className="keys">
              {HELP.map(([key, label]) => (
                <span key={key} style={{ display: "contents" }}>
                  <dt>{key}</dt>
                  <dd>{label}</dd>
                </span>
              ))}
            </dl>
            <div className="row-actions">
              <Dialog.Close className="btn" type="button">
                닫기
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
