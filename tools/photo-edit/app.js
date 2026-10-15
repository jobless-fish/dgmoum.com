/* 사진 보정 화면 — 라이트룸 현상 화면처럼 왼쪽 프리셋, 가운데 사진, 오른쪽 보정 패널 */
(() => {
  const $ = s => document.querySelector(s);
  const clone = o => JSON.parse(JSON.stringify(o));
  const D = PE_DEFAULTS, DJSON = JSON.stringify(D);
  const COLORS_KO = ["빨강", "주황", "노랑", "초록", "아쿠아", "파랑", "보라", "마젠타"];
  const HUES = [0, 30, 60, 120, 180, 240, 280, 320];
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

  const canvas = $("#cv"), view = $("#view"), app = $("#app");
  const eng = PE.create(canvas);
  if (!eng) {
    $("#empty").innerHTML = "<strong>이 브라우저는 사진 보정에 필요한 WebGL2를 지원하지 않아요.</strong><span>최신 크롬·엣지·사파리·파이어폭스에서 열어 주세요.</span>";
    return;
  }
  const PREV_MAX = Math.min(eng.maxTex, innerWidth < 900 ? 2000 : 3000);

  const S = { photos: [], cur: -1, before: false, split: null, zoom: false, hover: null, clip: null };
  const luts = {};
  let P = clone(D);
  const ph = () => S.photos[S.cur];

  /* ---------- 그리기 ---------- */
  const eff = v => ({ ...v, lutOn: !!(v.lutOn && luts[v.lutId]) });
  let raf = 0, hT = 0, lastHist = null;
  function paint() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (S.cur < 0) return;
      const v = eff(S.hover || P);
      eng.setLut(v.lutOn ? luts[v.lutId] : null);
      eng.render(v, S.before ? 1 : S.split ?? 0);
      clearTimeout(hT); hT = setTimeout(() => { lastHist = eng.histogram(v); drawHisto(); drawCurve(); }, 80);
    });
  }

  /* ---------- 값 읽고 쓰기 ---------- */
  const getP = (k, o = P) => k.split(".").reduce((a, x) => a[x], o);
  const setP = (k, val, o = P) => { const ks = k.split("."), last = ks.pop(); ks.reduce((a, x) => a[x], o)[last] = val; };
  const ctrls = [];
  function syncAll() { ctrls.forEach(c => c.sync()); syncTreat(); syncProfile(); buildMix(); drawCurve(); syncWheels(); markPresets(); }

  /* ---------- 되돌리기 ---------- */
  function commit() {
    const p = ph(); if (!p) return;
    const s = JSON.stringify(P);
    if (p.hs[p.hi] === s) return;
    p.hs = p.hs.slice(0, p.hi + 1); p.hs.push(s);
    if (p.hs.length > 120) p.hs.shift();
    p.hi = p.hs.length - 1; p.params = P;
    markEdited(); updBtns();
  }
  function step(d) {
    const p = ph(); if (!p) return;
    const i = p.hi + d; if (i < 0 || i >= p.hs.length) return;
    p.hi = i; P = p.params = JSON.parse(p.hs[i]);
    S.hover = null; syncAll(); paint(); markEdited(); updBtns();
  }
  function updBtns() {
    const p = ph(), on = !!p;
    ["bBefore", "bSplit", "bZoom", "bReset", "bExport"].forEach(id => $("#" + id).disabled = !on);
    $("#bUndo").disabled = !on || p.hi <= 0; $("#bRedo").disabled = !on || p.hi >= p.hs.length - 1;
    $("#bPaste").disabled = !S.clip;
  }
  function markEdited() { S.photos.forEach((p, i) => p.el.classList.toggle("edited", JSON.stringify(p.params) !== DJSON)); }

  /* ---------- 슬라이더 ---------- */
  function slider(k, label, min, max, { step = 1, track, dec = 0, def } = {}) {
    const row = document.createElement("div"); row.className = "sl";
    row.innerHTML = `<label title="두 번 누르면 초기화">${label}</label><input type="range" min="${min}" max="${max}" step="${step}" aria-label="${label}"><input class="nv" inputmode="decimal" aria-label="${label} 값">`;
    const [lab, r, nv] = row.children;
    if (track) r.style.setProperty("--trk", track);
    const dflt = def ?? getP(k, D);
    const fmt = x => (min < 0 && x > 0 ? "+" : "") + (dec ? x.toFixed(dec) : Math.round(x));
    const set = (x, live) => {
      x = Math.min(max, Math.max(min, x)); if (!isFinite(x)) return;
      setP(k, x); r.value = x; nv.value = fmt(x); row.classList.toggle("changed", x !== dflt);
      S.hover = null; paint(); if (!live) commit();
    };
    r.addEventListener("input", () => set(+r.value, true));
    r.addEventListener("change", () => commit());
    nv.addEventListener("change", () => set(parseFloat(nv.value), false));
    nv.addEventListener("keydown", e => { if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); set(getP(k) + (e.key === "ArrowUp" ? 1 : -1) * step * (e.shiftKey ? 10 : 1), false); } });
    lab.addEventListener("dblclick", () => set(dflt, false));
    const c = { sync() { const x = getP(k); r.value = x; nv.value = fmt(x); row.classList.toggle("changed", x !== dflt); } };
    ctrls.push(c); c.sync();
    return row;
  }

  /* ---------- 패널 틀 ---------- */
  const closed = new Set(store.get("tt-pe-closed", ["detail"]));
  function section(parent, id, title, cls = "") {
    const s = document.createElement("section"); s.className = "sec " + cls + (closed.has(id) ? " closed" : "");
    s.innerHTML = `<h2 tabindex="0" role="button" aria-expanded="${!closed.has(id)}">${title}</h2><div class="body"></div>`;
    const h = s.firstElementChild, tog = () => { s.classList.toggle("closed"); const c = s.classList.contains("closed"); h.setAttribute("aria-expanded", !c); c ? closed.add(id) : closed.delete(id); store.set("tt-pe-closed", [...closed]); if (!c) { drawHisto(); drawCurve(); } };
    h.onclick = tog; h.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tog(); } };
    parent.appendChild(s); return s.lastElementChild;
  }
  const sub = (body, text, extra = "") => { const d = document.createElement("div"); d.className = "sub"; d.innerHTML = `<span>${text}</span>${extra}`; body.appendChild(d); return d; };

  const rp = $("#rp");
  /* 히스토그램 */
  const hb = section(rp, "histo", "히스토그램");
  hb.innerHTML = `<canvas id="histo"></canvas><div class="hinfo"><span id="hL"></span><span id="hR"></span></div>`;
  function drawHisto() {
    const c = $("#histo"); if (!c || !c.offsetWidth) return;
    const k = Math.min(2, devicePixelRatio || 1); c.width = c.offsetWidth * k; c.height = c.offsetHeight * k;
    const g = c.getContext("2d"), W = c.width, Hh = c.height; g.clearRect(0, 0, W, Hh);
    if (!lastHist) return;
    const sm = a => Array.from(a, (_, i) => (a[Math.max(0, i - 1)] + 2 * a[i] + a[Math.min(255, i + 1)]) / 4);
    const ch = [[sm(lastHist.r), "rgba(255,70,70,.55)"], [sm(lastHist.g), "rgba(70,220,90,.55)"], [sm(lastHist.b), "rgba(80,130,255,.6)"]];
    const all = ch.flatMap(x => x[0].slice(2, 254)).sort((a, b) => a - b), top = Math.max(1, all[Math.floor(all.length * 0.995)]);
    g.globalCompositeOperation = "lighter";
    for (const [a, col] of ch) { g.fillStyle = col; g.beginPath(); g.moveTo(0, Hh); for (let i = 0; i < 256; i++) g.lineTo(i / 255 * W, Hh - Math.min(1, a[i] / top) * Hh * 0.95); g.lineTo(W, Hh); g.fill(); }
    g.globalCompositeOperation = "source-over";
    const n = lastHist.n, lo = lastHist.l[0] / n, hi = lastHist.l[255] / n;
    $("#hL").textContent = lo > 0.005 ? `검정 잘림 ${(lo * 100).toFixed(1)}%` : "";
    $("#hR").textContent = hi > 0.005 ? `흰색 잘림 ${(hi * 100).toFixed(1)}%` : "";
  }

  /* 기본 */
  const basic = section(rp, "basic", "기본");
  const treat = document.createElement("div"); treat.className = "row2";
  treat.innerHTML = `<span class="hint2" style="width:74px">처리</span><div class="seg2" style="flex:1"><button data-v="color">컬러</button><button data-v="bw">흑백</button></div>`;
  basic.appendChild(treat);
  treat.querySelector(".seg2").onclick = e => { const b = e.target.closest("button"); if (!b) return; P.bw = b.dataset.v === "bw"; syncTreat(); buildMix(); paint(); commit(); };
  function syncTreat() { treat.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", (b.dataset.v === "bw") === !!P.bw)); }

  const prof = document.createElement("div"); prof.style.display = "grid"; prof.style.gap = "7px";
  prof.innerHTML = `<div class="row2"><span class="hint2" style="width:74px">프로필</span><select class="psel" id="lutSel" aria-label="프로필"></select></div><input type="file" id="lutFile" accept=".cube" hidden><p class="hint2" id="lutHint">영상·사진 색 보정용 LUT(.cube) 파일을 불러와 얹을 수 있어요.</p>`;
  basic.appendChild(prof);
  const lutAmt = slider("lutAmt", "양", 0, 100); prof.appendChild(lutAmt);
  function syncProfile() {
    const sel = $("#lutSel");
    sel.innerHTML = `<option value="">기본</option>` + Object.values(luts).map(l => `<option value="${TT_esc(l.id)}">${TT_esc(l.name)}</option>`).join("") + `<option value="__load">LUT 파일 불러오기…</option>`;
    sel.value = P.lutOn && luts[P.lutId] ? P.lutId : "";
    lutAmt.hidden = !(P.lutOn && luts[P.lutId]);
    $("#lutHint").hidden = !lutAmt.hidden;
  }
  const TT_esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  $("#lutSel").onchange = e => {
    const v = e.target.value;
    if (v === "__load") { $("#lutFile").click(); syncProfile(); return; }
    P.lutOn = !!v; P.lutId = v || null; syncProfile(); paint(); commit();
  };
  $("#lutFile").onchange = async e => {
    const f = e.target.files[0]; e.target.value = ""; if (!f) return;
    try {
      const l = PE.parseCube(await f.text(), f.name.replace(/\.cube$/i, ""));
      if (l.n > 65) throw new Error("big");
      luts[l.id] = l; P.lutOn = true; P.lutId = l.id; syncProfile(); paint(); commit();
    } catch { $("#lutHint").hidden = false; $("#lutHint").textContent = "이 LUT 파일은 읽을 수 없어요. 3D LUT(.cube)만 돼요."; }
  };

  sub(basic, "흰색 균형");
  basic.append(
    slider("temp", "색온도", -100, 100, { track: "linear-gradient(90deg,#3f73d8,#8a8a8a,#e6b43a)" }),
    slider("tint", "색조", -100, 100, { track: "linear-gradient(90deg,#3aa548,#8a8a8a,#c94bc9)" }));
  const toneHead = sub(basic, "톤", `<button class="pbtn" id="bAuto" style="padding:2px 10px">자동</button>`);
  basic.append(
    slider("exposure", "노출", -5, 5, { step: 0.05, dec: 2, track: "linear-gradient(90deg,#111,#eee)" }),
    slider("contrast", "대비", -100, 100),
    slider("highlights", "밝은 영역", -100, 100),
    slider("shadows", "어두운 영역", -100, 100),
    slider("whites", "흰색 계열", -100, 100),
    slider("blacks", "검정 계열", -100, 100));
  sub(basic, "외관");
  basic.append(
    slider("texture", "텍스처", -100, 100),
    slider("clarity", "명료도", -100, 100),
    slider("dehaze", "디헤이즈", -100, 100),
    slider("vibrance", "생동감", -100, 100, { track: "linear-gradient(90deg,#777,#c99,#9c9,#99c)" }),
    slider("saturation", "채도", -100, 100, { track: "linear-gradient(90deg,#777,#e55,#5d5,#57e)" }));

  // 자동: 사진 밝기 분포로 노출·흰색·검정을 맞춰요
  const linf = x => x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4), gamf = x => x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  toneHead.querySelector("#bAuto").onclick = () => {
    const p = ph(); if (!p) return;
    const { lo, mid, hi } = p.stats;
    const ev = Math.max(-2.5, Math.min(2.5, Math.round(Math.log2(linf(0.46) / Math.max(1e-4, linf(mid))) * 0.75 * 20) / 20));
    const k = Math.pow(2, ev), hi2 = gamf(Math.min(1, linf(hi) * k)), lo2 = gamf(linf(lo) * k);
    Object.assign(P, {
      exposure: ev,
      whites: Math.round(Math.max(-40, Math.min(60, (0.98 - hi2) / 0.22 * 80))),
      blacks: Math.round(Math.max(-60, Math.min(30, -(lo2 - 0.015) / 0.12 * 80))),
      highlights: hi2 > 0.97 ? -35 : -10, shadows: mid < 0.35 ? 20 : 8, vibrance: Math.max(P.vibrance, 8)
    });
    syncAll(); paint(); commit();
  };

  /* 톤 곡선 */
  const cb = section(rp, "curve", "톤 곡선");
  cb.innerHTML = `<div class="seg2" id="cCh"><button data-v="rgb" aria-pressed="true">RGB</button><button data-v="r">빨강</button><button data-v="g">초록</button><button data-v="b">파랑</button></div>
    <canvas id="curve" aria-label="톤 곡선. 눌러서 점을 더하고 끌어서 옮겨요. 점을 두 번 누르면 지워요."></canvas>
    <div class="row2"><span class="hint2" style="flex:1">눌러서 점 추가 · 끌어서 이동 · 두 번 눌러 삭제</span><button class="pbtn" id="cReset">직선으로</button></div>`;
  let cch = "rgb", cdrag = -1;
  const CC = { rgb: "#e6e6e6", r: "#ff5a5a", g: "#4cd864", b: "#5a8cff" };
  $("#cCh").onclick = e => { const b = e.target.closest("button"); if (!b) return; cch = b.dataset.v; $("#cCh").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); drawCurve(); };
  $("#cReset").onclick = () => { P.curve[cch] = [[0, 0], [255, 255]]; drawCurve(); paint(); commit(); };
  function drawCurve() {
    const c = $("#curve"); if (!c || !c.offsetWidth) return;
    const k = Math.min(2, devicePixelRatio || 1), W = c.width = c.offsetWidth * k, H = c.height = c.offsetHeight * k, g = c.getContext("2d");
    g.clearRect(0, 0, W, H);
    if (lastHist) {
      const a = cch === "rgb" ? lastHist.l : lastHist[cch], top = Math.max(1, [...a].sort((x, y) => x - y)[250]);
      g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.moveTo(0, H);
      for (let i = 0; i < 256; i++) g.lineTo(i / 255 * W, H - Math.min(1, a[i] / top) * H * 0.9);
      g.lineTo(W, H); g.fill();
    }
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = k;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * W / 4, 0); g.lineTo(i * W / 4, H); g.moveTo(0, i * H / 4); g.lineTo(W, i * H / 4); g.stroke(); }
    g.beginPath(); g.moveTo(0, H); g.lineTo(W, 0); g.stroke();
    const pts = P.curve[cch], ys = PE.spline(pts, 256);
    g.strokeStyle = CC[cch]; g.lineWidth = 2 * k; g.beginPath();
    for (let i = 0; i < 256; i++) { const x = i / 255 * W, y = H - ys[i] * H; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    g.fillStyle = CC[cch];
    for (const [x, y] of pts) { g.beginPath(); g.arc(x / 255 * W, H - y / 255 * H, 4.5 * k, 0, Math.PI * 2); g.fill(); }
  }
  {
    const c = $("#curve");
    const pos = e => { const r = c.getBoundingClientRect(); return [Math.max(0, Math.min(255, (e.clientX - r.left) / r.width * 255)), Math.max(0, Math.min(255, (1 - (e.clientY - r.top) / r.height) * 255))]; };
    const near = ([x, y]) => { const pts = P.curve[cch]; let best = -1, bd = 14; pts.forEach(([px, py], i) => { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = i; } }); return best; };
    c.addEventListener("pointerdown", e => {
      if (S.cur < 0) return;
      const p = pos(e); let i = near(p);
      if (i < 0) {
        const pts = P.curve[cch], y = PE.spline(pts, 256)[Math.round(p[0])] * 255;
        pts.push([Math.round(p[0]), Math.round(y)]); pts.sort((a, b) => a[0] - b[0]);
        i = pts.findIndex(q => q[0] === Math.round(p[0]));
      }
      cdrag = i; c.setPointerCapture(e.pointerId); drawCurve(); paint();
    });
    c.addEventListener("pointermove", e => {
      if (cdrag < 0) return;
      const pts = P.curve[cch], [x, y] = pos(e);
      const lo = cdrag > 0 ? pts[cdrag - 1][0] + 2 : 0, hi = cdrag < pts.length - 1 ? pts[cdrag + 1][0] - 2 : 255;
      pts[cdrag] = [Math.round(Math.max(lo, Math.min(hi, x))), Math.round(y)];
      drawCurve(); paint();
    });
    const up = () => { if (cdrag >= 0) { cdrag = -1; commit(); } };
    c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);
    const rm = e => { e.preventDefault(); const i = near(pos(e)), pts = P.curve[cch]; if (i > 0 && i < pts.length - 1) { pts.splice(i, 1); drawCurve(); paint(); commit(); } };
    c.addEventListener("dblclick", rm); c.addEventListener("contextmenu", rm);
  }

  /* 색상 혼합 (HSL) / 흑백 혼합 */
  const mixSec = section(rp, "hsl", "색상 혼합");
  const mixTitle = mixSec.parentElement.querySelector("h2");
  let mixTab = "hue";
  const mixCtrls = [];
  function buildMix() {
    // 이전 슬라이더 연결 끊기
    mixCtrls.splice(0).forEach(c => { const i = ctrls.indexOf(c); if (i >= 0) ctrls.splice(i, 1); });
    mixSec.innerHTML = "";
    const n0 = ctrls.length;
    if (P.bw) {
      mixTitle.textContent = "흑백 혼합";
      const p = document.createElement("p"); p.className = "hint2"; p.textContent = "원래 색에 따라 흑백에서 얼마나 밝게 보일지 정해요. 파랑을 내리면 하늘이 진해져요.";
      mixSec.appendChild(p);
      PE_COLORS.forEach((_, i) => mixSec.appendChild(slider(`mix.${i}`, COLORS_KO[i], -100, 100, { track: `linear-gradient(90deg,hsl(${HUES[i]} 40% 18%),hsl(${HUES[i]} 40% 82%))` })));
    } else {
      mixTitle.textContent = "색상 혼합";
      const tabs = document.createElement("div"); tabs.className = "seg2";
      tabs.innerHTML = [["hue", "색조"], ["sat", "채도"], ["lum", "광도"]].map(([k, l]) => `<button data-v="${k}" aria-pressed="${k === mixTab}">${l}</button>`).join("");
      tabs.onclick = e => { const b = e.target.closest("button"); if (!b) return; mixTab = b.dataset.v; buildMix(); };
      mixSec.appendChild(tabs);
      PE_COLORS.forEach((_, i) => {
        const h = HUES[i];
        const tr = mixTab === "hue" ? `linear-gradient(90deg,hsl(${h - 30} 70% 50%),hsl(${h} 70% 50%),hsl(${h + 30} 70% 50%))`
          : mixTab === "sat" ? `linear-gradient(90deg,#808080,hsl(${h} 90% 50%))` : `linear-gradient(90deg,#111,hsl(${h} 70% 50%),#fff)`;
        mixSec.appendChild(slider(`${mixTab}.${i}`, COLORS_KO[i], -100, 100, { track: tr }));
      });
    }
    mixCtrls.push(...ctrls.slice(n0));
  }
  buildMix();

  /* 색 보정 */
  const gb = section(rp, "grade", "색 보정");
  gb.innerHTML = `<div class="wheels">${[["sh", "어두운 영역"], ["mid", "중간 영역"], ["hi", "밝은 영역"]].map(([k, l]) => `<div><div class="wheel" data-k="${k}" title="두 번 누르면 초기화"><i></i></div><div class="wcap">${l}</div><div class="wval" id="wv-${k}"></div></div>`).join("")}</div>`;
  gb.append(slider("grade.blend", "혼합", 0, 100), slider("grade.balance", "균형", -100, 100));
  function syncWheels() {
    gb.querySelectorAll(".wheel").forEach(w => {
      const [h, s] = P.grade[w.dataset.k], a = h * Math.PI / 180, r = s / 100 * 50;
      const dot = w.firstElementChild; dot.style.left = (50 + Math.sin(a) * r) + "%"; dot.style.top = (50 - Math.cos(a) * r) + "%";
      dot.style.background = s ? `hsl(${h} 80% 50%)` : "#888";
      $("#wv-" + w.dataset.k).textContent = s ? `${Math.round(h)}° · ${s}` : "—";
    });
  }
  gb.querySelectorAll(".wheel").forEach(w => {
    let on = false;
    const at = e => {
      const r = w.getBoundingClientRect(), dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
      const s = Math.min(100, Math.round(Math.hypot(dx, dy) / (r.width / 2) * 100)), h = Math.round((Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360);
      P.grade[w.dataset.k] = [h, s]; syncWheels(); S.hover = null; paint();
    };
    w.addEventListener("pointerdown", e => { if (S.cur < 0) return; on = true; w.setPointerCapture(e.pointerId); at(e); });
    w.addEventListener("pointermove", e => on && at(e));
    const up = () => { if (on) { on = false; commit(); } };
    w.addEventListener("pointerup", up); w.addEventListener("pointercancel", up);
    w.addEventListener("dblclick", () => { P.grade[w.dataset.k] = [0, 0]; syncWheels(); paint(); commit(); });
  });

  /* 세부 · 효과 */
  const db = section(rp, "detail", "세부");
  db.append(slider("sharpen", "선명하게", 0, 150));
  const fb = section(rp, "fx", "효과");
  sub(fb, "비네팅");
  fb.append(slider("vignette", "양", -100, 100, { track: "linear-gradient(90deg,#000,#888,#fff)" }), slider("vigMid", "중간점", 0, 100), slider("vigFeather", "페더", 0, 100));
  sub(fb, "그레인");
  fb.append(slider("grain", "양", 0, 100), slider("grainSize", "크기", 0, 100), slider("grainRough", "거칠기", 0, 100));
  sub(fb, "할레이션");
  fb.append(slider("halation", "양", 0, 100, { track: "linear-gradient(90deg,#55585d,#d84a2a)" }));
  const fxHint = document.createElement("p"); fxHint.className = "hint2"; fxHint.textContent = "밝은 빛 둘레가 붉게 번지는 시네스틸 필름 특유의 효과예요.";
  fb.appendChild(fxHint);

  /* ---------- 왼쪽: 프리셋 ---------- */
  const lp = $("#lp");
  let mine = store.get("tt-pe-mine", []);
  const pItems = [];
  const myBody = section(lp, "mine", "내 프리셋", "pgrp");
  function buildMine() {
    myBody.innerHTML = `<div class="mysave"><input id="myName" placeholder="이름을 입력하세요" maxlength="30" aria-label="새 프리셋 이름"><button class="pbtn" id="mySave">저장</button></div>`;
    mine.forEach((m, i) => {
      const b = document.createElement("button"); b.className = "pi"; b.innerHTML = `${TT_esc(m.name)}<span class="x" data-del="${i}" title="지우기">✕</span>`;
      hookPreset(b, () => clone(m.v), m.name);
      myBody.appendChild(b);
    });
    if (!mine.length) { const p = document.createElement("p"); p.className = "hint2"; p.style.padding = "2px 12px 6px"; p.textContent = "지금 보정값을 이름 붙여 저장해 두면 다른 사진에도 한 번에 쓸 수 있어요. 이 기기에만 저장돼요."; myBody.appendChild(p); }
    $("#mySave").onclick = () => {
      const n = $("#myName").value.trim(); if (!n || S.cur < 0) { $("#myName").focus(); return; }
      mine.push({ name: n, v: clone(P) }); store.set("tt-pe-mine", mine); buildMine();
    };
    $("#myName").onkeydown = e => { if (e.key === "Enter") $("#mySave").click(); };
    myBody.onclick = e => { const d = e.target.closest("[data-del]"); if (!d) return; e.stopPropagation(); mine.splice(+d.dataset.del, 1); store.set("tt-pe-mine", mine); buildMine(); };
  }
  function hookPreset(b, make, name) {
    b.dataset.name = name;
    b.addEventListener("mouseenter", () => { if (S.cur < 0 || matchMedia("(hover: none)").matches) return; S.hover = make(); paint(); });
    b.addEventListener("mouseleave", () => { if (S.hover) { S.hover = null; paint(); } });
    b.addEventListener("click", e => {
      if (e.target.closest("[data-del]") || S.cur < 0) return;
      P = make(); ph().params = P; ph().preset = name; S.hover = null;
      syncAll(); paint(); commit();
    });
    pItems.push(b);
  }
  function markPresets() { const n = ph()?.preset; const same = n && ph().hs[ph().hi] === ph().presetState; pItems.forEach(b => b.classList.toggle("on", !!same && b.dataset.name === n)); }
  buildMine();
  PE_PRESETS.forEach((g, gi) => {
    const body = section(lp, "pg" + gi, g.group, "pgrp");
    g.items.forEach(it => {
      const b = document.createElement("button"); b.className = "pi"; b.innerHTML = `${TT_esc(it.name)}<small>${TT_esc(it.note)}</small>`;
      hookPreset(b, () => PE_apply(it.v), it.name);
      body.appendChild(b);
    });
  });
  const legal = document.createElement("p"); legal.className = "legal";
  legal.textContent = "필름·카메라 이름은 각 회사의 상표예요. 도구모음은 해당 회사와 관계가 없고, 제조사 자료에 나온 특징(입자, 대비, 색 경향)을 참고해 비슷한 느낌을 낸 보정값이에요. 마우스를 올리면 미리 보여요.";
  lp.appendChild(legal);
  // 프리셋을 누른 직후 상태를 기억해서, 손대면 표시를 꺼요
  const _commit = commit;
  commit = function () { _commit(); const p = ph(); if (p && p.preset && !p.presetState) p.presetState = p.hs[p.hi]; markPresets(); };
  // 프리셋을 새로 누르면 기준 상태를 다시 잡아요
  pItems.forEach(b => b.addEventListener("click", () => { const p = ph(); if (p) { p.presetState = p.hs[p.hi]; markPresets(); } }));

  /* ---------- 사진 열기 ---------- */
  const fileIn = $("#file");
  async function addFiles(files) {
    files = files.filter(f => f.type.startsWith("image/") || /\.(jpe?g|png|webp|avif|heic|heif|gif|bmp)$/i.test(f.name));
    let bad = 0;
    for (const f of files) {
      try {
        const bmp = await createImageBitmap(f);
        const full = [bmp.width, bmp.height], s = Math.min(1, PREV_MAX / Math.max(...full));
        const prev = document.createElement("canvas"); prev.width = Math.round(full[0] * s); prev.height = Math.round(full[1] * s);
        const g = prev.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(bmp, 0, 0, prev.width, prev.height); bmp.close();
        // 썸네일 · 밝기 분포
        const t = document.createElement("canvas"), ts = 120 / prev.height; t.width = Math.max(1, Math.round(prev.width * ts)); t.height = 120;
        t.getContext("2d").drawImage(prev, 0, 0, t.width, t.height);
        const px = t.getContext("2d").getImageData(0, 0, t.width, t.height).data, Ls = [];
        for (let i = 0; i < px.length; i += 4) Ls.push((px[i] * 0.2126 + px[i + 1] * 0.7152 + px[i + 2] * 0.0722) / 255);
        Ls.sort((a, b) => a - b);
        const q = r => Ls[Math.min(Ls.length - 1, Math.floor(Ls.length * r))];
        const p = { file: f, name: TT.baseName(f.name), prev, full, params: clone(D), hs: [DJSON], hi: 0, stats: { lo: q(0.005), mid: q(0.5), hi: q(0.995) } };
        const el = document.createElement("div"); el.className = "th"; el.title = f.name;
        el.innerHTML = `<img src="${t.toDataURL("image/jpeg", 0.8)}" alt="">`;
        el.onclick = () => select(S.photos.indexOf(p));
        p.el = el; $("#thumbs").appendChild(el);
        S.photos.push(p);
        if (S.cur < 0) select(0);
      } catch { bad++; }
    }
    if (bad) toast(`${bad}장은 열 수 없었어요. ${/heic|heif/i.test(files.map(f => f.name).join()) ? "HEIC(아이폰 사진)는 사파리에서만 열려요." : ""}`);
    $("#strip").hidden = !S.photos.length;
  }
  function select(i) {
    if (i < 0 || i >= S.photos.length) return;
    S.cur = i; const p = ph(); P = p.params; S.hover = null;
    eng.setImage(p.prev, p.full);
    canvas.hidden = false; $("#empty").hidden = true;
    S.photos.forEach((x, j) => x.el.classList.toggle("on", j === i));
    syncAll(); paint(); updBtns(); placeSplit();
  }
  $("#empty").onclick = () => fileIn.click();
  $("#empty").onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileIn.click(); } };
  $("#add").onclick = () => fileIn.click();
  fileIn.onchange = () => { addFiles([...fileIn.files]); fileIn.value = ""; };
  ["dragenter", "dragover"].forEach(t => view.addEventListener(t, e => { e.preventDefault(); view.classList.add("over"); }));
  ["dragleave", "drop"].forEach(t => view.addEventListener(t, e => { e.preventDefault(); view.classList.remove("over"); }));
  view.addEventListener("drop", e => addFiles([...(e.dataTransfer?.files || [])]));
  document.addEventListener("paste", e => { const f = [...(e.clipboardData?.files || [])]; if (f.length) addFiles(f); });

  let toastT = 0;
  function toast(t) { const b = $("#badge"); b.textContent = t; b.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { b.hidden = !S.before; b.textContent = "보정 전"; }, 3500); }

  /* ---------- 보기: 전후 · 반반 · 확대 ---------- */
  function setBefore(on) { S.before = on; $("#bBefore").setAttribute("aria-pressed", on); $("#badge").textContent = "보정 전"; $("#badge").hidden = !on; paint(); }
  function setSplit(on) { S.split = on ? 0.5 : null; $("#bSplit").setAttribute("aria-pressed", on); $("#split").hidden = !on; placeSplit(); paint(); }
  function placeSplit() {
    if (S.split == null || canvas.hidden) return;
    const r = canvas.getBoundingClientRect(), v = view.getBoundingClientRect();
    const sp = $("#split"); sp.style.left = (r.left - v.left + view.scrollLeft + r.width * S.split - 1) + "px";
    sp.style.top = (r.top - v.top + view.scrollTop) + "px"; sp.style.height = r.height + "px"; sp.style.bottom = "auto";
  }
  {
    const sp = $("#split"); let on = false;
    sp.addEventListener("pointerdown", e => { on = true; sp.setPointerCapture(e.pointerId); e.stopPropagation(); });
    sp.addEventListener("pointermove", e => { if (!on) return; const r = canvas.getBoundingClientRect(); S.split = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); placeSplit(); paint(); });
    sp.addEventListener("pointerup", () => on = false);
  }
  function setZoom(on, at) {
    S.zoom = on; view.classList.toggle("zoom", on); $("#bZoom").setAttribute("aria-pressed", on); $("#bZoom").textContent = on ? "맞춤" : "1:1";
    const k = devicePixelRatio || 1;
    canvas.style.width = on ? canvas.width / k + "px" : ""; canvas.style.height = on ? canvas.height / k + "px" : "";
    if (on && at) { view.scrollLeft = at[0] * canvas.width / k + 16 - view.clientWidth / 2; view.scrollTop = at[1] * canvas.height / k + 16 - view.clientHeight / 2; }
    placeSplit();
  }
  {
    // 맞춤 화면에서 누르면 그 자리를 1:1로, 1:1에서는 끌어서 이동
    let down = null, moved = false;
    canvas.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY, view.scrollLeft, view.scrollTop]; moved = false; if (S.zoom) canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", e => {
      if (!down) return;
      if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) moved = true;
      if (S.zoom && moved) { view.scrollLeft = down[2] - (e.clientX - down[0]); view.scrollTop = down[3] - (e.clientY - down[1]); }
    });
    canvas.addEventListener("pointerup", e => {
      if (down && !moved && e.pointerType === "mouse") { const r = canvas.getBoundingClientRect(); setZoom(!S.zoom, [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]); }
      down = null;
    });
  }
  view.addEventListener("scroll", placeSplit);
  new ResizeObserver(() => { placeSplit(); drawHisto(); drawCurve(); }).observe(view);
  $("#bBefore").onclick = () => setBefore(!S.before);
  $("#bSplit").onclick = () => setSplit(S.split == null);
  $("#bZoom").onclick = () => setZoom(!S.zoom, [0.5, 0.5]);
  $("#bUndo").onclick = () => step(-1);
  $("#bRedo").onclick = () => step(1);
  $("#bReset").onclick = () => { if (S.cur < 0) return; P = ph().params = clone(D); ph().preset = null; syncAll(); paint(); commit(); };
  $("#bCopy").onclick = () => { if (S.cur < 0) return; S.clip = clone(P); updBtns(); toast("보정값을 복사했어요."); };
  $("#bPaste").onclick = () => { if (S.cur < 0 || !S.clip) return; P = ph().params = clone(S.clip); syncAll(); paint(); commit(); };
  $("#bSync").onclick = () => {
    if (S.cur < 0) return;
    const cur = S.cur, v = JSON.stringify(P);
    S.photos.forEach((p, i) => { if (i === cur) return; p.params = JSON.parse(v); p.hs = p.hs.slice(0, p.hi + 1); p.hs.push(v); p.hi = p.hs.length - 1; p.preset = ph().preset; p.presetState = v; });
    markEdited(); toast(`${S.photos.length}장 모두에 같은 보정을 적용했어요.`);
  };

  // 단축키 (라이트룸과 같게)
  document.addEventListener("keydown", e => {
    if (e.target.closest("input, select, textarea") || S.cur < 0) return;
    const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (mod && k === "z") { e.preventDefault(); step(e.shiftKey ? 1 : -1); return; }
    if (mod && k === "y") { e.preventDefault(); step(1); return; }
    if (mod) return;
    if (e.key === "\\") { e.preventDefault(); setBefore(!S.before); }
    else if (k === "y") setSplit(S.split == null);
    else if (k === "z") setZoom(!S.zoom, [0.5, 0.5]);
    else if (e.key === "ArrowRight" && S.photos.length > 1) select((S.cur + 1) % S.photos.length);
    else if (e.key === "ArrowLeft" && S.photos.length > 1) select((S.cur - 1 + S.photos.length) % S.photos.length);
  });

  // 휴대폰: 프리셋 / 보정 탭
  const tab = t => { app.dataset.tab = t; $("#tPreset").setAttribute("aria-pressed", t === "preset"); $("#tEdit").setAttribute("aria-pressed", t === "edit"); drawHisto(); drawCurve(); };
  $("#tPreset").onclick = () => tab("preset"); $("#tEdit").onclick = () => tab("edit");

  addEventListener("beforeunload", e => { if (S.photos.some(p => JSON.stringify(p.params) !== DJSON)) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- 내보내기 ---------- */
  const pop = $("#pop");
  const est = (t, c = "") => { const p = $("#eSt"); p.textContent = t; p.className = "pst " + c; };
  const exp = store.get("tt-pe-export", { fmt: "jpg", q: 92, size: "0", exif: false, who: "one" });
  const segSet = (id, v) => $(id).querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === v));
  function syncExp() {
    segSet("#eFmt", exp.fmt); segSet("#eWho", exp.who); $("#eQ").value = exp.q; $("#eQv").value = exp.q; $("#eSize").value = exp.size; $("#eExif").checked = exp.exif;
    $("#eQRow").hidden = exp.fmt === "png"; $("#eExif").disabled = exp.fmt !== "jpg";
    $("#eWho").querySelector('[data-v="all"]').textContent = `모든 사진 (${S.photos.length}장)`;
    $("#eWho").querySelector('[data-v="all"]').disabled = S.photos.length < 2; if (S.photos.length < 2) segSet("#eWho", exp.who = "one");
    store.set("tt-pe-export", exp);
  }
  $("#eFmt").onclick = e => { const b = e.target.closest("button"); if (b) { exp.fmt = b.dataset.v; syncExp(); } };
  $("#eWho").onclick = e => { const b = e.target.closest("button"); if (b && !b.disabled) { exp.who = b.dataset.v; syncExp(); } };
  $("#eQ").oninput = e => { exp.q = +e.target.value; $("#eQv").value = exp.q; store.set("tt-pe-export", exp); };
  $("#eQv").onchange = e => { exp.q = Math.max(60, Math.min(100, parseInt(e.target.value) || 92)); syncExp(); };
  $("#eSize").onchange = e => { exp.size = e.target.value; syncExp(); };
  $("#eExif").onchange = e => { exp.exif = e.target.checked; syncExp(); };
  $("#bExport").onclick = () => { pop.hidden = !pop.hidden; if (!pop.hidden) { syncExp(); est(""); $("#eBar").style.width = "0"; } };
  $("#eClose").onclick = () => pop.hidden = true;
  document.addEventListener("keydown", e => { if (e.key === "Escape") pop.hidden = true; });

  let exCanvas = null, exEng = null;
  async function render1(p) {
    exCanvas ||= document.createElement("canvas"); exEng ||= PE.create(exCanvas);
    const bmp = await createImageBitmap(p.file);
    const long = Math.max(bmp.width, bmp.height), cap = Math.min(exEng.maxTex, 8192);
    let tgt = +exp.size ? Math.min(+exp.size, long) : long, capped = false;
    if (tgt > cap) { tgt = cap; capped = true; }
    const s = tgt / long, cv = document.createElement("canvas");
    cv.width = Math.round(bmp.width * s); cv.height = Math.round(bmp.height * s);
    const g = cv.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(bmp, 0, 0, cv.width, cv.height); bmp.close();
    const v = eff(p.params);
    exEng.setImage(cv, [cv.width, cv.height]); exEng.setLut(v.lutOn ? luts[v.lutId] : null); exEng.render(v, 0);
    const mime = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" }[exp.fmt];
    let blob = await new Promise(r => exCanvas.toBlob(r, mime, exp.q / 100));
    if (!blob) throw new Error("blob");
    if (exp.fmt === "jpg" && exp.exif && /jpe?g/i.test(p.file.type)) blob = await withExif(blob, p.file);
    cv.width = cv.height = 0;
    return { blob, name: `${p.name}_보정.${exp.fmt}`, capped };
  }
  $("#eRun").onclick = async () => {
    const list = exp.who === "all" ? S.photos : [ph()];
    const btn = $("#eRun"); btn.disabled = true; const bar = $("#eBar"); bar.style.width = "4%";
    const out = []; let capped = false;
    try {
      for (let i = 0; i < list.length; i++) {
        est(`${i + 1} / ${list.length}장 저장하는 중…`);
        const r = await render1(list[i]); out.push(r); capped ||= r.capped;
        bar.style.width = ((i + 1) / list.length * 100) + "%";
        await new Promise(r => setTimeout(r, 0));
      }
      if (out.length === 1) TT.download(out[0].blob, out[0].name);
      else await TT.downloadZip(out.map(o => ({ blob: o.blob, name: o.name })), "보정한사진.zip");
      est(`저장했어요${capped ? " · 너무 커서 긴 변 8192px로 줄였어요" : ""}`, "ok");
    } catch { est("저장하지 못했어요. 크기를 줄여서 다시 해 보세요.", "err"); }
    btn.disabled = false;
  };

  // 원본 JPG의 촬영 정보(EXIF)를 결과에 옮겨요. 방향 값은 이미 돌려 놨으니 1로
  async function withExif(blob, file) {
    const src = new Uint8Array(await file.slice(0, 262144).arrayBuffer());
    if (src[0] !== 0xFF || src[1] !== 0xD8) return blob;
    let o = 2, seg = null;
    while (o + 4 < src.length && src[o] === 0xFF) {
      const m = src[o + 1], L = (src[o + 2] << 8) | src[o + 3];
      if (m === 0xE1 && String.fromCharCode(...src.slice(o + 4, o + 8)) === "Exif") { seg = src.slice(o, o + 2 + L); break; }
      if (m === 0xDA) break; o += 2 + L;
    }
    if (!seg) return blob;
    const T = 10, le = seg[T] === 0x49;
    const r16 = p => le ? seg[p] | (seg[p + 1] << 8) : (seg[p] << 8) | seg[p + 1];
    const r32 = p => le ? (seg[p] | (seg[p + 1] << 8) | (seg[p + 2] << 16) | (seg[p + 3] << 24)) >>> 0 : ((seg[p] << 24) | (seg[p + 1] << 16) | (seg[p + 2] << 8) | seg[p + 3]) >>> 0;
    const ifd = T + r32(T + 4);
    if (ifd + 2 < seg.length) {
      const n = r16(ifd);
      for (let i = 0; i < n; i++) { const e = ifd + 2 + i * 12; if (e + 12 > seg.length) break; if (r16(e) === 0x0112) { if (le) { seg[e + 8] = 1; seg[e + 9] = 0; } else { seg[e + 8] = 0; seg[e + 9] = 1; } } }
    }
    const out = new Uint8Array(await blob.arrayBuffer());
    let ins = 2; if (out[2] === 0xFF && out[3] === 0xE0) ins = 4 + ((out[4] << 8) | out[5]);
    return new Blob([out.slice(0, ins), seg, out.slice(ins)], { type: "image/jpeg" });
  }

  syncAll(); updBtns();
  window.__pe = { S, get P() { return P; }, select, eng };
})();
