// Shared server bootstrap for the audit scripts (content-snapshot, scene-audit).
// Env: URL=http://host:port reuses a running server; otherwise spawns `next start` on port 3100
// directly through node (not npx, whose wrapper would leave the server running after stop()).
// (needs a prior `npm run build`).
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export async function startServer() {
  if (process.env.URL) return { url: process.env.URL, stop() {} };
  const port = 3100;
  if (!existsSync(resolve(ROOT, ".next/BUILD_ID"))) throw new Error("No production build: run `npm run build` first (or set URL).");
  const proc = spawn(process.execPath, [resolve(ROOT, "node_modules/next/dist/bin/next"), "start", "-p", String(port)], { cwd: ROOT, stdio: "ignore" });
  const url = `http://localhost:${port}`;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url)).ok) return { url, stop: () => proc.kill() }; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  proc.kill();
  throw new Error("Server did not start");
}
