#!/usr/bin/env node
/**
 * Mock server สำหรับ Course API ภายนอก — ใช้ตอนรัน E2E เท่านั้น
 *
 * ทำไมต้องมี: หน้า /course ดึงข้อมูลฝั่ง server (`fetchCourses` ใน Server Component)
 * `page.route()` ของ Playwright ดักได้แค่ request ฝั่ง browser จึงใช้กับเคสนี้ไม่ได้
 * วิธีแก้คือชี้ `COURSE_API_URL` มาที่ mock นี้ผ่าน `webServer.env` ใน playwright.config.ts
 *
 * Modes (เปลี่ยนระหว่างเทสผ่าน POST /__control {"mode"}):
 * - ok    -> 200 + fixture docs/fixtures/courses.json
 * - empty -> 200 + { data: [] }
 * - error -> 500
 */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const MOCK_PORT = Number(process.env.MOCK_COURSE_PORT || 3939);

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const fixture = JSON.parse(
  readFileSync(join(root, "docs", "fixtures", "courses.json"), "utf8"),
);

let mode = "ok";

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${MOCK_PORT}`);

  if (url.pathname === "/__health" && req.method === "GET") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, mode }));
    return;
  }

  if (url.pathname === "/__control" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const next = JSON.parse(body || "{}").mode;
        if (["ok", "empty", "error"].includes(next)) mode = next;
      } catch {
        // ignore malformed control payloads, keep current mode
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, mode }));
    });
    return;
  }

  if (url.pathname === "/api/course" && req.method === "GET") {
    if (mode === "error") {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "mock course failure" }));
      return;
    }
    const payload = mode === "empty" ? { data: [] } : fixture;
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(payload));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(MOCK_PORT, "127.0.0.1", () => {
  console.log(`[mock-course] listening on http://127.0.0.1:${MOCK_PORT} (mode=${mode})`);
});
