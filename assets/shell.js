/* 도구모음 v2 공용 틀: 상단 메뉴 · 휴대폰 메뉴 · 검색 · 바닥글 · 언어(한/영) · 밝기(라이트/다크)
   쓰는 법: <header id="hdr"></header> ... <footer id="foot"></footer>
            <script src="(경로)/assets/shell.js" data-root="(사이트 맨 위까지 경로)"></script>
   페이지 내용은 DG.onLang(fn)에 등록하면 언어를 바꿀 때 다시 그려져요. */
(() => {
  // 사용 횟수 · 즐겨찾기 집계 서버 주소 (counter-worker를 배포한 뒤 넣으세요. 비어 있으면 집계하지 않아요)
  const COUNTER_URL = "";
  const ROOT = document.currentScript?.dataset.root ?? "./";
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const S = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const ICON = {
    search: `<svg ${S}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
    sun: `<svg ${S}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
    moon: `<svg ${S}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
    globe: `<svg ${S}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></svg>`,
    menu: `<svg ${S}><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
    close: `<svg ${S}><path d="M18 6 6 18M6 6l12 12"/></svg>`,
    arrow: `<svg ${S} style="width:14px;height:14px;display:inline"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
    lock: `<svg ${S}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
    check: `<svg ${S}><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>`,
    upload: `<svg ${S}><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/></svg>`
  };
  // 분류 아이콘
  const CAT_ICON = {
    img: `<svg ${S}><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>`,
    doc: `<svg ${S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h3a1.5 1.5 0 0 0 0-3H8v6"/></svg>`,
    vid: `<svg ${S}><rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 10 5-3v10l-5-3"/></svg>`,
    aud: `<svg ${S}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    des: `<svg ${S}><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7H17a5 5 0 0 0 5-5C22 6 17.5 2 12 2z"/></svg>`,
    txt: `<svg ${S}><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>`,
    fun: `<svg ${S}><rect x="2" y="6" width="20" height="12" rx="6"/><path d="M6 12h4"/><path d="M8 10v4"/><circle cx="15.5" cy="11" r=".6" fill="currentColor"/><circle cx="17.5" cy="13" r=".6" fill="currentColor"/></svg>`,
    form: `<svg ${S}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v2h6V3"/><path d="M9 11h6M9 15h4"/></svg>`
  };
  const ORDER = ["img", "doc", "vid", "aud", "form", "des", "txt", "fun"];

  /* ---------- 언어 ---------- */
  const qp = new URLSearchParams(location.search).get("lang");
  let lang = qp === "en" || qp === "ko" ? qp : store.get("dg-lang") || ((navigator.language || "ko").toLowerCase().startsWith("ko") ? "ko" : "en");
  const listeners = [];
  const DG = {
    ROOT, ICON, CAT_ICON, ORDER,
    get lang() { return lang; },
    t: k => (I18N.UI[lang][k] ?? I18N.UI.ko[k] ?? k),
    tools: () => window.TT_TOOLS.filter(t => t.status === "live"),
    name: t => lang === "en" ? (I18N.TOOL[t.id]?.[0] || t.name) : t.name,
    desc: t => lang === "en" ? (I18N.TOOL[t.id]?.[1] || t.desc) : t.desc,
    cat: c => I18N.CAT[c][lang][0], catTag: c => I18N.CAT[c][lang][1],
    color: c => `var(--${c})`,
    href: id => window.DG_HREF ? DG_HREF(id) : `${ROOT}tools/${id}/`,
    icon: id => (window.TT_ICONS && TT_ICONS[id]) || "",
    onLang(fn) { listeners.push(fn); fn(lang); },
    setLang(l) { lang = l; store.set("dg-lang", l); document.documentElement.lang = l; renderShell(); applyText(); listeners.forEach(f => f(l)); },
    count: c => DG.tools().filter(t => t.cat === c).length,
    /* 집계: 숫자만 보내요 (파일 · 개인 정보는 안 보내요) */
    counterOn: !!COUNTER_URL,
    hit(kind, tool = "") { if (!COUNTER_URL) return; try { navigator.sendBeacon(COUNTER_URL.replace(/\/$/, "") + "/hit", kind + ":" + tool); } catch {} },
    async stats() { if (!COUNTER_URL) return null; try { const r = await fetch(COUNTER_URL.replace(/\/$/, "") + "/stats"); return r.ok ? await r.json() : null; } catch { return null; } },
    num(n) { if (n == null) return "—"; if (lang === "ko") return n >= 1e8 ? (n / 1e8).toFixed(1).replace(/\.0$/, "") + "억" : n >= 1e4 ? (n / 1e4).toFixed(1).replace(/\.0$/, "") + "만" : n.toLocaleString("ko-KR"); return n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(n); },
    /* 즐겨찾기 (이 기기에 기억) */
    favs() { try { return JSON.parse(store.get("dg-favs") || "[]"); } catch { return []; } },
    isFav(id) { return DG.favs().includes(id); },
    toggleFav(id) {
      const f = DG.favs(), on = !f.includes(id);
      store.set("dg-favs", JSON.stringify(on ? [...f, id] : f.filter(x => x !== id)));
      DG.hit(on ? "fav" : "unfav", id);
      document.querySelectorAll(`[data-fav="${id}"]`).forEach(paintStar);
      document.dispatchEvent(new CustomEvent("dg-fav", { detail: { id, on } }));
      return on;
    },
    star: id => `<button type="button" class="star" data-fav="${id}" aria-pressed="false"></button>`
  };
  // 별 버튼 모양
  function paintStar(b) { const on = DG.isFav(b.dataset.fav); b.setAttribute("aria-pressed", on); b.title = b.ariaLabel = DG.t(on ? "faved" : "fav"); b.innerHTML = `<svg viewBox="0 0 24 24" fill="${on ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/></svg>${b.classList.contains("wide") ? `<span>${DG.t(on ? "faved" : "fav")}</span>` : ""}`; }
  DG.paintStars = (root = document) => root.querySelectorAll("[data-fav]").forEach(paintStar);
  document.addEventListener("click", e => { const b = e.target.closest("button[data-fav]"); if (!b) return; e.preventDefault(); e.stopPropagation(); DG.toggleFav(b.dataset.fav); });
  window.DG = DG;
  document.documentElement.lang = lang;

  /* ---------- 밝기 ---------- */
  const theme = () => document.documentElement.dataset.theme;
  function setTheme(t) { document.documentElement.dataset.theme = t; store.set("dg-theme", t); const b = document.getElementById("themeBtn"); if (b) { b.innerHTML = t === "dark" ? ICON.sun : ICON.moon; b.title = b.ariaLabel = DG.t("theme") + ": " + DG.t(t === "dark" ? "light" : "dark"); } }

  /* ---------- data-i18n 글자 ---------- */
  function applyText() { document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = DG.t(el.dataset.i18n)); document.querySelectorAll("[data-i18n-ph]").forEach(el => el.placeholder = DG.t(el.dataset.i18nPh)); }

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const toolLink = (t, cls = "") => `<a href="${DG.href(t.id)}" class="${cls}"><span class="ic sm" style="--c:${DG.color(t.cat)}">${DG.icon(t.id)}</span>${esc(DG.name(t))}</a>`;

  /* ---------- 상단 ---------- */
  function renderShell() {
    const hdr = document.getElementById("hdr");
    if (hdr) {
      hdr.className = "hdr";
      hdr.innerHTML = `<div class="wrap">
        <a class="logo" href="${ROOT}"><img src="${ROOT}assets/logo.png" alt="DGMU" width="98" height="34"><span>${lang === "ko" ? "도구모음" : ""}</span></a>
        <nav class="nav" aria-label="${DG.t("menu")}">${ORDER.map(c => {
          const list = DG.tools().filter(t => t.cat === c);
          return `<div class="ni" style="--c:${DG.color(c)}"><button aria-expanded="false" aria-haspopup="true">${esc(DG.cat(c))}</button>
            <div class="mega" role="menu"><div class="mh"><span class="ic" style="--c:${DG.color(c)}">${CAT_ICON[c]}</span><div><b>${esc(DG.cat(c))}</b><br><span>${esc(DG.catTag(c))}</span></div></div>
            <ul>${list.slice(0, 14).map(t => `<li>${toolLink(t)}</li>`).join("")}</ul>
            <a class="all" href="${ROOT}#cat-${c}">${esc(DG.cat(c))} ${DG.t("allOf")} (${list.length}) →</a></div></div>`;
        }).join("")}</nav>
        <span class="sp"></span>
        <button class="ib" id="searchBtn" aria-label="${DG.t("search")}" title="${DG.t("search")}">${ICON.search}</button>
        <button class="ib lang" id="langBtn" aria-label="${DG.t("lang")}" title="한국어 / English">${ICON.globe}${lang === "ko" ? "KO" : "EN"}</button>
        <button class="ib" id="themeBtn"></button>
        <button class="ib burger" id="burger" aria-label="${DG.t("menu")}" aria-expanded="false">${ICON.menu}</button>
      </div>`;
      // 큰 메뉴: 마우스를 올리거나 누르면 열려요
      hdr.querySelectorAll(".ni").forEach(ni => {
        const b = ni.querySelector("button"); let t = 0;
        const open = on => { hdr.querySelectorAll(".ni").forEach(x => { x.classList.toggle("open", x === ni && on); x.querySelector("button").setAttribute("aria-expanded", x === ni && on); }); };
        ni.addEventListener("mouseenter", () => { clearTimeout(t); if (matchMedia("(hover: hover)").matches) open(true); });
        ni.addEventListener("mouseleave", () => { t = setTimeout(() => ni.classList.contains("open") && open(false), 160); });
        b.onclick = () => open(!ni.classList.contains("open"));
      });
      document.getElementById("langBtn").onclick = () => DG.setLang(lang === "ko" ? "en" : "ko");
      document.getElementById("themeBtn").onclick = () => setTheme(theme() === "dark" ? "light" : "dark");
      document.getElementById("searchBtn").onclick = openSearch;
      document.getElementById("burger").onclick = () => { const d = document.getElementById("drawer"), o = !d.classList.contains("open"); d.classList.toggle("open", o); document.getElementById("burger").innerHTML = o ? ICON.close : ICON.menu; document.getElementById("burger").setAttribute("aria-expanded", o); };
      setTheme(theme() || "light");
    }
    // 휴대폰 메뉴
    let d = document.getElementById("drawer");
    if (!d) { d = document.createElement("div"); d.id = "drawer"; d.className = "drawer"; document.body.appendChild(d); }
    d.innerHTML = ORDER.map(c => { const list = DG.tools().filter(t => t.cat === c); return `<details><summary><span class="ic sm" style="--c:${DG.color(c)}">${CAT_ICON[c]}</span>${esc(DG.cat(c))}<small>${list.length}</small></summary><ul>${list.map(t => `<li>${toolLink(t)}</li>`).join("")}</ul></details>`; }).join("");
    // 검색 창
    let s = document.getElementById("sdlg");
    if (!s) { s = document.createElement("div"); s.id = "sdlg"; s.className = "sdlg"; s.addEventListener("click", e => { if (e.target === s) closeSearch(); }); document.body.appendChild(s); }
    s.innerHTML = `<div class="sbox" role="search">${ICON.search}<input type="search" id="sdlgIn" placeholder="${DG.t("searchPh")}" aria-label="${DG.t("search")}" autocomplete="off"><div class="sres" id="sdlgRes" hidden></div></div>`;
    DG.searchBox(document.getElementById("sdlgIn"), document.getElementById("sdlgRes"));
    // 바닥
    const f = document.getElementById("foot");
    if (f) {
      f.className = "vfoot";
      const pick = c => DG.tools().filter(t => t.cat === c).slice(0, 5);
      f.innerHTML = `<div class="wrap"><div class="vfgrid">
        <div class="vfbrand"><img src="${ROOT}assets/logo.png" alt="DGMU" width="110" height="38"><p>${esc(DG.t("footDesc"))}</p></div>
        ${["img", "doc", "form"].map(c => `<div><h4>${esc(DG.cat(c))}</h4><ul>${pick(c).map(t => `<li><a href="${DG.href(t.id)}">${esc(DG.name(t))}</a></li>`).join("")}</ul></div>`).join("")}
        <div><h4>${DG.t("footNav")}</h4><ul><li><a href="#">${DG.t("about")}</a></li><li><a href="#">${DG.t("privacy")}</a></li><li><a href="#">${DG.t("terms")}</a></li><li><a href="#">${DG.t("contact")}</a></li><li><a href="#">${DG.t("suggest")}</a></li></ul></div>
      </div><div class="vfbot"><span>© ${new Date().getFullYear()} 도구모음 DGMU · dgmoum.com · ${esc(DG.t("copy"))}</span><span class="stripe"><i style="background:#ffe600"></i><i style="background:#ff5a0a"></i><i style="background:#3a302c;box-shadow:inset 0 0 0 1px #555"></i></span></div></div>`;
    }
  }

  /* ---------- 검색 (상단 창 · 첫 화면 공용) ---------- */
  DG.searchBox = (input, box) => {
    let idx = 0, hits = [];
    const norm = s => s.toLowerCase().replace(/\s+/g, "");
    const draw = () => {
      const q = norm(input.value);
      if (!q) { box.hidden = true; return; }
      hits = DG.tools().map(t => {
        const hay = norm([t.name, t.desc, ...(t.tags || []), I18N.TOOL[t.id]?.[0] || "", I18N.TOOL[t.id]?.[1] || ""].join(" "));
        const nm = norm(DG.name(t)); const score = nm.startsWith(q) ? 3 : nm.includes(q) ? 2 : hay.includes(q) ? 1 : 0;
        return [score, t];
      }).filter(x => x[0]).sort((a, b) => b[0] - a[0]).slice(0, 8).map(x => x[1]);
      idx = 0; box.hidden = false;
      box.innerHTML = hits.length ? hits.map((t, i) => `<a href="${DG.href(t.id)}" class="${i === idx ? "on" : ""}"><span class="ic" style="--c:${DG.color(t.cat)}">${DG.icon(t.id)}</span><div><b>${esc(DG.name(t))}</b><small>${esc(DG.desc(t))}</small></div></a>`).join("") : `<p>${DG.t("noResult")}</p>`;
    };
    input.addEventListener("input", draw);
    input.addEventListener("focus", draw);
    input.addEventListener("keydown", e => {
      const as = box.querySelectorAll("a"); if (!as.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); idx = (idx + (e.key === "ArrowDown" ? 1 : -1) + as.length) % as.length; as.forEach((a, i) => a.classList.toggle("on", i === idx)); as[idx].scrollIntoView({ block: "nearest" }); }
      if (e.key === "Enter") { e.preventDefault(); as[idx].click(); }
    });
    document.addEventListener("click", e => { if (!input.parentElement.contains(e.target)) box.hidden = true; });
  };
  function openSearch() { const s = document.getElementById("sdlg"); s.classList.add("open"); setTimeout(() => document.getElementById("sdlgIn").focus(), 10); }
  function closeSearch() { document.getElementById("sdlg").classList.remove("open"); }
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeSearch(); document.querySelectorAll(".ni.open").forEach(n => n.classList.remove("open")); }
    if (e.key === "/" && !e.target.closest("input, textarea, select, [contenteditable]")) { e.preventDefault(); openSearch(); }
  });
  document.addEventListener("click", e => { if (!e.target.closest(".ni")) document.querySelectorAll(".ni.open").forEach(n => { n.classList.remove("open"); n.querySelector("button").setAttribute("aria-expanded", "false"); }); });

  /* ---------- 도구 페이지 ---------- */
  const TOOL_ID = document.body?.dataset.tool;
  let koTitle = null;
  function renderToolPage() {
    if (!TOOL_ID || !window.TT_TOOLS) return;
    const t = TT_TOOLS.find(x => x.id === TOOL_ID); if (!t) return;
    const head = document.querySelector(".tool-head");
    if (head) {
      const h1 = head.querySelector("h1"), p = head.querySelector("p");
      if (!head.dataset.ko) head.dataset.ko = JSON.stringify([h1?.textContent || "", p?.innerHTML || ""]);
      const [kh, kp] = JSON.parse(head.dataset.ko);
      if (h1) h1.textContent = lang === "ko" ? kh : DG.name(t);
      if (p) p.innerHTML = lang === "ko" ? kp : esc(DG.desc(t));
      let fb = head.querySelector(".star.wide");
      if (!fb) { fb = document.createElement("button"); fb.type = "button"; fb.className = "star wide"; fb.dataset.fav = t.id; (p || h1).after(fb); }
      paintStar(fb);
      let cr = document.querySelector(".vcrumb");
      if (!cr) { cr = document.createElement("nav"); cr.className = "vcrumb"; cr.setAttribute("aria-label", "breadcrumb"); head.before(cr); }
      cr.innerHTML = `<a href="${ROOT}">${esc(DG.t("home"))}</a><span>›</span><a href="${ROOT}#cat-${t.cat}">${esc(DG.cat(t.cat))}</a><span>›</span><span style="color:var(--ink)">${esc(DG.name(t))}</span>`;
    }
    koTitle ??= document.title;
    document.title = lang === "ko" ? koTitle : `${DG.name(t)} · DGMU`;
    // 아래쪽 안내 (사용 방법 · 자주 묻는 질문 · 함께 쓰는 도구)
    if (document.body.dataset.noMore !== undefined) return;
    let more = document.getElementById("toolMore");
    if (!more) { more = document.createElement("section"); more.id = "toolMore"; more.className = "tool-more wrap"; (document.getElementById("foot") || document.body.lastElementChild).before(more); }
    const rel = DG.tools().filter(x => x.cat === t.cat && x.id !== t.id).slice(0, 8);
    const card = x => `<div class="vtw"><a class="vtool" href="${DG.href(x.id)}" style="--c:${DG.color(x.cat)}"><span class="ic">${DG.icon(x.id)}</span><div><b>${esc(DG.name(x))}</b><span>${esc(DG.desc(x))}</span></div></a>${DG.star(x.id)}</div>`;
    more.innerHTML = `<div class="vsec"><div class="sh"><h2>${esc(lang === "ko" ? DG.name(t) + " " + DG.t("howTo") : DG.t("howTo"))}</h2></div>
        <div class="steps">${[1, 2, 3].map(i => `<div class="stp"><h3>${esc(DG.t("s" + i + "t"))}</h3><p>${esc(DG.t("s" + i + "d"))}</p></div>`).join("")}</div></div>
      <div class="vsec"><div class="sh"><h2>${esc(DG.t("faq"))}</h2></div>
        <div class="faq" style="margin:0">${[1, 2, 3].map(i => `<details><summary>${esc(DG.t("q" + i))}</summary><p>${esc(DG.t("a" + i))}</p></details>`).join("")}</div></div>
      ${rel.length ? `<div class="vsec"><div class="sh"><h2>${esc(DG.t("related"))}</h2></div><div class="vgrid">${rel.map(card).join("")}</div></div>` : ""}`;
    DG.paintStars(more);
  }
  listeners.push(renderToolPage);
  // 결과를 저장(다운로드)하거나 인쇄하면 "사용 1회" (1.5초 안에 여러 번이면 한 번만)
  let lastUse = 0;
  const used = () => { if (Date.now() - lastUse < 1500) return; lastUse = Date.now(); DG.hit("use", TOOL_ID || ""); };
  if (TOOL_ID) {
    const hook = () => { if (window.TT && !TT._dgHooked) { const d = TT.download; TT.download = function (...a) { used(); return d.apply(this, a); }; TT._dgHooked = true; } };
    hook(); document.addEventListener("DOMContentLoaded", hook);
    addEventListener("beforeprint", used);
  }

  const start = () => { renderShell(); applyText(); renderToolPage(); DG.paintStars(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
