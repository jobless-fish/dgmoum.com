/* 도구모음 공용 스크립트 — 툴 목록, 아이콘, 다운로드·드롭존 같은 공용 함수 */

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
  { id: "photo-edit", cat: "img", name: "사진 보정 (라이트룸처럼)", desc: "노출·색온도·톤 곡선·색상별 보정·그레인까지. Portra·Tri-X 같은 필름 느낌 프리셋, LUT, 여러 장 한 번에.", tags: ["사진 보정", "라이트룸", "lightroom", "필터", "프리셋", "필름", "색감", "보정", "lut", "포트라"], status: "live" },
  { id: "pixel-art", cat: "img", name: "도트 아트 (8비트 · 16비트)", desc: "사진을 옛날 게임 같은 도트 그림으로. 패미컴·슈퍼패미컴·게임보이·PICO-8 색, 색 수 직접, 디더링.", tags: ["도트", "픽셀아트", "pixel art", "8비트", "16비트", "8bit", "레트로", "게임보이", "도트화"], status: "live" },
  { id: "ascii-art", cat: "img", name: "아스키 아트 만들기", desc: "사진을 글자로 그린 그림으로. 기본·블록·점자·내 글자, 컬러, 글로 복사·PNG 저장.", tags: ["아스키", "아스키아트", "ascii", "텍스트 아트", "글자 그림", "점자", "특수문자 그림"], status: "live" },
  { id: "color-palette", cat: "des", name: "색 뽑기", desc: "이미지에서 대표 색을 뽑아 HEX·RGB 코드로. 원하는 곳을 눌러 색을 집을 수도 있어요.", tags: ["색", "컬러", "팔레트", "hex", "스포이드", "color", "palette"], status: "live" },
  { id: "favicon", cat: "des", name: "파비콘 만들기", desc: "이미지 하나로 favicon.ico와 홈 화면 아이콘 여러 크기를 한 번에. HTML 코드까지.", tags: ["파비콘", "favicon", "ico", "아이콘", "웹사이트", "앱 아이콘"], status: "live" },
  { id: "color-convert", cat: "des", name: "색 코드 변환", desc: "HEX · RGB · HSL · HSB(포토샵) · CMYK를 서로 바꿔요. 아무 형식이나 붙여넣으면 알아봐요.", tags: ["색", "컬러", "hex", "rgb", "hsl", "hsb", "cmyk", "색상 코드", "변환"], status: "live" },
  { id: "print-size", cat: "des", name: "인쇄 크기 계산기", desc: "이 이미지가 몇 cm로 인쇄되는지, A4 300 DPI엔 몇 px가 필요한지 계산해요. 재단 여유 포함.", tags: ["인쇄", "dpi", "해상도", "cm", "mm", "a4", "명함", "도련", "출력"], status: "live" },
  { id: "placeholder", cat: "des", name: "임시 이미지 만들기", desc: "크기가 적힌 자리용 이미지를 만들어요. SNS 규격 프리셋, PNG · JPG · SVG.", tags: ["플레이스홀더", "placeholder", "더미 이미지", "임시", "시안", "목업"], status: "live" },
  { id: "korean-lorem", cat: "des", name: "한글 더미 텍스트", desc: "시안·목업용 한글 자리 글을 문단 · 문장 · 정확한 글자 수로 만들어요.", tags: ["더미 텍스트", "로렘 입숨", "lorem", "한글 입숨", "샘플 텍스트", "시안"], status: "live" },
  { id: "video-trim", cat: "vid", name: "영상 자르기", desc: "원하는 구간만 골라 잘라 저장해요. 소리도 같이 들어가요.", tags: ["동영상", "video", "trim", "컷", "편집", "mp4"], status: "live" },
  { id: "video-gif", cat: "vid", name: "영상 → GIF", desc: "영상에서 짧은 구간을 골라 움짤(GIF)로 만들어요. 크기와 프레임 수 조절.", tags: ["gif", "움짤", "짤", "동영상", "변환"], status: "live" },
  { id: "shorts-maker", cat: "vid", name: "쇼츠 · 릴스 · 틱톡 세로 변환", desc: "가로 영상을 9:16 세로로 바꿔요. 남는 곳은 흐린 배경으로 채우거나, 꽉 채운 뒤 보여줄 부분을 골라요.", tags: ["쇼츠", "릴스", "틱톡", "세로", "9:16", "shorts", "reels", "tiktok", "세로 영상", "변환"], status: "live" },
  { id: "screen-recorder", cat: "vid", name: "화면 녹화", desc: "설치 없이 화면·창·탭을 녹화해 MP4로. 화면 소리와 마이크도 같이, 일시정지 가능.", tags: ["화면 녹화", "녹화", "스크린 레코더", "screen recorder", "캡처", "강의 녹화", "obs"], status: "live" },
  { id: "audio-edit", cat: "aud", name: "음원 자르기 · 피치 조절", desc: "파형을 보며 구간을 자르고, 키(반음)와 속도를 따로 바꿔 WAV·MP3로 저장해요.", tags: ["오디오", "mp3", "wav", "키", "피치", "속도", "mr", "벨소리"], status: "live" },
  { id: "audio-convert", cat: "aud", name: "오디오 형식 변환", desc: "M4A·FLAC·OGG·WAV 같은 음원을 MP3나 WAV로 바꿔요. 여러 개 한 번에.", tags: ["mp3", "wav", "m4a", "flac", "ogg", "변환", "오디오", "음원"], status: "live" },
  { id: "video-to-audio", cat: "aud", name: "영상에서 소리 추출", desc: "MP4·MOV 영상에서 소리만 뽑아 MP3로 저장해요.", tags: ["mp4 mp3", "영상 mp3", "소리 추출", "오디오 추출", "강의", "녹화"], status: "live" },
  { id: "audio-volume", cat: "aud", name: "볼륨 키우기 · 맞추기", desc: "작게 녹음된 소리를 키우고, 여러 파일의 소리 크기를 똑같이 맞춰요. 깨짐 방지.", tags: ["볼륨", "소리 키우기", "음량", "노멀라이즈", "lufs", "크기 맞추기"], status: "live" },
  { id: "audio-silence", cat: "aud", name: "무음 자르기", desc: "녹음 앞뒤 빈 시간과 중간의 긴 침묵을 찾아 잘라요. 강의·팟캐스트 정리용.", tags: ["무음", "침묵", "공백", "자르기", "녹음", "팟캐스트", "강의"], status: "live" },
  { id: "voice-recorder", cat: "aud", name: "음성 녹음", desc: "마이크로 바로 녹음해 MP3·WAV로. 잡음 줄이기, 일시정지, 여러 개 녹음.", tags: ["녹음", "음성 녹음", "보이스 레코더", "마이크", "녹음기", "mp3"], status: "live" },
  { id: "audio-eq", cat: "aud", name: "이퀄라이저", desc: "31Hz~16kHz 10밴드로 조절해요. 목소리 또렷하게·저음 강조 프리셋, 들으면서 조절.", tags: ["이퀄라이저", "eq", "저음", "베이스", "고음", "음질", "목소리"], status: "live" },
  { id: "pdf-merge", cat: "doc", name: "PDF 합치기", desc: "여러 PDF를 원하는 순서대로 하나로 묶어요.", tags: ["pdf", "합치기", "병합", "merge"], status: "live" },
  { id: "pdf-split", cat: "doc", name: "PDF 나누기 · 정리", desc: "페이지를 보면서 빼고, 돌리고, 순서를 바꾸고, 필요한 페이지만 뽑거나 한 장씩 나눠요.", tags: ["pdf", "나누기", "분할", "추출", "삭제", "회전", "split"], status: "live" },
  { id: "image-to-pdf", cat: "doc", name: "이미지 → PDF", desc: "사진·스캔 이미지 여러 장을 PDF 한 파일로 만들어요. A4 맞춤 지원.", tags: ["pdf", "jpg", "png", "사진", "스캔", "서류"], status: "live" },
  { id: "pdf-to-image", cat: "doc", name: "PDF → 이미지", desc: "PDF 페이지를 PNG나 JPG 이미지로 뽑아요. 해상도 선택.", tags: ["pdf", "png", "jpg", "이미지", "변환"], status: "live" },
  { id: "pdf-page-number", cat: "doc", name: "PDF 쪽 번호 넣기", desc: "PDF에 쪽 번호를 넣어요. 위치·형식·시작 번호, 표지 빼기, 양면 인쇄용.", tags: ["pdf", "쪽 번호", "페이지 번호", "page number", "번호 매기기"], status: "live" },
  { id: "qr-code", cat: "txt", name: "QR코드 만들기", desc: "링크, 와이파이, 연락처, 문자를 QR코드로. 색과 점 모양, 가운데 로고까지 넣어 PNG·SVG로 저장해요.", tags: ["qr", "큐알", "qr코드", "큐알코드", "와이파이", "명함", "링크"], status: "live" },
  { id: "char-count", cat: "txt", name: "글자 수 세기", desc: "공백 포함·제외, 바이트, 줄 수를 한 번에. 목표 글자 수를 넣으면 남은 글자를 알려줘요.", tags: ["글자수", "글자 수", "자소서", "바이트", "byte", "공백", "문자", "카운터"], status: "live" },
  { id: "text-diff", cat: "txt", name: "텍스트 비교", desc: "두 글에서 더한 곳, 지운 곳, 고친 글자를 색으로 보여줘요. 나란히·한 줄 보기, 띄어쓰기 무시.", tags: ["텍스트 비교", "글 비교", "diff", "차이", "비교", "원고", "수정본", "계약서 비교"], status: "live" },
  { id: "form-quote", cat: "form", name: "견적서 만들기", desc: "업종별 견적서를 칸만 채워 PDF로. 부가세·합계·한글 금액 자동, 도장 넣기.", tags: ["견적서", "견적", "양식", "서식", "부가세", "인테리어", "디자인", "pdf"], status: "live" },
  { id: "form-statement", cat: "form", name: "거래명세서 만들기", desc: "공급자·공급받는자와 품목을 채워 PDF로. 한 장에 보관용 두 부도 돼요.", tags: ["거래명세서", "거래명세표", "명세서", "양식", "서식", "납품"], status: "live" },
  { id: "form-receipt", cat: "form", name: "영수증 · 청구서 만들기", desc: "간이 영수증과 청구서를 칸만 채워 PDF로. 보관용 두 부, 자르는 선까지.", tags: ["영수증", "간이영수증", "청구서", "양식", "서식"], status: "live" },
  { id: "form-resume", cat: "form", name: "이력서 만들기", desc: "사진·학력·경력·자격을 채워 A4 한 장 이력서로. 3가지 스타일.", tags: ["이력서", "입사지원서", "양식", "서식", "취업", "알바"], status: "live" },
  { id: "form-labor", cat: "form", name: "표준근로계약서 만들기", desc: "고용노동부 표준근로계약서 항목 그대로. 정규직·계약직, 서명 넣기.", tags: ["근로계약서", "표준근로계약서", "계약서", "알바", "고용", "양식"], status: "live" },
  { id: "form-service", cat: "form", name: "용역계약서 만들기", desc: "프리랜서·외주 계약을 위한 일반 용역계약서. 대금·검수·저작권 조항.", tags: ["용역계약서", "프리랜서", "외주", "계약서", "양식", "디자인 계약"], status: "live" },
  { id: "form-iou", cat: "form", name: "차용증 만들기", desc: "원금을 한글·숫자로, 이자·갚을 날·지연 이자 조항까지 채워 PDF로.", tags: ["차용증", "차용", "돈 빌려줄 때", "각서", "양식"], status: "live" },
  { id: "form-resign", cat: "form", name: "사직서 만들기", desc: "소속·입사일·퇴사 희망일·사유를 채워 바로 내는 사직서.", tags: ["사직서", "퇴사", "사표", "양식", "서식"], status: "live" },
  { id: "form-poa", cat: "form", name: "위임장 만들기", desc: "서류 발급·신청을 맡길 때 쓰는 위임장. 위임인·수임인·위임 사항.", tags: ["위임장", "대리", "위임", "양식", "서식", "민원"], status: "live" },
  { id: "form-employ", cat: "form", name: "재직증명서 만들기", desc: "회사가 발급하는 재직증명서. 회사 정보와 직인은 기기에 기억.", tags: ["재직증명서", "증명서", "인사", "양식", "서식"], status: "live" },
  { id: "form-career", cat: "form", name: "경력증명서 만들기", desc: "근무 기간·담당 업무·부서 이력을 담은 경력증명서.", tags: ["경력증명서", "증명서", "퇴사", "인사", "양식"], status: "live" },
  { id: "form-retire", cat: "form", name: "퇴직증명서 만들기", desc: "퇴사한 사람의 근무 기간·부서를 회사가 확인해 주는 문서. 회사 직인.", tags: ["퇴직증명서", "퇴사증명서", "퇴사", "증명서", "양식"], status: "live" },
  { id: "form-incident", cat: "form", name: "경위서 · 시말서 만들기", desc: "일어난 일을 설명하는 경위서, 잘못을 인정하는 시말서. 결재란·서명.", tags: ["경위서", "시말서", "사유서", "반성문", "회사", "양식"], status: "live" },
  { id: "form-leave", cat: "form", name: "휴가신청서 만들기", desc: "연차·반차·병가 신청서. 주말 뺀 일수 자동 계산, 결재란.", tags: ["휴가신청서", "연차", "반차", "병가", "휴가계", "양식"], status: "live" },
  { id: "form-handover", cat: "form", name: "인수인계서 만들기", desc: "퇴사·부서 이동 때 업무·자료 위치·연락처를 표로 넘겨요.", tags: ["인수인계서", "인수인계", "퇴사", "업무 인계", "양식"], status: "live" },
  { id: "form-minutes", cat: "form", name: "회의록 만들기", desc: "안건·논의·결정 사항·할 일 표로 정리하는 회의록.", tags: ["회의록", "회의", "미팅", "양식", "서식"], status: "live" },
  { id: "form-pledge", cat: "form", name: "각서 만들기", desc: "지키기로 한 약속을 번호 붙여 정리하는 각서.", tags: ["각서", "약속", "서약서", "양식"], status: "live" },
  { id: "form-agreement", cat: "form", name: "합의서 만들기", desc: "작은 사고·다툼 합의서. 합의금 한글 표기, 지급일, 이의 제기 금지 조항.", tags: ["합의서", "합의", "사고 합의", "접촉사고", "양식"], status: "live" },
  { id: "form-notice", cat: "form", name: "내용증명 만들기", desc: "보증금 반환·대금 요청 등 우체국 내용증명 문서. 3부 뽑아 보내요.", tags: ["내용증명", "보증금", "우체국", "독촉", "양식"], status: "live" },
  { id: "form-trade", cat: "form", name: "중고거래 매매계약서 만들기", desc: "개인 간 물품 매매계약서. 상태·대금·하자 책임·소유권 확인.", tags: ["매매계약서", "중고거래", "당근", "계약서", "직거래", "양식"], status: "live" },
  { id: "stamp-clean", cat: "form", name: "도장 · 서명 배경 지우기", desc: "흰 종이에 찍은 도장이나 서명 사진의 배경을 지워 투명 PNG로.", tags: ["도장", "인감", "서명", "사인", "배경 제거", "투명", "png", "누끼"], status: "live" }
];

