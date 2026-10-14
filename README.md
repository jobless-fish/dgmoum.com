# 뚝딱툴

브라우저에서 바로 쓰는 무료 파일 도구 모음. 모든 처리는 사용자 기기 안에서 이뤄지고 서버가 필요 없어요.

## 구조

```
index.html                 카탈로그 (도구 목록 · 검색 · 분류)
assets/
  site.css                 공용 스타일 (색·글꼴·버튼·드롭존 등)
  common.js                공용 함수 + 도구 목록(TT_TOOLS)
  audio.js                 오디오 공용 함수 (읽기 · MP3/WAV 저장 · LUFS · 리미터 · 파형)
tools/
  image-convert/  이미지 포맷 변환 (PNG·JPG·WEBP)
  image-resize/   이미지 크기 조절 (긴 변 / 픽셀 / 퍼센트)
  image-compress/ 이미지 압축 (목표 용량 KB 맞추기)
  image-mosaic/   모자이크 · 흐리게 · 박스로 가리기
  image-gif/      움짤 만들기 (사진 여러 장 → GIF)
  insta-grid/     인스타 그리드 자르기 (3칸 × 1~5줄, 올리는 순서 번호)
  image-merge/    이미지 합치기 (세로·가로·격자)
  image-split/    긴 이미지 나누기 (높이·개수 기준)
  image-crop/     자르기 · 회전 · 뒤집기 (비율 프리셋)
  image-watermark/ 워터마크 넣기 (글자·로고, 사선 반복)
  photo-edit/     사진 보정 (라이트룸식 화면: 기본·톤 곡선·HSL·색 보정·효과, 필름·카메라 프리셋 31종, LUT, 여러 장 동기화)
                  engine.js(WebGL2 셰이더) · presets.js(프리셋 값) · app.js(화면)
  image-exif/     사진 정보 지우기 (GPS·기기 정보, JPG·PNG는 화질 그대로)
  color-palette/  색 뽑기 (대표 색 · 스포이드 · CSS 변수)
  favicon/        파비콘 만들기 (ico · 홈 화면 아이콘 · webmanifest)
  color-convert/  색 코드 변환 (HEX · RGB · HSL · HSB · CMYK 근사)
  print-size/     인쇄 크기 계산기 (px ↔ cm·mm, 용지별 DPI, 재단 여유)
  placeholder/    임시 이미지 만들기 (크기 표시 · SNS 규격 · PNG/JPG/SVG)
  korean-lorem/   한글 더미 텍스트 (문단 · 문장 · 정확한 글자 수)
  video-trim/     영상 자르기
  video-gif/      영상 → GIF
  screen-recorder/ 화면 녹화 (화면·창·탭, 화면 소리+마이크, 일시정지, MP4)
  shorts-maker/   쇼츠 · 릴스 · 틱톡 세로 변환 (9:16·4:5·1:1, 흐린 배경·꽉 채우기)
  audio-edit/     음원 자르기 · 키 · 빠르기 · 페이드
  audio-convert/  오디오 형식 변환 (M4A·FLAC·OGG·WAV → MP3·WAV)
  video-to-audio/ 영상에서 소리 추출 (MP4·MOV → MP3·WAV)
  audio-volume/   볼륨 키우기 · 맞추기 (LUFS 측정, 깨짐 방지 리미터)
  audio-silence/  무음 자르기 (앞뒤·중간 긴 침묵, 자동 기준)
  voice-recorder/ 음성 녹음 (마이크 선택, 목소리 보정, 여러 개 녹음, MP3·WAV)
  audio-eq/       이퀄라이저 (10밴드 31Hz~16kHz, 전체 볼륨, 프리셋, 들으면서 조절, 깨짐 방지)
  pdf-merge/      PDF 합치기
  pdf-split/      PDF 나누기 · 정리 (삭제·회전·순서·추출·분할)
  image-to-pdf/   이미지 → PDF (A4 맞춤)
  pdf-to-image/   PDF → 이미지 (PNG·JPG, dpi 선택)
  pdf-page-number/ PDF 쪽 번호 넣기 (위치·형식·시작 번호·표지 빼기·양면, 돌아간 쪽 대응)
  qr-code/        QR코드 만들기 (링크·와이파이·연락처·문자·이메일, PNG·SVG)
  char-count/     글자 수 세기 (공백 포함·제외·바이트·목표)
  form-quote/     견적서 (업종별 프리셋, 부가세 별도·포함·없음, 한글 금액)
  form-statement/ 거래명세서 (공급자·공급받는자, 보관용 두 부)
  form-receipt/   영수증 · 청구서 (보관용 두 부 + 자르는 선)
  form-resume/    이력서 (사진·학력·경력·자격·활동, 자기소개는 2쪽)
  form-labor/     표준근로계약서 (고용노동부 항목, 정규직·계약직)
  form-service/   용역계약서 (일반 서식, 정부 표준 아님)
  form-iou/       차용증
  form-resign/    사직서
  form-poa/       위임장
  form-employ/    재직증명서
  form-career/    경력증명서
  stamp-clean/    도장 · 서명 배경 지우기 (투명 PNG)
```

