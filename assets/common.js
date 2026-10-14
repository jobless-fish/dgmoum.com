/* 뚝딱툴 공용 스크립트 — 툴 목록, 아이콘, 다운로드·드롭존 같은 공용 함수 */

// 새 툴을 추가할 때는 여기 한 줄만 넣으면 카탈로그에 자동으로 나옵니다.
// status: "live" = 사용 가능, "soon" = 준비 중
window.TT_TOOLS = [
  { id: "image-convert", cat: "img", name: "이미지 포맷 변환", desc: "PNG · JPG · WEBP 사이를 여러 장 한 번에 바꿔요. 화질 조절과 투명 배경 처리까지.", tags: ["png", "jpg", "jpeg", "webp", "변환", "확장자"], status: "live" },
  { id: "image-resize", cat: "img", name: "이미지 크기 조절", desc: "픽셀이나 퍼센트로 줄이고 늘려요. 비율 유지, 여러 장 일괄 처리.", tags: ["리사이즈", "resize", "크기", "축소"], status: "live" },
  { id: "image-compress", cat: "img", name: "이미지 압축", desc: "크기는 그대로 두고 용량만 줄여요. 원하는 용량(KB)을 넣으면 거기에 맞춰줘요.", tags: ["용량", "압축", "줄이기", "kb", "compress"], status: "live" },
  { id: "image-mosaic", cat: "img", name: "모자이크 · 가리기", desc: "캡처나 사진에서 이름, 번호, 얼굴을 드래그해서 모자이크나 검은 박스로 가려요.", tags: ["모자이크", "블러", "가리기", "개인정보", "캡처"], status: "live" },
  { id: "image-gif", cat: "img", name: "움짤 만들기", desc: "사진 여러 장을 순서대로 이어서 GIF 움짤로 만들어요. 넘김 속도와 크기 조절.", tags: ["gif", "움짤", "짤", "애니메이션", "이미지", "만들기"], status: "live" },
  { id: "insta-grid", cat: "img", name: "인스타 그리드 자르기", desc: "사진 한 장을 3칸 × 여러 줄로 나눠 인스타 프로필에 이어지는 그림으로 올려요. 올릴 순서까지 번호로.", tags: ["인스타", "인스타그램", "instagram", "그리드", "피드", "분할", "퍼즐", "자르기"], status: "live" },
  { id: "image-merge", cat: "img", name: "이미지 합치기", desc: "여러 이미지를 가로·세로·격자로 이어 붙여요. 크기 맞춤과 간격 조절.", tags: ["합치기", "이어붙이기", "병합", "붙이기", "콜라주"], status: "live" },
  { id: "image-split", cat: "img", name: "긴 이미지 나누기", desc: "세로로 긴 상세페이지나 캡처를 원하는 높이·개수로 잘라요.", tags: ["상세페이지", "분할", "나누기", "자르기", "긴 이미지", "캡처"], status: "live" },
  { id: "image-crop", cat: "img", name: "자르기 · 회전 · 뒤집기", desc: "1:1, 4:5, 16:9 같은 비율로 자르고, 90도 돌리고, 좌우·상하로 뒤집어요.", tags: ["자르기", "크롭", "crop", "회전", "돌리기", "뒤집기", "반전", "비율"], status: "live" },
  { id: "image-watermark", cat: "img", name: "워터마크 넣기", desc: "글자나 로고를 여러 장에 한 번에. 위치, 투명도, 반복 무늬 선택.", tags: ["워터마크", "로고", "저작권", "도용", "표시"], status: "live" },
  { id: "image-exif", cat: "img", name: "사진 정보 지우기", desc: "사진에 숨은 촬영 위치·기기·날짜 정보를 보여주고 깨끗하게 지워요. 화질 손실 없이.", tags: ["exif", "위치", "gps", "메타데이터", "개인정보", "중고거래"], status: "live" },
  { id: "color-palette", cat: "des", name: "색 뽑기", desc: "이미지에서 대표 색을 뽑아 HEX·RGB 코드로. 원하는 곳을 눌러 색을 집을 수도 있어요.", tags: ["색", "컬러", "팔레트", "hex", "스포이드", "color", "palette"], status: "live" },
  { id: "favicon", cat: "des", name: "파비콘 만들기", desc: "이미지 하나로 favicon.ico와 홈 화면 아이콘 여러 크기를 한 번에. HTML 코드까지.", tags: ["파비콘", "favicon", "ico", "아이콘", "웹사이트", "앱 아이콘"], status: "live" },
  { id: "video-trim", cat: "vid", name: "영상 자르기", desc: "원하는 구간만 골라 잘라 저장해요. 소리도 같이 들어가요.", tags: ["동영상", "video", "trim", "컷", "편집", "mp4"], status: "live" },
  { id: "video-gif", cat: "vid", name: "영상 → GIF", desc: "영상에서 짧은 구간을 골라 움짤(GIF)로 만들어요. 크기와 프레임 수 조절.", tags: ["gif", "움짤", "짤", "동영상", "변환"], status: "live" },
  { id: "shorts-maker", cat: "vid", name: "쇼츠 · 릴스 · 틱톡 세로 변환", desc: "가로 영상을 9:16 세로로 바꿔요. 남는 곳은 흐린 배경으로 채우거나, 꽉 채운 뒤 보여줄 부분을 골라요.", tags: ["쇼츠", "릴스", "틱톡", "세로", "9:16", "shorts", "reels", "tiktok", "세로 영상", "변환"], status: "live" },
  { id: "audio-edit", cat: "aud", name: "음원 자르기 · 피치 조절", desc: "파형을 보며 구간을 자르고, 키(반음)와 속도를 따로 바꿔 WAV·MP3로 저장해요.", tags: ["오디오", "mp3", "wav", "키", "피치", "속도", "mr", "벨소리"], status: "live" },
  { id: "pdf-merge", cat: "doc", name: "PDF 합치기", desc: "여러 PDF를 원하는 순서대로 하나로 묶어요.", tags: ["pdf", "합치기", "병합", "merge"], status: "live" },
  { id: "pdf-split", cat: "doc", name: "PDF 나누기 · 정리", desc: "페이지를 보면서 빼고, 돌리고, 순서를 바꾸고, 필요한 페이지만 뽑거나 한 장씩 나눠요.", tags: ["pdf", "나누기", "분할", "추출", "삭제", "회전", "split"], status: "live" },
  { id: "image-to-pdf", cat: "doc", name: "이미지 → PDF", desc: "사진·스캔 이미지 여러 장을 PDF 한 파일로 만들어요. A4 맞춤 지원.", tags: ["pdf", "jpg", "png", "사진", "스캔", "서류"], status: "live" },
  { id: "pdf-to-image", cat: "doc", name: "PDF → 이미지", desc: "PDF 페이지를 PNG나 JPG 이미지로 뽑아요. 해상도 선택.", tags: ["pdf", "png", "jpg", "이미지", "변환"], status: "live" },
  { id: "qr-code", cat: "txt", name: "QR코드 만들기", desc: "링크, 와이파이, 연락처, 문자를 QR코드로. 색과 점 모양, 가운데 로고까지 넣어 PNG·SVG로 저장해요.", tags: ["qr", "큐알", "qr코드", "큐알코드", "와이파이", "명함", "링크"], status: "live" },
  { id: "char-count", cat: "txt", name: "글자 수 세기", desc: "공백 포함·제외, 바이트, 줄 수를 한 번에. 목표 글자 수를 넣으면 남은 글자를 알려줘요.", tags: ["글자수", "글자 수", "자소서", "바이트", "byte", "공백", "문자", "카운터"], status: "live" }
];

