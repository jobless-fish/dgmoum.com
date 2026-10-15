/* 도구모음 도구 제안 받기 (Cloudflare Workers 무료 요금제로 충분해요)
   - 사이트의 제안 폼이 보낸 글을 운영자의 "비공개" GitHub 저장소에 있는 md 파일 끝에 덧붙여요.
   - GitHub 토큰은 이 서버에만 있고(비밀값 GITHUB_TOKEN), 사이트 코드에는 들어가지 않아요.
   - 저장하는 건 제안 글과 (적었다면) 연락처, 받은 시각뿐이에요. IP·기기 정보는 저장하지 않아요.

   POST /suggest  JSON {"text": "필요한 도구 설명", "contact": "선택", "page": "보낸 페이지", "website": ""(봇 걸러내기용 빈칸)}

   저장 모양:
   #요청12

   * 내용 첫 줄
     내용 둘째 줄
   * 받은 시각: 2026-10-15 23:41
   * 연락처: (적은 경우만)

   ---
*/
const ALLOWED = ["https://dgmoum.com", "https://www.dgmoum.com", "https://jobless-fish.github.io"];
const MAX_TEXT = 1000, MAX_CONTACT = 120;
const recent = new Map(); // 같은 곳에서 너무 자주 보내는 것만 잠깐 막아요 (메모리에만, 저장 안 함)

const enc = new TextEncoder(), dec = new TextDecoder();
const b64decode = s => dec.decode(Uint8Array.from(atob(s.replace(/\n/g, "")), c => c.charCodeAt(0)));
const b64encode = str => { const b = enc.encode(str); let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };

function kstNow() {
  const d = new Date(Date.now() + 9 * 3600e3);
  const p = n => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

// 사용자가 쓴 글이 md 구조(#요청, ---)를 깨지 않게 다듬어요
function block(text) {
  const lines = text.replace(/\r\n?/g, "\n").trim().split("\n").map(l => l.replace(/^(\s*)(#|---|===)/, "$1\\$2"));
  return "* " + lines.join("\n  ");
}

export function entry(n, text, contact, page, when = kstNow()) {
  let s = `#요청${n}\n\n${block(text)}\n* 받은 시각: ${when}\n`;
  if (page) s += `* 보낸 곳: ${page}\n`;
  if (contact) s += `* 연락처: ${contact.replace(/\s+/g, " ")}\n`;
  return s + "\n---\n\n";
}
export const nextNo = md => { let m, max = 0; const re = /^#요청(\d+)\s*$/gm; while ((m = re.exec(md))) max = Math.max(max, +m[1]); return max + 1; };

async function append(env, text, contact, page) {
  const repo = env.REPO, path = env.FILE_PATH || "requests.md", branch = env.BRANCH || "main";
  const api = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
  const headers = { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "dgmu-suggest", "X-GitHub-Api-Version": "2022-11-28" };
  for (let tryNo = 0; tryNo < 4; tryNo++) {
    const r = await fetch(`${api}?ref=${branch}`, { headers });
    let md = "# 도구 제안 모음\n\n사이트(dgmoum.com)의 제안 폼으로 들어온 글이 아래에 쌓여요.\n\n---\n\n", sha;
    if (r.ok) { const j = await r.json(); sha = j.sha; md = b64decode(j.content || ""); }
    else if (r.status !== 404) throw new Error("read " + r.status);
    const n = nextNo(md);
    const body = { message: `도구 제안 #${n}`, content: b64encode(md + entry(n, text, contact, page)), branch };
    if (sha) body.sha = sha;
    const w = await fetch(api, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (w.ok) return n;
    if (w.status !== 409 && w.status !== 422) throw new Error("write " + w.status);
    await new Promise(res => setTimeout(res, 300 + Math.random() * 500)); // 동시에 두 개가 들어오면 다시 시도
  }
  throw new Error("busy");
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const okOrigin = ALLOWED.includes(origin) || origin.startsWith("http://localhost");
    const cors = { "Access-Control-Allow-Origin": okOrigin ? origin : ALLOWED[0], "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" };
    const json = (o, status = 200) => Response.json(o, { status, headers: cors });
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(req.url);
    if (url.pathname !== "/suggest" || req.method !== "POST") return json({ ok: false, error: "not found" }, 404);
    if (!okOrigin) return json({ ok: false, error: "forbidden" }, 403);

    let data; try { data = await req.json(); } catch { return json({ ok: false, error: "bad request" }, 400); }
    if (data.website) return json({ ok: true, n: 0 }); // 봇이 채운 빈칸이면 조용히 무시
    const text = String(data.text || "").trim(), contact = String(data.contact || "").trim().slice(0, MAX_CONTACT);
    const page = String(data.page || "").replace(/[^\w\-/.#가-힣]/g, "").slice(0, 60);
    if (text.length < 4) return json({ ok: false, error: "too short" }, 400);
    if (text.length > MAX_TEXT) return json({ ok: false, error: "too long" }, 400);

    const ip = req.headers.get("CF-Connecting-IP") || "?", now = Date.now();
    const last = recent.get(ip) || []; const keep = last.filter(t => now - t < 10 * 60e3);
    if (keep.length >= 5) return json({ ok: false, error: "slow down" }, 429);
    keep.push(now); recent.set(ip, keep);
    if (recent.size > 5000) recent.clear();

    try { const n = await append(env, text, contact, page); return json({ ok: true, n }); }
    catch (e) { return json({ ok: false, error: "server" }, 502); }
  }
};
