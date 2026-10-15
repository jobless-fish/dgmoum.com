# 도구모음 집계 서버

첫 화면의 "사용된 횟수", "즐겨찾기" 숫자를 모으는 작은 서버예요. Cloudflare 무료 요금제로 돌아가요.
숫자만 세고 파일·IP·기기 정보는 저장하지 않아요.

## 배포 (한 번만)

```bash
cd counter-worker
npm install -g wrangler
wrangler login                                # 브라우저에서 Cloudflare 로그인 (무료 가입)
wrangler d1 create dgmu-counter               # 나온 database_id를 wrangler.toml에 붙여넣기
wrangler d1 execute dgmu-counter --remote --file=schema.sql
wrangler deploy                               # 끝나면 https://dgmu-counter.<아이디>.workers.dev 주소가 나와요
```

그 주소를 `assets/shell.js` 맨 위 `const COUNTER_URL = "";` 따옴표 안에 넣고 사이트를 다시 올리면 숫자가 보이기 시작해요.
주소를 넣기 전에는 첫 화면에 "—"와 "집계 준비 중"이 보여요.

## 세는 기준
- 사용된 횟수: 도구에서 결과를 저장(다운로드)하거나 인쇄한 횟수 (1.5초 안에 여러 번은 한 번)
- 즐겨찾기: 별표를 누르면 +1, 다시 누르면 −1
- 도구별 숫자도 `use:도구이름`, `fav:도구이름`으로 따로 쌓여요 (나중에 "인기 도구"에 쓸 수 있어요)
