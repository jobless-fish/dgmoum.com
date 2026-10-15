/* 도구모음 공용 오디오 함수 — 읽기, MP3·WAV 저장, 소리 크기 측정, 파형 그리기
   MP3 저장에는 페이지에 lamejs가 먼저 로드돼 있어야 해요. */
window.TA = (() => {
  const yieldUI = () => new Promise(r => setTimeout(r, 0));
  const db = x => 20 * Math.log10(Math.max(x, 1e-9));

  // 어떤 파일이든 44.1kHz로 풀어요 (MP3로 저장할 수 있는 샘플레이트)
  async function decode(file, rate = 44100) {
    const buf = await file.arrayBuffer();
    const C = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const ctx = new C(2, 1, rate);
    return await new Promise((res, rej) => {
      const p = ctx.decodeAudioData(buf, res, rej);
      if (p && p.then) p.then(res, rej);
    });
  }
  const chans = b => Array.from({ length: b.numberOfChannels }, (_, i) => b.getChannelData(i));
  function mono(chs) {
    if (chs.length === 1) return chs;
    const n = chs[0].length, m = new Float32Array(n);
    for (const d of chs) for (let i = 0; i < n; i++) m[i] += d[i] / chs.length;
    return [m];
  }
  // 3채널 이상은 2채널로 섞어요
  function upTo2(chs) {
    if (chs.length <= 2) return chs;
    const n = chs[0].length, L = new Float32Array(n), R = new Float32Array(n);
    const half = Math.ceil(chs.length / 2);
    chs.forEach((d, c) => { const t = c % 2 ? R : L; for (let i = 0; i < n; i++) t[i] += d[i] / half; });
    return [L, R];
  }
  function i16(d) {
    const o = new Int16Array(d.length);
    for (let i = 0; i < d.length; i++) { const s = Math.max(-1, Math.min(1, d[i])); o[i] = s < 0 ? s * 0x8000 : s * 0x7fff; }
    return o;
  }
  function wav(chs, sr) {
    chs = upTo2(chs);
    const nc = chs.length, n = chs[0].length, bytes = n * nc * 2;
    const ab = new ArrayBuffer(44 + bytes), v = new DataView(ab);
    const w = (o, s) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
    w(0, "RIFF"); v.setUint32(4, 36 + bytes, true); w(8, "WAVE"); w(12, "fmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nc, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * nc * 2, true); v.setUint16(32, nc * 2, true); v.setUint16(34, 16, true);
    w(36, "data"); v.setUint32(40, bytes, true);
    const ints = chs.map(i16);
    let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) { v.setInt16(o, ints[c][i], true); o += 2; }
    return new Blob([ab], { type: "audio/wav" });
  }
  async function mp3(chs, sr, kbps = 192, onProg) {
    if (!window.lamejs) throw new Error("mp3-lib");
    chs = upTo2(chs);
    const L = i16(chs[0]), R = chs.length > 1 ? i16(chs[1]) : null;
    const enc = new lamejs.Mp3Encoder(R ? 2 : 1, sr, kbps);
    const parts = [], step = 1152 * 40;
    for (let i = 0; i < L.length; i += step) {
      const l = L.subarray(i, i + step);
      const out = R ? enc.encodeBuffer(l, R.subarray(i, i + step)) : enc.encodeBuffer(l);
      if (out.length) parts.push(new Uint8Array(out));
      if ((i / step) % 20 === 0) { onProg && onProg(i / L.length); await yieldUI(); }
    }
    const end = enc.flush(); if (end.length) parts.push(new Uint8Array(end));
    onProg && onProg(1);
    return new Blob(parts, { type: "audio/mpeg" });
  }
  const encode = (chs, sr, fmt, kbps, onProg) => fmt === "mp3" ? mp3(chs, sr, kbps, onProg) : Promise.resolve(wav(chs, sr));
  const ext = fmt => fmt === "mp3" ? "mp3" : "wav";

  function peak(chs) { let p = 0; for (const d of chs) for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > p) p = a; } return p; }

  // 사람 귀 기준 소리 크기 (ITU-R BS.1770, LUFS)
  function loudness(chs, sr) {
    const biquad = (x, b0, b1, b2, a1, a2) => {
      const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
      return y;
    };
    let K = Math.tan(Math.PI * 1681.974450955533 / sr), Q = 0.7071752369554196;
    const Vh = Math.pow(10, 3.999843853973347 / 20), Vb = Math.pow(Vh, 0.4996667741545416);
    let a0 = 1 + K / Q + K * K;
    const s1 = [(Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0];
    K = Math.tan(Math.PI * 38.13547087602444 / sr); Q = 0.5003270373238773; a0 = 1 + K / Q + K * K;
    const s2 = [1, -2, 1, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0];
    const w = upTo2(chs).map(d => biquad(biquad(d, ...s1), ...s2));
    const block = Math.round(sr * 0.4), hop = Math.round(sr * 0.1), n = w[0].length;
    const z = [];
    for (let s = 0; s + block <= n; s += hop) {
      let sum = 0;
      for (const d of w) { let ms = 0; for (let i = s; i < s + block; i++) ms += d[i] * d[i]; sum += ms / block; }
      z.push(sum);
    }
    if (!z.length) return -Infinity;
    const L = v => -0.691 + 10 * Math.log10(v);
    const abs = z.filter(v => L(v) > -70);
    if (!abs.length) return -Infinity;
    const rel = L(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
    const g = abs.filter(v => L(v) > rel);
    return L(g.reduce((a, b) => a + b, 0) / g.length);
  }

  // 큰 소리만 살짝 눌러서 깨지지 않게 (앞을 미리 보는 리미터)
  function applyGain(chs, sr, gainDb, { limit = true, ceilDb = -1 } = {}) {
    const G = Math.pow(10, gainDb / 20), C = Math.pow(10, ceilDb / 20), n = chs[0].length;
    const out = chs.map(() => new Float32Array(n));
    if (!limit) { chs.forEach((d, c) => { for (let i = 0; i < n; i++) out[c][i] = Math.max(-C, Math.min(C, d[i] * G)); }); return out; }
    const look = Math.max(1, Math.round(sr * 0.005)), rel = 1 - Math.exp(-1 / (sr * 0.12)), att = 1 - Math.exp(-1 / look);
    const req = new Float32Array(n);
    for (let i = 0; i < n; i++) { let m = 0; for (const d of chs) { const a = Math.abs(d[i]); if (a > m) m = a; } req[i] = m * G > C ? C / (m * G) : 1; }
    // 앞으로 look만큼 중 가장 작은 값 (밀려오는 창의 최솟값)
    const win = new Float32Array(n), dq = new Int32Array(n); let h = 0, t = 0;
    for (let i = n - 1; i >= 0; i--) {
      while (t > h && req[dq[t - 1]] >= req[i]) t--;
      dq[t++] = i;
      while (dq[h] > i + look) h++;
      win[i] = req[dq[h]];
    }
    let env = 1;
    for (let i = 0; i < n; i++) {
      const target = win[i];
      env += (target - env) * (target < env ? att : rel);
      const g = G * Math.min(env, 1);
      for (let c = 0; c < chs.length; c++) out[c][i] = Math.max(-C, Math.min(C, chs[c][i] * g));
    }
    return out;
  }

  // 파형 그리기. regions: [{s, e, color}] (초 단위)
  function drawWave(canvas, chs, sr, { color = "#6a4cc3", dim = "rgba(127,127,127,.5)", regions = [] } = {}) {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
    const g = canvas.getContext("2d"), W = canvas.width, H = canvas.height, n = chs[0].length, dur = n / sr;
    g.clearRect(0, 0, W, H);
    for (const rg of regions) { g.fillStyle = rg.color; g.fillRect(rg.s / dur * W, 0, Math.max(1, (rg.e - rg.s) / dur * W), H); }
    const step = n / W, mid = H / 2;
    for (let x = 0; x < W; x++) {
      const a = Math.floor(x * step), b = Math.min(n, Math.floor((x + 1) * step));
      let mn = 0, mx = 0; const inc = Math.max(1, Math.floor((b - a) / 300));
      for (let i = a; i < b; i += inc) { let s = 0; for (const d of chs) s += d[i]; s /= chs.length; if (s < mn) mn = s; if (s > mx) mx = s; }
      const t = x / W * dur;
      g.fillStyle = regions.some(rg => t >= rg.s && t < rg.e) ? dim : color;
      const y1 = mid - mx * mid * 0.95, y2 = mid - mn * mid * 0.95;
      g.fillRect(x, y1, 1, Math.max(1, y2 - y1));
    }
  }

  // 미리 듣기 (한 번에 하나만)
  let actx = null, cur = null;
  function play(chs, sr, onEnd) {
    stop();
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    actx.resume();
    const b = actx.createBuffer(chs.length, chs[0].length, sr);
    chs.forEach((d, i) => b.copyToChannel(d, i));
    const s = actx.createBufferSource(); s.buffer = b; s.connect(actx.destination);
    s.onended = () => { if (cur === s) { cur = null; onEnd && onEnd(); } };
    s.start(); cur = s;
  }
  function stop() { if (cur) { const s = cur; cur = null; try { s.stop(); } catch {} } }

  return { decode, chans, mono, wav, mp3, encode, ext, peak, loudness, applyGain, drawWave, play, stop, db, yieldUI };
})();
