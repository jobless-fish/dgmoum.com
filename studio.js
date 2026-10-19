(() => {
  function setup() {
    const id =
      document.body.dataset.tool ||
      location.pathname.split("/").filter(Boolean)[1];
    try {
      let r = JSON.parse(localStorage.getItem("moum-recent") || "[]");
      if (!Array.isArray(r)) r = [];
      localStorage.setItem(
        "moum-recent",
        JSON.stringify([id, ...r.filter((x) => x !== id)].slice(0, 6)),
      );
    } catch {}
    const special = id === "photo-edit" || id === "video-edit";
    // 다른 도구와 똑같은 사이트 상단 바를 그려요 (Pro 도구도 같은 함수를 써요)
    function fillTop(hdr) {
      hdr.className = "studio-top";
      hdr.innerHTML =
        '<a class="studio-brand" href="/" aria-label="도구모음 홈">dg.moum</a><span class="studio-divider"></span><nav aria-label="주 메뉴"><a href="/">홈화면</a><a href="/library/">전체 도구</a><a href="/about/">About ↗</a></nav><div class="studio-actions"><button class="studio-action" id="studio-search" aria-label="전체 도구 검색"><i data-lucide="search"></i><span>도구 검색</span></button>' +
        (window.DG
          ? '<button class="studio-action" id="studio-language" aria-label="언어 전환">' +
            (DG.lang === "en" ? "한국어" : "EN") +
            "</button>"
          : "") +
        '<button class="studio-action" id="studio-theme" aria-label="화면 테마 전환"><i data-lucide="sun-moon"></i></button></div>';
      hdr.querySelector("#studio-search").onclick = () =>
        window.moumOpenSearch?.();
      const lang = hdr.querySelector("#studio-language");
      if (lang)
        lang.onclick = () => window.DG?.setLang(DG.lang === "en" ? "ko" : "en");
      hdr.querySelector("#studio-theme").onclick = () => {
        const t =
          document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = t;
        try {
          localStorage.setItem("dg-theme", t);
        } catch {}
      };
      window.moumIcons?.();
    }
    if (special) {
      document.body.classList.add(
        id === "video-edit" ? "studio-video" : "studio-photo",
        "has-site-top",
      );
      let top = document.querySelector("body > header.studio-top");
      if (!top) {
        top = document.createElement("header");
        document.body.prepend(top);
      }
      const drawTop = () => fillTop(top);
      if (window.DG) DG.onLang(drawTop);
      else drawTop();
      return;
    }
    document.body.classList.add("studio-standard");
    function renderHeader() {
      const hdr = document.querySelector("#hdr");
      if (!hdr) return;
      fillTop(hdr);
      const foot = document.querySelector("#foot");
      if (foot) {
        foot.className = "studio-bottom";
        foot.innerHTML =
          '<span>도구모음 · 브라우저 속 나의 작은 작업실</span><a href="/about/">도구모음에 대하여 ↗</a>';
      }
      document.querySelectorAll(".vcrumb a").forEach((a) => {
        if (a.hash.startsWith("#cat-"))
          a.href = "/library/?cat=" + a.hash.slice(5);
      });
      window.moumIcons?.();
    }
    if (window.DG) DG.onLang(renderHeader);
    else renderHeader();
    const categories = [
      ["img", "이미지", "image"],
      ["doc", "PDF", "files"],
      ["vid", "영상", "film"],
      ["aud", "오디오", "audio-lines"],
      ["des", "디자인", "palette"],
      ["txt", "텍스트", "type"],
      ["form", "서류", "file-text"],
      ["fun", "플레이", "gamepad-2"],
    ];
    const cat = window.TT_TOOLS?.find((t) => t.id === id)?.cat;
    if (!document.querySelector(".studio-rail")) {
      const rail = document.createElement("nav");
      rail.className = "studio-rail";
      rail.setAttribute("aria-label", "다른 작업 분류");
      rail.innerHTML = categories
        .map(
          ([c, n, i]) =>
            `<a href="/library/?cat=${c}" ${c === cat ? 'aria-current="true"' : ""} aria-label="${n} 도구"><i data-lucide="${i}"></i><span>${n}</span></a>`,
        )
        .join("");
      document.body.append(rail);
    }
    document.querySelectorAll(".vcrumb a").forEach((a) => {
      if (a.hash.startsWith("#cat-"))
        a.href = "/library/?cat=" + a.hash.slice(5);
    });
    const head = document.querySelector(".tool-head");
    if (head && !document.querySelector(".studio-context")) {
      const row = document.createElement("div");
      row.className = "studio-context";
      const file = !!document.querySelector("input[type=file]");
      row.innerHTML = `<span><b>${file ? "파일 선택" : "내용 입력"}</b> <span>→</span> 설정 <span>→</span> 결과 저장</span><span><i data-lucide="shield-check"></i> 이 브라우저에서 처리</span>`;
      head.after(row);
    }
    // Keep the original uploader and file rows intact so processing, ordering,
    // downloads and deletion continue to use each tool's existing handlers.
    const drop = document.querySelector("#drop");
    const list = document.querySelector("#listWrap");
    if (drop && list && drop.parentElement === list.parentElement) {
      const upload = document.createElement("section");
      upload.className = "studio-upload";
      upload.setAttribute("aria-label", "파일 선택 및 선택한 파일");
      drop.before(upload);
      upload.append(list, drop);
      const addLabel = document.createElement("strong");
      addLabel.className = "studio-add-label";
      addLabel.textContent = "+ 파일 추가 · 여기에 끌어다 놓으세요";
      drop.append(addLabel);
      const sync = () => {
        upload.classList.toggle("has-files", !list.hidden);
        list.querySelectorAll(".file .name").forEach(el => {
          if (el.title !== el.textContent) el.title = el.textContent;
        });
      };
      new MutationObserver(sync).observe(list, {
        attributes: true, attributeFilter: ["hidden"], childList: true, subtree: true,
      });
      sync();
      // Files can be dropped anywhere inside the shared box, including on cards.
      // Non-file drags are left to tools that support reordering their own rows.
      ["dragenter", "dragover"].forEach(type => upload.addEventListener(type, e => {
        if (!Array.from(e.dataTransfer?.types || []).includes("Files")) return;
        e.preventDefault(); upload.classList.add("over");
      }));
      upload.addEventListener("dragleave", e => {
        if (!upload.contains(e.relatedTarget)) upload.classList.remove("over");
      });
      upload.addEventListener("drop", e => {
        upload.classList.remove("over");
        if (drop.contains(e.target) || !e.dataTransfer?.files.length) return;
        e.preventDefault();
        drop.dispatchEvent(new DragEvent("drop", { dataTransfer: e.dataTransfer }));
      });
      if (window.DG) DG.onLang(() => {
        addLabel.textContent = DG.lang === "en" ? "+ Add files · drop them here" : "+ 파일 추가 · 여기에 끌어다 놓으세요";
      });
    }
    const help = document.querySelector("#toolMore");
    if (help && !help.closest(".studio-help")) {
      const details = document.createElement("details");
      details.className = "studio-help";
      const summary = document.createElement("summary");
      summary.textContent = "사용 방법 · 자주 묻는 질문 · 관련 도구";
      help.before(details);
      details.append(summary, help);
    }
    window.moumIcons?.();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
