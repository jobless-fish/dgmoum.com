/* 도구모음 집계 서버 (Cloudflare Workers + D1, 무료 요금제로 충분해요)
   - 숫자만 세요: 사용 횟수(use), 즐겨찾기(fav). 파일·IP·기기 정보는 저장하지 않아요.
   - GET  /stats          → {"use": 123, "fav": 45}
   - POST /hit  본문 "use:image-compress" | "fav:qr-code" | "unfav:qr-code" */
const ALLOWED = ["https://dgmoum.com", "https://www.dgmoum.com", "https://jobless-fish.github.io"];
const UPSERT = "INSERT INTO counters (k, n) VALUES (?1, MAX(?2, 0)) ON CONFLICT(k) DO UPDATE SET n = MAX(n + ?2, 0)";

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED.includes(origin) || origin.startsWith("http://localhost") ? origin : ALLOWED[0],
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(req.url);

    if (url.pathname === "/stats" && req.method === "GET") {
      const { results } = await env.DB.prepare("SELECT k, n FROM counters WHERE k IN ('use', 'fav')").all();
      const out = { use: 0, fav: 0 };
      for (const r of results) out[r.k] = r.n;
      return Response.json(out, { headers: { ...cors, "Cache-Control": "public, max-age=60" } });
    }

    if (url.pathname === "/hit" && req.method === "POST") {
      // 다른 사이트에서 마구 올리는 걸 막아요
      if (origin && !ALLOWED.includes(origin) && !origin.startsWith("http://localhost")) return new Response("forbidden", { status: 403, headers: cors });
      const body = (await req.text()).trim().slice(0, 80);
      const m = body.match(/^(use|fav|unfav):([a-z0-9-]{0,40})$/);
      if (!m) return new Response("bad request", { status: 400, headers: cors });
      const key = m[1] === "unfav" ? "fav" : m[1], d = m[1] === "unfav" ? -1 : 1;
      const stmts = [env.DB.prepare(UPSERT).bind(key, d)];
      if (m[2]) stmts.push(env.DB.prepare(UPSERT).bind(`${key}:${m[2]}`, d));
      await env.DB.batch(stmts);
      return new Response("ok", { headers: cors });
    }
    return new Response("not found", { status: 404, headers: cors });
  }
};
