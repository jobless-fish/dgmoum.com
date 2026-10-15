/* 사진 보정 기본값과 프리셋
   프리셋 값은 각 필름의 제조사 자료(입자 굵기, 대비, 색 경향)와
   카메라 필름 시뮬레이션의 널리 알려진 특징을 참고해 잡은 "비슷한 느낌"이에요.
   필름·카메라 이름은 각 회사의 상표이고, 도구모음은 해당 회사와 관계가 없어요. */
window.PE_DEFAULTS = {
  bw: false, lutOn: false, lutId: null, lutAmt: 100,
  temp: 0, tint: 0, exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0,
  texture: 0, clarity: 0, dehaze: 0, vibrance: 0, saturation: 0,
  curve: { rgb: [[0, 0], [255, 255]], r: [[0, 0], [255, 255]], g: [[0, 0], [255, 255]], b: [[0, 0], [255, 255]] },
  hue: [0, 0, 0, 0, 0, 0, 0, 0], sat: [0, 0, 0, 0, 0, 0, 0, 0], lum: [0, 0, 0, 0, 0, 0, 0, 0], mix: [0, 0, 0, 0, 0, 0, 0, 0],
  grade: { sh: [0, 0], mid: [0, 0], hi: [0, 0], blend: 50, balance: 0 },
  sharpen: 0, vignette: 0, vigMid: 50, vigFeather: 50, grain: 0, grainSize: 25, grainRough: 50, halation: 0
};
window.PE_COLORS = ["red", "orange", "yellow", "green", "aqua", "blue", "purple", "magenta"];

// 프리셋을 기본값 위에 얹어요. hsl: { green: [색조, 채도, 광도] }, mix: { red: 값 }
window.PE_apply = (p) => {
  const v = JSON.parse(JSON.stringify(PE_DEFAULTS));
  for (const [k, x] of Object.entries(p || {})) {
    if (k === "hsl") for (const [c, [h, s, l]] of Object.entries(x)) { const i = PE_COLORS.indexOf(c); v.hue[i] = h; v.sat[i] = s; v.lum[i] = l; }
    else if (k === "mixc") for (const [c, m] of Object.entries(x)) v.mix[PE_COLORS.indexOf(c)] = m;
    else if (k === "curve") Object.assign(v.curve, JSON.parse(JSON.stringify(x)));
    else if (k === "grade") Object.assign(v.grade, JSON.parse(JSON.stringify(x)));
    else v[k] = JSON.parse(JSON.stringify(x));
  }
  return v;
};

// 바랜 검정 (필름처럼 가장 어두운 곳이 살짝 뜨게)
const fade = (b, w = 255, s = 0) => [[0, b], [64, 64 - s + b * 0.3], [192, 192 + s], [255, w]];

