import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const PID_FILE = join(process.cwd(), "playwright", ".auth", "mock-course.pid");

export default async function globalTeardown(): Promise<void> {
  if (!existsSync(PID_FILE)) return;
  const pid = Number(readFileSync(PID_FILE, "utf8").trim());
  rmSync(PID_FILE, { force: true });
  if (!Number.isFinite(pid) || pid <= 0) return;
  try {
    process.kill(pid);
    console.log(`[global-teardown] stopped mock course server (pid=${pid})`);
  } catch {
    // โปรเซสอาจตายไปก่อนแล้ว — ไม่ต้องทำอะไร
  }
}
