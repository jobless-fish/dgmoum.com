# 뚝딱툴

브라우저에서 바로 쓰는 무료 파일 도구 모음. 모든 처리는 사용자 기기 안에서 이뤄지고 서버가 필요 없어요.

## 구조

```
index.html                 카탈로그 (도구 목록 · 검색 · 분류)
assets/
  site.css                 공용 스타일 (색·글꼴·버튼·드롭존 등)
  common.js                공용 함수 + 도구 목록(TT_TOOLS)
tools/
  image-convert/  이미지 포맷 변환 (PNG·JPG·WEBP)
  image-resize/   이미지 크기 조절 (긴 변 / 픽셀 / 퍼센트)
  image-compress/ 이미지 압축 (목표 용량 KB 맞추기)
  image-mosaic/   모자이크 · 흐리게 · 박스로 가리기
  image-gif/      움짤 만들기 (사진 여러 장 → GIF)
  insta-grid/     인스타 그리드 자르기 (3칸 × 1~5줄, 올리는 순서 번호)
  video-trim/     영상 자르기
  video-gif/      영상 → GIF
  audio-edit/     음원 자르기 · 키 · 빠르기 · 페이드
  pdf-merge/      PDF 합치기
  pdf-split/      PDF 나누기 · 정리 (삭제·회전·순서·추출·분할)
  image-to-pdf/   이미지 → PDF (A4 맞춤)
  pdf-to-image/   PDF → 이미지 (PNG·JPG, dpi 선택)
  char-count/     글자 수 세기 (공백 포함·제외·바이트·목표)
```

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

- **영상 자르기**: 고른 구간을 재생하면서 녹화하는 방식이라 구간 길이만큼 시간이 걸려요. 최신 크롬·엣지는 MP4로, 그 외에는 WEBM으로 저장돼요.
- **음원 피치**: 키와 빠르기를 따로 바꿔요(WSOLA 방식). ±12반음, 0.5~2배.
- 외부 라이브러리는 모두 cdnjs에서 불러와요: MP3 저장(lamejs), zip 받기(JSZip), PDF 편집(pdf-lib), PDF 그리기(pdf.js), GIF 만들기(gif.js).
- **MP3 저장**과 **zip 받기**는 불러오지 못하면 WAV 저장 / 파일 하나씩 받기로 자동 전환돼요.
- HEIC(아이폰 사진)는 사파리 외 브라우저에서 열리지 않아요.