window.PE_PRESETS = [
  { group: "컬러 필름", items: [
    { name: "Portra 400", note: "부드러운 대비, 따뜻하고 깨끗한 피부색, 고운 입자",
      v: { temp: 6, contrast: -18, highlights: -30, shadows: 18, whites: -8, vibrance: -5, saturation: -8,
        hsl: { red: [0, -5, 0], orange: [-4, -6, 6], yellow: [-12, -15, 0], green: [-25, -30, -5], aqua: [-10, -20, 0], blue: [-10, -15, 0] },
        grade: { sh: [195, 6], hi: [45, 10], blend: 60 }, curve: { rgb: fade(12, 248, 2) }, grain: 18, grainSize: 22, grainRough: 40 } },
    { name: "Portra 160", note: "더 부드럽고 차분한 색, 아주 고운 입자",
      v: { temp: 3, contrast: -22, highlights: -25, shadows: 15, saturation: -14, vibrance: -6,
        hsl: { orange: [-3, -8, 6], yellow: [-10, -20, 0], green: [-20, -35, 0], blue: [-8, -15, 0] },
        grade: { sh: [200, 5], hi: [40, 6] }, curve: { rgb: fade(10, 250) }, grain: 10, grainSize: 18, grainRough: 35 } },
    { name: "Ektar 100", note: "선명한 채도, 진한 빨강과 파랑, 아주 고운 입자",
      v: { contrast: 18, highlights: -15, shadows: 5, vibrance: 20, saturation: 12, clarity: 5,
        hsl: { red: [0, 18, -5], orange: [-5, 8, 0], yellow: [-5, 10, 0], green: [-10, 8, -5], blue: [-5, 18, -12] },
        curve: { rgb: [[0, 0], [64, 58], [192, 198], [255, 255]] }, grain: 8, grainSize: 15, grainRough: 30 } },
    { name: "Gold 200", note: "노란빛 도는 따뜻한 색, 여름 햇살 느낌",
      v: { temp: 16, tint: 3, contrast: 5, highlights: -15, shadows: 10, saturation: 4,
        hsl: { orange: [0, 10, 5], yellow: [-8, 18, 5], green: [-20, -10, 0], blue: [-5, -12, 0] },
        grade: { hi: [48, 14], sh: [30, 5] }, curve: { rgb: fade(8) }, grain: 24, grainSize: 28, grainRough: 50 } },
    { name: "ColorPlus 200", note: "바랜 듯 포근한 색, 굵은 입자",
      v: { temp: 12, contrast: -6, highlights: -12, shadows: 12, saturation: -6,
        hsl: { yellow: [-6, 5, 0], green: [-18, -15, 0], blue: [0, -18, 5] },
        grade: { sh: [35, 8], hi: [45, 10] }, curve: { rgb: fade(20, 245) }, grain: 30, grainSize: 32, grainRough: 60 } },
    { name: "UltraMax 400", note: "또렷한 대비와 진한 색, 일상 스냅",
      v: { temp: 7, contrast: 12, highlights: -15, shadows: 8, saturation: 10, vibrance: 6,
        hsl: { red: [0, 10, 0], yellow: [-5, 12, 0], blue: [-5, 5, -5] },
        grade: { hi: [45, 8] }, curve: { rgb: fade(6) }, grain: 28, grainSize: 30, grainRough: 55 } },
    { name: "Superia 400", note: "살짝 초록빛 그림자, 시원한 색",
      v: { temp: -5, tint: -6, contrast: 10, highlights: -12, shadows: 8, saturation: 4,
        hsl: { green: [10, 10, 0], aqua: [0, 5, 0], blue: [0, 5, -5], magenta: [0, -10, 0] },
        grade: { sh: [150, 12], hi: [55, 5] }, curve: { rgb: fade(8) }, grain: 28, grainSize: 30, grainRough: 55 } },
    { name: "Pro 400H", note: "밝고 산뜻한 파스텔, 민트빛 초록",
      v: { exposure: 0.15, temp: -3, contrast: -20, highlights: -22, shadows: 22, saturation: -10,
        hsl: { orange: [0, -5, 6], green: [20, -12, 5], aqua: [0, 5, 5], blue: [-10, -10, 0] },
        grade: { sh: [190, 10], hi: [60, 5] }, curve: { rgb: fade(12, 250) }, grain: 18, grainSize: 22, grainRough: 40 } },
    { name: "C200", note: "초록빛 도는 담백한 색, 굵은 입자",
      v: { temp: -6, tint: -8, contrast: 5, highlights: -10, shadows: 6,
        hsl: { green: [5, 5, 5], blue: [0, -5, 0], red: [0, -8, 0] },
        grade: { sh: [150, 10] }, curve: { rgb: fade(10) }, grain: 32, grainSize: 32, grainRough: 60 } },
    { name: "Velvia 50", note: "아주 진한 채도와 강한 대비, 풍경용",
      v: { temp: -3, contrast: 32, highlights: -20, blacks: -15, vibrance: 15, saturation: 25,
        hsl: { red: [0, 15, -5], green: [-5, 22, -8], blue: [-5, 22, -15], aqua: [0, 15, 0] },
        grade: { sh: [290, 8] }, curve: { rgb: [[0, 0], [64, 54], [192, 202], [255, 255]] }, grain: 5, grainSize: 12, grainRough: 25 } },
    { name: "Provia 100F", note: "깔끔하고 정확한 색, 중간 대비",
      v: { contrast: 14, highlights: -10, saturation: 8, hsl: { blue: [0, 6, -4] },
        curve: { rgb: [[0, 0], [64, 61], [192, 195], [255, 255]] }, grain: 5, grainSize: 12, grainRough: 25 } },
    { name: "Kodachrome 64", note: "깊은 빨강과 노랑, 진한 하늘, 묵직한 대비",
      v: { temp: 5, contrast: 25, highlights: -20, blacks: -10, saturation: 10,
        hsl: { red: [0, 20, -10], orange: [-3, 5, 0], yellow: [-10, 15, -5], green: [-10, -5, -5], blue: [-10, 10, -12] },
        grade: { sh: [215, 5], hi: [40, 6] }, curve: { rgb: [[0, 4], [64, 58], [192, 200], [255, 252]] }, grain: 10, grainSize: 15, grainRough: 30 } },
    { name: "Ektachrome E100", note: "맑고 시원한 파랑, 깨끗한 슬라이드 색",
      v: { temp: -5, contrast: 18, highlights: -12, saturation: 12, hsl: { blue: [-5, 20, -5], aqua: [0, 10, 0], green: [0, 5, 0] },
        curve: { rgb: [[0, 0], [64, 60], [192, 197], [255, 255]] }, grain: 6, grainSize: 12, grainRough: 25 } },
    { name: "CineStill 800T", note: "밤 조명용 텅스텐 필름, 푸른 빛과 붉은 번짐",
      v: { temp: -22, tint: 5, contrast: 10, highlights: -22, shadows: 10, saturation: 2,
        hsl: { red: [0, 10, 0], orange: [5, 5, 0], blue: [-5, 5, 0] },
        grade: { sh: [190, 20], hi: [30, 10] }, curve: { rgb: fade(8) }, halation: 40, grain: 35, grainSize: 32, grainRough: 60 } },
    { name: "CineStill 50D", note: "낮 촬영용 영화 필름, 깨끗하고 부드러운 번짐",
      v: { temp: 3, contrast: 10, highlights: -15, saturation: 5, hsl: { blue: [0, 5, 0] },
        curve: { rgb: fade(4) }, halation: 20, grain: 10, grainSize: 15, grainRough: 30 } }
  ] },
  { group: "흑백 필름", items: [
    { name: "Tri-X 400", note: "강한 대비, 거친 입자, 거리 사진의 정석",
      v: { bw: true, contrast: 35, whites: 10, blacks: -15, clarity: 10, mixc: { red: 10, orange: 5, yellow: 10, blue: -10 },
        curve: { rgb: [[0, 0], [64, 56], [192, 200], [255, 255]] }, grain: 45, grainSize: 30, grainRough: 60 } },
    { name: "HP5 Plus 400", note: "중간 대비, 넓은 계조, 부드러운 입자",
      v: { bw: true, contrast: 15, shadows: 10, highlights: -10, mixc: { red: 5, yellow: 5 }, grain: 38, grainSize: 30, grainRough: 50 } },
    { name: "T-MAX 100", note: "매끈한 계조, 아주 고운 입자",
      v: { bw: true, contrast: 10, clarity: 5, sharpen: 15, mixc: { orange: 5 }, grain: 10, grainSize: 14, grainRough: 25 } },
    { name: "Delta 3200", note: "아주 굵고 거친 입자, 밤의 분위기",
      v: { bw: true, contrast: 30, shadows: 15, blacks: -10, curve: { rgb: fade(6) }, grain: 70, grainSize: 45, grainRough: 75 } },
    { name: "Acros 100", note: "깊은 검정과 고운 입자, 하늘이 진하게",
      v: { bw: true, contrast: 18, blacks: -8, texture: 10, mixc: { red: 15, orange: 10, blue: -20, aqua: -10 }, grain: 12, grainSize: 15, grainRough: 30 } },
    { name: "Pan F Plus 50", note: "강한 대비, 거의 보이지 않는 입자",
      v: { bw: true, contrast: 25, blacks: -20, whites: 8, clarity: 8, grain: 5, grainSize: 10, grainRough: 20 } }
  ] },
  { group: "카메라 색감", items: [
    { name: "후지 클래식 크롬", note: "가라앉은 채도, 단단한 그림자, 다큐멘터리 느낌",
      v: { contrast: 8, highlights: -12, shadows: -12, blacks: -8, saturation: -20,
        hsl: { red: [0, -10, 0], orange: [0, -5, 0], green: [-10, -25, -5], blue: [-8, -15, -15], aqua: [0, -10, 0] },
        grade: { sh: [200, 10], hi: [50, 5] }, curve: { rgb: [[0, 0], [64, 58], [192, 196], [255, 252]] } } },
    { name: "후지 클래식 네거티브", note: "단단한 대비, 시안빛 그림자와 노란빛 하이라이트",
      v: { temp: -3, contrast: 15, highlights: -10, saturation: -10,
        hsl: { red: [5, 5, -5], green: [15, -10, 0], blue: [0, -10, 0] },
        grade: { sh: [180, 15], hi: [60, 10], blend: 40 }, curve: { rgb: [[0, 6], [64, 58], [192, 198], [255, 250]] } } },
    { name: "후지 이터나", note: "영화 같은 낮은 대비와 차분한 색",
      v: { contrast: -30, highlights: -20, shadows: 25, saturation: -25,
        hsl: { orange: [0, 5, 0], green: [5, -15, 0], blue: [0, -10, 0] },
        grade: { sh: [190, 8], hi: [40, 4] }, curve: { rgb: fade(10, 250) } } },
    { name: "후지 노스탤직 네거티브", note: "호박빛 하이라이트, 포근한 옛날 사진 느낌",
      v: { temp: 10, contrast: -10, shadows: 15, saturation: -5,
        hsl: { orange: [0, 5, 5], yellow: [-5, 5, 0], blue: [0, -10, 0] },
        grade: { hi: [40, 20], sh: [210, 5] }, curve: { rgb: fade(8) } } },
    { name: "후지 아스티아", note: "부드러운 대비, 고운 피부색",
      v: { contrast: -10, highlights: -10, shadows: 8, saturation: 4, hsl: { orange: [0, -3, 6], blue: [0, 5, 0] } } },
    { name: "리코 GR 포지티브 필름", note: "진하고 따뜻한 색, 강한 대비",
      v: { temp: 5, contrast: 20, highlights: -10, saturation: 15,
        hsl: { red: [0, 10, 0], yellow: [-5, 15, 0], blue: [-10, 5, -5] }, vignette: -10 } },
    { name: "리코 GR 하이 콘트라스트 흑백", note: "거친 입자와 아주 강한 대비",
      v: { bw: true, contrast: 60, whites: 20, blacks: -30, clarity: 20, vignette: -25, grain: 40, grainSize: 25, grainRough: 70 } },
    { name: "라이카 클래식", note: "차분하고 따뜻한 색, 은은한 비네팅",
      v: { temp: 5, contrast: 10, highlights: -10, saturation: -5, vignette: -15, vigMid: 40,
        grade: { hi: [45, 6] }, curve: { rgb: fade(4) } } },
    { name: "라이카 모노크롬", note: "넓은 계조의 맑은 흑백",
      v: { bw: true, contrast: 20, shadows: 10, highlights: -10, clarity: 10, mixc: { red: 5, yellow: 5 }, grain: 8, grainSize: 12, grainRough: 25 } },
    { name: "핫셀블라드 내추럴", note: "있는 그대로의 자연스러운 색과 피부",
      v: { contrast: 5, highlights: -8, shadows: 5, saturation: 5, hsl: { orange: [0, -3, 3] } } }
  ] }
];
