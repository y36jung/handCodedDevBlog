"use client";

import { useReportWebVitals } from "next/web-vitals";

const TRACKED = new Set(["LCP", "INP", "CLS", "FCP", "TTFB"]);

// Logs Core Web Vitals to the browser console, e.g. "[Web Vitals] LCP: 812 ms (good)".
export function WebVitals() {
  useReportWebVitals((metric) => {
    if (!TRACKED.has(metric.name)) return;
    const value = metric.name === "CLS"
      ? metric.value.toFixed(3)
      : `${Math.round(metric.value)} ms`;
    console.log(`[Web Vitals] ${metric.name}: ${value} (${metric.rating})`);
  });

  return null;
}
