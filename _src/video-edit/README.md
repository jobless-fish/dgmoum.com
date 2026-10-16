# 컷편집Pro 소스

`tools/video-edit/`에 올라가 있는 건 이 소스를 빌드한 결과물이에요. (밑줄로 시작하는 폴더라 사이트에는 공개되지 않아요.)

원본: 사용자 제공 `cutedit-pro` (TanStack Start 앱)에서 편집기 본체(`src/components/editor`, `src/lib/editor`)만 떼어,
로그인·DB·서버 없이 정적 페이지로 돌도록 Vite + React로 다시 묶었어요.

## 고친 뒤 다시 빌드하기 (Node.js 20 이상)

```bash
cd _src/video-edit
npm install
npm run build
# 결과를 사이트로 복사
rm -rf ../../tools/video-edit && mkdir -p ../../tools/video-edit && cp -r dist/* ../../tools/video-edit/
```
