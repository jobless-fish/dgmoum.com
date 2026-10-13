/* 뚝딱툴 공용 스크립트 — 툴 목록, 아이콘, 다운로드·드롭존 같은 공용 함수 */

// 새 툴을 추가할 때는 여기 한 줄만 넣으면 카탈로그에 자동으로 나옵니다.
// status: "live" = 사용 가능, "soon" = 준비 중
window.TT_TOOLS = [
  { id: "image-convert", cat: "img", name: "이미지 포맷 변환", desc: "PNG · JPG · WEBP 사이를 여러 장 한 번에 바꿔요. 화질 조절과 투명 배경 처리까지.", tags: ["png", "jpg", "jpeg", "webp", "변환", "확장자"], status: "live" },
  { id: "image-resize", cat: "img", name: "이미지 크기 조절", desc: "픽셀이나 퍼센트로 줄이고 늘려요. 비율 유지, 여러 장 일괄 처리.", tags: ["리사이즈", "resize", "크기", "용량", "축소"], status: "live" },
  { id: "video-trim", cat: "vid", name: "영상 자르기", desc: "원하는 구간만 골라 잘라 저장해요. 소리도 같이 들어가요.", tags: ["동영상", "video", "trim", "컷", "편집", "mp4"], status: "live" },
  { id: "audio-edit", cat: "aud", name: "음원 자르기 · 피치 조절", desc: "파형을 보며 구간을 자르고, 키(반음)와 속도를 따로 바꿔 WAV·MP3로 저장해요.", tags: ["오디오", "mp3", "wav", "키", "피치", "속도", "mr", "벨소리"], status: "live" },
  { id: "pdf-to-png", cat: "doc", name: "PDF → 이미지", desc: "PDF 페이지를 PNG 이미지로 뽑아요.", tags: ["pdf", "png"], status: "soon" },
  { id: "image-merge", cat: "img", name: "이미지 합치기", desc: "여러 이미지를 가로나 세로로 이어 붙여요.", tags: ["합치기", "이어붙이기", "병합"], status: "soon" }
];

window.TT_CATS = {
  img: { label: "이미지", color: "var(--img)" },
  vid: { label: "영상", color: "var(--vid)" },
  aud: { label: "오디오", color: "var(--aud)" },
  doc: { label: "문서", color: "var(--muted)" }
};

window.TT_ICONS = {
  "image-convert": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="11" height="11" rx="2"/><path d="M17 8h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-2"/><path d="m11 17 3-3-3-3" /></svg>',
  "image-resize": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/></svg>',
  "video-trim": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9"/><path d="M14.5 14.5 20 20"/><path d="M8.1 8.1 12 12"/></svg>',
  "audio-edit": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h2"/><path d="M7 8v8"/><path d="M11 4v16"/><path d="M15 7v10"/><path d="M19 10v4"/></svg>',
  "pdf-to-png": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 15h8"/></svg>',
  "image-merge": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="8" height="16" rx="1.5"/><rect x="13" y="4" width="8" height="16" rx="1.5"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>'
};

const TT = {
  $(sel, root = document) { return root.querySelector(sel); },

  bytes(n) {
    if (!isFinite(n)) return "-";
    const u = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return (i === 0 ? n : n.toFixed(n < 10 ? 2 : 1)) + " " + u[i];
  },

  // 초 → 0:00.0
  time(s, decimals = 1) {
    if (!isFinite(s)) s = 0;
    const m = Math.floor(s / 60);
    const sec = s - m * 60;
    const str = sec.toFixed(decimals).padStart(decimals ? 3 + decimals : 2, "0");
    return m + ":" + str;
  },

  baseName(name) { return name.replace(/\.[^.]+$/, ""); },

  download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  },

  // 여러 파일을 zip으로 묶어 저장 (JSZip이 로드된 페이지에서만)
  async downloadZip(entries, zipName) {
    if (!window.JSZip) { entries.forEach(e => TT.download(e.blob, e.name)); return; }
    const zip = new JSZip();
    const used = new Set();
    for (const e of entries) {
      let n = e.name, k = 1;
      while (used.has(n)) { n = e.name.replace(/(\.[^.]+)?$/, `-${k++}$1`); }
      used.add(n);
      zip.file(n, e.blob);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    TT.download(blob, zipName);
  },

  // 드롭존: 클릭·드래그·붙여넣기 모두 지원
  dropzone(el, onFiles, { accept, multiple = true, paste = true } = {}) {
    const input = el.querySelector("input[type=file]");
    if (accept) input.accept = accept;
    input.multiple = multiple;
    el.addEventListener("click", () => input.click());
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
    input.addEventListener("click", e => e.stopPropagation());
    input.addEventListener("change", () => { if (input.files.length) onFiles([...input.files]); input.value = ""; });
    ["dragenter", "dragover"].forEach(t => el.addEventListener(t, e => { e.preventDefault(); el.classList.add("over"); }));
    ["dragleave", "drop"].forEach(t => el.addEventListener(t, e => { e.preventDefault(); el.classList.remove("over"); }));
    el.addEventListener("drop", e => { const f = [...(e.dataTransfer?.files || [])]; if (f.length) onFiles(multiple ? f : [f[0]]); });
    if (paste) {
      document.addEventListener("paste", e => {
        const f = [...(e.clipboardData?.files || [])];
        if (f.length) onFiles(multiple ? f : [f[0]]);
      });
    }
  },

  icon(name) { return window.TT_ICONS[name] || ""; },

  // 페이지의 [data-icon] 자리에 아이콘 채우기
  fillIcons(root = document) {
    root.querySelectorAll("[data-icon]").forEach(el => { el.innerHTML = TT.icon(el.dataset.icon) + el.innerHTML; });
  }
};
window.TT = TT;
document.addEventListener("DOMContentLoaded", () => TT.fillIcons());
