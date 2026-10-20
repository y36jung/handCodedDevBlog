# Performance measurement

This guide covers how to measure the blog's frontend (`apps/web`) before and after optimizing it.
Run every command from the repo root. The root `perf:*` scripts forward to `apps/web`.
**Every measurement produces exactly one file:** a Markdown report in `apps/web/perf-reports/`, which git ignores. Nothing else is saved.

## The tools

Each command writes a report with only its own section. `perf:all` writes one report with every section.

| Script | What it measures | Section in the report |
| --- | --- | --- |
| `pnpm perf:doctor` | **React Doctor** static code analysis. It scans the React source for problems with state and effects, performance anti-patterns (e.g. array lookups inside loops), accessibility, bugs and security, and gives a **0–100 health score**. It doesn't need a build. | Score, issues per category, and every finding with its file and line |
| `pnpm perf:build-size` | Runs a production `next build` and measures **First Load JS** for each route: how much JavaScript a visitor downloads on their first visit to that route. | Gzip and uncompressed size per route, plus whether each route is static or dynamic |
| `pnpm perf:bundle:save` | Runs the Next.js **Bundle Analyzer** (Turbopack's built-in `next experimental-analyze`) and adds up each route's browser JavaScript by npm package, which helps you spot large dependencies. | The 8 largest packages per route, with size and share |
| `pnpm perf:lighthouse` | **Lighthouse CI**. Builds and starts the production server on port 3100, then audits each page 5 times (desktop preset). | Median scores and metrics (FCP, LCP, TBT, CLS, Speed Index, TTFB) for each page, plus its top failing performance audits |
| `pnpm perf:all` | All four of the above, in that order. If one tool fails, the others still run and the report shows the failure. | All sections |
| `pnpm perf:bundle` | Opens the Bundle Analyzer's interactive view at http://localhost:4000 for exploring the module tree in detail. | Not saved, view only |
| `pnpm perf:compare <before> <after>` | Prints a before/after table of every metric from two reports in the terminal. | Not saved, terminal only |

**Naming a report.** Add a label to any command to name the file, e.g. `pnpm perf:all baseline` writes `perf-reports/baseline.md`. Without a label, the file is `perf-reports/perf-<timestamp>.md`. A label can only contain letters, digits, `.`, `_` and `-`. Running the same label again overwrites that report.

**About React Doctor.**
- It measures code, not speed. A higher score means fewer known problem patterns, which is a useful signal but not a measured speedup. Confirm real gains with Lighthouse, Web Vitals and the profilers.
- The score is the number to compare. Finding counts per category are also good before/after numbers.
- The score comes from React Doctor's hosted score API. Each run sends a scan summary and anonymous usage data, and prints a share link. For a fully local run, add `"--no-score"` to the React Doctor arguments in `apps/web/scripts/perf.mjs`. The report then shows the score as n/a, but the findings are the same.
- `apps/web/doctor.config.json` keeps `.next/` out of the scan. It contains built JavaScript, which would produce false findings.
- The version is pinned (`react-doctor` 0.9.18) because new versions add rules, which would change the score for reasons unrelated to your code.

Lighthouse audits these pages, as set in `apps/web/lighthouserc.json`:
- `/`: the home page with the full post list
- `/?tags=embeddings`: the home page with a filter applied
- `/posts/261f40df-…`: a post detail page

**Reading Lighthouse results.** Each value in the report is the **median** of the 5 runs for that page, taken separately for each metric. The full Lighthouse HTML reports aren't kept. Lighthouse CI needs a scratch folder (`apps/web/.lighthouseci/`) while it runs, and it's deleted as soon as the report is written. To see the full visual report for a page, run Lighthouse from Chrome DevTools (the **Lighthouse** tab) against the production server.

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

Every `perf:*` command saves one Markdown report in **`apps/web/perf-reports/`**: `<label>.md` if you gave a label, otherwise `perf-<timestamp>.md`. Git ignores this folder, so it only exists on your machine.

Each report starts with the date, the branch and commit that was measured (and whether there were uncommitted changes), and which tools ran. Then comes one section per tool. Open it in your editor's Markdown preview to see the tables.

At the bottom of each report is a hidden `<!-- perf-data … -->` comment holding the raw numbers. `perf:compare` reads it, so don't edit or remove it.

These aren't saved anywhere:
- **Web Vitals:** the `[Web Vitals] …` lines in the browser console. Copy the numbers down yourself.
- **React Scan, the React DevTools Profiler and the Chrome Performance panel:** shown live in the browser. Chrome and React DevTools can export a profile to a file if you want to keep one.

## Measuring the baseline

The git tag `perf-baseline` marks the original app code with this tooling already added. To measure it:

```sh
git stash                  # only if you have uncommitted work
git checkout perf-baseline
pnpm install
pnpm perf:all baseline     # writes apps/web/perf-reports/baseline.md
git checkout <your-branch> # e.g. main
pnpm install
git stash pop              # only if you stashed
```

`perf-reports/` is git-ignored, so `baseline.md` stays put when you switch branches. After optimizing, measure again with a new label and compare:

```sh
pnpm perf:all after-memo-fix              # a label for each attempt
pnpm perf:compare baseline after-memo-fix
```

`perf:compare` prints every metric with its before value, after value and change. Times and sizes use the improvement % formula below, and scores and issue counts show the difference in points. Each line also says "better" or "worse". It accepts a label (`baseline`), a file name (`baseline.md`) or a path to a report.

## Rules for fair comparisons

- **Production build only.** Dev-mode numbers are much slower and unreliable. All the `perf:*` scripts already use a production build.
- **Same machine, same conditions.** Plug in your laptop, close other apps (especially browsers, IDE indexing and video calls), and don't use the machine while it measures.
- **Use medians, not single runs.** Lighthouse runs each page 5 times for this reason, and the report already shows medians.
- **Change one thing at a time** where you can, so you know which change caused the difference.
- **Same Lighthouse preset** (desktop or mobile) for the before and after runs.
- **Same React Doctor version** for the before and after runs. Don't upgrade `react-doctor` between them.

## Calculating improvement

```
improvement % = (before − after) ÷ before × 100
```

For example, if LCP went from 1200 ms to 900 ms: (1200 − 900) ÷ 1200 × 100 = **25% faster**.
This works for "lower is better" metrics (LCP, TBT, CLS, JS size). For the Lighthouse score, where higher is better, report the point difference instead (for example, 78 → 92 is +14 points).

## Targets

What "excellent" looks like for each metric in the report. Lighthouse thresholds come from Lighthouse 12's **desktop** scoring (the preset used here). "Good" is roughly where a metric scores 90+ out of 100. Mobile thresholds are shown where they differ.

### React Doctor

| Metric | Excellent | Acceptable |
| --- | --- | --- |
| Health score | 90–100 | 75–89 |
| Errors | 0 | 0 (any error is a likely bug) |
| Warnings / issues per category | 0 | A few low-priority ones you've decided not to fix |

### Build size (First Load JS, per route)

| Metric | Excellent | Acceptable |
| --- | --- | --- |
| Gzip | Within ~20–30 kB of the framework floor | Under ~170 kB |
| Uncompressed | Under ~450 kB | Under ~600 kB |
| Route type | Static wherever the content allows it | Dynamic only when it has to be |

The **framework floor** is what Next.js and React cost on an empty page. In this app it's the `/_not-found` route, about 143 kB gzip. Everything above it is your own code and libraries. For a blog, excellent means content pages sit close to the floor, ideally under about 170 kB.

### Bundle composition (client JS per route)

| Metric | Excellent |
| --- | --- |
| Route total | Only slightly above the `/_not-found` total |
| `next` | Fixed (~204 kB). You can't shrink it; it's the floor. |
| UI library (`@mantine/*`, `@floating-ui/*`) | Under ~30 kB on a page, and only the components that page uses |
| Single feature library (e.g. `@mantine/dates`, `dayjs`) | Loaded only on pages or interactions that need it |
| `(app code)` | Under ~20 kB per route for a blog |

### Lighthouse category scores (per page)

| Metric | Excellent | Good |
| --- | --- | --- |
| Performance | 100 | 90+ |
| Accessibility | 100 | 90+ |
| Best Practices | 100 | 90+ |
| SEO | 100 | 90+ |

### Lighthouse timings (median)

| Metric | Excellent | Good (desktop) | Good (mobile preset) |
| --- | --- | --- | --- |
| First Contentful Paint (FCP) | under ~0.5 s | ≤ 0.9 s | ≤ 1.8 s |
| Largest Contentful Paint (LCP) | under ~0.8 s | ≤ 1.2 s | ≤ 2.5 s |
| Total Blocking Time (TBT) | 0–50 ms | ≤ 150 ms | ≤ 200 ms |
| Cumulative Layout Shift (CLS) | 0 (nothing moves) | ≤ 0.1 | ≤ 0.1 |
| Speed Index | under ~0.8 s | ≤ 1.3 s | ≤ 3.4 s |
| Server response time (TTFB) | under ~100 ms | ≤ 600 ms (the Lighthouse audit's pass line) | ≤ 600 ms |

Google's real-user Core Web Vitals use the same "good" lines regardless of device: LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms. INP is what the Web Vitals console logger reports after you interact with the page.

**Note:** desktop runs on localhost are very forgiving: there's no network delay, a fast CPU, and TTFB of a few milliseconds. Timing metrics can look excellent while the JavaScript size is only average. To make differences in the timing metrics show up, switch to the mobile preset (see "Switching Lighthouse to mobile") and use it for both the baseline and later runs.
