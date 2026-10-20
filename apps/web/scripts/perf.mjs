// Runs perf tools and writes their results to one Markdown report, the only file a run produces.
//   node scripts/perf.mjs <tool...> [label]    tools: doctor, build-size, bundle, lighthouse
//     -> perf-reports/<label>.md, or perf-reports/perf-<timestamp>.md without a label
//   node scripts/perf.mjs compare <before> <after>
//     -> prints a before/after table to the terminal, using the data embedded in each report
import { execSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const REPORTS = "perf-reports";
const LHCI_DIR = ".lighthouseci";
const DATA_RE = /<!-- perf-data (.*) -->/;

const pad = (n) => String(n).padStart(2, "0");
const stamp = (d = new Date()) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const kB = (bytes) => bytes / 1024;
const median = (values) => {
  const sorted = values.filter((v) => typeof v === "number").sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : undefined;
};

// Runs a command, streaming its stdout to the terminal unless quiet, and resolves with the captured stdout.
function run(cmd, args, { quiet = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { shell: true, env: process.env, stdio: ["ignore", "pipe", "inherit"] });
    let stdout = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (!quiet) process.stdout.write(chunk);
    });
    child.on("close", (code) => (code === 0 ? resolve(stripAnsi(stdout)) : reject(new Error(`\`${cmd} ${args.join(" ")}\` exited with code ${code}`))));
  });
}

function format(value, unit) {
  if (value === undefined) return "n/a";
  if (unit === "ms") return `${Math.round(value)} ms`;
  if (unit === "kB") return `${value.toFixed(1)} kB`;
  if (unit === "cls") return value.toFixed(3);
  return String(Math.round(value));
}

const table = (header, rows) => [`| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.join(" | ")} |`)];

// Each tool returns { markdown, metrics }. Metrics are keyed rows of { label, value, unit, better }
// that get embedded in the report so `compare` can read them back.

async function doctor() {
  // --blocking none: findings never fail the run; --no-supply-chain: dependency security isn't a perf measurement
  const report = JSON.parse(await run("react-doctor", [".", "-y", "--no-supply-chain", "--blocking", "none", "--json"], { quiet: true }));
  const { score, label } = report.projects[0]?.score ?? {};
  const { errorCount, warningCount, totalDiagnosticCount } = report.summary;
  const byCategory = {};
  for (const d of report.diagnostics) byCategory[d.category] = (byCategory[d.category] ?? 0) + 1;

  const metrics = {
    "doctor.score": { label: "Health score", value: score ?? undefined, unit: "score", better: "higher" },
    "doctor.issues": { label: "Total issues", value: totalDiagnosticCount, unit: "count", better: "lower" },
  };
  for (const [category, count] of Object.entries(byCategory)) {
    metrics[`doctor.category.${category}`] = { label: `${category} issues`, value: count, unit: "count", better: "lower" };
  }

  const lines = [
    "## React Doctor",
    "",
    `**Score: ${score ?? "n/a"} / 100${label ? ` (${label})` : ""}** · ${totalDiagnosticCount} issues (${errorCount} errors, ${warningCount} warnings) · react-doctor ${report.version}`,
    "",
  ];
  if (report.diagnostics.length) {
    lines.push(...table(["Category", "Issues"], Object.entries(byCategory)), "");
    lines.push(
      ...table(
        ["Severity", "Category", "Issue", "Location"],
        report.diagnostics.map((d) => [d.severity, d.category, `${d.title} (\`${d.rule}\`)`, `\`${d.filePath}:${d.line}\``]),
      ),
      "",
    );
  }
  console.log(`React Doctor score: ${score ?? "n/a"} / 100, ${totalDiagnosticCount} issues`);
  return { markdown: lines.join("\n"), metrics };
}