양식 도구는 `assets/forms.css`(A4 문서·인쇄 스타일, 기본·모던·클래식)와 `assets/forms.js`(입력칸 생성, 미리보기, 도장 배경 지우기, 서명판, 이 기기 기억)를 같이 써요.

각 도구는 독립된 페이지라서 `tools/<이름>/` 주소로 바로 들어갈 수 있어요.

## 새 도구 추가하기

1. `tools/<새-이름>/index.html` 만들기 (기존 도구 하나 복사해서 시작하면 편해요)
2. `assets/common.js`의 `TT_TOOLS`에 한 줄 추가 → 카탈로그에 자동으로 나와요
3. 아이콘은 같은 파일의 `TT_ICONS`에 `"<새-이름>": '<svg…>'`로 추가

준비 중인 도구는 `status: "soon"`으로 두면 흐린 카드로 보여요.

## 배포 (GitHub Pages)

저장소 루트에 이 폴더 내용을 그대로 올리고 Settings → Pages에서 main 브랜치를 고르면 끝이에요.

## 광고

각 페이지의 `<div class="ad-slot">` 자리에 AdSense `<ins>` 태그를 넣으면 돼요. 비어 있을 땐 화면에 안 보여요.
자동 광고를 쓸 거면 `index.html` `<head>`의 주석 자리처럼 각 페이지 head에 스크립트를 넣으세요.

## 알아둘 점

- **양식**: PDF는 브라우저 인쇄 창에서 'PDF로 저장'으로 만들어요. 상호·도장 같은 내 정보는 체크해 두면 그 브라우저(localStorage)에만 남아요. 견적서 '업종 추가 요청' 링크는 `assets/forms.js`의 `REQUEST_URL`(지금은 GitHub 이슈 작성 화면)을 바꾸면 돼요.

- **영상 자르기**: 고른 구간을 재생하면서 녹화하는 방식이라 구간 길이만큼 시간이 걸려요. 최신 크롬·엣지는 MP4로, 그 외에는 WEBM으로 저장돼요.
- **사진 보정**: 화면 미리보기는 긴 변 3000px(휴대폰 2000px)로 줄여서 그리고, 저장할 때 원본 크기로 다시 그려요(최대 8192px). RAW 파일은 아직 안 돼요. 프리셋 값은 `tools/photo-edit/presets.js`에서 고치면 돼요.
- **화면 녹화**: 휴대폰 브라우저는 화면 공유를 지원하지 않아요. 화면 소리는 크롬·엣지에서 탭(모든 OS) 또는 화면 전체(윈도우)일 때 들어가요.
- **PDF 쪽 번호**: 번호 글꼴이 PDF 기본 글꼴(Helvetica)이라 영문·숫자 형식만 있어요.
- **쇼츠 · 릴스 · 틱톡 세로 변환**: 영상 자르기처럼 재생하면서 녹화해요.
- **음원 피치**: 키와 빠르기를 따로 바꿔요(WSOLA 방식). ±12반음, 0.5~2배.
- 외부 라이브러리는 모두 cdnjs에서 불러와요: MP3 저장(lamejs), zip 받기(JSZip), PDF 편집(pdf-lib), PDF 그리기(pdf.js), GIF 만들기(gif.js), QR코드(qrcode-generator, jsDelivr), 사진 정보 읽기(exifr, jsDelivr).
- **MP3 저장**과 **zip 받기**는 불러오지 못하면 WAV 저장 / 파일 하나씩 받기로 자동 전환돼요.
- HEIC(아이폰 사진)는 사파리 외 브라우저에서 열리지 않아요.
