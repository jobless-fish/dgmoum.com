/* 뚝딱툴 양식 엔진
   각 양식 페이지는 TF.make({ fields, tables, stamps, photo, render }) 하나만 부르면 돼요.
   - 왼쪽 입력칸을 만들고, 고칠 때마다 오른쪽 A4 문서를 다시 그려요.
   - 내 정보(mem: "biz" 사업자 / "me" 개인)는 이 기기에만 기억해요.
   - 도장·서명은 사진의 흰 배경을 지워서 넣거나, 화면에 직접 그려요. */
window.TF = (() => {
  // 업종 추가 요청 받을 주소 (구글 설문 등으로 바꿔도 돼요)
  const REQUEST_URL = "https://github.com/jobless-fish/ttukttak/issues/new?title=" + encodeURIComponent("[견적서 업종 추가 요청] ");

  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const num = s => { const n = parseFloat(String(s ?? "").replace(/[^\d.\-]/g, "")); return isFinite(n) ? n : 0; };
  const won = n => Math.round(n).toLocaleString("ko-KR");
  function hangul(n) {
    n = Math.floor(Math.abs(n)); if (!n) return "영";
    const D = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"], S = ["천", "백", "십", ""], B = ["", "만", "억", "조", "경"];
    let out = "", i = 0;
    while (n > 0) {
      const c = n % 10000;
      if (c) { let s = ""; String(c).padStart(4, "0").split("").forEach((d, j) => { if (+d) s += D[+d] + S[j]; }); out = s + B[i] + out; }
      n = Math.floor(n / 10000); i++;
    }
    return out;
  }
  const pad2 = n => String(n).padStart(2, "0");
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
  const kdate = s => { const m = String(s || "").match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${+m[1]}년 ${+m[2]}월 ${+m[3]}일` : ""; };
  const ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

  /* ---------- 이 기기에 기억 ---------- */
  const MEM_KEY = "tt-forms-mem", OPT_KEY = "tt-forms-opt";
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  /* ---------- 도장·서명: 흰 배경 지우기 ---------- */
  const INK = { red: [200, 22, 36], black: [20, 20, 22], blue: [28, 56, 170] };
  async function readImage(file) {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 900 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); bmp.close();
    return c;
  }
  // strength 0~100: 높을수록 연한 얼룩까지 지워요. color: auto | red | black | blue
  function cleanInk(src, { strength = 50, color = "auto" } = {}) {
    const W = src.width, H = src.height;
    const g = src.getContext("2d", { willReadFrequently: true });
    const d = g.getImageData(0, 0, W, H).data;
    // 종이 색 = 가장자리 픽셀 중 밝은 쪽의 중간값
    const edge = [];
    const take = (x, y) => { const i = (y * W + x) * 4; edge.push([d[i], d[i + 1], d[i + 2]]); };
    for (let x = 0; x < W; x += 2) { take(x, 0); take(x, H - 1); }
    for (let y = 0; y < H; y += 2) { take(0, y); take(W - 1, y); }
    edge.sort((a, b) => (b[0] + b[1] + b[2]) - (a[0] + a[1] + a[2]));
    const top = edge.slice(0, Math.max(1, edge.length >> 1));
    const paper = [0, 1, 2].map(k => top.map(p => p[k]).sort((a, b) => a - b)[top.length >> 1]);
    const lo = 14 + strength * 0.9, hi = lo + 70;
    const out = new ImageData(W, H), o = out.data;
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    const fixed = INK[color];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, r = d[i], gg = d[i + 1], b = d[i + 2];
      const dist = Math.hypot(r - paper[0], gg - paper[1], b - paper[2]);
      let a = Math.max(0, Math.min(1, (dist - lo) / (hi - lo)));
      if (a > 0) {
        if (fixed) { o[i] = fixed[0]; o[i + 1] = fixed[1]; o[i + 2] = fixed[2]; }
        else {
          // 종이 색을 빼서 잉크 색만 남겨요
          const aa = Math.max(a, 0.35);
          o[i] = Math.max(0, Math.min(255, (r - (1 - aa) * paper[0]) / aa));
          o[i + 1] = Math.max(0, Math.min(255, (gg - (1 - aa) * paper[1]) / aa));
          o[i + 2] = Math.max(0, Math.min(255, (b - (1 - aa) * paper[2]) / aa));
        }
        o[i + 3] = Math.round(a * 255);
        if (a > 0.15) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
    }
    if (x1 < 0) return null;
    const p = 4; x0 = Math.max(0, x0 - p); y0 = Math.max(0, y0 - p); x1 = Math.min(W - 1, x1 + p); y1 = Math.min(H - 1, y1 + p);
    const full = document.createElement("canvas"); full.width = W; full.height = H; full.getContext("2d").putImageData(out, 0, 0);
    const c = document.createElement("canvas"); c.width = x1 - x0 + 1; c.height = y1 - y0 + 1;
    c.getContext("2d").drawImage(full, x0, y0, c.width, c.height, 0, 0, c.width, c.height);
    // 너무 크면 줄여서 저장 용량을 아껴요
    const s = Math.min(1, 600 / Math.max(c.width, c.height));
    if (s < 1) { const r2 = document.createElement("canvas"); r2.width = Math.round(c.width * s); r2.height = Math.round(c.height * s); r2.getContext("2d").drawImage(c, 0, 0, r2.width, r2.height); return r2; }
    return c;
  }
  // 직접 그리는 서명판
  function signPad(canvas, { color = "#141414" } = {}) {
    const g = canvas.getContext("2d");
    const fit = () => { const r = canvas.getBoundingClientRect(), k = Math.min(2, devicePixelRatio || 1); canvas.width = r.width * k; canvas.height = r.height * k; g.setTransform(k, 0, 0, k, 0, 0); g.lineCap = g.lineJoin = "round"; };
    fit();
    let drawing = false, last = null, empty = true;
    const pt = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, e.pressure || 0.5]; };
    canvas.addEventListener("pointerdown", e => { canvas.setPointerCapture(e.pointerId); drawing = true; last = pt(e); empty = false; });
    canvas.addEventListener("pointermove", e => {
      if (!drawing) return;
      const p = pt(e);
      g.strokeStyle = api.color; g.lineWidth = 1.6 + 2.6 * (p[2] || 0.5);
      g.beginPath(); g.moveTo(last[0], last[1]); g.quadraticCurveTo(last[0], last[1], (last[0] + p[0]) / 2, (last[1] + p[1]) / 2); g.lineTo(p[0], p[1]); g.stroke();
      last = p;
    });
    const end = () => { drawing = false; };
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    const api = {
      color,
      clear() { g.clearRect(0, 0, canvas.width, canvas.height); empty = true; },
      get empty() { return empty; },
      // 그린 부분만 잘라서 투명 PNG로
      toCanvas() {
        if (empty) return null;
        const c = document.createElement("canvas"); c.width = canvas.width; c.height = canvas.height;
        c.getContext("2d").drawImage(canvas, 0, 0);
        const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) return null;
        const o = document.createElement("canvas"); o.width = x1 - x0 + 9; o.height = y1 - y0 + 9;
        o.getContext("2d").drawImage(c, x0 - 4, y0 - 4, o.width, o.height, 0, 0, o.width, o.height);
        return o;
      },
      fit
    };
    return api;
  }

  /* ---------- 양식 만들기 ---------- */
  function make(spec) {
    const ed = document.getElementById("editor"), sheet = document.getElementById("sheet"), scaler = document.getElementById("scale"), stage = document.getElementById("stage");
    const opt = store.get(OPT_KEY, { theme: "basic", accent: "#2850c8", remember: true });
    let mem = store.get(MEM_KEY, {});
    const v = {}, fieldEls = {}, memOf = {};
    let raf = 0;

    // 문서 그릴 때 쓰는 도우미
    const H = {
      v, esc, won, hangul, num, kdate,
      t: k => esc(v[k]),
      nl: k => esc(v[k]).replace(/\n/g, "<br>"),
      f: (k, w = 26, cls = "") => `<span class="fill ${cls}" style="min-width:${w}mm">${esc(v[k]) || "&nbsp;"}</span>`,
      date: (k, blank = "　　　　년　　월　　일") => kdate(v[k]) || blank,
      has: k => !!String(v[k] ?? "").trim(),
      check: on => on ? "☑" : "☐",
      rows: (k, min) => { const r = (v[k] || []).filter(x => Object.values(x).some(s => String(s).trim())); while (r.length < min) r.push(null); return r; },
      stamp: (k, label = "(인)") => {
        const img = v[k], size = v[k + "_size"] || (stampKind(k) === "sign" ? 30 : 17);
        const style = stampKind(k) === "sign" ? `width:${size}mm;max-height:${size * 0.6}mm` : `width:${size}mm;max-height:${size}mm`;
        return `<span class="stampbox">${esc(label)}${img ? `<img src="${img}" alt="" style="${style}">` : ""}</span>`;
      },
      // 09:30 → 9시 30분 (비면 빈칸)
      hm: k => { const m = String(v[k] || "").match(/(\d{1,2}):(\d{2})/); return m ? `${+m[1]}시 ${m[2]}분` : "　　시　　분"; },
      // 공급자·공급받는자 표 (p_no, p_name, p_ceo, p_addr, p_type, p_item, p_tel)
      party: (p, label, stampKey, cls = "") => {
        const t = k => esc(v[p + "_" + k]);
        return `<table class="d-tbl d-party ${cls}"><colgroup><col style="width:7mm"><col style="width:15mm"><col><col style="width:12mm"><col></colgroup>
          <tr><th class="vlabel" rowspan="5">${label}</th><th>등록번호</th><td colspan="3" class="c d-mono">${t("no")}</td></tr>
          <tr><th>상호</th><td>${t("name")}</td><th>성명</th><td><span class="d-namecell"><span>${t("ceo")}</span>${stampKey ? H.stamp(stampKey) : '<span class="stampbox">(인)</span>'}</span></td></tr>
          <tr><th>주소</th><td colspan="3">${t("addr")}</td></tr>
          <tr><th>업태</th><td>${t("type")}</td><th>종목</th><td>${t("item")}</td></tr>
          <tr><th>전화</th><td colspan="3">${t("tel")}</td></tr></table>`;
      },
      // 일금 OOO원정 (₩ 0,000)
      amount: n => n > 0 ? `일금 ${hangul(n)}원정 <span class="d-num">(₩ ${won(n)})</span>` : `일금　　　　　　　　　원정 <span class="d-num">(₩　　　　　　　)</span>`,
      photo: k => `<div class="d-photo">${v[k] ? `<img src="${v[k]}" alt="">` : "사진<br>(3 × 4 cm)"}</div>`
    };
    const stampKind = k => (spec.stamps || []).find(s => s.k === k)?.kind || "stamp";

    /* 위쪽: 스타일 고르기 */
    const top = document.createElement("div");
    top.innerHTML = `<h2>문서 스타일</h2>
      <div class="seg" role="radiogroup">
        <input type="radio" name="theme" id="th-basic" value="basic"><label for="th-basic">기본</label>
        <input type="radio" name="theme" id="th-modern" value="modern"><label for="th-modern">모던</label>
        <input type="radio" name="theme" id="th-classic" value="classic"><label for="th-classic">클래식</label>
      </div>
      <div class="colors" id="accentRow" style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="color" id="accent" aria-label="강조색" style="width:36px;height:30px;padding:0;border:1px solid var(--line);border-radius:6px;background:none"><span class="hint">모던 스타일의 강조색</span></div>`;
    ed.appendChild(top);
    top.querySelector(`#th-${opt.theme}`).checked = true;
    top.querySelector("#accent").value = opt.accent;
    const syncTheme = () => { top.querySelector("#accentRow").style.display = opt.theme === "modern" ? "flex" : "none"; };
    top.querySelectorAll("input[name=theme]").forEach(r => r.onchange = () => { opt.theme = r.value; store.set(OPT_KEY, opt); syncTheme(); schedule(); });
    top.querySelector("#accent").oninput = e => { opt.accent = e.target.value; store.set(OPT_KEY, opt); schedule(); };
    syncTheme();

    /* 입력칸 */
    let pendingHalf = null;
    const addEl = (el, half) => {
      if (half) {
        if (pendingHalf && pendingHalf.children.length < 2) { pendingHalf.appendChild(el); if (pendingHalf.children.length === 2) pendingHalf = null; return; }
        pendingHalf = document.createElement("div"); pendingHalf.className = "ftwo"; pendingHalf.appendChild(el); ed.appendChild(pendingHalf); return;
      }
      pendingHalf = null; ed.appendChild(el);
    };
    for (const f of spec.fields || []) {
      if (f.sec) { pendingHalf = null; const h = document.createElement("h2"); h.textContent = f.sec; ed.appendChild(h); if (f.hint) { const p = document.createElement("p"); p.className = "hint"; p.textContent = f.hint; ed.appendChild(p); } continue; }
      if (f.table) { pendingHalf = null; ed.appendChild(tableEditor(spec.tables.find(t => t.k === f.table))); continue; }
      if (f.stamp) { pendingHalf = null; ed.appendChild(stampEditor((spec.stamps || []).find(s => s.k === f.stamp))); continue; }
      if (f.photo) { pendingHalf = null; ed.appendChild(photoEditor(f)); continue; }
      if (f.html) { pendingHalf = null; const d = document.createElement("div"); d.innerHTML = f.html; ed.appendChild(d); continue; }
      const wrap = document.createElement("div"); wrap.className = f.type === "check" ? "" : "field";
      const id = "f-" + f.k;
      let input;
      if (f.type === "textarea") { input = document.createElement("textarea"); }
      else if (f.type === "select") { input = document.createElement("select"); input.innerHTML = f.opts.map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join(""); }
      else if (f.type === "check") { wrap.className = "check"; input = document.createElement("input"); input.type = "checkbox"; }
      else { input = document.createElement("input"); input.type = f.type === "date" || f.type === "time" ? f.type : "text"; if (f.type === "money" || f.type === "num") input.inputMode = "decimal"; }
      input.id = id; input.dataset.k = f.k;
      if (f.ph) input.placeholder = f.ph;
      if (f.type === "check") { const lab = document.createElement("label"); lab.className = "check"; lab.append(input, document.createTextNode(" " + f.label)); addEl(lab, f.half); }
      else {
        const lab = document.createElement("label"); lab.htmlFor = id; lab.textContent = f.label;
        wrap.append(lab, input);
        if (f.help) { const p = document.createElement("p"); p.className = "hint"; p.innerHTML = f.help; wrap.appendChild(p); }
        addEl(wrap, f.half);
      }
      fieldEls[f.k] = input; if (f.mem) memOf[f.k] = f.mem;
      // 처음 값: 기억한 값 → 오늘 날짜 → 선택지 첫 번째
      let init = f.mem && opt.remember ? mem[f.mem]?.[f.k] : undefined;
      if (init === undefined && f.def === "today") init = today();
      if (init === undefined && f.def !== undefined && f.def !== "today") init = f.def;
      if (f.type === "check") { input.checked = !!init; v[f.k] = !!init; }
      else { if (init !== undefined) input.value = init; v[f.k] = input.value; }
    }

    /* 표 편집 */
    function tableEditor(t) {
      const box = document.createElement("div");
      box.innerHTML = `<div class="trows"></div><div class="row" style="margin-top:10px"><button type="button" class="btn btn-sm">+ ${esc(t.addLabel || "줄 추가")}</button>${t.min ? `<span class="hint">인쇄할 때는 최소 ${t.min}줄이 보여요. 빈 줄은 손으로 적을 수 있어요.</span>` : ""}</div>`;
      const list = box.querySelector(".trows");
      v[t.k] = [];
      const draw = () => {
        list.innerHTML = "";
        v[t.k].forEach((row, i) => {
          const r = document.createElement("div"); r.className = "trow";
          r.innerHTML = `<span class="tno">${i + 1}</span><button type="button" class="trm" title="이 줄 지우기">${ICON_X}</button>` +
            t.cols.map(c => `<input class="c-${c.size || "half"}" data-t="${t.k}" data-i="${i}" data-c="${c.k}" placeholder="${esc(c.ph || c.label)}" aria-label="${esc(c.label)}" ${c.type === "money" || c.type === "num" ? 'inputmode="decimal"' : ""} value="${esc(row[c.k] || "")}">`).join("");
          r.querySelector(".trm").onclick = () => { v[t.k].splice(i, 1); draw(); schedule(); };
          list.appendChild(r);
        });
        applyHints();
      };
      const add = () => { v[t.k].push(Object.fromEntries(t.cols.map(c => [c.k, ""]))); };
      for (let i = 0; i < (t.start ?? 3); i++) add();
      box.querySelector("button.btn").onclick = () => { add(); draw(); list.lastElementChild?.querySelector("input")?.focus(); };
      t._draw = draw; draw();
      return box;
    }

    /* 도장·서명 편집 */
    function stampEditor(s) {
      const box = document.createElement("div"); box.className = "slot";
      const isSign = s.kind === "sign";
      box.innerHTML = `
        <div class="sprev"><span>${isSign ? "서명 없음" : "도장 없음"}</span></div>
        <div style="display:grid;gap:6px">
          <b style="font-size:13px">${esc(s.label)}</b>
          <div class="row">
            <button type="button" class="btn btn-sm" data-a="up">사진 올리기</button>
            <button type="button" class="btn btn-sm" data-a="draw">직접 ${isSign ? "서명" : "그리기"}</button>
            <button type="button" class="btn btn-sm" data-a="rm" hidden>빼기</button>
          </div>
          <input type="file" accept="image/*" hidden>
        </div>
        <div class="opts" data-o="clean" hidden>
          <p class="hint">흰 종이에 찍은 ${isSign ? "서명" : "도장"}을 찍어 올리면 배경을 지워요. 얼룩이 남으면 "지우는 정도"를 올리세요.</p>
          <div class="field"><label>지우는 정도 <span class="num" data-v="st">50</span></label><input type="range" min="0" max="100" value="50" data-c="st"></div>
          <div class="field"><label>색</label>
            <div class="seg" role="radiogroup">
              ${["auto:원래 색", "red:인주 빨강", "black:검정", "blue:파랑"].map(x => { const [val, lab] = x.split(":"); return `<input type="radio" name="ink-${s.k}" id="ink-${s.k}-${val}" value="${val}" ${val === "auto" ? "checked" : ""}><label for="ink-${s.k}-${val}">${lab}</label>`; }).join("")}
            </div>
          </div>
        </div>
        <div class="pad-wrap" data-o="pad" hidden>
          <canvas class="pad"></canvas>
          <div class="row"><button type="button" class="btn btn-sm" data-a="padclear">다시 쓰기</button><button type="button" class="btn btn-sm btn-primary" data-a="paddone">넣기</button><button type="button" class="btn btn-sm" data-a="padcancel">취소</button></div>
        </div>
        <div class="opts" data-o="size" hidden>
          <div class="field"><label>문서에 들어갈 크기 <span class="num" data-v="sz"></span></label><input type="range" min="${isSign ? 15 : 10}" max="${isSign ? 60 : 30}" data-c="sz"></div>
        </div>`;
      const file = box.querySelector("input[type=file]"), prev = box.querySelector(".sprev");
      let srcCanvas = null, pad = null;
      const sizeKey = s.k + "_size";
      const initSize = (s.mem && opt.remember ? mem[s.mem]?.[sizeKey] : null) || (isSign ? 30 : 17);
      v[sizeKey] = initSize;
      box.querySelector("[data-c=sz]").value = initSize; box.querySelector("[data-v=sz]").textContent = initSize + "mm";
      const set = url => {
        v[s.k] = url || "";
        prev.innerHTML = url ? `<img src="${url}" alt="">` : `<span>${isSign ? "서명 없음" : "도장 없음"}</span>`;
        box.querySelector("[data-a=rm]").hidden = !url;
        box.querySelector("[data-o=size]").hidden = !url;
        if (s.mem) remember(s.mem, s.k, v[s.k]);
        schedule();
      };
      const reclean = () => {
        if (!srcCanvas) return;
        const st = +box.querySelector("[data-c=st]").value, color = box.querySelector(`input[name="ink-${s.k}"]:checked`).value;
        box.querySelector("[data-v=st]").textContent = st;
        const c = cleanInk(srcCanvas, { strength: st, color });
        if (!c) { prev.innerHTML = `<span>찾지 못했어요</span>`; return; }
        set(c.toDataURL("image/png"));
      };
      box.addEventListener("click", e => {
        const a = e.target.closest("[data-a]")?.dataset.a; if (!a) return;
        if (a === "up") file.click();
        if (a === "rm") { srcCanvas = null; box.querySelector("[data-o=clean]").hidden = true; set(""); }
        if (a === "draw") {
          box.querySelector("[data-o=pad]").hidden = false; box.querySelector("[data-o=clean]").hidden = true;
          const cv = box.querySelector(".pad");
          if (!pad) pad = signPad(cv); else { pad.fit(); pad.clear(); }
          pad.color = isSign ? "#141414" : "#c81624";
        }
        if (a === "padclear") pad && pad.clear();
        if (a === "padcancel") box.querySelector("[data-o=pad]").hidden = true;
        if (a === "paddone") { const c = pad && pad.toCanvas(); if (c) { srcCanvas = null; set(c.toDataURL("image/png")); } box.querySelector("[data-o=pad]").hidden = true; }
      });
      file.onchange = async () => {
        const f = file.files[0]; file.value = ""; if (!f) return;
        try { srcCanvas = await readImage(f); } catch { prev.innerHTML = `<span>열 수 없는 이미지</span>`; return; }
        box.querySelector("[data-o=clean]").hidden = false; box.querySelector("[data-o=pad]").hidden = true;
        reclean();
      };
      box.querySelector("[data-c=st]").addEventListener("input", reclean);
      box.querySelectorAll(`input[name="ink-${s.k}"]`).forEach(r => r.addEventListener("change", reclean));
      box.querySelector("[data-c=sz]").addEventListener("input", e => { v[sizeKey] = +e.target.value; box.querySelector("[data-v=sz]").textContent = e.target.value + "mm"; if (s.mem) remember(s.mem, sizeKey, v[sizeKey]); schedule(); });
      const init = s.mem && opt.remember ? mem[s.mem]?.[s.k] : "";
      if (init) setTimeout(() => set(init)); else v[s.k] = "";
      return box;
    }

    /* 사진 (이력서) */
    function photoEditor(f) {
      const box = document.createElement("div"); box.className = "slot";
      box.innerHTML = `<div class="sprev" style="height:96px;width:76px"><span>사진</span></div>
        <div style="display:grid;gap:6px"><b style="font-size:13px">${esc(f.label || "사진")}</b>
          <div class="row"><button type="button" class="btn btn-sm" data-a="up">사진 고르기</button><button type="button" class="btn btn-sm" data-a="rm" hidden>빼기</button></div>
          <p class="hint">가운데를 3 : 4 비율로 맞춰 넣어요.</p><input type="file" accept="image/*" hidden></div>`;
      const file = box.querySelector("input"), prev = box.querySelector(".sprev");
      v[f.photo] = "";
      box.addEventListener("click", e => { const a = e.target.closest("[data-a]")?.dataset.a; if (a === "up") file.click(); if (a === "rm") { v[f.photo] = ""; prev.innerHTML = "<span>사진</span>"; box.querySelector("[data-a=rm]").hidden = true; schedule(); } });
      file.onchange = async () => {
        const fl = file.files[0]; file.value = ""; if (!fl) return;
        try {
          const b = await createImageBitmap(fl), tw = 600, th = 800, s = Math.max(tw / b.width, th / b.height);
          const c = document.createElement("canvas"); c.width = tw; c.height = th;
          c.getContext("2d").drawImage(b, (tw - b.width * s) / 2, (th - b.height * s) / 2, b.width * s, b.height * s); b.close();
          v[f.photo] = c.toDataURL("image/jpeg", 0.9);
          prev.innerHTML = `<img src="${v[f.photo]}" alt="">`; box.querySelector("[data-a=rm]").hidden = false; schedule();
        } catch { prev.innerHTML = "<span>열 수 없어요</span>"; }
      };
      return box;
    }

    /* 아래쪽: 기억하기 · 비우기 */
    const bottom = document.createElement("div");
    bottom.innerHTML = `<h2>내 정보 기억</h2>
      <label class="check"><input type="checkbox" id="remember"> 상호·연락처·도장 같은 내 정보를 이 기기에 기억하기</label>
      <p class="hint">기억한 정보는 이 브라우저에만 남고 어디에도 보내지 않아요. 다른 양식에서도 같이 쓰여요.</p>
      <div class="row"><button type="button" class="btn btn-sm" id="forget">기억한 정보 지우기</button><button type="button" class="btn btn-sm" id="reset">입력 모두 비우기</button></div>
      <p class="status" id="fstatus"></p>`;
    ed.appendChild(bottom);
    const say = TT.sayTo(bottom.querySelector("#fstatus"));
    bottom.querySelector("#remember").checked = opt.remember;
    bottom.querySelector("#remember").onchange = e => { opt.remember = e.target.checked; store.set(OPT_KEY, opt); if (!opt.remember) say("이제부터 새로 적는 정보는 기억하지 않아요. 이미 기억한 정보를 지우려면 옆 버튼을 누르세요."); else { for (const [k, g] of Object.entries(memOf)) remember(g, k, v[k]); say("내 정보를 기억해요.", "ok"); } };
    bottom.querySelector("#forget").onclick = () => { mem = {}; store.set(MEM_KEY, mem); say("기억한 정보를 지웠어요. 화면에 적힌 내용은 그대로예요.", "ok"); };
    bottom.querySelector("#reset").onclick = () => { location.reload(); };

    function remember(group, k, val) {
      if (!opt.remember) return;
      mem[group] = mem[group] || {}; mem[group][k] = val; store.set(MEM_KEY, mem);
    }

    /* 입력 → 값 → 문서 */
    ed.addEventListener("input", e => {
      const el = e.target;
      if (el.dataset.t) { v[el.dataset.t][+el.dataset.i][el.dataset.c] = el.value; schedule(); return; }
      const k = el.dataset.k; if (!k) return;
      v[k] = el.type === "checkbox" ? el.checked : el.value;
      if (memOf[k]) remember(memOf[k], k, v[k]);
      schedule();
    });
    ed.addEventListener("change", e => { if (e.target.tagName === "SELECT") applyHints(); });

    // 업종처럼 다른 값에 따라 바뀌는 안내 문구
    function applyHints() {
      if (!spec.hints) return;
      const h = spec.hints(v) || {};
      for (const [key, ph] of Object.entries(h)) {
        if (key.includes(".")) { const [t, c] = key.split("."); ed.querySelectorAll(`input[data-t="${t}"][data-c="${c}"]`).forEach((el, i) => { el.placeholder = Array.isArray(ph) ? (ph[i] || ph[ph.length - 1]) : ph; }); }
        else if (fieldEls[key]) fieldEls[key].placeholder = ph;
      }
    }

    function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); }
    function render() {
      sheet.className = "sheet t-" + opt.theme;
      sheet.style.setProperty("--user-accent", opt.accent);
      sheet.innerHTML = spec.render(v, H);
      fit();
    }
    function fit() {
      const avail = stage.clientWidth - 32, w = sheet.offsetWidth;
      const s = Math.min(1, avail / w);
      scaler.style.transform = `scale(${s})`;
      scaler.style.width = w + "px";
      stage.style.height = (sheet.offsetHeight * s + 32) + "px";
    }
    new ResizeObserver(fit).observe(stage);
    document.fonts?.ready.then(fit);

    document.getElementById("print").onclick = () => {
      render();
      // PDF 파일 이름은 문서 제목을 따라가요
      const old = document.title, name = spec.fileName ? spec.fileName(v) : "";
      if (name) document.title = name.replace(/[\\/:*?"<>|]+/g, " ").trim();
      setTimeout(() => { window.print(); setTimeout(() => { document.title = old; }, 500); }, 50);
    };
    applyHints(); render();
    return { v, render };
  }

  return { make, esc, num, won, hangul, kdate, today, readImage, cleanInk, signPad, REQUEST_URL };
})();
