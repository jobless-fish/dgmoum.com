/* 사진 보정 엔진
   WebGL2로 모든 보정을 한 번에 그려요. 원본은 그대로 두고, 슬라이더 값만 바꿔 다시 그려요.
   - 원본을 흐리게 만든 두 장(중간·크게)은 사진을 바꿀 때 한 번만 만들어 두고
     부분 대비(명료도·텍스처)와 밝은·어두운 영역 판단에 써요. */
window.PE = (() => {
  const VS = `#version 300 es
in vec2 p; out vec2 vUv;
void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

  const COPY = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D t; uniform float lod;
void main(){ o = textureLod(t, vUv, lod); }`;

  const BLUR = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D t; uniform vec2 d;
const float w[5] = float[](0.2270270270, 0.1945945946, 0.1216216216, 0.0540540541, 0.0162162162);
void main(){ vec4 c = texture(t, vUv) * w[0];
  for (int i = 1; i < 5; i++) { c += texture(t, vUv + d * float(i)) * w[i]; c += texture(t, vUv - d * float(i)) * w[i]; }
  o = c; }`;

  const MAIN = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uSrc, uBM, uBL, uCurve;
uniform highp sampler3D uLut;
uniform float uLutOn, uLutAmt, uLutN;
uniform vec2 uTexel, uSize;
uniform vec3 uWB;
uniform float uExp, uCon, uHi, uSh, uWh, uBl, uTex, uClar, uHaze, uVib, uSat;
uniform float uH[8], uS[8], uL[8], uMix[8];
uniform float uBW;
uniform vec3 uGS, uGM, uGH;
uniform float uBal, uBlend;
uniform float uSharp, uVig, uVigMid, uVigF, uGrain, uGSize, uGRough, uHal;
uniform float uSplit;

vec3 lin(vec3 c){ return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c)); }
vec3 gam(vec3 c){ c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
float Y(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 rgb2hsv(vec3 c){
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y), e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
vec3 hsv2rgb(vec3 c){ vec3 p = abs(fract(c.xxx + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0); return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y); }
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
// 라이트룸과 같은 8가지 색 (빨강 주황 노랑 초록 아쿠아 파랑 보라 마젠타)
const float HC[8] = float[](0.0, 30.0, 60.0, 120.0, 180.0, 240.0, 280.0, 320.0);
float bandW(float h, int i){
  float c = HC[i], pv = HC[(i + 7) % 8], nx = HC[(i + 1) % 8];
  float wl = mod(c - pv + 360.0, 360.0), wr = mod(nx - c + 360.0, 360.0);
  float d = mod(h - c + 540.0, 360.0) - 180.0;
  return d < 0.0 ? max(0.0, 1.0 + d / wl) : max(0.0, 1.0 - d / wr);
}
float curveAt(float x, int ch){ vec4 v = texture(uCurve, vec2(clamp(x, 0.0, 1.0) * (1023.0 / 1024.0) + 0.5 / 1024.0, 0.5)); return ch == 0 ? v.r : ch == 1 ? v.g : v.b; }

void main(){
  vec3 s0 = texture(uSrc, vUv).rgb;
  if (vUv.x < uSplit) { o = vec4(s0, 1.0); return; }

  // 선명하게 (언샤프 마스크)
  vec3 nb = (texture(uSrc, vUv + vec2(uTexel.x, 0.0)).rgb + texture(uSrc, vUv - vec2(uTexel.x, 0.0)).rgb
           + texture(uSrc, vUv + vec2(0.0, uTexel.y)).rgb + texture(uSrc, vUv - vec2(0.0, uTexel.y)).rgb) * 0.25;
  vec3 s = clamp(s0 + uSharp * 1.6 * (s0 - nb), 0.0, 1.0);

  vec3 bm = texture(uBM, vUv).rgb, bl = texture(uBL, vUv).rgb;
  float Ls = Y(s0), Lm = Y(bm), Ll = Y(bl);
  float ev = exp2(uExp);

  // 흰색 균형 · 노출 (빛의 양으로 계산)
  vec3 c = lin(s) * uWB * ev;

  // 디헤이즈: 넓은 영역의 가장 어두운 색을 뿌연 정도로 보고 빼요
  float haze = Y(lin(vec3(min(bl.r, min(bl.g, bl.b))))) * ev;
  if (uHaze > 0.0) { float t = clamp(uHaze * 0.9 * haze, 0.0, 0.8); c = max(c - t, 0.0) / (1.0 - t); }
  else if (uHaze < 0.0) { c = mix(c, vec3(Y(c) * 0.6 + 0.25), -uHaze * 0.45); }

  vec3 g = gam(c);
  float L = Y(g);
  float Lb = Y(gam(lin(bl) * uWB * ev));
  float Lmask = mix(L, Lb, 0.55);
  float ms = 1.0 - smoothstep(0.02, 0.6, Lmask);
  float mh = smoothstep(0.4, 1.0, Lmask);

  // 밝은 영역 · 어두운 영역
  float L2 = L * exp2(uSh * 1.4 * ms) * exp2(uHi * 1.1 * mh);
  // 흰색 계열 · 검정 계열 (양 끝점)
  float bp = -uBl * 0.12, wp = 1.0 - uWh * 0.22;
  L2 = (L2 - bp) / (wp - bp);
  // 대비 (가운데를 기준으로 S자)
  float Lc = clamp(L2, 0.0, 1.0);
  L2 += -uCon * 0.6 * sin(6.2831853 * Lc) / 6.2831853;
  // 명료도 · 텍스처 (원본의 부분 대비를 더해요)
  float mid = 1.0 - pow(abs(2.0 * Lc - 1.0), 2.0);
  L2 += uClar * 1.1 * (Ls - Ll) * (0.3 + 0.7 * mid) + uTex * 1.4 * (Ls - Lm) * (0.4 + 0.6 * mid);
  L2 = max(L2, 0.0);
  g = L > 1.0e-4 ? g * (L2 / L) : vec3(L2);
  if (uHaze > 0.0) g = mix(vec3(Y(g)), g, 1.0 + uHaze * 0.25);

  // 넘친 밝은 곳은 하얗게 부드럽게
  float mx = max(g.r, max(g.g, g.b));
  if (mx > 1.0) g = mix(g / mx, vec3(1.0), clamp((mx - 1.0) * 0.6, 0.0, 1.0));
  g = clamp(g, 0.0, 1.0);

  vec3 hsv = rgb2hsv(g); float hd = hsv.x * 360.0;
  float Lg = Y(g);
  if (uBW > 0.5) {
    // 흑백 혼합: 원래 색에 따라 밝기를 바꿔요
    float k = 0.0; for (int i = 0; i < 8; i++) k += bandW(hd, i) * uMix[i];
    g = vec3(clamp(Lg * (1.0 + k * 0.7 * hsv.y), 0.0, 1.0));
  } else {
    // 생동감(피부색은 덜) · 채도
    float skin = exp(-pow((hd - 25.0) / 22.0, 2.0));
    float amt = uVib * (1.0 - hsv.y) * (1.0 - 0.6 * skin * step(0.0, uVib)) + uSat;
    g = clamp(mix(vec3(Lg), g, 1.0 + amt), 0.0, 1.0);
    // 색상별 조절 (HSL)
    hsv = rgb2hsv(g); hd = hsv.x * 360.0;
    float dh = 0.0, ds = 0.0, dl = 0.0;
    for (int i = 0; i < 8; i++) { float w = bandW(hd, i); dh += w * uH[i]; ds += w * uS[i]; dl += w * uL[i]; }
    hsv.x = fract(hsv.x + dh * 30.0 / 360.0 + 1.0);
    hsv.y = clamp(hsv.y * (1.0 + ds), 0.0, 1.0);
    g = hsv2rgb(hsv) * (1.0 + dl * 0.45 * hsv.y);
  }

  // 색 보정 (어두운 · 중간 · 밝은 영역에 색을 얹어요)
  Lg = Y(g);
  float m = clamp(0.5 - uBal * 0.3, 0.15, 0.85);
  float wS = pow(clamp(1.0 - Lg / m, 0.0, 1.0), 1.5 - uBlend);
  float wH = pow(clamp((Lg - m) / (1.0 - m), 0.0, 1.0), 1.5 - uBlend);
  float wM = clamp(1.0 - wS - wH, 0.0, 1.0);
  g += wS * uGS + wM * uGM + wH * uGH;

  // 톤 곡선
  g = clamp(g, 0.0, 1.0);
  g = vec3(curveAt(g.r, 0), curveAt(g.g, 1), curveAt(g.b, 2));

  // LUT (프로필)
  if (uLutOn > 0.5) { vec3 lc = g * ((uLutN - 1.0) / uLutN) + 0.5 / uLutN; g = mix(g, texture(uLut, lc).rgb, uLutAmt); }

  // 할레이션: 밝은 곳 둘레가 붉게 번져요
  if (uHal > 0.0) { float hl = smoothstep(0.6, 1.0, Lb); g += uHal * hl * vec3(0.55, 0.12, 0.04) * (1.0 - Y(g) * 0.5); }

  // 비네팅
  if (uVig != 0.0) {
    float d = length((vUv - 0.5) * 2.0) / 1.41421;
    float mv = smoothstep(uVigMid, uVigMid + uVigF, d);
    g = uVig < 0.0 ? g * (1.0 + uVig * mv) : mix(g, vec3(1.0), uVig * mv);
  }

  // 그레인 (사진 크기에 맞춰 같은 굵기로)
  if (uGrain > 0.0) {
    vec2 gp = vUv * uSize / max(uSize.x, uSize.y) * 1400.0 / (0.6 + uGSize * 3.0);
    float n1 = vnoise(gp), n2 = vnoise(gp * 2.7 + 13.1);
    float n = mix(n1, n1 * 0.5 + n2 * 0.5 + (n2 - 0.5) * 0.4, uGRough) - 0.5;
    float mid2 = 1.0 - pow(abs(2.0 * Y(g) - 1.0), 2.0);
    g += n * uGrain * 0.22 * (0.35 + 0.65 * mid2);
  }
  o = vec4(clamp(g, 0.0, 1.0), 1.0);
}`;

  /* ---------- 값 계산 도우미 ---------- */
  // 단조 3차 곡선 (점 사이를 튀지 않게 이어요). pts: [[x,y]...] 0~255
  function spline(pts, N = 1024) {
    const p = pts.slice().sort((a, b) => a[0] - b[0]).map(([x, y]) => [x / 255, y / 255]);
    const out = new Float32Array(N);
    if (p.length < 2) { for (let i = 0; i < N; i++) out[i] = i / (N - 1); return out; }
    const n = p.length, dx = [], dy = [], m = [], t = [];
    for (let i = 0; i < n - 1; i++) { dx[i] = Math.max(1e-6, p[i + 1][0] - p[i][0]); dy[i] = p[i + 1][1] - p[i][1]; m[i] = dy[i] / dx[i]; }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = t[i + 1] = 0; continue; }
      const a = t[i] / m[i], b = t[i + 1] / m[i], h = Math.hypot(a, b);
      if (h > 3) { t[i] = 3 * a / h * m[i]; t[i + 1] = 3 * b / h * m[i]; }
    }
    let k = 0;
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1);
      if (x <= p[0][0]) { out[i] = p[0][1]; continue; }
      if (x >= p[n - 1][0]) { out[i] = p[n - 1][1]; continue; }
      while (k < n - 2 && x > p[k + 1][0]) k++;
      const h = dx[k], s = (x - p[k][0]) / h, s2 = s * s, s3 = s2 * s;
      out[i] = Math.min(1, Math.max(0, (2 * s3 - 3 * s2 + 1) * p[k][1] + (s3 - 2 * s2 + s) * h * t[k] + (-2 * s3 + 3 * s2) * p[k + 1][1] + (s3 - s2) * h * t[k + 1]));
    }
    return out;
  }
  function curveData(cv) {
    const N = 1024, all = spline(cv.rgb, N), ch = [spline(cv.r, N), spline(cv.g, N), spline(cv.b, N)];
    const d = new Float32Array(N * 4);
    const at = (a, x) => { const f = x * (N - 1), i = Math.floor(f), r = f - i; return i >= N - 1 ? a[N - 1] : a[i] * (1 - r) + a[i + 1] * r; };
    for (let i = 0; i < N; i++) { const v = all[i]; for (let c = 0; c < 3; c++) d[i * 4 + c] = at(ch[c], v); d[i * 4 + 3] = 1; }
    return d;
  }
  const hsl2rgb = (h, s, l) => { const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0), f(8), f(4)]; };
  // 색 보정 원: 색상·채도 → 더할 색 (밝기는 그대로)
  function gradeVec([h, s]) {
    if (!s) return [0, 0, 0];
    const c = hsl2rgb(h, 1, 0.5), y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return c.map(v => (v - y) * s / 100 * 0.22);
  }
  function wb(temp, tint) {
    const t = temp / 100, u = tint / 100;
    let r = 1 + 0.32 * t, g = 1, b = 1 - 0.32 * t;
    g *= 1 - 0.25 * u; r *= 1 + 0.12 * u; b *= 1 + 0.12 * u;
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return [r / y, g / y, b / y];
  }

  /* ---------- 엔진 ---------- */
  function create(canvas) {
    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return null;
    gl.getExtension("EXT_color_buffer_float");
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const prog = (fs) => {
      const p = gl.createProgram();
      for (const [type, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]]) {
        const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        gl.attachShader(p, s);
      }
      gl.bindAttribLocation(p, 0, "p"); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, ""); u[name] = gl.getUniformLocation(p, name); }
      return { p, u };
    };
    const P = { copy: prog(COPY), blur: prog(BLUR), main: prog(MAIN) };
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const tex = (w, h, { mip = false, data = null, fmt = "rgba8" } = {}) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      if (fmt === "f16") gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.FLOAT, data);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    const fbo = (t) => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return f; };
    const target = (w, h) => { const t = tex(w, h); return { t, f: fbo(t), w, h }; };
    const del = (r) => { if (!r) return; gl.deleteTexture(r.t); gl.deleteFramebuffer(r.f); };

    let src = null, W = 0, H = 0, full = [0, 0], bmA, bmB, blA, blB, hist;
    const curveTex = tex(1024, 1, { fmt: "f16", data: curveData({ rgb: [[0, 0], [255, 255]], r: [[0, 0], [255, 255]], g: [[0, 0], [255, 255]], b: [[0, 0], [255, 255]] }) });
    let curveKey = "";
    let lutTex = gl.createTexture(), lutN = 2, lutKey = null;
    gl.bindTexture(gl.TEXTURE_3D, lutTex);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA16F, 2, 2, 2, 0, gl.RGBA, gl.FLOAT, new Float32Array(32));
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_3D, k, gl.LINEAR));
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T, gl.TEXTURE_WRAP_R].forEach(k => gl.texParameteri(gl.TEXTURE_3D, k, gl.CLAMP_TO_EDGE));

    const draw = (pr, out, w, h) => { gl.useProgram(pr.p); gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.f : null); gl.viewport(0, 0, w, h); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
    const blurPass = (a, b, spread) => {
      gl.useProgram(P.blur.p); gl.uniform1i(P.blur.u.t, 0); gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, a.t); gl.uniform2f(P.blur.u.d, spread / a.w, 0); draw(P.blur, b, b.w, b.h);
      gl.bindTexture(gl.TEXTURE_2D, b.t); gl.uniform2f(P.blur.u.d, 0, spread / b.h); draw(P.blur, a, a.w, a.h);
    };

    // 사진 올리기 (canvas). fullSize: 실제 사진 크기 (그레인 굵기 기준)
    function setImage(cv, fullSize) {
      W = cv.width; H = cv.height; full = fullSize || [W, H];
      canvas.width = W; canvas.height = H;
      if (src) gl.deleteTexture(src);
      [bmA, bmB, blA, blB, hist].forEach(del);
      src = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, src);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // 흐린 사진 두 장 (긴 변 640 · 160 기준이라 화면용·저장용 결과가 같아요)
      const long = Math.max(W, H), sz = L => [Math.max(1, Math.round(W / long * L)), Math.max(1, Math.round(H / long * L))];
      const [mw, mh] = sz(640), [lw, lh] = sz(160);
      bmA = target(mw, mh); bmB = target(mw, mh); blA = target(lw, lh); blB = target(lw, lh);
      gl.useProgram(P.copy.p); gl.uniform1i(P.copy.u.t, 0); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src);
      gl.uniform1f(P.copy.u.lod, Math.max(0, Math.log2(long / 640))); draw(P.copy, bmA, mw, mh);
      blurPass(bmA, bmB, 1.3); blurPass(bmA, bmB, 1.3);
      gl.useProgram(P.copy.p); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, bmA.t); gl.uniform1f(P.copy.u.lod, 0);
      draw(P.copy, blA, lw, lh);
      blurPass(blA, blB, 1.6); blurPass(blA, blB, 1.6); blurPass(blA, blB, 1.6);
      const hs = sz(256); hist = target(hs[0], hs[1]);
    }

    function setLut(lut) {
      if (!lut) { lutKey = null; return; }
      if (lutKey === lut.id) return;
      lutKey = lut.id; lutN = lut.n;
      gl.bindTexture(gl.TEXTURE_3D, lutTex);
      gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA16F, lut.n, lut.n, lut.n, 0, gl.RGBA, gl.FLOAT, lut.data);
    }

    function uniforms(v, split) {
      const u = P.main.u; gl.useProgram(P.main.p);
      const ck = JSON.stringify(v.curve);
      if (ck !== curveKey) { curveKey = ck; gl.bindTexture(gl.TEXTURE_2D, curveTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, 1024, 1, 0, gl.RGBA, gl.FLOAT, curveData(v.curve)); }
      [[src, 0, "uSrc"], [bmA.t, 1, "uBM"], [blA.t, 2, "uBL"], [curveTex, 3, "uCurve"]].forEach(([t, i, n]) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(u[n], i); });
      gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_3D, lutTex); gl.uniform1i(u.uLut, 4);
      gl.uniform1f(u.uLutOn, v.lutOn ? 1 : 0); gl.uniform1f(u.uLutAmt, (v.lutAmt ?? 100) / 100); gl.uniform1f(u.uLutN, lutN);
      gl.uniform2f(u.uTexel, 1 / W, 1 / H); gl.uniform2f(u.uSize, full[0], full[1]);
      gl.uniform3fv(u.uWB, wb(v.temp, v.tint));
      const f = (n, x) => gl.uniform1f(u[n], x);
      f("uExp", v.exposure); f("uCon", v.contrast / 100); f("uHi", v.highlights / 100); f("uSh", v.shadows / 100);
      f("uWh", v.whites / 100); f("uBl", v.blacks / 100); f("uTex", v.texture / 100); f("uClar", v.clarity / 100);
      f("uHaze", v.dehaze / 100); f("uVib", v.vibrance / 100); f("uSat", v.saturation / 100);
      gl.uniform1fv(u.uH, v.hue.map(x => x / 100)); gl.uniform1fv(u.uS, v.sat.map(x => x / 100));
      gl.uniform1fv(u.uL, v.lum.map(x => x / 100)); gl.uniform1fv(u.uMix, v.mix.map(x => x / 100));
      f("uBW", v.bw ? 1 : 0);
      gl.uniform3fv(u.uGS, gradeVec(v.grade.sh)); gl.uniform3fv(u.uGM, gradeVec(v.grade.mid)); gl.uniform3fv(u.uGH, gradeVec(v.grade.hi));
      f("uBal", v.grade.balance / 100); f("uBlend", v.grade.blend / 100);
      f("uSharp", v.sharpen / 100); f("uVig", v.vignette / 100);
      f("uVigMid", 0.1 + v.vigMid / 100 * 0.75); f("uVigF", 0.05 + v.vigFeather / 100 * 0.85);
      f("uGrain", v.grain / 100); f("uGSize", v.grainSize / 100); f("uGRough", v.grainRough / 100); f("uHal", v.halation / 100);
      f("uSplit", split);
    }

    // split: 0 = 모두 보정, 1 = 모두 원본, 그 사이 = 왼쪽은 원본
    function render(v, split = 0) { if (!src) return; uniforms(v, split); draw(P.main, null, W, H); }
    // 히스토그램 (작게 그려서 셉니다)
    function histogram(v) {
      if (!src) return null;
      uniforms(v, 0); draw(P.main, hist, hist.w, hist.h);
      const px = new Uint8Array(hist.w * hist.h * 4); gl.readPixels(0, 0, hist.w, hist.h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const r = new Uint32Array(256), g = new Uint32Array(256), b = new Uint32Array(256), l = new Uint32Array(256);
      for (let i = 0; i < px.length; i += 4) { r[px[i]]++; g[px[i + 1]]++; b[px[i + 2]]++; l[Math.round(px[i] * 0.2126 + px[i + 1] * 0.7152 + px[i + 2] * 0.0722)]++; }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { r, g, b, l, n: hist.w * hist.h };
    }
    return { gl, maxTex, setImage, setLut, render, histogram, get size() { return [W, H]; } };
  }

  // .cube LUT 읽기
  function parseCube(text, name) {
    let n = 0; const vals = [];
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim(); if (!line || line[0] === "#") continue;
      const m = line.match(/^LUT_3D_SIZE\s+(\d+)/i); if (m) { n = +m[1]; continue; }
      if (/^[A-Z_]/i.test(line)) continue;
      const p = line.split(/\s+/).map(Number); if (p.length >= 3 && p.every(isFinite)) vals.push(p[0], p[1], p[2]);
    }
    if (!n || vals.length < n * n * n * 3) throw new Error("cube");
    const data = new Float32Array(n * n * n * 4);
    for (let i = 0; i < n * n * n; i++) { data[i * 4] = vals[i * 3]; data[i * 4 + 1] = vals[i * 3 + 1]; data[i * 4 + 2] = vals[i * 3 + 2]; data[i * 4 + 3] = 1; }
    return { id: name + ":" + n + ":" + vals.length, name, n, data };
  }

  return { create, parseCube, spline };
})();