async function buildSize() {
  const output = await run("next", ["build"]);
  // Next 16 no longer prints First Load JS, so it comes from the stats file the build writes
  const stats = readJson(".next/diagnostics/route-bundle-stats.json");
  const legend = { "○": "Static", "●": "SSG", "◐": "Partial prerender", ƒ: "Dynamic" };
  const routeTypes = Object.fromEntries([...output.matchAll(/^[┌├└]\s+([○●◐ƒ])\s+(\S+)/gm)].map(([, sym, route]) => [route, legend[sym]]));

  const metrics = {};
  const rows = stats.map(({ route, firstLoadUncompressedJsBytes, firstLoadChunkPaths }) => {
    const gzip = kB(firstLoadChunkPaths.reduce((sum, p) => sum + gzipSync(readFileSync(p)).length, 0));
    const raw = kB(firstLoadUncompressedJsBytes);
    metrics[`build.${route}.gzip`] = { label: `First Load JS ${route} (gzip)`, value: gzip, unit: "kB", better: "lower" };
    metrics[`build.${route}.raw`] = { label: `First Load JS ${route} (uncompressed)`, value: raw, unit: "kB", better: "lower" };
    return [`\`${route}\``, routeTypes[route] ?? "", format(gzip, "kB"), format(raw, "kB")];
  });

  const lines = [
    "## Build size (First Load JS)",
    "",
    "JavaScript a visitor downloads on their first visit to each route, from a production `next build`.",
    "",
    ...table(["Route", "Type", "Gzip", "Uncompressed"], rows),
    "",
  ];
  return { markdown: lines.join("\n"), metrics };
}

async function bundle() {
  const TOP = 8;
  await run("next", ["experimental-analyze", "-o"]);
  const graph = await run("next", ["experimental-analyze", "export"], { quiet: true });

  // Sum the compressed size of every module in the browser's JS chunks, grouped by npm package
  const byRoute = {};
  const seen = new Set();
  for (const line of graph.split("\n")) {
    if (!line.startsWith('{"type":"part"')) continue;
    const part = JSON.parse(line);
    if (!part.filename.startsWith("[client-fs]/") || !part.filename.endsWith(".js")) continue;
    const key = `${part.route}|${part.filename}|${part.source_path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const pkg = part.source_path.match(/.*node_modules\/((?:@[^/]+\/)?[^/]+)\//)?.[1] ?? (part.source_path.includes("/apps/web/") ? "(app code)" : "(other)");
    const packages = (byRoute[part.route] ??= {});
    packages[pkg] = (packages[pkg] ?? 0) + part.compressed_size;
  }

  const metrics = {};
  const lines = [
    "## Bundle composition",
    "",
    `Browser JavaScript per route, grouped by package (top ${TOP}, compressed). Sizes are per-module estimates, so totals differ slightly from First Load JS. For the interactive view run \`pnpm perf:bundle\`.`,
    "",
  ];
  for (const [route, packages] of Object.entries(byRoute).sort(([a], [b]) => a.localeCompare(b))) {
    const total = Object.values(packages).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(packages).sort(([, a], [, b]) => b - a);
    metrics[`bundle.${route}.total`] = { label: `Client JS ${route} (total)`, value: kB(total), unit: "kB", better: "lower" };
    const rows = sorted.slice(0, TOP).map(([pkg, size]) => {
      metrics[`bundle.${route}.${pkg}`] = { label: `Client JS ${route}: ${pkg}`, value: kB(size), unit: "kB", better: "lower" };
      return [`\`${pkg}\``, format(kB(size), "kB"), `${((size / total) * 100).toFixed(1)}%`];
    });
    const rest = sorted.slice(TOP);
    if (rest.length) rows.push([`${rest.length} other packages`, format(kB(rest.reduce((a, [, s]) => a + s, 0)), "kB"), ""]);
    lines.push(`### \`${route}\`: ${format(kB(total), "kB")}`, "", ...table(["Package", "Size", "Share"], rows), "");
  }
  return { markdown: lines.join("\n"), metrics };
}

