// Copies the output of `next experimental-analyze -o` out of .next (which every build wipes)
// into perf-reports/bundle-analysis-<timestamp>/ so it survives later builds.
import { cpSync, existsSync } from "node:fs";

const pad = (n) => String(n).padStart(2, "0");
const d = new Date();
const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const src = ".next/diagnostics/analyze";
const dest = `perf-reports/bundle-analysis-${stamp}`;

if (!existsSync(src)) {
  console.error(`No analyzer output at ${src}. Run \`next experimental-analyze -o\` first.`);
  process.exit(1);
}
cpSync(src, dest, { recursive: true });
console.log(`Bundle analysis saved to ${dest}`);