window.TT_CATS = {
  img: { label: "이미지", color: "var(--img)" },
  doc: { label: "PDF", color: "var(--doc)" },
  vid: { label: "영상", color: "var(--vid)" },
  aud: { label: "오디오", color: "var(--aud)" },
  des: { label: "디자인", color: "var(--des)" },
  txt: { label: "텍스트 · 생활", color: "var(--txt)" },
  form: { label: "양식", color: "var(--form)" }
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
  "audio-convert": `<svg ${S}><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>`,
  "video-to-audio": `<svg ${S}><rect x="2" y="5" width="13" height="14" rx="2"/><path d="m15 10 4-2v8l-4-2"/><path d="M6 13h2"/><path d="M10 11v4"/></svg>`,
  "audio-volume": `<svg ${S}><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>`,
  "audio-silence": `<svg ${S}><path d="M2 12h3"/><path d="M5 9v6"/><path d="M8 7v10"/><path d="M11 12h4" stroke-dasharray="1 2"/><path d="M18 8v8"/><path d="M21 11v2"/></svg>`,
  "color-convert": `<svg ${S}><circle cx="8" cy="8" r="5"/><circle cx="16" cy="16" r="5"/><path d="M13 8h5v5"/></svg>`,
  "print-size": `<svg ${S}><path d="M6 9V2h12v7"/><rect x="2" y="9" width="20" height="8" rx="2"/><path d="M6 14h12v8H6z"/></svg>`,
  "placeholder": `<svg ${S}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 3 18 18"/><path d="M21 3 3 21"/></svg>`,
  "korean-lorem": `<svg ${S}><path d="M4 6h16"/><path d="M4 10h16"/><path d="M4 14h10"/><path d="M4 18h12"/></svg>`,
  "form-quote": `<svg ${S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/><path d="M15 17h1"/></svg>`,
  "form-statement": `<svg ${S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 12h8"/><path d="M8 15h8"/><path d="M8 18h8"/><path d="M11 12v6"/></svg>`,
  "form-receipt": `<svg ${S}><path d="M5 2v20l2.5-1.5L10 22l2-1.5 2 1.5 2.5-1.5L19 22V2l-2.5 1.5L14 2l-2 1.5L10 2 7.5 3.5z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h3"/></svg>`,
  "form-resume": `<svg ${S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><circle cx="10" cy="12" r="2"/><path d="M7 18c.5-1.6 1.7-2.4 3-2.4s2.5.8 3 2.4"/></svg>`,
  "form-labor": `<svg ${S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="m8 18 1.5-1.5L11 18l1.5-1.5"/></svg>`,
  "form-service": `<svg ${S}><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>`,
  "form-iou": `<svg ${S}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01"/><path d="M18 12h.01"/></svg>`,
  "form-resign": `<svg ${S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></svg>`,
  "form-poa": `<svg ${S}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg>`,
  "form-employ": `<svg ${S}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  "form-career": `<svg ${S}><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/></svg>`,
  "stamp-clean": `<svg ${S}><path d="M5 22h14"/><path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z"/><path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-3-3c-1.69 0-3 1-3 3s1 2 1 3.5V13"/></svg>`,
  "screen-recorder": `<svg ${S}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><circle cx="12" cy="10" r="3" fill="currentColor" stroke="none"/></svg>`,
  "voice-recorder": `<svg ${S}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v5"/><path d="M8 22h8"/></svg>`,
  "audio-eq": `<svg ${S}><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M2 14h4"/><path d="M10 8h4"/><path d="M18 16h4"/></svg>`,
  "pdf-page-number": `<svg ${S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M10 15.5 12 14v5"/></svg>`,
  "photo-edit": `<svg ${S}><circle cx="12" cy="12" r="9"/><path d="m14.31 8 5.74 9.94"/><path d="M9.69 8h11.48"/><path d="m7.38 12 5.74-9.94"/><path d="M9.69 16 3.95 6.06"/><path d="M14.31 16H2.83"/><path d="m16.62 12-5.74 9.94"/></svg>`,
  "form-retire": `<svg ${S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6"/><path d="m13 13 2 2-2 2"/></svg>`,
  "form-incident": `<svg ${S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 11v3"/><path d="M12 17h.01"/></svg>`,
  "form-leave": `<svg ${S}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>`,
  "form-handover": `<svg ${S}><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>`,
  "form-minutes": `<svg ${S}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg>`,
  "form-pledge": `<svg ${S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></svg>`,
  "form-agreement": `<svg ${S}><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="M3 4h8"/></svg>`,
  "form-notice": `<svg ${S}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>`,
  "form-trade": `<svg ${S}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  "text-diff": `<svg ${S}><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`,
  "pixel-art": `<svg ${S}><path d="M4 4h4v4H4z"/><path d="M10 4h4v4h-4z"/><path d="M16 10h4v4h-4z"/><path d="M4 10h4v4H4z"/><path d="M10 16h4v4h-4z"/></svg>`,
  "ascii-art": `<svg ${S}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m7 15 2-6 2 6"/><path d="M7.7 13h2.6"/><path d="M14 9h3"/><path d="M15.5 9v6"/><path d="M14 15h3"/></svg>`,
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