window.TT_CATS = {
  img: { label: "이미지", color: "var(--img)" },
  doc: { label: "PDF", color: "var(--doc)" },
  vid: { label: "영상", color: "var(--vid)" },
  aud: { label: "오디오", color: "var(--aud)" },
  des: { label: "디자인", color: "var(--des)" },
  txt: { label: "텍스트 · 생활", color: "var(--txt)" }
};

const S = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
window.TT_ICONS = {
  "image-convert": `<svg ${S}><rect x="3" y="3" width="11" height="11" rx="2"/><path d="M17 8h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-2"/><path d="m11 17 3-3-3-3"/></svg>`,
  "image-resize": `<svg ${S}><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/></svg>`,
  "image-compress": `<svg ${S}><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="m14 10 7-7"/><path d="m3 21 7-7"/></svg>`,
  "image-mosaic": `<svg ${S}><rect x="3" y="3" width="6" height="6"/><rect x="9" y="9" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><rect x="15" y="15" width="6" height="6"/></svg>`,
  "image-merge": `<svg ${S}><rect x="3" y="4" width="8" height="16" rx="1.5"/><rect x="13" y="4" width="8" height="16" rx="1.5"/></svg>`,
  "video-trim": `<svg ${S}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9"/><path d="M14.5 14.5 20 20"/><path d="M8.1 8.1 12 12"/></svg>`,
  "video-gif": `<svg ${S}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M10 10H8v4h2v-1.5"/><path d="M13 10v4"/><path d="M18 10h-2.5v4"/><path d="M15.5 12H17"/></svg>`,
  "audio-edit": `<svg ${S}><path d="M3 12h2"/><path d="M7 8v8"/><path d="M11 4v16"/><path d="M15 7v10"/><path d="M19 10v4"/></svg>`,
  "pdf-merge": `<svg ${S}><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path d="M12 8v8"/><path d="m9 13 3 3 3-3"/></svg>`,
  "pdf-split": `<svg ${S}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="9" rx="1"/><rect x="3" y="15" width="7" height="6" rx="1"/><rect x="14" y="15" width="7" height="6" rx="1"/></svg>`,
  "image-to-pdf": `<svg ${S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><circle cx="10" cy="13" r="2"/><path d="m20 17-3-3-7 7"/></svg>`,
  "pdf-to-image": `<svg ${S}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.5-3.5L7 21"/></svg>`,
  "image-gif": `<svg ${S}><rect x="3" y="7" width="13" height="13" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/><path d="m8 11 4 2.5L8 16z"/></svg>`,
  "char-count": `<svg ${S}><path d="M4 7V5h16v2"/><path d="M12 5v14"/><path d="M9 19h6"/></svg>`,
  "insta-grid": `<svg ${S}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 12h18"/></svg>`,
  "qr-code": `<svg ${S}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3z"/><path d="M20 14v.01"/><path d="M14 20h.01"/><path d="M17 20h4v-3"/></svg>`,
  "image-split": `<svg ${S}><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M2 9h20" stroke-dasharray="2 2"/><path d="M2 15h20" stroke-dasharray="2 2"/></svg>`,
  "image-crop": `<svg ${S}><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>`,
  "image-watermark": `<svg ${S}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 15l2-6 3 5 3-5 2 6"/></svg>`,
  "image-exif": `<svg ${S}><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><path d="m4 4 16 16"/></svg>`,
  "color-palette": `<svg ${S}><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A5.7 5.7 0 0 0 22 9.7C22 5.4 17.5 2 12 2z"/></svg>`,
  "favicon": `<svg ${S}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20"/><rect x="5" y="11" width="5" height="5" rx="1"/></svg>`,
  "shorts-maker": `<svg ${S}><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M9 16h6"/><path d="M10 19h4"/></svg>`,
  upload: `<svg ${S}><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/></svg>`,
  download: `<svg ${S}><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/></svg>`,
  x: `<svg ${S}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  up: `<svg ${S}><path d="m18 15-6-6-6 6"/></svg>`,
  down: `<svg ${S}><path d="m6 9 6 6 6-6"/></svg>`,
  rotate: `<svg ${S}><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>`,
  undo: `<svg ${S}><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>`,
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
  },

  // 상태 문구
  sayTo(el) { return (t, cls = "") => { el.textContent = t; el.className = "status " + cls; }; },

  // 목록 항목 위·아래로 옮기기
  move(arr, i, d) {
    const j = i + d;
    if (j < 0 || j >= arr.length) return false;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return true;
  },

  // 다른 출처의 워커 스크립트를 blob 주소로 바꿔 쓰기 (GitHub Pages에서 CDN 워커를 띄우기 위해)
  async workerBlobURL(url) {
    try {
      const txt = await (await fetch(url)).text();
      return URL.createObjectURL(new Blob([txt], { type: "text/javascript" }));
    } catch { return url; }
  },

  // pdf.js 준비 (페이지에 pdf.min.js가 먼저 로드돼 있어야 함)
  _pdfReady: null,
  pdfjs() {
    if (!window.pdfjsLib) return Promise.reject(new Error("pdfjs"));
    return TT._pdfReady ||= (async () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = await TT.workerBlobURL("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js");
      return pdfjsLib;
    })();
  },

  // 이미지 파일을 캔버스로 (EXIF 회전 반영)
  async toCanvas(file, maxSide = Infinity) {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    return c;
  },

  canvasBlob(c, type = "image/png", q) { return new Promise(r => c.toBlob(r, type, q)); }
};
window.TT = TT;
document.addEventListener("DOMContentLoaded", () => TT.fillIcons());
