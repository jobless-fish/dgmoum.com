# 도구 제안 받기 (suggest-worker)

사이트의 About 페이지 제안 폼에 쓴 글을 **운영자만 볼 수 있는 비공개 GitHub 저장소**의 `requests.md` 끝에 덧붙여요.

```
#요청1

* PDF를 엑셀로 바꾸는 도구가 있으면 좋겠어요
* 받은 시각: 2026-10-15 23:42
* 보낸 곳: /about/#suggest

---
```

- GitHub 토큰은 이 서버(Cloudflare)에만 비밀값으로 있어요. 사이트 코드에는 들어가지 않아요.
- 저장하는 건 제안 글, (적었다면) 연락처, 받은 시각, 보낸 페이지뿐이에요. IP·기기 정보는 저장하지 않아요.
- 같은 곳에서 10분에 5번 넘게 보내면 잠깐 막아요. 봇이 채우는 숨은 칸이 채워져 있으면 조용히 버려요.

## 설치 (한 번만, 15분쯤)

### 1. 비공개 저장소 만들기
GitHub → New repository → 이름 `dgmoum-inbox` → **Private** → "Add a README file" 체크 → Create.

### 2. 이 저장소에만 쓸 수 있는 토큰 만들기
GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token
- Repository access: **Only select repositories** → `dgmoum-inbox`
- Permissions → Repository permissions → **Contents: Read and write** (나머지는 그대로)
- 만료일을 정해 두고, 만료되면 새로 만들어 3번의 GITHUB_TOKEN만 바꿔 주세요.

### 3. Cloudflare에 올리기 (화면으로)
1. https://dash.cloudflare.com 가입 → Workers & Pages → Create → Create Worker → 이름 `dgmu-suggest` → Deploy
2. Edit code → 기본 코드를 지우고 이 폴더의 `worker.js` 내용을 붙여넣기 → Deploy
3. Worker의 Settings → Variables and Secrets
   - `REPO` (Text): `jobless-fish/dgmoum-inbox`
   - `GITHUB_TOKEN` (**Secret**): 2번에서 만든 토큰
   - (선택) `FILE_PATH`: 기본 `requests.md`, `BRANCH`: 기본 `main`
4. Worker 주소(`https://dgmu-suggest.<아이디>.workers.dev`)를 복사

명령어로 올리고 싶다면: `npx wrangler deploy` 후 `npx wrangler secret put GITHUB_TOKEN`

### 4. 사이트에 연결
`assets/shell.js` 위쪽의 `SUGGEST_API = ""`에 4번 주소를 넣고 push 하면 끝이에요.

## 확인
About 페이지 → "필요한 도구가 없나요?"에 글을 보내면 `dgmoum-inbox/requests.md`에 `#요청1`이 생겨요.