async function lighthouse() {
  const METRICS = [
    ["first-contentful-paint", "First Contentful Paint (FCP)", "ms"],
    ["largest-contentful-paint", "Largest Contentful Paint (LCP)", "ms"],
    ["total-blocking-time", "Total Blocking Time (TBT)", "ms"],
    ["cumulative-layout-shift", "Cumulative Layout Shift (CLS)", "cls"],
    ["speed-index", "Speed Index", "ms"],
    ["server-response-time", "Server response time (TTFB)", "ms"],
  ];
  const CATEGORIES = [
    ["performance", "Performance score"],
    ["accessibility", "Accessibility score"],
    ["best-practices", "Best Practices score"],
    ["seo", "SEO score"],
  ];

  // lhci collect (settings in lighthouserc.json) needs a scratch folder; it's deleted once the results are read
  rmSync(LHCI_DIR, { recursive: true, force: true });
  let runsByUrl;
  try {
    await run("lhci", ["collect"]);
    runsByUrl = {};
    for (const file of readdirSync(LHCI_DIR).filter((f) => /^lhr-.*\.json$/.test(f))) {
      const lhr = readJson(path.join(LHCI_DIR, file));
      (runsByUrl[lhr.requestedUrl] ??= []).push(lhr);
    }
  } finally {
    rmSync(LHCI_DIR, { recursive: true, force: true });
  }

  const urls = Object.keys(runsByUrl);
  const paths = urls.map((u) => new URL(u).pathname + new URL(u).search);
  const first = runsByUrl[urls[0]][0];
  const metrics = {};
  const rows = [];
  for (const [id, label] of CATEGORIES) {
    rows.push([label, ...urls.map((u, i) => {
      const value = median(runsByUrl[u].map((lhr) => lhr.categories[id]?.score)) * 100;
      metrics[`lh.${paths[i]}.${id}`] = { label: `${label} ${paths[i]}`, value, unit: "score", better: "higher" };
      return format(value, "score");
    })]);
  }
  for (const [id, label, unit] of METRICS) {
    rows.push([label, ...urls.map((u, i) => {
      const value = median(runsByUrl[u].map((lhr) => lhr.audits[id]?.numericValue));
      metrics[`lh.${paths[i]}.${id}`] = { label: `${label} ${paths[i]}`, value, unit, better: "lower" };
      return format(value, unit);
    })]);
  }

  const lines = [
    "## Lighthouse",
    "",
    `Median of ${runsByUrl[urls[0]].length} runs per page, ${first.configSettings.formFactor} preset, Lighthouse ${first.lighthouseVersion}.`,
    "",
    ...table(["Metric", ...paths.map((p) => `\`${p}\``)], rows),
    "",
    "### Top issues to look at",
    "",
    "Failing performance audits from the median run of each page (by Performance score).",
    "",
  ];
  urls.forEach((u, i) => {
    const runs = [...runsByUrl[u]].sort((a, b) => a.categories.performance.score - b.categories.performance.score);
    const lhr = runs[Math.floor(runs.length / 2)];
    const failing = lhr.categories.performance.auditRefs
      .filter((ref) => ref.weight === 0)
      .map((ref) => lhr.audits[ref.id])
      .filter((a) => a && typeof a.score === "number" && a.score < 0.9 && !["informative", "notApplicable", "manual"].includes(a.scoreDisplayMode))
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);
    lines.push(`**\`${paths[i]}\`**`, "");
    lines.push(...(failing.length ? failing.map((a) => `- ${a.title}${a.displayValue ? `: ${a.displayValue}` : ""}`) : ["- None"]), "");
  });
  return { markdown: lines.join("\n"), metrics };
}

const TOOLS = {
  doctor: ["React Doctor", doctor],
  "build-size": ["Build size", buildSize],
  bundle: ["Bundle composition", bundle],
  lighthouse: ["Lighthouse", lighthouse],
};

function gitInfo() {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
    const sha = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
    const dirty = execSync("git status --porcelain", { encoding: "utf8" }).trim() ? " (with uncommitted changes)" : "";
    return `\`${branch}\` @ \`${sha}\`${dirty}`;
  } catch {
    return "unknown";
  }
}

async function measure(tools, label) {
  const outFile = path.join(REPORTS, `${label ?? `perf-${stamp()}`}.md`);
  const sections = [];
  const metrics = {};
  let failed = false;
  for (const tool of tools) {
    const [title, collect] = TOOLS[tool];
    console.log(`\n▶ ${title}\n`);
    try {
      const result = await collect();
      sections.push(result.markdown);
      Object.assign(metrics, result.metrics);
    } catch (error) {
      failed = true;
      console.error(error.message);
      sections.push(`## ${title}\n\nFailed: ${error.message}\n`);
    }
  }
  const header = [
    `# Performance report${label ? `: ${label}` : ""}`,
    "",
    `- **Date:** ${new Date().toLocaleString()}`,
    `- **Code:** ${gitInfo()}`,
    `- **Tools:** ${tools.map((t) => TOOLS[t][0]).join(", ")}`,
    "",
  ];
  mkdirSync(REPORTS, { recursive: true });
  writeFileSync(outFile, [...header, ...sections, `<!-- perf-data ${JSON.stringify(metrics)} -->`, ""].join("\n"));
  console.log(`\nReport written to ${outFile}`);
  process.exit(failed ? 1 : 0);
}

