// Runs React Doctor (static code analysis + health score) and saves its terminal output to
// perf-reports/react-doctor-<timestamp>.txt while still printing it live. The full diagnostics
// dump (diagnostics.json + one file per rule) goes to perf-reports/react-doctor-<timestamp>/.
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";

const pad = (n) => String(n).padStart(2, "0");
const d = new Date();
const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const outFile = `perf-reports/react-doctor-${stamp}.txt`;
const dumpDir = `perf-reports/react-doctor-${stamp}`;

mkdirSync("perf-reports", { recursive: true });
const out = createWriteStream(outFile);
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");

// --blocking none: findings are reported, never fail the run (so perf:all keeps going)
// --no-supply-chain: dependency security checks aren't part of code-performance measurement
const args = [".", "-y", "--verbose", "--no-supply-chain", "--blocking", "none", "--output-dir", dumpDir];
const child = spawn("react-doctor", args, { shell: true, env: process.env });
for (const stream of [child.stdout, child.stderr]) {
  stream.on("data", (chunk) => {
    process.stdout.write(chunk);
    out.write(stripAnsi(chunk.toString()));
  });
}
child.on("close", (code) => {
  out.end(() => {
    console.log(`\nReact Doctor output saved to ${outFile} (full dump in ${dumpDir}/)`);
    process.exit(code ?? 1);
  });
});
