// Runs `next build` and saves its terminal output to perf-reports/build-output-<timestamp>.txt
// while still printing it live. Next 16 no longer prints First Load JS in the route table,
// so a per-route First Load JS table is appended from .next/diagnostics/route-bundle-stats.json.
import { spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const pad = (n) => String(n).padStart(2, "0");
const d = new Date();
const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const outFile = `perf-reports/build-output-${stamp}.txt`;

mkdirSync("perf-reports", { recursive: true });
const out = createWriteStream(outFile);
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;

function firstLoadTable() {
  const statsFile = ".next/diagnostics/route-bundle-stats.json";
  if (!existsSync(statsFile)) return "\n(No route-bundle-stats.json found; First Load JS table skipped)\n";
  const stats = JSON.parse(readFileSync(statsFile, "utf8"));
  const rows = stats.map(({ route, firstLoadUncompressedJsBytes, firstLoadChunkPaths }) => {
    const gzip = firstLoadChunkPaths.reduce((sum, p) => sum + gzipSync(readFileSync(p)).length, 0);
    return `${route.padEnd(24)}${kb(firstLoadUncompressedJsBytes).padStart(14)}${kb(gzip).padStart(14)}`;
  });
  return ["", "First Load JS per route", `${"Route".padEnd(24)}${"Uncompressed".padStart(14)}${"Gzip".padStart(14)}`, ...rows, ""].join("\n");
}

const child = spawn("next", ["build"], { shell: true, env: process.env });
for (const stream of [child.stdout, child.stderr]) {
  stream.on("data", (chunk) => {
    process.stdout.write(chunk);
    out.write(stripAnsi(chunk.toString()));
  });
}
child.on("close", (code) => {
  if (code === 0) {
    const table = firstLoadTable();
    process.stdout.write(table);
    out.write(table);
  }
  out.end(() => {
    console.log(`\nBuild output saved to ${outFile}`);
    process.exit(code ?? 1);
  });
});
