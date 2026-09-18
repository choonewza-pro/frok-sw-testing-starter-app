import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MOCK_PORT = Number(process.env.MOCK_COURSE_PORT || 3939);
const MOCK_URL = `http://127.0.0.1:${MOCK_PORT}/api/course`;
const PID_FILE = join(process.cwd(), "playwright", ".auth", "mock-course.pid");

async function waitForHealth(timeoutMs = 15_000): Promise<void> {
  const start = Date.now();
  for (;;) {
    try {
      const res = await fetch(`http://127.0.0.1:${MOCK_PORT}/__health`);
      if (res.ok) {
        // Reset mode ทุกครั้งที่เริ่มรัน — กัน state ค้างจากรันก่อนหน้า
        await fetch(`http://127.0.0.1:${MOCK_PORT}/__control`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode: "ok" }),
        });
        return;
      }
    } catch {
      // server ยังไม่พร้อม — ลองใหม่
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`[global-setup] mock course server ไม่พร้อมใน ${timeoutMs}ms`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

export default async function globalSetup(): Promise<void> {
  mkdirSync(join(process.cwd(), "playwright", ".auth"), { recursive: true });

  const child: ChildProcess = spawn(
    process.execPath,
    ["e2e/helpers/course-mock-server.mjs"],
    {
      detached: true,
      stdio: "ignore",
      env: { ...process.env, MOCK_COURSE_PORT: String(MOCK_PORT) },
    },
  );
  child.unref();

  if (child.pid) writeFileSync(PID_FILE, String(child.pid), "utf8");

  await waitForHealth();
  process.env.COURSE_API_URL = MOCK_URL;
  console.log(`[global-setup] mock course ready at ${MOCK_URL}`);
}