function loadMetrics(name) {
  const file = [name, path.join(REPORTS, name), path.join(REPORTS, `${name}.md`)].find((f) => f.endsWith(".md") && existsSync(f));
  if (!file) throw new Error(`Report not found: ${name} (looked in ${REPORTS}/)`);
  const data = readFileSync(file, "utf8").match(DATA_RE);
  if (!data) throw new Error(`${file} has no perf-data block`);
  return { file, metrics: JSON.parse(data[1]) };
}

// improvement % = (before − after) ÷ before × 100 for times and sizes; point difference for scores
function change(before, after, { unit, better }) {
  if (before === undefined || after === undefined) return "n/a";
  if (Math.abs(after - before) < 1e-9) return "no change";
  const verdict = (better === "lower" ? after < before : after > before) ? "better" : "worse";
  if (unit === "score" || unit === "count") return `${after > before ? "+" : ""}${Math.round(after - before)} (${verdict})`;
  if (before === 0) return `+${format(after, unit)} (${verdict})`;
  return `${Math.abs(((before - after) / before) * 100).toFixed(1)}% ${verdict}`;
}

function compare(beforeName, afterName) {
  if (!beforeName || !afterName) {
    console.error("Usage: pnpm perf:compare <before> <after>   (e.g. pnpm perf:compare baseline after)");
    process.exit(1);
  }
  const before = loadMetrics(beforeName);
  const after = loadMetrics(afterName);
  // A category with no issues is absent from the report, so it counts as 0 when React Doctor ran
  const valueOf = (m, key) => m[key]?.value ?? (key.startsWith("doctor.category.") && "doctor.issues" in m ? 0 : undefined);
  const SECTIONS = { doctor: "React Doctor", build: "Build size (First Load JS)", bundle: "Bundle composition", lh: "Lighthouse" };

  console.log(`\nBefore: ${before.file}\nAfter:  ${after.file}`);
  for (const [prefix, title] of Object.entries(SECTIONS)) {
    const inSection = (m) => Object.keys(m).filter((k) => k.startsWith(`${prefix}.`));
    const keys = [...new Set([...inSection(before.metrics), ...inSection(after.metrics)])];
    if (!keys.length) continue;
    if (!inSection(before.metrics).length || !inSection(after.metrics).length) {
      console.log(`\n${title}: skipped, only in the ${inSection(before.metrics).length ? "before" : "after"} report`);
      continue;
    }
    const rows = keys.map((key) => {
      const meta = before.metrics[key] ?? after.metrics[key];
      const b = valueOf(before.metrics, key);
      const a = valueOf(after.metrics, key);
      return [meta.label, format(b, meta.unit), format(a, meta.unit), change(b, a, meta)];
    });
    const header = ["Metric", "Before", "After", "Change"];
    const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
    const line = (cells) => cells.map((c, i) => c.padEnd(widths[i])).join("  ");
    console.log(`\n${title}\n${line(header)}\n${widths.map((w) => "─".repeat(w)).join("  ")}`);
    rows.forEach((r) => console.log(line(r)));
  }
  console.log("");
}

const args = process.argv.slice(2);
if (args[0] === "compare") {
  try {
    compare(args[1], args[2]);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
} else {
  const tools = Object.keys(TOOLS).filter((t) => args.includes(t));
  const labels = args.filter((a) => !TOOLS[a]);
  if (!tools.length || labels.length > 1 || (labels[0] && !/^[\w.-]+$/.test(labels[0]))) {
    console.error(`Usage: node scripts/perf.mjs <${Object.keys(TOOLS).join("|")}...> [label]   (label: letters, digits, . _ -)`);
    process.exit(1);
  }
  await measure(tools, labels[0]);
}
