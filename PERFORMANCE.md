# Performance measurement

This guide covers how to measure the blog's frontend (`apps/web`) before and after optimizing it.
Run every command from the repo root. The root `perf:*` scripts forward to `apps/web`.
All reports are written to `apps/web/perf-reports/`, which git ignores.

## The tools

| Script | What it measures | Output |
| --- | --- | --- |
| `pnpm perf:doctor` | **React Doctor** static code analysis. It scans the React source for problems with state and effects, performance anti-patterns (e.g. array lookups inside loops), accessibility, bugs and security, and gives a **0–100 health score**. It doesn't need a build. | `perf-reports/react-doctor-<timestamp>.txt` (score + findings) and `perf-reports/react-doctor-<timestamp>/` (`diagnostics.json` + one file per rule) |
| `pnpm perf:build-size` | Runs a production `next build` and saves the terminal output, then appends a **First Load JS** table for each route (uncompressed and gzip). This is how much JavaScript a visitor downloads on first visit to that route. | `perf-reports/build-output-<timestamp>.txt` |
| `pnpm perf:bundle` | Opens the Next.js **Bundle Analyzer** (Turbopack's built-in `next experimental-analyze`) at http://localhost:4000. It shows which modules make up each route's JavaScript, which helps you spot large dependencies. | Interactive only |
| `pnpm perf:bundle:save` | Same analysis, written to disk without the UI. It's copied out of `.next` because the next build would delete it. | `perf-reports/bundle-analysis-<timestamp>/` |
| `pnpm perf:lighthouse` | **Lighthouse CI**. Builds and starts the production server on port 3100, then audits each page 5 times (desktop preset). It reports the Performance score plus LCP, CLS, TBT, FCP and Speed Index. | `perf-reports/lighthouse/` (HTML + JSON per run, and `manifest.json`) |
| `pnpm perf:all` | Runs doctor, then build-size, then bundle:save, then lighthouse. | All of the above |

**About React Doctor.**
- It measures code, not speed. A higher score means fewer known problem patterns, which is a useful signal but not a measured speedup. Confirm real gains with Lighthouse, Web Vitals and the profilers.
- The score is the number to compare. Finding counts per category are also good before/after numbers.
- The score comes from React Doctor's hosted score API. Each run sends a scan summary and anonymous usage data, and prints a share link. For a fully local run, add `--no-score` to the arguments in `apps/web/scripts/save-react-doctor.mjs`. You won't get a score, but the findings are the same.
- `apps/web/doctor.config.json` keeps `.next/` and `perf-reports/` out of the scan. They contain built JavaScript, which would produce false findings.
- The version is pinned (`react-doctor` 0.9.18) because new versions add rules, which would change the score for reasons unrelated to your code.

Lighthouse audits these pages, as set in `apps/web/lighthouserc.json`:
- `/`: the home page with the full post list
- `/?tags=embeddings`: the home page with a filter applied
- `/posts/261f40df-…`: a post detail page

**Reading Lighthouse results.** `perf-reports/lighthouse/manifest.json` lists the 15 runs from the **latest** Lighthouse run. Each entry has the URL, the category scores and the paths to its report files. The entry with `"isRepresentativeRun": true` is the **median** run for that URL, so use that one. Open the matching `.report.html` in a browser for the full report; it's easier to read than the `.json`.

**Switching Lighthouse to mobile.** In `apps/web/lighthouserc.json`, delete the `"preset": "desktop"` line under `collect.settings`. Lighthouse's default is mobile emulation (a slower phone CPU and network). Mobile and desktop scores can't be compared with each other, so pick one and use it for both the before and after runs.

### Development-only and in-browser tools

- **React Scan** runs automatically when you use `pnpm dev:web`. It outlines components as they re-render, so you can see which ones re-render without need. It's left out of production builds entirely: `next.config.ts` points `react-scan` at a no-op stub when building for production. Its toolbar in the page corner lets you turn it on and off.
- **Web Vitals logging** (`apps/web/app/_components/web-vitals.tsx`) prints lines like `[Web Vitals] LCP: 812 ms (good)` to the browser console for LCP, INP, CLS, FCP and TTFB. It runs in both dev and production. Use the production numbers: run `pnpm build:web`, then `pnpm --filter web start`. INP only appears after you interact with the page (click or type), and some metrics are only reported when the tab is hidden or you navigate away.

### Browser profilers (nothing to install)

**React DevTools Profiler.** This shows which components rendered and how long each took.
1. Install the "React Developer Tools" browser extension if you don't have it.
2. Open the app, open DevTools, and go to the **Profiler** tab.
3. Click the record button (circle), do the interaction you care about (for example, typing in search or toggling a tag), then click stop.
4. Look through the commits. The flamegraph shows render time for each component, and "Why did this render?" can be turned on in the Profiler settings (gear icon).

The production build turns off profiling. Use `pnpm dev:web`, or build with `next build --profile` if you need production-like timings.

**Chrome DevTools Performance panel.** This shows everything the browser does: script, layout, paint and long tasks.
1. Run the production build (`pnpm build:web` then `pnpm --filter web start`) and open the page in Chrome. An Incognito window keeps extensions out of the way.
2. Open DevTools and go to the **Performance** tab.
3. To profile page load, click the reload-and-record button (circular arrow). To profile an interaction, click record, interact, then stop.
4. Look at the **Main** track for long tasks (red corners, over 50 ms). Look at the LCP and INP markers in the timings track, and use the "Bottom-Up" tab to see which functions took the most time.

## Where to find results

Everything is saved under **`apps/web/perf-reports/`**. Git ignores this folder, so it only exists on your machine.

| Tool | Location | What to open |
| --- | --- | --- |
| React Doctor | `react-doctor-<timestamp>.txt` and `react-doctor-<timestamp>/` | The `.txt` for the score and findings. `diagnostics.json` in the folder has every finding as data. |
| Build size | `build-output-<timestamp>.txt` | The First Load JS table at the bottom. |
| Bundle analyzer | `bundle-analysis-<timestamp>/` | `analyze.txt` and the other `.txt` files. For the visual explorer, run `pnpm perf:bundle` and open http://localhost:4000. |
| Lighthouse | `lighthouse/` | `manifest.json` first, then the `.report.html` of the median run for each URL. |
| Web Vitals | Not saved | The browser console (`[Web Vitals] …` lines). Copy the numbers down yourself. |
| React Scan, React DevTools Profiler, Chrome Performance panel | Not saved | Shown live in the browser. Chrome and React DevTools can export a profile to a file if you want to keep one. |

**Things to watch out for:**
- **The `lighthouse/` folder keeps every run.** New reports are added next to old ones, and the file names don't say which page each report is for. Only `manifest.json` tells you, and it only covers the latest run. Clear or move the folder between measurements (see below).
- **Lighthouse file names use UTC time**, so they can differ from your local clock. For example, `localhost--2026_10_20_15_38_43` is 16:38 in UTC+1. The other files use your local time.

## Measuring the baseline

The git tag `perf-baseline` marks the original app code with this tooling already added. To measure it:

```sh
git stash                  # only if you have uncommitted work
git checkout perf-baseline
pnpm install
rm -rf apps/web/perf-reports   # start from an empty reports folder
pnpm perf:all
mkdir -p apps/web/perf-reports/baseline
mv apps/web/perf-reports/{lighthouse,*-20*} apps/web/perf-reports/baseline/
git checkout <your-branch> # e.g. slight-format-fix
pnpm install
git stash pop              # only if you stashed
```

`perf-reports/` is git-ignored, so the baseline folder stays put when you switch branches. After optimizing, run `pnpm perf:all` on your branch and move those results the same way, into `apps/web/perf-reports/after/` (or a name for each attempt, like `after-memo-fix/`). Then compare the files in `baseline/` with those in `after/`.

## Rules for fair comparisons

- **Production build only.** Dev-mode numbers are much slower and unreliable. All the `perf:*` scripts already use a production build.
- **Same machine, same conditions.** Plug in your laptop, close other apps (especially browsers, IDE indexing and video calls), and don't use the machine while it measures.
- **Use medians, not single runs.** Lighthouse runs each page 5 times for this reason. Compare the representative (median) runs.
- **Change one thing at a time** where you can, so you know which change caused the difference.
- **Same Lighthouse preset** (desktop or mobile) for the before and after runs.
- **Same React Doctor version** for the before and after runs. Don't upgrade `react-doctor` between them.

## Calculating improvement

```
improvement % = (before − after) ÷ before × 100
```

For example, if LCP went from 1200 ms to 900 ms: (1200 − 900) ÷ 1200 × 100 = **25% faster**.
This works for "lower is better" metrics (LCP, TBT, CLS, JS size). For the Lighthouse score, where higher is better, report the point difference instead (for example, 78 → 92 is +14 points).
